// Mock Data dùng khi chưa bật MySQL Server (Hỗ trợ demo mượt mà)

let users = [
  {
    id: 1,
    name: "Admin Quản Trị Viên",
    email: "phuc@admin.com",
    password: "password123", // Cho phép test trực tiếp bằng 123456 hoặc password123
    role: "admin",
    phone: "0909123456",
    address: "Trụ sở VibeBili.vn, Quận 1, TP. HCM",
    status: "active"
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
  }
];

let categories = [
  { id: 1, name: "Tóc Giả Cao Cấp", slug: "toc-gia-cao-cap", count: 24 },
  { id: 2, name: "Thời Trang Nữ", slug: "thoi-trang-nu", count: 85 },
  { id: 3, name: "Outfit x Hairstyle Combo", slug: "combo-outfit-hairstyle", count: 12 },
  { id: 4, name: "Tóc Giả Nguyên Đầu", slug: "toc-gia-nguyen-dau", count: 15 },
  { id: 5, name: "Áo Nữ & Croptop", slug: "ao-nu-croptop", count: 42 }
];

let products = [
  {
    id: 1,
    seller_id: 2,
    seller_name: "Wig Luxury Sài Gòn",
    category_id: 1,
    category_name: "Tóc Giả Cao Cấp",
    name: "Tóc Giả Nữ Nguyên Đầu Xoăn Sóng Nước 60cm - Sợi Tơ Nhiệt Cao Cấp",
    slug: "toc-gia-nu-xoan-song-nuoc-60cm",
    description: "Sản phẩm tóc giả nữ nguyên đầu làm từ sợi tơ lụa nhân tạo chịu nhiệt cao đến 180°C. Mềm mượt như tóc thật, không bóng lộ, thiết kế lưới thoáng khí co giãn kèm đai gài chắc chắn.",
    price: 350000,
    original_price: 500000,
    main_image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    sold_count: 1240,
    is_hot: true,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Nâu Sô-cô-la", "Đen Tự Nhiên", "Xám Khói"] },
      { name: "Độ dài sợi tóc", values: ["50cm", "60cm (Hot)", "70cm"] },
      { name: "Chu vi vòng đầu (Size)", values: ["S (52-54cm)", "M (54-58cm)", "L (58-60cm)"] }
    ],
    variants: [
      { id: 1, sku: "WIG-WAVE-CHOCO-60-M", price: 350000, original_price: 500000, stock: 45, color: "Nâu Sô-cô-la", length: "60cm (Hot)", size: "M (54-58cm)", title: "Nâu Sô-cô-la / 60cm / Size M" },
      { id: 2, sku: "WIG-WAVE-BLACK-60-M", price: 350000, original_price: 500000, stock: 30, color: "Đen Tự Nhiên", length: "60cm (Hot)", size: "M (54-58cm)", title: "Đen Tự Nhiên / 60cm / Size M" },
      { id: 3, sku: "WIG-WAVE-GREY-60-M", price: 370000, original_price: 520000, stock: 20, color: "Xám Khói", length: "60cm (Hot)", size: "M (54-58cm)", title: "Xám Khói / 60cm / Size M" }
    ]
  },
  {
    id: 2,
    seller_id: 2,
    seller_name: "Wig Luxury Sài Gòn",
    category_id: 1,
    category_name: "Tóc Giả Cao Cấp",
    name: "Tóc Giả Bob Ngắn Uốn Cụp Hàn Quốc Cá Tính 30cm",
    slug: "toc-gia-bob-ngan-han-quoc",
    description: "Tóc giả bob ngắn ôm sát khuôn mặt tôn dáng cằm V-line, kiểu dáng trẻ trung thanh lịch chuẩn Idol K-Pop.",
    price: 280000,
    original_price: 390000,
    main_image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    sold_count: 856,
    is_hot: true,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Đen Tự Nhiên", "Nâu Trà Sữa"] },
      { name: "Chu vi vòng đầu (Size)", values: ["M (54-58cm)"] }
    ],
    variants: [
      { id: 4, sku: "WIG-BOB-BLACK-30-M", price: 280000, original_price: 390000, stock: 50, color: "Đen Tự Nhiên", length: "30cm", size: "M (54-58cm)", title: "Đen Tự Nhiên / 30cm / Size M" }
    ]
  },
  {
    id: 3,
    seller_id: 3,
    seller_name: "Y2K Streetwear Boutique",
    category_id: 2,
    category_name: "Thời Trang Nữ",
    name: "Áo Croptop Nữ Ôm Sát Y2K Cyberpunk Khóa Kéo Kim Loại",
    slug: "ao-croptop-y2k-cyberpunk",
    description: "Áo thun croptop phong cách Y2K đậm chất đường phố, vải thun gân co giãn 4 chiều thoáng mát, họa tiết cá tính.",
    price: 169000,
    original_price: 240000,
    main_image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    sold_count: 980,
    is_hot: true,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Đen Cyber", "Trắng Bạc"] },
      { name: "Kích cỡ (Size)", values: ["S", "M", "L"] }
    ],
    variants: [
      { id: 5, sku: "CLO-CROP-BLACK-S", price: 169000, original_price: 240000, stock: 80, color: "Đen Cyber", size: "S", title: "Đen Cyber / Size S" },
      { id: 6, sku: "CLO-CROP-BLACK-M", price: 169000, original_price: 240000, stock: 65, color: "Đen Cyber", size: "M", title: "Đen Cyber / Size M" }
    ]
  },
  {
    id: 4,
    seller_id: 3,
    seller_name: "Y2K Streetwear Boutique",
    category_id: 2,
    category_name: "Thời Trang Nữ",
    name: "Đầm Tiểu Thư Vải Dạ Tweed Dáng Dài Cao Cấp Phong Cách Korean Chic",
    slug: "dam-tweed-korean-chic",
    description: "Đầm tweed sang trọng đính cúc ngọc trai lấp lánh, form dáng chuẩn thanh lịch phù hợp đi tiệc, hẹn hò hoặc dạo phố.",
    price: 420000,
    original_price: 600000,
    main_image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    sold_count: 430,
    is_hot: false,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Trắng Kem", "Hồng Pastel"] },
      { name: "Kích cỡ (Size)", values: ["S", "M"] }
    ],
    variants: [
      { id: 7, sku: "CLO-DRESS-WHITE-M", price: 420000, original_price: 600000, stock: 25, color: "Trắng Kem", size: "M", title: "Trắng Kem / Size M" }
    ]
  },
  {
    id: 5,
    seller_id: 2,
    seller_name: "Wig Luxury Sài Gòn",
    category_id: 3,
    category_name: "Outfit x Hairstyle Combo",
    name: "Combo Y2K Cyberpunk: Áo Croptop x Tóc Giả Bob Ngắn Khói Xám",
    slug: "combo-y2k-cyberpunk-bob",
    description: "Sự phối hợp hoàn hảo từ chuyên gia thời trang VibeBili.vn: Áo croptop Y2K phối xích kim loại kết hợp cùng mái tóc Bob ngắn xám khói thời thượng.",
    price: 480000,
    original_price: 650000,
    main_image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    rating: 5.0,
    sold_count: 310,
    is_hot: true,
    is_combo: true,
    options: [],
    variants: [
      { id: 8, sku: "COMBO-Y2K-01", price: 480000, original_price: 650000, stock: 35, title: "Combo Y2K Bob Ngắn Cá Tính" }
    ]
  },
  {
    id: 6,
    seller_id: 2,
    seller_name: "Wig Luxury Sài Gòn",
    category_id: 3,
    category_name: "Outfit x Hairstyle Combo",
    name: "Combo Korean Chic: Đầm Tweed Tiểu Thư x Tóc Giả Xoăn Sóng Nâu Hạt Dẻ",
    slug: "combo-korean-chic-xoan-song",
    description: "Biến hóa diện mạo như quý cô Hàn Quốc trọn gói: Đầm tweed đính cúc ngọc kiêu kỳ kết hợp tóc giả xoăn bồng bềnh dài quyến rũ.",
    price: 590000,
    original_price: 800000,
    main_image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    sold_count: 215,
    is_hot: true,
    is_combo: true,
    options: [],
    variants: [
      { id: 9, sku: "COMBO-KOREAN-02", price: 590000, original_price: 800000, stock: 28, title: "Combo Korean Chic Quý Cô" }
    ]
  }
];

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

module.exports = {
  users,
  categories,
  products,
  orders,
  pendingSellers
};
