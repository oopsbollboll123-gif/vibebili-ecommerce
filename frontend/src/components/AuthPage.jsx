import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UserIcon,
  StoreIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TruckIcon,
  FireIcon
} from './Icons';

function AuthPage({ onNavigateHome, onNavigateSeller, onNavigateAdmin, initialMode = 'login' }) {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isSeller,
    login,
    register,
    registerSeller,
    logout
  } = useAuth();

  // Mode: 'login' | 'register_customer' | 'register_seller'
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    // Dành riêng cho Người Bán (Seller)
    shop_name: '',
    owner_name: '',
    warehouse_address: '',
    business_type: 'Tóc Giả Cao Cấp & Thời Trang Nữ',
    identity_card: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  // Đăng nhập nhanh cho giám khảo (1-Click Demo)
  const handleQuickLogin = async (roleType) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    let email = 'khachhang@gmail.com';
    let roleName = 'Khách Mua Hàng';

    if (roleType === 'superadmin' || roleType === 'admin') {
      email = 'superadmin@admin.com';
      roleName = 'Super Admin (Tối Cao)';
    } else if (roleType === 'moderator' || roleType === 'admin-moderator') {
      email = 'moderator@admin.com';
      roleName = 'Admin Kiểm Duyệt (Moderator)';
    } else if (roleType === 'financial' || roleType === 'admin-financial') {
      email = 'financial@admin.com';
      roleName = 'Admin Tài Chính (Financial)';
    } else if (roleType === 'support' || roleType === 'admin-support') {
      email = 'support@admin.com';
      roleName = 'Admin CSKH & Khiếu Nại';
    } else if (roleType === 'seller') {
      email = 'maitran@shop.com';
      roleName = 'Người Bán (Wig Luxury Sài Gòn)';
    }

    setFormData(prev => ({ ...prev, email, password: 'password123' }));

    const res = await login(email, '123456');
    setLoading(false);
    if (res.success) {
      setSuccessMessage(`✅ Đăng nhập nhanh với quyền [${roleName}] thành công! Đang chuyển hướng...`);
      setTimeout(() => {
        if (roleType === 'seller') {
          onNavigateSeller?.();
        } else if (roleType.startsWith('admin') || roleType === 'superadmin' || roleType === 'moderator' || roleType === 'financial' || roleType === 'support') {
          if (onNavigateAdmin) onNavigateAdmin();
          else onNavigateHome();
        } else {
          onNavigateHome();
        }
      }, 700);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Xử lý submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // 1. Kiểm tra Email chuẩn RFC
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Địa chỉ email không hợp lệ (ví dụ: name@example.com)!');
      setLoading(false);
      return;
    }

    // 2. Kiểm tra Mật khẩu
    if (!formData.password || formData.password.trim().length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự không tính khoảng trắng!');
      setLoading(false);
      return;
    }

    // 3. Regex kiểm tra số điện thoại Việt Nam (10 số, bắt đầu bằng 03, 05, 07, 08, 09)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

    if (mode === 'login') {
      const res = await login(cleanEmail, formData.password);
      setLoading(false);
      if (res.success) {
        setSuccessMessage('✅ Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          if (res.user?.role === 'seller') {
            if (onNavigateSeller) onNavigateSeller();
            else onNavigateHome();
          } else if (res.user?.role?.startsWith('admin') || res.user?.role === 'superadmin') {
            if (onNavigateAdmin) onNavigateAdmin();
            else onNavigateHome();
          } else {
            onNavigateHome();
          }
        }, 500);
      } else {
        setErrorMessage(res.message);
      }
    } else if (mode === 'register_customer') {
      const cleanName = (formData.name || '').trim();
      const cleanPhone = (formData.phone || '').trim().replace(/[\s.-]/g, '');

      if (cleanName.length < 2 || !/[a-zA-ZÀ-ỹ]/.test(cleanName)) {
        setErrorMessage('Họ và tên không hợp lệ! Vui lòng nhập họ và tên thật có ít nhất 2 ký tự.');
        setLoading(false);
        return;
      }

      if (!phoneRegex.test(cleanPhone)) {
        setErrorMessage('Số điện thoại không hợp lệ! Vui lòng nhập đúng số điện thoại 10 chữ số (vd: 0909123456).');
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
        setSuccessMessage('✅ Tạo tài khoản khách hàng thành công! Đang vào trang chủ...');
        setTimeout(() => { onNavigateHome(); }, 700);
      } else {
        setErrorMessage(res.message);
      }
    } else if (mode === 'register_seller') {
      const cleanShop = (formData.shop_name || '').trim();
      const cleanOwner = (formData.owner_name || '').trim();
      const cleanPhone = (formData.phone || '').trim().replace(/[\s.-]/g, '');
      const cleanWarehouse = (formData.warehouse_address || '').trim();
      const cleanCccd = (formData.identity_card || '').trim();

      if (cleanShop.length < 3) {
        setErrorMessage('Tên Gian Hàng / Shop Name phải có ít nhất 3 ký tự!');
        setLoading(false);
        return;
      }
      if (cleanOwner.length < 2 || !/[a-zA-ZÀ-ỹ]/.test(cleanOwner)) {
        setErrorMessage('Họ tên chủ gian hàng không hợp lệ (tối thiểu 2 ký tự)!');
        setLoading(false);
        return;
      }
      if (!phoneRegex.test(cleanPhone)) {
        setErrorMessage('Số điện thoại hotline không hợp lệ! Vui lòng nhập đúng 10 số (vd: 0912345678).');
        setLoading(false);
        return;
      }
      if (cleanWarehouse.length < 5) {
        setErrorMessage('Vui lòng nhập địa chỉ kho xuất hàng cụ thể (tối thiểu 5 ký tự)!');
        setLoading(false);
        return;
      }

      if (cleanCccd && !/^[0-9]{9}$|^[0-9]{12}$/.test(cleanCccd)) {
        setErrorMessage('Số CCCD/CMND không hợp lệ! Vui lòng nhập đúng 9 hoặc 12 chữ số.');
        setLoading(false);
        return;
      }

      const res = await registerSeller({
        shop_name: cleanShop,
        owner_name: cleanOwner,
        email: cleanEmail,
        password: formData.password,
        phone: cleanPhone,
        warehouse_address: cleanWarehouse,
        business_type: formData.business_type,
        identity_card: cleanCccd,
        description: formData.description?.trim() || ''
      });
      setLoading(false);
      if (res.success) {
        setSuccessMessage('🎉 Chúc mừng bạn đã mở Gian Hàng VibeBili Seller thành công! Đang chuyển vào Kênh Người Bán...');
        setTimeout(() => { onNavigateSeller(); }, 800);
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  // Nếu đã đăng nhập — hiển thị trang tài khoản
  if (isAuthenticated && user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-card-lg border border-vibe-border overflow-hidden">
          {/* Profile Header */}
          <div className="bg-vibe-950 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl font-black text-2xl flex items-center justify-center border-2 border-white/20 shadow-lg ${
                isAdmin ? 'bg-purple-600' : isSeller ? 'bg-vibe-accent' : 'bg-vibe-700'
              }`}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{user.name}</h1>
                  <span className={`text-2xs font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                    isAdmin ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' :
                    isSeller ? 'bg-vibe-accent/30 text-orange-200 border border-orange-400/40' :
                    'bg-white/10 text-vibe-300 border border-white/20'
                  }`}>{user.role}</span>
                </div>
                <p className="text-vibe-400 text-xs mt-1">{user.email}</p>
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
              className="bg-red-600/80 hover:bg-red-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-colors border border-red-500/40"
            >
              Đăng Xuất Tài Khoản
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <span>✅</span><span>{successMessage}</span>
              </div>
            )}

            <h2 className="text-sm font-semibold text-vibe-ink border-b border-vibe-border pb-3">
              Truy cập nhanh
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={onNavigateHome}
                className="p-5 rounded-2xl border border-vibe-border hover:border-vibe-ink cursor-pointer transition-all bg-vibe-50 hover:bg-white group shadow-card hover:shadow-card-md"
              >
                <div className="w-10 h-10 rounded-xl bg-vibe-ink text-white flex items-center justify-center mb-3">
                  <TruckIcon className="w-5 h-5 text-vibe-accent" />
                </div>
                <h3 className="font-semibold text-sm text-vibe-ink group-hover:text-vibe-accent transition-colors">
                  Mua Sắm Khách Hàng
                </h3>
                <p className="text-xs text-vibe-muted mt-1">
                  Khám phá BST Tóc giả & Thời trang xu hướng
                </p>
              </div>

              {isSeller ? (
                <div
                  onClick={onNavigateSeller}
                  className="p-5 rounded-2xl border-2 border-vibe-accent hover:border-vibe-accent-hover cursor-pointer transition-all bg-orange-50/50 hover:bg-orange-50 group shadow-card hover:shadow-card-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-vibe-accent text-white flex items-center justify-center mb-3">
                    <StoreIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-orange-900 group-hover:text-orange-700 transition-colors">
                    Vào Kênh Người Bán
                  </h3>
                  <p className="text-xs text-orange-700/80 mt-1">
                    Quản lý sản phẩm SKU, đơn hàng và kho vận gian hàng
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => setMode('register_seller')}
                  className="p-5 rounded-2xl border border-dashed border-vibe-accent/60 hover:border-vibe-accent cursor-pointer transition-all bg-orange-50/30 hover:bg-orange-50 group shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-vibe-accent text-white flex items-center justify-center mb-3">
                    <StoreIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-orange-900 group-hover:text-orange-700 transition-colors">
                    Đăng Ký Mở Shop Bán Hàng
                  </h3>
                  <p className="text-xs text-orange-700/80 mt-1">
                    Trở thành Seller VibeBili, tiếp cận 100K+ khách hàng
                  </p>
                </div>
              )}

              {isAdmin && (
                <div
                  onClick={onNavigateAdmin}
                  className="p-5 rounded-2xl border-2 border-purple-400 hover:border-purple-600 cursor-pointer transition-all bg-purple-50/50 hover:bg-purple-50 group shadow-card hover:shadow-card-md"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center mb-3">
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-purple-900 group-hover:text-purple-700 transition-colors">
                    Quản Trị Hệ Thống
                  </h3>
                  <p className="text-xs text-purple-700/80 mt-1">
                    Vào Admin Panel — RBAC {user.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form đăng nhập / đăng ký (chưa xác thực)
  return (
    <div className="min-h-[85vh] bg-vibe-surface flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-card-lg overflow-hidden border border-vibe-border grid grid-cols-1 lg:grid-cols-12">

        {/* CỘT TRÁI: Brand Hero */}
        <div className="lg:col-span-5 bg-vibe-950 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-vibe-accent/8 rounded-full blur-3xl pointer-events-none"></div>

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
               mode === 'register_customer' ? 'Tạo tài khoản mua sắm' :
               'Mở gian hàng của bạn'}
            </h2>
            <p className="text-vibe-400 text-sm leading-relaxed">
              {mode === 'login'
                ? 'Đăng nhập để tiếp tục trải nghiệm mua sắm & theo dõi đơn hàng của bạn.'
                : mode === 'register_customer'
                ? 'Tạo tài khoản miễn phí để nhận voucher 100K và theo dõi đơn hàng dễ dàng.'
                : 'Đăng ký gian hàng VibeBili Seller — tiếp cận hàng ngàn khách hàng tiềm năng.'}
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-4 text-sm">
              {[
                { icon: <SparklesIcon className="w-4 h-4" />, title: 'Thử Đồ AI 2-in-1 Độc Quyền', sub: 'Ướm đồng thời tóc giả & váy áo chuẩn tỉ lệ cơ thể' },
                { icon: <TruckIcon className="w-4 h-4" />, title: 'Miễn Phí Vận Chuyển Toàn Quốc', sub: 'Freeship cho đơn hàng từ 500.000đ' },
                { icon: <StoreIcon className="w-4 h-4" />, title: 'Hệ Thống Gian Hàng Seller Uy Tín', sub: 'Xác thực KYC nghiêm ngặt, cam kết tóc thật 100%' },
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
              <span>Bảo mật chuẩn mã hóa SSL 256-bit</span>
            </div>
            <p className="text-2xs text-vibe-600 mt-1.5 leading-relaxed">
              Mọi dữ liệu cá nhân, mật khẩu và thông tin kho vận được lưu trữ và bảo vệ nghiêm ngặt.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: Form */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center">

          {/* Tabs */}
          <div className="flex border-b border-vibe-border mb-6 overflow-x-auto no-scrollbar gap-1">
            <button
              onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`pb-3 px-4 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                mode === 'login'
                  ? 'border-vibe-ink text-vibe-ink'
                  : 'border-transparent text-vibe-muted hover:text-vibe-ink'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setMode('register_customer'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`pb-3 px-4 text-sm font-semibold transition-all whitespace-nowrap border-b-2 ${
                mode === 'register_customer'
                  ? 'border-vibe-ink text-vibe-ink'
                  : 'border-transparent text-vibe-muted hover:text-vibe-ink'
              }`}
            >
              Đăng Ký Khách Mua
            </button>
            <button
              onClick={() => { setMode('register_seller'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`pb-3 px-4 text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border-b-2 ${
                mode === 'register_seller'
                  ? 'border-vibe-accent text-vibe-accent'
                  : 'border-transparent text-vibe-accent/70 hover:text-vibe-accent'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>Đăng Ký Người Bán</span>
            </button>
          </div>

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

          {/* Quick Demo Login */}
          {mode === 'login' && (
            <div className="bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 rounded-2xl p-4 mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>🔑</span>
                  <span>Đăng Nhập Nhanh Demo (1-Click):</span>
                </span>
                <span className="text-2xs bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">Demo</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleQuickLogin('customer')}
                  className="bg-white hover:bg-vibe-50 border border-vibe-border text-vibe-ink text-xs font-semibold py-2 px-3 rounded-xl transition shadow-card flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span>👤</span><span>Khách Hàng</span></span>
                  <span className="text-2xs text-vibe-subtle font-mono">khachhang@</span>
                </button>
                <button type="button" onClick={() => handleQuickLogin('seller')}
                  className="bg-white hover:bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold py-2 px-3 rounded-xl transition shadow-card flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><span>🏪</span><span>Người Bán</span></span>
                  <span className="text-2xs text-orange-400 font-mono">maitran@</span>
                </button>
              </div>

              <div className="border-t border-amber-200/60 pt-2.5">
                <div className="text-2xs font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>🛡️</span><span>Quản Trị Viên RBAC (4 phân hệ):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { key: 'superadmin', label: '👑 Super Admin', cls: 'bg-purple-100 hover:bg-purple-700 border-purple-300 text-purple-900' },
                    { key: 'moderator', label: '🛡️ Moderator', cls: 'bg-blue-100 hover:bg-blue-700 border-blue-300 text-blue-900' },
                    { key: 'financial', label: '💰 Financial', cls: 'bg-green-100 hover:bg-green-700 border-green-300 text-green-900' },
                    { key: 'support', label: '🎧 CSKH', cls: 'bg-amber-100 hover:bg-amber-700 border-amber-300 text-amber-900' },
                  ].map((r) => (
                    <button key={r.key} type="button"
                      onClick={() => handleQuickLogin(r.key)}
                      className={`${r.cls} hover:text-white border text-2xs font-bold py-1.5 px-2 rounded-lg text-center transition`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Seller-only fields */}
            {mode === 'register_seller' && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wide flex items-center gap-1.5">
                  <StoreIcon className="w-4 h-4" /> Thông Tin Gian Hàng
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-vibe-700 mb-1">Tên Gian Hàng / Shop *</label>
                    <input type="text" name="shop_name" required
                      placeholder="Wig Luxury Sài Gòn..."
                      value={formData.shop_name} onChange={handleChange}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-vibe-700 mb-1">Họ tên chủ sở hữu *</label>
                    <input type="text" name="owner_name" required
                      placeholder="Nguyễn Văn A"
                      value={formData.owner_name} onChange={handleChange}
                      className="input" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-vibe-700 mb-1">Loại hình kinh doanh</label>
                  <select name="business_type" value={formData.business_type} onChange={handleChange} className="input">
                    <option>Tóc Giả Cao Cấp & Thời Trang Nữ</option>
                    <option>Chuyên Tóc Giả Cao Cấp</option>
                    <option>Thời Trang Nữ (Outfit)</option>
                    <option>Thời Trang Nam</option>
                    <option>Combo Tóc Giả + Thời Trang</option>
                    <option>Phụ Kiện Làm Tóc & Mỹ Phẩm</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-vibe-700 mb-1">Số CCCD / Mã số kinh doanh</label>
                    <input type="text" name="identity_card"
                      placeholder="079xxxxxxxxxx"
                      value={formData.identity_card} onChange={handleChange}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-vibe-700 mb-1">Địa chỉ kho lấy hàng *</label>
                    <input type="text" name="warehouse_address" required
                      placeholder="Số nhà, Đường, Phường, Quận, TP"
                      value={formData.warehouse_address} onChange={handleChange}
                      className="input" />
                  </div>
                </div>
              </div>
            )}

            {/* Customer name field */}
            {mode === 'register_customer' && (
              <div>
                <label className="block text-xs font-semibold text-vibe-700 mb-1">Họ và Tên *</label>
                <input type="text" name="name" required
                  placeholder="Vd: Hoàng Yến Nhi"
                  value={formData.name} onChange={handleChange}
                  className="input" />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-vibe-700 mb-1">
                {mode === 'register_seller' ? 'Email Đăng Nhập Quản Trị Gian Hàng *' : 'Địa chỉ Email *'}
              </label>
              <input type="email" name="email" required
                placeholder="email@example.com"
                value={formData.email} onChange={handleChange}
                className="input" />
            </div>

            {/* Phone */}
            {(mode === 'register_customer' || mode === 'register_seller') && (
              <div>
                <label className="block text-xs font-semibold text-vibe-700 mb-1">Số Điện Thoại Liên Hệ *</label>
                <input type="tel" name="phone" required
                  placeholder="09xxxxxxxx"
                  value={formData.phone} onChange={handleChange}
                  className="input" />
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-vibe-700">Mật khẩu *</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-vibe-muted hover:text-vibe-ink font-medium">
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <input type={showPassword ? 'text' : 'password'} name="password" required
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password} onChange={handleChange}
                className="input" />
            </div>

            {/* Address for customer */}
            {mode === 'register_customer' && (
              <div>
                <label className="block text-xs font-semibold text-vibe-700 mb-1">Địa chỉ nhận hàng mặc định</label>
                <input type="text" name="address"
                  placeholder="Số nhà, Đường, Phường, Quận, TP (tùy chọn)"
                  value={formData.address} onChange={handleChange}
                  className="input" />
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" disabled={loading}
              className={`w-full font-semibold py-3 rounded-full text-sm transition-all shadow-btn-md mt-2 flex items-center justify-center gap-2 ${
                mode === 'register_seller'
                  ? 'bg-vibe-accent hover:bg-vibe-accent-hover text-white'
                  : 'bg-vibe-ink hover:bg-vibe-800 text-white'
              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Đang xử lý...</>
              ) : (
                mode === 'login' ? '→ Đăng Nhập' :
                mode === 'register_customer' ? '→ Tạo Tài Khoản Miễn Phí' :
                '→ Mở Gian Hàng VibeBili Seller'
              )}
            </button>

            {/* Footer links */}
            <div className="text-center text-xs text-vibe-muted pt-2">
              {mode === 'login' ? (
                <>Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => { setMode('register_customer'); setErrorMessage(''); }}
                    className="text-vibe-ink font-semibold hover:text-vibe-accent transition-colors">
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>Đã có tài khoản?{' '}
                  <button type="button" onClick={() => { setMode('login'); setErrorMessage(''); }}
                    className="text-vibe-ink font-semibold hover:text-vibe-accent transition-colors">
                    Đăng nhập
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
