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
  logout
} = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public endpoints (Bảo vệ bằng Rate Limiter chống brute-force)
router.post('/register', authLimiter, register);
router.post('/register-seller', authLimiter, registerSeller);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Private endpoints (Cần đăng nhập)
router.get('/me', authenticateToken, getProfile);
router.post('/upgrade-seller', authenticateToken, upgradeToSeller);

// Admin-only endpoints (RBAC: Chỉ SuperAdmin và Moderator được xem/sửa người dùng)
router.get('/users', authenticateToken, authorizeRoles('admin', 'admin-superadmin', 'admin-moderator'), getAllUsers);
router.put('/users/:id/role', authenticateToken, authorizeRoles('admin', 'admin-superadmin'), updateUserRole);
router.get('/admin/pending-sellers', authenticateToken, authorizeRoles('admin', 'admin-superadmin', 'admin-moderator'), getPendingSellers);

module.exports = router;
