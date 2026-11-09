// VibeBili Shared Product & Data Utilities

// Fallback SVG data URI: Dùng SVG Base64 chuẩn W3C, an toàn 100% trên mọi trình duyệt, không bao giờ bị lỗi ảnh đứt gãy
export const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgNjAwIDYwMCI+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmMmY0ZjciLz48ZyBmaWxsPSIjY2JkNWUxIj48Y2lyY2xlIGN4PSIzMDAiIGN5PSIyNTAiIHI9IjY1Ii8+PHBhdGggZD0iTTE5MCA0MjBjMC02MCA1MC0xMTAgMTEwLTExMHwxMTAgNTAgMTEwIDExMGgtMjIweiIvPjwvZz48dGV4dCB4PSIzMDAiIHk9IjQ5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjIiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IiM5NGEzYjgiPlZpYmVCaWxpIEZhc2hpb248L3RleHQ+PC9zdmc+';

/**
 * Kiểm tra xem một chuỗi có phải là link ảnh hợp lệ không (URL hoặc data:image)
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 8) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) return true;
  return false;
};

/**
 * Lấy danh sách kích cỡ chuẩn theo từng ngành hàng / loại sản phẩm
 */
export const getDefaultSizesForCategory = (categoryName = '', productName = '') => {
  const str = `${categoryName} ${productName}`.toLowerCase();
  if (str.includes('tóc') || str.includes('wig')) {
    return ['Size S (52-54cm)', 'Size M (55-57cm)', 'Size L (58-60cm)'];
  }
  if (str.includes('quần jean') || str.includes('quần baggy') || str.includes('quần tây') || str.includes('jeans')) {
    return ['Size 28 (45-52kg)', 'Size 29 (53-58kg)', 'Size 30 (59-64kg)', 'Size 31 (65-70kg)', 'Size 32 (71-76kg)', 'Size 34 (> 76kg)'];
  }
  // Mặc định cho toàn bộ quần áo thời trang nam/nữ, áo thun, áo khoác, đầm, váy, combo
  return ['Size S (40-48kg)', 'Size M (49-55kg)', 'Size L (56-65kg)', 'Size XL (66-75kg)', 'Size 2XL (> 75kg)'];
};

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
  const finalImg = isValidImageUrl(rawImg) ? rawImg.trim() : DEFAULT_PRODUCT_IMAGE;

  const price = Math.max(0, Number(p.price || p.base_price || 299000));
  const origPrice = Math.max(price, Number(p.original_price || p.originalPrice || Math.round(price * 1.3)));

  const isCombo = Boolean(
    p.is_combo ||
    catName.toLowerCase().includes('combo') ||
    name.toLowerCase().includes('combo')
  );

  // Chuẩn hóa danh sách size quần áo / tóc giả
  const defaultSizes = getDefaultSizesForCategory(catName, name);
  let resolvedSizes = defaultSizes;
  if (Array.isArray(p.sizes) && p.sizes.length > 0 && !p.sizes.every(s => s === 'Tiêu chuẩn')) {
    resolvedSizes = p.sizes;
  } else if (p.size && p.size !== 'Tiêu chuẩn') {
    resolvedSizes = [p.size, ...defaultSizes.filter(s => s !== p.size)];
  }

  const resolvedColors = Array.isArray(p.colors) && p.colors.length > 0
    ? p.colors
    : [{ name: p.color || 'Tiêu chuẩn', image: finalImg }];

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
    sold_count: p.sold_count !== undefined ? Number(p.sold_count) : 0,
    is_combo: isCombo,
    sizes: resolvedSizes,
    description: p.description || 'Sản phẩm chính hãng chất lượng cao trên sàn VibeBili.',
    options: [
      { name: 'Màu sắc', values: resolvedColors.map(c => typeof c === 'string' ? c : c.name) },
      { name: 'Kích cỡ', values: resolvedSizes }
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
