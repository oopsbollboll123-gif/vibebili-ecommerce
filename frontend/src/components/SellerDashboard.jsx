import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productAPI, orderAPI, serviceAPI } from '../services/api';
import {
  StoreIcon,
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  SearchIcon,
  UserIcon
} from './Icons';

function SellerDashboard({ onNavigateHome, onNavigateAuth }) {
  const { user, isAuthenticated, isSeller, upgradeToSeller } = useAuth();

  // Navigation tabs trong Seller Center:
  // 'products' | 'orders' | 'finance' | 'marketing' | 'spa' | 'profile'
  const [activeTab, setActiveTab] = useState('products');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form kích hoạt mở Shop cho Khách hàng đã đăng nhập
  const [onboardingForm, setOnboardingForm] = useState({
    shop_name: user?.shop_name || '',
    phone: user?.phone || '',
    warehouse_address: user?.address || '',
    business_type: 'Tóc Giả & Thời Trang (Combo)',
    identity_card: '',
    description: ''
  });
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingSuccess, setOnboardingSuccess] = useState('');

  // Form thêm sản phẩm mới kèm upload ảnh thực tế đa góc
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Tóc Giả Cao Cấp',
    price: '',
    stock: '50',
    color: 'Nâu Hạt Dẻ Tự Nhiên',
    size: 'Size M (55 - 57cm)',
    hairLength: '60cm',
    fiberType: 'Tóc thật 100% Virgin Human Hair',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    angleImages: [],
    description: 'Chịu nhiệt an toàn 180°C - 220°C, phom tóc ôm sát đường chân tóc tự nhiên.'
  });

  // State Hẹn Giờ Lấy Hàng (Pickup Scheduling)
  const [pickupForm, setPickupForm] = useState({
    shipping_carrier: 'GHN (Giao Hàng Nhanh)',
    pickup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickup_time_slot: 'Chiều (13:30 - 17:00)',
    note: 'Hàng tóc giả cao cấp đóng hộp giữ phom, xin bưu tá vận chuyển nhẹ tay.'
  });

  // State Bulk Upload (Nhập hàng loạt)
  const [bulkData, setBulkData] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // Danh sách sản phẩm
  const [products, setProducts] = useState([
    { id: 1, name: "Tóc giả nữ nguyên đầu xoăn sóng nước 60cm", category: "Tóc Giả Cao Cấp", price: 350000, stock: 45, status: "Đang bán", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80" },
    { id: 2, name: "Tóc giả Bob ngắn uốn cụp Hàn Quốc", category: "Tóc Giả Cao Cấp", price: 280000, stock: 50, status: "Đang bán", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80" },
    { id: 3, name: "Áo thun croptop Y2K Cyberpunk", category: "Thời Trang Nữ", price: 169000, stock: 120, status: "Đang bán", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80" },
    { id: 4, name: "Đầm tiểu thư vải dạ tweed dáng dài", category: "Thời Trang Nữ", price: 420000, stock: 25, status: "Đang bán", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=300&q=80" }
  ]);

  // Danh sách đơn hàng
  const [orders, setOrders] = useState([
    { id: "WIG-849201", customer_name: "Nguyễn Thu Thảo", customer_phone: "0933112233", total_amount: 380000, status: "Chờ xác nhận", created_at: "2026-10-27", shipping_carrier: "Chưa phân công", tracking_code: "Chưa có" },
    { id: "WIG-849195", customer_name: "Trần Minh Tuấn", customer_phone: "0918111222", total_amount: 550000, status: "Đã hẹn bưu tá", created_at: "2026-10-26", shipping_carrier: "GHN", tracking_code: "GHN-VB-883921", pickup_date: "2026-10-28", pickup_time_slot: "Sáng (08:30 - 11:30)" },
    { id: "WIG-849182", customer_name: "Lê Hoàng Yến", customer_phone: "0909554433", total_amount: 720000, status: "Đã giao", created_at: "2026-10-25", shipping_carrier: "GHTK", tracking_code: "GHTK-VB-554190" }
  ]);

  // Danh sách Voucher khuyến mãi
  const [vouchers, setVouchers] = useState([]);
  const [newVoucherForm, setNewVoucherForm] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: 15,
    min_order_value: 300000,
    max_discount: 80000,
    usage_limit: 100
  });

  // Danh sách yêu cầu Spa tóc nhận từ khách
  const [spaRequests, setSpaRequests] = useState([]);

  // Dữ liệu tài chính & ví Shop
  const [finance, setFinance] = useState({
    available_balance: 14250000,
    escrow_balance: 3850000,
    total_withdrawn: 42000000,
    bank_account: {
      bank_name: "MB Bank (Ngân Hàng Quân Đội)",
      account_number: "98230188999",
      account_holder: "TRAN THI MAI",
      branch: "Chi nhánh Sài Gòn"
    },
    withdrawal_history: [
      { id: "WD-1029", amount: 10000000, status: "Thành công", created_at: "2026-10-20", bank: "MB Bank ***999" },
      { id: "WD-1015", amount: 15000000, status: "Thành công", created_at: "2026-10-10", bank: "MB Bank ***999" }
    ]
  });
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Load toàn bộ dữ liệu Backend
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
            status: "Đang bán",
            image: p.image || p.main_image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80"
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
            created_at: o.created_at ? new Date(o.created_at).toLocaleDateString() : '2026-10-27',
            shipping_carrier: o.shipping_carrier || o.carrier || 'Chưa phân công',
            tracking_code: o.tracking_code || 'Chưa có',
            pickup_date: o.pickup_date,
            pickup_time_slot: o.pickup_time_slot || o.pickup_time
          })));
        }
      })
      .catch(() => {});

    serviceAPI.getVouchers()
      .then(res => { if (isMounted && res.success) setVouchers(res.data); })
      .catch(() => {});

    serviceAPI.getSellerSpaRequests()
      .then(res => { if (isMounted && res.success) setSpaRequests(res.data); })
      .catch(() => {});

    serviceAPI.getFinance()
      .then(res => { if (isMounted && res.success) setFinance(res.data); })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Xử lý nộp đơn kích hoạt Seller cho khách hàng
  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    if (!onboardingForm.shop_name.trim() || !onboardingForm.phone.trim() || !onboardingForm.warehouse_address.trim()) {
      setOnboardingError('Vui lòng điền đầy đủ Tên Shop, Số điện thoại và Địa chỉ kho!');
      return;
    }

    setOnboardingLoading(true);
    setOnboardingError('');
    setOnboardingSuccess('');

    const res = await upgradeToSeller(onboardingForm);
    setOnboardingLoading(false);
    if (res.success) {
      setOnboardingSuccess('🎉 Kích hoạt gian hàng Người Bán thành công! Chào mừng bạn đến với VibeBili Seller Center!');
    } else {
      setOnboardingError(res.message);
    }
  };

  // Upload ảnh thực tế từ máy tính
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (index === 0) {
          setNewProduct(prev => ({ ...prev, image: reader.result }));
        }
        setNewProduct(prev => ({
          ...prev,
          angleImages: [...prev.angleImages, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  // Thêm sản phẩm mới
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
        image: newProduct.image,
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
        status: "Đang bán",
        image: newProduct.image
      };

      setProducts([created, ...products]);
      setIsAddModalOpen(false);
      alert('🎉 Đăng bán sản phẩm mới thành công lên hệ thống VibeBili.vn!');
    } catch (err) {
      alert('⚠️ ' + (err.message || 'Lỗi khi thêm sản phẩm!'));
    } finally {
      setLoading(false);
    }
  };

  // Xử lý File Bulk Upload (CSV hoặc JSON)
  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          setBulkData(Array.isArray(parsed) ? parsed : [parsed]);
          setBulkStatus(`Đã đọc ${parsed.length} sản phẩm từ file JSON.`);
        } else {
          // Parse CSV cơ bản
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const rows = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            if (values.length >= 2) {
              rows.push({
                name: values[0] || `Sản phẩm SKU ${i}`,
                category: values[1] || 'Tóc Giả Cao Cấp',
                price: Number(values[2]) || 350000,
                stock: Number(values[3]) || 50,
                color: values[4] || 'Nâu Sô-cô-la',
                size: values[5] || 'Size M (55 - 57cm)',
                description: values[6] || 'Hàng chính hãng VibeBili'
              });
            }
          }
          setBulkData(rows);
          setBulkStatus(`Đã trích xuất ${rows.length} sản phẩm SKU hợp lệ từ file CSV!`);
        }
      } catch (err) {
        setBulkStatus('Lỗi đọc file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Xác nhận Đăng tải hàng loạt
  const handleConfirmBulkUpload = async () => {
    if (bulkData.length === 0) return;
    setLoading(true);
    try {
      const res = await productAPI.bulkCreate(bulkData);
      if (res.success) {
        alert(`🎉 ${res.message}`);
        // Cập nhật state
        setProducts([...res.data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category_name,
          price: p.price,
          stock: p.variants?.[0]?.stock || 50,
          status: "Đang bán",
          image: p.main_image
        })), ...products]);
        setIsBulkModalOpen(false);
        setBulkData([]);
      }
    } catch (err) {
      alert('⚠️ ' + (err.message || 'Lỗi đăng tải hàng loạt!'));
    } finally {
      setLoading(false);
    }
  };

  // Tải file CSV Mẫu
  const handleDownloadSampleCSV = () => {
    const csvContent = "\uFEFF" + "ten_san_pham,danh_muc,gia_ban,ton_kho,mau_sac,size_vong_dau,mo_ta\n"
      + "Tóc giả nguyên đầu xoăn hippie 65cm,Tóc Giả Cao Cấp,380000,45,Nâu Trà Sữa,Size M (55-57cm),Chịu nhiệt 180 độ C\n"
      + "Đầm body hai dây phối ren dáng quyến rũ,Thời Trang Nữ,290000,60,Đen Huyền Bí,Size S (42-48kg),Chất vải thun gân co giãn\n"
      + "Tóc Bob tém cá tính sợi tơ lụa Hàn Quốc,Tóc Giả Cao Cấp,260000,30,Xám Khói,Size M (55-57cm),Phù hợp outfit Y2K";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "vibebili_mau_nhap_hang_loat.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Xuất file CSV danh sách sản phẩm hiện tại (Export)
  const handleExportProductsCSV = () => {
    let csvContent = "\uFEFF" + "Mã SKU,Tên Sản Phẩm,Danh Mục,Giá Bán (VNĐ),Tồn Kho,Trạng Thái\n";
    products.forEach(p => {
      csvContent += `#SKU-${p.id},"${p.name}","${p.category}",${p.price},${p.stock},"${p.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vibebili_danh_sach_sku_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mở modal Hẹn Giờ Lấy Hàng
  const handleOpenPickupModal = (order) => {
    setSelectedOrderForPickup(order);
    setIsPickupModalOpen(true);
  };

  // Xác nhận Hẹn Giờ Lấy Hàng (Pickup Scheduling)
  const handleConfirmPickup = async (e) => {
    e.preventDefault();
    if (!selectedOrderForPickup) return;

    setLoading(true);
    try {
      const res = await orderAPI.schedulePickup(selectedOrderForPickup.id, pickupForm);
      if (res.success) {
        alert(`🎉 ${res.message}`);
        setOrders(orders.map(o => o.id === selectedOrderForPickup.id ? {
          ...o,
          status: 'Đã hẹn bưu tá',
          shipping_carrier: pickupForm.shipping_carrier,
          tracking_code: res.data?.trackingCode || 'GHN-VB-774921',
          pickup_date: pickupForm.pickup_date,
          pickup_time_slot: pickupForm.pickup_time_slot
        } : o));
        setIsPickupModalOpen(false);
      }
    } catch (err) {
      alert('⚠️ ' + (err.message || 'Lỗi khi hẹn bưu tá!'));
    } finally {
      setLoading(false);
    }
  };

  // Tạo Voucher mới
  const handleCreateVoucherSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await serviceAPI.createVoucher(newVoucherForm);
      if (res.success) {
        setVouchers([res.data, ...vouchers]);
        setNewVoucherForm({ code: '', discount_type: 'percent', discount_value: 15, min_order_value: 300000, max_discount: 80000, usage_limit: 100 });
        alert('🎉 Tạo Voucher khuyến mãi của Shop thành công!');
      }
    } catch (err) {
      alert('⚠️ ' + err.message);
    }
  };

  // Xóa Voucher
  const handleDeleteVoucher = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy mã voucher này?')) return;
    await serviceAPI.deleteVoucher(id).catch(() => {});
    setVouchers(vouchers.filter(v => v.id !== id));
  };

  // Cập nhật trạng thái Spa tóc từ khách
  const handleUpdateSpaStatus = async (id, newStatus) => {
    try {
      await serviceAPI.updateSpaStatus(id, { status: newStatus });
      setSpaRequests(spaRequests.map(r => r.id === id ? { ...r, status: newStatus } : r));
      alert(`Đã cập nhật trạng thái Spa [${id}] thành: "${newStatus}"!`);
    } catch (err) {
      setSpaRequests(spaRequests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  // Rút tiền từ ví Shop
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100000) {
      alert('Số tiền rút tối thiểu là 100.000 đ!');
      return;
    }
    if (amount > finance.available_balance) {
      alert('Số dư khả dụng không đủ để rút!');
      return;
    }

    try {
      const res = await serviceAPI.requestWithdrawal(amount);
      if (res.success) {
        alert(res.message);
        setFinance(prev => ({
          ...prev,
          available_balance: prev.available_balance - amount,
          total_withdrawn: prev.total_withdrawn + amount,
          withdrawal_history: [res.data, ...prev.withdrawal_history]
        }));
        setWithdrawAmount('');
      }
    } catch (err) {
      alert('⚠️ ' + err.message);
    }
  };

  // =========================================================================
  // NẾU CHƯA ĐĂNG NHẬP HOẶC KHÔNG PHẢI SELLER -> GATE BẢO MẬT
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-2xl font-black">
            <StoreIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black uppercase text-gray-900">
              VIBEBILI SELLER CENTER • CỔNG QUẢN TRỊ BÁN HÀNG
            </h1>
            <p className="text-xs md:text-sm text-gray-500 max-w-lg mx-auto">
              Khu vực bảo mật dành riêng cho Chủ Gian Hàng. Vui lòng đăng nhập hoặc đăng ký tài khoản Người Bán để tiếp tục.
            </p>
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={onNavigateAuth}
              className="bg-black hover:bg-neutral-800 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg"
            >
              Đăng Nhập Kênh Người Bán
            </button>
            <button
              onClick={onNavigateAuth}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg"
            >
              🚀 Đăng Ký Mở Gian Hàng Mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-200 space-y-6">
          <div className="border-b pb-4">
            <span className="bg-orange-100 text-orange-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              Kích Hoạt Quyền Seller
            </span>
            <h1 className="text-2xl font-black uppercase text-gray-900 mt-2">
              Đăng Ký Gian Hàng VibeBili Seller
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Tài khoản <b>{user.name}</b> ({user.email}) hiện đang là Khách Hàng. Hãy điền thông tin để nâng cấp tài khoản bán hàng.
            </p>
          </div>

          {onboardingError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-3 rounded">
              ⚠️ {onboardingError}
            </div>
          )}

          {onboardingSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 text-xs p-3 rounded">
              {onboardingSuccess}
            </div>
          )}

          <form onSubmit={handleUpgradeSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Tên Gian Hàng / Shop Name (*)</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Tóc Xinh Sài Gòn, Mai Tran Wig Boutique..."
                value={onboardingForm.shop_name}
                onChange={(e) => setOnboardingForm({ ...onboardingForm, shop_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Số Điện Thoại Hotline (*)</label>
                <input
                  type="tel"
                  required
                  placeholder="09xxxxxxxx"
                  value={onboardingForm.phone}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ngành Hàng Chủ Lực</label>
                <select
                  value={onboardingForm.business_type}
                  onChange={(e) => setOnboardingForm({ ...onboardingForm, business_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none bg-white font-medium"
                >
                  <option value="Tóc Giả Cao Cấp">Tóc Giả Cao Cấp</option>
                  <option value="Thời Trang Nữ">Thời Trang Nữ</option>
                  <option value="Tóc Giả & Thời Trang (Combo)">Tóc Giả & Thời Trang (Combo)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Địa Chỉ Kho Lấy Hàng / Đổi Trả (*)</label>
              <input
                type="text"
                required
                placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                value={onboardingForm.warehouse_address}
                onChange={(e) => setOnboardingForm({ ...onboardingForm, warehouse_address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={onboardingLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50 mt-2"
            >
              {onboardingLoading ? 'Đang Xử Lý...' : '🚀 Kích Hoạt Gian Hàng Bán Hàng Ngay'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN SELLER CENTER ĐẦY ĐỦ CHO SELLER CHÍNH THỨC
  // =========================================================================
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-16 font-sans">
      
      {/* 1. TOP HEADER SELLER CENTER */}
      <div className="bg-neutral-950 text-white border-b border-neutral-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-xl font-black uppercase tracking-tighter">
              VIBE<span className="text-orange-500">BILI</span>
            </div>
            <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
              SELLER CENTER
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Tên Shop & Huy Hiệu Gian Hàng */}
            <div className="text-right hidden sm:block">
              <div className="font-bold text-xs text-white flex items-center justify-end space-x-1.5">
                <span>{user.shop_name || user.name}</span>
                {/* 3 HUY HIỆU GIAN HÀNG DANH GIÁ */}
                <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                  MALL
                </span>
                <span className="bg-orange-500/20 text-orange-400 text-[9px] px-1.5 py-0.2 rounded font-black uppercase border border-orange-500/40">
                  Yêu Thích+
                </span>
                <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-black uppercase border border-amber-400/40">
                  💎 100% Virgin Hair
                </span>
              </div>
              <div className="text-[10px] text-gray-400">ID Shop: #SELLER-{user.id} • Ví: {finance.available_balance.toLocaleString()}đ</div>
            </div>

            <button
              onClick={onNavigateHome}
              className="bg-white/10 hover:bg-white text-white hover:text-black text-xs font-bold px-3.5 py-1.5 rounded-full transition flex items-center space-x-1.5 border border-white/20"
            >
              <span>🛍️</span>
              <span className="hidden md:inline">Xem Cửa Hàng Khách Hàng</span>
            </button>
          </div>
        </div>

        {/* 6 TABS CHUYÊN BIỆT */}
        <div className="bg-zinc-900 border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 flex space-x-6 text-xs font-bold uppercase tracking-wider overflow-x-auto no-scrollbar py-2.5">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-1 transition ${
                activeTab === 'products'
                  ? 'text-orange-400 border-b-2 border-orange-400 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📦 Quản Lý Sản Phẩm SKU ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-1 transition flex items-center space-x-1.5 ${
                activeTab === 'orders'
                  ? 'text-orange-400 border-b-2 border-orange-400 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🧾 Quản Lý Đơn & Hẹn Bưu Tá ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`pb-1 transition ${
                activeTab === 'finance'
                  ? 'text-orange-400 border-b-2 border-orange-400 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💰 Báo Cáo Tài Chính & Ví Shop
            </button>
            <button
              onClick={() => setActiveTab('marketing')}
              className={`pb-1 transition ${
                activeTab === 'marketing'
                  ? 'text-orange-400 border-b-2 border-orange-400 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎯 Marketing & Voucher ({vouchers.length})
            </button>
            <button
              onClick={() => setActiveTab('spa')}
              className={`pb-1 transition flex items-center space-x-1 ${
                activeTab === 'spa'
                  ? 'text-orange-400 border-b-2 border-orange-400 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>💇‍♀️ Tiếp Nhận Spa Tóc</span>
              {spaRequests.length > 0 && (
                <span className="bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {spaRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-1 transition ${
                activeTab === 'profile'
                  ? 'text-orange-400 border-b-2 border-orange-400 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏢 Hồ Sơ & Kho Gian Hàng
            </button>
          </div>
        </div>
      </div>

      {/* 2. NỘI DUNG TỪNG PHÂN HỆ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* --- PHÂN HỆ 1: QUẢN LÝ SẢN PHẨM + BULK UPLOAD + EXPORT --- */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-gray-900">
                  Quản Lý Sản Phẩm Đa Biến Thể & SKU
                </h2>
                <p className="text-xs text-gray-500">Hỗ trợ đầy đủ đăng hàng loạt, xuất file CSV và upload hình ảnh minh họa thực tế</p>
              </div>

              {/* Nhóm nút thao tác Bulk & Export */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadSampleCSV}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3.5 py-2 rounded-full transition flex items-center space-x-1"
                  title="Tải file mẫu để điền sản phẩm hàng loạt"
                >
                  <span>📄 Tải File CSV Mẫu</span>
                </button>
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center space-x-1 shadow"
                >
                  <span>📥 Nhập Hàng Loạt (Bulk)</span>
                </button>
                <button
                  onClick={handleExportProductsCSV}
                  className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center space-x-1 shadow"
                >
                  <span>📤 Xuất Danh Sách SKU</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-full transition flex items-center space-x-1 shadow"
                >
                  <span>+ Thêm Sản Phẩm Mới</span>
                </button>
              </div>
            </div>

            {/* Bảng sản phẩm */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3.5">Mã SKU</th>
                    <th className="p-3.5">Hình Ảnh & Tên Sản Phẩm</th>
                    <th className="p-3.5">Phân Loại</th>
                    <th className="p-3.5">Giá Bán Niêm Yết</th>
                    <th className="p-3.5">Tồn Kho</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-600">#SKU-{p.id.toString().padStart(4, '0')}</td>
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm"
                          />
                          <div>
                            <div className="font-bold text-gray-900 max-w-sm">{p.name}</div>
                            <div className="text-[10px] text-gray-400">Tự động kết nối mô hình Thử Đồ AI 2-in-1</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-red-600 text-sm">
                        {p.price.toLocaleString()} đ
                      </td>
                      <td className="p-3.5 font-bold text-gray-800">{p.stock} cái</td>
                      <td className="p-3.5">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa SKU #${p.id}?`)) {
                              productAPI.delete(p.id).catch(() => {});
                              setProducts(products.filter(item => item.id !== p.id));
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold hover:underline"
                        >
                          Xóa SKU
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PHÂN HỆ 2: QUẢN LÝ ĐƠN HÀNG & HẸN GIỜ LẤY HÀNG --- */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-gray-900">
                  Xử Lý Đơn Hàng & Hẹn Giờ Bưu Tá Lấy Hàng
                </h2>
                <p className="text-xs text-gray-500">Người bán chủ động lên lịch hẹn với các đơn vị vận chuyển GHN, GHTK, Viettel Post</p>
              </div>

              <div className="flex space-x-2 text-xs">
                {['all', 'Chờ xác nhận', 'Đã hẹn bưu tá', 'Đang giao', 'Đã giao'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-full font-bold transition ${
                      filterStatus === st ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'all' ? 'Tất Cả' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3.5">Mã Đơn</th>
                    <th className="p-3.5">Khách Hàng & SĐT</th>
                    <th className="p-3.5">Tổng Tiền</th>
                    <th className="p-3.5">Đơn Vị Vận Chuyển</th>
                    <th className="p-3.5">Mã Vận Đơn</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-center">Thao Tác Bưu Tá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.filter(o => filterStatus === 'all' || o.status === filterStatus).map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-600">{o.id}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900">{o.customer_name}</div>
                        <div className="text-[11px] text-gray-500">{o.customer_phone}</div>
                      </td>
                      <td className="p-3.5 font-black text-red-600 text-sm">
                        {o.total_amount.toLocaleString()} đ
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-gray-800">{o.shipping_carrier}</span>
                        {o.pickup_time_slot && (
                          <div className="text-[10px] text-orange-600 font-semibold">{o.pickup_time_slot} ({o.pickup_date})</div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-gray-700">
                        {o.tracking_code !== 'Chưa có' ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                            {o.tracking_code}
                          </span>
                        ) : 'Chưa tạo'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          o.status === 'Chờ xác nhận' ? 'bg-amber-100 text-amber-800' :
                          o.status === 'Đã hẹn bưu tá' ? 'bg-orange-100 text-orange-800' :
                          o.status === 'Đang giao' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'Đã giao' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleOpenPickupModal(o)}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-full text-[11px] transition shadow"
                        >
                          📅 Hẹn Giờ Lấy Hàng
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- PHÂN HỆ 3: BÁO CÁO TÀI CHÍNH & VÍ SHOP --- */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Thẻ Số Dư Khả Dụng */}
              <div className="bg-gradient-to-br from-neutral-950 via-zinc-900 to-black text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Số Dư Khả Dụng (Có Thể Rút)</span>
                  <div className="text-3xl font-black text-green-400 mt-2">
                    {finance.available_balance.toLocaleString()} đ
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Đã đối soát từ các đơn giao thành công</p>
                </div>

                <form onSubmit={handleWithdraw} className="mt-6 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Nhập số tiền muốn rút..."
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none flex-1"
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
                    >
                      Rút Tiền
                    </button>
                  </div>
                </form>
              </div>

              {/* Thẻ Tiền Đang Tạm Giữ */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tiền Đang Tạm Giữ (Escrow)</span>
                  <div className="text-3xl font-black text-orange-600 mt-2">
                    {finance.escrow_balance.toLocaleString()} đ
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Tiền từ đơn đang giao, sẽ chuyển sang khả dụng khi khách nhận hàng</p>
                </div>
                <div className="text-xs text-gray-600 pt-4 border-t">
                  <b>Chính sách bảo hộ:</b> Người mua có 15 ngày đổi trả theo quy chuẩn VibeBili.
                </div>
              </div>

              {/* Thẻ Tài Khoản Ngân Hàng */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tài Khoản Ngân Hàng Thụ Hưởng</span>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-1">
                  <div className="font-black text-gray-900">{finance.bank_account.bank_name}</div>
                  <div className="font-mono font-bold text-blue-700 text-sm">{finance.bank_account.account_number}</div>
                  <div className="font-bold text-gray-700 uppercase">{finance.bank_account.account_holder}</div>
                </div>
                <span className="text-[11px] text-green-600 font-bold block">✓ Đã xác thực tài khoản chính chủ</span>
              </div>
            </div>

            {/* Lịch sử giao dịch rút tiền */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900">
                Lịch Sử Rút Tiền Về Ngân Hàng
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 uppercase border-b">
                      <th className="p-3">Mã Giao Dịch</th>
                      <th className="p-3">Số Tiền Rút</th>
                      <th className="p-3">Tài Khoản Nhận</th>
                      <th className="p-3">Ngày Yêu Cầu</th>
                      <th className="p-3">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {finance.withdrawal_history.map(w => (
                      <tr key={w.id}>
                        <td className="p-3 font-mono font-bold">{w.id}</td>
                        <td className="p-3 font-black text-green-600">{w.amount.toLocaleString()} đ</td>
                        <td className="p-3">{w.bank}</td>
                        <td className="p-3 text-gray-500">{w.created_at}</td>
                        <td className="p-3">
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-[10px]">
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- PHÂN HỆ 4: MARKETING & VOUCHERS --- */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form tạo Voucher */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 border-b pb-2">
                  Tạo Mã Giảm Giá Shop (Voucher)
                </h3>
                <form onSubmit={handleCreateVoucherSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Mã Voucher (*)</label>
                    <input
                      type="text"
                      required
                      placeholder="Vd: VIBEWIG20"
                      value={newVoucherForm.code}
                      onChange={(e) => setNewVoucherForm({ ...newVoucherForm, code: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none uppercase font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Hình Thức Giảm</label>
                      <select
                        value={newVoucherForm.discount_type}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, discount_type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white font-medium"
                      >
                        <option value="percent">Giảm theo %</option>
                        <option value="fixed">Giảm số tiền cố định (đ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Giá Trị Giảm (*)</label>
                      <input
                        type="number"
                        required
                        value={newVoucherForm.discount_value}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, discount_value: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Đơn Tối Thiểu (đ)</label>
                      <input
                        type="number"
                        value={newVoucherForm.min_order_value}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, min_order_value: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Số Lượng Phát Hành</label>
                      <input
                        type="number"
                        value={newVoucherForm.usage_limit}
                        onChange={(e) => setNewVoucherForm({ ...newVoucherForm, usage_limit: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black hover:bg-neutral-800 text-white font-black py-2.5 rounded-full text-xs uppercase tracking-wider transition shadow mt-2"
                  >
                    Tạo Voucher Khuyến Mãi
                  </button>
                </form>
              </div>

              {/* Danh sách Voucher đang phát hành */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900 border-b pb-2">
                  Danh Sách Mã Giảm Giá Đang Hoạt Động
                </h3>
                <div className="space-y-3">
                  {vouchers.map(v => (
                    <div key={v.id} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-mono font-black text-sm text-orange-950 flex items-center space-x-2">
                          <span>{v.code}</span>
                          <span className="bg-orange-600 text-white text-[9px] px-2 py-0.2 rounded-full uppercase font-bold">
                            {v.discount_type === 'percent' ? `Giảm ${v.discount_value}%` : `Giảm ${Number(v.discount_value).toLocaleString()}đ`}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600 mt-1">
                          Đơn tối thiểu: {Number(v.min_order_value).toLocaleString()}đ • Đã dùng: {v.used_count || 0}/{v.usage_limit}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVoucher(v.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        Hủy mã
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- PHÂN HỆ 5: TIẾP NHẬN YÊU CẦU SPA TÓC TỪ KHÁCH --- */}
        {activeTab === 'spa' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-base font-black uppercase tracking-wider text-gray-900">
                Tiếp Nhận Đơn Spa & Phục Hồi Tóc Giả Từ Khách Hàng
              </h2>
              <p className="text-xs text-gray-500">Khách hàng gửi yêu cầu gội dưỡng Keratin, uốn sóng nhiệt và bảo dưỡng lưới ren</p>
            </div>

            <div className="space-y-4">
              {spaRequests.map(item => (
                <div key={item.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-sm">#{item.id}</span>
                        <span className="font-bold text-gray-900">{item.customer_name} ({item.customer_phone})</span>
                      </div>
                      <div className="text-gray-500 text-[11px]">Địa chỉ: {item.customer_address}</div>
                    </div>

                    <span className="font-black text-red-600 text-sm">
                      {Number(item.service_price).toLocaleString()} đ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="font-bold text-gray-700 block">Dịch vụ yêu cầu:</span>
                      <span className="text-gray-900 font-semibold">{item.service_type}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-700 block">Mô tả tình trạng:</span>
                      <span className="text-gray-600 italic">"{item.condition_description}"</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-700">Trạng thái xử lý:</span>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateSpaStatus(item.id, e.target.value)}
                        className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none bg-white"
                      >
                        <option value="Chờ tiếp nhận">Chờ tiếp nhận</option>
                        <option value="Đã hẹn bưu tá lấy tóc">Đã hẹn bưu tá lấy tóc</option>
                        <option value="Đang xử lý tại xưởng Spa">Đang xử lý tại xưởng Spa</option>
                        <option value="Đã hoàn thành & Đang gửi trả">Đã hoàn thành & Đang gửi trả</option>
                      </select>
                    </div>

                    <span className="text-gray-400 text-[11px]">Ngày tạo: {item.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- PHÂN HỆ 6: HỒ SƠ & KHO GIAN HÀNG --- */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-base font-black uppercase tracking-wider text-gray-900 border-b pb-3">
              Thông Tin Gian Hàng & Chứng Nhận Thương Hiệu
            </h2>

            {/* Các Huy Hiệu Gian Hàng */}
            <div className="bg-orange-50/70 p-5 rounded-2xl border border-orange-200 space-y-2">
              <span className="text-xs font-black uppercase text-orange-950 block">Huy Hiệu Gian Hàng Đạt Chuẩn:</span>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-black uppercase shadow-sm">
                  🏅 VIBEBILI MALL
                </span>
                <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase shadow-sm">
                  ⭐ SHOP YÊU THÍCH+
                </span>
                <span className="bg-amber-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase shadow-sm">
                  💎 CAM KẾT 100% VIRGIN HAIR
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-gray-500">Tên Gian Hàng:</span>
                <div className="font-black text-sm text-gray-900 mt-0.5">{user.shop_name || user.name}</div>
              </div>
              <div>
                <span className="font-bold text-gray-500">Chủ Sở Hữu:</span>
                <div className="font-bold text-sm text-gray-900 mt-0.5">{user.name}</div>
              </div>
              <div>
                <span className="font-bold text-gray-500">Email Quản Trị:</span>
                <div className="font-semibold text-gray-800 mt-0.5">{user.email}</div>
              </div>
              <div>
                <span className="font-bold text-gray-500">Số Điện Thoại Hotline:</span>
                <div className="font-semibold text-gray-800 mt-0.5">{user.phone || '0912345678'}</div>
              </div>
              <div className="md:col-span-2">
                <span className="font-bold text-gray-500">Địa Chỉ Kho Lấy Hàng & Đổi Trả:</span>
                <div className="font-semibold text-gray-800 mt-0.5">{user.address || '120 Cách Mạng Tháng 8, Quận 3, TP. Hồ Chí Minh'}</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL 1: HẸN GIỜ LẤY HÀNG (PICKUP SCHEDULING) --- */}
      {isPickupModalOpen && selectedOrderForPickup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPickupModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 z-10 border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-gray-900">
                  Hẹn Bưu Tá Lấy Hàng • Đơn #{selectedOrderForPickup.id}
                </h3>
                <p className="text-xs text-gray-500">Khách hàng: {selectedOrderForPickup.customer_name}</p>
              </div>
              <button onClick={() => setIsPickupModalOpen(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmPickup} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Đơn Vị Vận Chuyển (*)</label>
                <select
                  value={pickupForm.shipping_carrier}
                  onChange={(e) => setPickupForm({ ...pickupForm, shipping_carrier: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white font-medium"
                >
                  <option value="GHN">GHN (Giao Hàng Nhanh - Khuyên Dùng)</option>
                  <option value="GHTK">GHTK (Giao Hàng Tiết Kiệm)</option>
                  <option value="Viettel Post">Viettel Post</option>
                  <option value="VibeBili Express">VibeBili Express Hỏa Tốc</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ngày Lấy Hàng (*)</label>
                  <input
                    type="date"
                    required
                    value={pickupForm.pickup_date}
                    onChange={(e) => setPickupForm({ ...pickupForm, pickup_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Khung Giờ Bưu Tá Đến (*)</label>
                  <select
                    value={pickupForm.pickup_time_slot}
                    onChange={(e) => setPickupForm({ ...pickupForm, pickup_time_slot: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white font-medium"
                  >
                    <option value="Sáng (08:30 - 11:30)">Sáng (08:30 - 11:30)</option>
                    <option value="Chiều (13:30 - 17:00)">Chiều (13:30 - 17:00)</option>
                    <option value="Tối (17:30 - 20:00)">Tối (17:30 - 20:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Ghi Chú Cho Bưu Tá</label>
                <textarea
                  rows="2"
                  value={pickupForm.note}
                  onChange={(e) => setPickupForm({ ...pickupForm, note: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsPickupModalOpen(false)}
                  className="px-4 py-2 border rounded-full font-bold hover:bg-gray-100 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-full text-xs uppercase tracking-wider transition shadow"
                >
                  {loading ? 'Đang Lên Lịch...' : 'Xác Nhận Hẹn Lấy Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: NHẬP HÀNG LOẠT (BULK UPLOAD) --- */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBulkModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="text-base font-black uppercase text-gray-900">
                  Nhập Sản Phẩm Hàng Loạt (Bulk Upload)
                </h3>
                <p className="text-xs text-gray-500">Tải lên danh sách sản phẩm qua file .CSV hoặc .JSON</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center space-y-2 hover:border-black transition">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleBulkFileChange}
                  className="hidden"
                  id="bulkFileInput"
                />
                <label htmlFor="bulkFileInput" className="cursor-pointer block">
                  <span className="text-3xl block mb-2">📁</span>
                  <span className="font-bold text-sm text-gray-900 block">Bấm để chọn file CSV hoặc JSON từ máy tính</span>
                  <span className="text-[11px] text-gray-500">Hỗ trợ các cột: tên, danh mục, giá bán, tồn kho, màu sắc, size</span>
                </label>
              </div>

              {bulkStatus && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl text-xs font-semibold">
                  {bulkStatus}
                </div>
              )}

              {/* Bảng xem trước dữ liệu trích xuất */}
              {bulkData.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-gray-700 block">Xem trước danh sách ({bulkData.length} sản phẩm):</span>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 text-gray-700 uppercase">
                        <tr>
                          <th className="p-2">Tên</th>
                          <th className="p-2">Danh mục</th>
                          <th className="p-2">Giá</th>
                          <th className="p-2">Kho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {bulkData.slice(0, 5).map((row, i) => (
                          <tr key={i}>
                            <td className="p-2 font-medium">{row.name}</td>
                            <td className="p-2">{row.category}</td>
                            <td className="p-2 font-bold text-red-600">{Number(row.price).toLocaleString()}đ</td>
                            <td className="p-2">{row.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 border rounded-full font-bold hover:bg-gray-100 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={loading || bulkData.length === 0}
                  onClick={handleConfirmBulkUpload}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-full text-xs uppercase tracking-wider transition shadow disabled:opacity-50"
                >
                  {loading ? 'Đang Đăng Tải...' : `Xác Nhận Đăng ${bulkData.length} Sản Phẩm`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: THÊM SẢN PHẨM MỚI KÈM UPLOAD ẢNH THỰC TẾ --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[92vh] overflow-y-auto border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
                  Đăng Bán Sản Phẩm Mới Lên Sàn
                </h2>
                <p className="text-xs text-gray-500">Hỗ trợ upload ảnh minh họa thực tế đa góc và tự động tích hợp Thử Đồ AI</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-black font-bold text-xl">✕</button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-1">Tên Sản Phẩm (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tóc giả xoăn sóng nước 65cm 100% Virgin Hair"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Danh Mục (*)</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white font-medium"
                  >
                    <option value="Tóc Giả Cao Cấp">Tóc Giả Cao Cấp</option>
                    <option value="Thời Trang Nữ">Thời Trang Nữ</option>
                    <option value="Outfit x Hairstyle Combo">Outfit x Hairstyle Combo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Giá Bán Niêm Yết (VNĐ) (*)</label>
                  <input
                    type="number"
                    required
                    placeholder="350000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black font-bold text-red-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Tồn Kho Khả Dụng</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Màu Sắc Biến Thể</label>
                  <input
                    type="text"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Chu Vi Đầu / Size</label>
                  <input
                    type="text"
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Tải Lên Ảnh Minh Họa Thực Tế */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                <label className="block font-bold text-gray-800">Ảnh Minh Họa Thực Tế (Upload từ máy tính)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-black file:text-white hover:file:bg-neutral-800 cursor-pointer"
                />

                {newProduct.angleImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {newProduct.angleImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-300 shadow-sm flex-shrink-0">
                        <img src={img} alt="Ảnh mẫu" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-bold">
                          Góc {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Mô Tả Sản Phẩm & Thuộc Tính Kỹ Thuật</label>
                <textarea
                  rows="3"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Chất liệu sợi tơ, khả năng chịu nhiệt, phom dáng..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 border rounded-full font-bold hover:bg-gray-100 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-black rounded-full text-xs uppercase tracking-wider transition shadow disabled:opacity-50"
                >
                  {loading ? 'Đang Đăng Bán...' : '🚀 Đăng Bán Lên VibeBili Ngay'}
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
