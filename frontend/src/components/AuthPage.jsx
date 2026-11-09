import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import SellerRegistrationForm from './SellerRegistrationForm';
import {
  UserIcon,
  StoreIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
  FireIcon
} from './Icons';

// ============================================================
// AUTH PAGE — Trang đăng nhập / đăng ký thống nhất VibeBili
// ============================================================
// Mode: 'login' | 'register' | 'forgot' | 'otp' | 'reset'
// - Không có tab Đăng Ký Người Bán (đã chuyển sang hồ sơ cá nhân)
// - Không có Demo Quick Login
// - Admin chỉ có 1 tài khoản cứng: oopsbollboll123@gmail.com
// ============================================================

function AuthPage({ onNavigateHome, onNavigateSeller, onNavigateAdmin, initialMode = 'login' }) {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isSeller,
    login,
    register,
    upgradeToSeller,
    logout
  } = useAuth();

  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSellerForm, setShowSellerForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    address: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // OTP: lưu tạm OTP đã gửi (chỉ frontend fallback khi backend offline)
  const [pendingResetEmail, setPendingResetEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      address: '',
      otp: '',
      newPassword: '',
      confirmNewPassword: ''
    });
  };

  // ── VALIDATORS ──────────────────────────────────────────────
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
  const passwordStrong = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

  // ── SUBMIT HANDLER ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanPhone = (formData.phone || '').trim().replace(/[\s.-]/g, '');
    const cleanName = (formData.name || '').trim();

    // ── ĐĂNG NHẬP ──────────────────────────────────────────
    if (mode === 'login') {
      if (!emailRegex.test(cleanEmail)) {
        setErrorMessage('Địa chỉ email không hợp lệ (ví dụ: name@example.com)!');
        setLoading(false);
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự!');
        setLoading(false);
        return;
      }

      const res = await login(cleanEmail, formData.password);
      setLoading(false);
      if (res.success) {
        setSuccessMessage('✅ Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          if (res.user?.role === 'seller') {
            onNavigateSeller?.() || onNavigateHome?.();
          } else if (res.user?.role?.includes('admin') || res.user?.role === 'superadmin') {
            onNavigateAdmin?.() || onNavigateHome?.();
          } else {
            onNavigateHome?.();
          }
        }, 500);
      } else {
        setErrorMessage(res.message);
      }
    }

    // ── ĐĂNG KÝ ────────────────────────────────────────────
    else if (mode === 'register') {
      // Validate họ tên
      if (cleanName.length < 2 || !/[a-zA-ZÀ-ỹ]/.test(cleanName)) {
        setErrorMessage('Họ và tên không hợp lệ! Vui lòng nhập tên thật (ít nhất 2 ký tự, có chữ cái).');
        setLoading(false);
        return;
      }
      // Validate email
      if (!emailRegex.test(cleanEmail)) {
        setErrorMessage('Địa chỉ email không hợp lệ (ví dụ: name@example.com)!');
        setLoading(false);
        return;
      }
      // Chặn email admin đăng ký thủ công
      if (cleanEmail === 'oopsbollboll123@gmail.com') {
        setErrorMessage('Email này đã được đăng ký. Vui lòng sử dụng email khác.');
        setLoading(false);
        return;
      }
      // Validate số điện thoại
      if (!phoneRegex.test(cleanPhone)) {
        setErrorMessage('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số bắt đầu bằng 03/05/07/08/09.');
        setLoading(false);
        return;
      }
      // Validate mật khẩu mạnh
      if (!passwordStrong.test(formData.password)) {
        setErrorMessage('Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số (ví dụ: Abc12345)!');
        setLoading(false);
        return;
      }
      // Xác nhận mật khẩu
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
        setLoading(false);
        return;
      }

      const res = await register({
        name: cleanName,
        email: cleanEmail,
        password: formData.password,
        phone: cleanPhone,
        address: formData.address?.trim() || '',
        role: 'customer'
      });
      setLoading(false);
      if (res.success) {
        setSuccessMessage('✅ Tạo tài khoản thành công! Đang vào trang chủ...');
        setTimeout(() => { onNavigateHome?.(); }, 700);
      } else {
        setErrorMessage(res.message);
      }
    }

    // ── QUÊN MẬT KHẨU: Gửi OTP ────────────────────────────
    else if (mode === 'forgot') {
      if (!emailRegex.test(cleanEmail)) {
        setErrorMessage('Địa chỉ email không hợp lệ!');
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.forgotPassword(cleanEmail);
        setLoading(false);
        if (res && res.success) {
          setPendingResetEmail(cleanEmail);
          setSuccessMessage(`✅ Mã OTP đã được gửi đến ${cleanEmail}. Vui lòng kiểm tra hộp thư (và thư mục spam).`);
          setTimeout(() => { switchMode('otp'); }, 1200);
        } else {
          setErrorMessage(res?.message || 'Không tìm thấy tài khoản với email này!');
        }
      } catch {
        setLoading(false);
        setErrorMessage('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
      }
    }

    // ── XÁC THỰC OTP ───────────────────────────────────────
    else if (mode === 'otp') {
      const cleanOtp = (formData.otp || '').trim();
      if (!/^\d{6}$/.test(cleanOtp)) {
        setErrorMessage('Mã OTP phải là 6 chữ số!');
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.verifyOTP(pendingResetEmail || cleanEmail, cleanOtp);
        setLoading(false);
        if (res && res.success) {
          setSuccessMessage('✅ Mã OTP hợp lệ! Vui lòng nhập mật khẩu mới.');
          setTimeout(() => { setMode('reset'); }, 800);
        } else {
          setErrorMessage(res?.message || 'Mã OTP không đúng hoặc đã hết hạn (10 phút)!');
        }
      } catch {
        setLoading(false);
        setErrorMessage('Không thể kết nối máy chủ. Vui lòng thử lại.');
      }
    }

    // ── ĐẶT LẠI MẬT KHẨU ──────────────────────────────────
    else if (mode === 'reset') {
      if (!passwordStrong.test(formData.newPassword)) {
        setErrorMessage('Mật khẩu mới phải có ít nhất 8 ký tự, gồm cả chữ và số!');
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp!');
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.resetPassword({
          email: pendingResetEmail,
          otp: formData.otp,
          newPassword: formData.newPassword
        });
        setLoading(false);
        if (res && res.success) {
          setSuccessMessage('✅ Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.');
          setPendingResetEmail('');
          setTimeout(() => { switchMode('login'); }, 1500);
        } else {
          setErrorMessage(res?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại từ đầu.');
        }
      } catch {
        setLoading(false);
        setErrorMessage('Không thể kết nối máy chủ. Vui lòng thử lại.');
      }
    }
  };

  // ============================================================
  // ĐÃ ĐĂNG NHẬP — TRANG HỒ SƠ CÁ NHÂN
  // ============================================================
  if (isAuthenticated && user) {
    // Nếu đang hiển thị form đăng ký seller
    if (showSellerForm && !isSeller) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl shadow-card-lg border border-vibe-border p-6 md:p-8">
            <SellerRegistrationForm
              onSuccess={(updatedUser) => {
                setShowSellerForm(false);
                // Chuyển tới kênh người bán sau khi thành công
                setTimeout(() => { onNavigateSeller?.(); }, 500);
              }}
              onCancel={() => setShowSellerForm(false)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-3xl shadow-card-lg border border-vibe-border overflow-hidden">

          {/* Profile Header */}
          <div className="bg-vibe-950 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl font-black text-2xl flex items-center justify-center border-2 border-white/20 shadow-lg flex-shrink-0 ${
                isAdmin ? 'bg-purple-600' : isSeller ? 'bg-vibe-accent' : 'bg-vibe-700'
              }`}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold">{user.name}</h1>
                  <span className={`text-2xs font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    isAdmin ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' :
                    isSeller ? 'bg-vibe-accent/30 text-orange-200 border border-orange-400/40' :
                    'bg-white/10 text-vibe-300 border border-white/20'
                  }`}>{user.role}</span>
                </div>
                <p className="text-vibe-400 text-xs mt-0.5">{user.email}</p>
                {user.phone && <p className="text-vibe-500 text-xs mt-0.5">📞 {user.phone}</p>}
                {user.shop_name && (
                  <p className="text-vibe-accent text-xs font-semibold mt-0.5">🏪 {user.shop_name}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setSuccessMessage('Đã đăng xuất an toàn khỏi hệ thống!');
              }}
              className="bg-red-600/80 hover:bg-red-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors border border-red-500/40 flex-shrink-0"
            >
              Đăng Xuất
            </button>
          </div>

          <div className="p-5 md:p-8 space-y-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <span>✅</span><span>{successMessage}</span>
              </div>
            )}

            {/* Quick access cards */}
            <div>
              <h2 className="text-sm font-semibold text-vibe-ink border-b border-vibe-border pb-3 mb-4">
                Truy cập nhanh
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Mua sắm */}
                <div
                  onClick={onNavigateHome}
                  className="p-5 rounded-2xl border border-vibe-border hover:border-vibe-ink cursor-pointer transition-all bg-vibe-50 hover:bg-white group shadow-card hover:shadow-card-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-vibe-ink text-white flex items-center justify-center mb-3">
                    <TruckIcon className="w-5 h-5 text-vibe-accent" />
                  </div>
                  <h3 className="font-semibold text-sm text-vibe-ink group-hover:text-vibe-accent transition-colors">Mua Sắm</h3>
                  <p className="text-xs text-vibe-muted mt-1">Khám phá BST Tóc giả & Thời trang</p>
                </div>

                {/* Kênh người bán */}
                {isSeller ? (
                  <div
                    onClick={onNavigateSeller}
                    className="p-5 rounded-2xl border-2 border-vibe-accent hover:border-vibe-accent-hover cursor-pointer transition-all bg-orange-50/50 hover:bg-orange-50 group shadow-card hover:shadow-card-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-vibe-accent text-white flex items-center justify-center mb-3">
                      <StoreIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-orange-900 group-hover:text-orange-700 transition-colors">Kênh Người Bán</h3>
                    <p className="text-xs text-orange-700/80 mt-1">Quản lý sản phẩm, đơn hàng, kho vận</p>
                  </div>
                ) : (
                  /* Đăng ký mở shop — CHỈ HIỆN KHI CHƯA LÀ SELLER */
                  <div
                    onClick={() => setShowSellerForm(true)}
                    className="p-5 rounded-2xl border border-dashed border-vibe-accent/60 hover:border-vibe-accent cursor-pointer transition-all bg-orange-50/30 hover:bg-orange-50 group shadow-card"
                  >
                    <div className="w-10 h-10 rounded-xl bg-vibe-accent text-white flex items-center justify-center mb-3">
                      <StoreIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-orange-900 group-hover:text-orange-700 transition-colors">Đăng Ký Mở Shop</h3>
                    <p className="text-xs text-orange-700/80 mt-1">Trở thành Seller VibeBili — tiếp cận khách hàng</p>
                  </div>
                )}

                {/* Admin Panel */}
                {isAdmin && (
                  <div
                    onClick={onNavigateAdmin}
                    className="p-5 rounded-2xl border-2 border-purple-400 hover:border-purple-600 cursor-pointer transition-all bg-purple-50/50 hover:bg-purple-50 group shadow-card hover:shadow-card-md"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center mb-3">
                      <ShieldCheckIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm text-purple-900 group-hover:text-purple-700 transition-colors">Quản Trị Hệ Thống</h3>
                    <p className="text-xs text-purple-700/80 mt-1">Admin Panel — {user.role}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin tài khoản */}
            <div>
              <h2 className="text-sm font-semibold text-vibe-ink border-b border-vibe-border pb-3 mb-4">
                Thông tin tài khoản
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-vibe-700">
                <div className="bg-vibe-50 rounded-xl p-4 space-y-2">
                  <p><span className="text-vibe-muted">Họ tên:</span> <strong>{user.name}</strong></p>
                  <p><span className="text-vibe-muted">Email:</span> <strong>{user.email}</strong></p>
                  <p><span className="text-vibe-muted">SĐT:</span> <strong>{user.phone || '—'}</strong></p>
                </div>
                <div className="bg-vibe-50 rounded-xl p-4 space-y-2">
                  <p><span className="text-vibe-muted">Vai trò:</span> <strong>{user.role}</strong></p>
                  <p><span className="text-vibe-muted">Địa chỉ:</span> <strong>{user.address || '—'}</strong></p>
                  {user.shop_name && (
                    <p><span className="text-vibe-muted">Gian hàng:</span> <strong>{user.shop_name}</strong></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // CHƯA ĐĂNG NHẬP — FORM AUTH
  // ============================================================
  return (
    <div className="min-h-[85vh] bg-vibe-surface flex items-center justify-center px-4 py-8 md:py-12">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-card-lg overflow-hidden border border-vibe-border grid grid-cols-1 lg:grid-cols-12">

        {/* CỘT TRÁI: Brand Hero */}
        <div className="lg:col-span-5 bg-vibe-950 p-7 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-vibe-accent/8 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Logo */}
            <div className="text-3xl font-black uppercase tracking-tight mb-1">
              VIBE<span className="text-vibe-accent">BILI</span>
              <span className="text-lg font-bold text-vibe-500 lowercase">.vn</span>
            </div>
            <p className="text-vibe-accent text-sm italic font-light mb-6">
              "Biến hóa mỗi ngày, trọn vẹn phong cách"
            </p>

            <h2 className="text-xl font-bold text-white mb-2">
              {mode === 'login' ? 'Chào mừng trở lại!' :
               mode === 'register' ? 'Tạo tài khoản mua sắm' :
               mode === 'forgot' ? 'Khôi phục mật khẩu' :
               mode === 'otp' ? 'Nhập mã xác thực' :
               'Đặt mật khẩu mới'}
            </h2>
            <p className="text-vibe-400 text-sm leading-relaxed">
              {mode === 'login'
                ? 'Đăng nhập để tiếp tục trải nghiệm mua sắm & theo dõi đơn hàng.'
                : mode === 'register'
                ? 'Tạo tài khoản miễn phí để nhận ưu đãi và theo dõi đơn hàng.'
                : mode === 'forgot'
                ? 'Nhập email đã đăng ký — chúng tôi sẽ gửi mã OTP để xác thực.'
                : mode === 'otp'
                ? 'Nhập mã 6 chữ số đã được gửi vào email của bạn.'
                : 'Nhập mật khẩu mới cho tài khoản của bạn.'}
            </p>

            {/* Features */}
            <div className="mt-8 space-y-4 text-sm">
              {[
                { icon: <SparklesIcon className="w-4 h-4" />, title: 'Thử Đồ AI 2-in-1 Độc Quyền', sub: 'Ướm đồng thời tóc giả & váy áo chuẩn tỉ lệ' },
                { icon: <TruckIcon className="w-4 h-4" />, title: 'Freeship Toàn Quốc', sub: 'Miễn phí vận chuyển cho đơn từ 500.000đ' },
                { icon: <StoreIcon className="w-4 h-4" />, title: 'Gian Hàng Seller Uy Tín', sub: 'Xác thực KYC nghiêm ngặt, cam kết tóc thật 100%' },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 text-vibe-300">
                  <div className="w-7 h-7 rounded-full bg-vibe-accent/20 text-vibe-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    {f.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs">{f.title}</div>
                    <div className="text-2xs text-vibe-500 mt-0.5">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security badge */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-green-400 font-semibold text-xs">
              <ShieldCheckIcon className="w-4 h-4 text-green-400" />
              <span>Bảo mật SSL 256-bit + Mã hóa mật khẩu</span>
            </div>
            <p className="text-2xs text-vibe-600 mt-1.5 leading-relaxed">
              Mật khẩu được mã hóa bcrypt. Dữ liệu cá nhân được lưu trữ và bảo vệ nghiêm ngặt theo chuẩn PDPA Việt Nam.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: Form */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center">

          {/* Alerts */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-xl mb-4 flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── MODE: ĐĂNG NHẬP ─────────────────────────── */}
            {mode === 'login' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Địa chỉ Email *</label>
                  <input type="email" name="email" required autoComplete="email"
                    placeholder="email@example.com"
                    value={formData.email} onChange={handleChange}
                    className="input" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-vibe-700">Mật khẩu *</label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-vibe-muted hover:text-vibe-ink font-medium">
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  <input type={showPassword ? 'text' : 'password'} name="password" required autoComplete="current-password"
                    placeholder="Mật khẩu của bạn"
                    value={formData.password} onChange={handleChange}
                    className="input" />
                </div>
                {/* Quên mật khẩu */}
                <div className="text-right">
                  <button type="button" onClick={() => switchMode('forgot')}
                    className="text-xs text-vibe-muted hover:text-vibe-accent font-medium transition-colors">
                    Quên mật khẩu?
                  </button>
                </div>
              </>
            )}

            {/* ── MODE: ĐĂNG KÝ ───────────────────────────── */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Họ và Tên *</label>
                  <input type="text" name="name" required autoComplete="name"
                    placeholder="VD: Nguyễn Thị Lan Anh"
                    value={formData.name} onChange={handleChange}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Địa chỉ Email *</label>
                  <input type="email" name="email" required autoComplete="email"
                    placeholder="email@example.com"
                    value={formData.email} onChange={handleChange}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Số Điện Thoại *</label>
                  <input type="tel" name="phone" required autoComplete="tel"
                    placeholder="09xxxxxxxx (10 số)"
                    value={formData.phone} onChange={handleChange}
                    className="input" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-vibe-700">Mật khẩu *</label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-vibe-muted hover:text-vibe-ink font-medium">
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  <input type={showPassword ? 'text' : 'password'} name="password" required autoComplete="new-password"
                    placeholder="Ít nhất 8 ký tự, gồm chữ và số (VD: Abc12345)"
                    value={formData.password} onChange={handleChange}
                    className="input" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-vibe-700">Xác nhận Mật khẩu *</label>
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-xs text-vibe-muted hover:text-vibe-ink font-medium">
                      {showConfirmPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword} onChange={handleChange}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">
                    Địa chỉ nhận hàng <span className="text-vibe-muted font-normal">(tùy chọn)</span>
                  </label>
                  <input type="text" name="address" autoComplete="street-address"
                    placeholder="Số nhà, Đường, Phường, Quận, TP"
                    value={formData.address} onChange={handleChange}
                    className="input" />
                </div>
              </>
            )}

            {/* ── MODE: QUÊN MẬT KHẨU ─────────────────────── */}
            {mode === 'forgot' && (
              <>
                <p className="text-xs text-vibe-muted bg-blue-50 border border-blue-200 rounded-xl p-3">
                  💡 Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 chữ số có hiệu lực <strong>10 phút</strong>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Địa chỉ Email đã đăng ký *</label>
                  <input type="email" name="email" required
                    placeholder="email@example.com"
                    value={formData.email} onChange={handleChange}
                    className="input" />
                </div>
              </>
            )}

            {/* ── MODE: NHẬP OTP ───────────────────────────── */}
            {mode === 'otp' && (
              <>
                <p className="text-xs text-vibe-muted bg-blue-50 border border-blue-200 rounded-xl p-3">
                  📧 Mã OTP đã được gửi đến <strong>{pendingResetEmail}</strong>. Mã có hiệu lực trong 10 phút.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Mã OTP (6 chữ số) *</label>
                  <input type="text" name="otp" required maxLength={6}
                    placeholder="Nhập mã 6 chữ số"
                    value={formData.otp} onChange={handleChange}
                    className="input text-center tracking-widest text-lg font-mono" />
                </div>
                <button type="button"
                  onClick={() => { setPendingResetEmail(''); switchMode('forgot'); }}
                  className="text-xs text-vibe-muted hover:text-vibe-accent transition-colors">
                  Không nhận được mã? Gửi lại
                </button>
              </>
            )}

            {/* ── MODE: ĐẶT LẠI MẬT KHẨU ─────────────────── */}
            {mode === 'reset' && (
              <>
                <p className="text-xs text-vibe-muted bg-green-50 border border-green-200 rounded-xl p-3">
                  ✅ Xác thực thành công! Vui lòng nhập mật khẩu mới (ít nhất 8 ký tự, gồm chữ và số).
                </p>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-vibe-700">Mật khẩu mới *</label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-vibe-muted hover:text-vibe-ink font-medium">
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                  <input type={showPassword ? 'text' : 'password'} name="newPassword" required
                    placeholder="Ít nhất 8 ký tự, gồm chữ và số"
                    value={formData.newPassword} onChange={handleChange}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Xác nhận mật khẩu mới *</label>
                  <input type="password" name="confirmNewPassword" required
                    placeholder="Nhập lại mật khẩu mới"
                    value={formData.confirmNewPassword} onChange={handleChange}
                    className="input" />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading}
              className={`w-full font-semibold py-3 rounded-full text-sm transition-all shadow-btn-md mt-1 flex items-center justify-center gap-2 bg-vibe-ink hover:bg-vibe-800 text-white ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</>
              ) : (
                mode === 'login' ? '→ Đăng Nhập' :
                mode === 'register' ? '→ Tạo Tài Khoản Miễn Phí' :
                mode === 'forgot' ? '→ Gửi Mã OTP' :
                mode === 'otp' ? '→ Xác Thực Mã OTP' :
                '→ Đặt Lại Mật Khẩu'
              )}
            </button>

            {/* Footer links */}
            <div className="text-center text-xs text-vibe-muted pt-1 space-y-2">
              {mode === 'login' && (
                <p>Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => switchMode('register')}
                    className="text-vibe-ink font-semibold hover:text-vibe-accent transition-colors">
                    Đăng ký ngay
                  </button>
                </p>
              )}
              {mode === 'register' && (
                <p>Đã có tài khoản?{' '}
                  <button type="button" onClick={() => switchMode('login')}
                    className="text-vibe-ink font-semibold hover:text-vibe-accent transition-colors">
                    Đăng nhập
                  </button>
                </p>
              )}
              {(mode === 'forgot' || mode === 'otp' || mode === 'reset') && (
                <button type="button" onClick={() => switchMode('login')}
                  className="text-vibe-ink font-semibold hover:text-vibe-accent transition-colors">
                  ← Quay lại Đăng nhập
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
