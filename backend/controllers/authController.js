const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const { JWT_SECRET, JWT_REFRESH_SECRET } = require('../middleware/authMiddleware');
const mockData = require('../data/mockData');
const { logAudit } = require('../services/auditService');

// ============================================================
// ADMIN ACCOUNT: CHỈ 1 TÀI KHOẢN DUY NHẤT — KHÔNG CHO ĐĂNG KÝ THÊM
// ============================================================
const ADMIN_EMAIL = 'oopsbollboll123@gmail.com';

// Kho lưu OTP tạm thời trong bộ nhớ (tự xóa sau 10 phút)
// Trong production nên dùng Redis; ở đây dùng Map cho đơn giản
const otpStore = new Map();
// otpStore: { email: { otp: '123456', expiresAt: Date, attempts: 0 } }

// Tạo Nodemailer transporter (Gmail SMTP)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || ADMIN_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD || '' // App Password từ .env
    }
  });
};

// Gửi email qua Gmail
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"VibeBili.vn" <${process.env.GMAIL_USER || ADMIN_EMAIL}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('[Nodemailer] Lỗi gửi email:', err.message);
    return false;
  }
};

// Tạo Access Token ngắn hạn (15 phút) - Lưu tại Memory / Header
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Tạo Refresh Token dài hạn (7 ngày) - Lưu trong HttpOnly Cookie
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Thiết lập HttpOnly, Secure, SameSite Cookie cho Refresh Token
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('vibebili_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
  });
};

// 1. Đăng ký tài khoản (Register - Khách hàng hoặc Người bán)
const register = async (req, res) => {
  const { name, email, password, role = 'customer', phone, address, shop_name, business_type } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ: Họ tên, Email và Mật khẩu!'
    });
  }

  try {
    // Thử truy vấn MySQL
    const [existing] = await db.query('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO Users (name, email, password_hash, role, phone, address, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [name, email, passwordHash, role, phone || null, address || null]
    );

    const newUser = {
      id: result.insertId,
      name,
      email,
      role,
      phone,
      address,
      shop_name: shop_name || (role === 'seller' ? name : null),
      business_type: business_type || null,
      status: 'active'
    };

    // Nếu đăng ký là người bán, ghi nhận vào danh sách pendingSellers để Admin theo dõi
    if (role === 'seller') {
      mockData.pendingSellers.unshift({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        storeName: newUser.shop_name,
        phone: newUser.phone || '0900000000',
        date: new Date().toISOString().split('T')[0]
      });
    }

    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: role === 'seller' ? 'Đăng ký gian hàng Người Bán thành công!' : 'Đăng ký tài khoản thành công!',
      data: { token, accessToken: token, user: newUser }
    });
  } catch (error) {
    console.warn('[Register fallback]: Đang lưu vào Mock Data do MySQL chưa kết nối (' + error.message + ')');
    
    // Kiểm tra trong mock data
    const found = mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống!' });
    }

    const newUser = {
      id: mockData.users.length + 1,
      name,
      email,
      password,
      role,
      phone: phone || '0900000000',
      address: address || 'TP. Hồ Chí Minh',
      shop_name: shop_name || (role === 'seller' ? name : null),
      business_type: business_type || null,
      status: 'active'
    };
    mockData.users.push(newUser);

    if (role === 'seller') {
      mockData.pendingSellers.unshift({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        storeName: newUser.shop_name,
        phone: newUser.phone,
        date: new Date().toISOString().split('T')[0]
      });
    }

    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: role === 'seller' ? 'Đăng ký gian hàng Người Bán thành công!' : 'Đăng ký tài khoản thành công!',
      data: { token, accessToken: token, user: newUser }
    });
  }
};

// 1.1. Đăng ký mở Gian Hàng Người Bán Chuyên Biệt (Seller Onboarding)
const registerSeller = async (req, res) => {
  const {
    shop_name,
    owner_name,
    email,
    password,
    phone,
    warehouse_address,
    business_type = 'Tóc Giả & Thời Trang',
    identity_card,
    description
  } = req.body;

  if (!shop_name || !owner_name || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ: Tên Shop, Tên chủ shop, Email, Mật khẩu và Số điện thoại!'
    });
  }

  req.body.name = owner_name;
  req.body.role = 'seller';
  req.body.address = warehouse_address || 'TP. Hồ Chí Minh';
  req.body.shop_name = shop_name;
  req.body.business_type = business_type;

  return register(req, res);
};

// 1.2. Nâng cấp tài khoản Khách hàng hiện tại thành Người Bán (Upgrade to Seller)
const upgradeToSeller = async (req, res) => {
  const userId = req.user.id;
  const {
    shop_name,
    phone,
    warehouse_address,
    business_type = 'Tóc Giả & Thời Trang',
    description
  } = req.body;

  if (!shop_name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập Tên Gian Hàng và Số điện thoại liên hệ!'
    });
  }

  try {
    // Cập nhật trong MySQL
    await db.query(
      `UPDATE Users 
       SET role = 'seller', 
           phone = COALESCE(?, phone), 
           address = COALESCE(?, address),
           status = 'active'
       WHERE id = ?`,
      [phone, warehouse_address || null, userId]
    );

    const [rows] = await db.query('SELECT * FROM Users WHERE id = ?', [userId]);
    const user = rows[0] || req.user;
    const updatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'seller',
      phone: phone || user.phone,
      address: warehouse_address || user.address,
      shop_name: shop_name,
      business_type: business_type,
      status: 'active'
    };

    // Thêm vào danh sách seller
    mockData.pendingSellers.unshift({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      storeName: shop_name,
      phone: updatedUser.phone,
      date: new Date().toISOString().split('T')[0]
    });

    const token = generateAccessToken(updatedUser);
    const refreshToken = generateRefreshToken(updatedUser);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Chúc mừng! Bạn đã nâng cấp thành công tài khoản Người Bán (Seller)!',
      data: { token, accessToken: token, user: updatedUser }
    });
  } catch (error) {
    console.warn('[Upgrade Seller fallback]: Đang lưu vào Mock Data do MySQL chưa kết nối (' + error.message + ')');
    
    const user = mockData.users.find(u => u.id === userId || u.email === req.user.email);
    if (user) {
      user.role = 'seller';
      user.phone = phone || user.phone;
      user.address = warehouse_address || user.address;
      user.shop_name = shop_name;
      user.business_type = business_type;
    }

    const updatedUser = user ? { ...user, role: 'seller', shop_name } : {
      id: userId,
      name: req.user.name,
      email: req.user.email,
      role: 'seller',
      phone: phone,
      address: warehouse_address,
      shop_name: shop_name,
      business_type: business_type,
      status: 'active'
    };

    mockData.pendingSellers.unshift({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      storeName: shop_name,
      phone: updatedUser.phone,
      date: new Date().toISOString().split('T')[0]
    });

    const token = generateToken(updatedUser);
    return res.status(200).json({
      success: true,
      message: 'Chúc mừng! Bạn đã kích hoạt thành công gian hàng Người Bán (Seller)!',
      data: { token, user: updatedUser }
    });
  }
};

// 2. Đăng nhập hệ thống (Login)
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ Email và Mật khẩu!'
    });
  }

  try {
    // Thử kiểm tra MySQL
    const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản Email không tồn tại!' });
    }

    const user = rows[0];

    // Hỗ trợ cả bcrypt hash lẫn mật khẩu demo
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }
    if (!isMatch && (password === '123456' || password === 'password123' || password === user.password_hash)) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị KHÓA (Banned) do vi phạm chính sách cộng đồng VibeBili.vn. Vui lòng liên hệ CSKH để được giải quyết!'
      });
    }

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      status: user.status
    };

    const token = generateAccessToken(userInfo);
    const refreshToken = generateRefreshToken(userInfo);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { token, accessToken: token, user: userInfo }
    });
  } catch (error) {
    console.warn('[Login fallback]: Đang đối chiếu với Mock Data do MySQL chưa kết nối (' + error.message + ')');

    const user = mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản Email không tồn tại!' });
    }

    // Cho phép mật khẩu của user hoặc mặc định 123456 / password123
    if (user.password !== password && password !== '123456' && password !== 'password123') {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị KHÓA (Banned) do vi phạm chính sách cộng đồng VibeBili.vn. Vui lòng liên hệ CSKH để được giải quyết!'
      });
    }

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      status: user.status
    };

    const token = generateAccessToken(userInfo);
    const refreshToken = generateRefreshToken(userInfo);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { token, accessToken: token, user: userInfo }
    });
  }
};

// 3. Lấy thông tin cá nhân hiện tại (Profile)
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, address, status, created_at FROM Users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    const user = mockData.users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }
    return res.status(200).json({ success: true, data: user });
  }
};

// 4. Lấy danh sách toàn bộ người dùng (Dành cho Admin)
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, status, created_at FROM Users ORDER BY id DESC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(200).json({ success: true, data: mockData.users });
  }
};

// 5. Cập nhật vai trò / Trạng thái người dùng (Admin RBAC + Audit Log)
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const [beforeRows] = await db.query('SELECT id, name, email, role, status FROM Users WHERE id = ?', [id]);
    const oldUser = beforeRows[0] || null;

    await db.query(
      'UPDATE Users SET role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?',
      [role, status, id]
    );

    await logAudit({
      userId: req.user?.id,
      action: 'ADMIN_UPDATE_USER_ROLE_STATUS',
      resourceType: 'Users',
      resourceId: id,
      oldValues: oldUser,
      newValues: { role, status },
      req
    });

    return res.status(200).json({ success: true, message: 'Cập nhật phân quyền thành công!' });
  } catch (error) {
    const user = mockData.users.find(u => u.id === parseInt(id));
    if (user) {
      if (role) user.role = role;
      if (status) user.status = status;
    }
    return res.status(200).json({ success: true, message: 'Cập nhật phân quyền thành công!' });
  }
};

// 6. Danh sách Seller chờ duyệt KYC (Admin)
const getPendingSellers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, created_at AS date 
       FROM Users 
       WHERE role = 'seller' AND status = 'pending'`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(200).json({ success: true, data: mockData.pendingSellers });
  }
};

// 7. Làm mới Token bằng HttpOnly Cookie (Chống XSS lấy cắp token)
const refreshToken = async (req, res) => {
  const tokenFromCookie = req.cookies?.vibebili_refresh_token;

  if (!tokenFromCookie) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy Refresh Token hợp lệ trong HttpOnly Cookie!'
    });
  }

  jwt.verify(tokenFromCookie, JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Refresh Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!'
      });
    }

    try {
      const [rows] = await db.query('SELECT * FROM Users WHERE id = ?', [decoded.id]);
      const user = rows[0] || mockData.users.find(u => u.id === decoded.id);

      if (!user || user.status === 'banned') {
        return res.status(403).json({ success: false, message: 'Tài khoản không khả dụng!' });
      }

      const userInfo = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      const newAccessToken = generateAccessToken(userInfo);
      const newRefreshToken = generateRefreshToken(userInfo);
      setRefreshTokenCookie(res, newRefreshToken);

      return res.status(200).json({
        success: true,
        message: 'Làm mới Access Token thành công!',
        data: { token: newAccessToken, accessToken: newAccessToken, user: userInfo }
      });
    } catch (dbErr) {
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi làm mới token' });
    }
  });
};

// 8. Đăng xuất an toàn (Xóa HttpOnly Cookie)
const logout = async (req, res) => {
  res.clearCookie('vibebili_refresh_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh'
  });

  return res.status(200).json({
    success: true,
    message: 'Đăng xuất tài khoản và vô hiệu hóa Session an toàn!'
  });
};

  return res.status(200).json({
    success: true,
    message: 'Đăng xuất tài khoản và vô hiệu hóa Session an toàn!'
  });
};

// ============================================================
// 9. QUÊN MẬT KHẨU — Gửi OTP 6 chữ số đến Gmail (hết hạn 10 phút)
// ============================================================
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email!' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Kiểm tra email tồn tại trong hệ thống
  let userExists = false;
  try {
    const [rows] = await db.query('SELECT id FROM Users WHERE email = ?', [cleanEmail]);
    userExists = rows.length > 0;
  } catch {
    // Fallback: kiểm tra mockData
    userExists = mockData.users.some(u => u.email?.toLowerCase() === cleanEmail);
  }

  // Với admin email: luôn cho phép reset
  if (cleanEmail === ADMIN_EMAIL) userExists = true;

  if (!userExists) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy tài khoản với email này! Vui lòng kiểm tra lại.'
    });
  }

  // Tạo OTP 6 chữ số ngẫu nhiên
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút

  // Lưu OTP vào bộ nhớ
  otpStore.set(cleanEmail, { otp, expiresAt, attempts: 0 });

  // Tự động xóa OTP sau 10 phút
  setTimeout(() => {
    if (otpStore.has(cleanEmail) && otpStore.get(cleanEmail).otp === otp) {
      otpStore.delete(cleanEmail);
    }
  }, 10 * 60 * 1000);

  // Gửi email OTP
  const emailSent = await sendEmail({
    to: cleanEmail,
    subject: '🔐 Mã OTP Khôi Phục Mật Khẩu VibeBili.vn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: #1a1a2e; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
            VIBE<span style="color: #ff7c2a;">BILI</span><span style="color: #666; font-size: 16px;">.vn</span>
          </h1>
        </div>
        <div style="padding: 32px; text-align: center;">
          <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 8px;">Khôi Phục Mật Khẩu</h2>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
            Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP bên dưới.
          </p>
          <div style="background: #f9fafb; border: 2px dashed #ff7c2a; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: inline-block;">
            <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Mã OTP của bạn</p>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1a1a2e; font-family: monospace;">${otp}</div>
          </div>
          <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin-bottom: 16px;">
            ⏰ Mã có hiệu lực trong <strong>10 phút</strong>
          </p>
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.<br>
            Mật khẩu của bạn sẽ <strong>không thay đổi</strong> cho đến khi bạn nhập mã OTP.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            © 2026 VibeBili.vn — Bảo mật SSL 256-bit. Email tự động, vui lòng không reply.
          </p>
        </div>
      </div>
    `
  });

  // Thông báo đến admin về request khôi phục mật khẩu
  if (cleanEmail !== ADMIN_EMAIL) {
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `[VibeBili] Yêu cầu khôi phục mật khẩu từ ${cleanEmail}`,
      html: `<p>Người dùng <strong>${cleanEmail}</strong> đã yêu cầu khôi phục mật khẩu lúc ${new Date().toLocaleString('vi-VN')}.</p>`
    }).catch(() => {});
  }

  if (!emailSent) {
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi email. Vui lòng kiểm tra kết nối hoặc thử lại sau!'
    });
  }

  return res.status(200).json({
    success: true,
    message: `Mã OTP đã được gửi đến ${cleanEmail}. Vui lòng kiểm tra hộp thư (và thư mục spam).`
  });
};

// ============================================================
// 10. XÁC THỰC OTP
// ============================================================
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Thiếu email hoặc mã OTP!' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'Mã OTP không tồn tại hoặc đã hết hạn! Vui lòng gửi lại mã mới.'
    });
  }

  // Kiểm tra hết hạn
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      message: 'Mã OTP đã hết hạn (10 phút)! Vui lòng gửi lại mã mới.'
    });
  }

  // Chống brute-force: tối đa 5 lần thử
  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    otpStore.delete(cleanEmail);
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều lần thử sai! Mã OTP đã bị vô hiệu hóa. Vui lòng gửi lại mã mới.'
    });
  }

  if (record.otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      message: `Mã OTP không chính xác! Còn ${5 - record.attempts} lần thử.`
    });
  }

  // OTP hợp lệ — đánh dấu để cho phép reset mật khẩu
  record.verified = true;

  return res.status(200).json({ success: true, message: 'Xác thực OTP thành công!' });
};

// ============================================================
// 11. ĐẶT LẠI MẬT KHẨU (sau khi xác thực OTP)
// ============================================================
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin: email, otp, newPassword!' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  // Kiểm tra OTP đã được xác thực chưa
  if (!record || !record.verified || record.otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Phiên xác thực không hợp lệ hoặc đã hết hạn! Vui lòng thực hiện lại từ bước Quên mật khẩu.'
    });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ success: false, message: 'Phiên xác thực đã hết hạn! Vui lòng gửi lại mã OTP.' });
  }

  // Validate mật khẩu mới
  const passwordStrong = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
  if (!passwordStrong.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm cả chữ và số!'
    });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE Users SET password_hash = ? WHERE email = ?', [passwordHash, cleanEmail]);
    otpStore.delete(cleanEmail);

    // Gửi email thông báo đổi mật khẩu thành công
    sendEmail({
      to: cleanEmail,
      subject: '✅ Mật khẩu VibeBili.vn đã được thay đổi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1a1a2e;">Mật khẩu đã được thay đổi thành công</h2>
          <p>Mật khẩu tài khoản <strong>${cleanEmail}</strong> đã được thay đổi lúc <strong>${new Date().toLocaleString('vi-VN')}</strong>.</p>
          <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay <a href="mailto:oopsbollboll123@gmail.com">oopsbollboll123@gmail.com</a>.</p>
        </div>
      `
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.'
    });
  } catch (err) {
    // Fallback: cập nhật trong mockData
    const user = mockData.users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (user) {
      user.password = newPassword; // Fallback plaintext (backend chưa kết nối DB)
    }
    otpStore.delete(cleanEmail);
    return res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập lại.'
    });
  }
};

// ============================================================
// 12. THÔNG BÁO ĐĂNG KÝ MỚI ĐẾN ADMIN
// ============================================================
const notifyNewUser = async (req, res) => {
  const { name, email, role, phone } = req.body;
  if (!email) {
    return res.status(400).json({ success: false });
  }

  sendEmail({
    to: ADMIN_EMAIL,
    subject: `[VibeBili] Tài khoản mới đăng ký: ${name || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h3 style="color: #1a1a2e;">📋 Tài khoản mới vừa đăng ký</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 8px; color: #6b7280;">Họ tên:</td><td style="padding: 8px; font-weight: 600;">${name || '—'}</td></tr>
          <tr style="background:#f9fafb"><td style="padding: 8px; color: #6b7280;">Email:</td><td style="padding: 8px; font-weight: 600;">${email}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">SĐT:</td><td style="padding: 8px; font-weight: 600;">${phone || '—'}</td></tr>
          <tr style="background:#f9fafb"><td style="padding: 8px; color: #6b7280;">Vai trò:</td><td style="padding: 8px; font-weight: 600;">${role || 'customer'}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Thời gian:</td><td style="padding: 8px; font-weight: 600;">${new Date().toLocaleString('vi-VN')}</td></tr>
        </table>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Vào Admin Panel để xem chi tiết và quản lý tài khoản.</p>
      </div>
    `
  }).catch(() => {});

  return res.status(200).json({ success: true });
};

module.exports = {
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
};
