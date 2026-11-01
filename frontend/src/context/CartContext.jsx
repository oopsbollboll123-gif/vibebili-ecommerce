import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Danh sách voucher hợp lệ hệ thống
export const SYSTEM_VOUCHERS = [
  {
    code: 'VIBENEW100',
    title: 'Giảm 100.000 đ cho Thành Viên Mới',
    description: 'Áp dụng cho đơn hàng từ 300.000 đ',
    minOrder: 300000,
    type: 'fixed',
    value: 100000
  },
  {
    code: 'VIBEWIG20',
    title: 'Giảm 20% Tóc Giả & Thời Trang',
    description: 'Giảm tối đa 100.000 đ cho đơn từ 400.000 đ',
    minOrder: 400000,
    type: 'percent',
    value: 20,
    maxDiscount: 100000
  },
  {
    code: 'FREESHIP50K',
    title: 'Miễn Phí Vận Chuyển Toàn Quốc',
    description: 'Giảm 30.000 đ phí ship cho đơn từ 200.000 đ',
    minOrder: 200000,
    type: 'freeship',
    value: 30000
  }
];

export const CartProvider = ({ children }) => {
  // Lấy dữ liệu giỏ hàng đã lưu trong LocalStorage
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

  // Voucher states
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [appliedFreeship, setAppliedFreeship] = useState(null);

  // Đồng bộ giỏ hàng vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('vibebili_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Không thể lưu giỏ hàng vào LocalStorage', e);
    }
  }, [cartItems]);

  // Hiện toast thông báo
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

    showToast(`Đã thêm "${product.name?.slice(0, 24)}..." vào giỏ hàng!`);
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
    setAppliedVoucher(null);
    setAppliedFreeship(null);
    localStorage.removeItem('vibebili_cart');
    localStorage.removeItem('wigvogue_cart');
  };

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const baseShippingFee = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;

  // Tính giảm giá Voucher
  let voucherDiscount = 0;
  if (appliedVoucher) {
    if (subtotal >= (appliedVoucher.minOrder || 0)) {
      if (appliedVoucher.type === 'fixed') {
        voucherDiscount = Math.min(appliedVoucher.value, subtotal);
      } else if (appliedVoucher.type === 'percent') {
        const raw = (subtotal * appliedVoucher.value) / 100;
        voucherDiscount = appliedVoucher.maxDiscount ? Math.min(raw, appliedVoucher.maxDiscount) : raw;
      }
    }
  }

  // Tính giảm giá Freeship
  let freeshipDiscount = 0;
  if (appliedFreeship && baseShippingFee > 0 && subtotal >= (appliedFreeship.minOrder || 0)) {
    freeshipDiscount = Math.min(baseShippingFee, appliedFreeship.value || 30000);
  }

  const finalShippingFee = Math.max(0, baseShippingFee - freeshipDiscount);
  const totalAmount = Math.max(0, subtotal - voucherDiscount + finalShippingFee);

  // Áp dụng voucher
  const applyVoucher = (code) => {
    const cleanCode = code.trim().toUpperCase();
    const found = SYSTEM_VOUCHERS.find(v => v.code === cleanCode);

    if (!found) {
      showToast(`Mã "${cleanCode}" không tồn tại hoặc đã hết hạn!`);
      return false;
    }

    if (found.type === 'freeship') {
      if (subtotal < found.minOrder) {
        showToast(`Mã Freeship yêu cầu đơn tối thiểu ${found.minOrder.toLocaleString()}đ!`);
        return false;
      }
      setAppliedFreeship(found);
      showToast(`Áp dụng thành công mã Freeship ${found.code}!`);
      return true;
    } else {
      if (subtotal < found.minOrder) {
        showToast(`Mã "${cleanCode}" yêu cầu đơn tối thiểu ${found.minOrder.toLocaleString()}đ!`);
        return false;
      }
      setAppliedVoucher(found);
      showToast(`Áp dụng thành công mã giảm giá ${found.code}!`);
      return true;
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    showToast('Đã hủy áp dụng mã giảm giá');
  };

  const removeFreeship = () => {
    setAppliedFreeship(null);
    showToast('Đã hủy áp dụng mã Freeship');
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalCount,
        subtotal,
        shippingFee: baseShippingFee,
        finalShippingFee,
        voucherDiscount,
        freeshipDiscount,
        appliedVoucher,
        appliedFreeship,
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
        applyVoucher,
        removeVoucher,
        removeFreeship,
        systemVouchers: SYSTEM_VOUCHERS
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/90 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};
