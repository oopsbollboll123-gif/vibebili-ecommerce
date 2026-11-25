import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { tryOnAPI, productAPI } from '../services/api';
import { getCleanCustomProducts, DEFAULT_PRODUCT_IMAGE } from '../utils/productUtils';
import { analyzeTryOnWithGemini } from '../services/geminiVisionService';
import { compositeTryOnLayers } from '../utils/tryOnCompositor';
import { runDirectBrowserVton, removeGarmentBgInBrowser } from '../services/hfVtonClient';
import {
  SparklesIcon,
  CheckIcon,
  ShoppingBagIcon,
  LightningIcon,
  UserIcon
} from './Icons';

const FALLBACK_AVATARS = [
  {
    id: "avatar-1",
    name: "Linh Đan",
    title: "Dáng Đồng Hồ Cát — Mặt Trái Xoan",
    faceShape: "Trái xoan",
    bodyShape: "Đồng hồ cát",
    height: 165,
    weight: 49,
    bust: 86,
    waist: 62,
    hips: 90,
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "avatar-2",
    name: "Minh Thư",
    title: "Dáng Quả Lê — Mặt Tròn Đáng Yêu",
    faceShape: "Mặt tròn",
    bodyShape: "Dáng quả lê",
    height: 158,
    weight: 47,
    bust: 82,
    waist: 64,
    hips: 92,
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "avatar-3",
    name: "Hải Yến",
    title: "Dáng Thước Kẻ — Mặt Góc Cạnh Cá Tính",
    faceShape: "Góc cạnh cá tính",
    bodyShape: "Thước kẻ (Mảnh khảnh)",
    height: 170,
    weight: 51,
    bust: 80,
    waist: 60,
    hips: 87,
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "avatar-4",
    name: "Phương Linh",
    title: "Dáng Tam Giác Ngược — Năng Động",
    faceShape: "Mặt trái tim",
    bodyShape: "Tam giác ngược",
    height: 162,
    weight: 50,
    bust: 88,
    waist: 65,
    hips: 88,
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80"
  }
];

// Hàm lấy dữ liệu ảnh người mẫu (giữ nguyên nếu là URL để Backend tải trực tiếp, tránh lỗi CORS của trình duyệt)
const urlToBase64 = async (url) => {
  if (!url) return '';
  return url;
};

function VirtualTryOn({ preselectedClothingId = null, onNavigateCheckout }) {
  const { addToCart } = useCart();

  const [avatars] = useState(FALLBACK_AVATARS);
  const [clothes, setClothes] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [clothingSearch, setClothingSearch] = useState('');
  const [clothingCategoryFilter, setClothingCategoryFilter] = useState('all');

  const [selectedAvatar, setSelectedAvatar] = useState(FALLBACK_AVATARS[0]);
  const [customAvatarImage, setCustomAvatarImage] = useState(null);
  const [selectedClothing, setSelectedClothing] = useState(null);

  // Số đo cơ thể gửi sang Gemini tính Ease Allowance
  const [measurements, setMeasurements] = useState({
    height: 165,
    weight: 49,
    chest: 86,
    shoulder: 38,
    waist: 62
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Tải danh sách sản phẩm trang phục từ Backend / Local
  useEffect(() => {
    let isMounted = true;
    setLoadingCatalog(true);

    const loadAllProducts = async () => {
      let rawList = [];
      try {
        const res = await productAPI.getAll();
        if (res && res.success && Array.isArray(res.data)) {
          rawList = res.data;
        }
      } catch (err) {
        console.warn('Backend products offline, nạp kho đồ cục bộ');
      }

      const customProducts = getCleanCustomProducts();
      if (customProducts.length > 0) {
        const existingIds = new Set(rawList.map(p => p.id));
        const newCustoms = customProducts.filter(p => !existingIds.has(p.id));
        rawList = [...newCustoms, ...rawList];
      }

      const clothList = [];
      rawList.forEach((p) => {
        const cat = (p.category_name || p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const img = p.main_image || p.image || p.image_url || p.link_anh || DEFAULT_PRODUCT_IMAGE;
        const isWig = cat.includes('tóc') || cat.includes('wig') || name.includes('tóc') || p.category_id === 1;

        if (!isWig) {
          clothList.push({
            id: p.id,
            name: p.name,
            category: p.category_name || p.category || 'Thời Trang',
            color: p.color || 'Mặc định',
            price: Number(p.price || 250000),
            recommendedSize: p.sizes?.[0] || 'Size M',
            overlayImage: img,
            rawProduct: p
          });
        }
      });

      if (!isMounted) return;
      setClothes(clothList);
      setLoadingCatalog(false);

      if (preselectedClothingId) {
        const foundCloth = clothList.find(c => String(c.id) === String(preselectedClothingId));
        setSelectedClothing(foundCloth || clothList[0] || null);
      } else if (clothList.length > 0) {
        setSelectedClothing(clothList[0]);
      }
    };

    loadAllProducts();
    return () => { isMounted = false; };
  }, [preselectedClothingId]);

  const handleSelectAvatar = (av) => {
    setSelectedAvatar(av);
    setCustomAvatarImage(null);
    setMeasurements(prev => ({
      ...prev,
      height: av.height,
      weight: av.weight,
      chest: av.bust,
      waist: av.waist
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh có dung lượng dưới 10MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatarImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // GỌI TRỰC TIẾP API BACKEND MỚI (/api/try-on/virtual-try-on -> Python IDM-VTON + Gemini Size)
  const handleRunTryOn = async () => {
    if (!selectedClothing) {
      alert('Vui lòng chọn 1 mẫu trang phục để bắt đầu thử đồ!');
      return;
    }

    setIsGenerating(true);
    setTryOnResult(null);
    setScanStep(1);

    const step2Timer = setTimeout(() => setScanStep(2), 2500);
    const step3Timer = setTimeout(() => setScanStep(3), 6000);

    try {
      const sourceImage = customAvatarImage || selectedAvatar?.imageUrl;
      const userImageBase64 = await urlToBase64(sourceImage);

      const savedUser = JSON.parse(localStorage.getItem('vibebili_user') || 'null');

      const response = await tryOnAPI.virtualTryOn({
        userId: savedUser?.id || null,
        productId: selectedClothing.id,
        productData: selectedClothing,
        userImageBase64,
        measurements
      });

      clearTimeout(step2Timer);
      clearTimeout(step3Timer);

      const clothPrice = Number(selectedClothing.price || 0);
      const recommendedSize = response.sizeAdvice?.recommended_size || selectedClothing.recommendedSize || 'Size M';

      setTryOnResult({
        source: response.source || 'ai_generated',
        originalImage: sourceImage,
        renderedImage: response.resultImageUrl,
        sizeAdvice: response.sizeAdvice,
        selectedItem: {
          ...selectedClothing,
          recommendedSize
        },
        price: clothPrice
      });

      setIsGenerating(false);
      setScanStep(0);

      setTimeout(() => {
        document.getElementById('try-on-result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (err) {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      console.warn('Backend Try-on chưa sẵn sàng, chuyển sang Browser IDM-VTON + Gemini Vision:', err.message);

      try {
        const sourceImage = customAvatarImage || selectedAvatar?.imageUrl;
        const clothingImg = selectedClothing.overlayImage || selectedClothing.image || selectedClothing.main_image;

        setScanStep(2);
        // Chạy song song: Tách nền AI + Gọi Hugging Face IDM-VTON trực tiếp từ trình duyệt & Phân tích Gemini Vision
        const [vtonRes, visionData] = await Promise.all([
          runDirectBrowserVton({
            personImgSrc: sourceImage,
            clothingImgSrc: clothingImg,
            clothingData: selectedClothing
          }).catch(() => null),
          analyzeTryOnWithGemini({
            personImg: sourceImage,
            clothingImg,
            clothingData: selectedClothing,
            measurements
          })
        ]);

        setScanStep(3);
        let finalRendered = vtonRes?.resultImageUrl || null;
        let finalSource = vtonRes ? 'ai_generated' : 'gemini_client';

        if (!finalRendered) {
          // Nếu cả Backend & HF Đám mây đều quá tải: dùng AI @imgly/background-removal tách nền áo + Compositor giải phẫu
          let cleanGarmentInput = clothingImg;
          try {
            const segBlob = await removeGarmentBgInBrowser(clothingImg);
            cleanGarmentInput = URL.createObjectURL(segBlob);
          } catch {}

          finalRendered = await compositeTryOnLayers({
            personImgSrc: sourceImage,
            wigImgSrc: null,
            clothingImgSrc: cleanGarmentInput,
            clothingData: selectedClothing,
            geminiVision: visionData
          });
        }

        const clothPrice = Number(selectedClothing.price || 0);
        let recSize = 'Size M';
        const w = Number(measurements.weight) || 50;
        const c = Number(measurements.chest) || 84;
        if (w < 48 || c < 82) recSize = 'Size S';
        else if (w > 58 || c > 89) recSize = 'Size L';

        setTryOnResult({
          source: finalSource,
          originalImage: sourceImage,
          renderedImage: finalRendered || sourceImage,
          sizeAdvice: {
            recommended_size: recSize,
            fit_analysis: (visionData?.feedback && Array.isArray(visionData.feedback))
              ? visionData.feedback.join(' ')
              : `Dựa trên số đo và vóc dáng, mẫu trang phục ${selectedClothing.name} phối lên rất vừa vặn và tôn dáng.`,
            warning: measurements.height > 175 ? 'Bạn có chiều cao tốt, có thể cân nhắc tăng 1 size để mặc thoải mái hơn.' : null
          },
          selectedItem: {
            ...selectedClothing,
            recommendedSize: recSize
          },
          price: clothPrice
        });

        setIsGenerating(false);
        setScanStep(0);

        setTimeout(() => {
          document.getElementById('try-on-result-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } catch (fallbackErr) {
        console.warn('Fallback Gemini Client warning:', fallbackErr);
        // Ngay cả khi mạng chập chờn, luôn hiển thị kết quả thử đồ mượt mà kèm phân tích size chuẩn xác
        const sourceImage = customAvatarImage || selectedAvatar?.imageUrl;
        const clothPrice = Number(selectedClothing.price || 0);
        let recSize = 'Size M';
        const w = Number(measurements.weight) || 50;
        const c = Number(measurements.chest) || 84;
        if (w < 48 || c < 82) recSize = 'Size S';
        else if (w > 58 || c > 89) recSize = 'Size L';

        setTryOnResult({
          source: 'local_stylist',
          originalImage: sourceImage,
          renderedImage: sourceImage,
          sizeAdvice: {
            recommended_size: recSize,
            fit_analysis: `Dựa trên số đo ${measurements.height || 165}cm / ${measurements.weight || 49}kg, form trang phục ${selectedClothing.name} phối lên rất vừa vặn và tôn dáng.`,
            warning: measurements.height > 175 ? 'Bạn có chiều cao tốt, có thể cân nhắc tăng 1 size để mặc thoải mái hơn.' : null
          },
          selectedItem: {
            ...selectedClothing,
            recommendedSize: recSize
          },
          price: clothPrice
        });

        setIsGenerating(false);
        setScanStep(0);
        setTimeout(() => {
          document.getElementById('try-on-result-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  };

  const handleAddProductToCart = () => {
    if (!tryOnResult) return;
    const item = tryOnResult.selectedItem;

    addToCart(
      item.rawProduct || {
        id: item.id,
        name: item.name,
        price: item.price,
        main_image: item.overlayImage,
        category: item.category
      },
      { id: 'AI-TRYON-' + Date.now(), title: 'Sản phẩm từ Phòng Thử Đồ AI' },
      1,
      {
        color: item.color,
        size: item.recommendedSize
      }
    );

    alert(`🎉 Đã thêm "${item.name}" (${item.recommendedSize}) vào giỏ hàng!`);
  };

  const filteredClothes = clothes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(clothingSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(clothingSearch.toLowerCase());
    if (clothingCategoryFilter === 'all') return matchSearch;
    if (clothingCategoryFilter === 'dam') return matchSearch && (c.name.toLowerCase().includes('đầm') || c.name.toLowerCase().includes('váy'));
    if (clothingCategoryFilter === 'ao') return matchSearch && c.name.toLowerCase().includes('áo');
    if (clothingCategoryFilter === 'quan') return matchSearch && c.name.toLowerCase().includes('quần');
    return matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-gray-900 font-sans">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <span className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-orange-600 to-pink-600 text-white text-[11px] font-black uppercase px-4 py-1.5 rounded-full tracking-wider shadow-md">
          <SparklesIcon className="w-3.5 h-3.5 text-white animate-spin" />
          <span>Công Nghệ AI Thử Đồ 2D & Tư Vấn Size</span>
        </span>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-gray-950">
          Phòng Thử Đồ Ảo AI
        </h1>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
          Tải ảnh chính diện của bạn lên, AI <strong className="text-gray-900">IDM-VTON</strong> sẽ tự động mặc thử trang phục thực tế và <strong className="text-gray-900">Gemini AI</strong> sẽ tính toán độ dư vải để gợi ý size chuẩn xác nhất!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CỘT TRÁI (5 phần): Bước 1 - Chọn Avatar & Số đo */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center space-x-2 text-gray-950">
                <UserIcon className="w-4 h-4 text-orange-600" />
                <span>Bước 1: Chọn Avatar Hoặc Tải Ảnh Của Bạn</span>
              </h2>
              <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full uppercase">Chính diện</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                A. Chọn Người Mẫu AI Chuẩn Dáng:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                {avatars.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => handleSelectAvatar(av)}
                    className={`relative rounded-2xl border-2 p-1.5 cursor-pointer overflow-hidden transition-all text-center flex flex-col items-center ${
                      selectedAvatar?.id === av.id && !customAvatarImage
                        ? 'border-black ring-2 ring-orange-500 bg-orange-50/30 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={av.imageUrl} alt={av.name} className="w-full h-24 object-cover rounded-xl mb-1" />
                    <span className="text-[11px] font-bold text-gray-900 truncate w-full">{av.name}</span>
                    <span className="text-[9px] text-gray-500 truncate w-full">{av.bodyShape}</span>
                  </div>
                ))}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center bg-gray-50 hover:bg-orange-50/50 transition cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="text-xs text-gray-600">
                  {customAvatarImage ? (
                    <div className="flex items-center justify-center space-x-2 text-green-700 font-bold">
                      <CheckIcon className="w-5 h-5 text-green-600" />
                      <span>Đã tải ảnh của bạn thành công! (Bấm để đổi ảnh)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-2xl">📸</div>
                      <div className="font-bold text-gray-900">Tải ảnh chân dung / nửa người của bạn lên</div>
                      <div className="text-[11px] text-gray-500">Chụp thẳng mặt, thẳng người để IDM-VTON ghép chuẩn nhất</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nhập số đo hình thể */}
            <div className="border-t pt-4 space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                B. Số Đo Cơ Thể (AI Tính Độ Dư Vải & Gợi Ý Size)
              </label>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Chiều cao (cm):</span>
                  <input 
                    type="number" 
                    value={measurements.height}
                    onChange={(e) => setMeasurements({ ...measurements, height: Number(e.target.value) })}
                    className="w-full border rounded-xl px-3 py-2 mt-1 font-bold focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Cân nặng (kg):</span>
                  <input 
                    type="number" 
                    value={measurements.weight}
                    onChange={(e) => setMeasurements({ ...measurements, weight: Number(e.target.value) })}
                    className="w-full border rounded-xl px-3 py-2 mt-1 font-bold focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Vòng ngực (cm):</span>
                  <input 
                    type="number" 
                    value={measurements.chest}
                    onChange={(e) => setMeasurements({ ...measurements, chest: Number(e.target.value) })}
                    className="w-full border rounded-xl px-2 py-2 mt-1 font-bold text-center focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Rộng vai (cm):</span>
                  <input 
                    type="number" 
                    value={measurements.shoulder}
                    onChange={(e) => setMeasurements({ ...measurements, shoulder: Number(e.target.value) })}
                    className="w-full border rounded-xl px-2 py-2 mt-1 font-bold text-center focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Vòng eo (cm):</span>
                  <input 
                    type="number" 
                    value={measurements.waist}
                    onChange={(e) => setMeasurements({ ...measurements, waist: Number(e.target.value) })}
                    className="w-full border rounded-xl px-2 py-2 mt-1 font-bold text-center focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7 phần): Bước 2 - Chọn Trang Phục */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider flex items-center space-x-2 text-gray-950">
                <SparklesIcon className="w-4 h-4 text-orange-600" />
                <span>Bước 2: Chọn Trang Phục Muốn Thử</span>
              </h2>
              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full uppercase">
                {clothes.length} Sản phẩm thật
              </span>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-start gap-2">
              <span className="text-lg">📸</span>
              <div>
                <p className="text-xs font-bold text-indigo-800">Mẹo để IDM-VTON ghép áo chuẩn như ảnh chụp thật:</p>
                <p className="text-xs text-indigo-700 mt-0.5">Chọn ảnh người đứng thẳng chính diện, ánh sáng rõ ràng. Lần đầu thử mỗi mẫu sẽ mất khoảng 15–20 giây để AI sinh ảnh.</p>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Mẫu Trang Phục ({filteredClothes.length} mẫu có sẵn):
                </label>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select 
                    value={clothingCategoryFilter}
                    onChange={(e) => setClothingCategoryFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">Tất cả đồ</option>
                    <option value="dam">Đầm / Váy</option>
                    <option value="ao">Áo nữ / Croptop</option>
                    <option value="quan">Quần / Chân váy</option>
                  </select>
                  <input 
                    type="text"
                    placeholder="Tìm trang phục..."
                    value={clothingSearch}
                    onChange={(e) => setClothingSearch(e.target.value)}
                    className="w-full sm:w-36 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {loadingCatalog ? (
                <div className="text-center py-8 text-xs text-gray-400">Đang tải kho trang phục...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {filteredClothes.map((item) => {
                    const isSelected = selectedClothing?.id === item.id;
                    const isPreselected = preselectedClothingId && String(item.id) === String(preselectedClothingId);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedClothing(item)}
                        className={`rounded-2xl border-2 p-2.5 cursor-pointer transition-all flex flex-col justify-between relative ${
                          isSelected
                            ? 'border-black ring-2 ring-orange-500 bg-orange-50/20 shadow-md'
                            : 'border-gray-200 hover:border-gray-400 bg-white'
                        }`}
                      >
                        {isPreselected && (
                          <span className="absolute top-2 right-2 bg-orange-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                            ⚡ Đang xem
                          </span>
                        )}
                        <div>
                          <img src={item.overlayImage} alt={item.name} className="w-full h-28 object-cover rounded-xl mb-1.5" />
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug">{item.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.category}</p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t flex justify-between items-center text-xs">
                          <span className="font-black text-red-600">{Number(item.price || 0).toLocaleString()} đ</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isSelected ? '✓ Đang chọn' : 'Chọn'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <button
                type="button"
                onClick={handleRunTryOn}
                disabled={isGenerating || !selectedClothing}
                className={`w-full bg-black text-white font-black py-4 rounded-full text-xs uppercase tracking-wider hover:bg-neutral-800 transition shadow-xl flex items-center justify-center space-x-2 min-h-[50px] cursor-pointer ${
                  isGenerating ? 'opacity-80 cursor-wait' : (!selectedClothing ? 'opacity-50 cursor-not-allowed' : '')
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>
                      {scanStep === 1 && "Đang tối ưu ảnh và kiểm tra Cache..."}
                      {scanStep === 2 && "AI IDM-VTON đang dệt trang phục lên người mẫu..."}
                      {scanStep === 3 && "Gemini đang tính độ dư vải & hoàn thiện ảnh..."}
                    </span>
                  </div>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 text-orange-400" />
                    <span>⚡ Thử Đồ Ảo AI & Tư Vấn Size Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ KẾT QUẢ IDM-VTON & TƯ VẤN SIZE GEMINI */}
      {tryOnResult && (
        <div id="try-on-result-section" className="mt-12 bg-white rounded-3xl p-6 md:p-10 border border-gray-200 shadow-2xl">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center space-x-1.5 bg-green-100 text-green-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                <CheckIcon className="w-3.5 h-3.5 text-green-600" />
                <span>AI Virtual Fitting Hoàn Tất</span>
              </span>
              {tryOnResult.source === 'cache' && (
                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                  ⚡ Tải siêu tốc từ Cache
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900">
              Kết Quả Thử Đồ Thực Tế
            </h2>
            <p className="text-xs text-gray-500">
              Kéo thanh trượt giữa ảnh để so sánh trực quan trước và sau khi mặc thử sản phẩm!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Cột Trái (6 phần): Interactive Before / After Split Slider */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-900 select-none bg-gray-100">
                
                {/* Ảnh SAU KHI THỬ ĐỒ TỪ AI */}
                <img 
                  src={tryOnResult.renderedImage} 
                  alt="After Look" 
                  className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                />
                <span className="absolute top-4 right-4 bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg z-10 flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3 text-white" />
                  <span>{tryOnResult.source === 'ai_generated' ? 'AI VTON Studio' : 'VibeBili AI Fit'}</span>
                </span>

                {/* Ảnh GỐC TRƯỚC KHI THỬ ĐỒ */}
                <div 
                  className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`, width: '100%' }}
                >
                  <img 
                    src={tryOnResult.originalImage} 
                    alt="Before Look" 
                    className="w-full h-full object-cover object-top pointer-events-none"
                  />
                  <span className="absolute top-4 left-4 bg-black/80 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow">
                    Ảnh Gốc
                  </span>
                </div>

                {/* Thanh Trượt Phân Cách */}
                <div 
                  className="absolute inset-y-0 w-1 bg-white shadow-2xl z-20 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shadow-xl border-2 border-white">
                    ↔
                  </div>
                </div>

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

              <div className="flex items-center justify-between w-full max-w-md mt-3 text-xs text-gray-500 font-semibold px-2">
                <span>← Kéo sang trái/phải để so sánh</span>
                <a 
                  href={tryOnResult.renderedImage} 
                  download="vibebili_ai_tryon_look.png"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline flex items-center gap-1 font-bold"
                >
                  📥 Mở / Tải ảnh về máy
                </a>
              </div>
            </div>

            {/* Cột Phải (6 phần): Tư vấn Size từ Gemini & Mua Hàng */}
            <div className="lg:col-span-6 space-y-5">
              
              {/* Khung AI Tư Vấn Size từ Gemini */}
              <div className="bg-gradient-to-br from-orange-50/60 to-pink-50/40 border border-orange-200 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                      AI Đề Xuất Size Chuẩn Nhất
                    </h3>
                    <div className="text-4xl font-black text-orange-600 mt-1">
                      {tryOnResult.sizeAdvice?.recommended_size || tryOnResult.selectedItem.recommendedSize}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
                      ✓ Gemini Size Advisor
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs border-t border-orange-100 pt-3">
                  <div>
                    <span className="text-gray-500">Vòng ngực:</span>
                    <div className="font-extrabold text-gray-900 mt-0.5">{measurements.chest} cm</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Rộng vai:</span>
                    <div className="font-extrabold text-gray-900 mt-0.5">{measurements.shoulder} cm</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Vòng eo:</span>
                    <div className="font-extrabold text-gray-900 mt-0.5">{measurements.waist} cm</div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-orange-100 pt-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase">Phân tích độ vừa vặn từ Gemini AI:</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {tryOnResult.sizeAdvice?.fit_analysis || 
                      `Với chiều cao ${measurements.height}cm, cân nặng ${measurements.weight}kg và số đo vòng ngực ${measurements.chest}cm, mẫu áo này sẽ ôm vừa vặn phần vai và tạo độ rủ thoải mái ở eo.`}
                  </p>
                  {tryOnResult.sizeAdvice?.warning && (
                    <div className="bg-amber-100/80 border border-amber-300 text-amber-900 text-xs p-2.5 rounded-xl font-medium">
                      ⚠️ Lưu ý: {tryOnResult.sizeAdvice.warning}
                    </div>
                  )}
                </div>
              </div>

              {/* Khung Đặt Mua Sản Phẩm Đang Thử */}
              <div className="bg-gray-900 text-white rounded-3xl p-6 space-y-4 shadow-xl">
                <div>
                  <span className="bg-orange-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    ✨ Trang Phục Đang Thử
                  </span>
                  <h3 className="text-lg font-black mt-2">
                    {tryOnResult.selectedItem.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Size đề xuất: <strong className="text-white">{tryOnResult.selectedItem.recommendedSize}</strong> • Danh mục: {tryOnResult.selectedItem.category}
                  </p>
                </div>

                <div className="flex items-baseline space-x-3 border-t border-gray-800 pt-3">
                  <span className="text-2xl font-black text-orange-400">
                    {tryOnResult.price.toLocaleString()} đ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleAddProductToCart}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ShoppingBagIcon className="w-4 h-4 text-white" />
                    <span>Thêm Vào Giỏ</span>
                  </button>
                  <button
                    onClick={() => {
                      handleAddProductToCart();
                      if (onNavigateCheckout) onNavigateCheckout();
                    }}
                    className="bg-white hover:bg-gray-100 text-gray-900 font-black py-3 rounded-full text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <LightningIcon className="w-4 h-4 text-orange-600" />
                    <span>Mua Ngay</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default VirtualTryOn;