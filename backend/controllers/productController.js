const db = require('../config/db');
const mockData = require('../data/mockData');

// 1. Lấy danh sách sản phẩm (Hỗ trợ tìm kiếm, lọc danh mục, combo)
const getAllProducts = async (req, res) => {
  const { category, search, combo } = req.query;

  try {
    let sql = `
      SELECT p.id, p.name, p.slug, p.description, p.base_price AS price, p.original_price, 
             p.main_image, p.rating, p.sold_count, p.is_hot, p.is_combo, p.created_at, 
             c.name AS category_name, c.id AS category_id,
             u.name AS seller_name, u.id AS seller_id
      FROM Products p
      JOIN Categories c ON p.category_id = c.id
      JOIN Users u ON p.seller_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += ' AND (c.slug = ? OR c.id = ? OR c.name = ?)';
      params.push(category, category, category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (combo === 'true') {
      sql += ' AND p.is_combo = TRUE';
    }

    sql += ' ORDER BY p.id DESC';

    const [rows] = await db.query(sql, params);
    return res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.warn('[Products Fallback]: Phục vụ Mock Data do (' + error.message + ')');
    let filtered = [...mockData.products];

    if (category) {
      filtered = filtered.filter(p => 
        p.category_name.toLowerCase().includes(category.toLowerCase()) || 
        p.category_id == category || 
        p.slug.includes(category)
      );
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (combo === 'true') {
      filtered = filtered.filter(p => p.is_combo);
    }

    return res.status(200).json({ success: true, count: filtered.length, data: filtered });
  }
};

// 2. Lấy chi tiết sản phẩm kèm Ma Trận Biến Thể & Thuộc Tính
const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [productRows] = await db.query(
      `SELECT p.id, p.name, p.slug, p.description, p.base_price AS price, p.original_price, 
              p.main_image, p.rating, p.sold_count, p.is_hot, p.is_combo,
              c.name AS category_name, c.id AS category_id,
              u.name AS seller_name, u.id AS seller_id
       FROM Products p
       JOIN Categories c ON p.category_id = c.id
       JOIN Users u ON p.seller_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (productRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
    }

    const product = productRows[0];

    // Lấy các nhóm Options (Vd: Màu sắc, Độ dài, Size)
    const [options] = await db.query(
      `SELECT po.id AS option_id, po.option_name, pov.id AS value_id, pov.value_name
       FROM ProductOptions po
       JOIN ProductOptionValues pov ON po.id = pov.option_id
       WHERE po.product_id = ?`,
      [id]
    );

    // Nhóm lại theo option_name
    const optionsMap = {};
    options.forEach(row => {
      if (!optionsMap[row.option_name]) {
        optionsMap[row.option_name] = { name: row.option_name, values: [] };
      }
      optionsMap[row.option_name].values.push(row.value_name);
    });
    product.options = Object.values(optionsMap);

    // Lấy danh sách Variants (SKU, giá, tồn kho)
    const [variants] = await db.query(
      `SELECT id, sku, price, original_price, stock_quantity AS stock, image_url, variant_title AS title
       FROM ProductVariants
       WHERE product_id = ?`,
      [id]
    );
    product.variants = variants;

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    const product = mockData.products.find(p => p.id === parseInt(id));
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
    }
    return res.status(200).json({ success: true, data: product });
  }
};

// 3. Thêm sản phẩm mới (Dành cho Seller)
const createProduct = async (req, res) => {
  const {
    name,
    description = '',
    price = 0,
    original_price,
    category_id = 1,
    seller_id,
    stock = 20,
    main_image,
    options = [],
    variants = []
  } = req.body;

  const sellerId = req.user ? req.user.id : (seller_id || 2);

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp Tên sản phẩm và Giá bán!'
    });
  }

  const defaultImg = main_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';

  try {
    const [result] = await db.query(
      `INSERT INTO Products (seller_id, category_id, name, description, base_price, original_price, main_image, is_hot)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [sellerId, category_id, name, description, price, original_price || price * 1.3, defaultImg]
    );
    const productId = result.insertId;

    // Tự động tạo 1 SKU biến thể mặc định nếu không truyền variants
    const skuCode = 'WIG-' + Math.floor(100000 + Math.random() * 900000);
    await db.query(
      `INSERT INTO ProductVariants (product_id, sku, price, original_price, stock_quantity, variant_title, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [productId, skuCode, price, original_price || price * 1.3, stock, 'Tiêu chuẩn', defaultImg]
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng bán sản phẩm mới thành công!',
      productId
    });
  } catch (error) {
    console.warn('[Create Product Fallback]: Lưu tạm vào Mock Store (' + error.message + ')');

    const newProd = {
      id: mockData.products.length + 1,
      seller_id: sellerId,
      seller_name: 'Wig Luxury Sài Gòn',
      category_id: Number(category_id),
      category_name: category_id == 1 ? 'Tóc Giả Cao Cấp' : 'Thời Trang Nữ',
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      price: Number(price),
      original_price: Number(original_price || price * 1.3),
      main_image: defaultImg,
      rating: 5.0,
      sold_count: 0,
      is_hot: true,
      is_combo: false,
      options: options.length > 0 ? options : [
        { name: 'Phân loại', values: ['Tiêu chuẩn'] }
      ],
      variants: variants.length > 0 ? variants : [
        {
          id: Date.now(),
          sku: 'SKU-' + Math.floor(100000 + Math.random() * 900000),
          price: Number(price),
          original_price: Number(original_price || price * 1.3),
          stock: Number(stock),
          title: 'Tiêu chuẩn'
        }
      ]
    };

    mockData.products.unshift(newProd);

    return res.status(201).json({
      success: true,
      message: 'Đăng bán sản phẩm mới thành công!',
      productId: newProd.id,
      data: newProd
    });
  }
};

// 4. Đăng tải sản phẩm hàng loạt (Bulk Upload)
const bulkCreateProducts = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách sản phẩm tải lên không hợp lệ!' });
  }

  const sellerId = req.user?.id || 2;
  const createdList = [];

  for (const item of items) {
    if (!item.name || !item.price) continue;
    const catId = item.category?.includes('Thời Trang') ? 2 : 1;
    const catName = catId === 2 ? 'Thời Trang Nữ' : 'Tóc Giả Cao Cấp';
    const defaultImg = item.image || (catId === 1
      ? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'
      : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80');

    const newProd = {
      id: mockData.products.length + 1,
      seller_id: sellerId,
      seller_name: req.user?.shop_name || req.user?.name || 'Wig Luxury Sài Gòn',
      category_id: catId,
      category_name: catName,
      name: item.name,
      slug: item.name.toLowerCase().replace(/\s+/g, '-'),
      description: item.description || 'Sản phẩm chính hãng đăng bán qua tính năng Bulk Upload.',
      price: Number(item.price),
      original_price: Number(item.original_price || item.price * 1.3),
      main_image: defaultImg,
      rating: 5.0,
      sold_count: 0,
      is_hot: true,
      is_combo: false,
      options: [
        { name: 'Màu sắc', values: [item.color || 'Mặc định'] },
        { name: 'Kích cỡ', values: [item.size || 'Tiêu chuẩn'] }
      ],
      variants: [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          sku: 'SKU-' + Math.floor(100000 + Math.random() * 900000),
          price: Number(item.price),
          original_price: Number(item.original_price || item.price * 1.3),
          stock: Number(item.stock || 50),
          title: `${item.color || 'Mặc định'} / ${item.size || 'Tiêu chuẩn'}`
        }
      ]
    };
    mockData.products.unshift(newProd);
    createdList.push(newProd);
  }

  return res.status(201).json({
    success: true,
    message: `Đăng tải hàng loạt thành công ${createdList.length} sản phẩm lên gian hàng!`,
    count: createdList.length,
    data: createdList
  });
};

// 5. Xóa sản phẩm (Seller / Admin)
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Products WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công!' });
  } catch (error) {
    const idx = mockData.products.findIndex(p => p.id === parseInt(id));
    if (idx !== -1) {
      mockData.products.splice(idx, 1);
    }
    return res.status(200).json({ success: true, message: 'Xóa sản phẩm thành công!' });
  }
};

// 6. Lấy danh mục sản phẩm toàn hệ thống
const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Categories ORDER BY id ASC');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(200).json({ success: true, data: mockData.categories });
  }
};

// 7. Lấy danh sách đánh giá thực tế của sản phẩm (Reviews kèm Fit Tags)
const getProductReviews = async (req, res) => {
  const { id } = req.params;
  const prodId = parseInt(id);
  const reviews = mockData.reviews.filter(r => r.product_id === prodId);
  return res.status(200).json({ success: true, count: reviews.length, data: reviews });
};

// 8. Khách hàng gửi đánh giá mới kèm Body Fit Tags
const createProductReview = async (req, res) => {
  const { id } = req.params;
  const prodId = parseInt(id);
  const {
    user_name,
    rating,
    color,
    size,
    height,
    weight,
    fit,
    comment,
    images
  } = req.body;

  if (!comment || !rating) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao và nhập nội dung đánh giá!' });
  }

  const newReview = {
    id: Date.now(),
    product_id: prodId,
    user_name: user_name || req.user?.name || 'Khách hàng VibeBili',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    rating: Number(rating) || 5,
    date: new Date().toISOString().split('T')[0],
    color: color || 'Tiêu chuẩn',
    size: size || 'Size M',
    height: height || '1m60',
    weight: weight || '50kg',
    fit: fit || 'Chuẩn size',
    comment,
    images: Array.isArray(images) ? images : [],
    helpful_count: 0
  };

  mockData.reviews.unshift(newReview);

  return res.status(201).json({
    success: true,
    message: 'Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp phản hồi quý báu.',
    data: newReview
  });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  bulkCreateProducts,
  deleteProduct,
  getCategories,
  getProductReviews,
  createProductReview
};
