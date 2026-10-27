import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import SellerDashboard from './components/SellerDashboard';
import AdminPanel from './components/AdminPanel';
import OutfitCombo from './components/OutfitCombo';
import VirtualTryOn from './components/VirtualTryOn';
import AuthModal from './components/AuthModal';
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
  const { totalCount, openCart, addToCart } = useCart();
  const { user, isAuthenticated, isAdmin, isSeller, logout, openLoginModal } = useAuth();

  // Navigation State: 'home' | 'product-detail' | 'combo' | 'try-on' | 'checkout' | 'seller' | 'admin'
  const [currentView, setCurrentView] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tryOnWigId, setTryOnWigId] = useState(null);
  const [tryOnClothingId, setTryOnClothingId] = useState(null);

  // Danh sách sản phẩm từ API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    e.preventDefault();
    loadProducts();
  };

  const handleProductClick = (id) => {
    setSelectedProductId(id);
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans antialiased">
      {/* 1. Top Bar thông báo ưu đãi kiểu SHEIN */}
      <div className="bg-neutral-950 text-white text-[11px] py-2 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center tracking-wide">
          <div className="hidden md:flex items-center space-x-1.5 text-gray-300">
            <TruckIcon className="w-3.5 h-3.5 text-orange-400" />
            <span>GIAO HỎA TỐC 2H TẠI TP.HCM & HÀ NỘI</span>
          </div>
          <div className="mx-auto flex items-center space-x-1.5 font-bold text-orange-400">
            <FireIcon className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>SIÊU SALE VIBEBILI.VN — "BIẾN HÓA MỖI NGÀY, TRỌN VẸN PHONG CÁCH" — FREESHIP TỪ 500K</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-gray-300">
            <span className="hover:text-white transition cursor-pointer">Hotline: 1900 6868</span>
          </div>
        </div>
      </div>

      {/* 2. Header chính phong cách SHEIN High-Density */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          {/* Logo VibeBili.vn */}
          <div 
            onClick={() => { setCurrentView('home'); setSelectedCategory('all'); }}
            className="flex flex-col cursor-pointer select-none flex-shrink-0 group"
          >
            <div className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">
              VIBE<span className="text-orange-600 group-hover:text-orange-500 transition-colors">BILI</span><span className="text-base font-extrabold text-gray-500 lowercase">.vn</span>
            </div>
            <span className="text-[9px] font-semibold text-gray-400 tracking-wider hidden sm:block mt-0.5">
              Biến hóa mỗi ngày, trọn vẹn phong cách
            </span>
          </div>

          {/* Thanh tìm kiếm */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2 md:mx-6 relative">
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Tìm kiếm tóc giả, outfit Y2K, combo lookbook VibeBili..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-gray-900 rounded-full py-2.5 pl-5 pr-24 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all bg-white"
              />
              <button 
                type="submit"
                aria-label="Tìm kiếm sản phẩm"
                className="absolute right-1.5 bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-neutral-800 transition flex items-center space-x-1.5 shadow"
              >
                <SearchIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tìm</span>
              </button>
            </div>
          </form>

          {/* User & Giỏ hàng */}
          <div className="flex items-center space-x-3 md:space-x-5 text-xs font-semibold flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="font-bold text-gray-900 truncate max-w-[120px]">{user.name}</div>
                  <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider ${
                    isAdmin ? 'bg-purple-100 text-purple-800' :
                    isSeller ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="text-red-500 hover:text-red-700 underline text-xs font-medium"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button 
                onClick={openLoginModal}
                className="inline-flex items-center space-x-1.5 border border-gray-300 hover:border-black px-3.5 py-2 rounded-full font-bold transition text-gray-800"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Tài khoản</span>
              </button>
            )}

            {/* Nút Giỏ Hàng trượt */}
            <button 
              onClick={openCart}
              aria-label="Mở giỏ hàng"
              className="bg-black text-white min-h-[44px] px-4 md:px-5 py-2 rounded-full hover:bg-neutral-800 transition shadow flex items-center space-x-2 focus-visible:ring-2 focus-visible:ring-black"
            >
              <ShoppingBagIcon className="w-4 h-4 text-white" />
              <span className="hidden sm:inline font-bold">Giỏ hàng</span>
              <span className="bg-orange-600 text-white text-[11px] px-2 py-0.5 rounded-full font-black">
                {totalCount}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Danh mục đa tầng */}
        <nav className="border-t border-gray-100 bg-white">
          <ul className="max-w-7xl mx-auto px-4 flex space-x-6 md:space-x-8 text-xs font-bold uppercase tracking-wider py-3 overflow-x-auto no-scrollbar">
            <li 
              onClick={() => { setCurrentView('home'); setSelectedCategory('all'); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ${
                currentView === 'home' && selectedCategory === 'all' 
                  ? 'text-orange-600 border-b-2 border-orange-600 font-black' 
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              Trang Chủ
            </li>
            <li 
              onClick={() => { setCurrentView('home'); setSelectedCategory('Tóc Giả Cao Cấp'); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ${
                currentView === 'home' && selectedCategory === 'Tóc Giả Cao Cấp' 
                  ? 'text-orange-600 border-b-2 border-orange-600 font-black' 
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              Tóc Giả Cao Cấp
            </li>
            <li 
              onClick={() => { setCurrentView('home'); setSelectedCategory('Thời Trang Nữ'); }}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ${
                currentView === 'home' && selectedCategory === 'Thời Trang Nữ' 
                  ? 'text-orange-600 border-b-2 border-orange-600 font-black' 
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              Thời Trang Nữ
            </li>
            <li 
              onClick={() => setCurrentView('combo')}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 flex items-center space-x-1 ${
                currentView === 'combo' 
                  ? 'text-orange-600 border-b-2 border-orange-600 font-black' 
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5 text-orange-500" />
              <span>Outfit x Hairstyle Combo</span>
            </li>
            <li 
              onClick={() => setCurrentView('try-on')}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 flex items-center space-x-1.5 ${
                currentView === 'try-on' 
                  ? 'text-orange-600 border-b-2 border-orange-600 font-black' 
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              <span>🪞</span>
              <span>Phòng Thử Đồ AI 2-in-1</span>
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ml-0.5 animate-pulse">
                HOT
              </span>
            </li>

            {/* Phân hệ Kênh Người Bán & Admin */}
            <li 
              onClick={() => setCurrentView('seller')}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 ml-auto flex items-center space-x-1 ${
                currentView === 'seller' 
                  ? 'text-orange-600 border-b-2 border-orange-600 font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>Kênh Người Bán</span>
            </li>
            <li 
              onClick={() => setCurrentView('admin')}
              className={`cursor-pointer whitespace-nowrap transition-colors pb-1 flex items-center space-x-1 ${
                currentView === 'admin' 
                  ? 'text-orange-600 border-b-2 border-orange-600 font-black' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>Quản Trị Hệ Thống</span>
            </li>
          </ul>
        </nav>
      </header>

      {/* 3. Dynamic Main Content Switch */}
      <div className="flex-1">
        {currentView === 'home' && (
          <main className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero Banner VibeBili.vn phong cách SHEIN */}
            <div className="relative rounded-2xl overflow-hidden mb-10 bg-gradient-to-r from-neutral-950 via-zinc-900 to-neutral-900 text-white p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between">
              <div className="space-y-4 max-w-xl z-10">
                <span className="inline-flex items-center space-x-1.5 bg-orange-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
                  <SparklesIcon className="w-3.5 h-3.5 text-white" />
                  <span>VibeBili.vn • BST Thu Đông 2026</span>
                </span>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                  VIBE<span className="text-orange-500">BILI</span>.VN <br />
                  <span className="text-gray-100 text-lg md:text-2xl font-bold normal-case tracking-normal block mt-2">
                    "Biến hóa mỗi ngày, trọn vẹn phong cách"
                  </span>
                </h1>
                <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                  Sàn TMĐT chuyên biệt kết hợp Tóc giả cao cấp chịu nhiệt 180°C cùng những set outfit thịnh hành nhất giúp bạn tự tin tỏa sáng mọi khoảnh khắc.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button 
                    onClick={() => setCurrentView('try-on')}
                    className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-black px-6 py-3 rounded-full text-xs uppercase tracking-wider transition shadow-xl flex items-center space-x-1.5 transform hover:-translate-y-0.5"
                  >
                    <span>🪞 Phòng Thử Đồ AI 2-in-1</span>
                  </button>
                  <button 
                    onClick={() => setCurrentView('combo')}
                    className="bg-white text-black font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider hover:bg-gray-100 transition shadow-lg flex items-center space-x-1.5"
                  >
                    <span>Khám phá Outfit Combo</span>
                    <SparklesIcon className="w-3.5 h-3.5 text-orange-600" />
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('Tóc Giả Cao Cấp')}
                    className="border border-white/40 text-white font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider hover:bg-white/10 transition"
                  >
                    Xem Tóc Giả Hot
                  </button>
                </div>
              </div>

              <div className="mt-8 md:mt-0 flex space-x-4">
                <div className="w-40 h-52 md:w-52 md:h-64 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl rotate-2 hover:rotate-0 transition duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80" 
                    alt="VibeBili Wig Lookbook" 
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-40 h-52 md:w-52 md:h-64 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl -rotate-2 hover:rotate-0 transition duration-300 hidden sm:block">
                  <img 
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80" 
                    alt="VibeBili Fashion Lookbook" 
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Tiêu đề mục sản phẩm */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider flex items-center space-x-2">
                  <FireIcon className="w-5 h-5 text-red-600 fill-red-600" />
                  <span>{selectedCategory === 'all' ? 'Tất Cả Sản Phẩm Nổi Bật' : selectedCategory}</span>
                </h2>
                <span className="text-xs text-gray-500">
                  Hiển thị {products.length} sản phẩm theo tiêu chí lựa chọn
                </span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedCategory('all')} 
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition min-h-[32px] ${
                    selectedCategory === 'all' ? 'bg-black text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                <button 
                  onClick={() => setSelectedCategory('Tóc Giả Cao Cấp')} 
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition min-h-[32px] ${
                    selectedCategory === 'Tóc Giả Cao Cấp' ? 'bg-black text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tóc Giả
                </button>
                <button 
                  onClick={() => setSelectedCategory('Thời Trang Nữ')} 
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition min-h-[32px] ${
                    selectedCategory === 'Thời Trang Nữ' ? 'bg-black text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Quần Áo
                </button>
              </div>
            </div>

            {/* Lưới sản phẩm */}
            {loading ? (
              <div className="text-center py-20 text-gray-500 space-y-2">
                <div className="inline-block animate-spin w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full"></div>
                <p className="text-xs font-bold uppercase tracking-wider">Đang tải danh mục sản phẩm VibeBili...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
                <p className="text-gray-700 font-bold">Không tìm thấy sản phẩm nào phù hợp.</p>
                <button 
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); loadProducts(); }}
                  className="mt-4 bg-black text-white text-xs px-5 py-2.5 rounded-full font-bold hover:bg-neutral-800 transition"
                >
                  Tải lại danh sách đầy đủ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => handleProductClick(product.id)}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Ảnh sản phẩm */}
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
                          <StarIcon className="w-3.5 h-3.5 text-amber-400" />
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
                        aria-label={`Thêm ${product.name} vào giỏ hàng`}
                        className="bg-black hover:bg-orange-600 text-white p-2.5 rounded-full transition shadow focus-visible:ring-2 focus-visible:ring-black min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Thêm nhanh vào giỏ"
                      >
                        <ShoppingBagIcon className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

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

        {currentView === 'try-on' && (
          <VirtualTryOn 
            preselectedWigId={tryOnWigId}
            preselectedClothingId={tryOnClothingId}
            onNavigateCheckout={() => setCurrentView('checkout')}
          />
        )}

        {currentView === 'combo' && (
          <OutfitCombo 
            onNavigateCheckout={() => setCurrentView('checkout')}
          />
        )}

        {currentView === 'checkout' && (
          <Checkout 
            onBackToHome={() => setCurrentView('home')}
          />
        )}

        {currentView === 'seller' && (
          <SellerDashboard />
        )}

        {currentView === 'admin' && (
          <AdminPanel />
        )}
      </div>

      {/* Giỏ Hàng Trượt Ngang (CartDrawer) */}
      <CartDrawer 
        onNavigateCheckout={() => setCurrentView('checkout')}
      />

      {/* Modal Đăng Nhập / Đăng Ký */}
      <AuthModal />

      {/* 4. Footer phong cách SHEIN VibeBili.vn */}
      <footer className="bg-black text-white text-xs mt-16 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="text-xl font-black uppercase tracking-wider">
              VIBE<span className="text-orange-500">BILI</span><span className="text-sm text-gray-400 lowercase">.vn</span>
            </div>
            <p className="text-orange-400 font-bold text-xs italic">
              "Biến hóa mỗi ngày, trọn vẹn phong cách"
            </p>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Sàn thương mại điện tử chuyên biệt kết hợp Tóc giả cao cấp & Thời trang xu hướng hàng đầu Việt Nam. Định hướng High-density UI chuẩn quốc tế.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm mb-3 text-white">Chăm Sóc Khách Hàng</h4>
            <ul className="space-y-2 text-gray-400 text-[11px]">
              <li className="hover:text-white transition cursor-pointer">Hướng dẫn chọn size & vòng đầu</li>
              <li className="hover:text-white transition cursor-pointer">Chính sách đổi trả 15 ngày</li>
              <li className="hover:text-white transition cursor-pointer">Tra cứu đơn hàng hỏa tốc</li>
              <li className="hover:text-white transition cursor-pointer">Phương thức thanh toán & bảo mật</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm mb-3 text-white">Về VibeBili.vn</h4>
            <ul className="space-y-2 text-gray-400 text-[11px]">
              <li className="hover:text-white transition cursor-pointer">Tuyển dụng nhân tài</li>
              <li className="hover:text-white transition cursor-pointer">Liên hệ hợp tác Seller</li>
              <li className="hover:text-white transition cursor-pointer">Quy chế hoạt động sàn TMĐT</li>
              <li className="hover:text-white transition cursor-pointer">Cam kết chất lượng sợi tơ</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-sm mb-3 text-white">Đăng Ký Nhận Voucher 100K</h4>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Nhập email của bạn..." 
                className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs rounded-l focus:outline-none flex-1 text-white"
              />
              <button className="bg-orange-600 text-white font-bold px-4 rounded-r hover:bg-orange-500 text-xs uppercase transition">
                Gửi
              </button>
            </div>
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
        <MainApp />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
