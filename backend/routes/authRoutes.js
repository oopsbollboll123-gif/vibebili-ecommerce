const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUserRole,
  getPendingSellers
} = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', register);
router.post('/login', login);

// Private endpoints (Cần đăng nhập)
router.get('/me', authenticateToken, getProfile);

// Admin-only endpoints
router.get('/users', authenticateToken, authorizeRoles('admin'), getAllUsers);
router.put('/users/:id/role', authenticateToken, authorizeRoles('admin'), updateUserRole);
router.get('/admin/pending-sellers', authenticateToken, authorizeRoles('admin'), getPendingSellers);

module.exports = router;
