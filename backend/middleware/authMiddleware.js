const jwt = require('jsonwebtoken');
const db = require('../config/db');
const mockData = require('../data/mockData');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'wigvogue_super_secret_jwt_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'wigvogue_refresh_secret_key_2026';

// 1. Middleware xác thực JWT Access Token (ngắn hạn)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập hoặc thiếu mã xác thực (Token).'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn hoặc Token không hợp lệ. Vui lòng làm mới token hoặc đăng nhập lại!'
      });
    }
    req.user = decodedUser;
    next();
  });
};

// 2. Middleware phân quyền theo vai trò (Role-Based Access Control - RBAC)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập!' });
    }

    const userRole = req.user.role;
    // SuperAdmin có toàn quyền vượt qua mọi tầng RBAC
    if (userRole === 'admin-superadmin' || userRole === 'superadmin' || userRole === 'admin') {
      return next();
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Truy cập bị từ chối! Bạn cần quyền [${roles.join(', ')}] để thực hiện thao tác này.`
      });
    }
    next();
  };
};

// 3. Chống IDOR (Insecure Direct Object Reference) cho Đơn hàng
// Đảm bảo khách hàng chỉ đọc hoặc sửa đúng đơn hàng của chính mình
const verifyOrderOwnership = async (req, res, next) => {
  const orderId = req.params.id;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Admin hoặc Seller có quyền quản lý theo nghiệp vụ
  if (
    userRole === 'admin' ||
    userRole?.startsWith('admin-') ||
    userRole === 'superadmin' ||
    userRole === 'seller'
  ) {
    return next();
  }

  try {
    const [rows] = await db.query(
      'SELECT id, customer_id, status FROM Orders WHERE id = ? OR order_code = ?',
      [orderId, orderId]
    );

    if (rows.length === 0) {
      // Fallback kiểm tra trong Mock Data
      const mockOrder = mockData.orders.find(o => o.id === parseInt(orderId) || o.order_code === orderId);
      if (!mockOrder) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
      }
      if (mockOrder.customer_id && mockOrder.customer_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền truy cập hoặc chỉnh sửa đơn hàng của người khác!'
        });
      }
      req.targetOrder = mockOrder;
      return next();
    }

    const order = rows[0];
    if (order.customer_id && order.customer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền truy cập hoặc chỉnh sửa đơn hàng của người khác!'
      });
    }

    req.targetOrder = order;
    next();
  } catch (err) {
    // Nếu lỗi kết nối DB, kiểm tra mock data an toàn
    const mockOrder = mockData.orders.find(o => o.id === parseInt(orderId) || o.order_code === orderId);
    if (mockOrder && mockOrder.customer_id && mockOrder.customer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cảnh báo bảo mật (IDOR): Bạn không có quyền truy cập hoặc thao tác trên đơn hàng này!'
      });
    }
    req.targetOrder = mockOrder;
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  verifyOrderOwnership,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};
