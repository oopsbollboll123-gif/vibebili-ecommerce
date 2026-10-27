# 🌐 HƯỚNG DẪN ĐƯA WEBSITE VIBEBILI.VN LÊN INTERNET TOÀN CẦU
> Dành cho việc triển khai thực tế: Cho phép mọi người từ khắp nơi truy cập bằng điện thoại/máy tính, tìm kiếm trên Google và đặt hàng trực tiếp.

---

## 📌 Tổng quan Kiến trúc khi đưa lên mạng

```
[ Khách hàng / Người dùng toàn cầu ]
                  │
                  ▼
       [ Tên miền: vibebili.vn / vibebili.vercel.app ]
                  │
         ┌────────┴────────┐
         ▼                 ▼
 [ Frontend React ]   [ Backend Node.js ]
  (Hosting Vercel)     (Hosting Render / VPS)
                           │
                           ▼
                  [ MySQL Cloud Database ]
                   (Aiven / TiDB / VPS)
```

---

## 🚀 CÁCH 1: TRIỂN KHAI MIỄN PHÍ 100% (Khuyên dùng cho Đồ án & Demo)
*Không mất chi phí, hệ thống tự cấp chứng chỉ bảo mật HTTPS (ổ khóa xanh), chạy ổn định 24/7.*

### Bước 1: Đẩy mã nguồn lên GitHub
Nếu bạn chưa đưa code lên GitHub:
1. Mở GitHub (https://github.com), tạo 1 Repository mới đặt tên là: `vibebili-ecommerce`.
2. Mở VS Code terminal tại `D:\bibear\website`:
   ```bash
   git init
   git add .
   git commit -m "Khoi tao du an VibeBili.vn Full-stack"
   git branch -M main
   git remote add origin https://github.com/TENTAIKHOAN/vibebili-ecommerce.git
   git push -u origin main
   ```

---

### Bước 2: Deploy Cơ sở dữ liệu MySQL lên Cloud (Miễn phí)
Bạn có thể chọn **Aiven** hoặc **TiDB Cloud**:
1. Truy cập **[Aiven.io](https://aiven.io)** hoặc **[TiDB Cloud](https://tidbcloud.com)** ➔ Đăng ký tài khoản miễn phí.
2. Tạo 1 cụm dịch vụ **Free MySQL Database**.
3. Sau khi tạo xong, dịch vụ sẽ cấp cho bạn chuỗi kết nối (`DATABASE_URL` hoặc Host, Port, User, Password).
4. Mở phpMyAdmin hoặc DBeaver / Navicat / Aiven Query Editor:
   - Mở file `database/schema.sql` ➔ Chạy để tạo các bảng.
   - Mở file `database/seed.sql` ➔ Chạy để nạp dữ liệu mẫu ban đầu.

---

### Bước 3: Deploy Backend API lên Render.com (Miễn phí)
1. Đăng nhập vào **[Render.com](https://render.com)** bằng tài khoản GitHub.
2. Bấm nút **New +** ➔ Chọn **Web Service**.
3. Chọn repository `vibebili-ecommerce` vừa tạo.
4. Điền các thông số cấu hình:
   - **Name**: `vibebili-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Tại mục **Environment Variables** (Biến môi trường), thêm các khóa:
   - `PORT`: `5000`
   - `JWT_SECRET`: `vibebili_super_secret_jwt_key_2026`
   - `DATABASE_URL`: *(Dán chuỗi kết nối MySQL bạn lấy ở Bước 2 vào)*
6. Bấm **Create Web Service**. Chờ 1-2 phút, Render sẽ cấp cho bạn một đường link công khai dạng:
   👉 **`https://vibebili-api.onrender.com`**

---

### Bước 4: Deploy Frontend lên Vercel (Miễn phí & Cực nhanh)
1. Đăng nhập vào **[Vercel.com](https://vercel.com)** bằng tài khoản GitHub.
2. Bấm **Add New...** ➔ Chọn **Project**.
3. Import repository `vibebili-ecommerce`.
4. Tại mục cấu hình:
   - **Framework Preset**: Chọn `Vite`.
   - **Root Directory**: Bấm Edit và chọn thư mục `frontend`.
5. Mở mục **Environment Variables**:
   - Tên biến: `VITE_API_BASE_URL`
   - Giá trị: `https://vibebili-api.onrender.com/api` *(Link backend bạn nhận được ở Bước 3 + `/api`)*
6. Bấm nút **Deploy**.
7. Sau 30 giây, Vercel sẽ cấp cho bạn một trang web trực tuyến:
   👉 **`https://vibebili.vercel.app`**
👉 *Bây giờ bạn có thể gửi link này cho bạn bè, khách hàng hay thầy cô giáo bấm vào đặt hàng bình thường từ mọi nơi!*

---

## 🏢 CÁCH 2: TRIỂN KHAI DOANH NGHIỆP VỚI TÊN MIỀN RIÊNG (Ví dụ: `vibebili.vn`)

Nếu bạn muốn trang web có tên miền chuyên nghiệp như một thương hiệu thật:

### 1. Mua tên miền:
- Truy cập các nhà đăng ký tên miền Việt Nam như: **Tenten.vn**, **PA Việt Nam**, **Mắt Bão**, hoặc quốc tế như **Namecheap**.
- Tìm và mua tên miền: `vibebili.vn` hoặc `vibebili.com.vn` (hoặc rẻ hơn là `vibebili.com`, `vibebili.shop`).

### 2. Gắn tên miền vào Vercel (Rất dễ - Chỉ mất 2 phút):
1. Vào trang quản lý dự án trên **Vercel** ➔ Chọn **Settings** ➔ **Domains**.
2. Nhập tên miền của bạn (ví dụ: `vibebili.vn`).
3. Vercel sẽ hiện ra 2 bản ghi DNS:
   - **Type A**: Trỏ về IP của Vercel (`76.76.21.21`)
   - **CNAME**: `cname.vercel-dns.com`
4. Bạn đăng nhập vào trang quản lý DNS của nhà cung cấp tên miền (Tenten/PA Việt Nam), thêm 2 bản ghi trên vào.
5. Sau 5-15 phút, người dùng toàn cầu gõ `https://vibebili.vn` là sẽ vào thẳng web của bạn!

---

## 🔍 CÁCH ĐỂ MỌI NGƯỜI TÌM THẤY TRÊN GOOGLE (SEO)

Để khi khách hàng gõ *"VibeBili"*, *"tóc giả cao cấp"*, *"mua outfit combo"* trên Google và tìm thấy web của bạn:

1. **Website đã được tối ưu sẵn SEO**:
   - File `frontend/index.html` đã được cấu hình đầy đủ thẻ `meta description`, `keywords`, thẻ chia sẻ mạng xã hội `Open Graph` (Facebook/Zalo khi gửi link sẽ hiện ảnh đại diện và mô tả đẹp mắt).
2. **Khai báo trang web lên Google (Google Search Console)**:
   - Truy cập: **[search.google.com/search-console](https://search.google.com/search-console)**.
   - Nhập đường link website của bạn (`https://vibebili.vn` hoặc `https://vibebili.vercel.app`).
   - Xác minh quyền sở hữu bằng cách thêm 1 thẻ meta vào `index.html` hoặc qua bản ghi DNS.
   - Bấm **"Yêu cầu lập chỉ mục" (Request Indexing)** để bot của Google vào duyệt web ngay trong vòng 24 - 48 giờ.

---

## ⚡ CÁCH 3: CHIA SẺ DÙNG THỬ NHANH TRONG 30 GIÂY (Không cần deploy)
Nếu bạn đang chạy web trên máy tính và muốn gửi link NGAY LẬP TỨC cho bạn bè ngồi từ xa mở điện thoại lên xem thử đồ AI và đặt hàng:

1. Đảm bảo bạn đang chạy Frontend (`npm run dev` ở port 5173).
2. Mở một cửa sổ Terminal mới và gõ lệnh:
   ```bash
   npx localtunnel --port 5173
   ```
3. Lệnh sẽ sinh ra một đường link công khai dạng:
   👉 `https://neat-curtains-jump.loca.lt`
4. Bạn gửi link này cho bạn bè, họ mở bằng 4G/Wifi trên điện thoại là xem và thao tác được ngay trên máy bạn!
