# 🎓 KỊCH BẢN THUYẾT TRÌNH & LIVE DEMO BẢO VỆ ĐỒ ÁN
## ĐỒ ÁN: SÀN THƯƠNG MẠI ĐIỆN TỬ CHUYÊN BIỆT "VIBEBILI.VN"
### (Slogan: "Biến hóa mỗi ngày, trọn vẹn phong cách" • High-Density UI kiểu SHEIN • 5 Thành Viên Theo Mô Hình Agile/Scrum)

---

## ⏱️ TỔNG QUAN THỜI LƯỢNG THUYẾT TRÌNH (12 - 15 PHÚT)

| Phần | Thời lượng | Người trình bày chính | Nội dung trọng tâm |
| :--- | :--- | :--- | :--- |
| **Phần 1: Khởi động** | 2 Phút | **Thành viên 1 (Leader / Solution Architect)** | Bối cảnh đề tài, ý nghĩa thương hiệu VibeBili.vn, slogan *"Biến hóa mỗi ngày, trọn vẹn phong cách"*, phong cách SHEIN, phân công vai trò 5 người theo Scrum. |
| **Phần 2: Kiến trúc CSDL** | 2.5 Phút | **Thành viên 4 (Database Administrator)** | Mô hình CSDL quan hệ 3NF, giải pháp Ma trận biến thể (Variant Matrix) cho Tóc giả & Quần áo không trùng lặp. |
| **Phần 3: Trải nghiệm Khách hàng** | 4 Phút | **Thành viên 2 (Frontend Developer)** | Live Demo Trang chủ High-density UI, Xem chi tiết sản phẩm chọn biến thể, Giỏ hàng trượt, Tính năng độc quyền Outfit x Hairstyle Combo. |
| **Phần 4: Backend & Thanh toán** | 3 Phút | **Thành viên 3 (Backend Developer)** | Demo quá trình Checkout, Database Transaction, cơ chế trừ tồn kho SKU tự động, xác thực JWT & bảo mật API. |
| **Phần 5: Quản trị & Kênh Người Bán** | 2.5 Phút | **Thành viên 5 (Admin & Seller Specialist)** | Demo Kênh Người Bán (đăng sản phẩm đa biến thể, quản lý đơn), Trang Admin duyệt hồ sơ KYC & phân quyền RBAC. |
| **Phần 6: Kết luận** | 1 Phút | **Thành viên 1 (Leader)** | Tổng kết kết quả đạt được, bài học Scrum và định hướng phát triển tương lai. |

---

## 🎙️ KỊCH BẢN LỜI THOẠI & THAO TÁC DEMO TỪNG BƯỚC

### 🔹 PHẦN 1: MỞ ĐẦU (0:00 - 2:00) – Leader / Solution Architect
* **Lời thoại:**
  > "Kính thưa Thầy/Cô trong Hội đồng chấm đồ án và các bạn sinh viên. Đại diện cho nhóm 5 thành viên, em xin phép được mở đầu buổi báo cáo đồ án với đề tài: **Xây dựng Sàn Thương Mại Điện Tử Chuyên Biệt VibeBili.vn**.
  > Với thông điệp thương hiệu: **'Biến hóa mỗi ngày, trọn vẹn phong cách'**, VibeBili.vn ra đời nhằm giải quyết bài toán làm đẹp toàn diện cho giới trẻ: kết hợp đồng điệu giữa **Trang phục xu hướng** và **Tóc giả cao cấp**. Khách hàng không còn phải loay hoay mua sắm phân mảnh ở nhiều nơi khác nhau.
  > VibeBili.vn được thiết kế theo phong cách **High-density UI chuẩn quốc tế của SHEIN**: tối giản tông đen/trắng thanh lịch, tập trung tối đa vào hình ảnh sản phẩm, nhãn ưu đãi đỏ nổi bật và thanh danh mục đa cấp. Dự án được triển khai bài bản theo mô hình Scrum/Agile với 5 vai trò chuyên môn hóa: Leader Kiến trúc, Frontend, Backend, Database và Quản trị Admin/Seller."

---

### 🔹 PHẦN 2: THIẾT KẾ CƠ SỞ DỮ LIỆU (2:00 - 4:30) – Database Administrator
* **Thao tác màn hình:** Mở file `database/schema.sql` hoặc sơ đồ ERD trên slide.
* **Lời thoại:**
  > "Thách thức lớn nhất trong kiến trúc dữ liệu của sàn TMĐT thời trang là **bài toán biến thể đa chiều (Multi-Variant Explosion)**. Tóc giả có các thuộc tính đặc thù như: *Độ dài sợi tóc (50cm, 60cm), Chu vi vòng đầu (Size S, M, L), Màu sợi (Nâu sô-cô-la, Xám khói)*; trong khi Quần áo lại có *Size S, M, L và Màu vải*.
  > Nếu thiết kế phẳng truyền thống, số lượng dòng sản phẩm sẽ bị bùng nổ cấp số nhân và trùng lặp mô tả. Nhóm em đã giải quyết triệt để bằng mô hình chuẩn hóa 3NF:
  > 1. Bảng `Products`: Lưu thông tin dùng chung (tên, mô tả, ảnh chính, giá sàn).
  > 2. Bảng `ProductOptions` & `ProductOptionValues`: Lưu động mọi tên và giá trị thuộc tính.
  > 3. Bảng `ProductVariants`: Đóng vai trò là mã SKU thực tế khách đặt mua. Bảng này độc lập lưu trữ giá bán riêng, hình ảnh riêng và số lượng tồn kho `stock_quantity` riêng biệt cho từng tổ hợp.
  > 4. Bảng `VariantOptionMapping`: Bảng nối N-N liên kết giữa SKU và các giá trị thuộc tính.
  > Nhờ thiết kế này, hệ thống dễ dàng mở rộng thêm bất kỳ thuộc tính mới nào mà không cần phải thay đổi cấu trúc bảng."

---

### 🔹 PHẦN 3: LIVE DEMO TRẢI NGHIỆM MUA SẮM (4:30 - 8:30) – Frontend Developer
* **Thao tác màn hình 1: Trang Chủ (Home)**
  > * "Mời Thầy/Cô cùng trải nghiệm giao diện người dùng của VibeBili.vn. Đúng với tinh thần SHEIN, phía trên cùng là Top-bar Flash Sale mang thông điệp *'Biến hóa mỗi ngày, trọn vẹn phong cách'*. Header trung tâm có logo thương hiệu VibeBili.vn, ô tìm kiếm thông minh và thanh danh mục đa tầng."
  > * *(Gõ tìm kiếm 'tóc giả' hoặc click vào tab 'Thời Trang Nữ' -> Lưới sản phẩm lọc tức thì).*

* **Thao tác màn hình 2: Trang Chi Tiết Sản Phẩm (ProductDetail)**
  > * *(Click vào sản phẩm: 'Tóc Giả Nữ Nguyên Đầu Xoăn Sóng Nước 60cm').*
  > * "Tại trang chi tiết, khách hàng được trải nghiệm **Ma trận chọn biến thể trực quan**:
  >   - Chọn màu sắc: *Nâu sô-cô-la* -> Ảnh thumbnail tự động đổi theo màu tóc.
  >   - Chọn độ dài tóc: *60cm (Hot)*.
  >   - Chọn chu vi vòng đầu: *M (54-58cm)* có kèm liên kết hướng dẫn đo kích cỡ.
  >   - Khi bấm **'Thêm vào giỏ hàng'**, sản phẩm được lập tức đồng bộ vào **Global State (CartContext)**, hiển thị Toast phản hồi và lưu vết tự động vào `localStorage`."

* **Thao tác màn hình 3: Giỏ Hàng Trượt Ngang (CartDrawer)**
  > * *(Drawer trượt ra từ cạnh phải với hiệu ứng làm mờ nền backdrop blur).*
  > * "Giỏ hàng trượt ngang cho phép khách xem nhanh mà không bị gián đoạn trải nghiệm duyệt web. Tại đây có **Thanh tiến trình Miễn phí vận chuyển (Freeship Bar)**: Nếu đơn dưới 500k, hệ thống gợi ý số tiền cần mua thêm; khi vượt qua 500k, thanh chuyển sang trạng thái chúc mừng bạn đã đạt Freeship."

* **Thao tác màn hình 4: Điểm Nhấn Độc Quyền (Outfit x Hairstyle Combo)**
  > * *(Click chuyển sang menu 'Outfit x Hairstyle Combo 🌟').*
  > * "Đây là tính năng độc quyền tạo nên bản sắc của VibeBili.vn. Khách hàng không cần phải suy nghĩ 'mặc đồ này thì đội tóc giả nào'. Nhóm stylist đã phối sẵn:
  >   - *Combo Y2K Cyberpunk:* Áo croptop khóa kim loại đi kèm Tóc Bob ngắn màu xám khói.
  >   - *Combo Korean Chic:* Đầm tweed tiểu thư đi kèm Tóc xoăn sóng nước bồng bềnh.
  >   Chỉ với 1 click, khách hàng có thể mua trọn bộ combo với mức giá ưu đãi giảm 15% và tặng kèm trọn bộ phụ kiện."

* **Thao tác màn hình 5: "Vũ Khí Bí Mật" — Phòng Thử Đồ Ảo AI 2-in-1 (Virtual Try-On)**
  > * *(Click vào menu 'Phòng Thử Đồ AI 2-in-1 🪞').*
  > * "Thưa Thầy/Cô, đây là **USP (Unique Selling Proposition) - Tính năng vượt trội nhất của VibeBili.vn**:
  >   - Người mua tóc giả thường lo lắng: *'Liệu kiểu tóc này có hợp với gương mặt của mình không? Mặc chiếc váy này đi với mái tóc đó trông có bị lệch tông không?'*
  >   - **Bước 1 (Khởi tạo Avatar cá nhân):** Người dùng có thể tải ảnh của chính mình lên hoặc chọn nhanh người mẫu AI có sẵn, nhập số đo cơ thể (Chiều cao, cân nặng, vòng ngực, vòng eo, vòng mông) để AI nhận diện mốc khuôn mặt (Facial Landmarks) và phom dáng.
  >   - **Bước 2 (Thử đồ đa tầng - Multi-layer Fitting):** Khách hàng chọn đồng thời **01 mẫu tóc giả** (chuẩn hóa chất liệu: 100% Virgin Human Hair hoặc Korean Synthetic Silk, Cap Size S/M/L) và **01 mẫu trang phục** (váy tweed, áo croptop Y2K).
  >   - **Bước 3 (AI Render & Interactive Split Slider):** Bấm *'Bắt Đầu Thử Đồ AI'*, hệ thống căn chỉnh đường chân tóc (hairline) sát trán và phủ lớp trang phục lên cơ thể. Khách hàng có thể **kéo thanh trượt Trước/Sau (Before/After Slider)** để so sánh trực quan, xem **AI Fit Score (94/100)** và bấm *'Thêm Cả Set Vào Giỏ Hàng'* nhận ngay ưu đãi giảm 15% kèm trọn bộ quà tặng!"

---

### 🔹 PHẦN 4: BACKEND LOGIC, ĐẶT HÀNG & TRỪ TỒN KHO SKU (8:30 - 11:30) – Backend Developer
* **Thao tác màn hình:** Bấm "Tiến hành thanh toán" chuyển sang trang `Checkout`.
* **Lời thoại:**
  > "Tại trang Thanh Toán, dữ liệu khách hàng được điền tự động nếu đã đăng nhập qua Token JWT. Khách hàng có thể chọn 2 phương thức: COD hoặc quét mã VietQR tự động.
  > Bây giờ em xin thực hiện bấm **'Xác Nhận Đặt Hàng'**.
  > Phía Backend Node.js Express, hàm `createOrder` trong `orderController` sẽ kích hoạt một **MySQL Database Transaction**:
  > 1. Kiểm tra tồn kho của từng SKU biến thể bằng khóa `FOR UPDATE` để chống xung đột đơn hàng đồng thời (Race Condition). Nếu số lượng yêu cầu vượt quá `stock_quantity`, hệ thống lập tức rollback và thông báo lỗi rõ ràng.
  > 2. Thực hiện trừ tồn kho: `UPDATE ProductVariants SET stock_quantity = stock_quantity - ? WHERE id = ?`.
  > 3. Tạo bản ghi đơn hàng trong bảng `Orders` với mã đơn sinh tự động dạng `WIG-XXXXXX`.
  > 4. Lưu từng chi tiết sản phẩm vào bảng `OrderItems`.
  > 5. Thực hiện `COMMIT` giao dịch và trả về mã đơn thành công. Nếu khách chọn VietQR, hệ thống render mã QR kèm đúng số tiền và nội dung chuyển khoản theo chuẩn Napas 247."

---

### 🔹 PHẦN 5: KÊNH NGƯỜI BÁN & ADMIN PANEL (11:30 - 14:00) – Admin & Seller Specialist
* **Thao tác màn hình 1: Kênh Người Bán (Seller Dashboard)**
  > * *(Click vào 'Kênh Người Bán' trên thanh menu).*
  > * "Tại Seller Dashboard, chủ shop quản lý được toàn bộ danh sách SKU, số lượng tồn kho còn lại của shop.
  >   - Khi có đơn hàng mới từ khách vừa đặt, trạng thái ban đầu là `Chờ xác nhận`.
  >   - Chủ shop có thể duyệt đơn và chuyển sang `Đang xử lý` hoặc `Đang giao`.
  >   - Modal **'Đăng sản phẩm mới'** cho phép nhập đầy đủ thuộc tính tóc giả và thời trang, lưu thẳng vào cơ sở dữ liệu."

* **Thao tác màn hình 2: Quản Trị Hệ Thống (Admin Panel)**
  > * *(Click vào 'Quản Trị Hệ Thống' trên thanh menu).*
  > * "Admin Panel là trung tâm điều hành toàn sàn VibeBili.vn với 4 phân hệ chính:
  >   1. **Tổng quan (Dashboard):** Đo lường doanh thu toàn sàn, tổng đơn hàng và số gian hàng.
  >   2. **Duyệt Người Bán (Seller KYC):** Kiểm duyệt các hồ sơ đăng ký mở gian hàng mới. Admin có thể bấm 'Chấp thuận' hoặc 'Từ chối'.
  >   3. **Phân quyền người dùng (Role-Based Access Control - RBAC):** Cho phép nâng/hạ quyền hạn giữa Customer, Seller và Admin.
  >   4. **Quản lý danh mục:** Thêm mới và điều phối danh mục hàng hóa toàn hệ thống."

---

### 🔹 PHẦN 6: KẾT LUẬN & HỎI ĐÁP (14:00 - 15:00) – Leader
* **Lời thoại:**
  > "Kính thưa Thầy/Cô, đúng như slogan **'Biến hóa mỗi ngày, trọn vẹn phong cách'**, VibeBili.vn đã hoàn thiện đầy đủ một hệ sinh thái Full-stack TMĐT hiện đại từ thiết kế CSDL đa biến thể, Backend API bảo mật và trừ kho an toàn, đến giao diện Frontend mượt mà chuẩn SHEIN.
  > Nhóm chúng em xin chân thành cảm ơn Thầy/Cô đã lắng nghe và rất mong nhận được những góp ý, đánh giá quý báu để hoàn thiện đồ án tốt hơn nữa. Nhóm xin phép sẵn sàng bước vào phần trả lời câu hỏi phản biện ạ!"
