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
  { id: 1, name: "Tóc Giả Cao Cấp", slug: "toc-gia-cao-cap", count: 32 },
  { id: 2, name: "Thời Trang Nữ", slug: "thoi-trang-nu", count: 85 },
  { id: 6, name: "Thời Trang Nam", slug: "thoi-trang-nam", count: 46 },
  { id: 3, name: "Outfit x Hairstyle Combo", slug: "combo-outfit-hairstyle", count: 18 },
  { id: 4, name: "Tóc Giả Nguyên Đầu", slug: "toc-gia-nguyen-dau", count: 20 },
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
  },
  {
    id: 7,
    seller_id: 3,
    seller_name: "Y2K Streetwear Boutique",
    category_id: 6,
    category_name: "Thời Trang Nam",
    name: "Áo Thun Nam Oversize Streetwear Graphic Cyber - 100% Cotton 250GSM",
    slug: "ao-thun-nam-oversize-cyber",
    description: "Chất liệu cotton 100% định lượng 250GSM dày dặn, thấm hút mồ hôi cực tốt. Form áo boxy rộng rãi chuẩn xu hướng streetwear quốc tế, hình in sắc nét không bong tróc.",
    price: 219000,
    original_price: 320000,
    main_image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    sold_count: 1420,
    is_hot: true,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Đen Washed", "Trắng Tinh", "Xám Tiêu"] },
      { name: "Kích cỡ (Size)", values: ["M (50-65kg)", "L (65-75kg)", "XL (75-90kg)"] }
    ],
    variants: [
      { id: 10, sku: "MEN-TSHIRT-BLACK-M", price: 219000, original_price: 320000, stock: 95, color: "Đen Washed", size: "M (50-65kg)", title: "Đen Washed / Size M" },
      { id: 11, sku: "MEN-TSHIRT-WHITE-L", price: 219000, original_price: 320000, stock: 70, color: "Trắng Tinh", size: "L (65-75kg)", title: "Trắng Tinh / Size L" }
    ]
  },
  {
    id: 8,
    seller_id: 3,
    seller_name: "Y2K Streetwear Boutique",
    category_id: 6,
    category_name: "Thời Trang Nam",
    name: "Quần Jean Nam Ống Rộng Baggy Phong Cách Retro Hàn Quốc",
    slug: "quan-jean-nam-baggy-retro",
    description: "Form quần jean ống suông baggy hack dáng chân dài, chất denim 13oz đứng form không xù lông. Màu wash xám khói vintage cực dễ phối với áo thun hoặc blazer.",
    price: 380000,
    original_price: 550000,
    main_image: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    sold_count: 890,
    is_hot: true,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Xanh Retro Wash", "Xám Khói Vintage"] },
      { name: "Size Quần", values: ["Size 29 (48-55kg)", "Size 30 (56-63kg)", "Size 31 (64-70kg)", "Size 32 (71-78kg)"] }
    ],
    variants: [
      { id: 12, sku: "MEN-JEAN-BLUE-30", price: 380000, original_price: 550000, stock: 45, color: "Xanh Retro Wash", size: "Size 30 (56-63kg)", title: "Xanh Retro / Size 30" }
    ]
  },
  {
    id: 9,
    seller_id: 3,
    seller_name: "Y2K Streetwear Boutique",
    category_id: 6,
    category_name: "Thời Trang Nam",
    name: "Áo Khoác Bomber Da Nam Nữ Unisex Phối Tay Áo Thể Thao",
    slug: "ao-khoac-bomber-da-unisex",
    description: "Mẫu áo khoác bomber da phối nỉ phong cách racing thể thao trẻ trung. Lớp lót trần bông thoáng khí, bo chun cổ tay dày dặn, khóa kéo kim loại YKK cao cấp.",
    price: 490000,
    original_price: 700000,
    main_image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    rating: 5.0,
    sold_count: 620,
    is_hot: true,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Đen Bạc Racing", "Xanh Rêu Đậm"] },
      { name: "Size Áo", values: ["Size L (55-68kg)", "Size XL (68-82kg)"] }
    ],
    variants: [
      { id: 13, sku: "MEN-BOMBER-BLACK-L", price: 490000, original_price: 700000, stock: 35, color: "Đen Bạc Racing", size: "Size L (55-68kg)", title: "Đen Bạc / Size L" }
    ]
  },
  {
    id: 10,
    seller_id: 3,
    seller_name: "Y2K Streetwear Boutique",
    category_id: 6,
    category_name: "Thời Trang Nam",
    name: "Áo Blazer Nam Form Rộng Phong Cách Minimalism Hàn Quốc",
    slug: "ao-blazer-nam-minimalism",
    description: "Áo blazer 2 lớp form rộng phóng khoáng, chất vải tuyết mưa đứng dáng không nhăn nhúm. Đệm vai tự nhiên tôn phom người mặc nam tính, lịch lãm.",
    price: 560000,
    original_price: 790000,
    main_image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    sold_count: 410,
    is_hot: false,
    is_combo: false,
    options: [
      { name: "Màu sắc", values: ["Đen Classic", "Xám Tro Hàn Quốc", "Nâu Be"] },
      { name: "Size Áo", values: ["M (55-65kg)", "L (65-75kg)", "XL (75-85kg)"] }
    ],
    variants: [
      { id: 14, sku: "MEN-BLAZER-BLACK-L", price: 560000, original_price: 790000, stock: 25, color: "Đen Classic", size: "L (65-75kg)", title: "Đen Classic / Size L" }
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

// Danh sách Voucher khuyến mãi của Shop & Sàn
let vouchers = [
  {
    id: 1,
    seller_id: 2,
    code: "VIBENEW100",
    name: "Voucher Chào Mừng Thành Viên Mới",
    discount_type: "fixed",
    discount_value: 100000,
    min_order_value: 300000,
    max_discount: 100000,
    usage_limit: 500,
    used_count: 82,
    start_date: "2026-10-01",
    end_date: "2026-12-31",
    status: "active"
  },
  {
    id: 2,
    seller_id: 2,
    code: "VIBEWIG20",
    name: "Ưu Đãi Tóc Giả Cao Cấp -20%",
    discount_type: "percent",
    discount_value: 20,
    min_order_value: 400000,
    max_discount: 100000,
    usage_limit: 100,
    used_count: 34,
    start_date: "2026-10-20",
    end_date: "2026-11-20",
    status: "active"
  },
  {
    id: 3,
    seller_id: 2,
    code: "FREESHIP50K",
    name: "Mã Miễn Phí Vận Chuyển Toàn Quốc",
    discount_type: "freeship",
    discount_value: 30000,
    min_order_value: 200000,
    max_discount: 30000,
    usage_limit: 200,
    used_count: 65,
    start_date: "2026-10-25",
    end_date: "2026-11-30",
    status: "active"
  }
];

// Danh Sách Đánh Giá Thực Tế (Reviews kèm Body Fit Tags)
let reviews = [
  {
    id: 1,
    product_id: 1,
    user_name: "Nguyễn Mai Phương",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "2026-10-28",
    color: "Nâu Sô-cô-la",
    size: "Size M (54-58cm)",
    height: "1m62",
    weight: "49kg",
    fit: "Chuẩn size",
    comment: "Tóc mềm mượt dã man luôn mọi người ơi! Sợi tơ sờ y hệt tóc thật, không hề bị bóng giả dưới ánh đèn hay nắng. Đội lên ôm sát vòng đầu, chụp ảnh sống ảo nhìn tự nhiên 100%. Đáng tiền lắm ạ!",
    images: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80"
    ],
    helpful_count: 38
  },
  {
    id: 2,
    product_id: 1,
    user_name: "Trần Bảo Ngọc",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "2026-10-24",
    color: "Đen Tự Nhiên",
    size: "Size M (54-58cm)",
    height: "1m58",
    weight: "47kg",
    fit: "Chuẩn size",
    comment: "Lần đầu mua tóc giả mà ưng ý thế này. Tóc dày dặn, lọn sóng nước bồng bềnh rất tôn dáng mặt. Shop đóng gói hộp cứng cẩn thận kèm lưới trùm đầu xịn.",
    images: [],
    helpful_count: 19
  },
  {
    id: 3,
    product_id: 1,
    user_name: "Lê Hoàng Yến",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    rating: 4,
    date: "2026-10-18",
    color: "Xám Khói",
    size: "Size S (52-54cm)",
    height: "1m55",
    weight: "44kg",
    fit: "Hơi chật",
    comment: "Màu xám khói ở ngoài siêu cháy, bắt mắt cực kỳ. Đầu mình hơi tròn nên size S hơi ôm sát một xíu, ai chu vi đầu từ 54cm nên chọn M nha. Còn lại chất lượng tóc 10/10.",
    images: [],
    helpful_count: 12
  },
  {
    id: 4,
    product_id: 7,
    user_name: "Đặng Tuấn Anh",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "2026-10-29",
    color: "Đen Washed",
    size: "Size L (65-75kg)",
    height: "1m76",
    weight: "70kg",
    fit: "Chuẩn size",
    comment: "Áo chất cotton 250GSM dày dặn, đứng form chuẩn streetwear. Giặt máy không bị bai nhão cổ áo hay xù lông. Form boxy mặc lên nhìn vai rộng cực đẹp!",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80"
    ],
    helpful_count: 27
  },
  {
    id: 5,
    product_id: 8,
    user_name: "Trần Minh Khang",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "2026-10-26",
    color: "Xanh Retro Wash",
    size: "Size 30 (56-63kg)",
    height: "1m72",
    weight: "60kg",
    fit: "Chuẩn size",
    comment: "Quần jean form baggy ống suông hack dáng đỉnh thật sự, màu wash vintage chuẩn hình. Mặc với giày sneaker hoặc chunky boot bao ngầu.",
    images: [],
    helpful_count: 15
  }
];

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
  vouchers,
  spaRequests,
  sellerFinances,
  reviews
};
