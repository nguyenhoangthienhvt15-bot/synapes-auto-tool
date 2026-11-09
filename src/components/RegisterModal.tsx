import React, { useState, useEffect } from 'react';
import {
  X, User, Calendar, Mail, Phone, MapPin, Navigation, Compass,
  FileText, ShieldCheck, CheckCircle2, AlertCircle,
  ArrowRight, ArrowLeft, RefreshCw, Check, Sparkles,
  CreditCard, Layers, Clock, DollarSign, Award, Info, QrCode,
  Building, PenTool, CheckCircle
} from 'lucide-react';
import { UserRegistrationData, ContractCategory, ContractPackage } from '../types';
import {
  saveUserRegistration,
  formatDobToDDMMYYYY,
  discoverWebhookUrlFromSheet,
} from '../services/googleSheetService';
import { QR_CODE_BASE64 } from '../data/qrCodeBase64';
import { SignatureModal } from './SignatureModal';

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

  // Form inputs - Bước 1
  const [fullName, setFullName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Nam');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressType, setAddressType] = useState<'gps' | 'manual'>('manual');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Bước 2: Lựa chọn loại hợp đồng & gói ký kết
  const [contractCategory, setContractCategory] = useState<ContractCategory>('personal');
  const [contractPackage, setContractPackage] = useState<ContractPackage>('personal_deposit');
  const [deliveryDays, setDeliveryDays] = useState<number>(5);
  const [activePolicyTab, setActivePolicyTab] = useState<'features' | 'terms' | 'warranty' | 'dmca' | 'disclaimer'>('features');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Chữ ký tay điện tử của người dùng (Bên B) - Luôn rỗng khi mở phiên đăng ký mới
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Helper thông tin chi tiết gói hợp đồng
  const getPackageDetails = (pkg: ContractPackage) => {
    switch (pkg) {
      case 'personal_deposit':
        return {
          name: 'Ký đặt cọc dự án cá nhân',
          category: 'personal' as ContractCategory,
          categoryName: 'Hợp đồng cá nhân hóa',
          depositAmount: 1250000,
          totalAmount: 2550000,
          originalAmount: 3250000,
          discountAmount: 700000,
          isDeposit: true,
          defaultDays: 5,
          targetDesc: 'Dành cho cá nhân, nhà sáng tạo nội dung đơn lẻ với nhu cầu sử dụng nhất định.',
        };
      case 'personal_full':
        return {
          name: 'Ký hợp đồng dự án cá nhân (Thanh toán 100%)',
          category: 'personal' as ContractCategory,
          categoryName: 'Hợp đồng cá nhân hóa',
          depositAmount: 2550000,
          totalAmount: 2550000,
          originalAmount: 3250000,
          discountAmount: 700000,
          isDeposit: false,
          defaultDays: 0,
          targetDesc: 'Thanh toán 100% trọn gói ngay khi ký hợp đồng, nhận tài khoản ngay sau khi Kỹ sư duyệt.',
        };
      case 'enterprise_deposit':
        return {
          name: 'Ký đặt cọc phân bổ toàn hệ',
          category: 'enterprise' as ContractCategory,
          categoryName: 'Hợp đồng toàn hệ',
          depositAmount: 2500000,
          totalAmount: 5490000,
          originalAmount: 6250000,
          discountAmount: 760000,
          isDeposit: true,
          defaultDays: 7,
          targetDesc: 'Dành cho người dùng cao cấp, doanh nghiệp & tổ chức mở rộng và cập nhật chức năng theo thời gian thực.',
        };
      case 'enterprise_full':
        return {
          name: 'Ký hợp đồng dự án toàn hệ chính thức (Thanh toán 100%)',
          category: 'enterprise' as ContractCategory,
          categoryName: 'Hợp đồng toàn hệ',
          depositAmount: 5490000,
          totalAmount: 5490000,
          originalAmount: 6250000,
          discountAmount: 760000,
          isDeposit: false,
          defaultDays: 0,
          targetDesc: 'Thanh toán 100% một lần, kích hoạt toàn bộ hạn mức tối đa của toàn hệ thống vĩnh viễn.',
        };
    }
  };

  const currentPkgInfo = getPackageDetails(contractPackage);

  // Tự động chuyển đổi gói mặc định khi chọn loại hợp đồng
  const handleSelectCategory = (cat: ContractCategory) => {
    setContractCategory(cat);
    if (cat === 'personal') {
      setContractPackage('personal_deposit');
      setDeliveryDays(5);
    } else {
      setContractPackage('enterprise_deposit');
      setDeliveryDays(7);
    }
  };

  const handleSelectPackage = (pkg: ContractPackage) => {
    setContractPackage(pkg);
    const details = getPackageDetails(pkg);
    if (details.isDeposit) {
      setDeliveryDays(details.defaultDays || 5);
    }
  };

  // Tự động làm sạch dữ liệu và dò kết nối hệ thống ngầm khi mở cửa sổ đăng ký mới
  useEffect(() => {
    if (isOpen) {
      setDraftRegId(`reg_${Date.now()}_${Math.floor(Math.random() * 10000)}`);
      // Đảm bảo mỗi lần đăng ký mới không hiện chữ ký khách hàng trước đó ký
      setSignatureImage('');
      setTermsAccepted(false);
      setFormError(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('synapes_user_signature_latest');
        } catch { }
      }
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

  // Chuyển đổi tọa độ (lat, lng) sang địa chỉ tiếng Việt chi tiết
  const reverseGeocodeToVietnameseAddress = async (lat: number, lng: number): Promise<string> => {
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
      // Fallback bên dưới
    }

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

  // Xử lý lấy định vị GPS thông minh
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
        position = await getBrowserPosition(false, 5000);
      } catch {
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
        // Ngoại tuyến
      }

      setIsLocating(false);
      setGpsError(
        'Thiết bị chưa cấp quyền vị trí trình duyệt. Bạn có thể bấm cho phép vị trí trên thanh địa chỉ hoặc nhập bổ sung ngay vào ô bên dưới.'
      );
    }
  };

  // Chuyển sang Bước 2: Kiểm tra dữ liệu & CCCD
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanedFullName = fullName.trim();
    const cleanedIdCard = idCardNumber.trim().replace(/\s+/g, '');

    if (!cleanedFullName) {
      setFormError('Vui lòng nhập đầy đủ Họ và tên.');
      return;
    }
    if (!cleanedIdCard || cleanedIdCard.length < 9) {
      setFormError('Vui lòng nhập số Căn cước công dân (CCCD / CMND) hợp lệ (từ 9 đến 12 chữ số).');
      return;
    }
    if (!dob.trim()) {
      setFormError('Vui lòng chọn hoặc nhập Ngày/tháng/năm sinh.');
      return;
    }
    if (!email.trim() || email.indexOf('@') === -1) {
      setFormError('Vui lòng nhập địa chỉ Gmail hợp lệ để nhận thông tin tài khoản & hợp đồng.');
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
    const pkgDetails = getPackageDetails(contractPackage);

    // Đồng bộ ngay hồ sơ nháp lên Google Sheet
    const initialRegData: UserRegistrationData = {
      id: draftRegId,
      fullName: cleanedFullName,
      idCardNumber: cleanedIdCard,
      dob: formattedDob,
      gender,
      email: email.trim(),
      phone: phone.trim(),
      addressType,
      address: address.trim(),
      coords: coords || undefined,
      contractCategory,
      contractPackage,
      contractPackageName: pkgDetails.name,
      depositAmount: pkgDetails.depositAmount,
      totalAmount: pkgDetails.totalAmount,
      originalAmount: pkgDetails.originalAmount,
      deliveryDays: pkgDetails.isDeposit ? deliveryDays : 0,
      termsAccepted: false,
      registeredAt: new Date().toLocaleString('vi-VN'),
      notes: 'Chờ duyệt hợp đồng'
    };
    saveUserRegistration(initialRegData);

    setStep(2);
  };

  // Hoàn tất Bước 2: Ký hợp đồng & Gửi hồ sơ lên Google Sheet cho Kỹ sư duyệt
  const handleCompleteRegistration = async () => {
    if (!termsAccepted) {
      setFormError('Bạn cần tích chọn xác nhận: "Tôi đã hiểu và chịu trách nhiệm với các điều khoản đề ra giữa cả hai bên".');
      return;
    }

    if (!signatureImage) {
      setFormError('Vui lòng bấm nút "Ký tên" để vẽ chữ ký tay xác nhận hợp đồng trước khi gửi.');
      return;
    }

    if (currentPkgInfo.isDeposit && (!deliveryDays || deliveryDays < 1)) {
      setFormError('Vui lòng nhập số ngày cam kết bàn giao hợp lệ (tối thiểu 1 ngày).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formattedDob = formatDobToDDMMYYYY(dob.trim());
    const cleanedIdCard = idCardNumber.trim().replace(/\s+/g, '');
    const pkgDetails = getPackageDetails(contractPackage);

    const registrationData: UserRegistrationData = {
      id: draftRegId,
      fullName: fullName.trim(),
      idCardNumber: cleanedIdCard,
      dob: formattedDob,
      gender,
      email: email.trim(),
      phone: phone.trim(),
      addressType,
      address: address.trim(),
      coords: coords || undefined,
      contractCategory,
      contractPackage,
      contractPackageName: pkgDetails.name,
      depositAmount: pkgDetails.depositAmount,
      totalAmount: pkgDetails.totalAmount,
      originalAmount: pkgDetails.originalAmount,
      deliveryDays: pkgDetails.isDeposit ? deliveryDays : 0,
      signatureImage: signatureImage || undefined,
      termsAccepted: true,
      registeredAt: new Date().toLocaleString('vi-VN'),
      notes: `📄 Hợp đồng đã ký [${pkgDetails.name}] — Chờ Kỹ sư duyệt`
    };

    if (signatureImage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`synapes_user_signature_${email.trim().toLowerCase()}`, signatureImage);
        localStorage.removeItem('synapes_user_signature_latest');
      } catch { }
    }

    try {
      await saveUserRegistration(registrationData);
      setStep(3);
    } catch (err: any) {
      setFormError(err?.message || 'Đã có lỗi xảy ra khi gửi hợp đồng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatVnd = (num: number) => num.toLocaleString('vi-VN') + ' VNĐ';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-black/10 max-w-3xl w-full max-h-[94vh] shadow-2xl flex flex-col overflow-hidden relative">
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
        <div className="px-6 pt-5 pb-3 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950">
                Đăng Ký Tài Khoản & Ký Hợp Đồng Điện Tử SYNAPES Studio
              </h2>
              <p className="text-xs text-zinc-500">
                Hệ thống tự động hóa nội dung đa tầng • Ký hợp đồng điện tử có dấu mộc đỏ Trưởng ban
              </p>
            </div>
          </div>

          {/* Thanh tiến trình các bước */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs font-medium">
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
              <span className="truncate">1. Thông Tin Cá Nhân & CCCD</span>
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
              <span className="truncate">2. Chọn Hợp Đồng & Ký Kết Pháp Lý</span>
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
          {/* BƯỚC 1: THÔNG TIN CÁ NHÂN & CCCD */}
          {/* ========================================================= */}
          {step === 1 && (
            <form onSubmit={handleNextToStep2} className="space-y-4">
              {/* Họ và tên & Căn cước công dân */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="text-zinc-700 font-semibold block mb-1">
                    Số Căn cước công dân (CCCD / CMND) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={idCardNumber}
                      onChange={(e) => setIdCardNumber(e.target.value)}
                      placeholder="Ví dụ: 079201012345 (12 số) hoặc CMND"
                      className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-950 focus:outline-none focus:border-zinc-900 transition font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    (In vào bản hợp đồng điện tử để bảo vệ quyền lợi pháp lý hai bên)
                  </span>
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
                    Hệ thống sẽ gửi Thông báo, Hợp đồng PDF có dấu đỏ & Mã tài khoản về Gmail này
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

              {/* Địa chỉ hiện tại (GPS hoặc Điền tay) */}
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
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] text-zinc-500 block mb-1">
                        Địa chỉ hiển thị trên hợp đồng:
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
          {/* BƯỚC 2: CHỌN LOẠI HỢP ĐỒNG, GÓI KÝ & ĐIỀU KHOẢN PHÁP LÝ */}
          {/* ========================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Tóm tắt thông tin người ký */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500">Khách Hàng (Bên B):</span>{' '}
                  <span className="font-bold text-zinc-950">{fullName}</span>{' '}
                  <span className="text-zinc-600 font-mono font-medium">| CCCD: {idCardNumber}</span>{' '}
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

              {/* TIER 1: CHỌN LOẠI HỢP ĐỒNG */}
              <div>
                <label className="text-xs font-bold text-zinc-900 block mb-2">
                  1. CHỌN LOẠI HÌNH HỢP ĐỒNG KÝ KẾT:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Hợp đồng cá nhân hóa */}
                  <div
                    onClick={() => handleSelectCategory('personal')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer relative ${
                      contractCategory === 'personal'
                        ? 'border-zinc-950 bg-zinc-50/80 shadow-xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-950 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-800" />
                        Hợp đồng cá nhân hóa
                      </span>
                      {contractCategory === 'personal' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-snug">
                      Hợp đồng ký dạng cá nhân với người dùng đơn có nhu cầu sử dụng sáng tạo video tự động nhất định.
                    </p>
                  </div>

                  {/* Hợp đồng toàn hệ */}
                  <div
                    onClick={() => handleSelectCategory('enterprise')}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer relative ${
                      contractCategory === 'enterprise'
                        ? 'border-zinc-950 bg-zinc-50/80 shadow-xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-zinc-950 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-zinc-800" />
                        Hợp đồng toàn hệ
                      </span>
                      {contractCategory === 'enterprise' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-snug">
                      Dành cho người dùng cao cấp, doanh nghiệp và tổ chức muốn sử dụng hạn mức cao nhất, mở rộng và cập nhật chức năng theo thời gian thực.
                    </p>
                  </div>
                </div>
              </div>

              {/* TIER 2: CHỌN GÓI KÝ KẾT CỤ THỂ */}
              <div>
                <label className="text-xs font-bold text-zinc-900 block mb-2">
                  2. CHỌN PHƯƠNG THỨC KÝ & THANH TOÁN (THEO {contractCategory === 'personal' ? 'HỢP ĐỒNG CÁ NHÂN HÓA' : 'HỢP ĐỒNG TOÀN HỆ'}):
                </label>

                {contractCategory === 'personal' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Đặt cọc cá nhân */}
                    <div
                      onClick={() => handleSelectPackage('personal_deposit')}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        contractPackage === 'personal_deposit'
                          ? 'border-zinc-950 bg-amber-50/40 ring-1 ring-zinc-950'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-zinc-950">
                          Ký đặt cọc dự án cá nhân
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          Đặt cọc
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div>Tiền đặt cọc: <b className="text-zinc-950">1.250.000 VNĐ</b></div>
                        <div>Tổng bàn giao: <b className="text-emerald-700">2.550.000 VNĐ</b> <span className="line-through text-zinc-400 text-[10px]">(Gốc: 3.250.000đ)</span></div>
                        <div className="text-zinc-500 text-[10px] mt-1">Bên bán cam kết bàn giao đúng hạn theo số ngày đặt cọc.</div>
                      </div>
                    </div>

                    {/* Thanh toán 100% cá nhân */}
                    <div
                      onClick={() => handleSelectPackage('personal_full')}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        contractPackage === 'personal_full'
                          ? 'border-zinc-950 bg-emerald-50/40 ring-1 ring-zinc-950'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-zinc-950">
                          Ký hợp đồng dự án cá nhân
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Thanh toán 100%
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div>Thanh toán 1 lần: <b className="text-emerald-700">2.550.000 VNĐ</b> <span className="line-through text-zinc-400 text-[10px]">(Gốc: 3.250.000đ)</span></div>
                        <div className="text-zinc-500 text-[10px] mt-1">Cấp đủ Mã Code và Mật khẩu đăng nhập ngay sau khi duyệt.</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Đặt cọc phân bổ toàn hệ */}
                    <div
                      onClick={() => handleSelectPackage('enterprise_deposit')}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        contractPackage === 'enterprise_deposit'
                          ? 'border-zinc-950 bg-amber-50/40 ring-1 ring-zinc-950'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-zinc-950">
                          Ký đặt cọc phân bổ
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          Đặt cọc
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div>Tiền đặt cọc: <b className="text-zinc-950">2.500.000 VNĐ</b></div>
                        <div>Tổng hợp đồng: <b className="text-emerald-700">5.490.000 VNĐ</b> <span className="line-through text-zinc-400 text-[10px]">(Gốc: 6.250.000đ)</span></div>
                        <div className="text-zinc-500 text-[10px] mt-1">Bên bán cam kết bàn giao đúng hạn theo số ngày đặt cọc.</div>
                      </div>
                    </div>

                    {/* Thanh toán 100% toàn hệ */}
                    <div
                      onClick={() => handleSelectPackage('enterprise_full')}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        contractPackage === 'enterprise_full'
                          ? 'border-zinc-950 bg-emerald-50/40 ring-1 ring-zinc-950'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-zinc-950">
                          Ký hợp đồng dự án toàn hệ chính thức
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Thanh toán 100%
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[11px]">
                        <div>Thanh toán 1 lần: <b className="text-emerald-700">5.490.000 VNĐ</b> <span className="line-through text-zinc-400 text-[10px]">(Gốc: 6.250.000đ)</span></div>
                        <div className="text-zinc-500 text-[10px] mt-1">Toàn bộ hạn mức tối đa của hệ thống, cấp tài khoản ngay sau khi duyệt.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ô NHẬP SỐ NGÀY ĐẾN HẠN BÀN GIAO (KHI LÀ HỢP ĐỒNG ĐẶT CỌC) */}
              {currentPkgInfo.isDeposit && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-800" />
                      Thời hạn bên bán cam kết bàn giao hệ thống (tính từ thời điểm đặt cọc):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        required
                        value={deliveryDays}
                        onChange={(e) => setDeliveryDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-center font-bold text-xs text-amber-950 focus:outline-none focus:border-zinc-900"
                      />
                      <span className="font-bold text-xs text-amber-950">ngày</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    <b>Cam kết pháp lý:</b> Người bán có nghĩa vụ bàn giao sản phẩm (hệ thống) đúng thời hạn, tính từ thời điểm đặt cọc là <b>{deliveryDays} ngày</b>. Thông tin này sẽ được in trực tiếp vào trong file PDF hợp đồng gửi đến bạn và lưu về bản sao quản trị.
                  </p>
                </div>
              )}

              {/* TABS ĐIỀU KHOẢN PHÁP LÝ & QUYỀN HẠN HỆ THỐNG */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 border-b border-zinc-200 pb-2 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'features', title: '1. Quyền hạn & Tính năng', icon: Layers },
                    { id: 'terms', title: '2. Quy định thanh toán & Bàn giao', icon: DollarSign },
                    { id: 'warranty', title: '3. Bảo hành vĩnh viễn', icon: Award },
                    { id: 'dmca', title: '4. An toàn DMCA', icon: ShieldCheck },
                    { id: 'disclaimer', title: '5. Miễn trừ rủi ro', icon: AlertCircle }
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

                {/* Khung nội dung pháp lý */}
                <div className="h-52 overflow-y-auto p-4 bg-zinc-50 border border-zinc-200 rounded-xl leading-relaxed text-zinc-700 text-xs font-sans space-y-3 shadow-inner">
                  {activePolicyTab === 'features' && (
                    <div>
                      <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1.5">
                        ĐIỀU 1: QUYỀN HẠN (HẠN MỨC) VÀ CHỨC NĂNG SẢN PHẨM HỆ THỐNG CUNG CẤP
                      </h4>
                      {contractCategory === 'personal' ? (
                        <div className="space-y-1.5">
                          <p><b>1.1. Phạm vi cấp phép cá nhân hóa:</b> Bên Cung Cấp SYNAPES Studio cấp quyền sử dụng hệ thống phiên bản Cá Nhân Hóa trọn đời cho Khách Hàng (Bên B).</p>
                          <p><b>1.2. Danh mục chức năng được kích hoạt:</b></p>
                          <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                            <li>Tự động hóa chức năng tạo - đăng tải video và tuân thủ cấu trúc đa tầng (Hook 3s, thân kịch bản, Call-to-action).</li>
                            <li>Biên tập chuyên nghiệp và tối ưu cho cả Video Dài YouTube (16:9) và Video Ngắn TikTok/Reels/Shorts (9:16).</li>
                            <li>Đưa ra các báo cáo đánh giá về các xu hướng hiện thực, phân tích tâm lý người xem theo thời gian thực.</li>
                            <li>Cung cấp các đánh giá dữ liệu thời gian thực, quản lý lịch phát sóng giờ vàng (Goldtime).</li>
                            <li>Hệ thống bảo mật và an toàn thông tin chuẩn DMCA và các chuẩn an toàn công nghệ hiện hành.</li>
                          </ul>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p><b>1.1. Phạm vi cấp phép toàn hệ thống tối đa:</b> Bên B được sử dụng <b>HẠN MỨC CHỨC NĂNG TỐI ĐA</b> của toàn bộ hệ thống SYNAPES Studio, không giới hạn số lượng chiến dịch và kênh phân phối.</p>
                          <p><b>1.2. Toàn bộ danh mục chức năng cao cấp & độc quyền:</b></p>
                          <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                            <li>Toàn bộ tính năng tự động hóa tạo - đăng tải đa nền tảng và tuân thủ cấu trúc đa tầng chuẩn quốc tế.</li>
                            <li>Tính năng <b>AI Video Reverse Engineering & Video DNA Cloner</b>: Bóc tách cấu trúc, kịch bản, âm thanh, visual hook và tái tạo video tương tự theo phong cách gốc.</li>
                            <li>Gợi ý prompt sinh ảnh/video tương tự bằng trí tuệ nhân tạo chuyên sâu.</li>
                            <li>Cơ chế BYOK (Bring Your Own Keys) an toàn tuyệt đối, tích hợp không giới hạn API cá nhân hoặc doanh nghiệp.</li>
                            <li>Tính tối ưu hóa và cá nhân hóa ở mức cao nhất, mở rộng và cập nhật chức năng mới liên tục trong thời gian thực.</li>
                            <li>Hệ thống bảo mật quân sự AES-256-GCM, chuẩn DMCA và bảo vệ quyền sở hữu trí tuệ 100%.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {activePolicyTab === 'terms' && (
                    <div>
                      <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1.5">
                        ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG, NGHĨA VỤ BÀN GIAO & PHƯƠNG THỨC THANH TOÁN
                      </h4>
                      <p><b>2.1. Giá trị thanh toán:</b></p>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                        <li>Gói ký kết: <b>{currentPkgInfo.name}</b> thuộc <b>{currentPkgInfo.categoryName}</b>.</li>
                        {currentPkgInfo.isDeposit ? (
                          <>
                            <li>Số tiền đặt cọc: <b className="text-zinc-950">{formatVnd(currentPkgInfo.depositAmount)}</b>.</li>
                            <li>Tổng giá trị toàn vẹn bàn giao hệ thống: <b className="text-emerald-700">{formatVnd(currentPkgInfo.totalAmount)}</b> (Giá gốc niêm yết: <span className="line-through">{formatVnd(currentPkgInfo.originalAmount)}</span>).</li>
                            <li>Số tiền còn lại thanh toán khi bàn giao: <b>{formatVnd(currentPkgInfo.totalAmount - currentPkgInfo.depositAmount)}</b>.</li>
                          </>
                        ) : (
                          <>
                            <li>Tổng số tiền thanh toán 100% trọn gói một lần: <b className="text-emerald-700">{formatVnd(currentPkgInfo.totalAmount)}</b> (Giá gốc niêm yết: <span className="line-through">{formatVnd(currentPkgInfo.originalAmount)}</span>).</li>
                          </>
                        )}
                      </ul>
                      <p className="mt-1.5"><b>2.2. Nghĩa vụ bàn giao sản phẩm (hệ thống):</b></p>
                      <p className="text-zinc-600">
                        {currentPkgInfo.isDeposit
                          ? `Bên bán có nghĩa vụ bàn giao sản phẩm (hệ thống) đúng thời hạn, tính từ thời điểm đặt cọc là ${deliveryDays} ngày. Khi đến hạn bàn giao, Kỹ sư/Dev sẽ tiến hành duyệt lần cuối sau khi Bên B thanh toán đầy đủ phần còn lại để phát hành thông tin tài khoản chính thức.`
                          : 'Bên bán có nghĩa vụ cấp đủ Mã Code đăng nhập, Mật khẩu cùng bản hợp đồng PDF chính thức gửi về Gmail Bên B ngay sau khi Kỹ sư duyệt ký xác nhận.'}
                      </p>
                    </div>
                  )}

                  {activePolicyTab === 'warranty' && (
                    <div>
                      <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1.5">
                        ĐIỀU 3: THỜI HẠN HIỆU LỰC, CAM KẾT BẢO HÀNH TOÀN THỜI GIAN & TÍNH CHÍNH THỐNG
                      </h4>
                      <p><b>3.1. Thời hạn và giá trị hợp đồng:</b> Có tính <b>VĨNH VIỄN</b> kể từ thời điểm ký kết thành công.</p>
                      <p><b>3.2. Cam kết bảo hành & hỗ trợ:</b> Bên bán cam kết bảo hành và cung cấp giải pháp bảo hành toàn thời gian cho toàn bộ hệ thống phần mềm, khắc phục mọi sự cố kỹ thuật phát sinh 24/7.</p>
                      <p><b>3.3. Tính chính thống:</b> Hệ thống phần mềm SYNAPES Studio là sản phẩm trí tuệ độc quyền được phát triển chính thống bởi Ban Chuyển đổi số & Trí tuệ nhân tạo, đứng đầu là KS. Nguyễn Hoàng Thiện.</p>
                    </div>
                  )}

                  {activePolicyTab === 'dmca' && (
                    <div>
                      <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1.5">
                        ĐIỀU 4: BẢO MẬT DỮ LIỆU & TIÊU CHUẨN AN TOÀN THÔNG TIN CHUẨN DMCA
                      </h4>
                      <p><b>4.1. Tiêu chuẩn bảo mật:</b> Hệ thống tuân thủ nghiêm ngặt các quy định về an toàn thông tin theo Luật An toàn thông tin mạng 2015, Nghị định 13/2023/NĐ-CP và tiêu chuẩn bản quyền kỹ thuật số quốc tế DMCA.</p>
                      <p><b>4.2. Bảo vệ khóa API & Kịch bản:</b> Toàn bộ dữ liệu của Khách Hàng và các Token API được mã hóa AES-256 trong môi trường Sandbox độc lập. Tuyệt đối không chia sẻ hoặc cung cấp cho bất kỳ bên thứ ba nào.</p>
                    </div>
                  )}

                  {activePolicyTab === 'disclaimer' && (
                    <div>
                      <h4 className="font-bold text-zinc-950 text-xs uppercase mb-1.5">
                        ĐIỀU 5: QUYỀN MIỄN TRỪ TRÁCH NHIỆM & QUẢN TRỊ RỦI RO
                      </h4>
                      <p><b>5.1. Quyền miễn trừ của Bên Bán:</b> Bên Bán được miễn trừ toàn bộ trách nhiệm dân sự và hình sự liên đới trong các trường hợp:</p>
                      <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                        <li>Khách Hàng (Bên B) tự ý sử dụng các khóa API lậu, key trôi nổi không rõ nguồn gốc gây khóa dịch vụ hoặc thất thoát dữ liệu.</li>
                        <li>Khách Hàng sử dụng các hình ảnh, âm thanh, video hoặc nhãn hiệu có bản quyền của bên thứ ba mà chưa được cấp phép sở hữu.</li>
                        <li>Khách Hàng vi phạm chính sách cộng đồng, pháp luật an ninh mạng hoặc các điều cấm của Nhà nước.</li>
                      </ul>
                      <p className="mt-1.5"><b>5.2. Trách nhiệm của Bên Mua:</b> Bên B hoàn toàn chịu trách nhiệm trước pháp luật về toàn bộ nội dung xuất bản và tài nguyên sử dụng trên hệ thống.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* THÔNG TIN THANH TOÁN & QR CODE VIETQR */}
              <div className="p-3 bg-zinc-100/80 border border-zinc-200 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-zinc-700" />
                    Tài khoản thanh toán chính thức (Timo Digital Bank by BVBank):
                  </div>
                  <div className="text-zinc-700 text-[11px]">
                    STK: <b className="font-mono text-zinc-950 text-xs">0983396354</b> • Chủ TK: <b className="text-zinc-950">NGUYEN HOANG THIEN</b>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Số tiền: <b className="text-emerald-700">{formatVnd(currentPkgInfo.isDeposit ? currentPkgInfo.depositAmount : currentPkgInfo.totalAmount)}</b> • Nội dung: <b>{phone} {fullName}</b>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  <QrCode className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Xem QR Chuyển Khoản</span>
                </button>
              </div>

              {/* MỤC KÝ TÊN TAY ĐIỆN TỬ (BÊN B) */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                      ✍️
                    </div>
                    <div>
                      <div className="font-bold text-zinc-950 text-xs flex items-center gap-1.5">
                        <span>Mục Ký Tên Điện Tử (Bên Mua Hàng &amp; Sử Dụng Dịch Vụ)</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                          Bắt buộc
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Chữ ký tay điện tử sẽ được nhúng trên toàn bộ các hợp đồng pháp lý của bạn
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(true)}
                    className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-xs hover:border-zinc-400"
                  >
                    <PenTool className="w-3.5 h-3.5 text-zinc-700" />
                    <span>{signatureImage ? 'Ký lại chữ ký' : 'Ký tên'}</span>
                  </button>
                </div>

                {signatureImage ? (
                  <div className="p-3 bg-white border border-emerald-200 rounded-lg flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="border border-dashed border-zinc-300 rounded-lg p-1.5 bg-zinc-50/50 flex items-center justify-center">
                        <img
                          src={signatureImage}
                          alt="Chữ ký đã lưu"
                          className="h-10 max-w-[140px] object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>Đã ký tay xác nhận thành công</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Hiển thị ở bên Đại diện mua hàng, ngay phía trên khung <b>"ĐÃ KÝ XÁC NHẬN ĐIỆN TỬ"</b>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSignatureModal(true)}
                      className="text-zinc-600 hover:text-zinc-950 text-[11px] font-medium underline cursor-pointer flex-shrink-0"
                    >
                      Ký lại
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50/70 border border-dashed border-amber-300 rounded-lg flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-950 font-medium">
                      👉 Vui lòng bấm nút <b>"Ký tên"</b> để mở bảng vẽ chữ ký tay xác nhận hợp đồng.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSignatureModal(true)}
                      className="px-3 py-1 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 flex-shrink-0 shadow-xs"
                    >
                      <PenTool className="w-3 h-3 text-zinc-200" />
                      <span>Ký tên ngay</span>
                    </button>
                  </div>
                )}
              </div>

              {/* HỘP CAM KẾT & TÍCH CHỌN */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-zinc-950 rounded border-amber-300 focus:ring-zinc-950 cursor-pointer"
                  />
                  <span className="text-xs text-amber-950 leading-relaxed font-bold">
                    Tôi đã hiểu và chịu trách nhiệm với các điều khoản đề ra giữa cả hai bên
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
                      <span>Đang gửi hợp đồng lên hệ thống...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Ký hợp đồng & Gửi hợp đồng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 3: HOÀN TẤT & HƯỚNG DẪN QUY TRÌNH DUYỆT TỪ KỸ SƯ */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="py-5 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-2 border-emerald-200 shadow-sm">
                <Check className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-zinc-950">
                  Gửi Hợp Đồng Thành Công!
                </h3>
                <p className="text-xs text-zinc-600 max-w-md mx-auto leading-relaxed">
                  Hồ sơ và Hợp đồng <b>{currentPkgInfo.name}</b> của bạn đã được ghi nhận trên trang tính <b>"THÔNG TIN NGƯỜI DÙNG"</b> để Kỹ sư/Dev kiểm tra và duyệt ký.
                </p>
              </div>

              {/* Giải thích quy trình chi tiết theo loại hợp đồng */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-left text-xs space-y-2.5 max-w-lg mx-auto">
                <div className="flex items-center gap-2 font-bold text-zinc-900 border-b border-zinc-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Quy Trình Phê Duyệt & Gửi Gmail Thông Báo:</span>
                </div>

                {currentPkgInfo.isDeposit ? (
                  <ul className="space-y-2 text-zinc-600 pl-1 font-sans leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">1. Duyệt Lần 1:</span>
                      <span>Kỹ sư/Dev sẽ tích duyệt hợp đồng đặt cọc. Hệ thống <b>chưa cấp mật khẩu ngay</b> mà sẽ gửi Gmail xác nhận ký kết thành công kèm thông báo ngày nhận sản phẩm (sau <b>{deliveryDays} ngày</b>) và file PDF bản hợp đồng đặt cọc có <b>dấu mộc đỏ Trưởng ban KS. Nguyễn Hoàng Thiện</b> cùng mã QR chuyển khoản.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">2. Bàn Giao Lần 2:</span>
                      <span>Khi tới hạn bàn giao và xác nhận bạn đã hoàn tất thanh toán phần còn lại, Kỹ sư/Dev sẽ tích duyệt Lần 2 trên Sheet để hệ thống gửi Gmail cấp <b>Mã Code đăng nhập + Mật khẩu</b> và bản hợp đồng bàn giao chính thức.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">3. Gmail tiếp nhận:</span>
                      <span>Vui lòng kiểm tra hộp thư đến tại Gmail: <b className="text-zinc-950 font-mono">{email}</b>.</span>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-2 text-zinc-600 pl-1 font-sans leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">1. Duyệt Toàn Phần:</span>
                      <span>Kỹ sư/Dev sẽ tích duyệt hồ sơ trên Sheet sau khi xác nhận thanh toán 100%.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">2. Cấp Tài Khoản Ngay:</span>
                      <span>Hệ thống sẽ tự động gửi ngay <b>Mã Code đăng nhập + Mật khẩu + Hướng dẫn chi tiết</b> cùng <b>File PDF hợp đồng đã ký có dấu mộc đỏ Trưởng ban KS. Nguyễn Hoàng Thiện</b> về Gmail của bạn.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">3. Gmail tiếp nhận:</span>
                      <span>Vui lòng kiểm tra hộp thư đến tại Gmail: <b className="text-zinc-950 font-mono">{email}</b>.</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Nút thoát */}
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

      {/* MODAL HIỂN THỊ ẢNH QR CODE CHUYỂN KHOẢN TIMO */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 text-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-bold text-sm text-zinc-950 uppercase">
              Mã QR Thanh Toán & Đặt Cọc
            </h3>

            <div className="p-3 bg-white rounded-xl border border-zinc-200 inline-block shadow-sm">
              <img
                src={QR_CODE_BASE64}
                alt="QR Code Timo - NGUYEN HOANG THIEN"
                className="w-56 h-auto mx-auto object-contain rounded-lg"
              />
            </div>

            <div className="text-xs text-zinc-700 space-y-1">
              <div>Ngân hàng: <b>Timo Digital Bank by BVBank</b></div>
              <div>Số tài khoản: <b className="font-mono text-zinc-950 text-sm">0983396354</b></div>
              <div>Chủ tài khoản: <b className="text-zinc-950">NGUYEN HOANG THIEN</b></div>
              <div className="text-emerald-700 font-bold pt-1">
                Số tiền: {formatVnd(currentPkgInfo.isDeposit ? currentPkgInfo.depositAmount : currentPkgInfo.totalAmount)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="btn-primary w-full py-2 text-xs font-bold cursor-pointer"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}

      {/* MODAL VẼ CHỮ KÝ TAY ĐIỆN TỬ */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={(sigDataUrl) => {
          setSignatureImage(sigDataUrl);
          setFormError(null);
        }}
        initialSignature={signatureImage}
        signerName={fullName.trim() || 'Khách hàng'}
      />
    </div>
  );
};
