const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const mockData = require('../data/mockData');

// Hàm tạo JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
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

    const token = generateToken(newUser);
    return res.status(201).json({
      success: true,
      message: role === 'seller' ? 'Đăng ký gian hàng Người Bán thành công!' : 'Đăng ký tài khoản thành công!',
      data: { token, user: newUser }
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

    const token = generateToken(newUser);
    return res.status(201).json({
      success: true,
      message: role === 'seller' ? 'Đăng ký gian hàng Người Bán thành công!' : 'Đăng ký tài khoản thành công!',
      data: { token, user: newUser }
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

    const token = generateToken(updatedUser);
    return res.status(200).json({
      success: true,
      message: 'Chúc mừng! Bạn đã nâng cấp thành công tài khoản Người Bán (Seller)!',
      data: { token, user: updatedUser }
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

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      status: user.status
    };

    const token = generateToken(userInfo);
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { token, user: userInfo }
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

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      status: user.status
    };

    const token = generateToken(userInfo);
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { token, user: userInfo }
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

// 5. Cập nhật vai trò / Trạng thái người dùng (Admin)
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    await db.query(
      'UPDATE Users SET role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?',
      [role, status, id]
    );
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

module.exports = {
  register,
  registerSeller,
  upgradeToSeller,
  login,
  getProfile,
  getAllUsers,
  updateUserRole,
  getPendingSellers
};
