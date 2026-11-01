import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem('vibebili_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('vibebili_wishlist', JSON.stringify(wishlistItems));
    } catch (e) {
      console.error('Không thể lưu wishlist vào LocalStorage', e);
    }
  }, [wishlistItems]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const isWishlisted = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  const addToWishlist = (product) => {
    if (!isWishlisted(product.id)) {
      setWishlistItems((prev) => [
        {
          id: product.id,
          name: product.name,
          price: product.price || product.base_price || 299000,
          original_price: product.original_price,
          main_image: product.main_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
          category_name: product.category_name,
          rating: product.rating || 5.0,
          sold_count: product.sold_count || '500+'
        },
        ...prev
      ]);
      showToast(`Đã thêm "${product.name?.slice(0, 24)}..." vào danh sách yêu thích ❤️`);
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
    showToast('Đã xóa sản phẩm khỏi danh sách yêu thích');
  };

  const toggleWishlist = (product) => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = () => {
    setWishlistItems([]);
    localStorage.removeItem('vibebili_wishlist');
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        totalWishlist: wishlistItems.length,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-neutral-900/95 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 flex items-center space-x-2 animate-bounce">
          <span className="text-red-500">❤️</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </WishlistContext.Provider>
  );
};
