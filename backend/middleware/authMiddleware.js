const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'wigvogue_super_secret_jwt_key_2026';

// Middleware xác thực JWT Token
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
        message: 'Phiên đăng nhập đã hết hạn hoặc Token không hợp lệ. Vui lòng đăng nhập lại!'
      });
    }
    req.user = decodedUser;
    next();
  });
};

// Middleware phân quyền theo vai trò (Role-Based Access Control - RBAC)
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Truy cập bị từ chối! Bạn cần quyền [${roles.join(', ')}] để thực hiện thao tác này.`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
