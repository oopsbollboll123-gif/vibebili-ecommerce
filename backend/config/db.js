const mysql = require('mysql2/promise');
require('dotenv').config();

// Cấu hình Connection Pool kết nối MySQL (hỗ trợ cả Local và Cloud: Railway, Aiven, TiDB, Render)
const poolConfig = process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vibebili_db',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        decimalNumbers: true
    };

const pool = mysql.createPool(poolConfig);

// Kiểm tra kết nối khi khởi động
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL (VibeBili.vn) thành công!');
        connection.release();
    } catch (err) {
        console.warn('⚠️ [Cảnh báo MySQL]: Chưa kết nối được MySQL localhost:3306 (' + err.message + ').');
        console.warn('👉 Hãy bật XAMPP / MySQL Service và import file database/schema.sql, database/seed.sql.');
        console.warn('👉 Hệ thống đang tự động kích hoạt Mock-Data Fallback để bạn vẫn test/demo web bình thường!');
    }
})();

module.exports = pool;
