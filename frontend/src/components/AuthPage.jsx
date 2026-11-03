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

  // Nút Đăng nhập Nhanh dành cho Giám Khảo & Chấm điểm (1-Click Demo)
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
      setSuccessMessage(`🎉 Đăng nhập nhanh với quyền [${roleName}] thành công! Đang chuyển hướng...`);
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

    // Kiểm tra định dạng Email và Mật khẩu nghiêm ngặt
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Địa chỉ email không đúng định dạng (vd: user@example.com)!');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự để bảo vệ tài khoản!');
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const res = await login(formData.email, formData.password);
      setLoading(false);
      if (res.success) {
        setSuccessMessage('🎉 Đăng nhập thành công! Đang chuyển hướng...');
        setTimeout(() => {
          if (res.user?.role === 'seller') {
            onNavigateSeller();
          } else {
            onNavigateHome();
          }
        }, 600);
      } else {
        setErrorMessage(res.message);
      }
    } else if (mode === 'register_customer') {
      if (!formData.name?.trim()) {
        setErrorMessage('Vui lòng nhập họ và tên của bạn!');
        setLoading(false);
        return;
      }
      if (!formData.phone?.trim()) {
        setErrorMessage('Vui lòng nhập số điện thoại để nhận thông báo đơn hàng!');
        setLoading(false);
        return;
      }

      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        address: formData.address,
        role: 'customer'
      });
      setLoading(false);
      if (res.success) {
        setSuccessMessage('🎉 Tạo tài khoản khách hàng thành công! Đang vào trang chủ...');
        setTimeout(() => {
          onNavigateHome();
        }, 700);
      } else {
        setErrorMessage(res.message);
      }
    } else if (mode === 'register_seller') {
      if (!formData.shop_name?.trim()) {
        setErrorMessage('Vui lòng nhập Tên Gian Hàng / Shop Name!');
        setLoading(false);
        return;
      }
      if (!formData.owner_name?.trim()) {
        setErrorMessage('Vui lòng nhập Họ tên chủ sở hữu gian hàng!');
        setLoading(false);
        return;
      }
      if (!formData.phone?.trim()) {
        setErrorMessage('Vui lòng nhập Số điện thoại hotline gian hàng!');
        setLoading(false);
        return;
      }
      if (!formData.warehouse_address?.trim()) {
        setErrorMessage('Vui lòng nhập Địa chỉ kho xuất hàng & đổi trả!');
        setLoading(false);
        return;
      }

      // Đăng ký mở Gian Hàng Seller thật sự
      const res = await registerSeller({
        shop_name: formData.shop_name.trim(),
        owner_name: formData.owner_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        warehouse_address: formData.warehouse_address.trim(),
        business_type: formData.business_type,
        identity_card: formData.identity_card?.trim(),
        description: formData.description?.trim()
      });
      setLoading(false);
      if (res.success) {
        setSuccessMessage('🚀 Chúc mừng bạn đã mở Gian Hàng VibeBili Seller thành công! Đang chuyển vào Kênh Người Bán...');
        setTimeout(() => {
          onNavigateSeller();
        }, 800);
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  // Nếu người dùng đã đăng nhập, hiển thị Card thông tin tài khoản & nút Đăng xuất rõ ràng
  if (isAuthenticated && user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-neutral-950 via-zinc-900 to-black p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-orange-600 text-white font-black text-2xl flex items-center justify-center border-2 border-white/20 shadow-lg">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-black">{user.name}</h1>
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded tracking-wider ${
                    isAdmin ? 'bg-purple-500 text-white' :
                    isSeller ? 'bg-orange-500 text-white' :
                    'bg-gray-700 text-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-1">{user.email}</p>
                {user.shop_name && (
                  <p className="text-orange-400 text-xs font-bold mt-0.5">🏪 Gian hàng: {user.shop_name}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                setSuccessMessage('Đã đăng xuất an toàn khỏi hệ thống!');
              }}
              className="bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow"
            >
              Đăng Xuất Tài Khoản
            </button>
          </div>

          <div className="p-8 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 border-b pb-2">
              Bảng Điều Hướng Nhanh
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={onNavigateHome}
                className="p-5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition bg-gray-50 hover:bg-white group shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center mb-3">
                  <TruckIcon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-orange-600 transition">
                  Mua Sắm Khách Hàng
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Khám phá các BST Tóc giả & Thời trang xu hướng SHEIN
                </p>
              </div>

              {isSeller ? (
                <div 
                  onClick={onNavigateSeller}
                  className="p-5 rounded-xl border-2 border-orange-500 hover:border-orange-600 cursor-pointer transition bg-orange-50/50 hover:bg-orange-50 group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center mb-3">
                    <StoreIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm text-orange-900 group-hover:text-orange-700 transition">
                    Vào Kênh Người Bán
                  </h3>
                  <p className="text-xs text-orange-700/80 mt-1">
                    Quản lý sản phẩm SKU, đơn hàng và kho vận gian hàng
                  </p>
                </div>
              ) : (
                <div 
                  onClick={() => setMode('register_seller')}
                  className="p-5 rounded-xl border border-dashed border-orange-400 hover:border-orange-600 cursor-pointer transition bg-orange-50/30 hover:bg-orange-50 group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center mb-3">
                    <StoreIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm text-orange-900 group-hover:text-orange-700 transition">
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
                  className="p-5 rounded-xl border-2 border-purple-500 hover:border-purple-600 cursor-pointer transition bg-purple-50/50 hover:bg-purple-50 group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center mb-3">
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm text-purple-900 group-hover:text-purple-700 transition">
                    Quản Trị Hệ Thống (Admin Panel)
                  </h3>
                  <p className="text-xs text-purple-700/80 mt-1">
                    Vai trò: <span className="font-bold uppercase font-mono">{user.role}</span>. Phân quyền, kiểm duyệt & báo cáo
                  </p>
                </div>
              )}

              <div 
                onClick={onNavigateHome}
                className="p-5 rounded-xl border border-gray-200 hover:border-black cursor-pointer transition bg-gray-50 hover:bg-white group shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center mb-3">
                  <SparklesIcon className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-orange-600 transition">
                  Phòng Thử Đồ AI 2-in-1
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Trải nghiệm công nghệ ướm đồ và tóc giả theo số đo
                </p>
              </div>
            </div>

            {/* Thông tin chi tiết */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-xs space-y-2">
              <div className="font-bold text-gray-700 mb-2 uppercase tracking-wider">Thông Tin Hồ Sơ:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
                <div><span className="font-semibold text-gray-800">Số điện thoại:</span> {user.phone || 'Chưa cập nhật'}</div>
                <div><span className="font-semibold text-gray-800">Địa chỉ:</span> {user.address || 'Chưa cập nhật'}</div>
                <div><span className="font-semibold text-gray-800">Trạng thái:</span> <span className="text-green-600 font-bold">Hoạt động (Active)</span></div>
                <div><span className="font-semibold text-gray-800">Mã định danh (ID):</span> #{user.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 grid grid-cols-1 lg:grid-cols-12">
        
        {/* CỘT TRÁI: Brand Hero & Quyền lợi thành viên phong cách SHEIN */}
        <div className="lg:col-span-5 bg-gradient-to-br from-neutral-950 via-zinc-900 to-neutral-900 p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div 
              onClick={onNavigateHome}
              className="inline-flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white cursor-pointer transition mb-8"
            >
              <span>← Về trang chủ VibeBili.vn</span>
            </div>

            <div className="space-y-3">
              <div className="text-3xl font-black uppercase tracking-tighter">
                VIBE<span className="text-orange-500">BILI</span><span className="text-lg font-bold text-gray-400 lowercase">.vn</span>
              </div>
              <p className="text-orange-400 font-extrabold text-sm italic tracking-wide">
                "Biến hóa mỗi ngày, trọn vẹn phong cách"
              </p>
              <p className="text-gray-300 text-xs leading-relaxed pt-2">
                Nền tảng thương mại điện tử chuyên biệt kết hợp Tóc giả cao cấp & Thời trang cá tính chuẩn quốc tế SHEIN.
              </p>
            </div>

            {/* Quyền lợi thành viên */}
            <div className="mt-8 space-y-4 text-xs">
              <div className="flex items-start space-x-3 text-gray-300">
                <div className="w-7 h-7 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <SparklesIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Thử Đồ AI 2-in-1 Độc Quyền</div>
                  <div className="text-[11px] text-gray-400">Ướm đồng thời tóc giả & váy áo chuẩn tỉ lệ cơ thể</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-gray-300">
                <div className="w-7 h-7 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TruckIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Miễn Phí Vận Chuyển Toàn Quốc</div>
                  <div className="text-[11px] text-gray-400">Freeship cho đơn hàng từ 500.000đ</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 text-gray-300">
                <div className="w-7 h-7 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Hệ Thống Gian Hàng Seller Uy Tín</div>
                  <div className="text-[11px] text-gray-400">Xác thực KYC nghiêm ngặt, cam kết tóc thật 100%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cam kết an toàn & bảo mật chuẩn sàn thương mại điện tử */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
            <div className="flex items-center space-x-2 text-green-400 font-bold text-xs">
              <ShieldCheckIcon className="w-4 h-4 text-green-400" />
              <span>Bảo mật chuẩn mã hóa SSL 256-bit</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Mọi dữ liệu cá nhân, mật khẩu và thông tin kho vận được lưu trữ và bảo vệ nghiêm ngặt theo quy chuẩn an toàn sàn thương mại điện tử.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: Form Xác Thực Đa Chế Độ */}
        <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-center">
          
          {/* Navigation Tabs 3 Phân Hệ */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`pb-3 px-3 text-xs md:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                mode === 'login'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setMode('register_customer'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`pb-3 px-3 text-xs md:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                mode === 'register_customer'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Đăng Ký Khách Mua
            </button>
            <button
              onClick={() => { setMode('register_seller'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`pb-3 px-3 text-xs md:text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center space-x-1 ${
                mode === 'register_seller'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-orange-500 hover:text-orange-700'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>Đăng Ký Người Bán (Shop)</span>
            </button>
          </div>

          {/* Banner thông báo */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-3 rounded mb-4">
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 text-xs p-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          {/* Quick Demo Helper (Dành cho Giám Khảo & Chấm Điểm) */}
          {mode === 'login' && (
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-purple-50 border border-orange-200 rounded-2xl p-4 mb-5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="text-base">⚡</span>
                  <span>Đăng Nhập Nhanh Giám Khảo (1-Click Live Demo):</span>
                </span>
                <span className="text-[10px] bg-orange-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  Bảo Vệ Đồ Án
                </span>
              </div>

              {/* Các role thường */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('customer')}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold py-2 px-3 rounded-xl transition shadow-sm flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <span>👤</span>
                    <span>Khách Hàng</span>
                  </span>
                  <span className="text-[10px] text-gray-400 group-hover:text-black font-mono">khachhang@</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('seller')}
                  className="bg-white hover:bg-orange-50 border border-orange-300 text-orange-800 text-xs font-bold py-2 px-3 rounded-xl transition shadow-sm flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🏪</span>
                    <span>Người Bán (Wig Luxury)</span>
                  </span>
                  <span className="text-[10px] text-orange-500 font-mono">maitran@</span>
                </button>
              </div>

              {/* 4 Phân quyền Admin chuyên biệt */}
              <div className="pt-1.5 border-t border-orange-200/60">
                <div className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span>🛡️</span>
                  <span>4 Phân Hệ Quản Trị Viên (Admin RBAC):</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('superadmin')}
                    className="bg-purple-100/80 hover:bg-purple-700 hover:text-white border border-purple-300 text-purple-900 text-[11px] font-black py-1.5 px-2 rounded-lg text-center transition shadow-xs"
                    title="Super Admin: Toàn quyền sàn & Cấp quyền admin khác"
                  >
                    👑 Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('moderator')}
                    className="bg-blue-100/80 hover:bg-blue-700 hover:text-white border border-blue-300 text-blue-900 text-[11px] font-black py-1.5 px-2 rounded-lg text-center transition shadow-xs"
                    title="Kiểm duyệt người bán, duyệt sản phẩm mới, tìm kiếm ID & ban vi phạm"
                  >
                    🛡️ Admin Moderator
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('financial')}
                    className="bg-emerald-100/80 hover:bg-emerald-700 hover:text-white border border-emerald-300 text-emerald-900 text-[11px] font-black py-1.5 px-2 rounded-lg text-center transition shadow-xs"
                    title="Quản lý tài chính, doanh thu, voucher & các đợt Mega Sale"
                  >
                    💰 Admin Financial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('support')}
                    className="bg-amber-100/80 hover:bg-amber-700 hover:text-white border border-amber-300 text-amber-900 text-[11px] font-black py-1.5 px-2 rounded-lg text-center transition shadow-xs"
                    title="Chăm sóc khách hàng, xử lý khiếu nại & dịch vụ spa tóc"
                  >
                    🎧 Admin CSKH
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Nội Dung */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* THÊM CÁC FIELD CHO ĐĂNG KÝ SELLER */}
            {mode === 'register_seller' && (
              <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-4 space-y-3 mb-2">
                <div className="text-xs font-black text-orange-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <StoreIcon className="w-4 h-4 text-orange-600" />
                  <span>Hồ Sơ Đăng Ký Mở Gian Hàng VibeBili Seller</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Tên Gian Hàng / Shop *</label>
                    <input
                      type="text"
                      name="shop_name"
                      required
                      placeholder="Vd: Tóc Xinh Boutique"
                      value={formData.shop_name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Họ tên chủ shop *</label>
                    <input
                      type="text"
                      name="owner_name"
                      required
                      placeholder="Vd: Nguyễn Mai Trang"
                      value={formData.owner_name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Ngành hàng chủ đạo</label>
                    <select
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white font-medium"
                    >
                      <option value="Tóc Giả Cao Cấp">Tóc Giả Cao Cấp</option>
                      <option value="Thời Trang Nữ">Thời Trang Nữ</option>
                      <option value="Tóc Giả & Thời Trang (Combo)">Tóc Giả & Thời Trang (Combo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Số CCCD / Mã số kinh doanh</label>
                    <input
                      type="text"
                      name="identity_card"
                      placeholder="079xxxxxxxxxx"
                      value={formData.identity_card}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Địa chỉ kho lấy hàng *</label>
                  <input
                    type="text"
                    name="warehouse_address"
                    required
                    placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                    value={formData.warehouse_address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* FIELD CHO ĐĂNG KÝ KHÁCH HÀNG */}
            {mode === 'register_customer' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và Tên Của Bạn *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ví dụ: Hoàng Yến Nhi"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>
            )}

            {/* EMAIL CHUNG */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {mode === 'register_seller' ? 'Email Đăng Nhập Quản Trị Gian Hàng *' : 'Địa chỉ Email *'}
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
              />
            </div>

            {/* SỐ ĐIỆN THOẠI CHO CẢ 2 MODE ĐĂNG KÝ */}
            {(mode === 'register_customer' || mode === 'register_seller') && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số Điện Thoại Liên Hệ *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="09xxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>
            )}

            {/* MẬT KHẨU */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700">Mật khẩu *</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-gray-500 hover:text-black font-semibold"
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
              />
            </div>

            {/* NÚT SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-black py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg mt-2 ${
                mode === 'register_seller'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-black hover:bg-neutral-800'
              } disabled:opacity-50`}
            >
              {loading
                ? 'Đang xử lý...'
                : mode === 'login'
                ? 'Đăng Nhập Vào VibeBili.vn'
                : mode === 'register_customer'
                ? 'Hoàn Tất Đăng Ký Khách Mua'
                : '🚀 Kích Hoạt Gian Hàng Bán Hàng Ngay'}
            </button>
          </form>

          {/* Chuyển đổi nhanh giữa các mode */}
          <div className="mt-6 text-center text-xs text-gray-500">
            {mode === 'login' ? (
              <p>
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => { setMode('register_customer'); setErrorMessage(''); }}
                  className="font-bold text-black hover:underline"
                >
                  Đăng ký khách mua
                </button>
                {' '}hoặc{' '}
                <button
                  onClick={() => { setMode('register_seller'); setErrorMessage(''); }}
                  className="font-bold text-orange-600 hover:underline"
                >
                  Đăng ký Người Bán
                </button>
              </p>
            ) : (
              <p>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => { setMode('login'); setErrorMessage(''); }}
                  className="font-bold text-black hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;
