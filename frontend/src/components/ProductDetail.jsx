import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';
import { DEFAULT_PRODUCT_IMAGE, getCleanCustomProducts } from '../utils/productUtils';
import {
  ShoppingBagIcon,
  LightningIcon,
  StarIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowLeftIcon,
  SparklesIcon
} from './Icons';

function ProductDetail({ productId, onNavigateCheckout, onNavigateTryOn, onNavigatePolicy, onBack }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');

  // Form viết đánh giá mới
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewImage, setNewReviewImage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newHeight, setNewHeight] = useState('1m62');
  const [newWeight, setNewWeight] = useState('50kg');
  const [newFit, setNewFit] = useState('Chuẩn size');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Variant selections
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedLength, setSelectedLength] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(null);

  // Load product data & reviews
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const targetId = productId || 1;

    // Tìm sản phẩm trong custom products trước nếu có
    let localProd = null;
    const cleanCustom = getCleanCustomProducts();
    localProd = cleanCustom.find(p => String(p.id) === String(targetId)) || null;

    // Đọc đánh giá đã lưu trong localStorage cho sản phẩm này
    let localReviews = [];
    try {
      const savedRevs = localStorage.getItem('vibebili_product_reviews_' + targetId);
      if (savedRevs) {
        localReviews = JSON.parse(savedRevs);
      }
    } catch {}

    // Tải thông tin sản phẩm
    productAPI.getById(targetId)
      .then(res => {
        if (isMounted && res.success && res.data) {
          const d = res.data;
          const colors = d.options?.find(o => o.name.toLowerCase().includes('màu'))?.values?.map(name => ({
            name,
            image: d.main_image || d.image || DEFAULT_PRODUCT_IMAGE
          })) || (d.main_image ? [{ name: 'Tiêu chuẩn', image: d.main_image }] : []);
          const sizes = d.options?.find(o => o.name.toLowerCase().includes('cỡ') || o.name.toLowerCase().includes('size') || o.name.toLowerCase().includes('đầu'))?.values || ['Tiêu chuẩn'];
          const lengths = d.options?.find(o => o.name.toLowerCase().includes('dài'))?.values || [];

          setProduct({
            ...d,
            main_image: d.main_image || d.image || DEFAULT_PRODUCT_IMAGE,
            colors: colors.length > 0 ? colors : [{ name: 'Mặc định', image: d.main_image || DEFAULT_PRODUCT_IMAGE }],
            sizes,
            hairLengths: lengths
          });
          setSelectedColor(colors[0]?.name || 'Mặc định');
          setSelectedSize(sizes[0] || 'Tiêu chuẩn');
          setSelectedLength(lengths?.[0] || '');
        } else if (localProd) {
          const colors = localProd.options?.find(o => o.name.toLowerCase().includes('màu'))?.values?.map(name => ({
            name,
            image: localProd.main_image || localProd.image || DEFAULT_PRODUCT_IMAGE
          })) || [{ name: 'Tiêu chuẩn', image: localProd.main_image || localProd.image || DEFAULT_PRODUCT_IMAGE }];

          setProduct({
            ...localProd,
            main_image: localProd.main_image || localProd.image || DEFAULT_PRODUCT_IMAGE,
            colors,
            sizes: ['Tiêu chuẩn']
          });
          setSelectedColor(colors[0]?.name || 'Tiêu chuẩn');
          setSelectedSize('Tiêu chuẩn');
        } else {
          setProduct(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          if (localProd) {
            const colors = localProd.options?.find(o => o.name.toLowerCase().includes('màu'))?.values?.map(name => ({
              name,
              image: localProd.main_image || localProd.image || DEFAULT_PRODUCT_IMAGE
            })) || [{ name: 'Tiêu chuẩn', image: localProd.main_image || localProd.image || DEFAULT_PRODUCT_IMAGE }];

            setProduct({
              ...localProd,
              main_image: localProd.main_image || localProd.image || DEFAULT_PRODUCT_IMAGE,
              colors,
              sizes: ['Tiêu chuẩn']
            });
            setSelectedColor(colors[0]?.name || 'Tiêu chuẩn');
            setSelectedSize('Tiêu chuẩn');
          } else {
            setProduct(null);
          }
          setLoading(false);
        }
      });

    // Tải danh sách đánh giá từ API kết hợp localStorage
    productAPI.getReviews(targetId)
      .then(res => {
        if (isMounted) {
          let list = (res.success && Array.isArray(res.data)) ? res.data : [];
          if (localReviews.length > 0) {
            const apiIds = new Set(list.map(r => r.id));
            const newLocal = localReviews.filter(r => !apiIds.has(r.id));
            list = [...newLocal, ...list];
          }
          setReviews(list);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReviews(localReviews);
        }
      });

    return () => { isMounted = false; };
  }, [productId]);

  const activeProduct = product;
  const currentDisplayImage = activeImage || activeProduct.main_image;
  const wishlisted = isWishlisted(activeProduct.id);

  // Thêm vào giỏ hàng
  const handleAddToCart = () => {
    const selectedVariant = activeProduct.variants?.find(v =>
      (v.color === selectedColor || !v.color) && (v.size === selectedSize || !v.size)
    ) || activeProduct.variants?.[0] || null;

    addToCart(activeProduct, selectedVariant, quantity, {
      color: selectedColor || 'Mặc định',
      size: selectedSize || 'Tiêu chuẩn',
      length: selectedLength || ''
    });
  };

  // Mua ngay
  const handleBuyNow = () => {
    handleAddToCart();
    if (onNavigateCheckout) {
      onNavigateCheckout();
    }
  };

  // Gửi review mới
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    const authorName = (newReviewName.trim() || user?.name || 'Khách hàng VibeBili');
    const reviewImages = newReviewImage.trim() ? [newReviewImage.trim()] : [];

    const newLocalReview = {
      id: Date.now(),
      product_id: activeProduct.id,
      user_name: authorName,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      rating: Number(newRating) || 5,
      date: 'Hôm nay',
      color: selectedColor || 'Tiêu chuẩn',
      size: selectedSize || 'Tiêu chuẩn',
      height: newHeight,
      weight: newWeight,
      fit: newFit,
      comment: newComment.trim(),
      images: reviewImages,
      helpful_count: 0
    };

    try {
      const reviewPayload = {
        user_name: authorName,
        rating: Number(newRating) || 5,
        color: selectedColor || 'Tiêu chuẩn',
        size: selectedSize || 'Tiêu chuẩn',
        height: newHeight,
        weight: newWeight,
        fit: newFit,
        comment: newComment.trim(),
        images: reviewImages
      };

      const res = await productAPI.createReview(activeProduct.id, reviewPayload).catch(() => null);
      const createdItem = (res && res.success && res.data) ? res.data : newLocalReview;

      const updated = [createdItem, ...reviews];
      setReviews(updated);

      // Lưu trữ đánh giá vào localStorage theo ID sản phẩm
      try {
        localStorage.setItem('vibebili_product_reviews_' + activeProduct.id, JSON.stringify(updated));
      } catch {}

      setReviewSuccessMsg('Cảm ơn bạn! Đánh giá đã được ghi nhận và hiển thị ngay trên sản phẩm.');
      setNewComment('');
      setNewReviewName('');
      setNewReviewImage('');
      setShowReviewForm(false);
      setTimeout(() => setReviewSuccessMsg(''), 4000);
    } catch (err) {
      console.warn('Lỗi gửi review:', err);
      const updated = [newLocalReview, ...reviews];
      setReviews(updated);
      try {
        localStorage.setItem('vibebili_product_reviews_' + activeProduct.id, JSON.stringify(updated));
      } catch {}
      setReviewSuccessMsg('Cảm ơn bạn! Đánh giá đã được ghi nhận.');
      setNewComment('');
      setShowReviewForm(false);
      setTimeout(() => setReviewSuccessMsg(''), 4000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Lọc review
  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'with_images') return r.images && r.images.length > 0;
    if (reviewFilter === 'true_to_size') return r.fit === 'Chuẩn size';
    if (reviewFilter === '5_star') return r.rating === 5;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-vibe-muted">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-vibe-200 border-t-vibe-ink rounded-full mb-3"></div>
        <p className="text-xs font-bold uppercase tracking-wider">Đang tải trang chi tiết sản phẩm VibeBili...</p>
      </div>
    );
  }

  if (!activeProduct) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
          <ShoppingBagIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black uppercase text-gray-900">Sản phẩm không tồn tại</h2>
        <p className="text-xs text-gray-500">Sản phẩm này có thể đã bị xóa hoặc ngừng kinh doanh trên sàn VibeBili.</p>
        <button
          onClick={onBack}
          className="bg-black hover:bg-neutral-800 text-white text-xs px-6 py-3 rounded-full font-bold transition shadow"
        >
          ← Quay lại danh mục mua sắm
        </button>
      </div>
    );
  }

  const isWigProduct = activeProduct.category_name?.toLowerCase().includes('tóc') || activeProduct.category_id === 1 || activeProduct.category_id === 4;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-vibe-ink">
      {/* Toast thông báo review thành công */}
      {reviewSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-black/90 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span>{reviewSuccessMsg}</span>
        </div>
      )}

      {/* Breadcrumb điều hướng */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-6">
        <button onClick={onBack} className="hover:underline hover:text-black flex items-center space-x-1 font-semibold">
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </button>
        <span>/</span>
        <span className="text-gray-600 font-medium">{activeProduct.category_name || 'Thời Trang & Tóc Giả'}</span>
        <span>/</span>
        <span className="text-black font-bold truncate max-w-md">{activeProduct.name}</span>
      </div>

      {/* --- KHU VỰC CHÍNH CỦA TRANG SẢN PHẨM --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* CỘT TRÁI (5 CỘT): Thư viện hình ảnh */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-[460px] md:h-[520px] bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200 relative overflow-hidden group">
            <span className="absolute top-4 left-4 bg-red-600 text-white text-[11px] font-black px-3 py-1 rounded-md shadow-md z-10 uppercase tracking-wider">
              HOT -30%
            </span>

            {/* Nút Thả tim (Wishlist Heart) trên ảnh */}
            <button
              onClick={() => toggleWishlist(activeProduct)}
              className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                wishlisted ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
              }`}
              title={wishlisted ? 'Đã lưu vào yêu thích' : 'Thêm vào yêu thích'}
            >
              <span className="text-lg leading-none">{wishlisted ? '❤️' : '🤍'}</span>
            </button>

            <img
              src={currentDisplayImage || DEFAULT_PRODUCT_IMAGE}
              alt={activeProduct.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
              }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Thumbnails các góc chụp / phân loại màu */}
          <div className="grid grid-cols-4 gap-2.5">
            {activeProduct.colors?.map((col, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedColor(col.name);
                  if (col.image) setActiveImage(col.image);
                }}
                className={`h-24 bg-gray-50 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-xs text-center p-1.5 overflow-hidden transition-all ${
                  selectedColor === col.name ? 'border-black ring-2 ring-black/10' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {col.image && (
                  <img src={col.image} alt={col.name} className="w-full h-14 object-cover rounded-lg mb-1" />
                )}
                <span className="truncate w-full font-bold text-[10px] text-gray-800">{col.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI (7 CỘT): Thông tin sản phẩm, biến thể & hành động */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-neutral-900 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                🏅 VIBE MALL
              </span>
              <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                Yêu Thích+
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-xs text-gray-500 font-medium">Mã SP: VB-{activeProduct.id * 1024}</span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-snug tracking-tight">
              {activeProduct.name}
            </h1>

            {/* Đánh giá & Số lượng đã bán */}
            <div className="flex items-center space-x-3 text-xs text-gray-600 mt-2.5">
              <div className="flex items-center space-x-1 font-extrabold text-gray-900">
                <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{activeProduct.rating || 5.0}</span>
                <span className="text-gray-400 font-normal underline cursor-pointer hover:text-black">
                  ({reviews.length || activeProduct.reviewsCount || 128} đánh giá)
                </span>
              </div>
              <span>•</span>
              <span>Đã bán <strong className="text-gray-900">{activeProduct.sold_count || '1.2k+'}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 font-bold flex items-center space-x-1">
                <CheckIcon className="w-3.5 h-3.5" />
                <span>Sẵn hàng trong kho</span>
              </span>
            </div>
          </div>

          {/* Khối Giá tiền & Ưu đãi Voucher */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-black text-red-600">
                {(activeProduct.price || 350000).toLocaleString()} đ
              </span>
              <span className="text-sm text-gray-400 line-through">
                {((activeProduct.original_price || (activeProduct.price || 350000) * 1.3)).toLocaleString()} đ
              </span>
              <span className="bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded">
                -30%
              </span>
            </div>
            <div className="text-xs bg-orange-50 border border-orange-200 text-orange-800 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5">
              <span>🎟️</span>
              <span>Áp dụng voucher <strong>VIBENEW100</strong> giảm thêm 100K</span>
            </div>
          </div>

          {/* CARD THÔNG TIN CỬA HÀNG (STORE PROFILE CARD) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-black text-base shadow-sm">
                V
              </div>
              <div>
                <div className="font-extrabold text-gray-900 flex items-center space-x-2">
                  <span>{activeProduct.seller_name || 'VibeBili Flagship Store'}</span>
                  <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                    MALL
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 flex items-center space-x-2 mt-1">
                  <span className="text-amber-800 font-bold">💎 100% Cam kết chuẩn mô tả</span>
                  <span>•</span>
                  <span>Đánh giá shop: <strong>4.95 ⭐</strong></span>
                  <span>•</span>
                  <span>Phản hồi chat: <strong>99%</strong> (&lt; 15 phút)</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2">
              <button
                type="button"
                onClick={() => alert('Đang kết nối trung tâm chăm sóc khách hàng VibeBili...')}
                className="px-3.5 py-2 border border-gray-300 hover:border-black rounded-full font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                💬 Chat Ngay
              </button>
            </div>
          </div>

          {/* Mô tả sản phẩm */}
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            {activeProduct.description}
          </p>

          {/* --- BỘ CHỌN BIẾN THỂ (COLOR & SIZE MATRIX) --- */}

          {/* 1. Chọn Màu sắc */}
          {activeProduct.colors?.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                1. Màu sắc: <span className="text-black font-extrabold">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {activeProduct.colors.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => {
                      setSelectedColor(col.name);
                      if (col.image) setActiveImage(col.image);
                    }}
                    className={`min-h-[40px] px-4 py-2 text-xs rounded-xl border font-bold transition-all ${
                      selectedColor === col.name
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-400 text-gray-800'
                    }`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Chọn Độ dài (nếu là Tóc Giả) */}
          {isWigProduct && activeProduct.hairLengths?.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                2. Chiều dài sợi tóc: <span className="text-black font-extrabold">{selectedLength}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {activeProduct.hairLengths.map((len) => (
                  <button
                    key={len}
                    onClick={() => setSelectedLength(len)}
                    className={`min-h-[40px] px-4 py-2 text-xs rounded-xl border font-bold transition-all ${
                      selectedLength === len
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-400 text-gray-800'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Chọn Kích cỡ (Size Quần Áo hoặc Chu vi vòng đầu Tóc Giả) */}
          {activeProduct.sizes?.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {isWigProduct ? '3. Chu vi vòng đầu' : '2. Kích cỡ (Size)'}: <span className="text-black font-extrabold">{selectedSize}</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigatePolicy ? onNavigatePolicy('size-guide') : null}
                  className="text-xs text-vibe-accent hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Xem hướng dẫn đo và bảng quy đổi size vòng đầu"
                >
                  <span>📏 Bảng quy đổi size</span>
                  <span className="text-2xs">↗</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeProduct.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`min-h-[40px] px-4 py-2 text-xs rounded-xl border font-bold transition-all ${
                      selectedSize === sz
                        ? 'border-black bg-black text-white shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-400 text-gray-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Số lượng đặt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Số lượng</label>
            <div className="flex items-center border border-gray-300 rounded-xl w-36 overflow-hidden bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Giảm số lượng"
                className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 font-bold text-gray-700 transition"
              >
                <MinusIcon className="w-3.5 h-3.5" />
              </button>
              <span className="flex-1 text-center text-sm font-black text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Tăng số lượng"
                className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 font-bold text-gray-700 transition"
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* NÚT HÀNH ĐỘNG: Thêm Giỏ Hàng & Mua Ngay */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 min-h-[48px] bg-white border-2 border-black text-black font-extrabold py-3.5 px-6 rounded-full hover:bg-gray-50 transition uppercase tracking-wider text-xs shadow-sm flex items-center justify-center space-x-2"
            >
              <ShoppingBagIcon className="w-4 h-4 text-black" />
              <span>Thêm vào giỏ hàng</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 min-h-[48px] bg-black text-white font-extrabold py-3.5 px-6 rounded-full hover:bg-neutral-800 transition uppercase tracking-wider text-xs shadow-md flex items-center justify-center space-x-2"
            >
              <LightningIcon className="w-4 h-4 text-orange-400" />
              <span>Mua ngay</span>
            </button>
            <button
              onClick={() => toggleWishlist(activeProduct)}
              className={`min-h-[48px] px-5 rounded-full border text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                wishlisted ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300 hover:border-black text-gray-700'
              }`}
              title={wishlisted ? 'Đã yêu thích' : 'Lưu lại món đồ'}
            >
              <span>{wishlisted ? '❤️' : '🤍'}</span>
              <span>{wishlisted ? 'Đã Lưu' : 'Thả Tim'}</span>
            </button>
          </div>

          {/* NÚT THỬ ĐỒ AI 2-IN-1 */}
          <button
            type="button"
            onClick={() => {
              if (onNavigateTryOn) onNavigateTryOn(activeProduct.id, isWigProduct ? 'wig' : 'clothing');
            }}
            className="w-full min-h-[48px] bg-neutral-900 hover:bg-black text-white font-bold py-3 px-6 rounded-full uppercase tracking-wider text-xs shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <SparklesIcon className="w-4 h-4 text-orange-400" />
            <span>🪞 Thử sản phẩm này lên Avatar của bạn với AI</span>
          </button>

          {/* BẢNG THÔNG SỐ KỸ THUẬT TIÊU CHUẨN */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2">
            <span className="font-extrabold text-gray-900 uppercase text-[11px] tracking-wider block">
              📋 Thông Số Kỹ Thuật (VibeBili Standard):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-700">
              {isWigProduct ? (
                <>
                  <div>
                    <span className="font-bold text-gray-900 block">• Chất liệu sợi:</span>
                    <span 
                      onClick={() => onNavigatePolicy ? onNavigatePolicy('fiber-standards') : null}
                      className="cursor-pointer hover:text-vibe-accent transition-colors"
                      title="Xem cam kết tiêu chuẩn sợi tơ VibeBili"
                    >
                      Tơ nhân tạo cao cấp chịu nhiệt 180°C, không bóng lộ. <span className="text-2xs text-vibe-accent font-bold underline">Xem chuẩn sợi tơ ↗</span>
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">• Loại lưới:</span>
                    <span>Lưới ren Swiss Lace thoáng khí, kháng khuẩn, co giãn 4 chiều.</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-gray-900 block">• Chất liệu vải:</span>
                    <span>Cotton Heavyweight 250GSM co giãn 4 chiều, thoáng mát, đứng form.</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">• Form dáng:</span>
                    <span>Oversize / Boxy streetwear chuẩn phong cách xu hướng.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cam kết thương hiệu & Vận chuyển */}
          <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-2">
            <div 
              onClick={() => onNavigatePolicy ? onNavigatePolicy('return-policy') : null}
              className="flex items-center space-x-2 cursor-pointer group hover:text-gray-900 transition-colors"
              title="Xem chi tiết Chính sách đổi trả 15 ngày toàn diện"
            >
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Đổi trả miễn phí trong 15 ngày nếu có lỗi từ nhà sản xuất. <span className="text-2xs text-vibe-accent font-bold group-hover:underline">Chi tiết ↗</span></span>
            </div>
            <div className="flex items-center space-x-2">
              <TruckIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Miễn phí giao hàng toàn quốc cho đơn từ 500.000 đ — Kiểm tra hàng trước khi nhận.</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- BẢNG ĐÁNH GIÁ THỰC TẾ (CUSTOMER REVIEWS & BODY FIT TAGS) --- */}
      <div className="mt-16 pt-10 border-t border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center space-x-2">
              <span>⭐ Đánh Giá Thực Tế Từ Khách Hàng</span>
              <span className="text-sm font-normal text-gray-400 normal-case">
                ({reviews.length} đánh giá)
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Phản hồi thực tế từ những khách hàng đã mua và trải nghiệm sản phẩm tại VibeBili.vn
            </p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold uppercase tracking-wider transition self-start md:self-auto shadow-sm"
          >
            {showReviewForm ? '✕ Đóng Form Đánh Giá' : '✍️ Viết Đánh Giá Của Bạn'}
          </button>
        </div>

        {/* FORM VIẾT ĐÁNH GIÁ MỚI KÈM BODY FIT TAGS */}
        {showReviewForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 my-6 shadow-sm">
            <h3 className="text-base font-black text-gray-900 mb-1">
              Đánh Giá Sản Phẩm & Chia Sẻ Thông Số Fit Dáng
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Thông số chiều cao, cân nặng và độ vừa vặn của bạn sẽ giúp những người mua sau chọn đúng size!
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tên người đánh giá */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">👤 Tên người đánh giá (*)</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Mai Phương, Bảo Ngọc..."
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                  />
                </div>

                {/* Chọn số sao */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">⭐ Chất lượng tổng thể:</label>
                  <div className="flex items-center space-x-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                      >
                        <span className={star <= newRating ? 'text-amber-400' : 'text-gray-300'}>★</span>
                      </button>
                    ))}
                    <span className="text-xs font-extrabold text-gray-700 ml-2">
                      {newRating === 5 ? 'Tuyệt vời (5/5)' : newRating === 4 ? 'Rất hài lòng (4/5)' : `${newRating}/5`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tag Body Fit: Chiều cao, Cân nặng, Độ vừa vặn */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">📏 Chiều cao của bạn</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 1m62, 1m70"
                    value={newHeight}
                    onChange={(e) => setNewHeight(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">⚖️ Cân nặng của bạn</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 48kg, 65kg"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">🎯 Độ vừa vặn (Fit)</label>
                  <select
                    value={newFit}
                    onChange={(e) => setNewFit(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:border-black font-semibold"
                  >
                    <option value="Chuẩn size">Chuẩn size (Vừa vặn hoàn hảo)</option>
                    <option value="Hơi chật">Hơi chật (Nên tăng 1 size)</option>
                    <option value="Hơi rộng">Hơi rộng (Nên giảm 1 size)</option>
                  </select>
                </div>
              </div>

              {/* Ảnh đính kèm đánh giá */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">📸 Hình ảnh thực tế (URL link ảnh)</label>
                <input
                  type="url"
                  placeholder="Dán link ảnh feedback (VD: https://images.unsplash.com/... hoặc link ảnh bất kỳ)"
                  value={newReviewImage}
                  onChange={(e) => setNewReviewImage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                />
                {newReviewImage.trim() && (
                  <div className="mt-2 flex items-center space-x-2">
                    <img
                      src={newReviewImage.trim()}
                      alt="Ảnh review xem trước"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                    <span className="text-[10px] text-green-600 font-bold">✓ Ảnh review hợp lệ</span>
                  </div>
                )}
              </div>

              {/* Nội dung đánh giá */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cảm nhận chi tiết (*)</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Chia sẻ về chất lượng sợi tóc / chất vải, độ chân thật, form dáng, dịch vụ giao hàng..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:border-black"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-black text-white hover:bg-neutral-800 transition shadow disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá Ngay'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Khối tóm tắt rating & Bộ lọc review */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center bg-gray-50/70 p-6 rounded-3xl border border-gray-200">
          <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-6">
            <div className="text-4xl font-black text-gray-900">
              {reviews.length > 0
                ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
                : (activeProduct.rating || '5.0')} <span className="text-lg text-gray-400 font-normal">/ 5</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-1 my-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <StarIcon key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-gray-500">Dựa trên {reviews.length} đánh giá đã xác thực</p>
          </div>

          <div className="md:col-span-8 flex flex-wrap gap-2 text-xs font-bold">
            {[
              { key: 'all', label: `Tất cả (${reviews.length})` },
              { key: 'true_to_size', label: 'Chuẩn size (Độ fit hoàn hảo)' },
              { key: 'with_images', label: 'Có hình ảnh thực tế' },
              { key: '5_star', label: '5 sao' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setReviewFilter(f.key)}
                className={`px-4 py-2 rounded-full transition ${
                  reviewFilter === f.key
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* DANH SÁCH REVIEW KHÁCH HÀNG */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              Chưa có đánh giá nào phù hợp với bộ lọc đã chọn.
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={rev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={rev.user_name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 bg-gray-100"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-xs text-gray-900">{rev.user_name}</span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.2 rounded-full font-bold">
                          ✓ Đã mua hàng
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <div className="flex space-x-0.5">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <StarIcon key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-400">• {rev.date || 'Gần đây'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- TAGS BODY FIT & THÔNG SỐ KHÁCH HÀNG (YÊU CẦU ĐẶC BIỆT) --- */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {rev.height && (
                    <span className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                      📏 Chiều cao: <strong className="text-black">{rev.height}</strong>
                    </span>
                  )}
                  {rev.weight && (
                    <span className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                      ⚖️ Cân nặng: <strong className="text-black">{rev.weight}</strong>
                    </span>
                  )}
                  {rev.size && (
                    <span className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                      🏷️ Size đã mua: <strong className="text-black">{rev.size}</strong>
                    </span>
                  )}
                  {rev.fit && (
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${
                      rev.fit === 'Chuẩn size'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      🎯 Độ vừa vặn: {rev.fit}
                    </span>
                  )}
                </div>

                {/* Nội dung nhận xét */}
                <p className="text-xs text-gray-700 leading-relaxed pt-1">
                  {rev.comment}
                </p>

                {/* Ảnh đính kèm từ khách (nếu có) */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex space-x-2 pt-1">
                    {rev.images.map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        alt="Hình ảnh đánh giá"
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200 hover:opacity-90 cursor-pointer"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
