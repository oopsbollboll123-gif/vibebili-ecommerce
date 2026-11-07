// Mock Data dùng khi chưa bật MySQL Server (Hỗ trợ demo mượt mà)

let users = [
  {
    id: 1,
    name: "Hoàng Trọng Phúc (Super Admin)",
    email: "superadmin@admin.com",
    password: "password123", // Mật khẩu demo: 123456 hoặc password123
    role: "admin-superadmin",
    phone: "0909123456",
    address: "Trụ sở VibeBili.vn, Quận 1, TP. HCM",
    status: "active",
    admin_level: "Super Admin Tối Cao"
  },
  {
    id: 100,
    name: "Admin Quản Trị Hệ Thống (Phúc)",
    email: "phuc@admin.com",
    password: "password123",
    role: "admin-superadmin",
    phone: "0909123456",
    address: "Trụ sở VibeBili.vn, Quận 1, TP. HCM",
    status: "active",
    admin_level: "Super Admin Tối Cao"
  },
  {
    id: 2,
    name: "Wig Luxury Sài Gòn",
    email: "maitran@shop.com",
    password: "password123",
    role: "seller",
    phone: "0912345678",
    address: "120 Cách Mạng Tháng 8, Quận 3, TP. HCM",
    status: "active"
  },
  {
    id: 3,
    name: "Y2K Streetwear Boutique",
    email: "longle@fashion.vn",
    password: "password123",
    role: "seller",
    phone: "0988776655",
    address: "45 Lê Văn Sỹ, Phú Nhuận, TP. HCM",
    status: "active"
  },
  {
    id: 4,
    name: "Nguyễn Thu Thảo (Khách hàng)",
    email: "khachhang@gmail.com",
    password: "password123",
    role: "customer",
    phone: "0933112233",
    address: "Khu đô thị ĐHQG, TP. Thủ Đức, TP. HCM",
    status: "active"
  },
  {
    id: 5,
    name: "Lê Minh Tuấn (Kiểm Duyệt Viên)",
    email: "moderator@admin.com",
    password: "password123",
    role: "admin-moderator",
    phone: "0918889999",
    address: "Bộ phận Kiểm Duyệt Nội Dung & An Toàn Sàn VibeBili.vn",
    status: "active",
    admin_level: "Admin Kiểm Duyệt"
  },
  {
    id: 6,
    name: "Phạm Thanh Hà (Kế Toán Trưởng)",
    email: "financial@admin.com",
    password: "password123",
    role: "admin-financial",
    phone: "0934567890",
    address: "Khối Tài Chính & Qũy Khuyến Mãi Sàn VibeBili.vn",
    status: "active",
    admin_level: "Admin Tài Chính"
  },
  {
    id: 7,
    name: "Vũ Bảo Ngọc (Trưởng Nhóm CSKH)",
    email: "support@admin.com",
    password: "password123",
    role: "admin-support",
    phone: "0945678901",
    address: "Trung Tâm Hỗ Trợ Khách Hàng & Giải Quyết Khiếu Nại",
    status: "active",
    admin_level: "Admin Chăm Sóc Khách Hàng"
  }
];

let categories = [
  { id: 1, name: "Tóc Giả Cao Cấp", slug: "toc-gia-cao-cap", count: 32 },
  { id: 2, name: "Thời Trang Nữ", slug: "thoi-trang-nu", count: 85 },
  { id: 6, name: "Thời Trang Nam", slug: "thoi-trang-nam", count: 46 },
  { id: 3, name: "Outfit x Hairstyle Combo", slug: "combo-outfit-hairstyle", count: 18 },
  { id: 4, name: "Tóc Giả Nguyên Đầu", slug: "toc-gia-nguyen-dau", count: 20 },
  { id: 5, name: "Áo Nữ & Croptop", slug: "ao-nu-croptop", count: 42 }
];

// Danh sách sản phẩm sàn VibeBili (Đã dọn sạch các sản phẩm mẫu cũ theo yêu cầu người dùng)
let products = [];

let orders = [
  {
    id: 1,
    order_code: "WIG-849201",
    customer_id: 4,
    customer_name: "Nguyễn Thu Thảo",
    customer_phone: "0933112233",
    shipping_address: "Ký túc xá ĐHQG Khu B, P. Đông Hòa",
    city: "TP. Dĩ An",
    note: "Giao sau 17h giúp em",
    subtotal: 350000,
    shipping_fee: 30000,
    total_amount: 380000,
    payment_method: "cod",
    payment_status: "pending",
    status: "Chờ xác nhận",
    created_at: new Date().toISOString(),
    items: [
      {
        id: 1,
        product_id: 1,
        variant_id: 1,
        product_name: "Tóc Giả Nữ Nguyên Đầu Xoăn Sóng Nước 60cm",
        variant_title: "Nâu Sô-cô-la / 60cm / Size M",
        price: 350000,
        quantity: 1,
        subtotal: 350000
      }
    ]
  },
  {
    id: 2,
    order_code: "WIG-849195",
    customer_id: 4,
    customer_name: "Trần Minh Tuấn",
    customer_phone: "0918111222",
    shipping_address: "Số 88 Lê Duẩn, Bến Nghé",
    city: "TP. Hồ Chí Minh",
    note: "Giao giờ hành chính",
    subtotal: 550000,
    shipping_fee: 0,
    total_amount: 550000,
    payment_method: "qr",
    payment_status: "paid",
    status: "Đang giao",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: 2,
        product_id: 5,
        variant_id: 8,
        product_name: "Combo Y2K Cyberpunk: Áo Croptop x Tóc Bob Ngắn",
        variant_title: "Combo Tiêu Chuẩn",
        price: 480000,
        quantity: 1,
        subtotal: 480000
      },
      {
        id: 3,
        product_id: 3,
        variant_id: 5,
        product_name: "Áo Croptop Nữ Ôm Sát Y2K Cyberpunk",
        variant_title: "Đen Cyber / Size S",
        price: 70000,
        quantity: 1,
        subtotal: 70000
      }
    ]
  }
];

let pendingSellers = [
  { id: 1, name: "Trần Thị Mai", email: "maitran@shop.com", storeName: "Wig Luxury SaiGon", phone: "0912345678", date: "2026-10-26" },
  { id: 2, name: "Lê Hoàng Long", email: "longle@fashion.vn", storeName: "Y2K Streetwear Store", phone: "0988776655", date: "2026-10-27" }
];

// Danh sách sản phẩm chờ kiểm duyệt (Product Moderation cho Admin Moderator)
let pendingProducts = [];

// Danh sách Khiếu nại & Hỗ trợ Khách Hàng (Customer Support & Complaints)
let complaints = [
  {
    id: "KN-9021",
    customer_name: "Nguyễn Thu Thảo",
    customer_phone: "0933112233",
    customer_email: "khachhang@gmail.com",
    order_id: "ORD-99120",
    seller_name: "Wig Luxury Sài Gòn",
    type: "Hàng sai mô tả / Hỗ trợ đổi size",
    content: "Mình đặt tóc giả màu Nâu Sô-cô-la nhưng shop đóng gói màu Đen Tự Nhiên. Nhờ sàn hỗ trợ liên hệ shop đổi lại đúng màu giúp mình nhé!",
    created_at: "2026-11-01 10:20",
    status: "pending", // pending | in_progress | resolved | rejected
    resolution_note: ""
  },
  {
    id: "KN-8842",
    customer_name: "Đặng Tuấn Anh",
    customer_phone: "0908765432",
    customer_email: "tuananh@gmail.com",
    order_id: "ORD-87102",
    seller_name: "Y2K Streetwear Boutique",
    type: "Vận chuyển giao trễ / Hư hỏng vỏ hộp",
    content: "Đơn hàng đã hơn 4 ngày chưa thấy GHN phát hàng, hộp hàng bị móp một góc khi bưu tá mang tới. Đề nghị kiểm tra tiến độ giao.",
    created_at: "2026-10-31 15:45",
    status: "in_progress",
    resolution_note: "Đã liên hệ điều phối GHN hối giao gấp trong chiều nay và bù voucher 30k"
  },
  {
    id: "KN-7719",
    customer_name: "Trần Mai Lan",
    customer_phone: "0912987654",
    customer_email: "mailan@yahoo.com",
    order_id: "ORD-76510",
    seller_name: "Wig Luxury Sài Gòn",
    type: "Yêu cầu hoàn tiền dịch vụ Spa tóc",
    content: "Yêu cầu hoàn tiền vì thời gian xử lý phục hồi tóc lâu hơn 2 ngày so với cam kết ban đầu.",
    created_at: "2026-10-28 09:15",
    status: "resolved",
    resolution_note: "Đã hoàn trả 150.000đ vào ví và tặng kèm 01 chai xịt dưỡng tóc tơ lụa cao cấp."
  }
];

// Danh sách Voucher khuyến mãi của Shop & Sàn (Admin Financial quản lý)
let vouchers = [
  {
    id: 1,
    seller_id: 2,
    code: "VIBENEW100",
    name: "Voucher Chào Mừng Thành Viên Mới",
    campaign_name: "Chào Mừng Thành Viên Mới 2026",
    discount_type: "fixed",
    discount_value: 100000,
    min_order_value: 300000,
    max_discount: 100000,
    discount_percent: 0,
    total_usage_limit: 1000,
    per_user_limit: 1,
    target_platform: "Toàn Sàn VibeBili.vn",
    used_count: 142,
    start_date: "2026-10-01",
    end_date: "2026-12-31",
    status: "active"
  },
  {
    id: 2,
    seller_id: 2,
    code: "VIBEWIG20",
    name: "Ưu Đãi Tóc Giả Cao Cấp -20%",
    campaign_name: "Siêu Lễ Hội Tóc Xinh VibeWig",
    discount_type: "percent",
    discount_value: 20,
    discount_percent: 20,
    min_order_value: 400000,
    max_discount: 100000,
    total_usage_limit: 500,
    per_user_limit: 2,
    target_platform: "Ngành Tóc Giả Cao Cấp",
    used_count: 88,
    start_date: "2026-10-20",
    end_date: "2026-11-20",
    status: "active"
  },
  {
    id: 3,
    seller_id: 2,
    code: "FREESHIP50K",
    name: "Mã Miễn Phí Vận Chuyển Toàn Quốc",
    campaign_name: "Trợ Giá Vận Chuyển Toàn Quốc",
    discount_type: "freeship",
    discount_value: 30000,
    discount_percent: 0,
    min_order_value: 200000,
    max_discount: 30000,
    total_usage_limit: 800,
    per_user_limit: 3,
    target_platform: "Toàn Sàn VibeBili.vn",
    used_count: 215,
    start_date: "2026-10-25",
    end_date: "2026-11-30",
    status: "active"
  },
  {
    id: 4,
    seller_id: 0,
    code: "MEGA11_SALE",
    name: "Đại Tiệc Mua Sắm Siêu Sale 11.11",
    campaign_name: "Mega Sale Đơn Đôi 11.11 Toàn Quốc",
    discount_type: "percent",
    discount_value: 30,
    discount_percent: 30,
    min_order_value: 500000,
    max_discount: 200000,
    total_usage_limit: 2000,
    per_user_limit: 1,
    target_platform: "Toàn Sàn VibeBili.vn",
    used_count: 42,
    start_date: "2026-11-01",
    end_date: "2026-11-15",
    status: "active"
  }
];

// Danh Sách Đánh Giá Thực Tế (Reviews kèm Body Fit Tags)
let reviews = [];

const spaRequests = [
  {
    id: 'SPA-8821',
    customer_id: 4,
    customer_name: 'Nguyễn Văn A',
    customer_phone: '0901234567',
    customer_address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    wig_type: 'Tóc giả nguyên đầu tơ nhân tạo chịu nhiệt 60cm',
    condition_description: 'Tóc bị rối ở phần đuôi sau 3 tháng sử dụng, cần gỡ rối và hấp phục hồi phủ bóng lụa',
    service_type: 'Combo Spa Phục Hồi Chuyên Sâu',
    service_price: 250000,
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    status: 'Đang xử lý tại xưởng',
    created_at: '2026-10-28',
    pickup_date: '2026-10-30',
    technician_note: 'Đã hoàn tất gỡ rối cơ học, đang sấy hấp nhiệt định hình nếp sóng nước'
  },
  {
    id: 'SPA-6712',
    customer_id: 4,
    customer_name: 'Nguyễn Văn A',
    customer_phone: '0901234567',
    customer_address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    wig_type: 'Tóc giả mái bay buộc đuôi ngựa',
    condition_description: 'Cần uốn lại nếp cúp đuôi và khử khuẩn nano bạc',
    service_type: 'Khử khuẩn & Uốn định hình form tóc',
    service_price: 150000,
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    status: 'Hoàn thành',
    created_at: '2026-10-20',
    pickup_date: '2026-10-22',
    technician_note: 'Đã hoàn tất khử khuẩn và đóng gói hộp bảo quản'
  }
];

const sellerFinances = {
  2: {
    available_balance: 14850000,
    escrow_balance: 4200000,
    total_withdrawn: 38500000,
    bank_account: {
      bank_name: 'MB Bank',
      account_number: '98230188999',
      account_holder: 'TRAN THI MAI',
      branch: 'Chi nhánh Sài Gòn'
    },
    badges: ['mall', 'favorite_plus', 'virgin_hair_certified'],
    withdrawal_history: [
      {
        id: 'WD-9921',
        amount: 15000000,
        status: 'Thành công',
        created_at: '2026-10-25',
        bank: 'MB Bank ***999'
      },
      {
        id: 'WD-8812',
        amount: 23500000,
        status: 'Thành công',
        created_at: '2026-10-15',
        bank: 'MB Bank ***999'
      }
    ]
  }
};

module.exports = {
  users,
  categories,
  products,
  orders,
  pendingSellers,
  pendingProducts,
  complaints,
  vouchers,
  spaRequests,
  sellerFinances,
  reviews
};
