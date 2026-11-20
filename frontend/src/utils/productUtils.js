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
  if (trimmed === DEFAULT_PRODUCT_IMAGE) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) return true;
  return false;
};

/**
 * Tách một chuỗi hoặc mảng các tùy chọn (Size, Màu sắc) thành từng giá trị riêng lẻ
 * Ví dụ: "XS, S, M, L, XL" hoặc ["XS, S, M, L, XL"] -> ['XS', 'S', 'M', 'L', 'XL']
 */
export const parseOptionList = (input) => {
  if (!input) return [];
  const rawArray = Array.isArray(input) ? input : [input];
  const result = [];
  rawArray.forEach(item => {
    if (typeof item === 'string') {
      item.split(/[,;\/\n\r]+/).map(s => s.trim()).filter(Boolean).forEach(s => {
        if (!result.includes(s) && s !== 'Tiêu chuẩn') result.push(s);
      });
    } else if (item && typeof item === 'object') {
      const val = item.name || item.value || '';
      if (typeof val === 'string') {
        val.split(/[,;\/\n\r]+/).map(s => s.trim()).filter(Boolean).forEach(s => {
          if (!result.includes(s) && s !== 'Tiêu chuẩn') result.push(s);
        });
      }
    }
  });
  return result;
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
 * Tìm link ảnh hợp lệ từ một đối tượng bất kỳ
 */
export const extractImageUrl = (obj) => {
  if (!obj || typeof obj !== 'object') return '';
  const candidates = [
    obj.main_image,
    obj.image,
    obj.link_anh,
    obj.hinh_anh,
    obj.imageUrl,
    obj.url,
    obj.photo,
    obj.picture
  ];
  for (const c of candidates) {
    if (isValidImageUrl(c)) return c.trim();
  }
  // Quét toàn bộ object tìm xem có thuộc tính nào chứa URL ảnh không
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && isValidImageUrl(val)) {
      return val.trim();
    }
  }
  return '';
};

/**
 * Chuẩn hóa cấu trúc sản phẩm đồng nhất cho toàn hệ thống
 * Đảm bảo cả main_image và image, category_name và category đều luôn có dữ liệu hợp lệ
 */
export const normalizeProduct = (p, fallbackIndex = 0) => {
  if (!p || typeof p !== 'object') return null;

  const name = (p.name || p.title || p.ten_san_pham || `Sản phẩm VibeBili #${fallbackIndex + 1}`).trim();
  const rawCat = (p.category_name || p.category || p.danh_muc || '').trim();
  const catLower = rawCat.toLowerCase();
  const nameLower = name.toLowerCase();

  const isCombo = Boolean(
    p.is_combo ||
    catLower.includes('combo') ||
    nameLower.includes('combo')
  );

  let catId = Number(p.category_id);
  let resolvedCatName = rawCat;

  const hasWigInName = nameLower.includes('tóc') || nameLower.includes('wig') ||
    nameLower.includes('mái hói') || nameLower.includes('kẹp phím') ||
    nameLower.includes('chân tóc') || nameLower.includes('da đầu') ||
    nameLower.includes('cột quấn') || nameLower.includes('búi tóc');

  const hasClothesInName = nameLower.includes('áo') || nameLower.includes('quần') ||
    nameLower.includes('đầm') || nameLower.includes('váy') || nameLower.includes('hoodie') ||
    nameLower.includes('sweater') || nameLower.includes('blazer') || nameLower.includes('vest') ||
    nameLower.includes('bomber') || nameLower.includes('polo') || nameLower.includes('sơ mi') ||
    nameLower.includes('so mi') || nameLower.includes('jeans') || nameLower.includes('short') ||
    nameLower.includes('cardigan') || nameLower.includes('gile') || nameLower.includes('tanktop') ||
    nameLower.includes('croptop') || nameLower.includes('khoác');

  if (isCombo) {
    catId = 3;
    resolvedCatName = 'Outfit x Hairstyle Combo';
  } else if (hasWigInName) {
    catId = 1;
    resolvedCatName = 'Tóc Giả Cao Cấp';
  } else if (hasClothesInName) {
    const isMen = catId === 6 || catLower.includes('nam') || nameLower.includes('nam') || nameLower.includes('men') || nameLower.includes('boy');
    if (isMen) {
      catId = 6;
      resolvedCatName = 'Thời Trang Nam';
    } else {
      catId = 2;
      resolvedCatName = 'Thời Trang Nữ';
    }
  } else if (catLower.includes('tóc') || catLower.includes('wig') || catId === 1 || catId === 4) {
    catId = 1;
    resolvedCatName = 'Tóc Giả Cao Cấp';
  } else if (catLower.includes('nam') || nameLower.includes('nam') || catId === 6) {
    catId = 6;
    resolvedCatName = 'Thời Trang Nam';
  } else {
    catId = 2;
    resolvedCatName = 'Thời Trang Nữ';
  }

  const extractedImg = extractImageUrl(p);
  const finalImg = extractedImg || DEFAULT_PRODUCT_IMAGE;

  const price = Math.max(0, Number(String(p.price || p.gia_ban || p.base_price || 299000).replace(/[^0-9]/g, '')));
  const origPrice = Math.max(price, Number(String(p.original_price || p.originalPrice || Math.round(price * 1.3)).replace(/[^0-9]/g, '')));

  // Chuẩn hóa danh sách size quần áo / tóc giả (Tự động tách "XS, S, M, L, XL" thành từng nút riêng)
  const defaultSizes = getDefaultSizesForCategory(resolvedCatName, name);
  let resolvedSizes = [];
  const rawSizeCandidates = [p.sizes, p.size_vong_dau, p.size, p.options?.find(o => o.name?.toLowerCase()?.includes('size') || o.name?.toLowerCase()?.includes('cỡ'))?.values];
  for (const c of rawSizeCandidates) {
    if (c) {
      const parsed = parseOptionList(c);
      if (parsed.length > 0) {
        resolvedSizes = parsed;
        break;
      }
    }
  }
  if (resolvedSizes.length === 0) {
    resolvedSizes = defaultSizes;
  }

  // Chuẩn hóa màu sắc: Tự động tách nếu chuỗi màu có dấu phẩy ("Be, Xanh than")
  let resolvedColors = [];
  const rawColorCandidates = [p.colors, p.color, p.mau_sac, p.options?.find(o => o.name?.toLowerCase()?.includes('màu'))?.values];
  for (const c of rawColorCandidates) {
    if (c) {
      const parsed = parseOptionList(c);
      if (parsed.length > 0) {
        resolvedColors = parsed.map(cName => ({ name: cName, image: finalImg }));
        break;
      }
    }
  }
  if (resolvedColors.length === 0) {
    resolvedColors = [{ name: 'Mặc định', image: finalImg }];
  }

  return {
    ...p,
    id: p.id || (Date.now() + fallbackIndex),
    name,
    category: resolvedCatName,
    category_name: resolvedCatName,
    category_id: catId,
    slug: p.slug || name.toLowerCase().replace(/[^a-z0-9]/gi, '-'),
    price,
    original_price: origPrice,
    originalPrice: origPrice,
    stock: Math.max(0, Number(String(p.stock !== undefined ? p.stock : (p.ton_kho !== undefined ? p.ton_kho : 50)).replace(/[^0-9]/g, ''))),
    status: p.status || 'Đang bán',
    main_image: finalImg,
    image: finalImg,
    rating: Number(p.rating) || 5.0,
    sold_count: p.sold_count !== undefined ? Number(p.sold_count) : 0,
    is_combo: isCombo,
    sizes: resolvedSizes,
    description: p.description || p.mo_ta || 'Sản phẩm chính hãng chất lượng cao trên sàn VibeBili.',
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
      if (!item.category_name || !item.main_image || !item.original_price || item.category !== fixed.category) {
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

/**
 * Helper kiểm tra loại sản phẩm: Tóc Giả, Thời Trang Nam, Thời Trang Nữ, Combo
 */
export const checkProductType = (product) => {
  if (!product) return 'other';
  const name = (product.name || '').toLowerCase();
  const cName = (product.category_name || product.category || '').toLowerCase();
  const cId = Number(product.category_id);

  // 1. OUTFIT COMBO
  const isCombo = Boolean(product.is_combo) || cId === 3 || cName.includes('combo') || name.includes('combo');
  if (isCombo) return 'combo';

  const hasWigInName = name.includes('tóc') || name.includes('wig') ||
    name.includes('mái hói') || name.includes('kẹp phím') ||
    name.includes('chân tóc') || name.includes('da đầu') ||
    name.includes('cột quấn') || name.includes('búi tóc');

  const hasClothesInName = name.includes('áo') || name.includes('quần') ||
    name.includes('đầm') || name.includes('váy') || name.includes('hoodie') ||
    name.includes('sweater') || name.includes('blazer') || name.includes('vest') ||
    name.includes('bomber') || name.includes('polo') || name.includes('sơ mi') ||
    name.includes('so mi') || name.includes('jeans') || name.includes('short') ||
    name.includes('cardigan') || name.includes('gile') || name.includes('tanktop') ||
    name.includes('croptop') || name.includes('khoác');

  // 2. TÓC GIẢ: Nếu tên chứa từ khóa tóc/wig (kể cả "Tóc giả nam") -> Chắc chắn 100% là Tóc Giả
  if (hasWigInName) return 'wig';

  // 3. ÁO QUẦN: Nếu tên là áo quần (không có từ tóc) -> Chắc chắn 100% là Áo Quần, TUYỆT ĐỐI không phải tóc giả
  if (hasClothesInName) {
    const isMen = cId === 6 || cName.includes('nam') || name.includes('nam') || name.includes('men') || name.includes('boy');
    return isMen ? 'men' : 'women';
  }

  // 4. Nếu tên không có từ khóa nhận diện, kiểm tra danh mục
  if (cId === 1 || cId === 4 || cName.includes('tóc') || cName.includes('wig')) {
    return 'wig';
  }

  if (cId === 6 || cName.includes('nam') || name.includes('nam') || name.includes('men') || name.includes('boy')) {
    return 'men';
  }

  return 'women';
};

/**
 * Kiểm tra xem một sản phẩm có thuộc danh mục đang chọn hay không
 * Nhận diện chính xác 100%, tuyệt đối không lẫn lộn giữa Nam, Nữ và Tóc giả
 */
export const isProductInCategory = (product, selectedCat) => {
  if (!selectedCat || selectedCat === 'all' || selectedCat === 'Tất Cả') return true;
  if (!product) return false;

  const target = selectedCat.toLowerCase().trim();
  const pType = checkProductType(product);

  // 1. TÓC GIẢ CAO CẤP
  if (target.includes('tóc') || target.includes('wig')) {
    return pType === 'wig';
  }

  // 2. THỜI TRANG NAM
  if (target.includes('nam') || target.includes('men')) {
    return pType === 'men';
  }

  // 3. THỜI TRANG NỮ
  if (target.includes('nữ') || target.includes('nu') || target.includes('women')) {
    return pType === 'women';
  }

  // 4. OUTFIT COMBO
  if (target.includes('combo')) {
    return pType === 'combo';
  }

  const cName = (product.category_name || product.category || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  return cName.includes(target) || name.includes(target);
};
