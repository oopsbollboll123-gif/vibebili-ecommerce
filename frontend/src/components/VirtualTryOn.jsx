import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { tryOnAPI } from '../services/api';
import {
  SparklesIcon,
  CheckIcon,
  ShoppingBagIcon,
  LightningIcon,
  UserIcon,
  ShieldCheckIcon,
  StarIcon,
  FireIcon
} from './Icons';

function VirtualTryOn({ preselectedWigId = null, preselectedClothingId = null, onNavigateCheckout }) {
  const { addToCart } = useCart();

  // State dữ liệu từ API
  const [avatars, setAvatars] = useState([]);
  const [wigs, setWigs] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [specifications, setSpecifications] = useState(null);

  // State lựa chọn của người dùng
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [customAvatarImage, setCustomAvatarImage] = useState(null);
  const [selectedWig, setSelectedWig] = useState(null);
  const [selectedClothing, setSelectedClothing] = useState(null);

  // Số đo cơ thể (Smart Body Measurements)
  const [measurements, setMeasurements] = useState({
    height: 165,
    weight: 49,
    bust: 86,
    waist: 62,
    hips: 90
  });

  // State xử lý AI Try-On
  const [isGenerating, setIsGenerating] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: Idle, 1: Detecting Face, 2: Body Mapping, 3: Multi-layer Rendering
  const [tryOnResult, setTryOnResult] = useState(null);

  // Thanh trượt Before / After Slider (0% -> 100%)
  const [sliderPosition, setSliderPosition] = useState(50);

  // Load Presets từ Backend API
  useEffect(() => {
    tryOnAPI.getPresets()
      .then(res => {
        if (res.success && res.data) {
          const { avatars, catalog, wigSpecifications } = res.data;
          setAvatars(avatars);
          setWigs(catalog.wigs);
          setClothes(catalog.clothes);
          setSpecifications(wigSpecifications);

          // Chọn mặc định
          setSelectedAvatar(avatars[0]);
          setSelectedWig(preselectedWigId ? catalog.wigs.find(w => w.id === Number(preselectedWigId)) || catalog.wigs[0] : catalog.wigs[0]);
          setSelectedClothing(preselectedClothingId ? catalog.clothes.find(c => c.id === Number(preselectedClothingId)) || catalog.clothes[0] : catalog.clothes[0]);
        }
      })
      .catch(err => {
        console.warn('Lỗi gọi API Try-On Presets:', err);
      });
  }, [preselectedWigId, preselectedClothingId]);

  // Xử lý upload ảnh chân dung người dùng
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatarImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Kích hoạt AI 2-in-1 Virtual Try-On
  const handleRunTryOn = async () => {
    if (!selectedWig || !selectedClothing) {
      alert('Vui lòng chọn 1 mẫu tóc giả và 1 mẫu trang phục để thử đồ!');
      return;
    }

    setIsGenerating(true);
    setTryOnResult(null);

    // Hiệu ứng scan từng bước mô phỏng nhận diện AI
    setScanStep(1); // Nhận diện mốc khuôn mặt (Facial Landmarks)
    setTimeout(() => {
      setScanStep(2); // Căn chỉnh phom dáng cơ thể (Body 3D Shape)
    }, 900);
    setTimeout(() => {
      setScanStep(3); // Căn chỉnh đường chân tóc và phủ lớp trang phục
    }, 1800);

    try {
      const payload = {
        avatarId: customAvatarImage ? 'custom-user' : selectedAvatar?.id,
        avatarImage: customAvatarImage || selectedAvatar?.imageUrl,
        measurements,
        wigId: selectedWig.id,
        clothingId: selectedClothing.id
      };

      const res = await tryOnAPI.generateTryOn(payload);
      setTimeout(() => {
        setIsGenerating(false);
        setScanStep(0);
        if (res.success && res.data) {
          setTryOnResult(res.data);
          // Cuộn mượt đến phần kết quả
          const resultElement = document.getElementById('try-on-result-section');
          if (resultElement) {
            resultElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 2600);
    } catch (err) {
      setIsGenerating(false);
      setScanStep(0);
      alert('⚠️ ' + (err.message || 'Lỗi khi kết nối với máy chủ AI Try-On!'));
    }
  };

  // Thêm trọn bộ Combo vừa thử vào giỏ hàng (Hưởng ưu đãi 15% + Quà tặng)
  const handleAddComboToCart = () => {
    if (!tryOnResult) return;

    const { wig, clothing } = tryOnResult.selectedItems;
    const promo = tryOnResult.comboPromotion;

    const comboItem = {
      id: Date.now(),
      name: `Combo AI Look: ${clothing.name} x ${wig.name}`,
      price: promo.comboPrice,
      original_price: promo.originalPrice,
      main_image: tryOnResult.renderedImage
    };

    addToCart(comboItem, { id: 'AI-COMBO-' + Date.now(), title: 'Set Thử Đồ AI (Outfit + Tóc Giả)' }, 1, {
      color: `${wig.color} / ${clothing.color}`,
      size: `${wig.capSize} / M`,
      length: wig.hairLength
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900 font-sans">
      {/* 1. Header Giới thiệu tính năng độc quyền */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <span className="inline-flex items-center space-x-1.5 bg-orange-600 text-white text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow-sm">
          <SparklesIcon className="w-3.5 h-3.5 text-white" />
          <span>Công Nghệ Độc Quyền VibeBili.vn</span>
        </span>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-950">
          Phòng Thử Đồ Ảo AI 2-in-1
        </h1>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
          Giải quyết rào cản lớn nhất khi mua tóc giả: <span className="font-semibold text-gray-900">"Kiểu tóc này có hợp gương mặt mình không? Mặc váy này đi với mái tóc đó có lệch tông không?"</span>. 
          AI tự động căn chỉnh vị trí chân tóc (Hairline) sát trán và phủ trang phục chuẩn tỷ lệ thực tế.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CỘT TRÁI (5 phần): Bước 1 - Thiết lập Avatar & Số đo */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center space-x-2 text-gray-950">
                <UserIcon className="w-4 h-4 text-orange-600" />
                <span>Bước 1: Khởi Tạo Avatar Cá Nhân</span>
              </h2>
              <span className="text-[10px] bg-gray-100 font-bold px-2 py-0.5 rounded text-gray-600 uppercase">Tỷ lệ 1:1</span>
            </div>

            {/* Chọn Avatar mẫu có sẵn hoặc upload ảnh cá nhân */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                A. Chọn Người Mẫu AI (Hoặc Tải Ảnh Cá Nhân Của Bạn)
              </label>
              
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {avatars.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => { setSelectedAvatar(av); setCustomAvatarImage(null); }}
                    className={`relative rounded-xl border-2 p-1.5 cursor-pointer overflow-hidden transition-all text-center flex flex-col items-center ${
                      selectedAvatar?.id === av.id && !customAvatarImage
                        ? 'border-black ring-2 ring-orange-400 bg-orange-50/20'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={av.imageUrl} alt={av.name} className="w-full h-24 object-cover rounded-lg mb-1" />
                    <span className="text-[11px] font-bold text-gray-900 truncate w-full">{av.name.split(' ')[0]}</span>
                    <span className="text-[9px] text-gray-500 truncate w-full">{av.faceShape}</span>
                  </div>
                ))}
              </div>

              {/* Upload ảnh chân dung cá nhân */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="text-xs text-gray-600 font-medium">
                  {customAvatarImage ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600 font-bold">
                      <CheckIcon className="w-4 h-4" />
                      <span>Đã tải ảnh chân dung của bạn thành công!</span>
                    </div>
                  ) : (
                    <span>📸 Hoặc click để tải ảnh chân dung chính bạn lên</span>
                  )}
                </div>
              </div>
            </div>

            {/* Nhập số đo hình thể (Measurements) */}
            <div className="border-t pt-4">
              <label className="block text-xs font-bold text-gray-700 mb-2">
                B. Chuẩn Hóa Số Đo Cơ Thể (AI 3D Body Landmarks)
              </label>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Chiều cao (cm):</span>
                  <input 
                    type="number" 
                    value={measurements.height}
                    onChange={(e) => setMeasurements({ ...measurements, height: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-1.5 mt-1 font-bold focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Cân nặng (kg):</span>
                  <input 
                    type="number" 
                    value={measurements.weight}
                    onChange={(e) => setMeasurements({ ...measurements, weight: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-1.5 mt-1 font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Vòng 1 (Ngực):</span>
                  <input 
                    type="number" 
                    value={measurements.bust}
                    onChange={(e) => setMeasurements({ ...measurements, bust: Number(e.target.value) })}
                    className="w-full border rounded-lg px-2.5 py-1.5 mt-1 font-bold text-center focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Vòng 2 (Eo):</span>
                  <input 
                    type="number" 
                    value={measurements.waist}
                    onChange={(e) => setMeasurements({ ...measurements, waist: Number(e.target.value) })}
                    className="w-full border rounded-lg px-2.5 py-1.5 mt-1 font-bold text-center focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Vòng 3 (Mông):</span>
                  <input 
                    type="number" 
                    value={measurements.hips}
                    onChange={(e) => setMeasurements({ ...measurements, hips: Number(e.target.value) })}
                    className="w-full border rounded-lg px-2.5 py-1.5 mt-1 font-bold text-center focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7 phần): Bước 2 - Chọn Đồ Đa Tầng (Multi-layer Dressing) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center space-x-2 text-gray-950">
                <SparklesIcon className="w-4 h-4 text-orange-600" />
                <span>Bước 2: Thử Đồ Đa Tầng (01 Tóc Giả & 01 Trang Phục)</span>
              </h2>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded uppercase">2-in-1 Fitting</span>
            </div>

            {/* 1. Chọn Mẫu Tóc Giả */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  1. Chọn Mẫu Tóc Giả Cao Cấp:
                </label>
                <span className="text-[11px] text-orange-600 font-semibold cursor-pointer">
                  Chuẩn hóa sợi tơ & Cap Size
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {wigs.map((wig) => (
                  <div
                    key={wig.id}
                    onClick={() => setSelectedWig(wig)}
                    className={`rounded-xl border-2 p-3 cursor-pointer transition-all flex flex-col justify-between ${
                      selectedWig?.id === wig.id
                        ? 'border-black ring-2 ring-orange-400 bg-orange-50/20 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div>
                      <img src={wig.overlayImage} alt={wig.name} className="w-full h-28 object-cover rounded-lg mb-2" />
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{wig.name}</h4>
                      <p className="text-[10px] text-orange-700 font-semibold mt-1">Sợi: {wig.fiber.split('(')[0]}</p>
                      <p className="text-[10px] text-gray-500">Kích thước: {wig.capSize}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-between items-center text-xs">
                      <span className="font-black text-red-600">{wig.price.toLocaleString()} đ</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        selectedWig?.id === wig.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedWig?.id === wig.id ? 'Đang chọn' : 'Chọn'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Chọn Mẫu Trang Phục */}
            <div className="border-t pt-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                2. Chọn Mẫu Trang Phục Phối Đồ:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {clothes.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedClothing(item)}
                    className={`rounded-xl border-2 p-3 cursor-pointer transition-all flex flex-col justify-between ${
                      selectedClothing?.id === item.id
                        ? 'border-black ring-2 ring-orange-400 bg-orange-50/20 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div>
                      <img src={item.overlayImage} alt={item.name} className="w-full h-28 object-cover rounded-lg mb-2" />
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{item.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">Phong cách: {item.style}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t flex justify-between items-center text-xs">
                      <span className="font-black text-red-600">{item.price.toLocaleString()} đ</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        selectedClothing?.id === item.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedClothing?.id === item.id ? 'Đang chọn' : 'Chọn'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút Kích Hoạt Thử Đồ */}
            <div className="border-t pt-4">
              <button
                onClick={handleRunTryOn}
                disabled={isGenerating}
                className="w-full bg-black text-white font-black py-4 rounded-full text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-xl flex items-center justify-center space-x-2 min-h-[48px] focus-visible:ring-2 focus-visible:ring-black"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {scanStep === 1 && "Đang quét mốc khuôn mặt (Facial Landmarks)..."}
                      {scanStep === 2 && "Đang dựng phom dáng 3D (Body Shaping)..."}
                      {scanStep === 3 && "Đang căn chỉnh chân tóc và phủ trang phục..."}
                    </span>
                  </div>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 text-orange-400" />
                    <span>⚡ Bắt Đầu Thử Đồ AI 2-in-1 Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHU VỰC HIỂN THỊ KẾT QUẢ AI & THANH TRƯỢT BEFORE / AFTER SLIDER */}
      {tryOnResult && (
        <div id="try-on-result-section" className="mt-12 bg-white rounded-3xl p-6 md:p-10 border border-gray-200 shadow-2xl">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span className="inline-flex items-center space-x-1.5 bg-green-100 text-green-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase">
              <CheckIcon className="w-3.5 h-3.5 text-green-600" />
              <span>AI Virtual Fitting Hoàn Tất</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">
              Kết Quả Thử Đồ Đồng Bộ
            </h2>
            <p className="text-xs text-gray-500">
              Kéo thanh trượt giữa ảnh để so sánh trực quan diện mạo trước và sau khi được AI làm đẹp!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Cột Trái (6 phần): Interactive Before / After Split Slider */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-md h-[480px] rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-900 select-none">
                
                {/* Ảnh SAU KHI THỬ ĐỒ (Rendered AI Look) */}
                <img 
                  src={tryOnResult.renderedImage} 
                  alt="After Look" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                <span className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow z-10">
                  ✨ VibeBili AI Look
                </span>

                {/* Ảnh GỐC TRƯỚC KHI THỬ ĐỒ (Original Image clipped by slider) */}
                <div 
                  className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    src={tryOnResult.originalImage} 
                    alt="Before Look" 
                    className="w-full h-full object-cover max-w-none"
                    style={{ width: '448px' }} // Khớp kích thước container max-w-md
                  />
                  <span className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow">
                    Ảnh Gốc
                  </span>
                </div>

                {/* Thanh Trượt Phân Cách (Divider Line) */}
                <div 
                  className="absolute inset-y-0 w-1 bg-white shadow-2xl z-20 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shadow-xl border-2 border-white">
                    ↔
                  </div>
                </div>

                {/* Input Slider ẩn để người dùng kéo rê mượt mà */}
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  aria-label="Thanh trượt so sánh trước sau"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                />
              </div>

              <div className="text-xs text-gray-500 font-semibold mt-3 flex items-center space-x-2">
                <span>← Kéo qua trái/phải để so sánh</span>
              </div>
            </div>

            {/* Cột Phải (6 phần): AI Fit Score & Mua Trọn Bộ Combo */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Điểm số phù hợp từ AI */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Chỉ Số Hòa Hợp (AI Fit Score)</h3>
                    <div className="text-3xl font-black text-orange-600 mt-0.5">
                      {tryOnResult.scores.overallFitScore}/100
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                      ✓ Rất Phù Hợp Với Bạn
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t pt-3">
                  <div>
                    <span className="text-gray-500">Tôn dáng khuôn mặt:</span>
                    <div className="font-extrabold text-gray-900 mt-0.5">{tryOnResult.scores.faceHarmonization}% (Tạo cằm V-line)</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tỷ lệ dáng người:</span>
                    <div className="font-extrabold text-gray-900 mt-0.5">{tryOnResult.scores.bodyProportion}% ({tryOnResult.bodyAnalysis.bodyShapeType.split('(')[0]})</div>
                  </div>
                </div>

                {/* Phân tích Stylist */}
                <div className="space-y-1.5 border-t pt-3 text-xs text-gray-700">
                  {tryOnResult.feedback.map((f, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ưu đãi kích cầu Combo 15% & Quà tặng kèm */}
              <div className="bg-neutral-950 text-white rounded-2xl p-6 shadow-xl space-y-4 border border-white/10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      GIẢM 15% TRỌN BỘ
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">Ưu Đãi Combo Thử Đồ VibeBili</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-red-500">
                      {tryOnResult.comboPromotion.comboPrice.toLocaleString()} đ
                    </div>
                    <div className="text-xs text-gray-400 line-through">
                      {tryOnResult.comboPromotion.originalPrice.toLocaleString()} đ
                    </div>
                  </div>
                </div>

                {/* Quà tặng kèm theo nghiệp vụ 2.3 */}
                <div className="bg-white/10 rounded-xl p-3 text-xs space-y-1">
                  <span className="text-orange-400 font-bold block uppercase text-[10px]">🎁 Quà tặng kèm độc quyền:</span>
                  {tryOnResult.comboPromotion.freeGifts.map((gift, gIdx) => (
                    <div key={gIdx} className="text-gray-300 flex items-center space-x-1.5">
                      <CheckIcon className="w-3 h-3 text-orange-400" />
                      <span>{gift}</span>
                    </div>
                  ))}
                </div>

                {/* Nút hành động */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAddComboToCart}
                    className="flex-1 bg-white text-black font-black py-3.5 px-6 rounded-full text-xs uppercase tracking-wider hover:bg-gray-100 transition shadow flex items-center justify-center space-x-2 min-h-[44px]"
                  >
                    <ShoppingBagIcon className="w-4 h-4 text-black" />
                    <span>Thêm Cả Set Vào Giỏ</span>
                  </button>
                  <button
                    onClick={() => {
                      handleAddComboToCart();
                      if (onNavigateCheckout) onNavigateCheckout();
                    }}
                    className="flex-1 bg-orange-600 text-white font-black py-3.5 px-6 rounded-full text-xs uppercase tracking-wider hover:bg-orange-500 transition shadow flex items-center justify-center space-x-2 min-h-[44px]"
                  >
                    <LightningIcon className="w-4 h-4 text-white" />
                    <span>Mua Ngay Combo Này</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. BẢNG THUỘC TÍNH KỸ THUẬT CHUYÊN SÂU TÓC GIẢ (Theo nghiệp vụ 2.2) */}
      <div className="mt-16 bg-gray-100/70 rounded-2xl p-8 border border-gray-200">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <span className="text-xs font-black uppercase text-orange-600 tracking-wider">Tiêu Chuẩn Độc Quyền</span>
          <h3 className="text-xl font-black uppercase text-gray-900 mt-1">Bảng Thuộc Tính Kỹ Thuật Chuyên Sâu Cho Tóc Giả</h3>
          <p className="text-xs text-gray-500 mt-1">Được nghiên cứu và chuẩn hóa độc quyền tại VibeBili.vn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chất liệu sợi */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h4 className="text-sm font-bold uppercase text-gray-900 flex items-center space-x-1.5">
              <ShieldCheckIcon className="w-4 h-4 text-orange-600" />
              <span>Chất Liệu Sợi Tóc (Hair Fiber)</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-200">
                <span className="font-bold text-orange-900 block">👑 Tóc Thật 100% (100% Virgin Human Hair):</span>
                <p className="text-gray-600 mt-1">
                  Thu gom từ tóc người tự nhiên, sợi tóc có lớp biểu bì nguyên bản, độ mềm mượt hoàn hảo, có thể tẩy, nhuộm, uốn duỗi nhiệt độ cao lên đến 220°C, tuổi thọ 2 – 5 năm.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-bold text-gray-900 block">✨ Sợi Tơ Nhân Tạo Tơ Lụa Hàn Quốc (Korean Synthetic Silk):</span>
                <p className="text-gray-600 mt-1">
                  Không bị bóng lộ liễu dưới ánh đèn flash, chịu nhiệt an toàn từ 140°C – 180°C, phom dáng giữ nếp lâu dài, giá thành tiết kiệm.
                </p>
              </div>
            </div>
          </div>

          {/* Kích thước chu vi đầu */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <h4 className="text-sm font-bold uppercase text-gray-900 flex items-center space-x-1.5">
              <UserIcon className="w-4 h-4 text-orange-600" />
              <span>Kích Thước Chu Vi Vòng Đầu (Cap Size Guide)</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div>
                  <span className="font-bold text-gray-900 block">Size S (52 – 54cm)</span>
                  <span className="text-[11px] text-gray-500">Dành cho vòng đầu nhỏ hoặc thiếu niên</span>
                </div>
                <span className="bg-white border px-2.5 py-1 rounded text-[11px] font-semibold text-gray-700">Ôm sát</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-300 rounded-lg">
                <div>
                  <span className="font-bold text-orange-900 block">Size M (55 – 57cm)</span>
                  <span className="text-[11px] text-orange-700">Kích cỡ chuẩn cho 85% người trưởng thành</span>
                </div>
                <span className="bg-orange-600 text-white px-2.5 py-1 rounded text-[11px] font-bold">Phổ Biến Nhất</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div>
                  <span className="font-bold text-gray-900 block">Size L (58 – 60cm)</span>
                  <span className="text-[11px] text-gray-500">Dành cho chu vi vòng đầu lớn hoặc tóc thật dày</span>
                </div>
                <span className="bg-white border px-2.5 py-1 rounded text-[11px] font-semibold text-gray-700">Co giãn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualTryOn;
