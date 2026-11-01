const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  schedulePickup,
  updateShippingAddress
} = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Endpoint tạo đơn hàng (Cho phép cả khách vãng lai lẫn đã đăng nhập)
// Nếu có header Bearer token thì tự động nhận diện userId
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../middleware/authMiddleware');
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) req.user = user;
    next();
  });
};

router.post('/', optionalAuth, createOrder);

// Lấy đơn hàng cá nhân
router.get('/my-orders', authenticateToken, getMyOrders);

// Lấy toàn bộ đơn hàng (Seller & Admin)
router.get('/', optionalAuth, getAllOrders);

// Cập nhật trạng thái đơn hàng (Seller / Admin)
router.put('/:id/status', optionalAuth, updateOrderStatus);

// Hẹn giờ bưu tá lấy hàng (Seller)
router.put('/:id/pickup', optionalAuth, schedulePickup);

// Đổi địa chỉ nhận hàng (Khách hàng - chỉ khi đơn ở bước Chờ xác nhận)
router.put('/:id/address', optionalAuth, updateShippingAddress);

module.exports = router;
