import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import {
  fetchCloudUserByEmail,
  syncUserToCloud,
  saveCloudOtp,
  verifyCloudOtp,
  updateCloudUserPassword
} from '../services/firebase';

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

  // Đồng bộ trạng thái đăng nhập/đăng xuất giữa các tab trình duyệt & làm mới hồ sơ từ Cloud
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'vibebili_user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
      if (e.key === 'vibebili_token') {
        setToken(e.newValue || null);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Nếu đang đăng nhập (không phải admin cứng), đồng bộ lại role/status mới nhất từ Cloud Firestore
    if (user && user.email && user.email.toLowerCase() !== ADMIN_EMAIL) {
      fetchCloudUserByEmail(user.email).then((cloudUser) => {
        if (cloudUser) {
          if (cloudUser.status === 'banned') {
            logout();
            return;
          }
          const sanitized = { ...cloudUser };
          delete sanitized.password;
          delete sanitized.passwordHash;
          if (sanitized.email?.toLowerCase() !== ADMIN_EMAIL && sanitized.role?.includes('admin')) {
            sanitized.role = 'customer';
          }
          setUser(prev => {
            if (!prev) return null;
            const merged = { ...prev, ...sanitized };
            try { localStorage.setItem('vibebili_user', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      }).catch(() => {});
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper: lưu user session đồng bộ State + LocalStorage
  const persistSession = (userObj, authToken) => {
    const cleanUser = { ...userObj };
    delete cleanUser.password;
    delete cleanUser.passwordHash;
    if (cleanUser.email?.toLowerCase() !== ADMIN_EMAIL && cleanUser.role?.includes('admin')) {
      cleanUser.role = 'customer';
    }
    const finalToken = authToken || ('vibebili_jwt_' + Date.now());
    setUser(cleanUser);
    setToken(finalToken);
    try {
      localStorage.setItem('vibebili_token', finalToken);
      localStorage.setItem('vibebili_user', JSON.stringify(cleanUser));
    } catch {}
    setIsAuthModalOpen(false);
    return cleanUser;
  };

  // Helper: lưu vào vibebili_registered_users cục bộ
  const upsertLocalRegisteredUser = (userWithHash) => {
    try {
      const saved = localStorage.getItem('vibebili_registered_users');
      const list = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex(u => u.email?.toLowerCase() === userWithHash.email?.toLowerCase());
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...userWithHash };
      } else {
        list.push(userWithHash);
      }
      localStorage.setItem('vibebili_registered_users', JSON.stringify(list));
    } catch {}
  };

  // ── ĐĂNG NHẬP ───────────────────────────────────────────────
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, message: 'Vui lòng nhập đầy đủ email và mật khẩu!' };
    }

    // 1. Kiểm tra Admin cứng (ưu tiên cao nhất)
    if (cleanEmail === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return { success: false, message: 'Mật khẩu không chính xác!' };
      }
      const adminToken = 'vibebili_admin_jwt_' + Date.now();
      setUser(ADMIN_PROFILE);
      setToken(adminToken);
      localStorage.setItem('vibebili_token', adminToken);
      localStorage.setItem('vibebili_user', JSON.stringify(ADMIN_PROFILE));
      setIsAuthModalOpen(false);
      return { success: true, user: ADMIN_PROFILE };
    }

    const inputHash = await hashPassword(password);

    // 2. Thử gọi API Backend (nếu đang chạy local backend)
    try {
      const res = await authAPI.login({ email: cleanEmail, password });
      if (res && res.success && res.data && res.data.user) {
        const cleanUser = persistSession(res.data.user, res.data.token);
        // Đồng bộ lên Cloud Firestore để đăng nhập được từ mọi máy khác
        syncUserToCloud({ ...cleanUser, passwordHash: inputHash }).catch(() => {});
        upsertLocalRegisteredUser({ ...cleanUser, passwordHash: inputHash });
        return { success: true, user: cleanUser };
      }
      // Nếu backend báo sai mật khẩu hoặc tài khoản bị khóa thì trả về luôn
      if (res && res.message && (res.message.includes('Mật khẩu') || res.message.includes('khóa') || res.message.includes('banned'))) {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.warn('[Auth]: Backend chưa phản hồi, chuyển sang xác thực Cloud Firestore.');
    }

    // 3. Xác thực từ Firebase Cloud Firestore (Đồng bộ đa máy tính / điện thoại)
    try {
      const cloudUser = await fetchCloudUserByEmail(cleanEmail);
      if (cloudUser) {
        if (cloudUser.status === 'banned') {
          return { success: false, message: 'Tài khoản của bạn đã bị khóa do vi phạm chính sách!' };
        }
        if (cloudUser.passwordHash && cloudUser.passwordHash !== inputHash) {
          return { success: false, message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
        }
        if (!cloudUser.passwordHash && cloudUser.password && cloudUser.password !== password) {
          return { success: false, message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
        }
        const cleanUser = persistSession(cloudUser, 'vibebili_cloud_jwt_' + Date.now());
        upsertLocalRegisteredUser({ ...cleanUser, passwordHash: inputHash });
        return { success: true, user: cleanUser };
      }
    } catch (cloudErr) {
      console.warn('[Auth Cloud]: Lỗi kiểm tra Cloud Firestore:', cloudErr.message);
    }

    // 4. Fallback cuối: Xác thực từ localStorage (khi mất mạng hoàn toàn)
    let registeredList = [];
    try {
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) registeredList = JSON.parse(saved);
    } catch {}

    const foundLocal = registeredList.find(u => u.email?.toLowerCase() === cleanEmail);
    if (foundLocal) {
      if (foundLocal.passwordHash && foundLocal.passwordHash !== inputHash) {
        return { success: false, message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
      }
      if (!foundLocal.passwordHash && foundLocal.password && foundLocal.password !== password) {
        return { success: false, message: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
      }

      const cleanUser = persistSession(foundLocal, 'vibebili_jwt_' + Date.now());
      // Tiện tay đẩy lên Cloud Firestore để lần sau máy khác cũng đăng nhập được
      syncUserToCloud({ ...cleanUser, passwordHash: foundLocal.passwordHash || inputHash }).catch(() => {});
      return { success: true, user: cleanUser };
    }

    // 5. Tài khoản không tồn tại ở bất kỳ đâu
    return {
      success: false,
      message: 'Tài khoản không tồn tại! Vui lòng kiểm tra lại email hoặc nhấn "Đăng ký" để tạo tài khoản mới.'
    };
  };

  // ── ĐĂNG KÝ (ĐỒNG BỘ CLOUD FIRESTORE ĐA THIẾT BỊ) ───────────
  const register = async (userData) => {
    const cleanEmail = (userData.email || '').trim().toLowerCase();

    if (cleanEmail === ADMIN_EMAIL) {
      return { success: false, message: 'Email này đã được sử dụng. Vui lòng dùng email khác.' };
    }

    const passwordHash = await hashPassword(userData.password);

    // 1. Kiểm tra trùng email trên Cloud Firestore trước
    try {
      const existingCloud = await fetchCloudUserByEmail(cleanEmail);
      if (existingCloud) {
        return { success: false, message: 'Email này đã được đăng ký! Vui lòng đăng nhập.' };
      }
    } catch {}

    // 2. Kiểm tra trùng email trong localStorage
    let registeredList = [];
    try {
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) registeredList = JSON.parse(saved);
    } catch {}

    if (registeredList.some(u => u.email?.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email này đã tồn tại! Vui lòng đăng nhập hoặc dùng email khác.' };
    }

    let createdUser = {
      id: Date.now(),
      name: userData.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: userData.phone || '',
      address: userData.address || '',
      role: 'customer',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    let createdToken = 'vibebili_cloud_jwt_' + Date.now();

    // 3. Thử gọi API Backend (nếu có)
    try {
      const res = await authAPI.register({ ...userData, email: cleanEmail, role: 'customer' });
      if (res && res.success && res.data && res.data.user) {
        createdUser = { ...res.data.user, role: 'customer' };
        createdToken = res.data.token || createdToken;
        authAPI.notifyNewUser?.(createdUser).catch(() => {});
      } else if (res && res.message && (res.message.includes('tồn tại') || res.message.includes('sử dụng'))) {
        return { success: false, message: res.message };
      }
    } catch {
      console.warn('[Register]: Backend không khả dụng, lưu trực tiếp lên Cloud Firestore.');
    }

    // 4. LUÔN LUÔN đồng bộ lên Cloud Firestore & LocalStorage để đăng nhập được trên mọi máy tính
    await syncUserToCloud({ ...createdUser, passwordHash }).catch(() => {});
    upsertLocalRegisteredUser({ ...createdUser, passwordHash });

    const cleanUser = persistSession(createdUser, createdToken);
    return { success: true, user: cleanUser };
  };

  // ── QUÊN MẬT KHẨU (HYBRID: BACKEND GMAIL + CLOUD FIRESTORE OTP) ──
  const requestPasswordReset = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Vui lòng nhập địa chỉ email!' };
    }
    if (cleanEmail === ADMIN_EMAIL) {
      return { success: false, message: 'Tài khoản quản trị viên tối cao không hỗ trợ đặt lại qua form này.' };
    }

    // 1. Thử gọi Backend trước (gửi OTP qua Gmail nếu Backend online và đã cấu hình SMTP)
    try {
      const res = await authAPI.forgotPassword(cleanEmail);
      if (res && res.success) {
        return {
          success: true,
          mode: 'email',
          message: `✅ Mã OTP đã được gửi đến ${cleanEmail}. Vui lòng kiểm tra hộp thư (và thư mục spam).`
        };
      }
      // Nếu backend báo email không tồn tại, vẫn kiểm tra tiếp trên Cloud Firestore
    } catch {
      console.warn('[ForgotPassword]: Backend offline, chuyển sang Cloud OTP.');
    }

    // 2. Kiểm tra tài khoản tồn tại trên Cloud Firestore hoặc localStorage
    let accountExists = false;
    try {
      const cloudUser = await fetchCloudUserByEmail(cleanEmail);
      if (cloudUser) accountExists = true;
    } catch {}

    if (!accountExists) {
      try {
        const saved = localStorage.getItem('vibebili_registered_users');
        const list = saved ? JSON.parse(saved) : [];
        if (list.some(u => u.email?.toLowerCase() === cleanEmail)) accountExists = true;
      } catch {}
    }

    if (!accountExists) {
      return { success: false, message: 'Không tìm thấy tài khoản nào đăng ký bằng email này!' };
    }

    // 3. Tạo OTP 6 số và lưu lên Cloud Firestore (hạn 10 phút) + localStorage fallback
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await saveCloudOtp(cleanEmail, otp, 10 * 60 * 1000);
    try {
      localStorage.setItem(`vibebili_otp_${cleanEmail}`, JSON.stringify({
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000
      }));
    } catch {}

    return {
      success: true,
      mode: 'cloud_otp',
      fallbackOtp: otp,
      message: `✅ Đã tạo mã xác thực OTP cho ${cleanEmail} (Hiệu lực 10 phút).`
    };
  };

  const verifyResetOtp = async (email, otp) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    // 1. Thử Backend nếu có
    try {
      const res = await authAPI.verifyOTP(cleanEmail, cleanOtp);
      if (res && res.success) {
        return { success: true };
      }
    } catch {}

    // 2. Xác thực qua Cloud Firestore
    const cloudCheck = await verifyCloudOtp(cleanEmail, cleanOtp);
    if (cloudCheck.valid) {
      return { success: true };
    }

    // 3. Fallback localStorage
    try {
      const raw = localStorage.getItem(`vibebili_otp_${cleanEmail}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() <= parsed.expiresAt && String(parsed.otp) === cleanOtp) {
          return { success: true };
        }
      }
    } catch {}

    return { success: false, message: cloudCheck.message || 'Mã OTP không đúng hoặc đã hết hạn (10 phút)!' };
  };

  const confirmPasswordReset = async (email, otp, newPassword) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();
    const newHash = await hashPassword(newPassword);

    // 1. Thử cập nhật Backend nếu có
    try {
      await authAPI.resetPassword({ email: cleanEmail, otp: cleanOtp, newPassword });
    } catch {}

    // 2. Luôn cập nhật mật khẩu mới lên Cloud Firestore & localStorage
    const cloudUpdated = await updateCloudUserPassword(cleanEmail, newHash);
    try {
      localStorage.removeItem(`vibebili_otp_${cleanEmail}`);
      const saved = localStorage.getItem('vibebili_registered_users');
      if (saved) {
        const list = JSON.parse(saved);
        const idx = list.findIndex(u => u.email?.toLowerCase() === cleanEmail);
        if (idx >= 0) {
          list[idx] = { ...list[idx], passwordHash: newHash };
          delete list[idx].password;
          localStorage.setItem('vibebili_registered_users', JSON.stringify(list));
        }
      }
    } catch {}

    if (!cloudUpdated) {
      // Thử sync lại nếu user mới chỉ nằm ở localStorage
      try {
        const saved = localStorage.getItem('vibebili_registered_users');
        const list = saved ? JSON.parse(saved) : [];
        const localUser = list.find(u => u.email?.toLowerCase() === cleanEmail);
        if (localUser) {
          await syncUserToCloud({ ...localUser, passwordHash: newHash });
        }
      } catch {}
    }

    return {
      success: true,
      message: '✅ Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.'
    };
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

    // Lưu vào pending sellers để admin phê duyệt + đồng bộ lên Cloud Firestore
    _savePendingSeller(updatedUser, sellerData);
    syncUserToCloud(updatedUser).catch(() => {});

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
        requestPasswordReset,
        verifyResetOtp,
        confirmPasswordReset,
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
