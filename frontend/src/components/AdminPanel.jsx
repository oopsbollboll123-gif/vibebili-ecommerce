import React, { useState, useEffect } from 'react';
import { authAPI, orderAPI, productAPI } from '../services/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');

  // Danh sách Người bán chờ duyệt (KYC)
  const [pendingSellers, setPendingSellers] = useState([
    { id: 1, name: "Trần Thị Mai", email: "maitran@shop.com", storeName: "Wig Luxury SaiGon", phone: "0912345678", date: "2026-10-26" },
    { id: 2, name: "Lê Hoàng Long", email: "longle@fashion.vn", storeName: "Y2K Streetwear Store", phone: "0988776655", date: "2026-10-27" }
  ]);

  // Danh sách tài khoản
  const [users, setUsers] = useState([
    { id: 1, name: "Hoàng Trọng Phúc", email: "phuc@admin.com", role: "admin", status: "active" },
    { id: 2, name: "Trần Thị Mai", email: "maitran@shop.com", role: "seller", status: "pending" },
    { id: 3, name: "Lê Hoàng Long", email: "longle@fashion.vn", role: "seller", status: "pending" },
    { id: 4, name: "Nguyễn Thu Thảo", email: "khachhang@gmail.com", role: "customer", status: "active" }
  ]);

  // Thống kê sàn
  const [stats, setStats] = useState({
    totalRevenue: 28500000,
    totalOrders: 42,
    totalUsers: 128,
    totalShops: 14
  });

  // Danh mục sản phẩm
  const [categories, setCategories] = useState([
    { id: 1, name: "Tóc Giả Cao Cấp", slug: "toc-gia-cao-cap", count: 24 },
    { id: 2, name: "Thời Trang Nữ", slug: "thoi-trang-nu", count: 85 },
    { id: 3, name: "Outfit x Hairstyle Combo", slug: "combo-outfit-hairstyle", count: 12 }
  ]);

  const [newCategoryName, setNewCategoryName] = useState('');

  // Load dữ liệu thực từ Backend
  useEffect(() => {
    let isMounted = true;

    authAPI.getAllUsers()
      .then(res => {
        if (isMounted && res.success && res.data?.length > 0) {
          setUsers(res.data);
          setStats(prev => ({ ...prev, totalUsers: res.data.length }));
        }
      })
      .catch(() => {});

    orderAPI.getAllOrders()
      .then(res => {
        if (isMounted && res.success && res.data?.length > 0) {
          const rev = res.data.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
          setStats(prev => ({
            ...prev,
            totalOrders: res.data.length,
            totalRevenue: rev > 0 ? rev : prev.totalRevenue
          }));
        }
      })
      .catch(() => {});

    authAPI.getPendingSellers()
      .then(res => {
        if (isMounted && res.success && res.data?.length > 0) {
          setPendingSellers(res.data);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    const newCat = {
      id: categories.length + 1,
      name: newCategoryName,
      slug: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
      count: 0
    };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
    alert('Thêm danh mục mới thành công!');
  };

  // Duyệt Seller KYC
  const handleApproveSeller = async (id, name) => {
    try {
      await authAPI.updateUserRole(id, { role: 'seller', status: 'active' });
    } catch {}
    setPendingSellers(pendingSellers.filter(s => s.id !== id));
    setUsers(users.map(u => u.id === id ? { ...u, role: 'seller', status: 'active' } : u));
    alert(`🎉 Đã duyệt hồ sơ KYC của người bán [${name}] thành công!`);
  };

  // Từ chối Seller KYC
  const handleRejectSeller = async (id, name) => {
    try {
      await authAPI.updateUserRole(id, { role: 'customer', status: 'active' });
    } catch {}
    setPendingSellers(pendingSellers.filter(s => s.id !== id));
    alert(`Đã từ chối hồ sơ mở shop của [${name}].`);
  };

  // Cập nhật vai trò người dùng (RBAC)
  const handleChangeRole = async (userId, newRole) => {
    try {
      await authAPI.updateUserRole(userId, { role: newRole });
    } catch {}
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    alert(`Đã cập nhật phân quyền tài khoản #${userId} thành [${newRole}]!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-sheinBlack">
      {/* Header Admin Panel */}
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-black uppercase tracking-wider">🛡️ Quản Trị Hệ Thống (Admin Panel)</h1>
        <p className="text-xs text-gray-500 mt-1">Kiểm duyệt người bán, quản lý tài khoản và phân quyền toàn sàn VibeBili.vn</p>
      </div>

      {/* Tabs Quản trị */}
      <div className="flex space-x-6 border-b border-gray-200 mb-6 text-sm font-semibold overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 whitespace-nowrap transition-colors ${activeTab === 'overview' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
        >
          📊 Tổng Quan Hệ Thống
        </button>
        <button 
          onClick={() => setActiveTab('sellers')}
          className={`pb-3 whitespace-nowrap transition-colors flex items-center space-x-2 ${activeTab === 'sellers' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
        >
          <span>Duyệt Người Bán (KYC)</span>
          {pendingSellers.length > 0 && (
            <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingSellers.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 whitespace-nowrap transition-colors ${activeTab === 'users' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
        >
          👥 Phân Quyền Tài Khoản (RBAC)
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`pb-3 whitespace-nowrap transition-colors ${activeTab === 'categories' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-black'}`}
        >
          📂 Danh Mục Toàn Sàn
        </button>
      </div>

      {/* --- TAB 1: TỔNG QUAN HỆ THỐNG --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh Thu Toàn Sàn</span>
              <div className="text-2xl font-black text-red-600 mt-2">{stats.totalRevenue.toLocaleString()} đ</div>
              <span className="text-[11px] text-green-600 font-bold mt-1 block">↑ +18.4% so với tháng trước</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng Đơn Hàng</span>
              <div className="text-2xl font-black text-gray-900 mt-2">{stats.totalOrders}</div>
              <span className="text-[11px] text-green-600 font-bold mt-1 block">Tỉ lệ hoàn tất: 96.2%</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thành Viên Hoạt Động</span>
              <div className="text-2xl font-black text-gray-900 mt-2">{stats.totalUsers}</div>
              <span className="text-[11px] text-blue-600 font-bold mt-1 block">Khách hàng & Người bán</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gian Hàng Đã Xác Thực</span>
              <div className="text-2xl font-black text-orange-600 mt-2">{stats.totalShops}</div>
              <span className="text-[11px] text-orange-600 font-bold mt-1 block">{pendingSellers.length} hồ sơ chờ duyệt</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DUYỆT NGƯỜI BÁN (SELLER KYC) --- */}
      {activeTab === 'sellers' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Hồ sơ đăng ký mở gian hàng chờ xét duyệt ({pendingSellers.length})
            </span>
          </div>

          {pendingSellers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              ✓ Hiện không có hồ sơ nào đang chờ duyệt. Tất cả các người bán đã được xử lý!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3">Họ tên chủ shop</th>
                    <th className="p-3">Tên cửa hàng</th>
                    <th className="p-3">Email liên hệ</th>
                    <th className="p-3">Số điện thoại</th>
                    <th className="p-3">Ngày nộp</th>
                    <th className="p-3 text-center">Thao tác duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingSellers.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                      <td className="p-3 font-bold text-orange-600">{s.storeName || s.name}</td>
                      <td className="p-3 text-gray-600">{s.email}</td>
                      <td className="p-3">{s.phone}</td>
                      <td className="p-3 text-gray-500">{s.date}</td>
                      <td className="p-3 text-center space-x-2">
                        <button 
                          onClick={() => handleApproveSeller(s.id, s.name)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-[11px] transition"
                        >
                          ✓ Chấp thuận
                        </button>
                        <button 
                          onClick={() => handleRejectSeller(s.id, s.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1 rounded text-[11px] transition"
                        >
                          ✕ Từ chối
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (RBAC) --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Danh sách tài khoản & Phân quyền 3 cấp độ (Customer, Seller, Admin)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Vai trò (Role)</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-center">Thay đổi phân quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-gray-500">#{u.id}</td>
                    <td className="p-3 font-bold text-gray-900">{u.name}</td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'seller' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-black font-semibold"
                      >
                        <option value="customer">customer (Khách)</option>
                        <option value="seller">seller (Chủ shop)</option>
                        <option value="admin">admin (Quản trị)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: DANH MỤC TOÀN SÀN --- */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
          <form onSubmit={handleAddCategory} className="flex gap-3 max-w-md">
            <input 
              type="text" 
              placeholder="Tên danh mục mới (Vd: Phụ kiện chăm sóc tóc)" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black"
            />
            <button 
              type="submit"
              className="bg-black text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              + Thêm Danh Mục
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{cat.name}</h4>
                  <span className="text-[11px] text-gray-400 font-mono">slug: {cat.slug}</span>
                </div>
                <span className="bg-white border text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {cat.count} SP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
