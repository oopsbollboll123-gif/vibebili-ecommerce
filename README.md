# 🎀 VIBEBILI.VN - SÀN THƯƠNG MẠI ĐIỆN TỬ TÓC GIẢ & THỜI TRANG CAO CẤP

> **Slogan:** *"Biến hóa mỗi ngày, trọn vẹn phong cách"*  
> **Định hướng phong cách:** Chuẩn thương mại điện tử quốc tế SHEIN (High-density UI, giao diện tối giản đen/trắng, nhấn mạnh hình ảnh sản phẩm, nhãn giảm giá đỏ rực và hệ thống danh mục đa tầng).  
> **Điểm nhấn độc quyền:** *Outfit x Hairstyle Combo* – Giải pháp phối đồ trọn gói giữa thời trang sành điệu và kiểu tóc giả phù hợp.

---

## 👥 1. Quy Mô Nhóm & Phân Vai (Mô Hình Agile / Scrum)
Dự án được thực hiện bởi nhóm 5 thành viên với sự phân vai rõ ràng:
* **Thành viên 1 (Leader / Solution Architect):** Thiết kế kiến trúc tổng thể Fullstack, điều phối tiến độ Scrum, thiết lập Luồng dữ liệu và Đồng bộ State toàn cục (Global Context API).
* **Thành viên 2 (Frontend Developer):** Xây dựng UI/UX chuẩn SHEIN (High-density), ma trận chọn biến thể thuộc tính (Variant Matrix) tại `ProductDetail`, giỏ hàng trượt `CartDrawer`, `OutfitCombo`.
* **Thành viên 3 (Backend Developer):** Xây dựng RESTful API với Express.js, bộ điều khiển `orderController` (xử lý Transaction, trừ tồn kho SKU), xác thực JWT và phân quyền (RBAC).
* **Thành viên 4 (Database Administrator):** Thiết kế mô hình CSDL quan hệ chuẩn hóa 3NF, giải quyết bài toán biến thể đa chiều (ProductOptions, Values, Variants SKU), tối ưu Index và Seed Data.
* **Thành viên 5 (Admin & Seller Specialist):** Xây dựng Kênh Người Bán (`SellerDashboard`), Trang Quản Trị Hệ Thống (`AdminPanel`), quy trình duyệt người bán (Seller KYC) và kịch bản Demo.

---

## 📁 2. Cấu Trúc Thư Mục Dự Án (Full-Stack Monorepo)

```plaintext
vibebili-project/
├── backend/                  # RESTful API Server (Node.js + Express)
│   ├── config/               # Cấu hình kết nối MySQL Pool (db.js)
│   ├── controllers/          # Logic nghiệp vụ (authController, productController, orderController)
│   ├── data/                 # Mock Data Fallback (Hỗ trợ demo không gián đoạn)
│   ├── middleware/           # Middleware xác thực JWT & phân quyền vai trò (RBAC)
│   ├── routes/               # Định nghĩa các endpoints (/api/auth, /api/products, /api/orders)
│   ├── .env                  # Cấu hình cổng PORT, thông số DB và JWT_SECRET
│   └── server.js             # Khởi chạy Express Server
├── frontend/                 # Giao diện người dùng (ReactJS + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/       # Các trang và components (ProductDetail, CartDrawer, Checkout, OutfitCombo...)
│   │   ├── context/          # State toàn cục: CartContext (quản lý giỏ hàng), AuthContext (đăng nhập/phân quyền)
│   │   ├── services/         # Tầng giao tiếp API (api.js với fetch & JWT Header)
│   │   ├── App.jsx           # Điều hướng động và bố cục Header/Footer chuẩn SHEIN
│   │   └── main.jsx          # Entry point của ứng dụng Vite
│   ├── index.html            # File HTML gốc tích hợp font Plus Jakarta Sans
│   └── vite.config.js        # Cấu hình Vite Dev Server
├── database/                 # Script CSDL MySQL
│   ├── schema.sql            # Script tạo bảng và ràng buộc khóa ngoại
│   └── seed.sql              # Dữ liệu mẫu phong phú (Admin, Seller, Khách hàng, Sản phẩm & SKU)
└── README.md                 # Tài liệu hướng dẫn đồ án
```

---

## 🗄️ 3. Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

Hệ thống xử lý bài toán **Sản phẩm Đa biến thể (Multi-Variant Matrix)** kết hợp đồng thời giữa tóc giả (độ dài, chu vi vòng đầu, màu sắc) và quần áo (size, màu) mà không gây bùng nổ dữ liệu:

1. **Users:** Quản lý thông tin và phân quyền 3 cấp độ (`customer`, `seller`, `admin`).
2. **Categories:** Phân cấp danh mục sản phẩm đa tầng.
3. **Products:** Thông tin chung của sản phẩm (tên, mô tả, ảnh bìa, giá gốc).
4. **ProductOptions & ProductOptionValues:** Quản lý tên thuộc tính (Màu sắc, Size, Độ dài tóc) và giá trị tương ứng.
5. **ProductVariants:** Quản lý mã SKU thực tế khách đặt mua (lưu giá bán riêng, tồn kho riêng và ảnh biến thể).
6. **VariantOptionMapping:** Bảng nối N-N liên kết giữa SKU và các giá trị thuộc tính.
7. **Orders & OrderItems:** Quản lý đơn hàng, địa chỉ, hình thức thanh toán (COD / VietQR) và chi tiết SKU đặt mua.

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Khởi động Cơ sở dữ liệu (MySQL)
1. Mở **XAMPP** hoặc **MySQL Workbench**, khởi động dịch vụ **MySQL** (cổng mặc định `3306`).
2. Mở `phpMyAdmin` (hoặc MySQL CLI), chạy script trong file:
   - `database/schema.sql` (Tạo bảng).
   - `database/seed.sql` (Nạp dữ liệu mẫu).
   *(Lưu ý: Nếu chưa bật MySQL, hệ thống Backend VibeBili.vn tích hợp sẵn cơ chế **Mock Data Fallback** giúp web vẫn hoạt động trơn tru để bạn chấm điểm / demo ngay lập tức!)*

### Bước 2: Chạy Backend Server
Mở một cửa sổ Terminal mới:
```bash
cd backend
npm install
npm run dev
```
Máy chủ API sẽ chạy tại: `http://localhost:5000`

### Bước 3: Chạy Frontend (React Vite)
Mở một cửa sổ Terminal thứ hai:
```bash
cd frontend
npm install
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`

---

## 🔑 5. Tài Khoản Thử Nghiệm (Demo Accounts)

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Quyền hạn trên hệ thống |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `phuc@admin.com` | `123456` | Toàn quyền thống kê sàn, duyệt Seller KYC, phân quyền RBAC |
| **Chủ gian hàng (Seller)** | `maitran@shop.com` | `123456` | Quản lý danh sách SKU, đăng bán sản phẩm mới, cập nhật đơn hàng |
| **Khách mua hàng (Customer)** | `khachhang@gmail.com` | `123456` | Xem chi tiết sản phẩm, chọn biến thể, giỏ hàng, đặt hàng COD/VietQR |

*(Hệ thống đã tích hợp sẵn **Nút Đăng Nhập Nhanh 1-Click** ngay trên Modal Đăng nhập để thuận tiện thao tác trong lúc báo cáo đồ án).*

---

## 🌟 6. Các Tính Năng Đã Hoàn Thiện
* ✅ **Công Nghệ Độc Quyền AI 2-in-1 Virtual Try-On:** Thử đồng thời 01 mẫu trang phục & 01 mẫu tóc giả trên Avatar 3D mô phỏng theo số đo cơ thể thực tế (chiều cao, cân nặng, 3 vòng), thanh trượt so sánh Trước/Sau (Interactive Split Slider), AI Fit Score phân tích hòa hợp cằm V-line, ưu đãi kích cầu Combo giảm 15% tặng kèm phụ kiện.
* ✅ **Chuẩn Hóa Thuộc Tính Kỹ Thuật Tóc Giả:** Phân loại chất liệu sợi (100% Virgin Human Hair chịu nhiệt 220°C vs Korean Synthetic Silk chịu nhiệt 180°C không bóng flash) và bảng Cap Size (Size S: 52-54cm, Size M: 55-57cm, Size L: 58-60cm).
* ✅ **Giao diện chuẩn SHEIN:** High-density UI, bảng danh mục đa cấp, banner khuyến mãi rực rỡ mang thông điệp *"Biến hóa mỗi ngày, trọn vẹn phong cách"*, tìm kiếm từ khóa tức thì.
* ✅ **State Giỏ Hàng Toàn Cục (CartContext):** Tự động đồng bộ `localStorage`, hỗ trợ cập nhật số lượng, xóa món, tính thanh tiến độ Freeship từ 500K.
* ✅ **Ma trận biến thể SKU (ProductDetail):** Khách chọn Màu sắc, Độ dài sợi tóc (50cm/60cm/70cm), Chu vi vòng đầu.
* ✅ **Thanh toán chuyên nghiệp (Checkout):** Tích hợp tạo đơn hàng với Database Transaction, kiểm tra tồn kho SKU tự động, thanh toán COD hoặc mã VietQR động MB Bank.
* ✅ **Kênh Người Bán (Seller Dashboard):** Form đăng bán sản phẩm mới hỗ trợ thuộc tính chuyên biệt, chuyển trạng thái đơn hàng thời gian thực.
* ✅ **Quản Trị Hệ Thống (Admin Panel):** Dashboard doanh thu sàn, duyệt hồ sơ KYC người bán, phân quyền RBAC linh hoạt.
* ✅ **Outfit x Hairstyle Combo:** Tính năng thời trang gợi ý phối đồ đồng bộ giữa trang phục và tóc giả.
