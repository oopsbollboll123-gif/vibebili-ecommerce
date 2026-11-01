const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tryOnRoutes = require('./routes/tryOnRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logger đơn giản cho các request
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/try-on', tryOnRoutes);
app.use('/api/services', serviceRoutes);

// Route kiểm tra hệ thống
app.get('/', (req, res) => {
    res.json({
        name: 'VibeBili.vn E-Commerce API',
        slogan: 'Biến hóa mỗi ngày, trọn vẹn phong cách',
        version: '1.0.0',
        status: 'Online',
        endpoints: {
            auth: '/api/auth (login, register, me, users)',
            products: '/api/products (getAll, getDetail, create, delete)',
            categories: '/api/products/categories',
            orders: '/api/orders (create, my-orders, update-status)',
            tryOn: '/api/try-on (presets, generate AI 2-in-1 try-on)'
        }
    });
});

// Middleware xử lý lỗi 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint không tồn tại trên máy chủ VibeBili.vn!' });
});

// Middleware xử lý lỗi 500
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ: ' + err.message });
});

// Khởi chạy Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 VibeBili.vn API Server đang chạy tại http://localhost:${PORT}`);
    console.log(`   - Auth Endpoints:     http://localhost:${PORT}/api/auth`);
    console.log(`   - Products Endpoints: http://localhost:${PORT}/api/products`);
    console.log(`   - Orders Endpoints:   http://localhost:${PORT}/api/orders`);
    console.log(`=======================================================`);
});
