-- ========================================================
-- FILE MIGRATION CẬP NHẬT DATABASE VIBEBILI (MySQL)
-- 1. Thêm cột material & size_chart vào bảng Products
-- 2. Tạo bảng try_on_history (Lịch sử thử đồ AI 2-in-1)
-- 3. Cập nhật dữ liệu thông số size S, M, L cho sản phẩm mẫu
-- ========================================================

USE vibebili_db;

-- 1. Thêm cột material và size_chart vào bảng Products
ALTER TABLE Products 
ADD COLUMN material VARCHAR(255) DEFAULT NULL AFTER description,
ADD COLUMN size_chart JSON DEFAULT NULL AFTER material;

-- 2. Tạo bảng try_on_history lưu vết lịch sử thử đồ AI
CREATE TABLE IF NOT EXISTS try_on_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    avatar_image TEXT NOT NULL,
    clothing_id INT DEFAULT NULL,
    wig_id INT DEFAULT NULL,
    result_image LONGTEXT NOT NULL,
    measurements JSON DEFAULT NULL,
    fit_scores JSON DEFAULT NULL,
    ai_analysis JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (clothing_id) REFERENCES Products(id) ON DELETE SET NULL,
    FOREIGN KEY (wig_id) REFERENCES Products(id) ON DELETE SET NULL,
    INDEX idx_tryon_user (user_id),
    INDEX idx_tryon_created (created_at)
);

-- 3. Nhập thông số mẫu S, M, L và chất liệu vào database để test:

-- Sản phẩm 1: Tóc giả xoăn sóng nước 60cm
UPDATE Products 
SET 
    material = 'Sợi Tơ Lụa Hàn Quốc Chịu Nhiệt Cao Cấp (180°C)',
    size_chart = JSON_OBJECT(
        'S', JSON_OBJECT('name', 'Size S', 'circumference', '52-54cm', 'hair_length', '60cm', 'weight', '220g', 'suitable_for', 'Vòng đầu nhỏ, thiếu nữ'),
        'M', JSON_OBJECT('name', 'Size M', 'circumference', '55-57cm', 'hair_length', '60cm', 'weight', '240g', 'suitable_for', 'Kích cỡ chuẩn cho 85% người trưởng thành'),
        'L', JSON_OBJECT('name', 'Size L', 'circumference', '58-60cm', 'hair_length', '60cm', 'weight', '260g', 'suitable_for', 'Vòng đầu lớn hoặc tóc thật dày bên trong')
    )
WHERE id = 1;

-- Sản phẩm 3: Áo Croptop Y2K Cyberpunk
UPDATE Products 
SET 
    material = 'Thun gân Cotton 95% + 5% Spandex co giãn 4 chiều mềm mịn, thấm hút mồ hôi',
    size_chart = JSON_OBJECT(
        'S', JSON_OBJECT('name', 'Size S', 'bust', '78-84cm', 'waist', '60-65cm', 'length', '38cm', 'height', '150-160cm', 'weight', '40-47kg'),
        'M', JSON_OBJECT('name', 'Size M', 'bust', '85-90cm', 'waist', '66-71cm', 'length', '40cm', 'height', '155-165cm', 'weight', '48-54kg'),
        'L', JSON_OBJECT('name', 'Size L', 'bust', '91-96cm', 'waist', '72-77cm', 'length', '42cm', 'height', '160-170cm', 'weight', '55-62kg')
    )
WHERE id = 3;

-- Sản phẩm 4: Đầm Tweed Tiểu Thư Korean Chic
UPDATE Products 
SET 
    material = 'Vải Dạ Tweed dệt kim tuyến cao cấp lót lụa habutai mềm mát',
    size_chart = JSON_OBJECT(
        'S', JSON_OBJECT('name', 'Size S', 'bust', '82-86cm', 'waist', '64-68cm', 'hips', '88-92cm', 'length', '95cm', 'weight', '43-48kg'),
        'M', JSON_OBJECT('name', 'Size M', 'bust', '87-91cm', 'waist', '69-73cm', 'hips', '93-97cm', 'length', '97cm', 'weight', '49-54kg'),
        'L', JSON_OBJECT('name', 'Size L', 'bust', '92-96cm', 'waist', '74-78cm', 'hips', '98-102cm', 'length', '99cm', 'weight', '55-60kg')
    )
WHERE id = 4;
