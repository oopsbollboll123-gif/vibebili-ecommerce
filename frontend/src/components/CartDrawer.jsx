import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { CloseIcon, TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon } from './Icons';

function CartDrawer({ onNavigateCheckout }) {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    finalShippingFee,
    voucherDiscount,
    freeshipDiscount,
    appliedVoucher,
    appliedFreeship,
    applyVoucher,
    removeVoucher,
    removeFreeship,
    systemVouchers,
    totalAmount,
    totalCount
  } = useCart();

  const [inputCode, setInputCode] = useState('');

  if (!isCartOpen) return null;

  const handleApplyCustomCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    applyVoucher(inputCode.trim());
    setInputCode('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 1. Backdrop nền mờ */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity backdrop-blur-sm"
        onClick={closeCart}
      ></div>

      {/* 2. Khung Drawer trượt từ phải sang */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
          
          {/* Header của Drawer */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider flex items-center space-x-2">
                <ShoppingBagIcon className="w-5 h-5 text-gray-900" />
                <span>Giỏ Hàng Của Tôi ({totalCount})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {subtotal >= 500000 
                  ? '🎉 Bạn đã đủ điều kiện MIỄN PHÍ VẬN CHUYỂN!' 
                  : `Mua thêm ${(500000 - subtotal).toLocaleString()} đ để được Freeship`}
              </p>
            </div>
            <button 
              onClick={closeCart}
              aria-label="Đóng giỏ hàng"
              className="text-gray-400 hover:text-black p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Thanh tiến trình Freeship */}
          <div className="w-full bg-gray-100 h-1.5 overflow-hidden">
            <div 
              className="bg-black h-1.5 transition-all duration-500"
              style={{ width: `${Math.min(100, (subtotal / 500000) * 100)}%` }}
            ></div>
          </div>

          {/* Body: Danh sách sản phẩm trong giỏ */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 text-gray-500 space-y-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <ShoppingBagIcon className="w-8 h-8" />
                </div>
                <p className="font-bold text-gray-800 text-sm">Giỏ hàng của bạn đang trống</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Hãy thêm tóc giả hoặc set trang phục yêu thích vào giỏ để nhận ưu đãi!
                </p>
                <button 
                  onClick={closeCart}
                  className="bg-black text-white text-xs px-6 py-3 rounded-full font-bold hover:bg-neutral-800 transition shadow"
                >
                  Khám Phá Sản Phẩm Ngay
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex space-x-3.5 border-b border-gray-100 pb-4">
                  {/* Ảnh sản phẩm */}
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-20 h-24 object-cover rounded-xl border border-gray-200 flex-shrink-0 bg-gray-50"
                  />

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold line-clamp-2 text-gray-900 leading-snug">{item.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Phân loại: <span className="font-semibold text-gray-800">{item.variant_title || item.selectedColor || 'Tiêu chuẩn'}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-black text-red-600">
                        {item.price.toLocaleString()} đ
                      </span>

                      {/* Điều chỉnh số lượng */}
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Giảm số lượng"
                          className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 transition"
                        >
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Tăng số lượng"
                          className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 transition"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nút xóa sản phẩm */}
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Xóa ${item.name} khỏi giỏ`}
                    className="text-gray-400 hover:text-red-600 p-1.5 self-start rounded-full hover:bg-gray-50 transition"
                    title="Xóa sản phẩm"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer: Chọn Voucher, Tổng tiền & Nút Thanh Toán */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50/80 space-y-3">
              {/* Voucher Chips */}
              <div>
                <span className="text-[11px] font-bold text-gray-700 block mb-1.5">Mã Giảm Giá Sẵn Có:</span>
                <div className="flex flex-wrap gap-1.5">
                  {systemVouchers.map(v => (
                    <button
                      key={v.code}
                      onClick={() => applyVoucher(v.code)}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition ${
                        appliedVoucher?.code === v.code || appliedFreeship?.code === v.code
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-800 border-gray-300 hover:border-black'
                      }`}
                    >
                      {v.code}
                    </button>
                  ))}
                </div>

                {appliedVoucher && (
                  <div className="mt-2 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 p-1.5 rounded-lg flex justify-between items-center">
                    <span>Đã áp dụng voucher: <strong>{appliedVoucher.code}</strong> (-{voucherDiscount.toLocaleString()}đ)</span>
                    <button onClick={removeVoucher} className="text-red-500 font-bold ml-2">✕</button>
                  </div>
                )}
                {appliedFreeship && (
                  <div className="mt-1.5 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 p-1.5 rounded-lg flex justify-between items-center">
                    <span>Đã áp dụng freeship: <strong>{appliedFreeship.code}</strong> (-{freeshipDiscount.toLocaleString()}đ)</span>
                    <button onClick={removeFreeship} className="text-red-500 font-bold ml-2">✕</button>
                  </div>
                )}
              </div>

              {/* Tóm tắt tiền */}
              <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-200 pt-2.5">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-gray-900">{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí ship:</span>
                  <span className={finalShippingFee === 0 ? 'text-emerald-600 font-bold' : 'font-semibold text-gray-900'}>
                    {finalShippingFee === 0 ? 'MIỄN PHÍ' : `${finalShippingFee.toLocaleString()} đ`}
                  </span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Voucher giảm giá:</span>
                    <span>- {voucherDiscount.toLocaleString()} đ</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Tổng thanh toán:</span>
                  <span className="text-red-600 text-lg font-black">{totalAmount.toLocaleString()} đ</span>
                </div>
              </div>

              <button
                onClick={() => {
                  closeCart();
                  if (onNavigateCheckout) onNavigateCheckout();
                }}
                className="w-full bg-black text-white font-extrabold py-3.5 rounded-full hover:bg-neutral-800 transition uppercase tracking-wider text-xs shadow-lg min-h-[44px] flex items-center justify-center space-x-2 mt-2"
              >
                <span>Tiến Hành Thanh Toán ({totalCount})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;
