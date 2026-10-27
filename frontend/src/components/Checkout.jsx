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
  ArrowLeftIcon
} from './Icons';

function Checkout({ onBackToHome }) {
  const { cartItems, subtotal, shippingFee, totalAmount, clearCart } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.name || 'Hoàng Trọng Phúc',
    phone: user?.phone || '0909123456',
    address: user?.address || 'Khu phố 6, Linh Trung, TP. Thủ Đức',
    city: 'Hồ Chí Minh',
    note: 'Giao giờ hành chính giúp em nhé.'
  });

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

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Giỏ hàng của bạn đang trống! Hãy chọn sản phẩm trước khi thanh toán.');
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address) {
      alert('Vui lòng điền đầy đủ các mục Họ tên, Số điện thoại và Địa chỉ giao hàng!');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer_name: formData.fullName,
        customer_phone: formData.phone,
        shipping_address: formData.address,
        city: formData.city,
        note: formData.note,
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.name,
          variant_title: item.variant_title,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const res = await orderAPI.createOrder(orderPayload);
      if (res.success) {
        clearCart();
        setOrderCompleted({
          code: res.data?.orderCode || 'WIG-' + Math.floor(100000 + Math.random() * 900000),
          total: totalAmount,
          method: paymentMethod,
          name: formData.fullName,
          phone: formData.phone,
          address: `${formData.address}, ${formData.city}`
        });
      }
    } catch (err) {
      alert('⚠️ ' + (err.message || 'Lỗi khi gửi đơn hàng lên máy chủ!'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Màn hình thông báo đặt hàng thành công
  if (orderCompleted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckIcon className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900">
            Đặt Hàng Thành Công!
          </h1>
          <p className="text-sm text-gray-600">
            Cảm ơn bạn đã tin tưởng mua sắm tại sàn TMĐT <span className="font-bold text-orange-600">VibeBili.vn</span> ("Biến hóa mỗi ngày, trọn vẹn phong cách"). Đơn hàng của bạn đã được tiếp nhận và xử lý kho tự động.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left text-xs space-y-2.5 max-w-lg mx-auto">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Mã đơn hàng:</span>
              <span className="font-extrabold text-black font-mono text-sm">{orderCompleted.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Người nhận:</span>
              <span className="font-semibold text-gray-800">{orderCompleted.name} ({orderCompleted.phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Địa chỉ giao:</span>
              <span className="font-semibold text-gray-800">{orderCompleted.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hình thức thanh toán:</span>
              <span className="font-bold uppercase text-orange-600">
                {orderCompleted.method === 'cod' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Quét mã VietQR / Chuyển khoản'}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
              <span className="font-bold text-gray-800">Tổng thanh toán:</span>
              <span className="font-black text-red-600 text-base">{orderCompleted.total.toLocaleString()} đ</span>
            </div>
          </div>

          {orderCompleted.method === 'qr' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 max-w-sm mx-auto text-center space-y-2">
              <p className="text-xs font-bold text-orange-800 uppercase flex items-center justify-center space-x-1">
                <QrCodeIcon className="w-4 h-4 text-orange-700" />
                <span>Mã VietQR Thanh Toán Nhanh 24/7:</span>
              </p>
              <img 
                src={`https://api.vietqr.io/image/970422-0909123456-compact2.jpg?amount=${orderCompleted.total}&addInfo=${orderCompleted.code}`}
                alt="VietQR MBBank" 
                className="w-48 h-48 mx-auto rounded-lg border border-orange-300 shadow-sm"
              />
              <p className="text-[11px] text-gray-600 font-medium">Ngân hàng MB Bank • STK: 0909123456 • VibeBili.vn Store</p>
            </div>
          )}

          <div className="pt-4 flex justify-center space-x-4">
            <button
              onClick={onBackToHome}
              className="bg-black text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition shadow-lg min-h-[44px]"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu giỏ hàng trống
  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <ShoppingBagIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold uppercase">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-gray-500">Vui lòng quay lại chọn sản phẩm yêu thích trước khi tiến hành thanh toán!</p>
        <button
          onClick={onBackToHome}
          className="bg-black text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition min-h-[44px]"
        >
          Quay lại Trang Chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900">
      {/* Tiêu đề trang */}
      <div className="mb-8 border-b border-gray-200 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider">Thanh Toán Đơn Hàng</h1>
          <p className="text-xs text-gray-500 mt-1">Hoàn tất thông tin giao hàng để nhận ưu đãi vận chuyển từ VibeBili.vn</p>
        </div>
        <button onClick={onBackToHome} className="text-xs text-gray-500 hover:text-black flex items-center space-x-1 font-medium">
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Quay lại mua sắm</span>
        </button>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* CỘT TRÁI (7 phần): Thông tin giao hàng & Phương thức thanh toán */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Phần 1: Địa chỉ nhận hàng */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-1.5 text-gray-900">
              <TruckIcon className="w-4 h-4 text-orange-600" />
              <span>1. Thông Tin Giao Hàng</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên người nhận (*)</label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập họ và tên"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại (*)</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="09xx xxx xxx"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, tên đường, phường/xã) (*)</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Ví dụ: 120 Cách Mạng Tháng 8, P.10"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                <select 
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black transition"
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
              <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú giao hàng</label>
              <input 
                type="text" 
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Giao giờ hành chính, gọi trước khi giao..."
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black transition"
              />
            </div>
          </div>

          {/* Phần 2: Phương thức thanh toán */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-1.5 text-gray-900">
              <CreditCardIcon className="w-4 h-4 text-orange-600" />
              <span>2. Phương Thức Thanh Toán</span>
            </h2>

            <div className="space-y-3">
              <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
                paymentMethod === 'cod' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
              }`}>
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
                    <span className="text-sm font-bold block text-gray-900">Thanh toán tiền mặt khi nhận hàng (COD)</span>
                    <span className="text-xs text-gray-500">Được kiểm tra hàng trước khi thanh toán cho nhân viên giao nhận</span>
                  </div>
                </div>
                <TruckIcon className="w-5 h-5 text-gray-600" />
              </label>

              <label className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
                paymentMethod === 'qr' ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'
              }`}>
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
                    <span className="text-sm font-bold block text-gray-900">Quét mã QR VietQR / Chuyển khoản MB Bank</span>
                    <span className="text-xs text-gray-500">Tự động điền nội dung và số tiền, xác nhận nhanh 24/7</span>
                  </div>
                </div>
                <QrCodeIcon className="w-5 h-5 text-gray-600" />
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5 phần): Tóm tắt đơn hàng & Nút Xác Nhận */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-28 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-3 flex items-center space-x-1.5">
              <ShoppingBagIcon className="w-4 h-4" />
              <span>Tóm Tắt Đơn Hàng ({cartItems.reduce((a, b) => a + b.quantity, 0)})</span>
            </h2>

            {/* Danh sách món */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2.5">
                  <div className="flex items-center space-x-3">
                    <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-lg border" />
                    <div className="max-w-[170px]">
                      <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-gray-400 text-[11px] truncate">{item.variant_title || 'Tiêu chuẩn'}</p>
                      <span className="text-gray-500">x{item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">
                    {(item.price * item.quantity).toLocaleString()} đ
                  </span>
                </div>
              ))}
            </div>

            {/* Chi tiết tính tiền */}
            <div className="space-y-2 text-xs border-t border-gray-200 pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-900">{subtotal.toLocaleString()} đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển:</span>
                <span className={shippingFee === 0 ? 'text-green-600 font-bold' : 'font-semibold text-gray-900'}>
                  {shippingFee === 0 ? 'MIỄN PHÍ' : `${shippingFee.toLocaleString()} đ`}
                </span>
              </div>
              {subtotal < 500000 && (
                <p className="text-[11px] text-orange-600 font-medium">
                  💡 Mẹo: Mua thêm {(500000 - subtotal).toLocaleString()} đ để được MIỄN PHÍ SHIP!
                </p>
              )}
              <div className="flex justify-between text-base font-extrabold text-gray-900 border-t border-gray-200 pt-3">
                <span>Tổng cộng:</span>
                <span className="text-red-600 text-xl font-black">{totalAmount.toLocaleString()} đ</span>
              </div>
            </div>

            {/* Nút Đặt hàng */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white font-black py-4 rounded-full hover:bg-neutral-800 transition disabled:opacity-50 uppercase tracking-wider text-xs shadow-xl min-h-[44px] flex items-center justify-center space-x-2 focus-visible:ring-2 focus-visible:ring-black"
            >
              <span>{isSubmitting ? 'Đang gửi đơn hàng...' : `Xác Nhận Đặt Hàng (${totalAmount.toLocaleString()} đ)`}</span>
            </button>

            <p className="text-[11px] text-center text-gray-400">
              Bằng việc bấm xác nhận, bạn đồng ý với Điều khoản mua hàng & Bảo hành của VibeBili.vn
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}

export default Checkout;
