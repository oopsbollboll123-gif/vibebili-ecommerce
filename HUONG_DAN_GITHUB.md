# 🐙 HƯỚNG DẪN ĐƯA DỰ ÁN VIBEBILI.VN LÊN GITHUB

Tài liệu này hướng dẫn chi tiết 3 cách đơn giản và an toàn nhất để đưa toàn bộ source code của nhóm lên GitHub để nộp đồ án và quản lý phiên bản.

---

## ⚠️ LƯU Ý QUAN TRỌNG TRƯỚC KHI ĐẨY LÊN GITHUB
1. **Tuyệt đối không đẩy thư mục `node_modules`:** Thư mục này rất nặng (hàng trăm MB). Nhóm đã tạo sẵn file `.gitignore` ở thư mục gốc để tự động bỏ qua thư mục này.
2. **File `.env`:** Chứa thông tin cấu hình và JWT Key, đã được tự động thêm vào `.gitignore`.

---

## 🌟 CÁCH 1: DÙNG TRỰC TIẾP TRÊN VS CODE (KHUYÊN DÙNG - DỄ NHẤT)

Nếu bạn đang mở thư mục `D:\bibear\website` bằng VS Code:

1. **Đăng nhập GitHub trên VS Code:**
   - Nhìn xuống góc dưới cùng bên trái của VS Code, click vào biểu tượng hình người (Accounts) -> Chọn **Sign in with GitHub** và đăng nhập tài khoản của bạn.

2. **Mở tab Quản lý phiên bản (Source Control):**
   - Bấm tổ hợp phím `Ctrl + Shift + G` (hoặc click vào biểu tượng nhánh cây ở thanh bên trái VS Code).

3. **Khởi tạo và Xuất bản lên GitHub:**
   - Click vào nút **"Publish to GitHub"** (hoặc **"Initialize Repository"** -> rồi chọn **"Publish to GitHub"**).
   - Chọn **"Publish to GitHub public repository"** (nếu muốn nộp link công khai cho Thầy/Cô) hoặc **"Publish to GitHub private repository"**.
   - VS Code sẽ tự động đẩy toàn bộ mã nguồn lên tài khoản GitHub của bạn chỉ trong 10 giây!

---

## 🌟 CÁCH 2: DÙNG GITHUB DESKTOP (GIAO DIỆN ĐỒ HỌA TRỰC QUAN)

Nếu máy tính của bạn đã cài đặt ứng dụng **GitHub Desktop**:

1. Mở **GitHub Desktop**, chọn menu: **File -> Add Local Repository...** (hoặc phím tắt `Ctrl + O`).
2. Chọn đường dẫn tới thư mục dự án: `D:\bibear\website`
3. Nếu ứng dụng báo chưa có Git repository, click vào liên kết **"create a repository"** -> Nhấn **Create Repository**.
4. Nhập tiêu đề commit: `Initial commit: VibeBili.vn Fullstack E-Commerce Platform`.
5. Bấm nút **"Commit to main"**.
6. Bấm nút **"Publish repository"** ở góc trên bên phải để tải toàn bộ code lên GitHub.

---

## 🌟 CÁCH 3: DÙNG DÒNG LỆNH (GIT CLI / TERMINAL)

Nếu bạn đã cài Git trên máy tính và quen dùng dòng lệnh:

### Bước 1: Tạo một Repository mới trên GitHub
1. Truy cập [https://github.com/new](https://github.com/new)
2. Đặt tên Repository: `vibebili-ecommerce`
3. Chọn chế độ: **Public** (hoặc Private tùy yêu cầu)
4. **Không** tích chọn "Add a README file" (vì dự án của chúng ta đã có sẵn file README.md chuẩn chỉnh).
5. Bấm **Create repository**.
6. Copy đường link repo vừa tạo (Ví dụ: `https://github.com/your-username/vibebili-ecommerce.git`).

### Bước 2: Chạy các lệnh Git trong thư mục dự án
Mở Terminal (PowerShell hoặc Git Bash) tại thư mục `D:\bibear\website`:

```bash
# 1. Khởi tạo Git
git init

# 2. Thêm tất cả các file vào khu vực chuẩn bị
git add .

# 3. Tạo bản commit đầu tiên
git commit -m "feat: complete VibeBili.vn fullstack monorepo with high-density SHEIN UI"

# 4. Đổi tên nhánh mặc định thành main
git branch -M main

# 5. Liên kết tới repository GitHub của bạn (thay đường link của bạn vào)
git remote add origin https://github.com/your-username/vibebili-ecommerce.git

# 6. Đẩy code lên GitHub
git push -u origin main
```

---

## 🤝 HƯỚNG DẪN MỜI CÁC THÀNH VIÊN TRONG NHÓM VÀO DỰ ÁN
Để các thành viên khác trong nhóm 5 người có thể cùng xem hoặc đóng góp code:
1. Vào repository trên GitHub -> Click chọn tab **Settings**.
2. Chọn mục **Collaborators** ở thanh menu bên trái.
3. Click vào nút xanh **"Add people"**.
4. Nhập username hoặc email GitHub của các bạn trong nhóm -> Bấm **"Add ... to this repository"**.
5. Các thành viên vào email chấp nhận lời mời là có thể cùng push code lên dự án!
