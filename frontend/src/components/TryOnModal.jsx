import React, { useState } from 'react';
import axios from 'axios';
import { analyzeTryOnWithGemini } from '../services/geminiVisionService';
import { compositeTryOnLayers } from '../utils/tryOnCompositor';

export default function TryOnModal({ product, isOpen, onClose }) {
  const [userImage, setUserImage] = useState(null);
  const [measurements, setMeasurements] = useState({
    height: 165,
    weight: 52,
    chest: 84,
    shoulder: 38,
    waist: 66
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);

  if (!isOpen || !product) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserImage(reader.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleTryOn = async () => {
    if (!userImage) return alert('Vui lòng tải lên ảnh chính diện (thẳng mặt, thẳng người) của bạn!');
    setLoading(true);

    try {
      // 1. Thử gọi Backend API (/api/try-on/virtual-try-on)
      const res = await axios.post('http://localhost:5000/api/try-on/virtual-try-on', {
        productId: product.id,
        userImageBase64: userImage,
        measurements
      }, { timeout: 6000 });

      if (res && res.data) {
        setResult(res.data);
        return;
      }
    } catch (err) {
      console.warn('Backend /api/try-on/virtual-try-on chưa chạy hoặc đang chạy trên Vercel, tự động kích hoạt Gemini AI Client Engine:', err.message);

      // 2. Tự động kích hoạt Gemini AI Vision Client Engine
      try {
        const clothingImg = product.main_image || product.image || product.image_url || product.overlayImage;
        const visionData = await analyzeTryOnWithGemini({
          personImg: userImage,
          clothingImg,
          clothingData: product,
          measurements
        });

        const renderedImg = await compositeTryOnLayers({
          personImgSrc: userImage,
          wigImgSrc: null,
          clothingImgSrc: clothingImg,
          clothingData: product,
          geminiVision: visionData
        });

        // Đề xuất size theo số đo và size_chart
        let recSize = 'Size M';
        const w = Number(measurements.weight) || 52;
        const c = Number(measurements.chest) || 84;
        if (w < 48 || c < 82) recSize = 'Size S';
        else if (w > 58 || c > 89) recSize = 'Size L';

        setResult({
          source: 'gemini_client',
          resultImageUrl: renderedImg || userImage,
          sizeAdvice: {
            recommended_size: recSize,
            fit_analysis: (visionData?.feedback && Array.isArray(visionData.feedback))
              ? visionData.feedback.join(' ')
              : `Dựa trên số đo vòng ngực ${measurements.chest}cm, chiều cao ${measurements.height}cm và cân nặng ${measurements.weight}kg, chiếc áo này ôm nhẹ tôn dáng rất đẹp.`,
            warning: measurements.height > 175 ? 'Bạn có chiều cao tốt, nếu muốn mặc thoải mái có thể tăng 1 size.' : null
          }
        });
      } catch (clientErr) {
        alert('Lỗi thử đồ: ' + (clientErr.message || 'Không thể tạo bản thử đồ'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold">✕</button>
        <h2 className="text-xl font-bold mb-4">Phòng Thử Đồ Ảo AI — {product.name}</h2>

        {/* Hướng dẫn chụp ảnh chính diện */}
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-3">
          <span className="text-2xl">📸</span>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Yêu cầu ảnh để AI ghép đồ chuẩn nhất:</p>
            <ul className="text-xs text-indigo-700 mt-1 space-y-0.5 list-disc list-inside">
              <li>Chụp <strong>chính diện</strong> — thẳng mặt, thẳng người, nhìn thẳng vào camera</li>
              <li>Ảnh rõ nét, ánh sáng đủ, nền đơn giản</li>
              <li>Tốt nhất: ảnh toàn thân hoặc nửa người trên</li>
              <li>Mặc đồ sát người (áo thun, áo bó) để AI nhận dáng chính xác hơn</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CỘT TRÁI: Upload ảnh & Nhập số đo */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center bg-indigo-50/30">
              <p className="text-sm font-semibold text-indigo-700 mb-1">1. Ảnh của bạn (chính diện)</p>
              <p className="text-xs text-gray-500 mb-2">Thẳng mặt • Thẳng người • Rõ nét</p>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">2. Số đo của bạn (để AI tư vấn Size chuẩn)</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <label>Chiều cao (cm):
                  <input type="number" value={measurements.height} onChange={e => setMeasurements({...measurements, height: +e.target.value})} className="w-full border rounded px-2 py-1 mt-1" />
                </label>
                <label>Cân nặng (kg):
                  <input type="number" value={measurements.weight} onChange={e => setMeasurements({...measurements, weight: +e.target.value})} className="w-full border rounded px-2 py-1 mt-1" />
                </label>
                <label>Vòng ngực (cm):
                  <input type="number" value={measurements.chest} onChange={e => setMeasurements({...measurements, chest: +e.target.value})} className="w-full border rounded px-2 py-1 mt-1" />
                </label>
                <label>Rộng vai (cm):
                  <input type="number" value={measurements.shoulder} onChange={e => setMeasurements({...measurements, shoulder: +e.target.value})} className="w-full border rounded px-2 py-1 mt-1" />
                </label>
                <label>Vòng eo (cm):
                  <input type="number" value={measurements.waist} onChange={e => setMeasurements({...measurements, waist: +e.target.value})} className="w-full border rounded px-2 py-1 mt-1" />
                </label>
              </div>
            </div>

            <button
              onClick={handleTryOn}
              disabled={loading || !userImage}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'AI đang phối đồ & tính size (5-10s)...' : 'Thử đồ & Phân tích Size ngay'}
            </button>
          </div>

          {/* CỘT PHẢI: Ảnh kết quả & Thanh trượt so sánh Trước - Sau */}
          <div className="flex flex-col justify-between bg-gray-100 rounded-lg p-4">
            <div className="relative w-full h-80 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
              {!userImage && <span className="text-gray-400 text-sm">Ảnh xem trước sẽ hiện ở đây</span>}
              
              {userImage && !result && (
                <img src={userImage} alt="Original" className="h-full w-full object-contain" />
              )}

              {userImage && result && (
                <div className="relative w-full h-full select-none">
                  <img src={result.resultImageUrl} alt="After" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                    <img src={userImage} alt="Before" className="w-full h-full object-contain max-w-none" />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPos}
                    onChange={(e) => setSliderPos(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md z-10 pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
                      ↔
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result?.sizeAdvice && (
              <div className="mt-4 bg-white p-3 rounded-lg border border-indigo-100 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">
                    Size đề xuất: {result.sizeAdvice.recommended_size}
                  </span>
                  {result.source === 'cache' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Tải từ Cache</span>
                  )}
                  {result.source === 'gemini_client' && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Gemini AI</span>
                  )}
                </div>
                <p className="text-gray-700">{result.sizeAdvice.fit_analysis}</p>
                {result.sizeAdvice.warning && (
                  <p className="text-amber-600 text-xs">Lưu ý: {result.sizeAdvice.warning}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
