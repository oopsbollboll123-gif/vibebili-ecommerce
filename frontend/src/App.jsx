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
import { productAPI } from './services/api';
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
  const { totalCount, openCart, addToCart, applyVoucher } = useCart();
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

  // Load sản phẩm từ API
  const loadProducts = () => {
    setLoading(true);
    const params = {};
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (searchQuery.trim()) params.search = searchQuery.trim();

    productAPI.getAll(params)
      .then(res => {
        if (res.success && res.data) {
          setProducts(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Lỗi gọi API products:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans antialiased">
      {/* 1. Top Bar ưu đãi tối giản cao cấp */}
      <div className="bg-neutral-950 text-white text-[11px] py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center tracking-wide">
          <div className="hidden md:flex items-center space-x-1.5 text-gray-300">
            <TruckIcon className="w-3.5 h-3.5 text-orange-400" />
            <span>GIAO HỎA TỐC 2H TẠI TP.HCM & HÀ NỘI</span>
          </div>
          <div className="mx-auto flex items-center space-x-1.5 font-bold text-white">
            <FireIcon className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>VIBEBILI.VN — "BIẾN HÓA MỖI NGÀY, TRỌN VẸN PHONG CÁCH" — TẶNG VOUCHER 100K CHO BẠN MỚI</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-gray-300">
            <span className="hover:text-white transition cursor-pointer">Hotline: 1900 6868</span>
          </div>
        </div>
      </div>

      {/* 2. Header chính sạch sẽ, tinh tế chuẩn Luxury E-commerce */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          {/* Logo VibeBili.vn */}
          <div 
            onClick={() => { setCurrentView('home'); setSelectedCategory('all'); setSearchQuery(''); }}
            className="flex flex-col cursor-pointer select-none flex-shrink-0 group"
          >
            <div className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none text-gray-900">
              VIBE<span className="text-orange-600 group-hover:text-orange-500 transition-colors">BILI</span><span className="text-base font-extrabold text-gray-400 lowercase">.vn</span>
            </div>
            <span className="text-[9px] font-semibold text-gray-400 tracking-wider hidden sm:block mt-0.5">
              Biến hóa mỗi ngày, trọn vẹn phong cách
            </span>
          </div>

          {/* Thanh tìm kiếm trực quan có Live Auto-Complete Dropdown */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl mx-2 md:mx-6 relative">
            <form onSubmit={handleSearch} className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Tìm kiếm tóc giả, outfit nam nữ, combo Y2K..." 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                className="w-full border border-gray-300 rounded-full py-2.5 pl-5 pr-24 text-xs md:text-sm focus:outline-none focus:border-black transition-all bg-gray-50 focus:bg-white"
              />
              <button 
                type="submit"
                aria-label="Tìm kiếm sản phẩm"
                className="absolute right-1.5 bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-neutral-800 transition flex items-center space-x-1.5 shadow-sm"
              >
                <SearchIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tìm</span>
              </button>
            </form>

            {/* Live Search Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 animate-fadeIn">
                <div className="p-2.5 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Gợi ý sản phẩm phù hợp ({liveSuggestions.length})
                </div>

                {liveSuggestions.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    Không tìm thấy sản phẩm nào khớp với "{searchQuery}"
                  </div>
                ) : (
                  liveSuggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleProductClick(prod.id)}
                      className="p-3 hover:bg-gray-50 flex items-center space-x-3 cursor-pointer transition"
                    >
                      <img
                        src={prod.main_image}
                        alt={prod.name}
                        className="w-11 h-11 object-cover rounded-xl border border-gray-200 bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{prod.category_name}</p>
                      </div>
                      <span className="text-xs font-black text-red-600 flex-shrink-0">
                        {(prod.price || 299000).toLocaleString()} đ
                      </span>
                    </div>
                  ))
                )}

                <div
                  onClick={() => handleSearch()}
                  className="p-3 text-center text-xs font-bold text-orange-600 hover:bg-orange-50 cursor-pointer transition"
                >
                  Xem tất cả kết quả cho "{searchQuery}" →
                </div>
              </div>
            )}
          </div>

          {/* User Actions: Wishlist, Orders, User Account & Cart */}
          <div className="flex items-center space-x-2 md:space-x-3 text-xs font-semibold flex-shrink-0">
            {/* Nút Yêu thích (Wishlist Heart) */}
            <button
              onClick={() => { setCurrentView('wishlist'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-full font-bold text-xs transition border ${
                currentView === 'wishlist'
                  ? 'bg-red-50 text-red-600 border-red-300'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-black'
              }`}
              title="Xem danh sách sản phẩm đã thả tim"
            >
              <span>❤️</span>
              <span className="hidden sm:inline">Yêu thích</span>
              {totalWishlist > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  {totalWishlist}
                </span>
              )}
            </button>

            {/* Nút Đơn Mua Của Tôi (Customer Orders) */}
            <button
              onClick={() => { setCurrentView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-full font-bold text-xs transition border ${
                currentView === 'orders'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-black'
              }`}
              title="Xem lịch sử và trạng thái đơn hàng của bạn"
            >
              <span>🧾</span>
              <span className="hidden sm:inline">Đơn mua</span>
            </button>

            {/* User Account / Đăng Nhập */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div 
                  onClick={() => { setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-right hidden sm:block cursor-pointer group"
                  title="Xem hồ sơ & quản lý tài khoản"
                >
                  <div className="font-bold text-gray-900 group-hover:text-orange-600 transition truncate max-w-[100px]">{user.name}</div>
                  <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded tracking-wider ${
                    isAdmin ? 'bg-purple-100 text-purple-800' :
                    isSeller ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    logout();
                    setLogoutToast('Bạn đã đăng xuất tài khoản an toàn!');
                    setTimeout(() => setLogoutToast(''), 4000);
                    setCurrentView('home');
                  }}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  title="Đăng xuất khỏi hệ thống"
                >
                  Thoát
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthInitialMode('login'); setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="inline-flex items-center space-x-1.5 border border-gray-300 hover:border-black px-3.5 py-2 rounded-full font-bold transition text-gray-800 hover:bg-gray-50"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </button>
            )}

            {/* Nút Giỏ Hàng trượt */}
            <button 
              onClick={openCart}
              aria-label="Mở giỏ hàng"
              className="bg-black text-white min-h-[40px] px-3.5 md:px-5 py-2 rounded-full hover:bg-neutral-800 transition shadow flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-black"
            >
              <ShoppingBagIcon className="w-4 h-4 text-white" />
              <span className="hidden sm:inline font-bold">Giỏ hàng</span>
              <span className="bg-orange-600 text-white text-[11px] px-2 py-0.5 rounded-full font-black">
                {totalCount}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Bar Dành Riêng Cho Khách Mua Hàng (Ẩn hoàn toàn Kênh người bán & Admin) */}
        <nav className="border-t border-gray-100 bg-white">
          <ul className="max-w-7xl mx-auto px-4 flex space-x-6 md:space-x-8 text-xs font-bold uppercase tracking-wider py-3 overflow-x-auto no-scrollbar">
            <li 
              onClick={() => { setCurrentView('home'); setSelectedCategory('all'); setSearchQuery(''); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ${
                currentView === 'home' && selectedCategory === 'all' 
                  ? 'text-black border-b-2 border-black font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Trang Chủ
            </li>
            <li 
              onClick={() => { setCurrentView('home'); setSelectedCategory('Tóc Giả Cao Cấp'); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ${
                currentView === 'home' && selectedCategory === 'Tóc Giả Cao Cấp' 
                  ? 'text-black border-b-2 border-black font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Tóc Giả Cao Cấp
            </li>
            <li 
              onClick={() => { setCurrentView('home'); setSelectedCategory('Thời Trang Nữ'); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ${
                currentView === 'home' && selectedCategory === 'Thời Trang Nữ' 
                  ? 'text-black border-b-2 border-black font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Thời Trang Nữ
            </li>
            <li 
              onClick={() => { setCurrentView('home'); setSelectedCategory('Thời Trang Nam'); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ${
                currentView === 'home' && selectedCategory === 'Thời Trang Nam' 
                  ? 'text-black border-b-2 border-black font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Thời Trang Nam 👔
            </li>
            <li 
              onClick={() => setCurrentView('combo')}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 flex items-center space-x-1 ${
                currentView === 'combo' 
                  ? 'text-black border-b-2 border-black font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5 text-orange-500" />
              <span>Outfit x Hairstyle Combo</span>
            </li>
            <li 
              onClick={() => setCurrentView('try-on')}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 flex items-center space-x-1.5 ${
                currentView === 'try-on' 
                  ? 'text-black border-b-2 border-black font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <span>🪞</span>
              <span>Phòng Thử Đồ AI 2-in-1</span>
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ml-0.5">
                HOT
              </span>
            </li>
            <li 
              onClick={() => { setCurrentView('spa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 flex items-center space-x-1 ${
                currentView === 'spa' 
                  ? 'text-black border-b-2 border-black font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <span>✨</span>
              <span>Spa & Phục Hồi Tóc Giả</span>
            </li>
          </ul>
        </nav>
      </header>

      {/* 3. Main Content Views */}
      <div className="flex-1">
        {currentView === 'home' && (
          <main className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero Banner phong cách High-End Minimalist */}
            <div className="relative rounded-3xl overflow-hidden mb-10 bg-neutral-900 text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between">
              <div className="space-y-4 max-w-xl z-10">
                <span className="inline-flex items-center space-x-1.5 bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
                  <SparklesIcon className="w-3.5 h-3.5 text-white" />
                  <span>VibeBili.vn • Bộ Sưu Tập Thời Trang & Tóc 2026</span>
                </span>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                  VIBE<span className="text-orange-500">BILI</span>.VN <br />
                  <span className="text-gray-200 text-lg md:text-2xl font-bold normal-case tracking-normal block mt-2">
                    "Biến hóa mỗi ngày, trọn vẹn phong cách"
                  </span>
                </h1>
                <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                  Sàn TMĐT chuyên biệt kết hợp Tóc giả cao cấp chịu nhiệt 180°C cùng những outfit thịnh hành nhất cho Nam & Nữ. Thử đồ trực tiếp lên Avatar cùng công nghệ AI 2-in-1.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button 
                    onClick={() => setCurrentView('try-on')}
                    className="bg-white hover:bg-gray-100 text-black font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition shadow flex items-center space-x-1.5"
                  >
                    <span>🪞 Phòng Thử Đồ AI 2-in-1</span>
                  </button>
                  <button 
                    onClick={() => { setSelectedCategory('Thời Trang Nam'); window.scrollTo({ top: 450, behavior: 'smooth' }); }}
                    className="bg-transparent border border-white hover:bg-white/10 text-white font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition flex items-center space-x-1.5"
                  >
                    <span>👔 Khám Phá Thời Trang Nam</span>
                  </button>
                </div>
              </div>

              <div className="hidden lg:block relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80" 
                  alt="VibeBili Fashion" 
                  className="w-72 h-80 object-cover rounded-2xl shadow-2xl border-2 border-white/10"
                />
              </div>
            </div>

            {/* Bộ lọc Danh mục sản phẩm */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 mb-6 gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
                  <span>✨ {selectedCategory === 'all' ? 'Tất Cả Sản Phẩm Xu Hướng' : selectedCategory}</span>
                  <span className="text-xs font-normal text-gray-400 normal-case">
                    ({products.length} sản phẩm)
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cam kết chất lượng cao cấp • Đồng kiểm tra hàng khi nhận
                </p>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'Tóc Giả Cao Cấp', label: 'Tóc Giả' },
                  { key: 'Thời Trang Nữ', label: 'Thời Trang Nữ' },
                  { key: 'Thời Trang Nam', label: 'Thời Trang Nam' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`text-xs px-4 py-2 rounded-full font-bold transition whitespace-nowrap ${
                      selectedCategory === cat.key
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-black'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lưới sản phẩm */}
            {loading ? (
              <div className="text-center py-20 text-gray-500 space-y-2">
                <div className="inline-block animate-spin w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full"></div>
                <p className="text-xs font-bold uppercase tracking-wider">Đang tải danh mục sản phẩm VibeBili...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                <p className="text-gray-700 font-bold mb-2">Không tìm thấy sản phẩm nào phù hợp.</p>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); loadProducts(); }}
                  className="bg-black text-white text-xs px-6 py-2.5 rounded-full font-bold hover:bg-neutral-800 transition"
                >
                  Tải lại danh sách đầy đủ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => {
                  const wishlisted = isWishlisted(product.id);
                  return (
                    <div 
                      key={product.id} 
                      onClick={() => handleProductClick(product.id)}
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Ảnh sản phẩm + Nút Thả tim */}
                        <div className="h-64 bg-gray-100 relative overflow-hidden">
                          <img 
                            src={product.main_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'} 
                            alt={product.name} 
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                            HOT -30%
                          </span>

                          {/* Nút Thả tim (Wishlist Heart) trên Card */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 ${
                              wishlisted ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
                            }`}
                            title={wishlisted ? 'Đã yêu thích' : 'Thả tim'}
                          >
                            <span className="text-sm leading-none">{wishlisted ? '❤️' : '🤍'}</span>
                          </button>

                          {product.is_combo && (
                            <span className="absolute bottom-2 left-2 bg-black/85 text-orange-400 text-[9px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                              <SparklesIcon className="w-2.5 h-2.5" />
                              <span>COMBO</span>
                            </span>
                          )}
                        </div>

                        {/* Thông tin */}
                        <div className="p-3">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                            {product.category_name || 'Tóc Giả & Thời Trang'}
                          </p>
                          <h3 className="text-xs font-semibold line-clamp-2 h-8 text-gray-900 group-hover:text-orange-600 transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center space-x-1 mt-1 text-[11px] text-gray-600 font-medium">
                            <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-gray-800">{product.rating || 5.0}</span>
                            <span className="text-gray-400">• Đã bán {product.sold_count || '500+'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 pt-0 border-t border-gray-50 flex items-center justify-between mt-2">
                        <div>
                          <span className="text-sm font-black text-red-600 block">
                            {(product.price || 299000).toLocaleString()} đ
                          </span>
                          {product.original_price && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {Number(product.original_price).toLocaleString()} đ
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => handleQuickAddToCart(e, product)}
                          aria-label={`Thêm ${product.name} vào giỏ`}
                          className="bg-black hover:bg-neutral-800 text-white p-2.5 rounded-full transition shadow focus-visible:ring-2 focus-visible:ring-black min-w-[36px] min-h-[36px] flex items-center justify-center"
                          title="Thêm nhanh vào giỏ"
                        >
                          <ShoppingBagIcon className="w-4 h-4 text-white" />
                        </button>
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
          />
        )}

        {/* KÊNH NGƯỜI BÁN (SELLER DASHBOARD) */}
        {currentView === 'seller' && (
          <SellerDashboard 
            onNavigateHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateAuth={() => { setAuthInitialMode('login'); setCurrentView('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}

        {/* QUẢN TRỊ ADMIN */}
        {currentView === 'admin' && (
          <AdminPanel />
        )}
      </div>

      {/* Giỏ Hàng Trượt Ngang (CartDrawer) */}
      <CartDrawer 
        onNavigateCheckout={() => setCurrentView('checkout')}
      />

      {/* Thông báo Đăng Xuất An Toàn */}
      {logoutToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center space-x-2 border border-white/20 animate-bounce">
          <span>✅</span>
          <span>{logoutToast}</span>
        </div>
      )}

      {/* MODAL CHÚC MỪNG NHẬN VOUCHER 100K TỪ FOOTER */}
      {newsletterVoucherPopup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-200">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🎉
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase">
              Chúc Mừng Bạn!
            </h3>
            <p className="text-xs text-gray-600 mt-2 mb-4 leading-relaxed">
              Bạn đã đăng ký nhận bản tin thành công. VibeBili tặng bạn mã giảm giá <strong>100.000 đ</strong> cho đơn hàng từ 300.000 đ:
            </p>

            <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl p-4 mb-5">
              <span className="text-xs font-bold text-orange-800 uppercase block mb-1">Mã Voucher Của Bạn</span>
              <span className="text-2xl font-black text-orange-600 font-mono tracking-widest select-all">VIBENEW100</span>
              <p className="text-[11px] text-gray-500 mt-1">Mã đã được tự động kích hoạt vào giỏ hàng của bạn!</p>
            </div>

            <button
              onClick={() => setNewsletterVoucherPopup(false)}
              className="w-full bg-black hover:bg-neutral-800 text-white py-3 rounded-full text-xs font-bold uppercase tracking-wider transition"
            >
              Bắt Đầu Mua Sắm Ngay
            </button>
          </div>
        </div>
      )}

      {/* 4. Footer cao cấp VibeBili.vn */}
      <footer className="bg-neutral-950 text-white text-xs mt-20 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="text-xl font-black uppercase tracking-wider">
              VIBE<span className="text-orange-500">BILI</span><span className="text-sm text-gray-400 lowercase">.vn</span>
            </div>
            <p className="text-orange-400 font-bold text-xs italic">
              "Biến hóa mỗi ngày, trọn vẹn phong cách"
            </p>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Sàn thương mại điện tử chuyên biệt kết hợp Tóc giả cao cấp & Thời trang xu hướng hàng đầu Việt Nam.
            </p>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider text-xs mb-3 text-white">Chăm Sóc Khách Hàng</h4>
            <ul className="space-y-2 text-gray-400 text-[11px]">
              <li onClick={() => { setCurrentView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition cursor-pointer">
                Tra cứu đơn mua của tôi
              </li>
              <li onClick={() => { setCurrentView('spa'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-white transition cursor-pointer">
                Spa & phục hồi nếp tóc giả
              </li>
              <li className="hover:text-white transition cursor-pointer">Hướng dẫn chọn size & vòng đầu</li>
              <li className="hover:text-white transition cursor-pointer">Chính sách đổi trả 15 ngày</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider text-xs mb-3 text-white">Dành Cho Đối Tác</h4>
            <ul className="space-y-2 text-gray-400 text-[11px]">
              <li 
                onClick={() => { setCurrentView('seller'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-orange-400 transition cursor-pointer font-bold flex items-center space-x-1"
              >
                <StoreIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>Kênh Người Bán / Mở Gian Hàng</span>
              </li>
              {isAdmin && (
                <li 
                  onClick={() => { setCurrentView('admin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-purple-400 transition cursor-pointer font-bold text-purple-400"
                >
                  Quản Trị Hệ Thống Admin
                </li>
              )}
              <li className="hover:text-white transition cursor-pointer">Quy chế hoạt động sàn TMĐT</li>
              <li className="hover:text-white transition cursor-pointer">Cam kết tiêu chuẩn chất lượng sợi tơ</li>
            </ul>
          </div>

          {/* Form Đăng ký nhận voucher 100k */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-xs mb-1 text-white">Đăng Ký Nhận Voucher 100K</h4>
            <p className="text-gray-400 text-[11px]">Nhận ngay mã giảm 100K cho đơn hàng đầu tiên tại VibeBili.vn:</p>
            <form onSubmit={handleNewsletterSubmit} className="flex">
              <input 
                type="email" 
                required
                placeholder="Nhập email của bạn..." 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs rounded-l focus:outline-none focus:border-white flex-1 text-white"
              />
              <button 
                type="submit"
                className="bg-white text-black font-extrabold px-4 rounded-r hover:bg-gray-200 text-xs uppercase transition"
              >
                Gửi
              </button>
            </form>
            <p className="text-gray-500 text-[10px]">Đồ án môn học Công nghệ phần mềm / TMĐT — Nhóm 5 thành viên</p>
          </div>
        </div>

        <div className="border-t border-neutral-900 py-4 text-center text-gray-500 text-[11px]">
          © 2026 VibeBili.vn Inc. All Rights Reserved. Slogan: "Biến hóa mỗi ngày, trọn vẹn phong cách".
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
