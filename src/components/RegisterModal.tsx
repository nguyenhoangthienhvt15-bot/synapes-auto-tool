import React, { useState, useEffect } from 'react';
import {
  X, User, Calendar, Mail, Phone, MapPin, Navigation, Compass,
  FileText, ShieldCheck, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, RefreshCw, Check, Sparkles
} from 'lucide-react';
import { UserRegistrationData } from '../types';
import {
  saveUserRegistration,
  formatDobToDDMMYYYY,
  discoverWebhookUrlFromSheet,
} from '../services/googleSheetService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draftRegId, setDraftRegId] = useState<string>(
    () => `reg_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  );

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Nam');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressType, setAddressType] = useState<'gps' | 'manual'>('manual');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Step 2: Terms and Confirmation
  const [activePolicyTab, setActivePolicyTab] = useState<'terms' | 'privacy' | 'copyright' | 'disclaimer'>('terms');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tự động dò kết nối hệ thống ngầm khi mở cửa sổ đăng ký (không hiển thị ra giao diện người dùng)
  useEffect(() => {
    if (isOpen) {
      setDraftRegId(`reg_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
      discoverWebhookUrlFromSheet().catch(() => {});
    }
  }, [isOpen]);

  // Đóng bằng phím Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Chuyển đổi tọa độ (lat, lng) sang địa chỉ tiếng Việt chi tiết (kết hợp Nominatim OSM + BigDataCloud)
  const reverseGeocodeToVietnameseAddress = async (lat: number, lng: number): Promise<string> => {
    // Nguồn 1: OpenStreetMap Nominatim (Chi tiết tên đường, phường/xã, quận/huyện, tỉnh/thành)
    try {
      const osmResp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`
      );
      if (osmResp.ok) {
        const osmData = await osmResp.json();
        if (osmData) {
          const a = osmData.address || {};
          const parts: string[] = [];
          const houseAndRoad = [a.house_number, a.road || a.pedestrian || a.residential]
            .filter(Boolean)
            .join(' ');
          if (houseAndRoad) parts.push(houseAndRoad);
          const ward = a.suburb || a.quarter || a.neighbourhood || a.village || a.town || a.hamlet;
          if (ward && !parts.includes(ward)) parts.push(ward);
          const district = a.city_district || a.district || a.county || a.municipality;
          if (district && !parts.includes(district)) parts.push(district);
          const city = a.city || a.state || a.province;
          if (city && !parts.includes(city)) parts.push(city);

          if (parts.length >= 2) {
            return parts.join(', ');
          }
          if (osmData.display_name) {
            const cleaned = String(osmData.display_name)
              .replace(/,\s*\d{5,6}/g, '')
              .replace(/,\s*(Việt Nam|Vietnam)\s*$/i, '')
              .trim();
            if (cleaned) return cleaned;
          }
        }
      }
    } catch {
      // Chuyển sang nguồn 2 nếu Nominatim bị giới hạn
    }

    // Nguồn 2: BigDataCloud Reverse Geocode Client (Tốc độ cao, hỗ trợ CORS 100%)
    try {
      const bdcResp = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`
      );
      if (bdcResp.ok) {
        const bdc = await bdcResp.json();
        const adminList: string[] = [];
        if (bdc.locality) adminList.push(bdc.locality);
        if (bdc.city && !adminList.includes(bdc.city)) adminList.push(bdc.city);
        if (bdc.principalSubdivision && !adminList.includes(bdc.principalSubdivision)) {
          adminList.push(bdc.principalSubdivision);
        }
        if (adminList.length > 0) {
          return `${adminList.join(', ')} (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        }
      }
    } catch {
      // Fallback bên dưới
    }

    return `Tọa độ GPS: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E, Việt Nam`;
  };

  // Xử lý lấy định vị GPS thông minh (Đa tầng: Cảm biến GPS -> Mạng Wi-Fi -> Định vị IP dự phòng)
  const handleGetLocation = async () => {
    setGpsError(null);
    setIsLocating(true);

    const getBrowserPosition = (highAccuracy: boolean, timeoutMs: number): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('NO_GEOLOCATION'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: timeoutMs,
          maximumAge: 60000,
        });
      });

    try {
      let position: GeolocationPosition;
      try {
        // Ưu tiên định vị nhanh qua Wi-Fi/Network (< 1-2 giây trên cả máy tính và điện thoại)
        position = await getBrowserPosition(false, 5000);
      } catch {
        // Thử lại với cảm biến GPS độ chính xác cao
        position = await getBrowserPosition(true, 8000);
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setCoords({ lat, lng });

      const resolvedAddress = await reverseGeocodeToVietnameseAddress(lat, lng);
      setAddress(resolvedAddress);
      setIsLocating(false);
      return;
    } catch {
      // Tầng dự phòng tự động: Nếu trình duyệt trên máy tính chặn quyền hoặc không có chip GPS,
      // tự động dò vị trí khu vực hiện tại để điền sẵn Phường/Quận/Thành phố giúp người dùng
      try {
        const fallbackResp = await fetch(
          'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=vi'
        );
        if (fallbackResp.ok) {
          const data = await fallbackResp.json();
          const lat = Number(data.latitude) || 10.7769;
          const lng = Number(data.longitude) || 106.7009;
          setCoords({ lat, lng });
          const parts = [data.locality, data.city, data.principalSubdivision]
            .filter(Boolean)
            .filter((v, i, arr) => arr.indexOf(v) === i);
          if (parts.length > 0) {
            setAddress(parts.join(', '));
            setIsLocating(false);
            return;
          }
        }
      } catch {
        // Nếu hoàn toàn ngoại tuyến
      }

      setIsLocating(false);
      setGpsError(
        'Thiết bị chưa cấp quyền vị trí trình duyệt. Bạn có thể bấm cho phép vị trí trên thanh địa chỉ hoặc nhập bổ sung ngay vào ô bên dưới.'
      );
    }
  };

  // Chuyển sang Bước 2
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Vui lòng nhập đầy đủ Họ và tên.');
      return;
    }
    if (!dob.trim()) {
      setFormError('Vui lòng chọn hoặc nhập Ngày/tháng/năm sinh.');
      return;
    }
    if (!email.trim() || email.indexOf('@') === -1) {
      setFormError('Vui lòng nhập địa chỉ Gmail hợp lệ để nhận thông tin tài khoản.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Vui lòng nhập Số điện thoại liên hệ.');
      return;
    }
    if (!address.trim()) {
      setFormError('Vui lòng nhập địa chỉ hiện tại hoặc sử dụng định vị GPS.');
      return;
    }

    const formattedDob = formatDobToDDMMYYYY(dob.trim());

    // NGAY KHI BẤM SANG TRANG TIẾP THEO:
    // Cập nhật ngay thông tin lên trang tính "THÔNG TIN NGƯỜI DÙNG" trên hệ thống quản trị Google Sheet
    const initialRegData: UserRegistrationData = {
      id: draftRegId,
      fullName: fullName.trim(),
      dob: formattedDob,
      gender,
      email: email.trim(),
      phone: phone.trim(),
      addressType,
      address: address.trim(),
      coords: coords || undefined,
      termsAccepted: false,
      registeredAt: new Date().toLocaleString('vi-VN'),
      notes: 'Chờ ký hợp đồng'
    };
    saveUserRegistration(initialRegData);

    setStep(2);
  };

  // Hoàn tất Bước 2: Ký hợp đồng và Lưu bản hợp đồng PDF lên Sheet để Ban quản lý / Kỹ sư duyệt
  const handleCompleteRegistration = async () => {
    if (!termsAccepted) {
      setFormError('Bạn cần tích chọn xác nhận đã đọc, hiểu và cam kết chấp hành nghiêm túc các điều khoản.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formattedDob = formatDobToDDMMYYYY(dob.trim());

    const registrationData: UserRegistrationData = {
      id: draftRegId,
      fullName: fullName.trim(),
      dob: formattedDob,
      gender,
      email: email.trim(),
      phone: phone.trim(),
      addressType,
      address: address.trim(),
      coords: coords || undefined,
      termsAccepted: true,
      registeredAt: new Date().toLocaleString('vi-VN'),
      notes: '📄 Hợp đồng PDF đã ký — Chờ Ban quản lý duyệt'
    };

    try {
      // Lưu hồ sơ và bản hợp đồng PDF lên trang tính "THÔNG TIN NGƯỜI DÙNG" để Dev/Kỹ sư xác nhận
      // (Không tự động tải file PDF về máy người dùng ở bước này; PDF sẽ được gửi qua Gmail khi Kỹ sư tích duyệt)
      await saveUserRegistration(registrationData);

      // Chuyển sang bước thông báo Hoàn tất & Chờ duyệt
      setStep(3);
    } catch (err: any) {
      setFormError(err?.message || 'Đã có lỗi xảy ra khi xử lý đăng ký.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-black/10 max-w-2xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Nút đóng */}
        <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950">
                Đăng Ký Tài Khoản SYNAPES Studio
              </h2>
              <p className="text-xs text-zinc-500">
                Kích hoạt tài khoản sáng tạo video tự động & Ký hợp đồng điện tử pháp lý
              </p>
            </div>
          </div>

          {/* Thanh tiến trình các bước */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium">
            <div
              className={`p-2 rounded-lg flex items-center gap-2 border transition ${
                step === 1
                  ? 'bg-zinc-950 text-white border-zinc-950'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-white text-zinc-950' : 'bg-zinc-200 text-zinc-800'
              }`}>1</span>
              <span className="truncate">Thông Tin Cá Nhân</span>
            </div>

            <div
              className={`p-2 rounded-lg flex items-center gap-2 border transition ${
                step === 2 || step === 3
                  ? 'bg-zinc-950 text-white border-zinc-950'
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 || step === 3 ? 'bg-white text-zinc-950' : 'bg-zinc-200 text-zinc-400'
              }`}>2</span>
              <span className="truncate">Điều Khoản & Ký Hợp Đồng</span>
            </div>
          </div>
        </div>

        {/* Error banner nếu có */}
        {formError && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{formError}</span>
          </div>
        )}

        {/* Nội dung theo từng bước */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-xs">
          {/* ========================================================= */}
          {/* BƯỚC 1: THÔNG TIN CÁ NHÂN */}
          {/* ========================================================= */}
          {step === 1 && (
            <form onSubmit={handleNextToStep2} className="space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="text-zinc-700 font-semibold block mb-1">
                  Họ và tên người dùng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900 transition"
                  />
                </div>
              </div>

              {/* Ngày sinh & Giới tính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-700 font-semibold block mb-1">
                    Ngày / tháng / năm sinh <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900 transition"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    (Phục vụ cơ chế sinh Mã Code tài khoản định danh cá nhân)
                  </span>
                </div>

                <div>
                  <label className="text-zinc-700 font-semibold block mb-1">
                    Giới tính <span className="text-zinc-400 font-normal">(không bắt buộc)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Nam', 'Nữ', 'Khác'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer text-center ${
                          gender === g
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gmail & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-700 font-semibold block mb-1">
                    Gmail đăng ký <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@gmail.com"
                      className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900 transition"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    Hệ thống sẽ gửi Mã Code, Mật khẩu & Hợp đồng PDF về Gmail này
                  </span>
                </div>

                <div>
                  <label className="text-zinc-700 font-semibold block mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0912 345 678"
                      className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Địa chỉ hiện tại (2 tùy chọn: Map định vị hoặc Điền tay) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-700 font-semibold">
                    Địa chỉ hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setAddressType('gps');
                        if (!coords || !address.trim()) {
                          handleGetLocation();
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer font-medium ${
                        addressType === 'gps'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>Định vị Map (GPS)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressType('manual')}
                      className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer font-medium ${
                        addressType === 'manual'
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-zinc-600" />
                      <span>Điền tay</span>
                    </button>
                  </div>
                </div>

                {addressType === 'gps' ? (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] text-zinc-600">
                        Tự động trích xuất địa chỉ đường/phố, phường/xã, tỉnh/thành từ định vị GPS để điền nhanh.
                      </div>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer flex-shrink-0"
                      >
                        {isLocating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang dò vị trí...</span>
                          </>
                        ) : (
                          <>
                            <Compass className="w-3.5 h-3.5" />
                            <span>{coords ? 'Cập nhật lại GPS' : 'Lấy vị trí GPS ngay'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {gpsError && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                        {gpsError}
                      </div>
                    )}

                    {coords && (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-900 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[11px]">
                              Đã định vị tự động ({coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E):
                            </div>
                            <div className="text-xs font-medium text-emerald-950 mt-0.5 break-words">{address}</div>
                          </div>
                        </div>
                        <div className="w-full h-32 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                          <iframe
                            title="Bản đồ vị trí GPS"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.005}%2C${coords.lat - 0.003}%2C${coords.lng + 0.005}%2C${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] text-zinc-500 block mb-1">
                        Địa chỉ hiển thị trên hợp đồng (bạn có thể gõ thêm số nhà/ngõ nếu muốn):
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Đang tự động điền địa chỉ từ định vị GPS..."
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 transition"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, ngõ/phố, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                      className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900 transition"
                    />
                  </div>
                )}
              </div>

              {/* Chuyển bước */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs text-zinc-600 hover:text-zinc-950 hover:underline cursor-pointer"
                >
                  ← Đã có tài khoản? Đăng nhập ngay
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <span>Tiếp tục: Đọc điều khoản & Ký hợp đồng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 2: ĐIỀU KHOẢN & KÝ HỢP ĐỒNG ĐIỆN TỬ */}
          {/* ========================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Tóm tắt thông tin người ký */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500">Người đăng ký (Bên B):</span>{' '}
                  <span className="font-bold text-zinc-950">{fullName}</span>{' '}
                  <span className="text-zinc-400 font-mono">({formatDobToDDMMYYYY(dob)} • {phone})</span>
                  <div className="text-zinc-600 truncate mt-0.5">{address}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-zinc-600 hover:text-zinc-950 hover:underline text-[11px] font-medium flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <span>Sửa thông tin</span>
                </button>
              </div>

              {/* Tabs 4 điều khoản */}
              <div className="flex items-center gap-1 border-b border-zinc-200 pb-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'terms', title: '1. Điều khoản sử dụng', icon: FileText },
                  { id: 'privacy', title: '2. Bảo mật Token & Data', icon: ShieldCheck },
                  { id: 'copyright', title: '3. Bản quyền tác giả', icon: CheckCircle2 },
                  { id: 'disclaimer', title: '4. Miễn trừ trách nhiệm', icon: AlertCircle }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activePolicyTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePolicyTab(item.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Khung nội dung pháp lý cuộn */}
              <div className="h-56 overflow-y-auto p-4 bg-zinc-50 border border-zinc-200 rounded-xl leading-relaxed text-zinc-700 text-xs font-sans space-y-3 shadow-inner">
                {activePolicyTab === 'terms' && (
                  <div>
                    <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1 font-sans">
                      QUY CHẾ VÀ ĐIỀU KHOẢN SỬ DỤNG DỊCH VỤ PHẦN MỀM (SỐ: 01/2026/QĐ-SYNAPES)
                    </h4>
                    <p className="italic text-zinc-500 mb-2">
                      Căn cứ Bộ luật Dân sự 2015, Luật Giao dịch điện tử 2023, Luật Công nghệ thông tin 2006, Nghị định 147/2024/NĐ-CP.
                    </p>
                    <p>
                      1. Bên Cung Cấp SYNAPES Studio cung cấp giải pháp tự động hóa nội dung số dưới dạng dịch vụ phần mềm (SaaS). Sau khi hồ sơ được phê duyệt, Khách Hàng được cấp Mã Code cá nhân duy nhất (dạng <code>SNP_...</code>) và mật khẩu để đăng nhập hệ thống.
                    </p>
                    <p>
                      2. Khách Hàng cam kết bảo mật thông tin đăng nhập, chủ động đổi mật khẩu riêng ngay trong phiên đăng nhập đầu tiên. Hệ thống áp dụng thuật toán băm mã hóa một chiều bcrypt an toàn, không bên thứ ba nào có thể đọc được mật khẩu của bạn.
                    </p>
                    <p>
                      3. Quy chuẩn nội dung video: Video dài YouTube tối ưu thời lượng 5-10 phút; Video ngắn TikTok/Reels dưới 60 giây, khung hình 9:16. Nghiêm cấm mọi hành vi tấn công mạng, can thiệp mã nguồn hoặc cố tình gây quá tải hệ thống máy chủ.
                    </p>
                  </div>
                )}

                {activePolicyTab === 'privacy' && (
                  <div>
                    <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1 font-sans">
                      CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN & AN TOÀN TOKEN API (SỐ: 02/2026/CSBM-SYNAPES)
                    </h4>
                    <p className="italic text-zinc-500 mb-2">
                      Căn cứ Nghị định số 13/2023/NĐ-CP, Luật An toàn thông tin mạng 2015, Luật An ninh mạng 2018.
                    </p>
                    <p>
                      1. Toàn bộ thông tin cá nhân và dữ liệu dự án của Khách Hàng được mã hóa theo tiêu chuẩn bảo mật quân sự AES-256-GCM.
                    </p>
                    <p>
                      2. Khóa API các dịch vụ (OpenAI GPT, Claude, DeepSeek, Grok, Gemini, YouTube, TikTok, Meta, Google Drive) được lưu trữ cô lập trong môi trường Sandbox bảo mật. SYNAPES Studio cam kết tuyệt đối không chuyển giao, mua bán hay chia sẻ token API của Khách Hàng cho bất kỳ bên thứ ba nào.
                    </p>
                  </div>
                )}

                {activePolicyTab === 'copyright' && (
                  <div>
                    <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1 font-sans">
                      QUY ĐỊNH BẢO HỘ QUYỀN SỞ HỮU TRÍ TUỆ KỊCH BẢN & NỘI DUNG (SỐ: 03/2026/SHTT-SYNAPES)
                    </h4>
                    <p className="italic text-zinc-500 mb-2">
                      Căn cứ Luật Sở hữu trí tuệ 2005 (sửa đổi, bổ sung 2022), Nghị định 17/2023/NĐ-CP, Công ước Berne.
                    </p>
                    <p>
                      1. Khách Hàng là chủ sở hữu quyền tác giả duy nhất và toàn vẹn 100% đối với toàn bộ kịch bản, lời bình, âm thanh và video thành phẩm được xuất bản từ phần mềm.
                    </p>
                    <p>
                      2. SYNAPES Studio không đòi hỏi bất kỳ quyền sở hữu thương mại hay yêu cầu phân chia doanh thu nào từ các kênh phát sóng và sản phẩm do Khách Hàng tạo dựng.
                    </p>
                  </div>
                )}

                {activePolicyTab === 'disclaimer' && (
                  <div>
                    <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1 font-sans">
                      QUY CHẾ PHÊ DUYỆT KIỂM SOÁT NỘI DUNG & MIỄN TRỪ TRÁCH NHIỆM (SỐ: 04/2026/QC-SYNAPES)
                    </h4>
                    <p className="italic text-zinc-500 mb-2">
                      Căn cứ Luật An ninh mạng 2018 (Điều 8 & Điều 16), Nghị định 147/2024/NĐ-CP, Tiêu chuẩn cộng đồng mạng xã hội.
                    </p>
                    <p>
                      1. Cơ chế phê duyệt kiểm soát (Human-in-the-loop): Khách Hàng là người trực tiếp kiểm duyệt nội dung kịch bản và quyết định bấm duyệt xuất bản video.
                    </p>
                    <p>
                      2. Khách Hàng cam kết tự chịu hoàn toàn trách nhiệm trước pháp luật về tính chân thực và bản quyền nội dung. SYNAPES Studio được miễn trừ toàn bộ trách nhiệm pháp lý liên đới đối với các tranh chấp nội dung do Khách Hàng tạo dựng và phát hành.
                    </p>
                  </div>
                )}
              </div>

              {/* Hộp xác nhận cam kết (Dưới cùng) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-zinc-950 rounded border-amber-300 focus:ring-zinc-950 cursor-pointer"
                  />
                  <span className="text-xs text-amber-950 leading-relaxed font-medium">
                    Tôi xác nhận đã đọc, hiểu và chấp nhận toàn bộ nội dung của điều khoản và hiểu rằng bản thân có ý thức chấp hành các điều khoản đã quy định một cách nghiêm túc.
                  </span>
                </label>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại sửa thông tin</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteRegistration}
                  disabled={!termsAccepted || isSubmitting}
                  className={`py-2.5 px-6 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                    termsAccepted && !isSubmitting
                      ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang ký hợp đồng & gửi hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Ký Hợp Đồng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 3: HOÀN TẤT & CHỜ BAN QUẢN LÝ / KỸ SƯ DUYỆT TRÊN SHEET */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="py-5 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-200 shadow-sm">
                <Check className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-zinc-950">
                  Đăng Ký Hợp Đồng Thành Công!
                </h3>
                <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
                  Bạn đã đăng ký hợp đồng điện tử thành công và hiện phía <b>Ban quản lý đang duyệt hợp đồng</b> của bạn. Bạn có thể thoát ra khỏi khung đăng ký và chờ thư thông báo gửi về Gmail.
                </p>
              </div>

              {/* Box giải thích quy trình duyệt */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-left text-xs space-y-2.5 max-w-lg mx-auto">
                <div className="flex items-center gap-2 font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Trạng Thái Hồ Sơ & Hợp Đồng PDF:</span>
                </div>
                <ul className="space-y-2 text-zinc-600 pl-1 font-sans leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    <span>Toàn bộ thông tin đăng ký và bản mềm <b>Hợp đồng PDF</b> của bạn đã được lưu trữ trên trang tính <b>"THÔNG TIN NGƯỜI DÙNG"</b> để Dev / Kỹ sư xác nhận.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    <span>Khi Dev / Kỹ sư tích chọn xác nhận duyệt hợp đồng, hệ thống sẽ tự động tạo <b>Mã Code đăng nhập</b> và <b>Mật khẩu</b> cá nhân cho bạn.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    <span>Hệ thống sẽ tự động gửi thông tin <b>Mã Code đăng nhập, Mật khẩu cùng file PDF Hợp đồng hoàn chỉnh</b> đến Gmail bạn đã đăng ký: <b className="text-zinc-950 font-mono">{email}</b>.</span>
                  </li>
                </ul>
              </div>

              {/* Nút thoát khung đăng ký */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary text-xs py-2.5 px-6 flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <span>Thoát Khung Đăng Ký</span>
                </button>

                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="btn-secondary text-xs py-2.5 px-5 flex items-center gap-1.5 cursor-pointer font-semibold"
                >
                  <span>Đến Màn Hình Đăng Nhập</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

