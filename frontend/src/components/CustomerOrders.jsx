import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingBagIcon,
  TruckIcon,
  ArrowLeftIcon,
  CheckIcon,
  ShieldCheckIcon,
  SearchIcon
} from './Icons';

function CustomerOrders({ onBackToHome, onNavigateProduct }) {
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchCode, setSearchCode] = useState('');

  // Modals state
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Đổi ý muốn chọn mẫu khác');
  const [isCancelling, setIsCancelling] = useState(false);

  const [editAddressOrder, setEditAddressOrder] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({
    customer_name: '',
    customer_phone: '',
    shipping_address: '',
    city: 'Hồ Chí Minh'
  });
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Tải danh sách đơn hàng của khách
  const loadOrders = async () => {
    setLoading(true);
    try {
      let res;
      if (isAuthenticated) {
        res = await orderAPI.getMyOrders();
      } else {
        // Fallback lấy toàn bộ đơn hàng và lọc hoặc hiển thị
        res = await orderAPI.getAllOrders();
      }

      if (res && res.data) {
        // Sắp xếp đơn mới nhất lên đầu
        const sorted = [...res.data].sort((a, b) => b.id - a.id);
        setOrders(sorted);
      }
    } catch (err) {
      console.warn('Lỗi tải đơn hàng cá nhân:', err);
      // Fallback mock orders nếu server chưa chạy
      setOrders([
        {
          id: 101,
          order_code: 'VB-89214',
          created_at: '2026-10-31',
          customer_name: user?.name || 'Khách hàng VibeBili',
          customer_phone: '0908889999',
          shipping_address: 'Tầng 4, Tòa nhà Landmark 81, 720A Điện Biên Phủ, P.22, Q. Bình Thạnh',
          city: 'Hồ Chí Minh',
          subtotal: 549000,
          shipping_fee: 0,
          voucher_discount: 100000,
          total_amount: 449000,
          payment_method: 'cod',
          payment_status: 'pending',
          status: 'Chờ xác nhận',
          carrier: 'GHN - Giao Hàng Nhanh',
          tracking_code: 'GHN-VB-102938',
          items: [
            {
              id: 1,
              product_id: 1,
              product_name: 'Tóc Giả Nữ Nguyên Đầu Xoăn Sóng Nước 60cm — Sợi Tơ Nhiệt Cao Cấp kèm Lưới Trùm',
              variant_title: 'Nâu Sô-cô-la / Size M / 60cm',
              price: 350000,
              quantity: 1,
              subtotal: 350000,
              image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80'
            },
            {
              id: 2,
              product_id: 3,
              product_name: 'Áo Baby Tee Y2K In Họa Tiết Vintage — Cotton Co Giãn 4 Chiều Form Ôm Dáng',
              variant_title: 'Trắng Vintage / Size M',
              price: 199000,
              quantity: 1,
              subtotal: 199000,
              image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80'
            }
          ]
        },
        {
          id: 98,
          order_code: 'VB-77123',
          created_at: '2026-10-27',
          customer_name: user?.name || 'Khách hàng VibeBili',
          customer_phone: '0908889999',
          shipping_address: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
          city: 'Hồ Chí Minh',
          subtotal: 580000,
          shipping_fee: 0,
          total_amount: 580000,
          payment_method: 'qr',
          payment_status: 'paid',
          status: 'Đang giao',
          carrier: 'GHTK - Giao Hàng Tiết Kiệm',
          tracking_code: 'GHTK-VB-556123',
          items: [
            {
              id: 3,
              product_id: 7,
              product_name: 'Áo Thun Nam Oversize Heavyweight Streetwear Cotton 250GSM Form Rộng Cực Đẹp',
              variant_title: 'Đen Washed / Size L',
              price: 290000,
              quantity: 2,
              subtotal: 580000,
              image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isAuthenticated]);

  // Bộ lọc theo Tab
  const filterOrders = () => {
    let list = [...orders];
    if (activeTab === 'pending') {
      list = list.filter(o => o.status === 'Chờ xác nhận');
    } else if (activeTab === 'preparing') {
      list = list.filter(o => o.status === 'Đang xử lý' || o.status === 'Đã hẹn bưu tá' || o.status === 'Đang chuẩn bị');
    } else if (activeTab === 'shipping') {
      list = list.filter(o => o.status === 'Đang giao');
    } else if (activeTab === 'completed') {
      list = list.filter(o => o.status === 'Đã giao' || o.status === 'Hoàn thành');
    } else if (activeTab === 'cancelled') {
      list = list.filter(o => o.status === 'Đã hủy');
    }

    if (searchCode.trim()) {
      const q = searchCode.trim().toLowerCase();
      list = list.filter(o =>
        (o.order_code && o.order_code.toLowerCase().includes(q)) ||
        (o.tracking_code && o.tracking_code.toLowerCase().includes(q)) ||
        (o.items && o.items.some(i => (i.product_name || i.name || '').toLowerCase().includes(q)))
      );
    }
    return list;
  };

  const filteredOrders = filterOrders();

  // Xử lý HỦY ĐƠN HÀNG (chỉ khi Chờ xác nhận)
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    try {
      await orderAPI.updateStatus(cancelModalOrder.id || cancelModalOrder.order_code, 'Đã hủy');
      showToast(`Đã hủy thành công đơn hàng #${cancelModalOrder.order_code}!`);
      // Cập nhật UI local
      setOrders(prev => prev.map(o =>
        (o.id === cancelModalOrder.id || o.order_code === cancelModalOrder.order_code)
          ? { ...o, status: 'Đã hủy', cancel_reason: cancelReason }
          : o
      ));
      setCancelModalOrder(null);
    } catch (err) {
      showToast(err.message || 'Không thể hủy đơn hàng!');
    } finally {
      setIsCancelling(false);
    }
  };

  // Mở modal ĐỔI ĐỊA CHỈ
  const handleOpenEditAddress = (order) => {
    setEditAddressOrder(order);
    setEditAddressForm({
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      shipping_address: order.shipping_address || '',
      city: order.city || 'Hồ Chí Minh'
    });
  };

  // Lưu ĐỔI ĐỊA CHỈ
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!editAddressOrder) return;
    setIsUpdatingAddress(true);
    try {
      await orderAPI.updateAddress(editAddressOrder.id || editAddressOrder.order_code, editAddressForm);
      showToast('Cập nhật địa chỉ nhận hàng thành công!');
      setOrders(prev => prev.map(o =>
        (o.id === editAddressOrder.id || o.order_code === editAddressOrder.order_code)
          ? { ...o, ...editAddressForm }
          : o
      ));
      setEditAddressOrder(null);
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật địa chỉ');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Mua lại đơn hàng
  const handleReorder = (order) => {
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        addToCart({
          id: item.product_id,
          name: item.product_name || item.name,
          price: item.price,
          main_image: item.image
        }, null, item.quantity || 1, {
          color: item.variant_title?.split('/')?.[0]?.trim() || 'Mặc định',
          size: item.variant_title?.split('/')?.[1]?.trim() || 'Tiêu chuẩn'
        });
      });
      showToast('Đã thêm toàn bộ sản phẩm của đơn hàng vào giỏ!');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Chờ xác nhận':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-extrabold px-3 py-1 rounded-full text-xs">⏳ Chờ xác nhận</span>;
      case 'Đang xử lý':
      case 'Đã hẹn bưu tá':
      case 'Đang chuẩn bị':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 font-extrabold px-3 py-1 rounded-full text-xs">📦 Đang chuẩn bị hàng</span>;
      case 'Đang giao':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 font-extrabold px-3 py-1 rounded-full text-xs">🚚 Đang giao hàng</span>;
      case 'Đã giao':
      case 'Hoàn thành':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-3 py-1 rounded-full text-xs">✅ Giao thành công</span>;
      case 'Đã hủy':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 font-extrabold px-3 py-1 rounded-full text-xs">❌ Đã hủy đơn</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 border border-gray-300 font-extrabold px-3 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast thông báo */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-black/90 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <button
            onClick={onBackToHome}
            className="inline-flex items-center space-x-1.5 text-xs text-gray-500 hover:text-black font-semibold mb-2"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Quay lại trang mua sắm</span>
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
            <span>🧾 Đơn Mua Của Tôi</span>
            <span className="text-sm font-normal text-gray-400 normal-case">
              ({orders.length} đơn hàng)
            </span>
          </h1>
        </div>

        {/* Thanh tìm kiếm theo mã đơn */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc sản phẩm..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full text-xs focus:outline-none focus:border-black bg-white"
          />
          <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Tabs lọc trạng thái chuẩn sàn TMĐT */}
      <div className="flex items-center space-x-1 sm:space-x-2 border-b border-gray-200 mt-4 overflow-x-auto no-scrollbar py-2 text-xs font-bold">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ xác nhận' },
          { key: 'preparing', label: 'Đang chuẩn bị' },
          { key: 'shipping', label: 'Đang giao' },
          { key: 'completed', label: 'Hoàn thành' },
          { key: 'cancelled', label: 'Đã hủy' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-full transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-black text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Danh sách đơn hàng */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang đồng bộ trạng thái đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm my-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            📦
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Chưa có đơn hàng nào ở mục này</h3>
          <p className="text-xs text-gray-500 mb-6">Bạn có thể dạo quanh sàn VibeBili để chọn mua những bộ tóc giả và outfit ưng ý nhất!</p>
          <button
            onClick={onBackToHome}
            className="bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase px-6 py-3 rounded-full transition"
          >
            Mua Sắm Ngay
          </button>
        </div>
      ) : (
        <div className="space-y-6 my-6">
          {filteredOrders.map(order => (
            <div
              key={order.id || order.order_code}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {/* Header của thẻ đơn hàng */}
              <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-black text-gray-900 text-sm">
                    Đơn hàng #{order.order_code || `VB-${order.id}`}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">Ngày đặt: {order.created_at || 'Hôm nay'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Thông tin vận chuyển & địa chỉ */}
              <div className="px-6 py-3.5 bg-neutral-50/50 border-b border-gray-100 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="font-bold text-gray-800">📍 Địa chỉ nhận:</span>
                  <span>
                    <strong className="text-gray-900">{order.customer_name}</strong> ({order.customer_phone}) — {order.shipping_address}, {order.city}
                  </span>
                </div>
                {order.tracking_code && (
                  <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-lg border border-gray-200 self-start md:self-auto">
                    <TruckIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mã vận đơn: <strong className="text-black font-mono">{order.tracking_code}</strong> ({order.carrier || 'GHN'})</span>
                  </div>
                )}
              </div>

              {/* Danh sách sản phẩm trong đơn */}
              <div className="divide-y divide-gray-100 px-6">
                {(order.items && order.items.length > 0 ? order.items : [
                  {
                    product_id: 1,
                    product_name: 'Sản phẩm thời trang VibeBili',
                    variant_title: 'Mặc định',
                    price: order.total_amount,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80'
                  }
                ]).map((item, idx) => (
                  <div
                    key={idx}
                    className="py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition rounded-xl px-2 -mx-2"
                    onClick={() => onNavigateProduct && onNavigateProduct(item.product_id || 1)}
                  >
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80'}
                        alt={item.product_name || item.name}
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200 bg-gray-100 flex-shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1 hover:text-orange-600 transition">
                          {item.product_name || item.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Phân loại: <span className="font-semibold text-gray-700">{item.variant_title || 'Mặc định'}</span>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Số lượng: x{item.quantity || 1}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-extrabold text-gray-900 block">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString()} đ
                      </span>
                      <span className="text-[10px] text-gray-400">
                        ({(item.price || 0).toLocaleString()} đ/sp)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tóm tắt tiền & Nút Hành Động */}
              <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs space-y-1">
                  <div className="text-gray-500 flex items-center space-x-2">
                    <span>Thanh toán:</span>
                    <span className="font-bold uppercase text-gray-800">
                      {order.payment_method === 'cod' ? '💵 Thanh toán khi nhận hàng (COD)' : '💳 Chuyển khoản VietQR'}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                  <div className="text-gray-900 font-extrabold text-sm pt-1">
                    Tổng số tiền: <span className="text-red-600 text-base font-black">{(order.total_amount || 0).toLocaleString()} đ</span>
                  </div>
                </div>

                {/* Các nút hành động nghiệp vụ */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Nếu đơn ở bước "Chờ xác nhận" -> Khách được HỦY ĐƠN & ĐỔI ĐỊA CHỈ */}
                  {order.status === 'Chờ xác nhận' && (
                    <>
                      <button
                        onClick={() => handleOpenEditAddress(order)}
                        className="px-4 py-2 border border-gray-300 hover:border-black rounded-full text-xs font-bold text-gray-800 hover:bg-white transition shadow-sm"
                      >
                        ✏️ Đổi Địa Chỉ
                      </button>
                      <button
                        onClick={() => setCancelModalOrder(order)}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-full text-xs font-bold transition shadow-sm"
                      >
                        ✕ Hủy Đơn Hàng
                      </button>
                    </>
                  )}

                  {/* Nếu đơn Đang giao -> Xem chi tiết vận chuyển */}
                  {order.status === 'Đang giao' && (
                    <button
                      onClick={() => showToast(`Đơn hàng đang trên đường giao bởi ${order.carrier || 'GHN'}. Dự kiến nhận hàng trong 24-48 giờ tới!`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition shadow-sm flex items-center space-x-1"
                    >
                      <TruckIcon className="w-3.5 h-3.5" />
                      <span>Theo Dõi Vận Chuyển</span>
                    </button>
                  )}

                  {/* Nút Mua Lại cho đơn đã hoàn thành hoặc đã hủy */}
                  {(order.status === 'Đã giao' || order.status === 'Hoàn thành' || order.status === 'Đã hủy') && (
                    <button
                      onClick={() => handleReorder(order)}
                      className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                    >
                      <ShoppingBagIcon className="w-3.5 h-3.5" />
                      <span>Mua Lại Đơn Này</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL HỦY ĐƠN HÀNG */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-black text-gray-900 mb-2">
              Xác Nhận Hủy Đơn Hàng #{cancelModalOrder.order_code}?
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Đơn hàng này đang ở trạng thái <strong>Chờ xác nhận</strong> nên bạn có thể hủy ngay lập tức mà không phát sinh phí phạt.
            </p>

            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Vui lòng cho VibeBili biết lý do hủy đơn:
            </label>
            <div className="space-y-2 mb-6">
              {[
                'Đổi ý muốn chọn mẫu khác / màu khác',
                'Quên áp dụng mã giảm giá voucher',
                'Muốn thay đổi phương thức thanh toán',
                'Tìm thấy sản phẩm giá tốt hơn',
                'Lý do khác'
              ].map(reason => (
                <label
                  key={reason}
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    cancelReason === reason ? 'border-black bg-gray-50 font-bold' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="accent-black"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Giữ Lại Đơn
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-lg disabled:opacity-50"
              >
                {isCancelling ? 'Đang hủy...' : 'Xác Nhận Hủy Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI ĐỊA CHỈ NHẬN HÀNG */}
      {editAddressOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-gray-900">
                Đổi Địa Chỉ Nhận Hàng (#{editAddressOrder.order_code})
              </h3>
              <button
                onClick={() => setEditAddressOrder(null)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Bưu tá sẽ giao đến địa chỉ mới này khi đơn hàng được gửi đi.
            </p>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên người nhận</label>
                  <input
                    type="text"
                    required
                    value={editAddressForm.customer_name}
                    onChange={(e) => setEditAddressForm({ ...editAddressForm, customer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    required
                    value={editAddressForm.customer_phone}
                    onChange={(e) => setEditAddressForm({ ...editAddressForm, customer_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ chi tiết (Số nhà, tên đường, phường/xã)</label>
                <input
                  type="text"
                  required
                  value={editAddressForm.shipping_address}
                  onChange={(e) => setEditAddressForm({ ...editAddressForm, shipping_address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tỉnh / Thành phố</label>
                <select
                  value={editAddressForm.city}
                  onChange={(e) => setEditAddressForm({ ...editAddressForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-black bg-white"
                >
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditAddressOrder(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAddress}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-black hover:bg-neutral-800 text-white transition shadow-lg disabled:opacity-50"
                >
                  {isUpdatingAddress ? 'Đang lưu...' : 'Lưu Địa Chỉ Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerOrders;
