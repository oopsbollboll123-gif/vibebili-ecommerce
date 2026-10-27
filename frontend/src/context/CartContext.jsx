import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Lấy dữ liệu giỏ hàng đã lưu trong LocalStorage (nếu có)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('vibebili_cart') || localStorage.getItem('wigvogue_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Đồng bộ giỏ hàng vào LocalStorage mỗi khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem('vibebili_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Không thể lưu giỏ hàng vào LocalStorage', e);
    }
  }, [cartItems]);

  // Hiện toast thông báo ngắn gọn
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = (product, variant = null, quantity = 1, options = {}) => {
    const variantId = variant ? variant.id : (product.variants?.[0]?.id || null);
    const colorKey = options.color || variant?.color || 'Mặc định';
    const sizeKey = options.size || variant?.size || 'Tiêu chuẩn';
    const lengthKey = options.length || variant?.length || '';
    
    const cartItemId = `${product.id}-${variantId || 'base'}-${colorKey}-${sizeKey}-${lengthKey}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.cartItemId === cartItemId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem = {
          cartItemId,
          id: cartItemId,
          product_id: product.id,
          variant_id: variantId,
          name: product.name,
          variant_title: `${colorKey}${sizeKey !== 'Tiêu chuẩn' ? ` / ${sizeKey}` : ''}${lengthKey ? ` / ${lengthKey}` : ''}`,
          price: variant?.price || product.price || product.base_price || 299000,
          original_price: variant?.original_price || product.original_price || 399000,
          image: variant?.image_url || product.main_image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
          quantity,
          selectedColor: colorKey,
          selectedSize: sizeKey,
          selectedLength: lengthKey
        };
        return [newItem, ...prevItems];
      }
    });

    showToast(`Đã thêm "${product.name?.slice(0, 28)}..." vào giỏ!`);
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId || item.id === cartItemId
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId && item.id !== cartItemId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('vibebili_cart');
    localStorage.removeItem('wigvogue_cart');
  };

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
  const totalAmount = subtotal + shippingFee;

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalCount,
        subtotal,
        shippingFee,
        totalAmount,
        isCartOpen,
        toastMessage,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        showToast,
      }}
    >
      {children}
      {/* Toast Notification theo chuẩn UI/UX Pro Max Priority 2 & 8 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/90 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};
