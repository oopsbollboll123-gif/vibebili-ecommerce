const rateLimit = require('express-rate-limit');

// 1. Rate limiter cho đăng nhập, đăng ký và gửi OTP (Chống brute-force & spam account)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 15, // Tối đa 15 lượt gọi mỗi IP trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã thực hiện quá nhiều yêu cầu xác thực. Vui lòng thử lại sau 15 phút để đảm bảo an toàn!'
  }
});

// 2. Rate limiter cho thao tác đặt hàng / checkout (Chống spam race condition & DDOS kho)
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Tối đa 30 đơn hàng / 15 phút mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Phát hiện tần suất đặt hàng quá nhanh. Vui lòng chờ vài phút trước khi tiếp tục!'
  }
});

// 3. Rate limiter cho thao tác rút tiền của Seller (Chống spam rút đồng thời)
const withdrawLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Tối đa 5 yêu cầu rút tiền / 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Yêu cầu rút tiền đang được xử lý. Bạn chỉ được tạo tối đa 5 yêu cầu mỗi 15 phút!'
  }
});

// 4. Rate limiter tổng thể cho API (Chống DDOS bot)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400, // 400 requests / 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Hệ thống đang tiếp nhận lượng truy cập cao. Vui lòng chậm lại một chút!'
  }
});

module.exports = {
  authLimiter,
  checkoutLimiter,
  withdrawLimiter,
  generalLimiter
};
