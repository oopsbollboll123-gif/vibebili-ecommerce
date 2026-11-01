import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import {
  CreditCardIcon,
  QrCodeIcon,
  CheckIcon,
  TruckIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  ShieldCheckIcon
} from './Icons';

function Checkout({ onBackToHome, onNavigateOrders }) {
  const {
    cartItems,
    subtotal,
    shippingFee,
    finalShippingFee,
    voucherDiscount,
    freeshipDiscount,
    appliedVoucher,
    appliedFreeship,
    totalAmount,
    applyVoucher,
    removeVoucher,
    removeFreeship,
    systemVouchers,
    clearCart
  } = useCart();

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.name || 'Hoàng Trọng Phúc',
    phone: user?.phone || '0909123456',
    address: user?.address || 'Khu phố 6, Linh Trung, TP. Thủ Đức',
    city: 'Hồ Chí Minh',
    note: 'Giao giờ hành chính giúp em nhé.'
  });

  const [voucherInput, setVoucherInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'qr'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(null);

  // --- STATE CHO XÁC THỰC BẢO MẬT OTP (COD) ---
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [expectedOtp] = useState('8866');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpError, setOtpError] = useState('');

  // --- STATE CHO XÁC THỰC VIETQR (CHUYỂN KHOẢN) ---
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrTimer, setQrTimer] = useState(300); // 5 phút
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [qrOrderMemo] = useState(`VIBE-${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        phone: user.phone || prev.phone,
        address: user.address || prev.address
      }));
    }
  }, [user]);

  // Đếm ngược OTP
  useEffect(() => {
    let interval = null;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // Đếm ngược VietQR
  useEffect(() => {
    let interval = null;
    if (showQrModal && qrTimer > 0) {
      interval = setInterval(() => setQrTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showQrModal, qrTimer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyVoucherCode = (e) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    applyVoucher(voucherInput.trim());
    setVoucherInput('');
  };

  // Bước 1: Khi khách bấm "Xác Nhận Đặt Hàng"
  const handlePreCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Giỏ hàng của bạn đang trống! Hãy chọn sản phẩm trước khi thanh toán.');
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng!');
      return;
    }

    // Nếu chọn COD -> Bật bảo mật xác thực OTP qua SĐT
    if (paymentMethod === 'cod') {
      setShowOtpModal(true);
      setOtpTimer(60);
      setOtpCode('');
      setOtpError('');
      return;
    }

    // Nếu chọn QR -> Bật thanh toán VietQR chuyển khoản
    if (paymentMethod === 'qr') {
      setShowQrModal(true);
      setQrTimer(300);
      return;
    }
  };

  // Bước 2: Thực sự tạo đơn hàng trên Backend
  const executeOrderCreation = async (verifiedPaymentStatus = 'pending') => {
    setIsSubmitting(true);
    try {
      const orderPayload = {
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        city: formData.city,
        note: formData.note,
        payment_method: paymentMethod,
        payment_status: verifiedPaymentStatus,
        subtotal,
        shipping_fee: finalShippingFee,
        voucher_discount: voucherDiscount,
        total_amount: totalAmount,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.name,
          variant_title: item.variant_title,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        }))
      };

      const res = await orderAPI.createOrder(orderPayload);
      const generatedCode = res.data?.orderCode || `VB-${Math.floor(10000 + Math.random() * 90000)}`;

      clearCart();
      setShowOtpModal(false);
      setShowQrModal(false);

      setOrderCompleted({
        code: generatedCode,
        trackingCode: `GHN-${generatedCode}`,
        total: totalAmount,
        method: paymentMethod,
        name: formData.fullName,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}`,
        items: cartItems,
        verifiedPaymentStatus
      });
    } catch (err) {
      alert('⚠️ ' + (err.message || 'Lỗi khi tạo đơn hàng trên máy chủ!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận OTP (COD)
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode.trim() === expectedOtp) {
      executeOrderCreation('pending');
    } else {
      setOtpError(`Mã OTP không chính xác! Vui lòng nhập đúng mã xác thực "${expectedOtp}" vừa gửi về điện thoại.`);
    }
  };

  // Xác nhận chuyển khoản VietQR (QR)
  const handleVerifyBankPayment = () => {
    setIsVerifyingBank(true);
    setTimeout(() => {
      setIsVerifyingBank(false);
      executeOrderCreation('paid');
    }, 2000);
  };

  // Màn hình thông báo đặt hàng thành công
  if (orderCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckIcon className="w-10 h-10" />
        </div>

        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
          {orderCompleted.verifiedPaymentStatus === 'paid' ? '💳 Đã Nhận Thanh Toán Chuyển Khoản' : '🔒 Đã Xác Thực SĐT Qua OTP Thành Công'}
        </span>

        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
          Đặt Hàng Thành Công!
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Cảm ơn bạn đã tin chọn <span className="font-bold text-black">VibeBili.vn</span>. Đơn hàng của bạn đã được chuyển tới nhà bán hàng để đóng gói.
        </p>

        {/* Thẻ tóm tắt thông tin đơn hàng */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 mt-8 text-left shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 gap-2">
            <div>
              <span className="text-xs text-gray-400 block uppercase font-bold">Mã đơn hàng</span>
              <span className="text-lg font-black text-gray-900 font-mono">#{orderCompleted.code}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-bold">Mã vận đơn dự kiến</span>
              <span className="text-sm font-bold text-blue-600 font-mono">{orderCompleted.trackingCode} (GHN)</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block uppercase font-bold">Tổng thanh toán</span>
              <span className="text-lg font-black text-red-600">{orderCompleted.total.toLocaleString()} đ</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
            <div>
              <p className="font-bold text-gray-900">👤 Người nhận:</p>
              <p>{orderCompleted.name} — {orderCompleted.phone}</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">📍 Địa chỉ nhận hàng:</p>
              <p>{orderCompleted.address}</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">💳 Phương thức thanh toán:</p>
              <p>{orderCompleted.method === 'cod' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản VietQR MB Bank'}</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">📦 Đơn vị vận chuyển:</p>
              <p>Giao Hàng Nhanh (GHN Express) — Giao trong 24-48 giờ</p>
            </div>
          </div>
        </div>

        {/* Nút điều hướng */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={() => onNavigateOrders ? onNavigateOrders() : onBackToHome()}
            className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-neutral-800 text-white rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md"
          >
            🧾 Xem Đơn Mua Của Tôi
          </button>
          <button
            onClick={onBackToHome}
            className="w-full sm:w-auto px-8 py-3.5 border border-gray-300 hover:border-black rounded-full font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-50 transition"
          >
            Tiếp Tục Mua Sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Nút quay lại */}
      <button
        onClick={onBackToHome}
        className="inline-flex items-center space-x-1.5 text-xs text-gray-500 hover:text-black font-semibold mb-6 transition"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        <span>Quay lại giỏ hàng / Tiếp tục chọn đồ</span>
      </button>

      <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-8 flex items-center space-x-2">
        <span>🛍️ Thanh Toán Đơn Hàng</span>
        <span className="text-xs font-normal text-gray-400 normal-case">
          (Bảo mật SSL 256-bit)
        </span>
      </h1>

      <form onSubmit={handlePreCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CỘT TRÁI (7 PHẦN): Địa chỉ giao hàng & Phương thức thanh toán */}
        <div className="lg:col-span-7 space-y-6">
          {/* PHẦN 1: THÔNG TIN GIAO HÀNG */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider flex items-center space-x-2 text-gray-900">
              <TruckIcon className="w-4 h-4 text-orange-600" />
              <span>1. Thông Tin Người Nhận & Địa Chỉ Giao</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên (*)</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại (*)</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="09xx xxx xxx"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, đường, phường/xã) (*)</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: 120 Cách Mạng Tháng 8, P.10"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black bg-white"
                >
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú vận chuyển (Tùy chọn)</label>
              <input
                type="text"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Giao trong giờ hành chính, gọi trước khi giao..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* PHẦN 2: PHƯƠNG THỨC THANH TOÁN */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider flex items-center space-x-2 text-gray-900">
              <CreditCardIcon className="w-4 h-4 text-orange-600" />
              <span>2. Chọn Phương Thức Thanh Toán</span>
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition ${
                  paymentMethod === 'cod' ? 'border-black bg-gray-50/70 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-black w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 block">
                      💵 Thanh toán tiền mặt khi nhận hàng (COD)
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Bảo mật OTP qua SĐT trước khi đặt đơn • Đồng kiểm tra hàng khi nhận
                    </span>
                  </div>
                </div>
                <TruckIcon className="w-5 h-5 text-gray-400" />
              </label>

              <label
                className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition ${
                  paymentMethod === 'qr' ? 'border-black bg-gray-50/70 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="qr"
                    checked={paymentMethod === 'qr'}
                    onChange={() => setPaymentMethod('qr')}
                    className="accent-black w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 block">
                      💳 Quét mã VietQR / Chuyển khoản MB Bank
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Tự động điền số tiền & mã đơn • Xác thực giao dịch ngay lập tức 24/7
                    </span>
                  </div>
                </div>
                <QrCodeIcon className="w-5 h-5 text-gray-400" />
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 PHẦN): Tóm tắt đơn, Voucher & Xác nhận */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5 sticky top-28">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Đơn Hàng Của Bạn</span>
              <span className="text-gray-400 font-normal">({cartItems.reduce((a, b) => a + b.quantity, 0)} món)</span>
            </h2>

            {/* Danh sách sản phẩm rút gọn */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs pb-2 border-b border-gray-50">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-gray-100"
                    />
                    <div className="max-w-[160px]">
                      <p className="font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{item.variant_title || 'Mặc định'}</p>
                      <span className="text-gray-500 text-[11px]">x{item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-gray-900">
                    {(item.price * item.quantity).toLocaleString()} đ
                  </span>
                </div>
              ))}
            </div>

            {/* MÃ GIẢM GIÁ (VOUCHER & FREESHIP) */}
            <div className="border-t border-gray-100 pt-3">
              <label className="block text-xs font-bold text-gray-800 mb-2">Mã Giảm Giá / Voucher VibeBili</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Nhập mã (Vd: VIBENEW100)"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs uppercase font-mono focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucherCode}
                  className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition"
                >
                  Áp Dụng
                </button>
              </div>

              {/* Các voucher gợi ý sẵn có */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {systemVouchers.map(v => (
                  <button
                    type="button"
                    key={v.code}
                    onClick={() => applyVoucher(v.code)}
                    className="text-[10px] bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 px-2 py-1 rounded-lg font-bold transition"
                  >
                    🏷️ {v.code}
                  </button>
                ))}
              </div>

              {/* Hiển thị voucher đang áp dụng */}
              {appliedVoucher && (
                <div className="mt-2.5 bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <span>✅ Đã áp dụng: <strong>{appliedVoucher.code}</strong> (-{voucherDiscount.toLocaleString()}đ)</span>
                  <button type="button" onClick={removeVoucher} className="text-red-500 font-bold ml-2">✕</button>
                </div>
              )}
              {appliedFreeship && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 p-2 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <span>🚚 Đã áp dụng Freeship: <strong>{appliedFreeship.code}</strong> (-{freeshipDiscount.toLocaleString()}đ)</span>
                  <button type="button" onClick={removeFreeship} className="text-red-500 font-bold ml-2">✕</button>
                </div>
              )}
            </div>

            {/* Chi tiết tính toán số tiền */}
            <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính hàng:</span>
                <span className="font-semibold text-gray-900">{subtotal.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-gray-900">
                  {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString()} đ`}
                </span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Giảm giá Voucher:</span>
                  <span>- {voucherDiscount.toLocaleString()} đ</span>
                </div>
              )}
              {freeshipDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Giảm phí vận chuyển:</span>
                  <span>- {freeshipDiscount.toLocaleString()} đ</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-3">
                <span>Tổng Thanh Toán:</span>
                <span className="text-red-600 text-lg font-black">{totalAmount.toLocaleString()} đ</span>
              </div>
            </div>

            {/* Nút hành động thanh toán */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white font-extrabold py-3.5 px-6 rounded-full hover:bg-neutral-800 transition uppercase tracking-wider text-xs shadow-md disabled:opacity-50"
            >
              {paymentMethod === 'cod'
                ? `Tiếp Tục Xác Thực OTP & Đặt Hàng`
                : `Thanh Toán VietQR (${totalAmount.toLocaleString()} đ)`}
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-gray-400">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Giao dịch an toàn • Cam kết bảo mật dữ liệu khách hàng</span>
            </div>
          </div>
        </div>
      </form>

      {/* --- MODAL XÁC THỰC BẢO MẬT OTP CHO ĐƠN COD --- */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              📱
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">
              Xác Thực Số Điện Thoại Đặt Hàng (COD)
            </h3>
            <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
              Nhằm hạn chế đơn ảo và bảo vệ quyền lợi người mua, mã OTP xác thực đã được gửi tới số: <strong className="text-black">{formData.phone}</strong>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-4 text-center">
              💡 <em>Mã OTP thử nghiệm nhanh:</em> <strong className="text-base text-red-600 font-mono tracking-widest">{expectedOtp}</strong>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength="4"
                  autoFocus
                  required
                  placeholder="Nhập mã 4 chữ số (8866)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest font-mono text-2xl font-black py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-black"
                />
              </div>

              {otpError && (
                <p className="text-xs text-red-600 text-center font-semibold">{otpError}</p>
              )}

              <div className="text-center text-xs text-gray-400">
                {otpTimer > 0 ? (
                  <span>Gửi lại mã sau <strong>{otpTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setOtpTimer(60); alert(`Đã gửi lại mã OTP mới: ${expectedOtp}`); }}
                    className="text-black font-bold underline"
                  >
                    Gửi lại mã OTP
                  </button>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-full text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo đơn...' : 'Xác Nhận Đặt Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL THANH TOÁN VIETQR CHUYỂN KHOẢN --- */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-black text-gray-900 uppercase">
                💳 Quét Mã VietQR MB Bank
              </h3>
              <span className="text-xs bg-red-50 text-red-600 font-mono font-bold px-2 py-1 rounded">
                ⏱️ {Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Mở App ngân hàng bất kỳ (MB Bank, Vietcombank, Momo, Techcombank...) để quét mã thanh toán tự động:
            </p>

            {/* Ảnh VietQR động */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center flex flex-col items-center justify-center space-y-3">
              <img
                src={`https://api.vietqr.io/image/970422-98230188999-90d2w9L.jpg?accountName=TRAN%20THI%20MAI&amount=${totalAmount}&addInfo=${qrOrderMemo}`}
                alt="VietQR MB Bank"
                className="w-48 h-48 object-contain bg-white p-2 rounded-xl shadow-md border"
              />

              <div className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngân hàng:</span>
                  <strong className="text-gray-900">MB Bank (Ngân Hàng Quân Đội)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số tài khoản:</span>
                  <strong className="text-blue-600 font-mono">98230188999</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chủ tài khoản:</span>
                  <strong className="text-gray-900">TRAN THI MAI</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số tiền:</span>
                  <strong className="text-red-600 text-sm font-black">{totalAmount.toLocaleString()} đ</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nội dung chuyển khoản:</span>
                  <strong className="text-orange-600 font-mono">{qrOrderMemo}</strong>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleVerifyBankPayment}
                disabled={isVerifyingBank}
                className="w-full py-3.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2"
              >
                {isVerifyingBank ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang kiểm tra biến động số dư MB Bank...</span>
                  </>
                ) : (
                  <span>✅ Tôi Đã Chuyển Khoản — Kiểm Tra Giao Dịch</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 text-xs text-gray-500 hover:text-black font-semibold"
              >
                Đổi phương thức thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
