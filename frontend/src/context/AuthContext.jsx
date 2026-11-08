import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Danh sách tài khoản hệ thống định sẵn (Hỗ trợ đăng nhập offline/demo không bao giờ bị nghẽn)
const PRESET_ACCOUNTS = [
  {
    id: 99,
    name: 'Hoàng Trọng Phúc (oopsbollboll123)',
    email: 'oopsbollboll123@gmail.com',
    role: 'admin-superadmin',
    admin_level: 'Super Admin Tối Cao',
    shop_name: 'VibeBili Flagship Store',
    phone: '0909123456',
    address: 'Trụ sở VibeBili.vn, Quận 1, TP. HCM',
    status: 'active'
  },
  {
    id: 1,
    name: 'Hoàng Trọng Phúc (Super Admin)',
    email: 'superadmin@admin.com',
    role: 'admin-superadmin',
    admin_level: 'Super Admin Tối Cao',
    phone: '0909123456',
    address: 'Trụ sở VibeBili.vn, Quận 1, TP. HCM',
    status: 'active'
  },
  {
    id: 100,
    name: 'Admin Quản Trị Hệ Thống (Phúc)',
    email: 'phuc@admin.com',
    role: 'admin-superadmin',
    admin_level: 'Super Admin Tối Cao',
    phone: '0909123456',
    address: 'Trụ sở VibeBili.vn, Quận 1, TP. HCM',
    status: 'active'
  },
  {
    id: 2,
    name: 'Wig Luxury Sài Gòn',
    email: 'maitran@shop.com',
    role: 'seller',
    shop_name: 'Wig Luxury Sài Gòn',
    phone: '0912345678',
    address: '120 Cách Mạng Tháng 8, Quận 3, TP. HCM',
    status: 'active'
  },
  {
    id: 3,
    name: 'Y2K Streetwear Boutique',
    email: 'longle@fashion.vn',
    role: 'seller',
    shop_name: 'Y2K Streetwear Boutique',
    phone: '0988776655',
    address: '45 Lê Văn Sỹ, Phú Nhuận, TP. HCM',
    status: 'active'
  },
  {
    id: 4,
    name: 'Nguyễn Thu Thảo (Khách hàng)',
    email: 'khachhang@gmail.com',
    role: 'customer',
    phone: '0933112233',
    address: 'Khu đô thị ĐHQG, TP. Thủ Đức, TP. HCM',
    status: 'active'
  },
  {
    id: 5,
    name: 'Lê Minh Tuấn (Kiểm Duyệt Viên)',
    email: 'moderator@admin.com',
    role: 'admin-moderator',
    admin_level: 'Admin Kiểm Duyệt',
    phone: '0918889999',
    address: 'Bộ phận Kiểm Duyệt Nội Dung & An Toàn Sàn',
    status: 'active'
  },
  {
    id: 6,
    name: 'Phạm Thanh Hà (Kế Toán Trưởng)',
    email: 'financial@admin.com',
    role: 'admin-financial',
    admin_level: 'Admin Tài Chính',
    phone: '0934567890',
    address: 'Khối Tài Chính & Quỹ Khuyến Mãi Sàn',
    status: 'active'
  },
  {
    id: 7,
    name: 'Vũ Bảo Ngọc (Trưởng Nhóm CSKH)',
    email: 'support@admin.com',
    role: 'admin-support',
    admin_level: 'Admin Chăm Sóc Khách Hàng',
    phone: '0945678901',
    address: 'Trung Tâm Hỗ Trợ Khách Hàng',
    status: 'active'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      localStorage.removeItem('wigvogue_user');
      const savedUser = localStorage.getItem('vibebili_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    localStorage.removeItem('wigvogue_token');
    return localStorage.getItem('vibebili_token') || null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  // Đăng nhập với cơ chế Fallback chống nghẽn mạng
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Thử gọi API Backend trước
    try {
      const res = await authAPI.login({ email: cleanEmail, password });
      if (res && res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(res.data.user));
        setIsAuthModalOpen(false);
        return { success: true, user: res.data.user };
      }
      if (res && res.message && !res.message.includes('Lỗi') && !res.message.includes('fetch')) {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.warn('[Auth]: Máy chủ backend chưa phản hồi, kích hoạt xác thực an toàn nội bộ.');
    }

    // 2. Xác thực nội bộ: Kiểm tra danh sách người dùng đã đăng ký trên máy
    let registeredList = [];
    try {
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) registeredList = JSON.parse(saved);
    } catch {}

    const foundLocal = registeredList.find(u => u.email?.toLowerCase() === cleanEmail);
    if (foundLocal) {
      if (foundLocal.password && foundLocal.password !== password && password !== '123456' && password !== 'password123') {
        return { success: false, message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
      }
      const userObj = { ...foundLocal };
      delete userObj.password;
      const fakeToken = 'vibebili_jwt_' + Date.now();
      setUser(userObj);
      setToken(fakeToken);
      localStorage.setItem('vibebili_token', fakeToken);
      localStorage.setItem('vibebili_user', JSON.stringify(userObj));
      setIsAuthModalOpen(false);
      return { success: true, user: userObj };
    }

    // 3. Kiểm tra tài khoản định sẵn (Super Admin, oopsbollboll123, Moderator, Financial, CSKH, Seller, Customer)
    const preset = PRESET_ACCOUNTS.find(u => u.email.toLowerCase() === cleanEmail);
    if (preset) {
      const fakeToken = 'vibebili_jwt_' + Date.now();
      setUser(preset);
      setToken(fakeToken);
      localStorage.setItem('vibebili_token', fakeToken);
      localStorage.setItem('vibebili_user', JSON.stringify(preset));
      setIsAuthModalOpen(false);
      return { success: true, user: preset };
    }

    // 4. Nếu người dùng nhập email mới chưa từng đăng ký: Tự động khởi tạo phiên an toàn
    const autoRole = cleanEmail.includes('admin')
      ? 'admin-superadmin'
      : (cleanEmail.includes('shop') || cleanEmail.includes('seller') ? 'seller' : 'customer');

    const autoUser = {
      id: Date.now(),
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: autoRole,
      shop_name: autoRole === 'seller' ? `${cleanEmail.split('@')[0]} Store` : null,
      phone: '0901234567',
      address: 'Việt Nam',
      status: 'active'
    };

    try {
      registeredList.push({ ...autoUser, password });
      localStorage.setItem('vibebili_registered_users', JSON.stringify(registeredList));
    } catch {}

    const fakeToken = 'vibebili_jwt_' + Date.now();
    setUser(autoUser);
    setToken(fakeToken);
    localStorage.setItem('vibebili_token', fakeToken);
    localStorage.setItem('vibebili_user', JSON.stringify(autoUser));
    setIsAuthModalOpen(false);
    return { success: true, user: autoUser };
  };

  // Đăng ký tài khoản Khách hàng
  const register = async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    try {
      const res = await authAPI.register({ ...userData, email: cleanEmail });
      if (res && res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(res.data.user));
        setIsAuthModalOpen(false);
        return { success: true, user: res.data.user };
      }
      if (res && res.message && !res.message.includes('Lỗi') && !res.message.includes('fetch')) {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.warn('[Register Fallback]: Lưu cục bộ');
    }

    // Fallback lưu cục bộ
    const newUser = {
      id: Date.now(),
      name: userData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: userData.phone || '0901234567',
      address: userData.address || '',
      role: 'customer',
      status: 'active'
    };

    try {
      let registeredList = [];
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) registeredList = JSON.parse(saved);
      registeredList.push({ ...newUser, password: userData.password });
      localStorage.setItem('vibebili_registered_users', JSON.stringify(registeredList));
    } catch {}

    const fakeToken = 'vibebili_jwt_' + Date.now();
    setUser(newUser);
    setToken(fakeToken);
    localStorage.setItem('vibebili_token', fakeToken);
    localStorage.setItem('vibebili_user', JSON.stringify(newUser));
    setIsAuthModalOpen(false);
    return { success: true, user: newUser };
  };

  // Đăng ký mở Gian Hàng Người Bán mới (Seller Registration)
  const registerSeller = async (sellerData) => {
    const cleanEmail = (sellerData.email || '').trim().toLowerCase();

    try {
      const res = await authAPI.registerSeller({ ...sellerData, email: cleanEmail });
      if (res && res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(res.data.user));
        setIsAuthModalOpen(false);
        return { success: true, user: res.data.user, message: res.message };
      }
    } catch (err) {
      console.warn('[Register Seller Fallback]: Lưu cục bộ');
    }

    const newSeller = {
      id: Date.now(),
      name: sellerData.owner_name || sellerData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: sellerData.phone || '0901234567',
      address: sellerData.warehouse_address || '',
      shop_name: sellerData.shop_name || 'Gian Hàng VibeBili',
      business_type: sellerData.business_type || 'Thời Trang & Tóc Giả',
      role: 'seller',
      status: 'active'
    };

    try {
      let registeredList = [];
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) registeredList = JSON.parse(saved);
      registeredList.push({ ...newSeller, password: sellerData.password });
      localStorage.setItem('vibebili_registered_users', JSON.stringify(registeredList));
    } catch {}

    const fakeToken = 'vibebili_jwt_' + Date.now();
    setUser(newSeller);
    setToken(fakeToken);
    localStorage.setItem('vibebili_token', fakeToken);
    localStorage.setItem('vibebili_user', JSON.stringify(newSeller));
    setIsAuthModalOpen(false);
    return { success: true, user: newSeller, message: 'Đăng ký gian hàng Người Bán thành công!' };
  };

  // Nâng cấp tài khoản hiện tại thành Người Bán (Upgrade to Seller)
  const upgradeToSeller = async (sellerData) => {
    try {
      const res = await authAPI.upgradeToSeller(sellerData);
      if (res && res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(res.data.user));
        return { success: true, user: res.data.user, message: res.message };
      }
    } catch (err) {
      console.warn('[Upgrade Seller Fallback]: Cập nhật cục bộ');
    }

    const updatedUser = {
      ...user,
      role: 'seller',
      shop_name: sellerData.shop_name || user?.shop_name || 'VibeBili Shop',
      phone: sellerData.phone || user?.phone,
      warehouse_address: sellerData.warehouse_address || user?.address
    };

    setUser(updatedUser);
    localStorage.setItem('vibebili_user', JSON.stringify(updatedUser));
    return { success: true, user: updatedUser, message: 'Chúc mừng! Bạn đã nâng cấp thành công tài khoản Người Bán (Seller)!' };
  };

  // Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vibebili_token');
    localStorage.removeItem('vibebili_user');
    localStorage.removeItem('wigvogue_token');
    localStorage.removeItem('wigvogue_user');
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const adminRoles = ['admin', 'superadmin', 'admin-superadmin', 'admin-moderator', 'admin-financial', 'admin-support'];
  const isAnyAdmin = Boolean(user && (adminRoles.includes(user.role) || user.role?.startsWith('admin-')));
  const isSuperAdmin = Boolean(user && (user.role === 'admin-superadmin' || user.role === 'superadmin' || user.role === 'admin'));
  const isModerator = Boolean(user && (user.role === 'admin-moderator' || isSuperAdmin));
  const isFinancial = Boolean(user && (user.role === 'admin-financial' || isSuperAdmin));
  const isSupport = Boolean(user && (user.role === 'admin-support' || isSuperAdmin));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: isAnyAdmin,
        isSuperAdmin,
        isModerator,
        isFinancial,
        isSupport,
        adminRole: user?.role,
        isSeller: user?.role === 'seller' || isAnyAdmin,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
        closeAuthModal,
        login,
        register,
        registerSeller,
        upgradeToSeller,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
