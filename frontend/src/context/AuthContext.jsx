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

// ============================================================
// ADMIN ACCOUNT: CHỈ 1 TÀI KHOẢN DUY NHẤT — DO CHỦ SỞ HỮU QUẢN LÝ
// KHÔNG hiển thị trong PRESET_ACCOUNTS, không demo, không tự đăng ký
// ============================================================
const ADMIN_EMAIL = 'oopsbollboll123@gmail.com';
const ADMIN_PASSWORD = 'admin@123';
const ADMIN_PROFILE = {
  id: 1,
  name: 'Hoàng Trọng Phúc (Admin)',
  email: ADMIN_EMAIL,
  role: 'admin-superadmin',
  admin_level: 'Super Admin Tối Cao',
  shop_name: 'VibeBili Flagship Store',
  phone: '0909123456',
  address: 'Trụ sở VibeBili.vn, Quận 1, TP. HCM',
  status: 'active'
};

// Hàm mã hóa mật khẩu đơn giản (SHA-256-like, phía frontend)
// Lưu ý: Mật khẩu thực sự vẫn được bcrypt-hash ở backend.
// Đây chỉ là lớp bảo vệ cơ bản cho localStorage fallback.
const hashPassword = async (password) => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_vibebili_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback nếu SubtleCrypto không khả dụng (HTTP)
    return btoa(password + '_vb_salt');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      // Dọn dẹp dữ liệu cũ từ tên project cũ
      localStorage.removeItem('wigvogue_user');
      localStorage.removeItem('wigvogue_token');
      const savedUser = localStorage.getItem('vibebili_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('vibebili_token') || null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // ── ĐĂNG NHẬP ───────────────────────────────────────────────
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Kiểm tra Admin cứng (ưu tiên cao nhất, không gọi API)
    if (cleanEmail === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return { success: false, message: 'Mật khẩu không chính xác!' };
      }
      const fakeToken = 'vibebili_admin_jwt_' + Date.now();
      setUser(ADMIN_PROFILE);
      setToken(fakeToken);
      localStorage.setItem('vibebili_token', fakeToken);
      localStorage.setItem('vibebili_user', JSON.stringify(ADMIN_PROFILE));
      setIsAuthModalOpen(false);
      return { success: true, user: ADMIN_PROFILE };
    }

    // 2. Thử gọi API Backend
    try {
      const res = await authAPI.login({ email: cleanEmail, password });
      if (res && res.success && res.data) {
        const userObj = res.data.user;
        // Bảo vệ: Backend không được cấp quyền admin cho bất kỳ ai trừ email admin
        if (userObj.email?.toLowerCase() !== ADMIN_EMAIL && userObj.role?.includes('admin')) {
          userObj.role = 'customer'; // Hạ cấp bảo mật
        }
        setUser(userObj);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(userObj));
        setIsAuthModalOpen(false);
        return { success: true, user: userObj };
      }
      // Backend trả về lỗi rõ ràng (tài khoản sai, bị khóa, v.v.)
      if (res && res.message && !res.message.includes('fetch') && !res.message.includes('Lỗi kết nối')) {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.warn('[Auth]: Backend chưa phản hồi, dùng xác thực cục bộ.');
    }

    // 3. Fallback: Xác thực từ localStorage (người dùng đã đăng ký offline)
    let registeredList = [];
    try {
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) registeredList = JSON.parse(saved);
    } catch {}

    const foundLocal = registeredList.find(u => u.email?.toLowerCase() === cleanEmail);
    if (foundLocal) {
      // Xác thực bằng hash mật khẩu
      const inputHash = await hashPassword(password);
      if (foundLocal.passwordHash && foundLocal.passwordHash !== inputHash) {
        return { success: false, message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
      }
      // Tương thích ngược với tài khoản cũ lưu plain text (nếu có)
      if (!foundLocal.passwordHash && foundLocal.password && foundLocal.password !== password) {
        return { success: false, message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
      }

      // Tuyệt đối không cấp quyền admin cho tài khoản localStorage
      const userObj = { ...foundLocal };
      delete userObj.password;
      delete userObj.passwordHash;
      if (userObj.role?.includes('admin')) userObj.role = 'customer';

      const fakeToken = 'vibebili_jwt_' + Date.now();
      setUser(userObj);
      setToken(fakeToken);
      localStorage.setItem('vibebili_token', fakeToken);
      localStorage.setItem('vibebili_user', JSON.stringify(userObj));
      setIsAuthModalOpen(false);
      return { success: true, user: userObj };
    }

    // 4. Tài khoản không tồn tại
    return {
      success: false,
      message: 'Tài khoản không tồn tại! Vui lòng kiểm tra email hoặc nhấn "Đăng ký" để tạo tài khoản mới.'
    };
  };

  // ── ĐĂNG KÝ ─────────────────────────────────────────────────
  const register = async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    // Chặn đăng ký với email admin
    if (cleanEmail === ADMIN_EMAIL) {
      return { success: false, message: 'Email này đã được sử dụng. Vui lòng dùng email khác.' };
    }

    // 1. Thử gọi API Backend
    try {
      const res = await authAPI.register({ ...userData, email: cleanEmail, role: 'customer' });
      if (res && res.success && res.data) {
        const userObj = { ...res.data.user, role: 'customer' }; // Đảm bảo role là customer
        setUser(userObj);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(userObj));
        setIsAuthModalOpen(false);
        // Thông báo đến admin về tài khoản mới (qua API)
        authAPI.notifyNewUser?.(userObj).catch(() => {});
        return { success: true, user: userObj };
      }
      if (res && res.message && !res.message.includes('fetch') && !res.message.includes('Lỗi kết nối')) {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.warn('[Register Fallback]: Lưu cục bộ do backend không khả dụng.');
    }

    // 2. Kiểm tra trùng email trong localStorage
    let registeredList = [];
    try {
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) registeredList = JSON.parse(saved);
    } catch {}

    const isDuplicate = registeredList.some(u => u.email?.toLowerCase() === cleanEmail);
    if (isDuplicate) {
      return { success: false, message: 'Email này đã tồn tại! Vui lòng đăng nhập hoặc dùng email khác.' };
    }

    // 3. Lưu cục bộ với mật khẩu đã hash
    const passwordHash = await hashPassword(userData.password);
    const newUser = {
      id: Date.now(),
      name: userData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: userData.phone || '',
      address: userData.address || '',
      role: 'customer', // Luôn là customer, không bao giờ là admin/seller
      status: 'active',
      createdAt: new Date().toISOString()
    };

    try {
      registeredList.push({ ...newUser, passwordHash });
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

  // ── NÂNG CẤP LÊN SELLER (từ profile, sau khi đã đăng nhập) ──
  const upgradeToSeller = async (sellerData) => {
    if (!user) {
      return { success: false, message: 'Bạn cần đăng nhập trước khi đăng ký Người Bán!' };
    }

    // Admin không cần đăng ký seller
    if (user.role?.includes('admin')) {
      return { success: false, message: 'Tài khoản Admin không cần đăng ký Người Bán.' };
    }

    // 1. Thử gọi API Backend
    try {
      const res = await authAPI.upgradeToSeller({ ...sellerData, userId: user.id });
      if (res && res.success && res.data) {
        const updatedUser = { ...res.data.user, role: 'seller' };
        setUser(updatedUser);
        setToken(res.data.token || token);
        localStorage.setItem('vibebili_token', res.data.token || token);
        localStorage.setItem('vibebili_user', JSON.stringify(updatedUser));
        // Thêm vào pending sellers trong localStorage để admin xem
        _savePendingSeller(updatedUser, sellerData);
        return { success: true, user: updatedUser, message: res.message };
      }
    } catch (err) {
      console.warn('[Upgrade Seller Fallback]: Cập nhật cục bộ.');
    }

    // 2. Fallback cục bộ
    const updatedUser = {
      ...user,
      role: 'seller',
      shop_name: sellerData.shop_name || user?.shop_name || 'VibeBili Shop',
      phone: sellerData.phone || user?.phone,
      warehouse_address: sellerData.warehouse_address || user?.address,
      business_type: sellerData.business_type,
      identity_card: sellerData.identity_card,
      seller_policy_agreed: true,
      seller_policy_agreed_at: sellerData.policy_agreed_at || new Date().toISOString(),
      seller_status: 'pending' // Chờ admin duyệt
    };

    setUser(updatedUser);
    localStorage.setItem('vibebili_user', JSON.stringify(updatedUser));

    // Cập nhật trong registeredList nếu có
    try {
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) {
        const list = JSON.parse(saved);
        const idx = list.findIndex(u => u.email?.toLowerCase() === user.email?.toLowerCase());
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updatedUser };
          localStorage.setItem('vibebili_registered_users', JSON.stringify(list));
        }
      }
    } catch {}

    // Lưu vào pending sellers để admin phê duyệt
    _savePendingSeller(updatedUser, sellerData);

    return { success: true, user: updatedUser, message: 'Đăng ký Người Bán thành công! Đang chờ Admin phê duyệt.' };
  };

  // Helper: lưu danh sách seller chờ duyệt vào localStorage
  const _savePendingSeller = (userObj, sellerData) => {
    try {
      const saved = localStorage.getItem('vibebili_pending_sellers');
      const list = saved ? JSON.parse(saved) : [];
      const existing = list.findIndex(s => s.email === userObj.email);
      const entry = {
        id: userObj.id,
        name: userObj.name,
        email: userObj.email,
        shop_name: sellerData.shop_name || userObj.shop_name,
        phone: sellerData.phone || userObj.phone,
        warehouse_address: sellerData.warehouse_address,
        business_type: sellerData.business_type,
        identity_card: sellerData.identity_card,
        description: sellerData.description,
        policy_agreed: sellerData.policy_agreed,
        policy_agreed_at: sellerData.policy_agreed_at,
        date: new Date().toISOString().split('T')[0],
        status: 'pending'
      };
      if (existing >= 0) list[existing] = entry;
      else list.unshift(entry);
      localStorage.setItem('vibebili_pending_sellers', JSON.stringify(list));

      // Dispatch event để AdminPanel có thể lắng nghe
      window.dispatchEvent(new CustomEvent('vibebili_new_seller_request', { detail: entry }));
    } catch {}
  };

  // ── ĐĂNG XUẤT ───────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vibebili_token');
    localStorage.removeItem('vibebili_user');
    localStorage.removeItem('wigvogue_token');
    localStorage.removeItem('wigvogue_user');
  };

  const openLoginModal = () => { setAuthModalMode('login'); setIsAuthModalOpen(true); };
  const openRegisterModal = () => { setAuthModalMode('register'); setIsAuthModalOpen(true); };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // ── DERIVED STATE ────────────────────────────────────────────
  // Chỉ email admin cứng mới được quyền admin
  const isAnyAdmin = Boolean(
    user &&
    user.email?.toLowerCase() === ADMIN_EMAIL &&
    (user.role?.includes('admin') || user.role === 'admin-superadmin' || user.role === 'superadmin')
  );
  const isSuperAdmin = isAnyAdmin;
  const isModerator = isAnyAdmin;
  const isFinancial = isAnyAdmin;
  const isSupport = isAnyAdmin;

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
        upgradeToSeller,
        // registerSeller tương thích ngược (alias upgradeToSeller)
        registerSeller: upgradeToSeller,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
