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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('vibebili_user') || localStorage.getItem('wigvogue_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('vibebili_token') || localStorage.getItem('wigvogue_token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(res.data.user));
        setIsAuthModalOpen(false);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Đăng nhập thất bại' };
    } catch (err) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ' };
    }
  };

  // Đăng ký
  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('vibebili_token', res.data.token);
        localStorage.setItem('vibebili_user', JSON.stringify(res.data.user));
        setIsAuthModalOpen(false);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Đăng ký thất bại' };
    } catch (err) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ' };
    }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSeller: user?.role === 'seller' || user?.role === 'admin',
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
        closeAuthModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
