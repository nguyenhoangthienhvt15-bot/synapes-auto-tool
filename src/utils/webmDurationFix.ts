/**
 * Pure TypeScript WebM EBML Duration Header Patcher
 * Khắc phục triệt để lỗi "Duration: N/A" và không thể tua (seek) của MediaRecorder WebM
 */

function readVint(bytes: Uint8Array, offset: number): { value: number; length: number; isUnknown: boolean } | null {
  if (offset >= bytes.length) return null;
  const first = bytes[offset];
  if (first === 0) return null;

  let length = 1;
  let mask = 0x80;
  while (length <= 8 && (first & mask) === 0) {
    mask >>= 1;
    length++;
  }
  if (length > 8 || offset + length > bytes.length) return null;

  let value = first & (mask - 1);
  let allOnes = value === (mask - 1);
  for (let i = 1; i < length; i++) {
    const b = bytes[offset + i];
    if (b !== 0xff) allOnes = false;
    value = value * 256 + b;
  }

  return { value, length, isUnknown: allOnes };
}

function writeVintSize(size: number, length: number): Uint8Array {
  const out = new Uint8Array(length);
  let v = size;
  for (let i = length - 1; i >= 0; i--) {
    out[i] = v & 0xff;
    v = Math.floor(v / 256);
  }
  const marker = 1 << (8 - length);
  out[0] |= marker;
  return out;
}

export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  if (!blob || blob.size < 64 || !Number.isFinite(durationMs) || durationMs <= 0) {
    return blob;
  }

  try {
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);

    // Tìm EBML Info element ID: 0x15 0x49 0xA9 0x66 trong 4KB đầu tiên
    const searchLimit = Math.min(bytes.length - 16, 8192);
    let infoOffset = -1;
    for (let i = 0; i < searchLimit; i++) {
      if (
        bytes[i] === 0x15 &&
        bytes[i + 1] === 0x49 &&
        bytes[i + 2] === 0xa9 &&
        bytes[i + 3] === 0x66
      ) {
        infoOffset = i;
        break;
      }
    }
    if (infoOffset < 0) return blob;

    const infoSizeVint = readVint(bytes, infoOffset + 4);
    if (!infoSizeVint || infoSizeVint.isUnknown) return blob;

    const infoBodyStart = infoOffset + 4 + infoSizeVint.length;
    const infoBodyEnd = Math.min(bytes.length, infoBodyStart + infoSizeVint.value);

    // Quét các phần tử con trong Info để đọc TimecodeScale (mặc định 1_000_000 ns) và kiểm tra Duration (0x4489)
    let timecodeScale = 1000000;
    let existingDurValueOffset = -1;
    let existingDurLen = 0;
    let pos = infoBodyStart;

    while (pos + 3 < infoBodyEnd) {
      // Đọc Element ID (1-4 bytes)
      const idFirst = bytes[pos];
      let idLen = 1;
      let idMask = 0x80;
      while (idLen <= 4 && (idFirst & idMask) === 0) {
        idMask >>= 1;
        idLen++;
      }
      if (idLen > 4 || pos + idLen >= infoBodyEnd) break;

      let elemId = 0;
      for (let k = 0; k < idLen; k++) {
        elemId = elemId * 256 + bytes[pos + k];
      }

      const sz = readVint(bytes, pos + idLen);
      if (!sz || sz.isUnknown) break;

      const valStart = pos + idLen + sz.length;
      const valEnd = valStart + sz.value;
      if (valEnd > infoBodyEnd) break;

      if (elemId === 0x2ad7b1 && sz.value >= 1 && sz.value <= 8) {
        let ts = 0;
        for (let k = 0; k < sz.value; k++) ts = ts * 256 + bytes[valStart + k];
        if (ts > 0) timecodeScale = ts;
      } else if (elemId === 0x4489 && (sz.value === 4 || sz.value === 8)) {
        existingDurValueOffset = valStart;
        existingDurLen = sz.value;
      }

      pos = valEnd;
    }

    // Giá trị Duration tính theo đơn vị TimecodeScale (ms nếu TimecodeScale = 1_000_000)
    const durationInTicks = (durationMs * 1000000) / timecodeScale;

    // Nếu đã có phần tử Duration (0x4489), ghi đè trực tiếp
    if (existingDurValueOffset >= 0) {
      const patched = new Uint8Array(bytes);
      const dv = new DataView(patched.buffer, existingDurValueOffset, existingDurLen);
      if (existingDurLen === 8) dv.setFloat64(0, durationInTicks, false);
      else dv.setFloat32(0, durationInTicks, false);
      return new Blob([patched.buffer as ArrayBuffer], { type: blob.type || 'video/webm' });
    }

    // Chưa có Duration: chèn thẻ [0x44, 0x89, 0x88, float64(durationInTicks)] vào cuối Info body
    // Kiểm tra Segment header trước Info để cập nhật nếu Segment có kích thước xác định
    const durTag = new Uint8Array(11);
    durTag[0] = 0x44;
    durTag[1] = 0x89;
    durTag[2] = 0x88; // VINT size = 8 bytes
    new DataView(durTag.buffer).setFloat64(3, durationInTicks, false);

    const newInfoSize = infoSizeVint.value + durTag.length;
    const newInfoSizeLen = newInfoSize < 127 ? 1 : newInfoSize < 16383 ? 2 : newInfoSize < 2097151 ? 3 : 4;
    const oldInfoSizeLen = infoSizeVint.length;
    const sizeLen = Math.max(oldInfoSizeLen, newInfoSizeLen);
    if (sizeLen > 4 || newInfoSize >= Math.pow(2, 7 * sizeLen) - 1) {
      return blob;
    }

    const sizeVintBytes = writeVintSize(newInfoSize, sizeLen);
    const prefix = bytes.slice(0, infoOffset + 4);
    const infoBody = bytes.slice(infoBodyStart, infoBodyEnd);
    const suffix = bytes.slice(infoBodyEnd);

    // Nếu Segment (0x18538067) có kích thước xác định, cộng thêm phần delta bytes
    const delta = durTag.length + (sizeLen - oldInfoSizeLen);
    for (let i = 0; i < Math.min(prefix.length - 12, 256); i++) {
      if (
        prefix[i] === 0x18 &&
        prefix[i + 1] === 0x53 &&
        prefix[i + 2] === 0x80 &&
        prefix[i + 3] === 0x67
      ) {
        const segSize = readVint(prefix, i + 4);
        if (segSize && !segSize.isUnknown) {
          const updatedSeg = writeVintSize(segSize.value + delta, segSize.length);
          prefix.set(updatedSeg, i + 4);
        }
        break;
      }
    }

    const totalOutLen = prefix.length + sizeVintBytes.length + infoBody.length + durTag.length + suffix.length;
    const outArr = new Uint8Array(totalOutLen);
    let cursor = 0;
    for (const part of [prefix, sizeVintBytes, infoBody, durTag, suffix]) {
      outArr.set(part, cursor);
      cursor += part.length;
    }

    return new Blob([outArr.buffer as ArrayBuffer], {
      type: blob.type || 'video/webm',
    });
  } catch {
    return blob;
  }
}
