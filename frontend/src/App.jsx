import React, { useState, useEffect, useRef } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import SellerDashboard from './components/SellerDashboard';
import AdminPanel from './components/AdminPanel';
import OutfitCombo from './components/OutfitCombo';
import VirtualTryOn from './components/VirtualTryOn';
import AuthPage from './components/AuthPage';
import CustomerSpaService from './components/CustomerSpaService';
import CustomerOrders from './components/CustomerOrders';
import WishlistView from './components/WishlistView';
import PolicyPage from './components/PolicyPage';
import { productAPI } from './services/api';
import { DEFAULT_PRODUCT_IMAGE, normalizeProduct, getCleanCustomProducts } from './utils/productUtils';
import {
  ShoppingBagIcon,
  SearchIcon,
  UserIcon,
  FireIcon,
  SparklesIcon,
  StarIcon,
  StoreIcon,
  ShieldCheckIcon,
  TruckIcon
} from './components/Icons';

function MainApp() {
  const { totalCount, openCart, addToCart, applyVoucher, cleanseOrphanedCartItems } = useCart();
  const { wishlistItems, totalWishlist, isWishlisted, toggleWishlist } = useWishlist();
  const { user, isAuthenticated, isAdmin, isSeller, logout } = useAuth();

  // Navigation State: 'home' | 'product-detail' | 'orders' | 'wishlist' | 'combo' | 'try-on' | 'checkout' | 'seller' | 'admin' | 'login' | 'spa'
  const [currentView, setCurrentView] = useState('home');
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [logoutToast, setLogoutToast] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  const [tryOnWigId, setTryOnWigId] = useState(null);
  const [tryOnClothingId, setTryOnClothingId] = useState(null);

  // Danh sách sản phẩm từ API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Newsletter Footer state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterVoucherPopup, setNewsletterVoucherPopup] = useState(false);

  // Policy & Documentation State ('return-policy' | 'size-guide' | 'terms' | 'fiber-standards')
  const [policyTab, setPolicyTab] = useState('return-policy');

  const handleOpenPolicy = (tabName = 'return-policy') => {
    setPolicyTab(tabName);
    setCurrentView('policy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close live search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load sản phẩm từ API kết hợp đồng bộ localStorage (Chuẩn hóa tự động)
  const loadProducts = () => {
    setLoading(true);
    const params = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    productAPI.getAll(params)
      .then(res => {
        let list = (res.success && Array.isArray(res.data)) ? res.data.map((p, idx) => normalizeProduct(p, idx)) : [];

        // Hợp nhất sản phẩm người bán tự tạo trong LocalStorage (đã được tự động chuẩn hóa)
        const custom = getCleanCustomProducts();
        if (custom.length > 0) {
          const apiIds = new Set(list.map(p => p.id));
          const newCustom = custom.filter(p => !apiIds.has(p.id));
          list = [...newCustom, ...list];
        }

        // Lọc theo danh mục an toàn tuyệt đối
        if (selectedCategory !== 'all') {
          const sel = selectedCategory.toLowerCase();
          list = list.filter(p => {
            const cName = (p.category_name || p.category || '').toLowerCase();
            const cId = String(p.category_id || '');
            const slug = (p.slug || '').toLowerCase();
            return cName.includes(sel) || cId === sel || slug.includes(sel);
          });
        }

        // Lọc theo từ khóa tìm kiếm nếu có
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
          );
        }

        setProducts(list);
        setLoading(false);

        // Tự động kiểm tra và dọn dẹp các sản phẩm không còn tồn tại khỏi giỏ hàng
        if (cleanseOrphanedCartItems && list.length > 0) {
          cleanseOrphanedCartItems(list);
        }
      })
      .catch(err => {
        console.warn('Lỗi gọi API products, đọc từ localStorage:', err);
        let list = getCleanCustomProducts();
        if (selectedCategory !== 'all') {
          const sel = selectedCategory.toLowerCase();
          list = list.filter(p => {
            const cName = (p.category_name || p.category || '').toLowerCase();
            const cId = String(p.category_id || '');
            return cName.includes(sel) || cId === sel;
          });
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(p => p.name?.toLowerCase().includes(q));
        }
        setProducts(list);
        setLoading(false);

        if (cleanseOrphanedCartItems && list.length > 0) {
          cleanseOrphanedCartItems(list);
        }
      });
  };

  useEffect(() => {
    loadProducts();
    const handleProductsUpdated = () => loadProducts();
    window.addEventListener('vibebili_products_updated', handleProductsUpdated);
    return () => window.removeEventListener('vibebili_products_updated', handleProductsUpdated);
  }, [selectedCategory]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setIsSearchFocused(false);
    setCurrentView('home');
    loadProducts();
  };

  // Live search suggestions
  const liveSuggestions = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category_name && p.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleProductClick = (id) => {
    setSelectedProductId(id);
    setIsSearchFocused(false);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, null, 1, {
      color: 'Mặc định',
      size: 'Tiêu chuẩn'
    });
  };

  // Xử lý gửi đăng ký nhận voucher 100k ở Footer
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      alert('Vui lòng nhập đúng định dạng email của bạn!');
      return;
    }
    // Tự động tặng và áp dụng voucher cho khách
    applyVoucher('VIBENEW100');
    setNewsletterVoucherPopup(true);
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-vibe-surface text-vibe-ink flex flex-col font-sans antialiased">

      {/* 1. Top Bar — Minimal announcement strip */}
      <div className="bg-vibe-950 text-white text-2xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="hidden md:flex items-center gap-1.5 text-vibe-400">
            <TruckIcon className="w-3.5 h-3.5 text-vibe-accent" />
            <span>Giao hỏa tốc 2h tại TP.HCM & Hà Nội</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-white mx-auto md:mx-0">
            <FireIcon className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>Tặng voucher 100K cho đơn đầu tiên — nhập email ở cuối trang</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-vibe-400">
            <span className="hover:text-white transition cursor-pointer">Hotline: 1900 6868</span>
          </div>
        </div>
      </div>

      {/* 2. Header — Sticky, clean, luxury */}
      <header className="sticky top-0 z-40 glass border-b border-vibe-border shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-[72px] flex items-center justify-between gap-3 md:gap-5">

          {/* Logo */}
          <div
            onClick={() => { setCurrentView('home'); setSelectedCategory('all'); setSearchQuery(''); }}
            className="flex flex-col cursor-pointer select-none flex-shrink-0 group"
          >
            <div className="text-2xl md:text-[1.75rem] font-black tracking-tight uppercase leading-none text-vibe-ink">
              VIBE<span className="text-vibe-accent group-hover:text-vibe-accent-hover transition-colors">BILI</span>
              <span className="text-base font-bold text-vibe-400 lowercase">.vn</span>
            </div>
            <span className="text-2xs font-medium text-vibe-subtle tracking-wide hidden sm:block mt-0.5 italic">
              Biến hóa mỗi ngày, trọn vẹn phong cách
            </span>
          </div>

          {/* Search */}
          <div ref={searchContainerRef} className="flex-1 max-w-lg mx-2 md:mx-4 relative">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Tìm tóc giả, outfit, combo Y2K..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearchFocused(true); }}
                className="w-full bg-vibe-50 border border-vibe-border rounded-full py-2.5 pl-4 pr-20 text-sm focus:outline-none focus:border-vibe-ink focus:bg-white transition-all placeholder:text-vibe-subtle"
              />
              <button
                type="submit"
                aria-label="Tìm kiếm"
                className="absolute right-1.5 bg-vibe-ink text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-vibe-800 transition flex items-center gap-1.5"
              >
                <SearchIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tìm</span>
              </button>
            </form>

            {/* Live Search Dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-card-lg border border-vibe-border z-50 overflow-hidden divide-y divide-vibe-100 animate-slide-down">
                <div className="px-3.5 py-2.5 bg-vibe-50 text-2xs font-bold text-vibe-muted uppercase tracking-wider">
                  {liveSuggestions.length > 0 ? `${liveSuggestions.length} gợi ý` : 'Không tìm thấy'}
                </div>
                {liveSuggestions.length === 0 ? (
                  <div className="p-4 text-xs text-vibe-muted text-center">Không có sản phẩm khớp với "{searchQuery}"</div>
                ) : (
                  liveSuggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleProductClick(prod.id)}
                      className="p-3 hover:bg-vibe-50 flex items-center gap-3 cursor-pointer transition-colors"
                    >
                      <img
                        src={prod.main_image || prod.image || DEFAULT_PRODUCT_IMAGE}
                        alt={prod.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                        className="w-10 h-10 object-cover rounded-xl border border-vibe-border bg-vibe-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-vibe-ink truncate">{prod.name}</p>
                        <p className="text-2xs text-vibe-subtle mt-0.5">{prod.category_name}</p>
                      </div>
                      <span className="text-sm font-bold text-vibe-accent flex-shrink-0">{(prod.price || 299000).toLocaleString()}đ</span>
                    </div>
                  ))
                )}
                <div onClick={() => handleSearch()} className="px-4 py-3 text-center text-xs font-semibold text-vibe-accent hover:bg-vibe-accent-light cursor-pointer transition-colors">
                  Xem tất cả kết quả cho "{searchQuery}" →
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Wishlist */}
            <button
              onClick={() => { setCurrentView('wishlist'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                currentView === 'wishlist'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-transparent text-vibe-700 border-vibe-border hover:border-vibe-400 hover:bg-white'
              }`}
              title="Danh sách yêu thích"
            >
              <span className="text-sm leading-none">❤️</span>
              <span className="hidden md:inline">Yêu thích</span>
              {totalWishlist > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-2xs font-black w-4 h-4 rounded-full flex items-center justify-center">{totalWishlist}</span>
              )}
            </button>

            {/* Orders */}
            <button
              onClick={() => { setCurrentView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                currentView === 'orders'
                  ? 'bg-vibe-ink text-white border-vibe-ink'
                  : 'bg-transparent text-vibe-700 border-vibe-border hover:border-vibe-400 hover:bg-white'
              }`}
              title="Đơn mua của tôi"
            >
              <span className="text-sm leading-none">🧾</span>
              <span className="hidden md:inline">Đơn mua</span>
            </button>

            {/* Admin Portal — chỉ hiện khi là admin */}
            {isAdmin && (
              <button
                onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 rounded-full text-xs font-semibold transition-all border ${
                  currentView === 'admin'
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
                title="Quản Trị Hệ Thống"
              >
                <span>🛡️</span>
                <span className="hidden md:inline">Admin</span>
              </button>
            )}

            {/* Account */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <div
                  onClick={() => { setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hidden sm:flex flex-col items-end cursor-pointer group"
                  title="Tài khoản của tôi"
                >
                  <span className="text-xs font-semibold text-vibe-ink group-hover:text-vibe-accent transition-colors truncate max-w-[96px]">{user.name}</span>
                  <span className={`text-2xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    isAdmin ? 'bg-purple-100 text-purple-700' :
                    isSeller ? 'bg-orange-100 text-orange-700' :
                    'bg-vibe-100 text-vibe-600'
                  }`}>{user.role}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setLogoutToast('Đã đăng xuất thành công!');
                    setTimeout(() => setLogoutToast(''), 3500);
                    setCurrentView('home');
                  }}
                  className="text-vibe-muted hover:text-red-600 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Đăng xuất"
                >
                  Thoát
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthInitialMode('login'); setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="inline-flex items-center gap-1.5 border border-vibe-border hover:border-vibe-ink px-3.5 py-2 rounded-full text-xs font-semibold transition-all text-vibe-ink hover:bg-vibe-50"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </button>
            )}

            {/* Cart */}
            <button
              onClick={openCart}
              aria-label="Mở giỏ hàng"
              className="relative bg-vibe-ink text-white h-10 px-4 md:px-5 rounded-full hover:bg-vibe-800 transition-colors flex items-center gap-2 shadow-btn"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-semibold">Giỏ</span>
              <span className="bg-vibe-accent text-white text-2xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                {totalCount}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="border-t border-vibe-100 bg-white/90">
          <ul className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto no-scrollbar py-0">
            {[
              { label: 'Trang Chủ', action: () => { setCurrentView('home'); setSelectedCategory('all'); setSearchQuery(''); }, active: currentView === 'home' && selectedCategory === 'all' },
              { label: 'Tóc Giả Cao Cấp', action: () => { setCurrentView('home'); setSelectedCategory('Tóc Giả Cao Cấp'); }, active: currentView === 'home' && selectedCategory === 'Tóc Giả Cao Cấp' },
              { label: 'Thời Trang Nữ', action: () => { setCurrentView('home'); setSelectedCategory('Thời Trang Nữ'); }, active: currentView === 'home' && selectedCategory === 'Thời Trang Nữ' },
              { label: 'Thời Trang Nam 👔', action: () => { setCurrentView('home'); setSelectedCategory('Thời Trang Nam'); }, active: currentView === 'home' && selectedCategory === 'Thời Trang Nam' },
              { label: '✨ Outfit Combo', action: () => setCurrentView('combo'), active: currentView === 'combo' },
              { label: '🪞 Thử Đồ AI', action: () => setCurrentView('try-on'), active: currentView === 'try-on', badge: 'HOT' },
              { label: '💆 Spa Tóc', action: () => { setCurrentView('spa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }, active: currentView === 'spa' },
            ].map((item) => (
              <li
                key={item.label}
                onClick={item.action}
                className={`relative cursor-pointer whitespace-nowrap text-xs font-semibold tracking-wide py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  item.active
                    ? 'text-vibe-ink border-vibe-ink'
                    : 'text-vibe-500 border-transparent hover:text-vibe-ink hover:border-vibe-300'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="bg-red-600 text-white text-2xs font-black px-1.5 py-0.5 rounded-full uppercase leading-none">{item.badge}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* 3. Main Content Views */}
      <div className="flex-1">
        {currentView === 'home' && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">

            {/* ── Hero Banner ── Clean, editorial style */}
            <div className="relative rounded-3xl overflow-hidden mb-10 bg-vibe-950 text-white shadow-card-lg">
              <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 lg:p-16 gap-8">
                <div className="space-y-5 max-w-lg z-10">
                  <div className="inline-flex items-center gap-2 bg-white/10 text-white text-2xs font-semibold uppercase px-3.5 py-1.5 rounded-full tracking-widest border border-white/20">
                    <SparklesIcon className="w-3.5 h-3.5 text-vibe-accent" />
                    <span>Bộ Sưu Tập 2026 — VibeBili.vn</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                    VIBE<span className="text-vibe-accent">BILI</span>
                    <span className="text-2xl md:text-3xl font-bold text-vibe-400 lowercase">.vn</span>
                  </h1>
                  <p className="text-vibe-300 text-sm md:text-base leading-relaxed italic font-light">
                    "Biến hóa mỗi ngày, trọn vẹn phong cách"
                  </p>
                  <p className="text-vibe-400 text-xs md:text-sm leading-relaxed">
                    Tóc giả cao cấp chịu nhiệt 180°C kết hợp outfit xu hướng Nam & Nữ.
                    Thử đồ trực tiếp với công nghệ AI 2-in-1 độc quyền.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      onClick={() => setCurrentView('try-on')}
                      className="bg-white text-vibe-ink hover:bg-vibe-100 font-bold px-6 py-3 rounded-full text-sm transition-colors shadow-btn flex items-center gap-2"
                    >
                      <span>🪞</span> Thử Đồ AI 2-in-1
                    </button>
                    <button
                      onClick={() => { setSelectedCategory('Thời Trang Nam'); window.scrollTo({ top: 450, behavior: 'smooth' }); }}
                      className="bg-transparent border border-white/30 hover:border-white hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-full text-sm transition-all flex items-center gap-2"
                    >
                      <span>👔</span> Thời Trang Nam
                    </button>
                  </div>
                </div>

                <div className="hidden lg:flex gap-4 z-10 flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=360&q=80"
                    alt="VibeBili Fashion"
                    className="w-56 h-72 object-cover rounded-2xl shadow-card-lg border border-white/10 -rotate-2"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=280&q=80"
                    alt="VibeBili Tóc giả"
                    className="w-44 h-56 object-cover rounded-2xl shadow-card-lg border border-white/10 mt-10 rotate-1"
                  />
                </div>
              </div>

              {/* Decorative accent */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vibe-accent/40 to-transparent" />
            </div>

            {/* ── Feature Pills ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {[
                { icon: '🚀', title: 'Giao hỏa tốc 2h', sub: 'TP.HCM & Hà Nội' },
                { icon: '🔄', title: 'Đổi trả 15 ngày', sub: 'Miễn phí đổi size', action: () => handleOpenPolicy('return-policy') },
                { icon: '🛡️', title: 'Hàng kiểm duyệt', sub: 'Đảm bảo chất lượng', action: () => handleOpenPolicy('fiber-standards') },
                { icon: '💳', title: 'Thanh toán an toàn', sub: 'Mã hóa SSL 256-bit', action: () => handleOpenPolicy('terms') },
              ].map((f) => (
                <div 
                  key={f.title} 
                  onClick={f.action ? f.action : undefined}
                  className={`bg-white rounded-2xl border border-vibe-border px-4 py-3.5 flex items-center gap-3 shadow-card transition-all ${
                    f.action ? 'cursor-pointer hover:border-vibe-accent hover:shadow-card-md' : ''
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-vibe-ink flex items-center gap-1">
                      <span>{f.title}</span>
                      {f.action && <span className="text-2xs text-vibe-accent">↗</span>}
                    </p>
                    <p className="text-2xs text-vibe-muted">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Category Filter & Product Grid ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 gap-3 border-b border-vibe-border">
              <div>
                <h2 className="text-lg font-bold text-vibe-ink">
                  {selectedCategory === 'all' ? 'Tất Cả Sản Phẩm' : selectedCategory}
                  <span className="text-sm font-normal text-vibe-muted ml-2">({products.length})</span>
                </h2>
                <p className="text-xs text-vibe-subtle mt-0.5">Cam kết chất lượng • Kiểm hàng khi nhận</p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'Tóc Giả Cao Cấp', label: '💇 Tóc Giả' },
                  { key: 'Thời Trang Nữ', label: '👗 Thời Trang Nữ' },
                  { key: 'Thời Trang Nam', label: '👔 Thời Trang Nam' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`text-xs px-4 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat.key
                        ? 'bg-vibe-ink text-white shadow-btn'
                        : 'bg-white border border-vibe-border text-vibe-700 hover:border-vibe-ink hover:text-vibe-ink'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-vibe-border shadow-card">
                    <div className="h-56 skeleton" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 skeleton rounded w-3/4" />
                      <div className="h-3 skeleton rounded w-full" />
                      <div className="h-3 skeleton rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-vibe-border shadow-card px-8 max-w-lg mx-auto">
                <div className="text-5xl mb-4">🛍️</div>
                <p className="text-vibe-ink font-bold text-lg mb-1">Chưa có sản phẩm nào trên sàn</p>
                <p className="text-vibe-muted text-sm mb-6">
                  Toàn bộ các sản phẩm mẫu cũ đã được dọn sạch. Bạn có thể vào Kênh Người Bán để đăng tải sản phẩm và hình ảnh của riêng mình ngay!
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => { setSelectedCategory('all'); setSearchQuery(''); loadProducts(); }}
                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-vibe-ink text-xs px-5 py-2.5 rounded-full font-bold transition"
                  >
                    Làm mới danh sách
                  </button>
                  <button
                    onClick={() => { setCurrentView('seller'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-full sm:w-auto bg-vibe-accent hover:bg-amber-700 text-white text-xs px-6 py-2.5 rounded-full font-bold transition shadow-card flex items-center justify-center space-x-1.5"
                  >
                    <span>🏪 Mở Kênh Người Bán & Đăng Sản Phẩm</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {products.map((product) => {
                  const wishlisted = isWishlisted(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="product-card group"
                    >
                      {/* Product Image */}
                      <div className="relative overflow-hidden bg-vibe-100 aspect-product">
                        <img
                          src={product.main_image || product.image || DEFAULT_PRODUCT_IMAGE}
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        {/* Sale badge: Tính % giảm giá thực tế, chỉ hiện khi có giảm giá */}
                        {product.original_price && Number(product.original_price) > Number(product.price) && (() => {
                          const pct = Math.round((1 - Number(product.price) / Number(product.original_price)) * 100);
                          return pct >= 1 ? (
                            <span className="badge-sale absolute top-2.5 left-2.5">−{pct}%</span>
                          ) : null;
                        })()}

                        {/* Wishlist button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-card transition-transform active:scale-90 ${
                            wishlisted
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-white/90 hover:bg-white border border-transparent hover:border-vibe-200'
                          }`}
                          title={wishlisted ? 'Đã yêu thích' : 'Yêu thích'}
                        >
                          <span className="text-sm leading-none">{wishlisted ? '❤️' : '🤍'}</span>
                        </button>

                        {product.is_combo && (
                          <span className="badge-combo absolute bottom-2.5 left-2.5">
                            <SparklesIcon className="w-3 h-3" /> COMBO
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-2xs font-semibold text-vibe-subtle uppercase tracking-wide mb-1">
                          {product.category_name || 'Tóc Giả & Thời Trang'}
                        </p>
                        <h3 className="text-xs font-semibold line-clamp-2 text-vibe-ink group-hover:text-vibe-accent transition-colors leading-snug mb-2 flex-1">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 text-2xs text-vibe-muted mb-2">
                          <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                          <span className="font-semibold text-vibe-700">{product.rating || 5.0}</span>
                          <span>• {product.sold_count ? `${product.sold_count} đã bán` : 'Mới mở bán'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-vibe-50">
                          <div>
                            <span className="text-sm font-black text-vibe-accent block">{(product.price || 299000).toLocaleString()}đ</span>
                            {product.original_price && (
                              <span className="text-2xs text-vibe-subtle line-through">{Number(product.original_price).toLocaleString()}đ</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleQuickAddToCart(e, product)}
                            aria-label={`Thêm ${product.name} vào giỏ`}
                            className="bg-vibe-ink hover:bg-vibe-800 text-white p-2 rounded-full transition-colors shadow-btn min-w-[34px] min-h-[34px] flex items-center justify-center"
                          >
                            <ShoppingBagIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        )}

        {/* MÀN HÌNH CHI TIẾT SẢN PHẨM RIÊNG BIỆT */}
        {currentView === 'product-detail' && (
          <ProductDetail 
            productId={selectedProductId}
            onBack={() => setCurrentView('home')}
            onNavigateCheckout={() => setCurrentView('checkout')}
            onNavigatePolicy={handleOpenPolicy}
            onNavigateTryOn={(prodId, type) => {
              if (type === 'wig') {
                setTryOnWigId(prodId);
              } else {
                setTryOnClothingId(prodId);
              }
              setCurrentView('try-on');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* MÀN HÌNH ĐƠN MUA CỦA TÔI */}
        {currentView === 'orders' && (
          <CustomerOrders 
            onBackToHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateProduct={(id) => handleProductClick(id)}
          />
        )}

        {/* MÀN HÌNH DANH SÁCH YÊU THÍCH */}
        {currentView === 'wishlist' && (
          <WishlistView 
            onBackToHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateProduct={(id) => handleProductClick(id)}
          />
        )}

        {/* PHÒNG THỬ ĐỒ AI 2-IN-1 */}
        {currentView === 'try-on' && (
          <VirtualTryOn 
            preselectedWigId={tryOnWigId}
            preselectedClothingId={tryOnClothingId}
            onNavigateCheckout={() => setCurrentView('checkout')}
          />
        )}

        {/* OUTFIT COMBO */}
        {currentView === 'combo' && (
          <OutfitCombo 
            onNavigateCheckout={() => setCurrentView('checkout')}
            onNavigateSeller={() => { setCurrentView('seller'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {/* MÀN HÌNH THANH TOÁN (CHECKOUT) */}
        {currentView === 'checkout' && (
          <Checkout 
            onBackToHome={() => setCurrentView('home')}
            onNavigateOrders={() => { setCurrentView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {/* SPA & HẬU MÃI TÓC GIẢ */}
        {currentView === 'spa' && (
          <CustomerSpaService 
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateAuth={() => { setAuthInitialMode('login'); setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {/* ĐĂNG NHẬP / ĐĂNG KÝ */}
        {currentView === 'login' && (
          <AuthPage 
            initialMode={authInitialMode}
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateSeller={() => { setCurrentView('seller'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateAdmin={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {/* KÊNH NGƯỜI BÁN (SELLER DASHBOARD) */}
        {currentView === 'seller' && (
          <SellerDashboard 
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateAuth={() => { setAuthInitialMode('login'); setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setCurrentView('product-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* QUẢN TRỊ ADMIN */}
        {currentView === 'admin' && (
          <AdminPanel 
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateLogin={() => { setAuthInitialMode('login'); setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {/* TRUNG TÂM CHÍNH SÁCH, QUY CHẾ & HƯỚNG DẪN */}
        {currentView === 'policy' && (
          <PolicyPage 
            initialTab={policyTab}
            onBackToHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </div>

      {/* Giỏ Hàng Trượt Ngang (CartDrawer) */}
      <CartDrawer
        onNavigateCheckout={() => setCurrentView('checkout')}
      />

      {/* Thông báo Đăng Xuất */}
      {logoutToast && (
        <div className="toast">
          <span>✅</span>
          <span>{logoutToast}</span>
        </div>
      )}

      {/* MODAL CHÚC MỪNG NHẬN VOUCHER 100K */}
      {newsletterVoucherPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-card-lg border border-vibe-border animate-scale-in">
            <div className="w-14 h-14 bg-vibe-accent-light text-vibe-accent rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
              🎉
            </div>
            <h3 className="text-lg font-bold text-vibe-ink">Chúc mừng!</h3>
            <p className="text-sm text-vibe-muted mt-2 mb-4 leading-relaxed">
              Đăng ký thành công! VibeBili tặng bạn mã giảm <strong className="text-vibe-ink">100.000đ</strong> cho đơn từ 300.000đ:
            </p>
            <div className="bg-vibe-accent-light border-2 border-dashed border-vibe-accent/40 rounded-2xl p-4 mb-5">
              <span className="text-2xs font-bold text-vibe-accent/70 uppercase block mb-1">Mã voucher của bạn</span>
              <span className="text-2xl font-black text-vibe-accent font-mono tracking-widest select-all">VIBENEW100</span>
              <p className="text-xs text-vibe-muted mt-1">Mã đã được kích hoạt vào giỏ hàng!</p>
            </div>
            <button
              onClick={() => setNewsletterVoucherPopup(false)}
              className="w-full bg-vibe-ink hover:bg-vibe-800 text-white py-3 rounded-full text-sm font-semibold transition-colors"
            >
              Bắt Đầu Mua Sắm →
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-vibe-950 text-white mt-20 border-t border-vibe-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="text-2xl font-black uppercase tracking-tight">
              VIBE<span className="text-vibe-accent">BILI</span><span className="text-base font-bold text-vibe-500 lowercase">.vn</span>
            </div>
            <p className="text-vibe-accent text-sm font-medium italic">"Biến hóa mỗi ngày, trọn vẹn phong cách"</p>
            <p className="text-vibe-500 text-xs leading-relaxed">
              Sàn TMĐT chuyên biệt Tóc giả cao cấp & Thời trang xu hướng hàng đầu Việt Nam.
            </p>
            <div className="flex gap-3 pt-2">
              {['Facebook', 'TikTok', 'Instagram'].map((s) => (
                <button key={s} className="text-vibe-500 hover:text-white text-xs transition-colors font-medium">{s}</button>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-widest text-vibe-400 mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2.5 text-vibe-500 text-xs">
              <li onClick={() => { setCurrentView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition cursor-pointer">Tra cứu đơn hàng</li>
              <li onClick={() => { setCurrentView('spa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition cursor-pointer">Spa & phục hồi tóc giả</li>
              <li onClick={() => handleOpenPolicy('size-guide')} className="hover:text-white transition cursor-pointer flex items-center justify-between group">
                <span className="group-hover:text-vibe-accent transition-colors">Hướng dẫn chọn size & vòng đầu</span>
                <span className="text-2xs text-vibe-subtle group-hover:text-white">↗</span>
              </li>
              <li onClick={() => handleOpenPolicy('return-policy')} className="hover:text-white transition cursor-pointer flex items-center justify-between group">
                <span className="group-hover:text-vibe-accent transition-colors">Chính sách đổi trả 15 ngày</span>
                <span className="text-2xs text-vibe-subtle group-hover:text-white">↗</span>
              </li>
              <li className="hover:text-white transition cursor-pointer flex items-center justify-between">
                <span>Hotline: 1900 6868</span>
                <span className="text-2xs bg-vibe-900 text-vibe-accent px-1.5 py-0.5 rounded font-mono font-bold">24/7</span>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-widest text-vibe-400 mb-4">Đối Tác & Pháp Lý</h4>
            <ul className="space-y-2.5 text-vibe-500 text-xs">
              <li
                onClick={() => { setCurrentView('seller'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-vibe-accent transition cursor-pointer font-medium flex items-center gap-1.5"
              >
                <StoreIcon className="w-3.5 h-3.5 text-vibe-accent" />
                Mở Gian Hàng / Kênh Người Bán
              </li>
              {isAdmin && (
                <li
                  onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-purple-400 transition cursor-pointer text-purple-400 font-medium"
                >
                  🛡️ Quản Trị Hệ Thống
                </li>
              )}
              <li onClick={() => handleOpenPolicy('terms')} className="hover:text-white transition cursor-pointer flex items-center justify-between group">
                <span className="group-hover:text-vibe-accent transition-colors">Quy chế hoạt động sàn TMĐT</span>
                <span className="text-2xs text-vibe-subtle group-hover:text-white">↗</span>
              </li>
              <li onClick={() => handleOpenPolicy('fiber-standards')} className="hover:text-white transition cursor-pointer flex items-center justify-between group">
                <span className="group-hover:text-vibe-accent transition-colors">Cam kết tiêu chuẩn sợi tơ</span>
                <span className="text-2xs text-vibe-subtle group-hover:text-white">↗</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-widest text-vibe-400 mb-1">Nhận Voucher 100K</h4>
            <p className="text-vibe-500 text-xs">Đăng ký nhận bản tin, nhận ngay mã giảm 100K cho đơn đầu tiên:</p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-0 rounded-xl overflow-hidden border border-vibe-800">
              <input
                type="email"
                required
                placeholder="Email của bạn..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-vibe-900 border-0 px-3 py-2.5 text-xs flex-1 text-white placeholder:text-vibe-600 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-vibe-accent hover:bg-vibe-accent-hover text-white font-semibold px-4 text-xs uppercase transition-colors"
              >
                Gửi
              </button>
            </form>
            <p className="text-vibe-700 text-2xs">Đồ án môn Công nghệ phần mềm / TMĐT — Nhóm 5 thành viên</p>
          </div>
        </div>

        <div className="border-t border-vibe-900 py-4 text-center text-vibe-600 text-xs">
          © 2026 VibeBili.vn — "Biến hóa mỗi ngày, trọn vẹn phong cách"
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <MainApp />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
