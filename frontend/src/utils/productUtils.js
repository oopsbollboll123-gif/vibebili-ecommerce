// VibeBili Shared Product & Data Utilities

// Fallback SVG data URI: Hoàn toàn độc lập, không phụ thuộc mạng/CDN bên ngoài, không bao giờ bị lỗi ảnh hỏng
export const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="%23f1f5f9"/><circle cx="300" cy="270" r="70" fill="%23cbd5e1"/><path d="M180 430c0-66.27 53.73-120 120-120s120 53.73 120 120" fill="%2394a3b8"/><text x="50%25" y="520" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="24" font-weight="700" fill="%2364748b">VibeBili Fashion</text></svg>`;

/**
 * Chuẩn hóa cấu trúc sản phẩm đồng nhất cho toàn hệ thống
 * Đảm bảo cả main_image và image, category_name và category đều luôn có dữ liệu hợp lệ
 */
export const normalizeProduct = (p, fallbackIndex = 0) => {
  if (!p || typeof p !== 'object') return null;

  const name = (p.name || p.title || `Sản phẩm VibeBili #${fallbackIndex + 1}`).trim();
  const catName = p.category_name || p.category || (p.is_combo ? 'Outfit x Hairstyle Combo' : 'Tóc Giả Cao Cấp');

  let catId = Number(p.category_id);
  if (!catId || isNaN(catId)) {
    if (catName.includes('Nam')) catId = 6;
    else if (catName.includes('Nữ') || catName.includes('Áo')) catId = 2;
    else if (catName.includes('Combo')) catId = 3;
    else catId = 1;
  }

  const rawImg = p.main_image || p.image || p.link_anh || p.hinh_anh || p.imageUrl || '';
  const finalImg = (typeof rawImg === 'string' && rawImg.trim().length > 0) ? rawImg.trim() : DEFAULT_PRODUCT_IMAGE;

  const price = Math.max(0, Number(p.price || p.base_price || 299000));
  const origPrice = Math.max(price, Number(p.original_price || p.originalPrice || Math.round(price * 1.3)));

  const isCombo = Boolean(
    p.is_combo ||
    catName.toLowerCase().includes('combo') ||
    name.toLowerCase().includes('combo')
  );

  return {
    ...p,
    id: p.id || (Date.now() + fallbackIndex),
    name,
    category: catName,
    category_name: catName,
    category_id: catId,
    slug: p.slug || name.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
    price,
    original_price: origPrice,
    originalPrice: origPrice,
    stock: Math.max(0, Number(p.stock !== undefined ? p.stock : 50)),
    status: p.status || 'Đang bán',
    main_image: finalImg,
    image: finalImg,
    rating: Number(p.rating) || 5.0,
    sold_count: p.sold_count !== undefined ? p.sold_count : 0,
    is_combo: isCombo,
    description: p.description || 'Sản phẩm chính hãng chất lượng cao trên sàn VibeBili.',
    options: Array.isArray(p.options) && p.options.length > 0 ? p.options : [
      { name: 'Màu sắc', values: [p.color || 'Tiêu chuẩn'] },
      { name: 'Kích cỡ', values: [p.size || 'Tiêu chuẩn'] }
    ]
  };
};

/**
 * Đọc và chuẩn hóa dữ liệu vibebili_custom_products trong LocalStorage
 * Tự động sửa chữa các bản ghi thiếu trường để không bao giờ bị lỗi màn hình trắng
 */
export const getCleanCustomProducts = () => {
  try {
    const raw = localStorage.getItem('vibebili_custom_products');
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    let hasChanges = false;
    const normalized = list.map((item, idx) => {
      const fixed = normalizeProduct(item, idx);
      if (!item.category_name || !item.main_image || !item.original_price) {
        hasChanges = true;
      }
      return fixed;
    }).filter(Boolean);

    // Nếu phát hiện dữ liệu cũ bị thiếu trường, ghi đè lại bản đã chuẩn hóa ngay lập tức
    if (hasChanges) {
      localStorage.setItem('vibebili_custom_products', JSON.stringify(normalized));
    }

    return normalized;
  } catch (err) {
    console.warn('[VibeBili Data]: Lỗi parse custom products, reset mảng an toàn:', err);
    return [];
  }
};
