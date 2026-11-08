import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import { SparklesIcon, ShoppingBagIcon, CheckIcon, StoreIcon } from './Icons';
import { DEFAULT_PRODUCT_IMAGE, getCleanCustomProducts } from '../utils/productUtils';

function OutfitCombo({ onNavigateCheckout, onNavigateSeller, onNavigateHome }) {
  const { addToCart } = useCart();
  const [combos, setCombos] = useState([]);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load danh sách Combo thực tế từ hệ thống (API + LocalStorage)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    productAPI.getAll()
      .then(res => {
        let list = (res.success && Array.isArray(res.data)) ? res.data : [];

        // Hợp nhất với sản phẩm do người bán tự tạo trong LocalStorage
        const custom = getCleanCustomProducts();
        if (custom.length > 0) {
          const apiIds = new Set(list.map(p => p.id));
          const newCustom = custom.filter(p => !apiIds.has(p.id));
          list = [...newCustom, ...list];
        }

        // Lọc các sản phẩm thuộc danh mục Combo hoặc có cờ is_combo
        const comboList = list.filter(p =>
          Boolean(p.is_combo) ||
          (p.category_name && p.category_name.toLowerCase().includes('combo')) ||
          (p.category && p.category.toLowerCase().includes('combo')) ||
          (p.name && p.name.toLowerCase().includes('combo'))
        ).map(p => ({
          id: p.id,
          title: p.name,
          description: p.description || 'Set phối đồ cao cấp độc quyền giữa trang phục thời trang và tóc giả VibeBili.',
          price: Number(p.price || 0),
          originalPrice: Number(p.original_price || Math.round((p.price || 0) * 1.3)),
          discount: p.original_price ? `-${Math.round((1 - p.price / p.original_price) * 100)}%` : '-25%',
          main_image: p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
          imageOutfit: p.imageOutfit || p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
          imageHair: p.imageHair || p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
          items: Array.isArray(p.items) && p.items.length > 0
            ? p.items
            : [p.name, 'Phụ kiện kèm theo bộ', 'Bảo hành chính hãng VibeBili'],
          vibe: p.vibe || p.category_name || 'Phong cách thời thượng'
        }));

        if (isMounted) {
          setCombos(comboList);
          if (comboList.length > 0) {
            setSelectedCombo(comboList[0]);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        // Fallback đọc từ LocalStorage
        const custom = getCleanCustomProducts();
        const comboList = custom.filter(p =>
          Boolean(p.is_combo) ||
          (p.category_name && p.category_name.toLowerCase().includes('combo')) ||
          (p.category && p.category.toLowerCase().includes('combo'))
        ).map(p => ({
          id: p.id,
          title: p.name,
          description: p.description || 'Bộ phối đồ độc quyền VibeBili.',
          price: Number(p.price || 0),
          originalPrice: Number(p.original_price || Math.round((p.price || 0) * 1.3)),
          discount: '-20%',
          main_image: p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
          imageOutfit: p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
          imageHair: p.main_image || p.image || DEFAULT_PRODUCT_IMAGE,
          items: [p.name, 'Phụ kiện kèm theo'],
          vibe: p.category_name || 'Thời trang'
        }));

        if (isMounted) {
          setCombos(comboList);
          if (comboList.length > 0) {
            setSelectedCombo(comboList[0]);
          }
          setLoading(false);
        }
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
      main_image: combo.main_image
    };

    addToCart(productLike, { id: combo.id * 10, title: 'Combo Trọn Bộ (Outfit + Wig)' }, 1, {
      color: 'Set chuẩn Lookbook',
      size: 'Freesize / M'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900">
      {/* Tiêu đề & Giới thiệu tính năng */}
      <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center space-x-1.5 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          <SparklesIcon className="w-3.5 h-3.5 text-orange-600" />
          <span>Tính Năng Phối Đồ VibeBili</span>
        </span>
        <h1 className="text-3xl font-black uppercase tracking-wider">Outfit x Hairstyle Combo</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          Không còn mất thời gian phối đồ riêng lẻ, các set combo kết hợp hoàn hảo giữa trang phục và kiểu tóc giả phù hợp giúp bạn tự tin tỏa sáng.
        </p>
      </div>

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
        /* Empty State sạch: Không còn bất kỳ sản phẩm mẫu AI nào! */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
            <SparklesIcon className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-gray-900 uppercase">Chưa có Bộ Sưu Tập Combo nào</h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
            Hiện tại sàn chưa có sản phẩm Combo nào được đăng bán. Các Nhà bán hàng (Seller) có thể tạo gói combo thuộc danh mục <b>Outfit x Hairstyle Combo</b> trong Kênh Người Bán để hiển thị tại đây!
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                if (onNavigateSeller) onNavigateSeller();
              }}
              className="w-full sm:w-auto bg-black hover:bg-neutral-800 text-white text-xs px-6 py-3 rounded-full font-bold transition flex items-center justify-center space-x-2 shadow"
            >
              <StoreIcon className="w-4 h-4 text-orange-400" />
              <span>Vào Kênh Người Bán Đăng Combo</span>
            </button>
            <button
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
              }}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-6 py-3 rounded-full font-bold transition"
            >
              Khám Phá Danh Mục Khác
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Lưới các Combo thực tế */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {combos.map((combo) => (
              <div 
                key={combo.id}
                onClick={() => setSelectedCombo(combo)}
                className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                  selectedCombo?.id === combo.id
                    ? 'border-black ring-2 ring-black shadow-xl scale-[1.02]' 
                    : 'border-gray-200 hover:shadow-lg hover:border-gray-400'
                }`}
              >
                {/* Ảnh combo */}
                <div className="relative h-72 grid grid-cols-2 gap-0.5 bg-gray-100 overflow-hidden">
                  <div className="h-full overflow-hidden">
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
                  <div className="h-full overflow-hidden">
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

                  {/* Giá và nút chọn */}
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
                      className="text-xs px-4 py-2.5 rounded-full font-bold bg-black text-white hover:bg-neutral-800 transition-colors shadow flex items-center space-x-1.5 min-h-[36px]"
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
                  className="w-full bg-black text-white py-3.5 rounded-full font-black text-xs hover:bg-neutral-800 transition-colors uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 min-h-[44px]"
                >
                  <ShoppingBagIcon className="w-4 h-4 text-white" />
                  <span>Mua Trọn Bộ Combo</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default OutfitCombo;
