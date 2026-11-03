import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    login,
    register
  } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (authModalMode === 'login') {
      const result = await login(formData.email, formData.password);
      setLoading(false);
      if (!result.success) {
        setErrorMessage(result.message);
      }
    } else {
      const result = await register(formData);
      setLoading(false);
      if (!result.success) {
        setErrorMessage(result.message);
      }
    }
  };

  const [showAdminRoles, setShowAdminRoles] = useState(false);

  // Nút đăng nhập nhanh 1-click cho buổi Thuyết trình & Chấm điểm (Live Demo)
  const handleQuickLogin = async (roleType) => {
    setLoading(true);
    setErrorMessage('');
    let email = 'khachhang@gmail.com';

    if (roleType === 'superadmin' || roleType === 'admin') email = 'superadmin@admin.com';
    else if (roleType === 'moderator' || roleType === 'admin-moderator') email = 'moderator@admin.com';
    else if (roleType === 'financial' || roleType === 'admin-financial') email = 'financial@admin.com';
    else if (roleType === 'support' || roleType === 'admin-support') email = 'support@admin.com';
    else if (roleType === 'seller') email = 'maitran@shop.com';
    else if (roleType === 'customer') email = 'khachhang@gmail.com';

    const result = await login(email, '123456');
    setLoading(false);
    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeAuthModal}
      ></div>

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl p-6 overflow-hidden z-10 border border-gray-100">
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold"
        >
          ✕
        </button>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setAuthModalMode('login'); setErrorMessage(''); }}
            className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${
              authModalMode === 'login' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setAuthModalMode('register'); setErrorMessage(''); }}
            className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${
              authModalMode === 'register' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Quick Demo Helper (Thuyết trình bảo vệ đồ án) */}
        <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-3 mb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-orange-900 uppercase tracking-wider flex items-center gap-1">
              ⚡ Đăng Nhập Nhanh Giám Khảo:
            </span>
            <span className="text-[10px] text-orange-600 font-semibold">1-Click Live Demo</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('customer')}
              className="bg-white border border-orange-200 text-gray-800 hover:bg-orange-500 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              👤 Khách Hàng
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('seller')}
              className="bg-white border border-orange-200 text-orange-700 hover:bg-orange-600 hover:text-white px-2 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              🏪 Người Bán
            </button>
            <button
              type="button"
              onClick={() => setShowAdminRoles(!showAdminRoles)}
              className={`border px-2 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-1 ${
                showAdminRoles
                  ? 'bg-purple-700 text-white border-purple-800'
                  : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-600 hover:text-white'
              }`}
            >
              👑 Quản Trị {showAdminRoles ? '▲' : '▼'}
            </button>
          </div>

          {/* Sub-options khi chọn Role Admin */}
          {showAdminRoles && (
            <div className="bg-white/90 p-2.5 rounded-lg border border-purple-200 space-y-1.5 mt-2 animate-fadeIn">
              <div className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">
                Chọn Phân Quyền Admin Cụ Thể:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('superadmin')}
                  className="bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-200 text-purple-800 text-[11px] font-bold py-1.5 px-2 rounded text-left transition flex items-center gap-1"
                >
                  <span>👑</span>
                  <span>Super Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('moderator')}
                  className="bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-800 text-[11px] font-bold py-1.5 px-2 rounded text-left transition flex items-center gap-1"
                >
                  <span>🛡️</span>
                  <span>Admin Kiểm Duyệt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('financial')}
                  className="bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-800 text-[11px] font-bold py-1.5 px-2 rounded text-left transition flex items-center gap-1"
                >
                  <span>💰</span>
                  <span>Admin Tài Chính</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('support')}
                  className="bg-amber-50 hover:bg-amber-600 hover:text-white border border-amber-200 text-amber-800 text-[11px] font-bold py-1.5 px-2 rounded text-left transition flex items-center gap-1"
                >
                  <span>🎧</span>
                  <span>Admin CSKH</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded p-2.5 mb-4">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và Tên</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ví dụ: Hoàng Trọng Phúc"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vai trò tài khoản</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                >
                  <option value="customer">Khách mua hàng (Customer)</option>
                  <option value="seller">Chủ Shop / Người bán (Seller)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold py-2.5 rounded-full hover:bg-gray-800 transition disabled:opacity-50 text-sm tracking-wider uppercase"
          >
            {loading ? 'Đang xử lý...' : authModalMode === 'login' ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
