import React, { useState, useEffect } from 'react';
import { productAPI, orderAPI } from '../services/api';

function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state cho sản phẩm mới
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Tóc Giả Cao Cấp',
    price: '',
    stock: '',
    color: 'Nâu Sô-cô-la',
    size: 'M (54-58cm)',
    hairLength: '60cm',
    description: ''
  });

  // Danh sách sản phẩm của Shop
  const [products, setProducts] = useState([
    { id: 1, name: "Tóc giả nữ nguyên đầu xoăn sóng nước 60cm", category: "Tóc Giả Cao Cấp", price: 350000, stock: 45, status: "Đang bán" },
    { id: 2, name: "Tóc giả Bob ngắn uốn cụp Hàn Quốc", category: "Tóc Giả Cao Cấp", price: 280000, stock: 50, status: "Đang bán" },
    { id: 3, name: "Áo thun croptop Y2K Cyberpunk", category: "Thời Trang Nữ", price: 169000, stock: 120, status: "Đang bán" },
    { id: 4, name: "Đầm tiểu thư vải dạ tweed dáng dài", category: "Thời Trang Nữ", price: 420000, stock: 25, status: "Đang bán" }
  ]);

  // Danh sách đơn hàng
  const [orders, setOrders] = useState([
    { id: "WIG-849201", customer_name: "Nguyễn Thu Thảo", customer_phone: "0933112233", total_amount: 380000, status: "Chờ xác nhận", created_at: "2026-10-27" },
    { id: "WIG-849195", customer_name: "Trần Minh Tuấn", customer_phone: "0918111222", total_amount: 550000, status: "Đang giao", created_at: "2026-10-26" }
  ]);

  // Load dữ liệu thực từ Backend
  useEffect(() => {
    let isMounted = true;
    productAPI.getAll()
      .then(res => {
        if (isMounted && res.success && res.data?.length > 0) {
          setProducts(res.data.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category_name || 'Tóc Giả Cao Cấp',
            price: Number(p.price || 299000),
            stock: p.variants?.[0]?.stock || 35,
            status: "Đang bán"
          })));
        }
      })
      .catch(() => {});

    orderAPI.getAllOrders()
      .then(res => {
        if (isMounted && res.success && res.data?.length > 0) {
          setOrders(res.data.map(o => ({
            id: o.order_code || `WIG-${o.id}`,
            realId: o.id,
            customer_name: o.customer_name || 'Khách hàng',
            customer_phone: o.customer_phone || '0909000000',
            total_amount: Number(o.total_amount || 0),
            status: o.status || 'Chờ xác nhận',
            created_at: o.created_at ? new Date(o.created_at).toLocaleDateString() : '2026-10-27'
          })));
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Xử lý thêm sản phẩm
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert('Vui lòng nhập tên và giá sản phẩm!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: newProduct.name,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 20),
        category_id: newProduct.category === 'Tóc Giả Cao Cấp' ? 1 : 2,
        description: newProduct.description,
        options: [
          { name: 'Màu sắc', values: [newProduct.color] },
          { name: 'Kích cỡ', values: [newProduct.size] }
        ]
      };

      await productAPI.create(payload);

      const created = {
        id: products.length + 1,
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 20),
        status: "Đang bán"
      };

      setProducts([created, ...products]);
      setIsAddModalOpen(false);
      setNewProduct({ name: '', category: 'Tóc Giả Cao Cấp', price: '', stock: '', color: 'Nâu Sô-cô-la', size: 'M (54-58cm)', hairLength: '60cm', description: '' });
      alert('🎉 Đăng bán sản phẩm mới thành công lên hệ thống VibeBili.vn!');
    } catch (err) {
      alert('⚠️ ' + (err.message || 'Lỗi khi thêm sản phẩm!'));
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      alert(`Đã cập nhật đơn hàng ${orderId} sang trạng thái: "${newStatus}"!`);
    } catch (err) {
      // Cập nhật optimistic
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-sheinBlack">
      {/* Header Seller Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black uppercase tracking-wider">🏪 Kênh Người Bán (Seller Dashboard)</h1>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Đã xác thực KYC</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Quản lý gian hàng, sản phẩm đa biến thể và đơn hàng tập trung tại VibeBili.vn</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="mt-4 md:mt-0 bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors shadow"
        >
          + Đăng Sản Phẩm Mới
        </button>
      </div>

      {/* Tabs chuyển đổi */}
      <div className="flex space-x-6 border-b border-gray-200 mb-6 text-sm font-semibold">
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors ${activeTab === 'products' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
        >
          Quản Lý Sản Phẩm ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition-colors ${activeTab === 'orders' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
        >
          Quản Lý Đơn Hàng ({orders.length})
        </button>
      </div>

      {/* --- TAB 1: QUẢN LÝ SẢN PHẨM --- */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Danh sách SKU sản phẩm</span>
            <input type="text" placeholder="Tìm kiếm sản phẩm..." className="border border-gray-300 rounded px-3 py-1.5 text-xs w-64 focus:outline-none" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Tên sản phẩm</th>
                  <th className="p-3">Danh mục</th>
                  <th className="p-3">Giá bán</th>
                  <th className="p-3">Tồn kho SKU</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold">#PROD-{p.id}</td>
                    <td className="p-3 font-medium text-black max-w-xs truncate">{p.name}</td>
                    <td className="p-3">{p.category}</td>
                    <td className="p-3 font-bold text-red-600">{p.price.toLocaleString()} đ</td>
                    <td className="p-3 font-semibold text-gray-800">{p.stock}</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold text-[10px]">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button 
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa sản phẩm #${p.id}?`)) {
                            productAPI.delete(p.id).catch(() => {});
                            setProducts(products.filter(item => item.id !== p.id));
                          }
                        }}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: QUẢN LÝ ĐƠN HÀNG --- */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Đơn hàng của Shop</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Số điện thoại</th>
                  <th className="p-3">Tổng tiền</th>
                  <th className="p-3">Ngày đặt</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-center">Xử lý đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold">{o.id}</td>
                    <td className="p-3 font-semibold text-gray-800">{o.customer_name}</td>
                    <td className="p-3">{o.customer_phone}</td>
                    <td className="p-3 font-black text-red-600">{o.total_amount.toLocaleString()} đ</td>
                    <td className="p-3 text-gray-500">{o.created_at}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        o.status === 'Chờ xác nhận' ? 'bg-yellow-100 text-yellow-800' :
                        o.status === 'Đang giao' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <select 
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-black font-medium"
                      >
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Đang giao">Đang giao</option>
                        <option value="Đã giao">Đã giao</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THÊM SẢN PHẨM MỚI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black uppercase tracking-wider mb-4 border-b pb-2">Đăng Bán Sản Phẩm Mới</h2>
            
            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tên sản phẩm (*)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Tóc giả xoăn sóng nước 60cm"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Danh mục</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="Tóc Giả Cao Cấp">Tóc Giả Cao Cấp</option>
                    <option value="Thời Trang Nữ">Thời Trang Nữ</option>
                    <option value="Outfit x Hairstyle Combo">Outfit x Hairstyle Combo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá bán (VNĐ) (*)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="350000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tồn kho SKU</label>
                  <input 
                    type="number" 
                    placeholder="50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Màu sắc</label>
                  <input 
                    type="text" 
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Size / Chu vi đầu</label>
                  <input 
                    type="text" 
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô tả sản phẩm</label>
                <textarea 
                  rows="3"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Mô tả sợi tơ, chất liệu vải, khả năng chịu nhiệt..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-full text-xs font-bold hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 uppercase tracking-wider"
                >
                  {loading ? 'Đang lưu...' : 'Lưu & Đăng bán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
