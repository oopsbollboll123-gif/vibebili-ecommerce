const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
  schedulePickup,
  updateShippingAddress,
  requestOrderReturn,
  handleVNPayWebhook,
  handleMoMoWebhook,
  handleSellerWithdrawal
} = require('../controllers/orderController');
const { authenticateToken, authorizeRoles, verifyOrderOwnership } = require('../middleware/authMiddleware');
const { checkoutLimiter, withdrawLimiter } = require('../middleware/rateLimiter');

// Middleware nhận diện User từ JWT nếu có
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

// 1. Tạo đơn hàng mới (Bảo vệ bằng checkoutLimiter)
router.post('/', checkoutLimiter, optionalAuth, createOrder);

// 2. Lấy đơn hàng của người dùng hiện tại (IDOR Protected)
router.get('/my-orders', authenticateToken, getMyOrders);

// 3. Webhook Thanh toán Server-to-Server (Xác thực chữ ký HMAC)
router.get('/webhook/vnpay', handleVNPayWebhook);
router.post('/webhook/momo', handleMoMoWebhook);

// 4. Rút tiền ví Người Bán (Chống race condition & spam rút tiền)
router.post('/seller/withdraw', authenticateToken, authorizeRoles('seller'), withdrawLimiter, handleSellerWithdrawal);

// 5. Lấy toàn bộ đơn hàng (Admin & Seller)
router.get('/', optionalAuth, getAllOrders);

// 6. Lấy chi tiết đơn hàng (Chống IDOR - Bắt buộc kiểm tra quyền sở hữu)
router.get('/:id', authenticateToken, verifyOrderOwnership, getOrderById);

// 7. Cập nhật trạng thái đơn hàng (IDOR Protected)
router.put('/:id/status', authenticateToken, verifyOrderOwnership, updateOrderStatus);

// 8. Hẹn giờ bưu tá lấy hàng (Seller)
router.put('/:id/pickup', authenticateToken, authorizeRoles('seller', 'admin'), schedulePickup);

// 9. Đổi địa chỉ nhận hàng (Khách hàng - IDOR Protected)
router.put('/:id/address', authenticateToken, verifyOrderOwnership, updateShippingAddress);

// 10. Yêu cầu hoàn tiền / trả hàng (Return Workflow - IDOR Protected)
router.post('/:id/return', authenticateToken, verifyOrderOwnership, requestOrderReturn);

module.exports = router;
