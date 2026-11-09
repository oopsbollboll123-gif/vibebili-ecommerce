const express = require('express');
const router = express.Router();
const {
  register,
  registerSeller,
  upgradeToSeller,
  login,
  getProfile,
  getAllUsers,
  updateUserRole,
  getPendingSellers,
  refreshToken,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  notifyNewUser
} = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// ── Public endpoints (Rate Limiter chống brute-force) ────────
router.post('/register', authLimiter, register);
router.post('/register-seller', authLimiter, registerSeller);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// ── Quên mật khẩu / OTP (Rate Limiter) ──────────────────────
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/reset-password', authLimiter, resetPassword);

// ── Private endpoints (Cần đăng nhập) ───────────────────────
router.get('/me', authenticateToken, getProfile);
router.post('/upgrade-seller', authenticateToken, upgradeToSeller);

// ── Admin-only endpoints (RBAC) ──────────────────────────────
router.get('/users', authenticateToken, authorizeRoles('admin', 'admin-superadmin', 'admin-moderator'), getAllUsers);
router.put('/users/:id/role', authenticateToken, authorizeRoles('admin', 'admin-superadmin'), updateUserRole);
router.get('/admin/pending-sellers', authenticateToken, authorizeRoles('admin', 'admin-superadmin', 'admin-moderator'), getPendingSellers);
router.post('/admin/notify-new-user', notifyNewUser); // Không cần auth để gọi từ fallback

module.exports = router;
