import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import { SparklesIcon, ShoppingBagIcon, CheckIcon, StoreIcon } from './Icons';
import { DEFAULT_PRODUCT_IMAGE, getCleanCustomProducts } from '../utils/productUtils';

function OutfitCombo({ onNavigateCheckout, onNavigateSeller, onNavigateHome, onTryOnCombo }) {
  const { addToCart } = useCart();
  const [combos, setCombos] = useState([]);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dữ liệu Áo nữ & Quần/Váy nữ phục vụ Studio tự Mix & Match
  const [womenTops, setWomenTops] = useState([]);
  const [womenBottoms, setWomenBottoms] = useState([]);
  const [customTopId, setCustomTopId] = useState('');
  const [customBottomId, setCustomBottomId] = useState('');

  // Hàm phân loại & tự động ghép cặp Áo nữ + Quần nữ từ danh sách sản phẩm
  const buildCombosFromProducts = (rawList) => {
    // 1. Lấy các combo có sẵn (nếu Seller đã tạo)
    const manualCombos = rawList
      .filter(p =>
        Boolean(p.is_combo) ||
        (p.category_name && p.category_name.toLowerCase().includes('combo')) ||
        (p.category && p.category.toLowerCase().includes('combo')) ||
        (p.name && p.name.toLowerCase().includes('combo'))
      )
      .map(p => ({
        id: p.id,
        title: p.name,
        description: p.description || 'Set phối đồ cao cấp độc quyền tại VibeBili.',
        price: Number(p.price || 0),
        originalPrice: Number(p.original_price || Math.round((p.price || 0) * 1.25)),
        discount: p.original_price && Number(p.original_price) > Number(p.price)
          ? `-${Math.round((1 - Number(p.price) / Number(p.original_price)) * 100)}%`
          : '-15%',
        main_image: p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
        imageOutfit: p.imageOutfit || p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
        imageHair: p.imageHair || p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
        items: Array.isArray(p.items) && p.items.length > 0
          ? p.items
          : [p.name, 'Ưu đãi trọn bộ giảm 15%', 'Bảo hành đổi size 15 ngày'],
        vibe: p.vibe || p.category_name || 'Set Độc Quyền',
        topProductId: p.id
      }));

    // 2. Phân loại kho Áo nữ & Quần/Chân váy nữ để tự động ghép cặp
    const tops = [];
    const bottoms = [];

    rawList.forEach((p) => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category_name || p.category || '').toLowerCase();
      const img = p.main_image || p.image || DEFAULT_PRODUCT_IMAGE;

      // Bỏ qua tóc giả, đồ nam và các combo đã có sẵn
      if (
        cat.includes('tóc') || cat.includes('wig') || name.includes('tóc') ||
        cat.includes('nam') || name.includes('nam') ||
        Boolean(p.is_combo) || name.includes('combo')
      ) {
        return;
      }

      const item = {
        id: p.id,
        name: p.name,
        price: Number(p.price || 200000),
        image: img,
        category: p.category_name || p.category || 'Thời Trang Nữ'
      };

      const isBottom =
        name.includes('quần') ||
        name.includes('jeans') ||
        name.includes('short') ||
        name.includes('chân váy') ||
        cat.includes('quần');

      const isTop =
        name.includes('áo') ||
        name.includes('croptop') ||
        name.includes('sơ mi') ||
        name.includes('blazer') ||
        name.includes('gile') ||
        name.includes('len') ||
        name.includes('thun');

      if (isBottom) bottoms.push(item);
      else if (isTop) tops.push(item);
    });

    // 3. Tự động ghép cặp Áo nữ + Quần nữ thành các Set Combo giảm 15%
    const autoPairedCombos = [];
    const vibes = [
      'Thanh Lịch Công Sở',
      'Năng Động Dạo Phố',
      'Trendy Hàn Quốc',
      'Cá Tính Cuối Tuần',
      'Trẻ Trung Hằng Ngày',
      'Minimalist Chic'
    ];

    if (tops.length > 0 && bottoms.length > 0) {
      const pairCount = Math.min(9, Math.max(tops.length, bottoms.length));
      for (let i = 0; i < pairCount; i++) {
        const top = tops[i % tops.length];
        // Ghép chéo chỉ số để tạo nhiều tổ hợp áo - quần khác nhau
        const bottom = bottoms[(i * 2 + (i >= bottoms.length ? 1 : 0)) % bottoms.length];

        const originalTotal = top.price + bottom.price;
        const discountedPrice = Math.round(originalTotal * 0.85); // Giảm 15%

        autoPairedCombos.push({
          id: `auto-combo-${top.id}-${bottom.id}-${i}`,
          title: `Set Phối Nữ: ${top.name} + ${bottom.name}`,
          description: `Bộ đôi phối sẵn chuẩn gu giữa ${top.name} và ${bottom.name}. Mua theo set tiết kiệm ngay 15% (${(originalTotal - discountedPrice).toLocaleString()}đ) so với mua lẻ từng món.`,
          price: discountedPrice,
          originalPrice: originalTotal,
          discount: '-15%',
          main_image: top.image,
          imageOutfit: top.image,   // Khung trái hiển thị Áo nữ
          imageHair: bottom.image,  // Khung phải hiển thị Quần/Chân váy nữ
          items: [
            `01 ${top.name} (${top.price.toLocaleString()}đ)`,
            `01 ${bottom.name} (${bottom.price.toLocaleString()}đ)`,
            'Miễn phí đổi size trong 15 ngày'
          ],
          vibe: vibes[i % vibes.length],
          topProductId: top.id
        });
      }
    }

    return {
      allCombos: [...manualCombos, ...autoPairedCombos],
      tops,
      bottoms
    };
  };

  // Load dữ liệu sản phẩm và tự động ghép Combo
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const applyData = (rawList) => {
      const { allCombos, tops, bottoms } = buildCombosFromProducts(rawList);
      if (!isMounted) return;
      setWomenTops(tops);
      setWomenBottoms(bottoms);
      if (tops.length > 0) setCustomTopId(String(tops[0].id));
      if (bottoms.length > 0) setCustomBottomId(String(bottoms[0].id));

      setCombos(allCombos);
      setSelectedCombo(allCombos.length > 0 ? allCombos[0] : null);
      setLoading(false);
    };

    productAPI.getAll()
      .then(res => {
        let list = (res.success && Array.isArray(res.data)) ? res.data : [];
        const custom = getCleanCustomProducts();
        if (custom.length > 0) {
          const apiIds = new Set(list.map(p => String(p.id)));
          const newCustom = custom.filter(p => !apiIds.has(String(p.id)));
          list = [...newCustom, ...list];
        }
        applyData(list);
      })
      .catch(() => {
        applyData(getCleanCustomProducts());
      });

    return () => { isMounted = false; };
  }, []);

  // Thêm combo thực tế vào giỏ hàng
  const handleAddComboToCart = (combo) => {
    if (!combo) return;
    const productLike = {
      id: combo.id,
      name: combo.title,
      price: combo.price,
      original_price: combo.originalPrice,
      main_image: combo.main_image,
      is_combo: true
    };

    addToCart(productLike, { id: `${combo.id}-set`, title: 'Combo Trọn Bộ Áo + Quần (-15%)' }, 1, {
      color: 'Set chuẩn Lookbook',
      size: 'Size M (Hỗ trợ đổi size)'
    });
  };

  // Xử lý thêm bộ tự Mix & Match của khách
  const selectedCustomTop = womenTops.find(t => String(t.id) === String(customTopId));
  const selectedCustomBottom = womenBottoms.find(b => String(b.id) === String(customBottomId));
  const customOriginalPrice = (selectedCustomTop?.price || 0) + (selectedCustomBottom?.price || 0);
  const customFinalPrice = Math.round(customOriginalPrice * 0.85);

  const handleAddCustomMixToCart = () => {
    if (!selectedCustomTop || !selectedCustomBottom) return;
    handleAddComboToCart({
      id: `custom-mix-${selectedCustomTop.id}-${selectedCustomBottom.id}`,
      title: `Combo Tự Phối: ${selectedCustomTop.name} + ${selectedCustomBottom.name}`,
      price: customFinalPrice,
      originalPrice: customOriginalPrice,
      main_image: selectedCustomTop.image
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900">
      {/* Tiêu đề & Giới thiệu tính năng */}
      <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center space-x-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <SparklesIcon className="w-3.5 h-3.5 text-orange-600" />
          <span>Tính Năng Phối Đồ Tự Động VibeBili</span>
        </span>
        <h1 className="text-3xl font-black uppercase tracking-wider">Outfit Combo Thời Trang Nữ</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          Hệ thống tự động ghép cặp các mẫu <strong>Áo Nữ</strong> và <strong>Quần / Chân Váy</strong> hiện có thành các set đồng bộ, giúp bạn tiết kiệm ngay <strong>15%</strong> so với mua lẻ.
        </p>
      </div>

      {/* STUDIO TỰ MIX & MATCH ÁO NỮ + QUẦN NỮ */}
      {!loading && womenTops.length > 0 && womenBottoms.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50/80 via-white to-pink-50/70 border border-orange-200 rounded-3xl p-6 mb-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-orange-100">
            <div>
              <span className="text-[11px] font-black uppercase text-orange-600">🎨 Tự Tay Phối Set</span>
              <h2 className="text-lg font-black uppercase text-gray-900">Mix & Match Áo Nữ + Quần Nữ (-15%)</h2>
            </div>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full w-fit">
              Kho hiện có: {womenTops.length} Áo • {womenBottoms.length} Quần/Váy
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Chọn Áo */}
            <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-200 space-y-2.5">
              <label className="text-xs font-bold text-gray-700 block">1. Chọn Áo Nữ:</label>
              <select
                value={customTopId}
                onChange={(e) => setCustomTopId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
              >
                {womenTops.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.price.toLocaleString()}đ)</option>
                ))}
              </select>
              {selectedCustomTop && (
                <div className="flex items-center gap-3 pt-1">
                  <img src={selectedCustomTop.image} alt={selectedCustomTop.name} className="w-16 h-20 object-cover rounded-xl border" />
                  <div>
                    <p className="text-xs font-bold line-clamp-2">{selectedCustomTop.name}</p>
                    <p className="text-xs font-black text-red-600 mt-1">{selectedCustomTop.price.toLocaleString()} đ</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 flex justify-center">
              <span className="w-9 h-9 rounded-full bg-black text-white font-black text-lg flex items-center justify-center shadow">+</span>
            </div>

            {/* Chọn Quần */}
            <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-200 space-y-2.5">
              <label className="text-xs font-bold text-gray-700 block">2. Chọn Quần / Chân Váy:</label>
              <select
                value={customBottomId}
                onChange={(e) => setCustomBottomId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-black"
              >
                {womenBottoms.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.price.toLocaleString()}đ)</option>
                ))}
              </select>
              {selectedCustomBottom && (
                <div className="flex items-center gap-3 pt-1">
                  <img src={selectedCustomBottom.image} alt={selectedCustomBottom.name} className="w-16 h-20 object-cover rounded-xl border" />
                  <div>
                    <p className="text-xs font-bold line-clamp-2">{selectedCustomBottom.name}</p>
                    <p className="text-xs font-black text-red-600 mt-1">{selectedCustomBottom.price.toLocaleString()} đ</p>
                  </div>
                </div>
              )}
            </div>

            {/* Giá combo & Nút hành động */}
            <div className="lg:col-span-3 bg-gray-900 text-white p-5 rounded-2xl space-y-3 shadow-lg">
              <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Tiết kiệm {(customOriginalPrice - customFinalPrice).toLocaleString()} đ
              </span>
              <div>
                <span className="text-xs text-gray-400 line-through block">{customOriginalPrice.toLocaleString()} đ</span>
                <span className="text-2xl font-black text-orange-400">{customFinalPrice.toLocaleString()} đ</span>
              </div>
              <button
                onClick={handleAddCustomMixToCart}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-2.5 rounded-full text-xs uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBagIcon className="w-3.5 h-3.5" />
                <span>Thêm Set Tự Phối</span>
              </button>
              {onTryOnCombo && selectedCustomTop && (
                <button
                  onClick={() => onTryOnCombo(selectedCustomTop.id)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-full text-[11px] uppercase transition cursor-pointer"
                >
                  🪞 Thử Áo Này Với AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4 animate-pulse">
              <div className="h-64 bg-gray-200 rounded-2xl"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : combos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
            <SparklesIcon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-gray-900 uppercase">Chưa đủ Áo & Quần nữ để ghép Combo</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
            Hệ thống cần ít nhất 1 mẫu Áo nữ và 1 mẫu Quần/Chân váy nữ trong kho để tự động phối set!
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { if (onNavigateSeller) onNavigateSeller(); }}
              className="w-full sm:w-auto bg-black hover:bg-neutral-800 text-white text-xs px-6 py-3 rounded-full font-bold transition flex items-center justify-center space-x-2 shadow"
            >
              <StoreIcon className="w-4 h-4 text-orange-400" />
              <span>Vào Kênh Người Bán</span>
            </button>
            <button
              onClick={() => { if (onNavigateHome) onNavigateHome(); }}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-6 py-3 rounded-full font-bold transition"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Lưới các Combo ghép sẵn tự động */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {combos.map((combo) => (
              <div 
                key={combo.id}
                onClick={() => setSelectedCombo(combo)}
                className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  selectedCombo?.id === combo.id
                    ? 'border-black ring-2 ring-black shadow-xl scale-[1.02]' 
                    : 'border-gray-200 hover:shadow-lg hover:border-gray-400'
                }`}
              >
                <div>
                  {/* Ảnh combo chia 2 khung: Trái (Áo) - Phải (Quần/Chân váy) */}
                  <div className="relative h-72 grid grid-cols-2 gap-0.5 bg-gray-100 overflow-hidden">
                    <div className="h-full overflow-hidden relative">
                      <img 
                        src={combo.imageOutfit} 
                        alt={combo.title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="h-full overflow-hidden relative">
                      <img 
                        src={combo.imageHair} 
                        alt={combo.title} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                      {combo.discount}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                      {combo.vibe}
                    </span>
                  </div>

                  {/* Nội dung combo */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-bold line-clamp-1">{combo.title}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{combo.description}</p>

                    {/* Thành phần trong combo */}
                    <div className="border-t border-gray-100 pt-3 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase text-gray-400">Combo bao gồm:</p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        {combo.items.map((item, idx) => (
                          <li key={idx} className="flex items-center space-x-1.5 truncate">
                            <CheckIcon className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Giá và nút chọn */}
                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-lg font-black text-red-600">{combo.price.toLocaleString()} đ</span>
                      <span className="text-xs text-gray-400 line-through ml-2">{combo.originalPrice.toLocaleString()} đ</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddComboToCart(combo);
                      }}
                      className="text-xs px-4 py-2.5 rounded-full font-bold bg-black text-white hover:bg-neutral-800 transition-colors shadow flex items-center space-x-1.5 min-h-[36px] cursor-pointer"
                    >
                      <ShoppingBagIcon className="w-3.5 h-3.5 text-white" />
                      <span>Thêm combo</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chi tiết Combo đang chọn & Nút mua nhanh */}
          {selectedCombo && (
            <div className="bg-black text-white rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
              <div className="space-y-3 max-w-2xl">
                <span className="inline-flex items-center space-x-1.5 bg-orange-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Combo Đang Chọn</span>
                </span>
                <h2 className="text-2xl font-black">{selectedCombo.title}</h2>
                <p className="text-xs md:text-sm text-gray-300 leading-relaxed">{selectedCombo.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedCombo.items.map((it, i) => (
                    <span key={i} className="bg-white/10 text-xs px-3 py-1.5 rounded-full text-gray-200 flex items-center space-x-1.5">
                      <CheckIcon className="w-3 h-3 text-orange-400" />
                      <span>{it}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white text-gray-900 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 min-w-[280px] shadow-2xl">
                <div className="text-center">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Trọn bộ combo lookbook</span>
                  <div className="text-2xl font-black text-red-600 mt-1">{selectedCombo.price.toLocaleString()} đ</div>
                  <span className="text-xs text-gray-400 line-through">{selectedCombo.originalPrice.toLocaleString()} đ</span>
                </div>

                <button 
                  onClick={() => handleAddComboToCart(selectedCombo)}
                  className="w-full bg-black text-white py-3.5 rounded-full font-black text-xs hover:bg-neutral-800 transition-colors uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 min-h-[44px] cursor-pointer"
                >
                  <ShoppingBagIcon className="w-4 h-4 text-white" />
                  <span>Mua Trọn Bộ Combo</span>
                </button>

                {onTryOnCombo && selectedCombo.topProductId && (
                  <button
                    onClick={() => onTryOnCombo(selectedCombo.topProductId)}
                    className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    🪞 Thử Áo Trong Set Với AI
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OutfitCombo;