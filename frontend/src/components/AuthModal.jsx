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

  // Nút đăng nhập nhanh 1-click cho buổi Thuyết trình & Chấm điểm (Live Demo)
  const handleQuickLogin = async (role) => {
    setLoading(true);
    setErrorMessage('');
    let email = 'khachhang@gmail.com';
    if (role === 'admin') email = 'phuc@admin.com';
    if (role === 'seller') email = 'maitran@shop.com';

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
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-5">
          <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider mb-1.5 flex items-center">
            ⚡ Đăng Nhập Nhanh (Dành cho Giám Khảo / Demo):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('customer')}
              className="bg-white border border-orange-300 text-orange-700 hover:bg-orange-600 hover:text-white px-2 py-1 rounded text-xs font-semibold transition"
            >
              👤 Khách Hàng
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('seller')}
              className="bg-white border border-orange-300 text-orange-700 hover:bg-orange-600 hover:text-white px-2 py-1 rounded text-xs font-semibold transition"
            >
              🏪 Người Bán
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="bg-white border border-orange-300 text-orange-700 hover:bg-orange-600 hover:text-white px-2 py-1 rounded text-xs font-semibold transition"
            >
              👑 Quản Trị
            </button>
          </div>
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
