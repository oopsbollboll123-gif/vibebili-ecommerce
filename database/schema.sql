-- ========================================================
-- CƠ SỞ DỮ LIỆU SÀN THƯƠNG MẠI ĐIỆN TỬ VIBEBILI.VN (MySQL)
-- Slogan: "Biến hóa mỗi ngày, trọn vẹn phong cách"
-- ========================================================

CREATE DATABASE IF NOT EXISTS vibebili_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vibebili_db;

-- 1. Bảng Người dùng (Customer, Seller, Admin)
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'seller', 'admin') DEFAULT 'customer',
    phone VARCHAR(20) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    status ENUM('active', 'pending', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Danh mục sản phẩm (Đa cấp)
CREATE TABLE IF NOT EXISTS Categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Categories(id) ON DELETE SET NULL
);

-- 3. Bảng Sản phẩm chung
CREATE TABLE IF NOT EXISTS Products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) DEFAULT NULL,
    description TEXT,
    base_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    original_price DECIMAL(12, 2) DEFAULT NULL,
    main_image VARCHAR(500) DEFAULT NULL,
    rating DECIMAL(2, 1) DEFAULT 5.0,
    sold_count INT DEFAULT 0,
    is_hot BOOLEAN DEFAULT FALSE,
    is_combo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE CASCADE
);

-- 4. Bảng Tên Thuộc tính (Vd: "Màu sắc", "Kích cỡ / Vòng đầu", "Độ dài sợi tóc")
CREATE TABLE IF NOT EXISTS ProductOptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    option_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- 5. Bảng Giá trị Thuộc tính (Vd: "Nâu Sô-cô-la", "Size M (54-58cm)", "60cm")
CREATE TABLE IF NOT EXISTS ProductOptionValues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    option_id INT NOT NULL,
    value_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (option_id) REFERENCES ProductOptions(id) ON DELETE CASCADE
);

-- 6. Bảng Biến thể Sản phẩm (Mã SKU thực tế, lưu giá riêng, tồn kho, ảnh biến thể)
CREATE TABLE IF NOT EXISTS ProductVariants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    original_price DECIMAL(12, 2) DEFAULT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500) DEFAULT NULL,
    variant_title VARCHAR(255) DEFAULT NULL, -- Tóm tắt Vd: "Nâu Sô-cô-la / Size M / 60cm"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- 7. Bảng Nối (Biến thể liên kết với các giá trị thuộc tính nào)
CREATE TABLE IF NOT EXISTS VariantOptionMapping (
    variant_id INT NOT NULL,
    option_value_id INT NOT NULL,
    PRIMARY KEY (variant_id, option_value_id),
    FOREIGN KEY (variant_id) REFERENCES ProductVariants(id) ON DELETE CASCADE,
    FOREIGN KEY (option_value_id) REFERENCES ProductOptionValues(id) ON DELETE CASCADE
);

-- 8. Bảng Đơn hàng (Orders)
CREATE TABLE IF NOT EXISTS Orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT DEFAULT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Hồ Chí Minh',
    note TEXT,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('cod', 'qr', 'banking') DEFAULT 'cod',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    status ENUM('Chờ xác nhận', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy') DEFAULT 'Chờ xác nhận',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- 9. Bảng Chi tiết Đơn hàng (OrderItems - liên kết trực tiếp với SKU và trừ tồn kho)
CREATE TABLE IF NOT EXISTS OrderItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT DEFAULT NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_title VARCHAR(255) DEFAULT NULL,
    price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES ProductVariants(id) ON DELETE SET NULL
);
