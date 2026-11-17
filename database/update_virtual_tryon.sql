-- 1. Thêm thông tin bảng size và chất liệu vào bảng products
ALTER TABLE products 
ADD COLUMN size_chart JSON NULL,
ADD COLUMN material VARCHAR(255) DEFAULT 'Cotton thoáng mát';

-- 2. Tạo bảng lưu lịch sử & Cache kết quả thử đồ 2D
CREATE TABLE try_on_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    product_id INT NOT NULL,
    user_image_hash VARCHAR(64) NOT NULL,
    result_image_url TEXT NOT NULL,
    size_advice JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cache (product_id, user_image_hash)
);