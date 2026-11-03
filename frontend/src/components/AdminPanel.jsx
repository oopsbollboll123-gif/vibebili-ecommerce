import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, orderAPI, productAPI, serviceAPI } from '../services/api';
import {
  ShieldCheckIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
  PlusIcon,
  StoreIcon,
  TruckIcon
} from './Icons';

function AdminPanel({ onNavigateHome, onNavigateLogin }) {
  const {
    user,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isModerator,
    isFinancial,
    isSupport,
    logout
  } = useAuth();

  // Xác định sub-role thực tế của Admin hiện tại
  const currentAdminRole = user?.role || 'admin';
  const roleIsSuperAdmin = isSuperAdmin || currentAdminRole === 'admin' || currentAdminRole === 'superadmin' || currentAdminRole === 'admin-superadmin';
  const roleIsModerator = isModerator || currentAdminRole === 'admin-moderator' || roleIsSuperAdmin;
  const roleIsFinancial = isFinancial || currentAdminRole === 'admin-financial' || roleIsSuperAdmin;
  const roleIsSupport = isSupport || currentAdminRole === 'admin-support' || roleIsSuperAdmin;

  // Active Tab: overview | superadmin | moderation | finance | support | users | categories
  const [activeTab, setActiveTab] = useState(() => {
    if (currentAdminRole === 'admin-moderator') return 'moderation';
    if (currentAdminRole === 'admin-financial') return 'finance';
    if (currentAdminRole === 'admin-support') return 'support';
    return 'overview';
  });

  // Moderation Sub-Tab: 'products' | 'sellers' | 'ban_users'
  const [modSubTab, setModSubTab] = useState('products');

  // ==========================================
  // STATE DỮ LIỆU TOÀN DIỆN CHO ADMIN
  // ==========================================

  // 1. Thống kê tổng quan sàn
  const [stats, setStats] = useState({
    totalRevenue: 28500000,
    platformFeeRate: 0.05, // 5% hoa hồng sàn
    totalOrders: 42,
    totalUsers: 128,
    totalShops: 14,
    pendingProductsCount: 3,
    pendingComplaintsCount: 2
  });

  // 2. Danh sách tài khoản người dùng
  const [users, setUsers] = useState([
    { id: 1, name: "Hoàng Trọng Phúc", email: "superadmin@admin.com", role: "admin-superadmin", status: "active", phone: "0909123456", date: "2026-10-01" },
    { id: 5, name: "Lê Minh Tuấn", email: "moderator@admin.com", role: "admin-moderator", status: "active", phone: "0918889999", date: "2026-10-15" },
    { id: 6, name: "Phạm Thanh Hà", email: "financial@admin.com", role: "admin-financial", status: "active", phone: "0934567890", date: "2026-10-20" },
    { id: 7, name: "Vũ Bảo Ngọc", email: "support@admin.com", role: "admin-support", status: "active", phone: "0945678901", date: "2026-10-22" },
    { id: 2, name: "Trần Thị Mai (Wig Luxury)", email: "maitran@shop.com", role: "seller", status: "active", phone: "0912345678", date: "2026-10-26" },
    { id: 3, name: "Lê Hoàng Long (Y2K Store)", email: "longle@fashion.vn", role: "seller", status: "active", phone: "0988776655", date: "2026-10-27" },
    { id: 4, name: "Nguyễn Thu Thảo", email: "khachhang@gmail.com", role: "customer", status: "active", phone: "0933112233", date: "2026-10-28" }
  ]);

  // 3. Danh sách sản phẩm chờ kiểm duyệt (Product Moderation)
  const [pendingProducts, setPendingProducts] = useState([
    {
      id: 101,
      seller_id: 2,
      seller_name: "Wig Luxury Sài Gòn",
      name: "Tóc Giả Ombre Khói Xanh Pastel 70cm Nữ Hoàng - Sợi Tơ Nhiệt Cao Cấp",
      category_name: "Tóc Giả Cao Cấp",
      price: 490000,
      original_price: 650000,
      main_image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
      stock: 50,
      sku: "WIG-OMB-BLU-70",
      description: "Tóc giả lượn sóng chịu nhiệt cao đến 180 độ C, phối màu ombre khói xanh pastel xu hướng.",
      submitted_date: "2026-11-02 14:30"
    },
    {
      id: 102,
      seller_id: 3,
      seller_name: "Y2K Streetwear Boutique",
      name: "Áo Thun Unisex Cyberpunk Graphic Acid Wash Form Boxy",
      category_name: "Thời Trang Nam",
      price: 295000,
      original_price: 420000,
      main_image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
      stock: 120,
      sku: "TSHIRT-CYBER-BLK",
      description: "Áo thun cotton 260GSM định lượng cao, hiệu ứng wash rách nhẹ phong cách Cyberpunk Y2K.",
      submitted_date: "2026-11-02 16:15"
    },
    {
      id: 103,
      seller_id: 2,
      seller_name: "Wig Luxury Sài Gòn",
      name: "Combo Dạ Tiệc: Tóc Bob Bạch Kim x Váy Bodycon Cúp Ngực Tôn Dáng",
      category_name: "Outfit x Hairstyle Combo",
      price: 799000,
      original_price: 1150000,
      main_image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      stock: 25,
      sku: "COMBO-BOB-WHITE",
      description: "Set phối sẵn giữa tóc giả Bob bạch kim cá tính và đầm bodycon sang chảnh dạ tiệc.",
      submitted_date: "2026-11-03 09:10"
    }
  ]);

  // 4. Danh sách Người bán chờ duyệt KYC
  const [pendingSellers, setPendingSellers] = useState([
    { id: 11, name: "Ngô Quốc Bảo", email: "baongo@wigviet.com", storeName: "Vibe Hair Studio Q1", phone: "0903334455", date: "2026-11-02" },
    { id: 12, name: "Phan Yến Nhi", email: "yennhi@kfashion.vn", storeName: "K-Trend Chic Wardrobe", phone: "0977665544", date: "2026-11-03" }
  ]);

  // 5. Danh sách Khiếu nại Khách hàng (Admin CSKH)
  const [complaints, setComplaints] = useState([
    {
      id: "KN-9021",
      customer_name: "Nguyễn Thu Thảo",
      customer_phone: "0933112233",
      customer_email: "khachhang@gmail.com",
      order_id: "ORD-99120",
      seller_name: "Wig Luxury Sài Gòn",
      type: "Hàng sai mô tả / Hỗ trợ đổi size",
      content: "Mình đặt tóc giả màu Nâu Sô-cô-la nhưng shop đóng gói màu Đen Tự Nhiên. Nhờ sàn hỗ trợ liên hệ shop đổi lại đúng màu giúp mình nhé!",
      created_at: "2026-11-01 10:20",
      status: "pending",
      resolution_note: ""
    },
    {
      id: "KN-8842",
      customer_name: "Đặng Tuấn Anh",
      customer_phone: "0908765432",
      customer_email: "tuananh@gmail.com",
      order_id: "ORD-87102",
      seller_name: "Y2K Streetwear Boutique",
      type: "Vận chuyển giao trễ / Hư hỏng vỏ hộp",
      content: "Đơn hàng đã hơn 4 ngày chưa thấy GHN phát hàng, hộp hàng bị móp một góc khi bưu tá mang tới. Đề nghị kiểm tra tiến độ giao.",
      created_at: "2026-10-31 15:45",
      status: "in_progress",
      resolution_note: "Đã liên hệ điều phối GHN hối giao gấp trong chiều nay và bù voucher 30k"
    },
    {
      id: "KN-7719",
      customer_name: "Trần Mai Lan",
      customer_phone: "0912987654",
      customer_email: "mailan@yahoo.com",
      order_id: "ORD-76510",
      seller_name: "Wig Luxury Sài Gòn",
      type: "Yêu cầu hoàn tiền dịch vụ Spa tóc",
      content: "Yêu cầu hoàn tiền vì thời gian xử lý phục hồi tóc lâu hơn 2 ngày so với cam kết ban đầu.",
      created_at: "2026-10-28 09:15",
      status: "resolved",
      resolution_note: "Đã hoàn trả 150.000đ vào ví và tặng kèm 01 chai xịt dưỡng tóc tơ lụa cao cấp."
    }
  ]);

  // 6. Danh sách Voucher & Đợt Sale (Admin Financial)
  const [vouchers, setVouchers] = useState([
    {
      id: 1,
      code: "VIBENEW100",
      campaign_name: "Chào Mừng Thành Viên Mới 2026",
      discount_type: "fixed",
      discount_value: 100000,
      discount_percent: 0,
      min_order_value: 300000,
      max_discount: 100000,
      total_usage_limit: 1000,
      per_user_limit: 1,
      target_platform: "Toàn Sàn VibeBili.vn",
      used_count: 142,
      start_date: "2026-10-01",
      end_date: "2026-12-31",
      status: "active"
    },
    {
      id: 2,
      code: "VIBEWIG20",
      campaign_name: "Siêu Lễ Hội Tóc Xinh VibeWig",
      discount_type: "percent",
      discount_value: 20,
      discount_percent: 20,
      min_order_value: 400000,
      max_discount: 100000,
      total_usage_limit: 500,
      per_user_limit: 2,
      target_platform: "Ngành Tóc Giả Cao Cấp",
      used_count: 88,
      start_date: "2026-10-20",
      end_date: "2026-11-20",
      status: "active"
    },
    {
      id: 3,
      code: "FREESHIP50K",
      campaign_name: "Trợ Giá Vận Chuyển Toàn Quốc",
      discount_type: "freeship",
      discount_value: 30000,
      discount_percent: 0,
      min_order_value: 200000,
      max_discount: 30000,
      total_usage_limit: 800,
      per_user_limit: 3,
      target_platform: "Toàn Sàn VibeBili.vn",
      used_count: 215,
      start_date: "2026-10-25",
      end_date: "2026-11-30",
      status: "active"
    },
    {
      id: 4,
      code: "MEGA11_SALE",
      campaign_name: "Mega Sale Đơn Đôi 11.11 Toàn Quốc",
      discount_type: "percent",
      discount_value: 30,
      discount_percent: 30,
      min_order_value: 500000,
      max_discount: 200000,
      total_usage_limit: 2000,
      per_user_limit: 1,
      target_platform: "Toàn Sàn VibeBili.vn",
      used_count: 42,
      start_date: "2026-11-01",
      end_date: "2026-11-15",
      status: "active"
    }
  ]);

  // 7. Danh mục toàn sàn (Có thể tùy chỉnh số lượng sản phẩm trực tiếp)
  const [categories, setCategories] = useState([
    { id: 1, name: "Tóc Giả Cao Cấp", slug: "toc-gia-cao-cap", count: 32 },
    { id: 2, name: "Thời Trang Nữ", slug: "thoi-trang-nu", count: 85 },
    { id: 6, name: "Thời Trang Nam", slug: "thoi-trang-nam", count: 46 },
    { id: 3, name: "Outfit x Hairstyle Combo", slug: "combo-outfit-hairstyle", count: 18 },
    { id: 4, name: "Tóc Giả Nguyên Đầu", slug: "toc-gia-nguyen-dau", count: 20 },
    { id: 5, name: "Áo Nữ & Croptop", slug: "ao-nu-croptop", count: 42 }
  ]);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCount, setNewCategoryCount] = useState(10);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryCount, setEditingCategoryCount] = useState('');

  // Search & Filter
  const [searchUserId, setSearchUserId] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal Voucher state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    campaign_name: '',
    discount_type: 'percent',
    discount_value: 20,
    min_order_value: 300000,
    max_discount: 100000,
    total_usage_limit: 500,
    per_user_limit: 1,
    target_platform: 'Toàn Sàn VibeBili.vn',
    start_date: '2026-11-01',
    end_date: '2026-11-30'
  });

  // Modal Trao quyền Admin (Super Admin)
  const [showGrantAdminModal, setShowGrantAdminModal] = useState(false);
  const [grantAdminForm, setGrantAdminForm] = useState({
    user_id: '',
    admin_subrole: 'admin-moderator',
    reason: 'Bổ nhiệm phân quyền quản trị nội bộ'
  });

  // Modal Từ chối sản phẩm
  const [rejectModalProduct, setRejectModalProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ==========================================
  // LOAD DỮ LIỆU TỪ BACKEND
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    authAPI.getAllUsers().then(res => {
      if (isMounted && res.success && res.data?.length > 0) {
        setUsers(res.data);
      }
    }).catch(() => {});

    orderAPI.getAllOrders().then(res => {
      if (isMounted && res.success && res.data?.length > 0) {
        const rev = res.data.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
        setStats(prev => ({
          ...prev,
          totalOrders: res.data.length,
          totalRevenue: rev > 0 ? rev : prev.totalRevenue
        }));
      }
    }).catch(() => {});

    serviceAPI.getPendingProducts?.().then(res => {
      if (isMounted && res.success && res.data?.length > 0) {
        setPendingProducts(res.data);
      }
    }).catch(() => {});

    serviceAPI.getComplaints?.().then(res => {
      if (isMounted && res.success && res.data?.length > 0) {
        setComplaints(res.data);
      }
    }).catch(() => {});

    serviceAPI.getVouchers?.().then(res => {
      if (isMounted && res.success && res.data?.length > 0) {
        setVouchers(res.data);
      }
    }).catch(() => {});

    productAPI.getCategories?.().then(res => {
      if (isMounted && res.success && res.data?.length > 0) {
        setCategories(res.data);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // ==========================================
  // BẢO VỆ TRUY CẬP: "ONLY ACCESS BY ADMIN"
  // ==========================================

  // 1. Trường hợp chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-red-200 shadow-2xl text-center space-y-5">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner animate-pulse">
            🔒
          </div>
          <div className="space-y-2">
            <span className="bg-red-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-widest inline-block">
              401 Unauthorized
            </span>
            <h2 className="text-2xl font-black text-gray-900 uppercase">
              Only Access By Admin
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Hệ thống Quản Trị Trung Tâm VibeBili.vn chứa dữ liệu tài chính, kiểm duyệt và phân quyền bảo mật tối mật. Bạn cần đăng nhập tài khoản có thẩm quyền Quản Trị Viên để tiếp tục!
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onNavigateLogin}
              className="bg-black hover:bg-neutral-800 text-white font-black text-xs px-6 py-3 rounded-full transition shadow-lg uppercase tracking-wider"
            >
              🔑 Đăng Nhập Quản Trị Viên
            </button>
            <button
              onClick={onNavigateHome}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-6 py-3 rounded-full transition"
            >
              ← Về Trang Chủ Mua Sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Trường hợp đã đăng nhập nhưng KHÔNG phải Admin (ví dụ: customer hoặc seller)
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-gray-50">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 border-2 border-red-500 shadow-2xl text-center space-y-5">
          <div className="w-20 h-20 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
            🚫
          </div>
          <div className="space-y-2">
            <span className="bg-red-700 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-widest inline-block">
              403 Forbidden - Quyền Truy Cập Bị Từ Chối
            </span>
            <h2 className="text-2xl font-black text-red-600 uppercase">
              Truy Cập Bị Chặn: "Only Access By Admin"
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 text-left space-y-1">
              <div><strong>Tài khoản đang đăng nhập:</strong> {user.name} ({user.email})</div>
              <div><strong>Vai trò hiện tại:</strong> <span className="font-mono uppercase font-black">{user.role}</span></div>
              <div className="text-[11px] text-red-700 mt-1">
                ⚠️ Tài khoản của bạn không thuộc nhóm Quản Trị Viên toàn sàn. Vui lòng liên hệ Super Admin nếu bạn cần được cấp quyền quản trị!
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onNavigateHome}
              className="bg-black hover:bg-neutral-800 text-white font-bold text-xs px-6 py-3 rounded-full transition shadow"
            >
              ← Về Trang Mua Sắm
            </button>
            <button
              onClick={() => {
                logout();
                onNavigateLogin();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-full transition shadow"
            >
              Đổi Sang Tài Khoản Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CÁC HÀM XỬ LÝ QUẢN TRỊ
  // ==========================================

  // --- 1. MODERATION: DUYỆT SẢN PHẨM MỚI ---
  const handleApproveProduct = async (product) => {
    try {
      await serviceAPI.moderateProduct?.(product.id, { action: 'approve' });
    } catch {}

    setPendingProducts(prev => prev.filter(p => p.id !== product.id));
    alert(`🎉 Đã phê duyệt sản phẩm [${product.name}] thành công! Sản phẩm đã được kích hoạt trực tiếp trên sàn VibeBili.vn.`);
  };

  const handleOpenRejectProduct = (product) => {
    setRejectModalProduct(product);
    setRejectReason('Chưa đạt tiêu chuẩn hình ảnh sắc nét hoặc thông tin mô tả chưa rõ ràng');
  };

  const handleConfirmRejectProduct = async () => {
    if (!rejectModalProduct) return;
    try {
      await serviceAPI.moderateProduct?.(rejectModalProduct.id, {
        action: 'reject',
        reject_reason: rejectReason
      });
    } catch {}

    setPendingProducts(prev => prev.filter(p => p.id !== rejectModalProduct.id));
    alert(`Đã từ chối sản phẩm [${rejectModalProduct.name}]. Lý do đã được gửi phản hồi đến gian hàng.`);
    setRejectModalProduct(null);
  };

  // --- 2. MODERATION: DUYỆT SELLER KYC ---
  const handleApproveSeller = async (id, name) => {
    try {
      await authAPI.updateUserRole(id, { role: 'seller', status: 'active' });
    } catch {}
    setPendingSellers(prev => prev.filter(s => s.id !== id));
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'seller', status: 'active' } : u));
    alert(`🎉 Đã phê duyệt hồ sơ KYC của gian hàng [${name}] thành công!`);
  };

  const handleRejectSeller = async (id, name) => {
    try {
      await authAPI.updateUserRole(id, { role: 'customer', status: 'active' });
    } catch {}
    setPendingSellers(prev => prev.filter(s => s.id !== id));
    alert(`Đã từ chối hồ sơ mở shop của [${name}].`);
  };

  // --- 3. MODERATION: BAN / UNBAN TÀI KHOẢN VI PHẠM ---
  const handleToggleBanUser = async (userId, currentStatus, userName) => {
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const actionText = newStatus === 'banned' ? 'KHÓA (BAN)' : 'MỞ KHÓA (UNBAN)';

    if (!window.confirm(`Xác nhận ${actionText} tài khoản #${userId} [${userName}]?`)) return;

    try {
      await authAPI.updateUserRole(userId, { status: newStatus });
    } catch {}

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    alert(`Đã ${actionText} tài khoản #${userId} [${userName}] thành công!`);
  };

  // --- 4. SUPER ADMIN: CẤP QUYỀN VÀ XÓA QUYỀN ADMIN ---
  const handleGrantAdmin = async (e) => {
    e.preventDefault();
    const targetUserId = parseInt(grantAdminForm.user_id);
    const targetUser = users.find(u => u.id === targetUserId);

    if (!targetUser) {
      alert('Vui lòng chọn tài khoản hợp lệ!');
      return;
    }

    try {
      await authAPI.updateUserRole(targetUserId, { role: grantAdminForm.admin_subrole });
    } catch {}

    setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: grantAdminForm.admin_subrole } : u));
    alert(`🎉 Super Admin đã trao quyền [${grantAdminForm.admin_subrole}] cho tài khoản [${targetUser.name}] thành công!`);
    setShowGrantAdminModal(false);
  };

  const handleRevokeAdmin = async (targetUser) => {
    if (!roleIsSuperAdmin) {
      alert('Chỉ Super Admin mới có quyền thu hồi vai trò Quản Trị Viên!');
      return;
    }

    if (targetUser.id === user.id) {
      alert('Bạn không thể tự thu hồi quyền Super Admin của chính mình!');
      return;
    }

    if (!window.confirm(`Xác nhận THU HỒI quyền Admin của [${targetUser.name}]? Tài khoản này sẽ trở về quyền Khách Mua Hàng.`)) {
      return;
    }

    try {
      await authAPI.updateUserRole(targetUser.id, { role: 'customer' });
    } catch {}

    setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: 'customer' } : u));
    alert(`Đã thu hồi quyền Admin của [${targetUser.name}]. Tài khoản đã chuyển về role [customer].`);
  };

  // Thay đổi phân quyền RBAC
  const handleChangeRole = async (userId, newRole) => {
    try {
      await authAPI.updateUserRole(userId, { role: newRole });
    } catch {}
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    alert(`Đã cập nhật phân quyền tài khoản #${userId} thành [${newRole}]!`);
  };

  // --- 5. FINANCIAL ADMIN: VOUCHER & MEGA SALE ---
  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!voucherForm.code) {
      alert('Vui lòng nhập Mã Voucher!');
      return;
    }

    const newVoucher = {
      id: vouchers.length + 10,
      code: voucherForm.code.toUpperCase().trim(),
      campaign_name: voucherForm.campaign_name || 'Đợt Sale VibeBili',
      discount_type: voucherForm.discount_type,
      discount_value: Number(voucherForm.discount_value),
      discount_percent: voucherForm.discount_type === 'percent' ? Number(voucherForm.discount_value) : 0,
      min_order_value: Number(voucherForm.min_order_value || 0),
      max_discount: Number(voucherForm.max_discount || voucherForm.discount_value),
      total_usage_limit: Number(voucherForm.total_usage_limit || 500),
      per_user_limit: Number(voucherForm.per_user_limit || 1),
      target_platform: voucherForm.target_platform,
      used_count: 0,
      start_date: voucherForm.start_date,
      end_date: voucherForm.end_date,
      status: 'active'
    };

    try {
      await serviceAPI.createVoucher?.(newVoucher);
    } catch {}

    setVouchers(prev => [newVoucher, ...prev]);
    alert(`🎉 Tạo đợt Sale & Voucher [${newVoucher.code}] thành công! Toàn bộ người mua có thể áp mã ngay.`);
    setShowVoucherModal(false);
    setVoucherForm({
      code: '',
      campaign_name: '',
      discount_type: 'percent',
      discount_value: 20,
      min_order_value: 300000,
      max_discount: 100000,
      total_usage_limit: 500,
      per_user_limit: 1,
      target_platform: 'Toàn Sàn VibeBili.vn',
      start_date: '2026-11-01',
      end_date: '2026-11-30'
    });
  };

  const handleToggleVoucherStatus = async (voucherId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await serviceAPI.updateVoucher?.(voucherId, { status: nextStatus });
    } catch {}

    setVouchers(prev => prev.map(v => v.id === voucherId ? { ...v, status: nextStatus } : v));
  };

  const handleDeleteVoucher = async (voucherId, code) => {
    if (!window.confirm(`Xác nhận xóa mã khuyến mãi [${code}]?`)) return;
    try {
      await serviceAPI.deleteVoucher?.(voucherId);
    } catch {}
    setVouchers(prev => prev.filter(v => v.id !== voucherId));
  };

  // --- 6. SUPPORT ADMIN: XỬ LÝ KHIẾU NẠI ---
  const handleUpdateComplaint = async (complaintId, newStatus, resolutionNote) => {
    try {
      await serviceAPI.updateComplaint?.(complaintId, { status: newStatus, resolution_note: resolutionNote });
    } catch {}

    setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus, resolution_note: resolutionNote } : c));
    alert(`Đã cập nhật khiếu nại #${complaintId} thành [${newStatus}]!`);
  };

  // --- 7. CATEGORIES: THÊM & TÙY CHỈNH SỐ LƯỢNG SẢN PHẨM ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const newCat = {
      id: categories.length + 10,
      name: newCategoryName.trim(),
      slug: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
      count: Number(newCategoryCount || 0)
    };

    setCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
    setNewCategoryCount(10);
    alert(`Thêm danh mục mới [${newCat.name}] với ${newCat.count} sản phẩm thành công!`);
  };

  const handleSaveCategoryCount = async (catId) => {
    const numCount = parseInt(editingCategoryCount);
    if (isNaN(numCount) || numCount < 0) {
      alert('Vui lòng nhập số lượng sản phẩm hợp lệ!');
      return;
    }

    try {
      await productAPI.updateCategory?.(catId, { count: numCount });
    } catch {}

    setCategories(prev => prev.map(c => c.id === catId ? { ...c, count: numCount } : c));
    setEditingCategoryId(null);
    setEditingCategoryCount('');
  };

  // Lọc danh sách Users theo ID hoặc Role
  const filteredUsers = users.filter(u => {
    if (searchUserId.trim()) {
      const q = searchUserId.toLowerCase().trim();
      const matchId = String(u.id) === q || `#${u.id}` === q;
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchEmail) return false;
    }

    if (roleFilter !== 'all') {
      if (roleFilter === 'admin_all') {
        if (!u.role.startsWith('admin') && u.role !== 'superadmin') return false;
      } else if (u.role !== roleFilter) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-sheinBlack">
      
      {/* ======================================================== */}
      {/* HEADER QUẢN TRỊ VIÊN & BADGE PHÂN QUYỀN THỰC THẾ */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-neutral-950 via-zinc-900 to-black rounded-3xl p-6 md:p-8 text-white shadow-xl border border-gray-800 mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 to-pink-600 flex items-center justify-center text-3xl font-black shadow-lg border border-white/20">
            🛡️
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                VIBEBILI ADMIN PORTAL
              </h1>
              
              {/* Badge Phân Quyền Thực Tế */}
              {currentAdminRole === 'admin-superadmin' || currentAdminRole === 'superadmin' ? (
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  👑 Super Admin (Tối Cao)
                </span>
              ) : currentAdminRole === 'admin-moderator' ? (
                <span className="bg-blue-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  🛡️ Admin Moderator (Kiểm Duyệt)
                </span>
              ) : currentAdminRole === 'admin-financial' ? (
                <span className="bg-emerald-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  💰 Admin Financial (Tài Chính & Voucher)
                </span>
              ) : currentAdminRole === 'admin-support' ? (
                <span className="bg-amber-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  🎧 Admin CSKH & Hỗ Trợ
                </span>
              ) : (
                <span className="bg-purple-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider shadow">
                  👑 Quản Trị Hệ Thống
                </span>
              )}
            </div>

            <p className="text-xs text-gray-300 mt-1 flex items-center gap-2">
              <span>Đang quản trị bởi: <strong>{user.name}</strong> ({user.email})</span>
              <span className="text-emerald-400 font-bold">• Trạng thái: Online (Bảo mật 256-bit)</span>
            </p>
          </div>
        </div>

        {/* Nút thao tác nhanh & Quay về */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onNavigateHome}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-full transition border border-white/20"
          >
            ← Về Sàn Mua Sắm
          </button>
          <button
            onClick={() => {
              logout();
              onNavigateLogin?.();
            }}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-full transition shadow"
          >
            Đăng Xuất
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* THANH TABS QUẢN TRỊ THEO ROLE-BASED ACCESS CONTROL */}
      {/* ======================================================== */}
      <div className="flex space-x-2 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar pb-2">
        
        {/* Tab 1: Tổng quan */}
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-b-2 border-black text-black bg-gray-50'
              : 'text-gray-400 hover:text-black hover:bg-gray-50/50'
          }`}
        >
          <span>📊 Tổng Quan Sàn</span>
        </button>

        {/* Tab 2: Dành riêng cho Super Admin */}
        <button 
          onClick={() => {
            if (!roleIsSuperAdmin) {
              alert('⚠️ Quyền hạn bị giới hạn: Mục [Quản Lý & Cấp Quyền Admin] chỉ dành riêng cho Super Admin!');
              return;
            }
            setActiveTab('superadmin');
          }}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'superadmin'
              ? 'border-b-2 border-purple-700 text-purple-900 bg-purple-50'
              : roleIsSuperAdmin
              ? 'text-purple-700 hover:bg-purple-50/50'
              : 'text-gray-300 opacity-60 cursor-not-allowed'
          }`}
        >
          <span>👑 Quản Lý Admin (Super Admin)</span>
          {!roleIsSuperAdmin && <span className="text-[10px]">🔒</span>}
        </button>

        {/* Tab 3: Dành cho Admin Moderator & Super Admin */}
        <button 
          onClick={() => {
            if (!roleIsModerator) {
              alert('⚠️ Quyền hạn bị giới hạn: Mục [Kiểm Duyệt] chỉ dành cho Admin Moderator và Super Admin!');
              return;
            }
            setActiveTab('moderation');
          }}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'moderation'
              ? 'border-b-2 border-blue-600 text-blue-900 bg-blue-50'
              : roleIsModerator
              ? 'text-gray-500 hover:text-blue-700'
              : 'text-gray-300 opacity-60 cursor-not-allowed'
          }`}
        >
          <span>🛡️ Kiểm Duyệt (SP & KYC)</span>
          {(pendingProducts.length + pendingSellers.length) > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {pendingProducts.length + pendingSellers.length}
            </span>
          )}
          {!roleIsModerator && <span className="text-[10px]">🔒</span>}
        </button>

        {/* Tab 4: Dành cho Admin Financial & Super Admin */}
        <button 
          onClick={() => {
            if (!roleIsFinancial) {
              alert('⚠️ Quyền hạn bị giới hạn: Mục [Tài Chính & Voucher] chỉ dành cho Admin Financial và Super Admin!');
              return;
            }
            setActiveTab('finance');
          }}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'finance'
              ? 'border-b-2 border-emerald-600 text-emerald-900 bg-emerald-50'
              : roleIsFinancial
              ? 'text-gray-500 hover:text-emerald-700'
              : 'text-gray-300 opacity-60 cursor-not-allowed'
          }`}
        >
          <span>💰 Tài Chính & Voucher Sale</span>
          {!roleIsFinancial && <span className="text-[10px]">🔒</span>}
        </button>

        {/* Tab 5: Dành cho Admin CSKH & Super Admin */}
        <button 
          onClick={() => {
            if (!roleIsSupport) {
              alert('⚠️ Quyền hạn bị giới hạn: Mục [CSKH & Khiếu Nại] chỉ dành cho Admin CSKH và Super Admin!');
              return;
            }
            setActiveTab('support');
          }}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'support'
              ? 'border-b-2 border-amber-600 text-amber-900 bg-amber-50'
              : roleIsSupport
              ? 'text-gray-500 hover:text-amber-700'
              : 'text-gray-300 opacity-60 cursor-not-allowed'
          }`}
        >
          <span>🎧 Khiếu Nại & CSKH</span>
          {complaints.filter(c => c.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {complaints.filter(c => c.status === 'pending').length}
            </span>
          )}
          {!roleIsSupport && <span className="text-[10px]">🔒</span>}
        </button>

        {/* Tab 6: Danh mục toàn sàn */}
        <button 
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-b-2 border-black text-black bg-gray-50'
              : 'text-gray-400 hover:text-black'
          }`}
        >
          <span>📂 Danh Mục Toàn Sàn</span>
        </button>

        {/* Tab 7: Toàn bộ Users RBAC */}
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-b-2 border-black text-black bg-gray-50'
              : 'text-gray-400 hover:text-black'
          }`}
        >
          <span>👥 Tất Cả Tài Khoản ({users.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* --- TAB 1: TỔNG QUAN TOÀN DIỆN SÀN THƯƠNG MẠI --- */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Tổng Doanh Thu Toàn Sàn</span>
              <div className="text-2xl font-black text-red-600 mt-2">{stats.totalRevenue.toLocaleString()} đ</div>
              <div className="text-[11px] text-green-600 font-bold mt-1">↑ +21.4% so với tháng trước</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Doanh Thu Phí Sàn (5%)</span>
              <div className="text-2xl font-black text-emerald-600 mt-2">{(stats.totalRevenue * 0.05).toLocaleString()} đ</div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Hoa hồng thu tự động từ các shop</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Sản Phẩm & KYC Chờ Duyệt</span>
              <div className="text-2xl font-black text-blue-600 mt-2">{pendingProducts.length + pendingSellers.length}</div>
              <div className="text-[11px] text-blue-600 font-bold mt-1">{pendingProducts.length} SP mới + {pendingSellers.length} Shop KYC</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Khiếu Nại Cần CSKH</span>
              <div className="text-2xl font-black text-amber-600 mt-2">{complaints.filter(c => c.status === 'pending').length}</div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">Cần điều phối giải quyết</div>
            </div>
          </div>

          {/* Phân Hệ Quản Trị Viên Chuyên Trách */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 border-b pb-3 flex items-center gap-2">
              <span>🛡️</span>
              <span>Cơ Cấu Phân Quyền Quản Trị Viên Sàn VibeBili.vn (Admin RBAC Matrix)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-900 text-xs">👑 SUPER ADMIN</span>
                  <span className="bg-purple-200 text-purple-900 text-[10px] font-bold px-2 py-0.5 rounded">Tối cao</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Toàn quyền hệ thống, quản lý và cấp quyền admin cho các tài khoản khác, thu hồi quyền admin.
                </p>
                <div className="text-[10px] text-purple-600 font-mono font-bold">Email demo: superadmin@admin.com</div>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-900 text-xs">🛡️ ADMIN MODERATOR</span>
                  <span className="bg-blue-200 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded">Kiểm duyệt</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Kiểm duyệt người bán (KYC), kiểm duyệt sản phẩm mới đăng, tìm kiếm ID và khóa tài khoản vi phạm.
                </p>
                <div className="text-[10px] text-blue-600 font-mono font-bold">Email demo: moderator@admin.com</div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-900 text-xs">💰 ADMIN FINANCIAL</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">Tài chính</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Báo cáo doanh thu & dòng tiền, quản lý danh sách Voucher, tạo các đợt Sale và quy định hạn dùng/số lượng.
                </p>
                <div className="text-[10px] text-emerald-600 font-mono font-bold">Email demo: financial@admin.com</div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 text-xs">🎧 ADMIN SUPPORT</span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">CSKH</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Tiếp nhận & xử lý đơn khiếu nại, bảo hành sản phẩm, điều phối dịch vụ Spa phục hồi tóc giả cho khách.
                </p>
                <div className="text-[10px] text-amber-600 font-mono font-bold">Email demo: support@admin.com</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- TAB 2: QUẢN LÝ ADMIN & CẤP QUYỀN (SUPER ADMIN EXCLUSIVE) --- */}
      {/* ======================================================== */}
      {activeTab === 'superadmin' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <h2 className="text-lg font-black uppercase tracking-wider">
                  Trung Tâm Quản Lý & Phân Bổ Quyền Admin
                </h2>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                Khu vực độc quyền của Super Admin: Trao quyền admin cho tài khoản, điều chuyển phân hệ hoặc thu hồi quyền.
              </p>
            </div>

            <button
              onClick={() => setShowGrantAdminModal(true)}
              className="bg-white text-purple-900 hover:bg-purple-100 text-xs font-black px-5 py-2.5 rounded-full transition shadow-md flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>+</span>
              <span>Trao Quyền Admin Mới</span>
            </button>
          </div>

          {/* Bảng Danh Sách Các Admin Đang Hoạt Động */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                Danh Sách Quản Trị Viên Hệ Thống ({users.filter(u => u.role.startsWith('admin') || u.role === 'superadmin').length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3.5">Mã ID</th>
                    <th className="p-3.5">Họ Tên Quản Trị Viên</th>
                    <th className="p-3.5">Email Đăng Nhập</th>
                    <th className="p-3.5">Số Điện Thoại</th>
                    <th className="p-3.5">Phân Hệ Phụ Trách</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-center">Thao Tác Quyền Hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users
                    .filter(u => u.role.startsWith('admin') || u.role === 'superadmin')
                    .map((adminUser) => (
                      <tr key={adminUser.id} className="hover:bg-purple-50/30">
                        <td className="p-3.5 font-mono font-bold text-gray-500">#{adminUser.id}</td>
                        <td className="p-3.5 font-bold text-gray-900">{adminUser.name}</td>
                        <td className="p-3.5 text-gray-600 font-mono">{adminUser.email}</td>
                        <td className="p-3.5">{adminUser.phone || '0909000000'}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                            adminUser.role === 'admin-superadmin' || adminUser.role === 'superadmin' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                            adminUser.role === 'admin-moderator' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                            adminUser.role === 'admin-financial' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {adminUser.role === 'admin-superadmin' ? '👑 Super Admin' :
                             adminUser.role === 'admin-moderator' ? '🛡️ Kiểm Duyệt' :
                             adminUser.role === 'admin-financial' ? '💰 Tài Chính' :
                             '🎧 CSKH & Khiếu Nại'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            {adminUser.status || 'active'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center space-x-2">
                          {adminUser.role !== 'admin-superadmin' && adminUser.id !== user.id ? (
                            <button
                              onClick={() => handleRevokeAdmin(adminUser)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1 rounded-lg text-[11px] transition"
                            >
                              ✕ Thu Hồi Quyền Admin
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic font-semibold">Tài khoản Tối Cao</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- TAB 3: KIỂM DUYỆT (ADMIN MODERATOR & SUPER ADMIN) --- */}
      {/* ======================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          
          {/* Sub-tabs Moderation */}
          <div className="flex border-b border-gray-200 space-x-4 text-xs font-bold uppercase">
            <button
              onClick={() => setModSubTab('products')}
              className={`pb-3 transition flex items-center gap-1.5 ${
                modSubTab === 'products'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-400 hover:text-black'
              }`}
            >
              <span>Kiểm Duyệt Sản Phẩm Mới</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingProducts.length}
              </span>
            </button>

            <button
              onClick={() => setModSubTab('sellers')}
              className={`pb-3 transition flex items-center gap-1.5 ${
                modSubTab === 'sellers'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-400 hover:text-black'
              }`}
            >
              <span>Kiểm Duyệt Người Bán (KYC)</span>
              <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingSellers.length}
              </span>
            </button>

            <button
              onClick={() => setModSubTab('ban_users')}
              className={`pb-3 transition flex items-center gap-1.5 ${
                modSubTab === 'ban_users'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-400 hover:text-red-600'
              }`}
            >
              <span>Tra Cứu ID & Khóa Tài Khoản Vi Phạm</span>
            </button>
          </div>

          {/* SUB-TAB A: KIỂM DUYỆT SẢN PHẨM MỚI (PRODUCT MODERATION) */}
          {modSubTab === 'products' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Sản Phẩm Chờ Phê Duyệt Lên Sàn ({pendingProducts.length})
                </span>
                <span className="text-[11px] text-gray-500 font-semibold">
                  Kiểm tra hình ảnh, nguồn gốc tơ lụa và mô tả chất liệu
                </span>
              </div>

              {pendingProducts.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-xs">
                  ✓ Không có sản phẩm nào đang chờ duyệt. Tất cả sản phẩm đã được phê duyệt lên sàn!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        <th className="p-3.5">Ảnh SP</th>
                        <th className="p-3.5">Tên Sản Phẩm & SKU</th>
                        <th className="p-3.5">Gian Hàng</th>
                        <th className="p-3.5">Danh Mục</th>
                        <th className="p-3.5">Giá Niêm Yết</th>
                        <th className="p-3.5">Kho Sẵn</th>
                        <th className="p-3.5">Ngày Nộp</th>
                        <th className="p-3.5 text-center">Thao Tác Duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-blue-50/20">
                          <td className="p-3.5">
                            <img 
                              src={p.main_image} 
                              alt={p.name} 
                              className="w-14 h-14 object-cover rounded-lg border shadow-sm"
                            />
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <div className="font-bold text-gray-900">{p.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {p.sku}</div>
                            <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{p.description}</div>
                          </td>
                          <td className="p-3.5 font-semibold text-orange-600">{p.seller_name}</td>
                          <td className="p-3.5">
                            <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-medium text-[11px]">
                              {p.category_name}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-red-600">
                            {Number(p.price).toLocaleString()} đ
                          </td>
                          <td className="p-3.5 font-bold">{p.stock} cái</td>
                          <td className="p-3.5 text-gray-500 font-mono text-[11px]">{p.submitted_date}</td>
                          <td className="p-3.5 text-center space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleApproveProduct(p)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition shadow-sm"
                            >
                              ✓ Duyệt Lên Sàn
                            </button>
                            <button
                              onClick={() => handleOpenRejectProduct(p)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                            >
                              ✕ Từ Chối
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

          {/* SUB-TAB B: KIỂM DUYỆT NGƯỜI BÁN (SELLER KYC) */}
          {modSubTab === 'sellers' && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Hồ Sơ Đăng Ký Mở Gian Hàng Chờ Xét Duyệt ({pendingSellers.length})
                </span>
              </div>

              {pendingSellers.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-xs">
                  ✓ Tất cả hồ sơ người bán đã được xử lý xong!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        <th className="p-3.5">Chủ Gian Hàng</th>
                        <th className="p-3.5">Tên Shop Đăng Ký</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Hotline</th>
                        <th className="p-3.5">Ngày Nộp</th>
                        <th className="p-3.5 text-center">Thao Tác Duyệt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingSellers.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="p-3.5 font-bold text-gray-900">{s.name}</td>
                          <td className="p-3.5 font-bold text-orange-600">{s.storeName}</td>
                          <td className="p-3.5 text-gray-600">{s.email}</td>
                          <td className="p-3.5">{s.phone}</td>
                          <td className="p-3.5 text-gray-500 font-mono text-[11px]">{s.date}</td>
                          <td className="p-3.5 text-center space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleApproveSeller(s.id, s.name)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition shadow-sm"
                            >
                              ✓ Chấp Thuận Shop
                            </button>
                            <button
                              onClick={() => handleRejectSeller(s.id, s.name)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-lg text-[11px] transition"
                            >
                              ✕ Từ Chối
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

          {/* SUB-TAB C: TRA CỨU ID & BAN/UNBAN TÀI KHOẢN VI PHẠM */}
          {modSubTab === 'ban_users' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                    Tra Cứu Mã ID & Khóa / Mở Khóa Tài Khoản Vi Phạm Tiêu Chuẩn
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Admin Moderator có quyền khóa tài khoản có hành vi gian lận đơn, lừa đảo, hoặc đăng nội dung vi phạm
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Nhập ID tài khoản (vd: 4 hoặc #4)..."
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-red-600"
                  />
                  <div className="absolute left-2.5 top-2.5 text-gray-400">
                    <SearchIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <th className="p-3">ID</th>
                      <th className="p-3">Họ Tên</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Vai Trò</th>
                      <th className="p-3">Tình Trạng</th>
                      <th className="p-3 text-center">Xử Lý Vi Phạm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-red-50/20">
                        <td className="p-3 font-mono font-bold text-gray-700">#{u.id}</td>
                        <td className="p-3 font-bold text-gray-900">{u.name}</td>
                        <td className="p-3 text-gray-600">{u.email}</td>
                        <td className="p-3">
                          <span className="font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-gray-100">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.status === 'banned' ? (
                            <span className="bg-red-600 text-white font-black px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                              🚫 Đã Khóa (Banned)
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px]">
                              ✓ Hoạt động (Active)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {u.status === 'banned' ? (
                            <button
                              onClick={() => handleToggleBanUser(u.id, u.status, u.name)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded text-[11px] transition"
                            >
                              ✓ Mở Khóa (Unban)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleBanUser(u.id, u.status, u.name)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-[11px] transition shadow-xs"
                            >
                              🚫 Khóa Tài Khoản (Ban)
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* --- TAB 4: TÀI CHÍNH & VOUCHER SALE (ADMIN FINANCIAL) --- */}
      {/* ======================================================== */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          
          {/* Card Báo Cáo Tài Chính */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-4 flex items-center gap-2">
              <span>💰</span>
              <span>Báo Cáo Tài Chính & Dòng Tiền Sàn VibeBili.vn</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Tổng Dòng Tiền Giao Dịch</span>
                <div className="text-2xl font-black text-emerald-900 mt-2">{stats.totalRevenue.toLocaleString()} đ</div>
                <p className="text-[11px] text-emerald-700 mt-1">Bao gồm thanh toán VietQR & COD đối soát</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Quỹ Ký Quỹ Đơn Hàng (Escrow)</span>
                <div className="text-2xl font-black text-blue-900 mt-2">{(stats.totalRevenue * 0.35).toLocaleString()} đ</div>
                <p className="text-[11px] text-blue-700 mt-1">Giữ tiền an toàn cho đến khi khách nhận tóc êm đẹp</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Doanh Thu Phí Sàn (Platform Commission)</span>
                <div className="text-2xl font-black text-purple-900 mt-2">{(stats.totalRevenue * 0.05).toLocaleString()} đ</div>
                <p className="text-[11px] text-purple-700 mt-1">Khấu trừ 5% trên mỗi đơn hoàn tất thành công</p>
              </div>
            </div>
          </div>

          {/* Quản Lý Voucher & Các Đợt Sale */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <span>🎟️</span>
                  <span>Quản Lý Danh Sách Voucher & Các Đợt Sale Toàn Web</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Admin Financial thiết lập mã giảm giá, đợt Mega Sale, hạn sử dụng, % giảm, giới hạn toàn web & mỗi cá nhân
                </p>
              </div>

              <button
                onClick={() => setShowVoucherModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-full transition shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>+</span>
                <span>Thêm Voucher / Đợt Sale Mới</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3">Mã Voucher</th>
                    <th className="p-3">Chiến Dịch / Đợt Sale</th>
                    <th className="p-3">Mức Giảm</th>
                    <th className="p-3">Hạn Sử Dụng</th>
                    <th className="p-3 text-center">Giới Hạn Toàn Web</th>
                    <th className="p-3 text-center">Mỗi Khách Dùng</th>
                    <th className="p-3">Áp Dụng Cho Web/Ngành</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-emerald-50/20">
                      <td className="p-3 font-mono font-black text-red-600 bg-red-50/50 rounded">{v.code}</td>
                      <td className="p-3 font-bold text-gray-900">{v.campaign_name || v.name}</td>
                      <td className="p-3 font-bold text-emerald-700">
                        {v.discount_type === 'percent' ? `Giảm ${v.discount_value}%` : `Giảm ${v.discount_value.toLocaleString()}đ`}
                        <div className="text-[10px] text-gray-400 font-normal">Đơn từ {v.min_order_value?.toLocaleString()}đ</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-gray-600">
                        {v.start_date} → {v.end_date}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {v.used_count || 0} / {v.total_usage_limit || 1000} lượt
                      </td>
                      <td className="p-3 text-center font-bold text-blue-600">
                        {v.per_user_limit || 1} lần / khách
                      </td>
                      <td className="p-3">
                        <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {v.target_platform || 'Toàn Sàn VibeBili.vn'}
                        </span>
                      </td>
                      <td className="p-3">
                        {v.status === 'active' ? (
                          <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            Đang chạy
                          </span>
                        ) : (
                          <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded text-[10px]">
                            Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleVoucherStatus(v.id, v.status)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                            v.status === 'active'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {v.status === 'active' ? 'Tạm Dừng' : 'Kích Hoạt'}
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(v.id, v.code)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold transition"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* --- TAB 5: CSKH & KHIẾU NẠI (ADMIN SUPPORT) --- */}
      {/* ======================================================== */}
      {activeTab === 'support' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="border-b pb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <span>🎧</span>
              <span>Tiếp Nhận & Xử Lý Khiếu Nại Khách Hàng (Customer Disputes & Support)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Admin CSKH tiếp nhận khiếu nại về size, chất lượng tóc giả, thời gian giao hàng và hoàn tiền bảo vệ quyền lợi người mua
            </p>
          </div>

          <div className="space-y-4">
            {complaints.map((c) => (
              <div 
                key={c.id} 
                className={`border rounded-xl p-4 transition ${
                  c.status === 'pending' ? 'border-amber-300 bg-amber-50/30' :
                  c.status === 'in_progress' ? 'border-blue-300 bg-blue-50/20' :
                  'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-xs text-gray-700 bg-white px-2 py-0.5 rounded border">
                      #{c.id}
                    </span>
                    <span className="font-bold text-sm text-gray-900">{c.type}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      c.status === 'pending' ? 'bg-amber-500 text-white' :
                      c.status === 'in_progress' ? 'bg-blue-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {c.status === 'pending' ? 'Chờ tiếp nhận' :
                       c.status === 'in_progress' ? 'Đang điều phối' :
                       'Đã giải quyết'}
                    </span>
                  </div>

                  <span className="text-[11px] text-gray-500 font-mono">{c.created_at}</span>
                </div>

                <div className="text-xs text-gray-700 space-y-1">
                  <div>
                    <strong>Khách hàng:</strong> {c.customer_name} • <strong>SĐT:</strong> {c.customer_phone} • <strong>Đơn hàng:</strong> #{c.order_id} (Shop: {c.seller_name})
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 mt-2 text-gray-800 italic">
                    "{c.content}"
                  </div>
                  {c.resolution_note && (
                    <div className="text-emerald-700 font-semibold text-[11px] mt-1">
                      ✓ Biện pháp xử lý: {c.resolution_note}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-wrap gap-2 justify-end">
                  {c.status !== 'resolved' && (
                    <button
                      onClick={() => {
                        const note = prompt('Nhập biện pháp giải quyết (hoàn tiền, đổi hàng...):', 'Đã liên hệ hỗ trợ khách hàng và giải quyết thỏa đáng');
                        if (note) handleUpdateComplaint(c.id, 'resolved', note);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
                    >
                      ✓ Xác Nhận Đã Giải Quyết Xong
                    </button>
                  )}
                  {c.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateComplaint(c.id, 'in_progress', 'Đang liên hệ shop và điều phối GHN')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
                    >
                      Tiếp Nhận & Đang Xử Lý
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- TAB 6: DANH MỤC TOÀN SÀN (TÙY CHỈNH SỐ LƯỢNG SP) --- */}
      {/* ======================================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
              Quản Lý Danh Mục & Tùy Chỉnh Số Lượng Sản Phẩm
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Cho phép Admin tạo danh mục mới và chỉnh sửa trực tiếp số lượng sản phẩm hiển thị trên sàn
            </p>
          </div>

          {/* Form Thêm Danh Mục Mới */}
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <input 
              type="text" 
              placeholder="Tên danh mục mới (Vd: Phụ kiện dưỡng tóc tơ)" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
            />
            <input 
              type="number" 
              min="0"
              placeholder="Số lượng SP" 
              value={newCategoryCount}
              onChange={(e) => setNewCategoryCount(e.target.value)}
              className="w-28 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
            />
            <button 
              type="submit"
              className="bg-black text-white text-xs font-black px-5 py-2 rounded-xl hover:bg-gray-800 transition shadow-sm whitespace-nowrap"
            >
              + Thêm Danh Mục
            </button>
          </form>

          {/* Danh Sách Danh Mục với Chức năng Tùy Chỉnh Số Lượng SP */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{cat.name}</h4>
                    <span className="text-[11px] text-gray-400 font-mono">slug: {cat.slug}</span>
                  </div>
                  <span className="bg-white border text-gray-700 text-xs font-black px-3 py-1 rounded-full shadow-xs">
                    {cat.count} SP
                  </span>
                </div>

                {/* Khu vực Tùy chỉnh số lượng sản phẩm */}
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                  {editingCategoryId === cat.id ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="number"
                        min="0"
                        value={editingCategoryCount}
                        onChange={(e) => setEditingCategoryCount(e.target.value)}
                        className="w-24 border border-black rounded-lg px-2 py-1 text-xs focus:outline-none font-bold"
                        placeholder="Số lượng"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveCategoryCount(cat.id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold px-2.5 py-1 rounded text-xs transition"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingCategoryId(null)}
                        className="bg-gray-200 text-gray-700 px-2.5 py-1 rounded text-xs transition"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[11px] text-gray-500 font-medium">Tùy chỉnh số lượng:</span>
                      <button
                        onClick={() => {
                          setEditingCategoryId(cat.id);
                          setEditingCategoryCount(cat.count);
                        }}
                        className="bg-white hover:bg-black hover:text-white border border-gray-300 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg transition shadow-xs"
                      >
                        ✏️ Sửa số lượng
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* --- TAB 7: QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN TOÀN DIỆN (RBAC) --- */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm space-y-4">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                Phân Quyền Tài Khoản (Customer, Seller, Superadmin, Moderator, Financial, Support)
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Hiển thị rõ các vai trò phân hệ và cho phép thay đổi phân quyền trực tiếp
              </p>
            </div>

            {/* Bộ lọc vai trò */}
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-semibold bg-white"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="customer">Chỉ Khách Mua (customer)</option>
                <option value="seller">Chỉ Người Bán (seller)</option>
                <option value="admin_all">Tất cả Nhóm Quản Trị (Admin)</option>
                <option value="admin-superadmin">Super Admin</option>
                <option value="admin-moderator">Admin Moderator</option>
                <option value="admin-financial">Admin Financial</option>
                <option value="admin-support">Admin Support</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <th className="p-3">ID</th>
                  <th className="p-3">Họ Tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Vai Trò Hiện Tại</th>
                  <th className="p-3">Tình Trạng</th>
                  <th className="p-3 text-center">Cập Nhật Phân Quyền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-gray-500">#{u.id}</td>
                    <td className="p-3 font-bold text-gray-900">{u.name}</td>
                    <td className="p-3 text-gray-600 font-mono">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                        u.role === 'admin-superadmin' || u.role === 'superadmin' ? 'bg-purple-100 text-purple-900' :
                        u.role === 'admin-moderator' ? 'bg-blue-100 text-blue-900' :
                        u.role === 'admin-financial' ? 'bg-emerald-100 text-emerald-900' :
                        u.role === 'admin-support' ? 'bg-amber-100 text-amber-900' :
                        u.role === 'seller' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.status === 'banned' ? (
                        <span className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-[10px]">Banned</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px]">Active</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-black font-semibold bg-white"
                      >
                        <option value="customer">customer (Khách Mua)</option>
                        <option value="seller">seller (Chủ Shop)</option>
                        <option value="admin-moderator">admin-moderator (Kiểm Duyệt)</option>
                        <option value="admin-financial">admin-financial (Tài Chính)</option>
                        <option value="admin-support">admin-support (CSKH & Khiếu Nại)</option>
                        <option value="admin-superadmin">admin-superadmin (Super Admin)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL THÊM VOUCHER & ĐỢT SALE MỚI (ADMIN FINANCIAL) */}
      {/* ======================================================== */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black uppercase tracking-wider text-gray-900">
                Tạo Đợt Sale & Voucher Khuyến Mãi Toàn Web
              </h3>
              <button 
                onClick={() => setShowVoucherModal(false)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mã Voucher * (In hoa, không dấu)</label>
                  <input
                    type="text"
                    required
                    placeholder="Vd: MEGA11_SALE"
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 font-mono font-bold uppercase focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tên Đợt Sale / Chiến Dịch *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vd: Đại Tiệc Mua Sắm Siêu Sale 11.11"
                    value={voucherForm.campaign_name}
                    onChange={(e) => setVoucherForm({ ...voucherForm, campaign_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Loại Giảm Giá</label>
                  <select
                    value={voucherForm.discount_type}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 font-semibold bg-white"
                  >
                    <option value="percent">Giảm theo % (Phần Trăm)</option>
                    <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                    <option value="freeship">Miễn phí vận chuyển (Freeship)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {voucherForm.discount_type === 'percent' ? 'Mức Giảm (% Phần Trăm) *' : 'Số Tiền Giảm (VNĐ) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={voucherForm.discount_value}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount_value: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Giá Trị Đơn Hàng Tối Thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={voucherForm.min_order_value}
                    onChange={(e) => setVoucherForm({ ...voucherForm, min_order_value: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mức Giảm Tối Đa (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={voucherForm.max_discount}
                    onChange={(e) => setVoucherForm({ ...voucherForm, max_discount: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số Lượng Sử Dụng Toàn Web *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={voucherForm.total_usage_limit}
                    onChange={(e) => setVoucherForm({ ...voucherForm, total_usage_limit: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số Lượng Sử Dụng Mỗi Cá Nhân *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={voucherForm.per_user_limit}
                    onChange={(e) => setVoucherForm({ ...voucherForm, per_user_limit: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Dành Cho Web Nào / Phân Hệ Nào *</label>
                <select
                  value={voucherForm.target_platform}
                  onChange={(e) => setVoucherForm({ ...voucherForm, target_platform: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 font-semibold bg-white"
                >
                  <option value="Toàn Sàn VibeBili.vn">Toàn Sàn VibeBili.vn (Áp dụng toàn bộ)</option>
                  <option value="Ngành Tóc Giả Cao Cấp">Chỉ Ngành Tóc Giả Cao Cấp</option>
                  <option value="Ngành Thời Trang Nữ & Nam">Chỉ Ngành Thời Trang Nữ & Nam</option>
                  <option value="VibeBili Web & Mobile">VibeBili Web & Mobile App</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hạn Bắt Đầu</label>
                  <input
                    type="date"
                    required
                    value={voucherForm.start_date}
                    onChange={(e) => setVoucherForm({ ...voucherForm, start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hạn Kết Thúc</label>
                  <input
                    type="date"
                    required
                    value={voucherForm.end_date}
                    onChange={(e) => setVoucherForm({ ...voucherForm, end_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2 rounded-xl transition shadow"
                >
                  Hoàn Tất Tạo Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TRAO QUYỀN ADMIN (SUPER ADMIN EXCLUSIVE) */}
      {/* ======================================================== */}
      {showGrantAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-base font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <span>👑</span>
                <span>Trao Quyền Quản Trị Viên (Admin)</span>
              </h3>
              <button 
                onClick={() => setShowGrantAdminModal(false)}
                className="text-gray-400 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Chọn Tài Khoản Cần Trao Quyền *</label>
                <select
                  required
                  value={grantAdminForm.user_id}
                  onChange={(e) => setGrantAdminForm({ ...grantAdminForm, user_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 font-medium bg-white"
                >
                  <option value="">-- Chọn một tài khoản --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      #{u.id} - {u.name} ({u.email}) [{u.role}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phân Hệ Admin Cần Cấp *</label>
                <select
                  value={grantAdminForm.admin_subrole}
                  onChange={(e) => setGrantAdminForm({ ...grantAdminForm, admin_subrole: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 font-bold bg-white"
                >
                  <option value="admin-moderator">🛡️ Admin Moderator (Kiểm duyệt SP & KYC)</option>
                  <option value="admin-financial">💰 Admin Financial (Tài chính & Voucher Sale)</option>
                  <option value="admin-support">🎧 Admin Support (CSKH & Khiếu Nại)</option>
                  <option value="admin-superadmin">👑 Super Admin (Tối cao toàn quyền)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Quyết Định / Ghi Chú Bổ Nhiệm</label>
                <textarea
                  rows="2"
                  value={grantAdminForm.reason}
                  onChange={(e) => setGrantAdminForm({ ...grantAdminForm, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none"
                  placeholder="Ghi chú lý do bổ nhiệm vai trò..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowGrantAdminModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-purple-800 hover:bg-purple-900 text-white font-black px-5 py-2 rounded-xl transition shadow"
                >
                  Xác Nhận Trao Quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TỪ CHỐI SẢN PHẨM (ADMIN MODERATOR) */}
      {/* ======================================================== */}
      {rejectModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <h3 className="text-sm font-black uppercase text-red-600">
              Lý Do Từ Chối Phê Duyệt Sản Phẩm
            </h3>
            <p className="text-xs text-gray-600">
              Sản phẩm: <strong>{rejectModalProduct.name}</strong> của shop <em>{rejectModalProduct.seller_name}</em>
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú lý do từ chối gửi cho shop:</label>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalProduct(null)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRejectProduct}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-black shadow"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminPanel;
