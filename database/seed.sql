-- ========================================================
-- DỮ LIỆU MẪU SÀN THƯƠNG MẠI ĐIỆN TỬ VIBEBILI.VN (MySQL Seed)
-- Slogan: "Biến hóa mỗi ngày, trọn vẹn phong cách"
-- Mật khẩu mặc định cho các tài khoản: 123456
-- ========================================================

USE vibebili_db;

-- 1. Tài khoản Người dùng mẫu
-- Password hash tương ứng với '123456' (bcrypt 10 rounds)
INSERT INTO Users (id, name, email, password_hash, role, phone, address, status) VALUES
(1, 'Admin Quản Trị Viên', 'phuc@admin.com', '$2b$10$wTqS4h/d5OclZ1qg11m4Uel5r7h2yO7y2457o00c.7XzF0s80uS0q', 'admin', '0909123456', 'Trụ sở VibeBili.vn, Quận 1, TP. HCM', 'active'),
(2, 'Wig Luxury Sài Gòn', 'maitran@shop.com', '$2b$10$wTqS4h/d5OclZ1qg11m4Uel5r7h2yO7y2457o00c.7XzF0s80uS0q', 'seller', '0912345678', '120 Cách Mạng Tháng 8, Quận 3, TP. HCM', 'active'),
(3, 'Y2K Streetwear Boutique', 'longle@fashion.vn', '$2b$10$wTqS4h/d5OclZ1qg11m4Uel5r7h2yO7y2457o00c.7XzF0s80uS0q', 'seller', '0988776655', '45 Lê Văn Sỹ, Phú Nhuận, TP. HCM', 'active'),
(4, 'Nguyễn Thu Thảo (Khách hàng)', 'khachhang@gmail.com', '$2b$10$wTqS4h/d5OclZ1qg11m4Uel5r7h2yO7y2457o00c.7XzF0s80uS0q', 'customer', '0933112233', 'Khu đô thị ĐHQG, TP. Thủ Đức, TP. HCM', 'active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Danh mục sản phẩm
INSERT INTO Categories (id, name, slug, parent_id) VALUES
(1, 'Tóc Giả Cao Cấp', 'toc-gia-cao-cap', NULL),
(2, 'Thời Trang Nữ', 'thoi-trang-nu', NULL),
(3, 'Outfit x Hairstyle Combo', 'combo-outfit-hairstyle', NULL),
(4, 'Tóc Giả Nguyên Đầu', 'toc-gia-nguyen-dau', 1),
(5, 'Tóc Kẹp & Búi Ngoạm', 'toc-kep-bui-ngoam', 1),
(6, 'Áo Nữ & Croptop', 'ao-nu-croptop', 2),
(7, 'Đầm Váy & Set Đồ', 'dam-vay-set-do', 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Sản phẩm chung
INSERT INTO Products (id, seller_id, category_id, name, slug, description, base_price, original_price, main_image, rating, sold_count, is_hot, is_combo) VALUES
(1, 2, 1, 'Tóc Giả Nữ Nguyên Đầu Xoăn Sóng Nước 60cm - Sợi Tơ Nhiệt Cao Cấp', 'toc-gia-nu-xoan-song-nuoc-60cm', 'Sản phẩm tóc giả nữ nguyên đầu làm từ sợi tơ lụa nhân tạo chịu nhiệt cao đến 180°C. Mềm mượt như tóc thật, không bóng lộ, thiết kế lưới thoáng khí co giãn kèm đai gài chắc chắn.', 350000, 500000, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80', 4.9, 1240, TRUE, FALSE),
(2, 2, 1, 'Tóc Giả Bob Ngắn Uốn Cụp Hàn Quốc Cá Tính 30cm', 'toc-gia-bob-ngan-han-quoc', 'Tóc giả bob ngắn ôm sát khuôn mặt tôn dáng cằm V-line, kiểu dáng trẻ trung thanh lịch chuẩn Idol K-Pop.', 280000, 390000, 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80', 4.8, 856, TRUE, FALSE),
(3, 3, 2, 'Áo Croptop Nữ Ôm Sát Y2K Cyberpunk Khóa Kéo Kim Loại', 'ao-croptop-y2k-cyberpunk', 'Áo thun croptop phong cách Y2K đậm chất đường phố, vải thun gân co giãn 4 chiều thoáng mát, họa tiết cá tính.', 169000, 240000, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 4.7, 980, TRUE, FALSE),
(4, 3, 2, 'Đầm Tiểu Thư Vải Dạ Tweed Dáng Dài Cao Cấp Phong Cách Korean Chic', 'dam-tweed-korean-chic', 'Đầm tweed sang trọng đính cúc ngọc trai lấp lánh, form dáng chuẩn thanh lịch phù hợp đi tiệc, hẹn hò hoặc dạo phố.', 420000, 600000, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80', 4.9, 430, FALSE, FALSE),
(5, 2, 3, 'Combo Y2K Cyberpunk: Áo Croptop x Tóc Giả Bob Ngắn Khói Xám', 'combo-y2k-cyberpunk-bob', 'Sự phối hợp hoàn hảo từ chuyên gia thời trang VibeBili.vn: Áo croptop Y2K phối xích kim loại kết hợp cùng mái tóc Bob ngắn xám khói thời thượng.', 480000, 650000, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', 5.0, 310, TRUE, TRUE),
(6, 2, 3, 'Combo Korean Chic: Đầm Tweed Tiểu Thư x Tóc Giả Xoăn Sóng Nâu Hạt Dẻ', 'combo-korean-chic-xoan-song', 'Biến hóa diện mạo như quý cô Hàn Quốc trọn gói: Đầm tweed đính cúc ngọc kiêu kỳ kết hợp tóc giả xoăn bồng bềnh dài quyến rũ.', 590000, 800000, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80', 4.9, 215, TRUE, TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Bảng Thuộc tính cho Tóc Giả & Quần áo (ProductOptions)
INSERT INTO ProductOptions (id, product_id, option_name) VALUES
-- Sản phẩm 1 (Tóc xoăn sóng): Màu sắc, Độ dài tóc, Chu vi vòng đầu
(1, 1, 'Màu sắc'),
(2, 1, 'Độ dài sợi tóc'),
(3, 1, 'Kích cỡ vòng đầu'),
-- Sản phẩm 3 (Áo Croptop Y2K): Màu sắc, Kích thước áo
(4, 3, 'Màu sắc'),
(5, 3, 'Kích cỡ (Size)')
ON DUPLICATE KEY UPDATE option_name=VALUES(option_name);

-- 5. Giá trị Thuộc tính (ProductOptionValues)
INSERT INTO ProductOptionValues (id, option_id, value_name) VALUES
-- Cho Sản phẩm 1
(1, 1, 'Nâu Sô-cô-la'),
(2, 1, 'Đen Tự Nhiên'),
(3, 1, 'Xám Khói'),
(4, 2, '50cm'),
(5, 2, '60cm (Hot)'),
(6, 2, '70cm'),
(7, 3, 'S (52-54cm)'),
(8, 3, 'M (54-58cm)'),
(9, 3, 'L (58-60cm)'),
-- Cho Sản phẩm 3 (Áo)
(10, 4, 'Đen Cyber'),
(11, 4, 'Trắng Bạc'),
(12, 5, 'S'),
(13, 5, 'M'),
(14, 5, 'L')
ON DUPLICATE KEY UPDATE value_name=VALUES(value_name);

-- 6. Biến thể Thực tế (ProductVariants SKU)
INSERT INTO ProductVariants (id, product_id, sku, price, original_price, stock_quantity, image_url, variant_title) VALUES
(1, 1, 'WIG-WAVE-CHOCO-60-M', 350000, 500000, 45, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80', 'Nâu Sô-cô-la / 60cm / Size M'),
(2, 1, 'WIG-WAVE-BLACK-60-M', 350000, 500000, 30, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 'Đen Tự Nhiên / 60cm / Size M'),
(3, 1, 'WIG-WAVE-GREY-60-M', 370000, 520000, 20, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80', 'Xám Khói / 60cm / Size M'),
(4, 2, 'WIG-BOB-BLACK-30-M', 280000, 390000, 50, 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80', 'Đen Tự Nhiên / 30cm / Size M'),
(5, 3, 'CLO-CROP-BLACK-S', 169000, 240000, 80, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 'Đen Cyber / Size S'),
(6, 3, 'CLO-CROP-BLACK-M', 169000, 240000, 65, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 'Đen Cyber / Size M'),
(7, 4, 'CLO-DRESS-WHITE-M', 420000, 600000, 25, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80', 'Trắng Kem / Size M'),
(8, 5, 'COMBO-Y2K-01', 480000, 650000, 35, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', 'Combo Y2K Bob Ngắn Cá Tính'),
(9, 6, 'COMBO-KOREAN-02', 590000, 800000, 28, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80', 'Combo Korean Chic Quý Cô')
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

-- 7. Nối biến thể với giá trị thuộc tính (VariantOptionMapping)
INSERT INTO VariantOptionMapping (variant_id, option_value_id) VALUES
(1, 1), (1, 5), (1, 8), -- Nâu Sô-cô-la, 60cm, Size M
(2, 2), (2, 5), (2, 8), -- Đen Tự Nhiên, 60cm, Size M
(3, 3), (3, 5), (3, 8), -- Xám Khói, 60cm, Size M
(5, 10), (5, 12),       -- Áo Đen Cyber, Size S
(6, 10), (6, 13)        -- Áo Đen Cyber, Size M
ON DUPLICATE KEY UPDATE variant_id=VALUES(variant_id);

-- 8. Đơn hàng mẫu
INSERT INTO Orders (id, order_code, customer_id, customer_name, customer_phone, shipping_address, city, note, subtotal, shipping_fee, total_amount, payment_method, payment_status, status) VALUES
(1, 'WIG-849201', 4, 'Nguyễn Thu Thảo', '0933112233', 'Ký túc xá ĐHQG Khu B, P. Đông Hòa', 'TP. Dĩ An', 'Giao sau 17h giúp em', 350000, 30000, 380000, 'cod', 'pending', 'Chờ xác nhận'),
(2, 'WIG-849195', 4, 'Trần Minh Tuấn', '0918111222', 'Số 88 Lê Duẩn, Bến Nghé', 'TP. Hồ Chí Minh', 'Giao giờ hành chính', 550000, 0, 550000, 'qr', 'paid', 'Đang giao')
ON DUPLICATE KEY UPDATE order_code=VALUES(order_code);

-- 9. Chi tiết đơn hàng mẫu
INSERT INTO OrderItems (id, order_id, product_id, variant_id, product_name, variant_title, price, quantity, subtotal) VALUES
(1, 1, 1, 1, 'Tóc Giả Nữ Nguyên Đầu Xoăn Sóng Nước 60cm', 'Nâu Sô-cô-la / 60cm / Size M', 350000, 1, 350000),
(2, 2, 5, 8, 'Combo Y2K Cyberpunk: Áo Croptop x Tóc Bob Ngắn', 'Combo Tiêu Chuẩn', 480000, 1, 480000),
(3, 2, 3, 5, 'Áo Croptop Nữ Ôm Sát Y2K Cyberpunk', 'Đen Cyber / Size S', 70000, 1, 70000)
ON DUPLICATE KEY UPDATE order_id=VALUES(order_id);
