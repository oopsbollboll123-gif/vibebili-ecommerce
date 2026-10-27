import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import {
  ShoppingBagIcon,
  LightningIcon,
  StarIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowLeftIcon
} from './Icons';

function ProductDetail({ productId, onNavigateCheckout, onNavigateTryOn, onBack }) {
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback product nếu API chưa sẵn sàng
  const fallbackProduct = {
    id: productId || 1,
    name: "Tóc Giả Nữ Nguyên Đầu Xoăn Sóng Nước 60cm — Sợi Tơ Nhiệt Cao Cấp kèm Lưới Trùm",
    price: 350000,
    original_price: 500000,
    rating: 4.9,
    reviewsCount: 128,
    sold_count: "1.2k+",
    description: "Sản phẩm tóc giả cao cấp làm từ sợi tơ lụa nhân tạo chịu nhiệt cao đến 180°C. Mềm mượt như tóc thật, không bóng lộ, thiết kế lưới ren thoáng khí co giãn ôm sát vòng đầu, thoải mái hoạt động suốt cả ngày.",
    main_image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    colors: [
      { name: "Nâu Sô-cô-la", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80" },
      { name: "Đen Tự Nhiên", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80" },
      { name: "Xám Khói", image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80" }
    ],
    sizes: ["S (52-54cm)", "M (54-58cm)", "L (58-60cm)"],
    hairLengths: ["50cm", "60cm (Hot)", "70cm"]
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const targetId = productId || 1;

    productAPI.getById(targetId)
      .then(res => {
        if (isMounted && res.success && res.data) {
          const d = res.data;
          setProduct({
            ...d,
            colors: d.options?.find(o => o.name.includes('Màu'))?.values?.map(name => ({
              name,
              image: d.main_image
            })) || fallbackProduct.colors,
            sizes: d.options?.find(o => o.name.includes('Cỡ') || o.name.includes('Size') || o.name.includes('đầu'))?.values || fallbackProduct.sizes,
            hairLengths: d.options?.find(o => o.name.includes('dài') || o.name.includes('Dài'))?.values || fallbackProduct.hairLengths
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setProduct(fallbackProduct);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [productId]);

  const activeProduct = product || fallbackProduct;

  const [selectedColor, setSelectedColor] = useState("Nâu Sô-cô-la");
  const [selectedSize, setSelectedSize] = useState("M (54-58cm)");
  const [selectedLength, setSelectedLength] = useState("60cm (Hot)");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);

  const currentDisplayImage = activeImage || activeProduct.main_image;

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    const selectedVariant = activeProduct.variants?.find(v => 
      (v.color === selectedColor || !v.color) && (v.size === selectedSize || !v.size)
    ) || activeProduct.variants?.[0] || null;

    addToCart(activeProduct, selectedVariant, quantity, {
      color: selectedColor,
      size: selectedSize,
      length: selectedLength
    });
  };

  // Xử lý mua ngay
  const handleBuyNow = () => {
    handleAddToCart();
    if (onNavigateCheckout) {
      onNavigateCheckout();
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs font-bold uppercase tracking-wider">Đang tải thông tin chi tiết sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900">
      {/* Breadcrumb điều hướng */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-6">
        <button onClick={onBack} className="hover:underline hover:text-black flex items-center space-x-1">
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span>{activeProduct.category_name || 'Tóc Giả Cao Cấp'}</span>
        <span>/</span>
        <span className="text-black font-semibold truncate max-w-md">{activeProduct.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* CỘT TRÁI: Thư viện hình ảnh */}
        <div className="space-y-4">
          <div className="h-[480px] bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 relative overflow-hidden group">
            <span className="absolute top-3.5 left-3.5 bg-red-600 text-white text-xs font-black px-3 py-1 rounded shadow-md z-10">
              HOT -30%
            </span>
            <img 
              src={currentDisplayImage} 
              alt={activeProduct.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-3">
            {activeProduct.colors?.map((col, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setSelectedColor(col.name);
                  if (col.image) setActiveImage(col.image);
                }}
                className={`h-24 bg-gray-50 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-xs text-center p-1.5 overflow-hidden transition-all ${
                  selectedColor === col.name ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {col.image ? (
                  <img src={col.image} alt={col.name} className="w-full h-14 object-cover rounded-lg mb-1" />
                ) : null}
                <span className="truncate w-full font-bold text-[11px]">{col.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: Thông tin sản phẩm & Ma trận biến thể */}
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
              <StarIcon className="w-3 h-3 text-orange-600 fill-orange-600" />
              <span>Sản Phẩm Bán Chạy Nhất Tuần</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">{activeProduct.name}</h1>
            <div className="flex items-center space-x-3 text-xs text-gray-600 mt-2">
              <div className="flex items-center space-x-1 font-bold text-gray-800">
                <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{activeProduct.rating || 5.0}</span>
                <span className="text-gray-400 font-normal">({activeProduct.reviewsCount || 128} đánh giá)</span>
              </div>
              <span>•</span>
              <span>Đã bán {activeProduct.sold_count || '1.2k+'}</span>
              <span>•</span>
              <span className="text-green-600 font-bold flex items-center space-x-1">
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Còn hàng</span>
              </span>
            </div>
          </div>

          {/* Giá tiền */}
          <div className="bg-gray-50 p-4 rounded-xl flex items-baseline space-x-4 border border-gray-100">
            <span className="text-3xl font-black text-red-600">
              {(activeProduct.price || 350000).toLocaleString()} đ
            </span>
            <span className="text-sm text-gray-400 line-through">
              {((activeProduct.original_price || (activeProduct.price || 350000) * 1.3)).toLocaleString()} đ
            </span>
            <span className="bg-red-100 text-red-600 text-xs font-black px-2.5 py-0.5 rounded">
              -30% OFF
            </span>
          </div>

          {/* Mô tả ngắn */}
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            {activeProduct.description}
          </p>

          {/* --- MA TRẬN BIẾN THỂ (VARIANT MATRIX) --- */}
          
          {/* 1. Chọn Màu sắc */}
          {activeProduct.colors?.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                1. Màu sắc: <span className="text-orange-600 font-extrabold">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {activeProduct.colors.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => {
                      setSelectedColor(col.name);
                      if (col.image) setActiveImage(col.image);
                    }}
                    className={`min-h-[44px] px-4 py-2 text-xs rounded-xl border font-bold transition-all focus-visible:ring-2 focus-visible:ring-black ${
                      selectedColor === col.name 
                        ? 'border-black bg-black text-white shadow-md' 
                        : 'border-gray-200 bg-white hover:border-black text-gray-800'
                    }`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Chọn Độ dài tóc */}
          {activeProduct.hairLengths?.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                2. Độ dài sợi tóc: <span className="text-orange-600 font-extrabold">{selectedLength}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {activeProduct.hairLengths.map((len) => (
                  <button
                    key={len}
                    onClick={() => setSelectedLength(len)}
                    className={`min-h-[44px] px-4 py-2 text-xs rounded-xl border font-bold transition-all focus-visible:ring-2 focus-visible:ring-black ${
                      selectedLength === len 
                        ? 'border-black bg-black text-white shadow-md' 
                        : 'border-gray-200 bg-white hover:border-black text-gray-800'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Chọn Kích cỡ / Chu vi vòng đầu */}
          {activeProduct.sizes?.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  3. Chu vi vòng đầu / Kích cỡ: <span className="text-orange-600 font-extrabold">{selectedSize}</span>
                </label>
                <span className="text-xs text-orange-600 cursor-pointer underline font-medium hover:text-orange-700">
                  Hướng dẫn chọn size
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {activeProduct.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`min-h-[44px] px-4 py-2 text-xs rounded-xl border font-bold transition-all focus-visible:ring-2 focus-visible:ring-black ${
                      selectedSize === sz 
                        ? 'border-black bg-black text-white shadow-md' 
                        : 'border-gray-200 bg-white hover:border-black text-gray-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Số lượng */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Số lượng đặt</label>
            <div className="flex items-center border border-gray-300 rounded-xl w-36 overflow-hidden bg-white">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Giảm số lượng"
                className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-200 font-bold text-gray-700 transition"
              >
                <MinusIcon className="w-3.5 h-3.5" />
              </button>
              <span className="flex-1 text-center text-sm font-black text-gray-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Tăng số lượng"
                className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-200 font-bold text-gray-700 transition"
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Nút hành động (Thêm vào giỏ & Mua ngay) - Min-height 44px */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button 
              onClick={handleAddToCart}
              className="flex-1 min-h-[48px] bg-white border-2 border-black text-black font-extrabold py-3.5 px-6 rounded-full hover:bg-gray-50 transition-colors uppercase tracking-wider text-xs shadow-sm flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-black"
            >
              <ShoppingBagIcon className="w-4 h-4 text-black" />
              <span>Thêm vào giỏ hàng</span>
            </button>
            <button 
              onClick={handleBuyNow}
              className="flex-1 min-h-[48px] bg-black text-white font-extrabold py-3.5 px-6 rounded-full hover:bg-neutral-800 transition-colors uppercase tracking-wider text-xs shadow-xl flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-black"
            >
              <LightningIcon className="w-4 h-4 text-orange-400" />
              <span>Mua ngay</span>
            </button>
          </div>

          {/* Nút Thử Đồ AI 2-in-1 (Virtual Try-On USP) */}
          <button 
            type="button"
            onClick={() => {
              if (onNavigateTryOn) onNavigateTryOn(activeProduct.id, activeProduct.category_name?.includes('Tóc') ? 'wig' : 'clothing');
            }}
            className="w-full min-h-[48px] bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:to-amber-700 text-white font-black py-3.5 px-6 rounded-full uppercase tracking-wider text-xs shadow-xl flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
          >
            <SparklesIcon className="w-4 h-4 text-white" />
            <span>🪞 Thử sản phẩm này lên Avatar của bạn với AI</span>
          </button>

          {/* Bảng thuộc tính kỹ thuật chuyên sâu cho Tóc Giả (Theo nghiệp vụ 2.2) */}
          <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-4 text-xs space-y-2">
            <span className="font-extrabold text-orange-950 uppercase text-[10px] tracking-wider block">
              🔬 Chuẩn Hóa Thuộc Tính Kỹ Thuật (VibeBili Standard):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-700">
              <div>
                <span className="font-bold text-gray-900 block">• Chất liệu sợi:</span>
                <span>Tơ nhân tạo tơ lụa Hàn Quốc (Korean Synthetic Silk) chịu nhiệt 140°C - 180°C, không bóng lộ.</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 block">• Chu vi vòng đầu:</span>
                <span>Size M (55 - 57cm) - Kích cỡ chuẩn ôm sát cho 85% người trưởng thành.</span>
              </div>
            </div>
          </div>

          {/* Cam kết thương hiệu */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Đảm bảo sợi tơ cao cấp chuẩn chịu nhiệt 180°C, không bóng lộ giả tạo.</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Tặng kèm lưới trùm đầu co giãn chuyên dụng cho mọi đơn hàng tóc giả.</span>
            </div>
            <div className="flex items-center space-x-2">
              <TruckIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>Miễn phí vận chuyển cho đơn hàng từ 500.000 đ — Kiểm tra hàng trước khi thanh toán.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
