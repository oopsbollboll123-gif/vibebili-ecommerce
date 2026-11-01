import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serviceAPI } from '../services/api';
import { SparklesIcon, TruckIcon, ShieldCheckIcon, StarIcon } from './Icons';

function CustomerSpaService({ onNavigateHome, onNavigateAuth }) {
  const { user, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'tracking'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form gửi yêu cầu Spa tóc
  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    customer_phone: user?.phone || '',
    customer_address: user?.address || '',
    wig_type: 'Tóc thật 100% Virgin Human Hair',
    service_type: 'Combo Spa Phục Hồi Chuyên Sâu (Hấp Keratin + Uốn Lọn Sóng)',
    service_price: 320000,
    condition_description: '',
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    pickup_date: ''
  });

  // Danh sách các gói dịch vụ Spa chuẩn Salon
  const spaPackages = [
    {
      id: 1,
      title: "Gội Dưỡng Hấp Keratin Phục Hồi",
      price: 150000,
      description: "Làm sạch sâu biểu bì tóc, hấp dầu Keratin Nano bổ sung độ ẩm, khử mùi và phục hồi độ mềm mượt như mới.",
      duration: "24 giờ",
      badge: "Phổ biến nhất"
    },
    {
      id: 2,
      title: "Uốn Nhiệt & Định Hình Lọn Sóng Nước",
      price: 220000,
      description: "Ứng dụng nhiệt độ chuẩn 180°C - 200°C uốn định hình lọn sóng bồng bềnh, giữ nếp lâu dài không xơ ngọn.",
      duration: "48 giờ",
      badge: "Kỹ thuật cao"
    },
    {
      id: 3,
      title: "Combo Spa Phục Hồi Chuyên Sâu",
      price: 320000,
      description: "Gồm gội dưỡng Keratin, uốn định hình sóng nước và xịt phủ bóng bảo vệ sợi tơ dưới ánh sáng mặt trời.",
      duration: "48 giờ",
      badge: "Tiết kiệm 20%"
    },
    {
      id: 4,
      title: "Phục Hồi Lưới Ren & Gia Cố Kẹp Phím",
      price: 95000,
      description: "Thay thế kẹp phím bị lỏng, gia cố viền ren siêu tàng hình, đảm bảo đội chắc chắn và ôm sát chu vi đầu.",
      duration: "24 giờ",
      badge: "Bảo dưỡng phom"
    }
  ];

  // Danh sách lịch sử đơn Spa của khách
  const [spaHistory, setSpaHistory] = useState([]);

  useEffect(() => {
    serviceAPI.getMySpaRequests()
      .then(res => {
        if (res.success && res.data) {
          setSpaHistory(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectPackage = (pkg) => {
    setFormData({
      ...formData,
      service_type: pkg.title,
      service_price: pkg.price
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.customer_name || !formData.customer_phone || !formData.customer_address) {
      setErrorMsg('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận/trả tóc!');
      return;
    }

    if (!formData.condition_description.trim()) {
      setErrorMsg('Vui lòng mô tả tình trạng tóc hiện tại để chuyên viên tư vấn phục hồi đúng cách!');
      return;
    }

    setLoading(true);
    try {
      const res = await serviceAPI.createSpaRequest(formData);
      setLoading(false);
      if (res.success) {
        setSuccessMsg(`🎉 Đã gửi yêu cầu Spa tóc thành công! Mã đơn Spa: ${res.data.id}. Bưu tá sẽ liên hệ nhận tóc theo lịch hẹn.`);
        setSpaHistory([res.data, ...spaHistory]);
        setActiveTab('tracking');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Lỗi gửi yêu cầu!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 font-sans">
      
      {/* Banner Giới Thiệu Dịch Vụ Spa Tóc Hậu Mãi */}
      <div className="bg-gradient-to-r from-neutral-950 via-zinc-900 to-black rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center space-x-1.5 bg-orange-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>VibeBili Care • Dịch Vụ Hậu Mãi & Spa Tóc Giả Chuẩn Salon</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
            Spa & Phục Hồi Tóc Giả <br />
            <span className="text-orange-500">Mềm Mượt, Bồng Bềnh Như Mới</span>
          </h1>
          <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
            Dịch vụ chăm sóc độc quyền dành cho khách hàng VibeBili: Bưu tá đến tận nhà lấy tóc, đội ngũ chuyên viên hấp dầu Keratin và uốn nhiệt phục hồi lọn sóng, giao trả tóc tận tay sau 24 - 48h.
          </p>
        </div>
      </div>

      {/* Tabs chuyển đổi: Gửi yêu cầu mới vs Theo dõi đơn Spa */}
      <div className="flex space-x-6 border-b border-gray-200 mb-8 text-sm font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('request')}
          className={`pb-3 transition ${
            activeTab === 'request'
              ? 'border-b-2 border-black text-black font-black'
              : 'text-gray-400 hover:text-black'
          }`}
        >
          ✨ Đặt Lịch Spa Tóc Giả
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`pb-3 transition flex items-center space-x-2 ${
            activeTab === 'tracking'
              ? 'border-b-2 border-black text-black font-black'
              : 'text-gray-400 hover:text-black'
          }`}
        >
          <span>📦 Theo Dõi Tiến Trình Spa</span>
          {spaHistory.length > 0 && (
            <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {spaHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* --- TAB 1: GỬI YÊU CẦU SPA TÓC --- */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cột trái: Chọn Gói Spa */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-gray-900 mb-1">
                1. Chọn Gói Dịch Vụ Spa Chăm Sóc
              </h2>
              <p className="text-xs text-gray-500">Quy trình xử lý nhiệt an toàn kết hợp dưỡng chất Keratin sinh học</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spaPackages.map((pkg) => {
                const isSelected = formData.service_type === pkg.title;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition shadow-sm relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-black bg-orange-50/30'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                          {pkg.badge}
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">⏱️ {pkg.duration}</span>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 mb-1">{pkg.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3">{pkg.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="font-black text-red-600 text-base">
                        {pkg.price.toLocaleString()} đ
                      </span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-black font-black' : 'text-gray-400'}`}>
                        {isSelected ? '✓ Đang chọn' : 'Chọn gói'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quy trình lấy tóc tận nhà */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-3 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-gray-800 flex items-center space-x-1.5">
                <TruckIcon className="w-4 h-4 text-orange-600" />
                <span>Quy trình Lấy Tóc & Giao Trả Tận Nhà</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-gray-600">
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <span className="font-bold text-black block mb-1">Bước 1: Bưu tá đến lấy</span>
                  <span>Bưu tá GHN/GHTK nhận tóc tại nhà theo lịch hẹn bạn chọn.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <span className="font-bold text-black block mb-1">Bước 2: Xưởng Spa phục hồi</span>
                  <span>Kỹ thuật viên gội dưỡng, uốn sóng nhiệt và kiểm định phom.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <span className="font-bold text-black block mb-1">Bước 3: Giao tận tay</span>
                  <span>Đóng hộp giữ phom và ship hỏa tốc trao trả tận tay bạn.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form Điền Thông Tin */}
          <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-xl space-y-5">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-gray-900 mb-1">
                2. Thông Tin Khách Hàng & Tình Trạng Tóc
              </h2>
              <p className="text-xs text-gray-500">Chuyên viên VibeBili sẽ liên hệ xác nhận trong 15 phút</p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-3 rounded">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Họ và Tên Khách Hàng (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Hoàng Trọng Phúc"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Số Điện Thoại (*)</label>
                  <input
                    type="tel"
                    required
                    placeholder="09xxxxxxxx"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Chất Liệu Tóc (*)</label>
                  <select
                    value={formData.wig_type}
                    onChange={(e) => setFormData({ ...formData, wig_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none bg-white font-medium"
                  >
                    <option value="Tóc thật 100% Virgin Human Hair">Tóc thật 100% Virgin Hair</option>
                    <option value="Sợi tơ nhân tạo Hàn Quốc (Synthetic Silk)">Sợi tơ nhân tạo Hàn Quốc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Địa Chỉ Nhận & Trả Tóc (*)</label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, tên đường, Quận/Huyện, Tỉnh/TP"
                  value={formData.customer_address}
                  onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô Tả Tình Trạng Tóc Hiện Tại (*)</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Vd: Tóc bị khô ngọn sau khi đi nắng, lọn sóng bị duỗi thẳng, cần uốn lại lọn sóng nước và hấp mềm..."
                  value={formData.condition_description}
                  onChange={(e) => setFormData({ ...formData, condition_description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                ></textarea>
              </div>

              {/* Upload Ảnh Tóc Thực Tế */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tải Lên Ảnh Tình Trạng Tóc (Minh họa)</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 hover:file:bg-gray-200"
                  />
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Ảnh tóc"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                    />
                  )}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-orange-950 block">Tổng Chi Phí Dịch Vụ:</span>
                  <span className="text-[11px] text-orange-700">Đã bao gồm phí bưu tá 2 chiều</span>
                </div>
                <span className="text-xl font-black text-red-600">
                  {formData.service_price.toLocaleString()} đ
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-neutral-800 text-white font-black py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50"
              >
                {loading ? 'Đang Gửi Yêu Cầu...' : '🚀 Xác Nhận Gửi Yêu Cầu Spa Tóc'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- TAB 2: THEO DÕI TIẾN TRÌNH SPA --- */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black uppercase tracking-wider text-gray-900">
              Lịch Sử & Tiến Trình Xử Lý Spa Tóc Của Bạn
            </h2>
            <button
              onClick={() => setActiveTab('request')}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              + Đặt thêm yêu cầu Spa mới
            </button>
          </div>

          {spaHistory.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-gray-200 space-y-3">
              <span className="text-4xl">💇‍♀️</span>
              <p className="text-sm font-bold text-gray-700">Bạn chưa có yêu cầu Spa tóc nào!</p>
              <button
                onClick={() => setActiveTab('request')}
                className="bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-neutral-800 transition"
              >
                Đặt Lịch Ngay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {spaHistory.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-sm text-gray-900">#{item.id}</span>
                        <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 mt-0.5 block">Ngày tạo: {item.created_at}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Chi phí dịch vụ</span>
                      <span className="font-black text-red-600 text-base">{Number(item.service_price).toLocaleString()} đ</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-500">Gói Dịch Vụ:</span>
                      <div className="font-semibold text-gray-900">{item.service_type}</div>
                      <div className="text-[11px] text-gray-500">Loại tóc: {item.wig_type}</div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-gray-500">Địa Chỉ Nhận & Trả:</span>
                      <div className="font-semibold text-gray-900">{item.customer_address}</div>
                      <div className="text-[11px] text-gray-500">SĐT: {item.customer_phone}</div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-gray-500">Tình Trạng Tóc:</span>
                      <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100 text-[11px]">
                        "{item.condition_description}"
                      </p>
                    </div>
                  </div>

                  {/* Tiến trình 4 bước */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                      <div className={`p-2 rounded-xl ${item.status === 'Chờ tiếp nhận' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        1. Chờ tiếp nhận
                      </div>
                      <div className={`p-2 rounded-xl ${item.status === 'Đã hẹn bưu tá lấy tóc' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        2. Bưu tá lấy tóc
                      </div>
                      <div className={`p-2 rounded-xl ${item.status === 'Đang xử lý tại xưởng Spa' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        3. Đang Spa tóc
                      </div>
                      <div className={`p-2 rounded-xl ${item.status === 'Đã hoàn thành & Đang gửi trả' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                        4. Giao trả khách
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default CustomerSpaService;
