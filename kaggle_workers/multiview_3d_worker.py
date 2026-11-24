"""
SYNAPES Studio 2026 - Kaggle 2xT4 / Colab Multi-View (1-5 Views) 3D Worker.
Pipeline (Zero-Cost BYOK):
  1. Image QC & Laplacian Sharpness (>= 80.0 threshold)
  2. Background Removal via briaai/RMBG-2.0 (fallback ZhengPeng7/BiRefNet)
  3. Multi-View DINOv2 Cosine Consistency Gate (>= 0.72)
  4. Mesh + PBR Reconstruction: Hunyuan3D-2mv (2-3 views) / TRELLIS.2 (1, 4-5 views)
  5. UniRig Auto-Rigging + Polygon Decimation (<= 40,000 tris) -> .GLB
  6. Cloudflare R2 Upload (via user BYOK credentials) or local HTTP artifact serve

Chạy trên Kaggle GPU 2xT4:
  python multiview_3d_worker.py --serve --port 8190 --tunnel
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import os
import re
import struct
import subprocess
import sys
import tempfile
import threading
import time
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


WORKER_VERSION = "2.0.0"
SHARPNESS_MIN_THRESHOLD = 80.0
DINOV2_SIMILARITY_MIN_THRESHOLD = 0.72
MAX_POLY_COUNT_DEFAULT = 40000

STYLE_SHADER_PROFILES: Dict[str, Dict[str, Any]] = {
    "3d-cartoon": {"roughness": 0.42, "metallic": 0.05, "subsurface": 0.35, "outline": False},
    "3d-isometric": {"roughness": 0.50, "metallic": 0.12, "subsurface": 0.05, "outline": False},
    "3d-claymation": {"roughness": 0.82, "metallic": 0.0, "subsurface": 0.25, "outline": False},
    "low-poly-3d": {"roughness": 0.65, "metallic": 0.08, "subsurface": 0.0, "outline": False},
    "cel-shading-npr": {"roughness": 0.55, "metallic": 0.0, "subsurface": 0.0, "outline": True, "toonBands": 3},
    "stylized-3d": {"roughness": 0.48, "metallic": 0.15, "subsurface": 0.20, "outline": True, "rimLight": True},
}
VALID_3D_STYLES = set(STYLE_SHADER_PROFILES.keys())

VIEW_SLOTS = ("front", "back", "left", "right", "detail")
PUBLIC_TUNNEL_URL: Optional[str] = None
JOBS_STORE: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()


def _parse_glb_chunks(raw: bytes) -> Tuple[int, Dict[str, Any], bytes]:
    if len(raw) < 20 or raw[:4] != b"glTF":
        raise ValueError("Invalid GLB binary magic header (expected 'glTF').")
    _magic, version, total_len = struct.unpack_from("<4sII", raw, 0)
    if version != 2:
        raise ValueError(f"Unsupported glTF version: {version}")
    if total_len > len(raw):
        raise ValueError("Truncated GLB file length.")

    json_chunk_len, json_chunk_type = struct.unpack_from("<II", raw, 12)
    if json_chunk_type != 0x4E4F534A:
        raise ValueError("Missing glTF JSON Chunk 0.")
    json_start = 20
    json_end = json_start + json_chunk_len
    if json_end > len(raw):
        raise ValueError("Corrupted GLB JSON chunk length.")
    gltf_json = json.loads(raw[json_start:json_end].decode("utf-8").rstrip(" \t\r\n\x00"))
    rest_chunks = raw[json_end:total_len]
    return version, gltf_json, rest_chunks


def inspect_glb_metadata(glb_path: Path) -> Dict[str, Any]:
    """
    Phân tích tệp nhị phân glTF 2.0 (.glb) bằng thư viện chuẩn Python để đo chính xác
    số tam giác, số đỉnh, số khớp xương thật trong skins và PBR textures/extras.
    """
    raw = glb_path.read_bytes()
    version, gltf_json, _rest = _parse_glb_chunks(raw)

    accessors = gltf_json.get("accessors", []) or []
    meshes = gltf_json.get("meshes", []) or []
    skins = gltf_json.get("skins", []) or []
    textures = gltf_json.get("textures", []) or []
    materials = gltf_json.get("materials", []) or []

    triangle_count = 0
    vertex_count = 0
    for mesh in meshes:
        for prim in mesh.get("primitives", []) or []:
            mode = prim.get("mode", 4)  # 4 = TRIANGLES
            idx_acc_id = prim.get("indices")
            pos_acc_id = (prim.get("attributes") or {}).get("POSITION")
            if isinstance(pos_acc_id, int) and 0 <= pos_acc_id < len(accessors):
                vertex_count += int(accessors[pos_acc_id].get("count", 0))
            if mode == 4:
                if isinstance(idx_acc_id, int) and 0 <= idx_acc_id < len(accessors):
                    triangle_count += int(accessors[idx_acc_id].get("count", 0)) // 3
                elif isinstance(pos_acc_id, int) and 0 <= pos_acc_id < len(accessors):
                    triangle_count += int(accessors[pos_acc_id].get("count", 0)) // 3

    bone_count = 0
    for skin in skins:
        bone_count = max(bone_count, len(skin.get("joints", []) or []))

    asset_extras = (gltf_json.get("asset") or {}).get("extras") or {}
    return {
        "valid_glb": True,
        "gltf_version": version,
        "file_size_bytes": len(raw),
        "mesh_count": len(meshes),
        "triangle_count": triangle_count,
        "vertex_count": vertex_count,
        "skin_count": len(skins),
        "bone_count": bone_count,
        "has_skin": len(skins) > 0 and bone_count > 0,
        "texture_count": len(textures),
        "material_count": len(materials),
        "has_pbr_textures": len(textures) > 0 or len(materials) > 0,
        "style_profile": asset_extras.get("synapesStyleProfile"),
    }


def tag_glb_style_metadata(
    glb_path: Path,
    style_id: str,
    poly_count: int,
    rig_bones: int,
) -> Dict[str, Any]:
    """
    Gắn metadata hồ sơ chất liệu 3D chuẩn LABS trực tiếp vào chunk JSON của tệp nhị phân .GLB
    với đúng căn chỉnh 4-byte chuẩn đặc tả glTF 2.0.
    """
    raw = glb_path.read_bytes()
    version, gltf_json, rest_chunks = _parse_glb_chunks(raw)

    asset_block = gltf_json.setdefault("asset", {"version": "2.0"})
    extras = asset_block.setdefault("extras", {})
    extras["synapesStyleProfile"] = {
        "styleId": style_id,
        "shaderHints": STYLE_SHADER_PROFILES.get(style_id, STYLE_SHADER_PROFILES["3d-cartoon"]),
        "polyCount": int(poly_count),
        "rigBoneCount": int(rig_bones),
        "workerVersion": WORKER_VERSION,
    }

    json_bytes = json.dumps(gltf_json, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    pad_len = (4 - (len(json_bytes) % 4)) % 4
    padded_json = json_bytes + (b" " * pad_len)

    total_len = 12 + 8 + len(padded_json) + len(rest_chunks)
    header = struct.pack("<4sII", b"glTF", version, total_len)
    chunk0_hdr = struct.pack("<II", len(padded_json), 0x4E4F534A)
    glb_path.write_bytes(header + chunk0_hdr + padded_json + rest_chunks)
    return inspect_glb_metadata(glb_path)


def decode_data_url_image(data_url: str) -> Tuple[bytes, "Any"]:
    from PIL import Image

    if not isinstance(data_url, str) or ";base64," not in data_url:
        raise ValueError("Invalid image Data URL payload.")
    b64_part = data_url.split(";base64,", 1)[1].strip()
    raw_bytes = base64.b64decode(b64_part)
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    return raw_bytes, img


def compute_laplacian_sharpness(pil_img: "Any") -> float:
    import numpy as np

    gray = np.asarray(pil_img.convert("L"), dtype=np.float32)
    if gray.shape[0] < 3 or gray.shape[1] < 3:
        return 0.0
    lap = (
        gray[:-2, 1:-1]
        + gray[2:, 1:-1]
        + gray[1:-1, :-2]
        + gray[1:-1, 2:]
        - 4.0 * gray[1:-1, 1:-1]
    )
    return round(float(np.var(lap)), 2)


def remove_background_rmbg2(pil_img: "Any", hf_token: Optional[str] = None) -> "Any":
    """
    Tách nền bằng briaai/RMBG-2.0 (fallback ZhengPeng7/BiRefNet).
    Nếu ảnh đầu vào đã có kênh Alpha thực sự (có pixel trong suốt), giữ nguyên Alpha gốc.
    """
    import numpy as np
    from PIL import Image

    alpha_extrema = pil_img.getchannel("A").getextrema()
    if alpha_extrema[0] < 245 and alpha_extrema[1] > 10:
        return pil_img

    import torch
    from torchvision import transforms
    from transformers import AutoModelForImageSegmentation

    device = "cuda" if torch.cuda.is_available() else "cpu"
    last_err: Optional[Exception] = None
    for repo_id in ("briaai/RMBG-2.0", "ZhengPeng7/BiRefNet"):
        try:
            model = AutoModelForImageSegmentation.from_pretrained(
                repo_id,
                trust_remote_code=True,
                token=hf_token or None,
            ).to(device)
            model.eval()
            tf = transforms.Compose(
                [
                    transforms.Resize((1024, 1024)),
                    transforms.ToTensor(),
                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
                ]
            )
            rgb = pil_img.convert("RGB")
            inp = tf(rgb).unsqueeze(0).to(device)
            with torch.no_grad():
                preds = model(inp)[-1].sigmoid().cpu()[0].squeeze()
            mask = transforms.ToPILImage()(preds).resize(rgb.size, Image.Resampling.BILINEAR)
            out = rgb.copy()
            out.putalpha(mask)
            return out
        except Exception as exc:
            last_err = exc
    raise RuntimeError(f"Background removal failed on RMBG-2.0 & BiRefNet: {last_err}")


def check_dinov2_consistency(
    front_img: "Any",
    other_imgs: List[Tuple[str, "Any"]],
    hf_token: Optional[str] = None,
) -> Dict[str, float]:
    """
    Kiểm tra độ đồng nhất giữa Khe 1 (front) và các khe 2-5 bằng DINOv2 Cosine Similarity (>= 0.72).
    """
    if not other_imgs:
        return {}

    import torch
    import torch.nn.functional as F
    from transformers import AutoImageProcessor, AutoModel

    device = "cuda" if torch.cuda.is_available() else "cpu"
    processor = AutoImageProcessor.from_pretrained(
        "facebook/dinov2-small",
        token=hf_token or None,
    )
    model = AutoModel.from_pretrained(
        "facebook/dinov2-small",
        token=hf_token or None,
    ).to(device)
    model.eval()

    def encode_img(img: "Any") -> "torch.Tensor":
        inputs = processor(images=img.convert("RGB"), return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model(**inputs)
            cls_emb = outputs.last_hidden_state[:, 0, :]
            return F.normalize(cls_emb, p=2, dim=-1)

    front_emb = encode_img(front_img)
    scores: Dict[str, float] = {}
    for slot, img in other_imgs:
        emb = encode_img(img)
        sim = float(F.cosine_similarity(front_emb, emb).item())
        scores[slot] = round(sim, 4)
        if sim < DINOV2_SIMILARITY_MIN_THRESHOLD:
            raise ValueError(
                f"View '{slot}' DINOv2 similarity {sim:.3f} < {DINOV2_SIMILARITY_MIN_THRESHOLD}. "
                "Vui lòng tải ảnh cùng một nhân vật."
            )
    return scores


def select_reconstruction_backend(view_count: int) -> str:
    if view_count in (2, 3):
        return "Hunyuan3D-2mv"
    return "TRELLIS.2"


def reconstruct_mesh_multiview(
    cutout_views: List[Tuple[str, "Any"]],
    style_id: str,
    work_dir: Path,
    hf_token: Optional[str] = None,
) -> Tuple[Path, str]:
    """
    Điều phối sinh mesh thực thụ từ 1-5 ảnh qua Hunyuan3D-2mv (2-3 ảnh) hoặc TRELLIS.2 (1 / 4-5 ảnh).
    Yêu cầu môi trường GPU có cài gói hy3dgen hoặc trellis tương ứng.
    """
    view_count = len(cutout_views)
    engine = select_reconstruction_backend(view_count)
    raw_glb_path = work_dir / f"raw_{style_id}_{int(time.time())}.glb"

    if engine == "Hunyuan3D-2mv":
        try:
            from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline  # type: ignore
            from hy3dgen.texgen import Hunyuan3DPaintPipeline  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "Hunyuan3D-2mv package ('hy3dgen') is not installed on this worker host. "
                "Run setup inside Kaggle 2xT4 notebook before dispatching."
            ) from exc

        image_dict = {slot: img for slot, img in cutout_views}
        shape_pipe = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
            "tencent/Hunyuan3D-2mv",
            subfolder="hunyuan3d-dit-v2-mv",
            token=hf_token or None,
        )
        mesh = shape_pipe(image=image_dict, num_inference_steps=35, octree_resolution=320)[0]
        paint_pipe = Hunyuan3DPaintPipeline.from_pretrained("tencent/Hunyuan3D-2")
        mesh = paint_pipe(mesh, image=cutout_views[0][1])
        mesh.export(str(raw_glb_path))
        return raw_glb_path, "tencent/Hunyuan3D-2mv"

    try:
        from trellis.pipelines import TrellisImageTo3DPipeline  # type: ignore
        from trellis.utils import postprocessing_utils  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "TRELLIS.2 package ('trellis') is not installed on this worker host. "
            "Run setup inside Kaggle 2xT4 notebook before dispatching."
        ) from exc

    pipe = TrellisImageTo3DPipeline.from_pretrained("JeffreyXiang/TRELLIS-image-large")
    pipe.cuda()
    pil_list = [img for _, img in cutout_views]
    outputs = (
        pipe.run_multi_image(pil_list, seed=1)
        if len(pil_list) > 1
        else pipe.run(pil_list[0], seed=1)
    )
    glb = postprocessing_utils.to_glb(outputs["gaussian"][0], outputs["mesh"][0], simplify=0.92, texture_size=1024)
    glb.export(str(raw_glb_path))
    return raw_glb_path, "JeffreyXiang/TRELLIS"


def run_unirig_and_validate_glb(
    raw_glb_path: Path,
    auto_rig: bool = True,
    target_poly_count: int = MAX_POLY_COUNT_DEFAULT,
    style_id: str = "3d-cartoon",
) -> Tuple[Path, int, int, Dict[str, Any]]:
    """
    Kiểm tra đa giác, gắn xương tự động bằng UniRig (nếu có) và phân tích nhị phân .GLB thực tế.
    """
    import trimesh

    scene_or_mesh = trimesh.load(str(raw_glb_path))
    if isinstance(scene_or_mesh, trimesh.Scene):
        geom_meshes = [g for g in scene_or_mesh.geometry.values() if hasattr(g, "faces") and len(g.faces) > 0]
        faces_total = sum(len(g.faces) for g in geom_meshes)
        combined_mesh = trimesh.util.concatenate(geom_meshes) if geom_meshes else None
    else:
        combined_mesh = scene_or_mesh
        faces_total = len(scene_or_mesh.faces) if hasattr(scene_or_mesh, "faces") else 0

    if faces_total <= 0:
        raise RuntimeError("Generated GLB mesh has 0 triangles.")

    if faces_total > target_poly_count and combined_mesh is not None:
        simplified = combined_mesh.simplify_quadric_decimation(target_poly_count)
        simplified.export(str(raw_glb_path))
        faces_total = len(simplified.faces)

    rigged_path = raw_glb_path.with_name(raw_glb_path.stem + "_rigged.glb")
    if auto_rig:
        unirig_candidates = [
            os.environ.get("UNIRIG_INFER_SCRIPT", ""),
            "/kaggle/working/UniRig/launch/inference/generate_skeleton.py",
        ]
        unirig_script = next((c for c in unirig_candidates if c and Path(c).exists()), "")
        if unirig_script:
            subprocess.run(
                [sys.executable, unirig_script, "--input", str(raw_glb_path), "--output", str(rigged_path)],
                check=True,
            )
        else:
            rigged_path.write_bytes(raw_glb_path.read_bytes())
    else:
        rigged_path.write_bytes(raw_glb_path.read_bytes())

    meta = inspect_glb_metadata(rigged_path)
    actual_poly = int(meta["triangle_count"] or faces_total)
    actual_bones = int(meta["bone_count"] or 0)
    inspected = tag_glb_style_metadata(rigged_path, style_id, actual_poly, actual_bones)
    return rigged_path, actual_poly, actual_bones, inspected


def upload_glb_to_r2_if_configured(glb_path: Path, r2_config: Optional[Dict[str, str]]) -> Optional[str]:
    if not r2_config:
        return None
    endpoint_url = (r2_config.get("endpoint_url") or os.environ.get("R2_ENDPOINT_URL") or "").strip()
    bucket = (r2_config.get("bucket") or os.environ.get("R2_BUCKET") or "").strip()
    access_key = (r2_config.get("access_key_id") or os.environ.get("R2_ACCESS_KEY_ID") or "").strip()
    secret_key = (r2_config.get("secret_access_key") or os.environ.get("R2_SECRET_ACCESS_KEY") or "").strip()
    public_base = (r2_config.get("public_base_url") or os.environ.get("R2_PUBLIC_BASE_URL") or "").strip().rstrip("/")
    if not (endpoint_url and bucket and access_key and secret_key and public_base):
        return None

    import boto3

    client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )
    key = f"synapes-3d/{glb_path.name}"
    client.upload_file(str(glb_path), bucket, key, ExtraArgs={"ContentType": "model/gltf-binary"})
    return f"{public_base}/{key}"


def _set_job_state(job_id: str, **updates: Any) -> Dict[str, Any]:
    while len(JOBS_STORE) >= 120:
        JOBS_STORE.popitem(last=False)
    rec = JOBS_STORE.get(job_id, {"job_id": job_id, "created_at": time.time()})
    rec.update(updates)
    rec["updated_at"] = time.time()
    JOBS_STORE[job_id] = rec
    return rec


def _execute_reconstruct_pipeline(
    job_id: str,
    style_id: str,
    target_poly_count: int,
    auto_rig: bool,
    views: List[Any],
    hf_token: Optional[str],
    r2_config: Optional[Dict[str, str]],
    artifacts_dir: Path,
) -> Dict[str, Any]:
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="synapes3d_") as tmp:
        work_dir = Path(tmp)
        cutouts: List[Tuple[str, Any]] = []
        hashes: List[str] = []

        _set_job_state(job_id, status="processing", stage="qc_sharpness_and_rmbg2", progress_pct=20)
        for idx, v in enumerate(views):
            if v.slot not in VIEW_SLOTS:
                raise ValueError(f"Invalid slot '{v.slot}'")
            raw_bytes, pil_img = decode_data_url_image(v.data_url)
            hashes.append(hashlib.sha256(raw_bytes).hexdigest())
            sharp = compute_laplacian_sharpness(pil_img)
            if idx == 0 and v.slot != "front":
                raise ValueError("First slot must be 'front'")
            if sharp < SHARPNESS_MIN_THRESHOLD:
                print(f"[QC WARN] Slot {v.slot} sharpness={sharp} < {SHARPNESS_MIN_THRESHOLD}", flush=True)
            clean_img = remove_background_rmbg2(pil_img, hf_token)
            cutouts.append((v.slot, clean_img))

        _set_job_state(job_id, stage="dinov2_consistency", progress_pct=40)
        dino_scores = check_dinov2_consistency(cutouts[0][1], cutouts[1:], hf_token)

        _set_job_state(job_id, stage="mesh_reconstruct", progress_pct=62, dinov2_scores=dino_scores)
        raw_glb, engine_used = reconstruct_mesh_multiview(cutouts, style_id, work_dir, hf_token)

        _set_job_state(job_id, stage="decimate_and_unirig", progress_pct=85)
        final_glb, poly_count, rig_bones, glb_inspection = run_unirig_and_validate_glb(
            raw_glb, auto_rig, target_poly_count, style_id
        )

        safe_artifact_name = f"{re.sub(r'[^A-Za-z0-9_-]', '_', job_id)}_{style_id}.glb"
        stored_glb_path = artifacts_dir / safe_artifact_name
        stored_glb_path.write_bytes(final_glb.read_bytes())

        r2_url = upload_glb_to_r2_if_configured(stored_glb_path, r2_config)
        if r2_url:
            glb_url = r2_url
        elif PUBLIC_TUNNEL_URL:
            glb_url = f"{PUBLIC_TUNNEL_URL.rstrip('/')}/api/artifacts/{safe_artifact_name}"
        else:
            glb_url = f"/api/artifacts/{safe_artifact_name}"

        result = {
            "job_id": job_id,
            "status": "completed",
            "stage": "glb_ready",
            "progress_pct": 100,
            "engine": engine_used,
            "style_id": style_id,
            "source_view_count": len(cutouts),
            "source_image_hashes": hashes,
            "dinov2_scores": dino_scores,
            "poly_count": poly_count,
            "rig_bone_count": rig_bones,
            "glb_inspection": glb_inspection,
            "glb_url": glb_url,
        }
        _set_job_state(job_id, **result)
        return result


def build_fastapi_app() -> "Any":
    from fastapi import BackgroundTasks, FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse
    from pydantic import BaseModel, Field

    artifacts_dir = Path(os.environ.get("SYNAPES_ARTIFACTS_DIR", "./artifacts_3d")).resolve()
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    app = FastAPI(title="SYNAPES Multi-View 3D Worker (1-5 Views)", version=WORKER_VERSION)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class ViewItem(BaseModel):
        slot: str
        mime_type: str = "image/png"
        data_url: str

    class ReconstructPayload(BaseModel):
        job_id: str
        character_name: str = "Character3D"
        style_id: str = "3d-cartoon"
        target_poly_count: int = 36000
        auto_rig: bool = True
        async_mode: bool = False
        views: List[ViewItem] = Field(..., min_length=1, max_length=5)
        hf_token: Optional[str] = None
        r2_config: Optional[Dict[str, str]] = None

    @app.get("/health")
    def health() -> Dict[str, Any]:
        cuda_ok = False
        gpu_name = "CPU"
        vram_gb = 0.0
        try:
            import torch

            cuda_ok = bool(torch.cuda.is_available())
            if cuda_ok:
                gpu_name = torch.cuda.get_device_name(0)
                props = torch.cuda.get_device_properties(0)
                vram_gb = round(props.total_memory / (1024**3), 1)
        except Exception:
            pass
        return {
            "status": "ok",
            "version": WORKER_VERSION,
            "cuda_available": cuda_ok,
            "gpu": gpu_name,
            "vram_gb": vram_gb,
            "tunnel_url": PUBLIC_TUNNEL_URL,
            "supported_styles": sorted(VALID_3D_STYLES),
            "max_views": 5,
        }

    @app.get("/api/jobs/{job_id}")
    def get_job_status(job_id: str) -> Dict[str, Any]:
        rec = JOBS_STORE.get(job_id)
        if not rec:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
        return rec

    @app.get("/api/artifacts/{filename}")
    def download_glb_artifact(filename: str) -> "Any":
        if not re.match(r"^[A-Za-z0-9_.-]+\.glb$", filename):
            raise HTTPException(status_code=400, detail="Invalid artifact filename")
        target = (artifacts_dir / filename).resolve()
        if target.parent != artifacts_dir or not target.exists():
            raise HTTPException(status_code=404, detail="GLB artifact not found")
        return FileResponse(str(target), media_type="model/gltf-binary", filename=filename)

    def _run_bg_job(payload: ReconstructPayload) -> None:
        try:
            _execute_reconstruct_pipeline(
                job_id=payload.job_id,
                style_id=payload.style_id,
                target_poly_count=payload.target_poly_count,
                auto_rig=payload.auto_rig,
                views=payload.views,
                hf_token=payload.hf_token,
                r2_config=payload.r2_config,
                artifacts_dir=artifacts_dir,
            )
        except Exception as exc:
            _set_job_state(payload.job_id, status="failed", stage="error", error=str(exc))

    @app.post("/api/reconstruct-3d")
    def reconstruct_endpoint(payload: ReconstructPayload, background_tasks: BackgroundTasks) -> Dict[str, Any]:
        if payload.style_id not in VALID_3D_STYLES:
            raise HTTPException(status_code=400, detail=f"Invalid style_id: {payload.style_id}")

        _set_job_state(payload.job_id, status="queued", stage="queued", progress_pct=5, style_id=payload.style_id)

        if payload.async_mode:
            background_tasks.add_task(_run_bg_job, payload)
            return {
                "job_id": payload.job_id,
                "status": "queued",
                "stage": "queued",
                "progress_pct": 5,
            }

        try:
            return _execute_reconstruct_pipeline(
                job_id=payload.job_id,
                style_id=payload.style_id,
                target_poly_count=payload.target_poly_count,
                auto_rig=payload.auto_rig,
                views=payload.views,
                hf_token=payload.hf_token,
                r2_config=payload.r2_config,
                artifacts_dir=artifacts_dir,
            )
        except ValueError as v_err:
            _set_job_state(payload.job_id, status="failed", stage="validation_error", error=str(v_err))
            raise HTTPException(status_code=400, detail=str(v_err))
        except Exception as exc:
            _set_job_state(payload.job_id, status="failed", stage="error", error=str(exc))
            raise HTTPException(status_code=500, detail=str(exc))

    return app


def start_cloudflare_tunnel(port: int) -> None:
    global PUBLIC_TUNNEL_URL
    if not Path("/usr/local/bin/cloudflared").exists():
        subprocess.run(
            "wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 "
            "-O /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared",
            shell=True,
            check=True,
        )
    proc = subprocess.Popen(
        ["/usr/local/bin/cloudflared", "tunnel", "--url", f"http://127.0.0.1:{port}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    url_event = threading.Event()

    def _drain_tunnel() -> None:
        global PUBLIC_TUNNEL_URL
        if not proc.stdout:
            return
        for line in proc.stdout:
            if not PUBLIC_TUNNEL_URL:
                m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
                if m:
                    PUBLIC_TUNNEL_URL = m.group(0)
                    print(f"[SYNAPES 3D WORKER TUNNEL] {PUBLIC_TUNNEL_URL}", flush=True)
                    url_event.set()

    threading.Thread(target=_drain_tunnel, daemon=True).start()
    url_event.wait(timeout=18.0)


def main() -> None:
    parser = argparse.ArgumentParser(description="SYNAPES Multi-View 3D Worker (1-5 Views)")
    parser.add_argument("--serve", action="store_true", help="Run FastAPI HTTP server")
    parser.add_argument("--port", type=int, default=8190, help="HTTP bind port")
    parser.add_argument("--tunnel", action="store_true", help="Open Cloudflare HTTPS tunnel")
    parser.add_argument("--check", action="store_true", help="Print worker capability metadata JSON")
    args = parser.parse_args()

    if args.check:
        print(
            json.dumps(
                {
                    "worker": "synapes-multiview-3d-worker",
                    "version": WORKER_VERSION,
                    "supported_views": list(VIEW_SLOTS),
                    "styles": sorted(VALID_3D_STYLES),
                    "engines": ["tencent/Hunyuan3D-2mv", "JeffreyXiang/TRELLIS", "UniRig"],
                    "features": [
                        "async_jobs",
                        "local_glb_artifacts",
                        "glb_binary_inspector",
                        "style_pbr_metadata",
                        "unirig_bone_parser",
                    ],
                },
                indent=2,
            )
        )
        return

    if args.serve:
        if args.tunnel:
            start_cloudflare_tunnel(args.port)
        import uvicorn

        uvicorn.run(build_fastapi_app(), host="0.0.0.0", port=args.port)


if __name__ == "__main__":
    main()
