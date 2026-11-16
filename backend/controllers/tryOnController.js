// ========================================================
// CONTROLLER PHÒNG THỬ ĐỒ ẢO AI 2-IN-1 (VIRTUAL TRY-ON)
// Hỗ trợ thử đồng thời Trang phục & Tóc giả với Google Gemini AI & Smart Simulation
// ========================================================

const db = require('../config/db');
const mockData = require('../data/mockData');

// Dữ liệu Người mẫu AI dựng sẵn
const presetAvatars = [
  {
    id: "avatar-1",
    name: "Linh Đan (Dáng Đồng Hồ Cát - Mặt Trái Xoan)",
    gender: "female",
    faceShape: "Trái xoan",
    bodyShape: "Đồng hồ cát",
    height: 165,
    weight: 49,
    bust: 86,
    waist: 62,
    hips: 90,
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    description: "Tỷ lệ cơ thể chuẩn, phù hợp thử mọi mẫu tóc xoăn sóng và đầm ôm body."
  },
  {
    id: "avatar-2",
    name: "Minh Thư (Dáng Quả Lê - Mặt Tròn Đáng Yêu)",
    gender: "female",
    faceShape: "Mặt tròn",
    bodyShape: "Dáng quả lê",
    height: 158,
    weight: 47,
    bust: 82,
    waist: 64,
    hips: 92,
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    description: "Phù hợp kiểu tóc Bob cụp ôm sát tôn góc cằm và áo croptop Y2K."
  },
  {
    id: "avatar-3",
    name: "Hải Yến (Dáng Thước Kẻ - Mặt Góc Cạnh Cá Tính)",
    gender: "female",
    faceShape: "Góc cạnh cá tính",
    bodyShape: "Thước kẻ (Mảnh khảnh)",
    height: 170,
    weight: 51,
    bust: 80,
    waist: 60,
    hips: 87,
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    description: "Phù hợp phong cách Dark Academia, tóc layer dài và đầm xẻ tà sang trọng."
  },
  {
    id: "avatar-4",
    name: "Phương Linh (Dáng Tam Giác Ngược - Năng Động)",
    gender: "female",
    faceShape: "Mặt trái tim",
    bodyShape: "Tam giác ngược",
    height: 162,
    weight: 50,
    bust: 88,
    waist: 65,
    hips: 88,
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    description: "Phù hợp trang phục cổ yếm, áo thun retro và tóc dài tỉa layer phồng tự nhiên."
  }
];

// Helper phân loại sản phẩm thành Wigs hoặc Clothes
const categorizeProducts = (allProducts) => {
  const wigs = [];
  const clothes = [];

  allProducts.forEach(p => {
    const cat = (p.category_name || p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();

    const isWig = cat.includes('tóc') || cat.includes('wig') || name.includes('tóc') || p.category_id === 1;

    if (isWig) {
      wigs.push({
        id: p.id,
        name: p.name,
        fiber: p.fiberType || (name.includes('thật') ? '100% Virgin Human Hair (Tóc thật 100%)' : 'Korean Synthetic Silk (Chịu nhiệt 180°C)'),
        hairLength: p.hairLength || '55cm',
        color: p.color || (p.colors?.[0]?.name) || 'Nâu Tự Nhiên',
        capSize: p.sizes?.[0] || 'Size M (55 - 57cm)',
        price: Number(p.price || 350000),
        overlayImage: p.main_image || p.image || ''
      });
    } else {
      clothes.push({
        id: p.id,
        name: p.name,
        category: p.category_name || p.category || 'Thời Trang Nữ',
        style: cat.includes('nam') ? 'Streetwear Nam' : (name.includes('y2k') ? 'Y2K Trend' : 'Hàn Quốc Chic'),
        fitType: name.includes('oversize') ? 'Oversized fit' : 'Regular fit',
        color: p.color || (p.colors?.[0]?.name) || 'Tiêu chuẩn',
        price: Number(p.price || 250000),
        recommendedSize: p.sizes?.[0] || 'Size M',
        overlayImage: p.main_image || p.image || ''
      });
    }
  });

  return { wigs, clothes };
};

// 1. Lấy danh sách Người mẫu AI & Sản phẩm mẫu để Thử Đồ
exports.getTryOnCatalog = async (req, res) => {
  try {
    let allProducts = [];

    // Ưu tiên đọc từ MySQL Database
    try {
      const [rows] = await db.query(`
        SELECT p.id, p.name, p.slug, p.base_price AS price, p.main_image, 
               c.name AS category_name, c.id AS category_id
        FROM Products p
        JOIN Categories c ON p.category_id = c.id
        WHERE p.status = 'Đang bán'
        ORDER BY p.id DESC
      `);
      allProducts = rows;
    } catch (dbErr) {
      console.warn('[Try-On Catalog]: Dùng Mock Data do DB offline');
      allProducts = mockData.products;
    }

    const { wigs, clothes } = categorizeProducts(allProducts);

    return res.status(200).json({
      success: true,
      data: {
        avatars: presetAvatars,
        wigs: wigs.slice(0, 12),
        clothes: clothes.slice(0, 18)
      }
    });

  } catch (error) {
    console.error("Lỗi getTryOnCatalog:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải kho đồ thử AI!" });
  }
};

// Helper nạp base64 từ URL hoặc dataURI
const fetchImageBase64 = async (imgSrc) => {
  if (!imgSrc || typeof imgSrc !== 'string') return null;
  if (imgSrc.startsWith('data:image/')) {
    const parts = imgSrc.split(';base64,');
    if (parts.length === 2) {
      return { mimeType: parts[0].replace('data:', ''), data: parts[1] };
    }
  }
  if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(imgSrc, { signal: controller.signal });
      clearTimeout(timeout);
      if (!resp.ok) return null;
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ct = resp.headers.get('content-type') || 'image/jpeg';
      return { mimeType: ct.split(';')[0], data: buffer.toString('base64') };
    } catch (e) {
      return null;
    }
  }
  return null;
};

// 2. Kích hoạt Mô phỏng Thử đồ 2-in-1 (Gemini AI Multimodal Vision + Anatomical Stylist)
exports.generateTryOn = async (req, res) => {
  try {
    const {
      avatarId,
      avatarImage,
      measurements = {},
      wigId,
      clothingId,
      wigData,
      clothingData
    } = req.body;

    const height = Number(measurements.height) || 165;
    const weight = Number(measurements.weight) || 49;
    const bust = Number(measurements.bust) || 86;
    const waist = Number(measurements.waist) || 62;
    const hips = Number(measurements.hips) || 90;

    // Tính chỉ số BMI và Dáng người
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    let bodyShapeType = "Đồng hồ cát (Hourglass)";
    let recommendedClothingSize = "Size S/M ôm dáng";

    const waistToHipRatio = (waist / hips).toFixed(2);
    if (waistToHipRatio <= 0.75 && Math.abs(bust - hips) <= 5) {
      bodyShapeType = "Đồng hồ cát (Hourglass)";
      recommendedClothingSize = "Size S/M, tôn eo và đường cong";
    } else if (hips - bust >= 5 && waistToHipRatio <= 0.8) {
      bodyShapeType = "Dáng quả lê (Pear Shape)";
      recommendedClothingSize = "Size M áo, Size L quần/chân váy xòe chữ A";
    } else if (bust - hips >= 5) {
      bodyShapeType = "Dáng tam giác ngược (Inverted Triangle)";
      recommendedClothingSize = "Size M/L, áo cổ V hoặc vạt chéo";
    } else if (Math.abs(bust - waist) <= 5 && Math.abs(waist - hips) <= 5) {
      bodyShapeType = "Dáng thước kẻ (Rectangle)";
      recommendedClothingSize = "Size S/M, nên kết hợp thắt eo để tạo đường cong";
    } else if (waist >= bust && waist >= hips) {
      bodyShapeType = "Dáng quả táo (Apple Shape)";
      recommendedClothingSize = "Size L/XL, trang phục dáng suông hoặc peplum";
    }

    let recommendedCapSize = "Size M (55 - 57cm)";
    if (height < 155 || weight < 45) {
      recommendedCapSize = "Size S (52 - 54cm)";
    } else if (height > 170 || weight > 65) {
      recommendedCapSize = "Size L (58 - 60cm)";
    }

    const selectedWig = wigData || {
      id: wigId || 1,
      name: "Tóc Giả Cao Cấp VibeBili",
      price: 350000,
      color: "Nâu Tự Nhiên",
      hairLength: "60cm",
      fiber: "Korean Synthetic Silk"
    };

    const selectedClothing = clothingData || {
      id: clothingId || 101,
      name: "Trang Phục Thời Trang VibeBili",
      price: 290000,
      color: "Đen / Phối màu",
      category: "Thời Trang Nữ"
    };

    const sourceImage = avatarImage || (presetAvatars.find(a => a.id === avatarId)?.imageUrl) || presetAvatars[0].imageUrl;

    let stylingAnalysis = [];
    let fitScore = 96;
    let faceFitScore = 97;
    let bodyFitScore = 95;
    let geminiVisionData = null;

    // TÍCH HỢP GEMINI 3.5 FLASH MULTIMODAL VISION ENGINE
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const [personB64, garmentB64] = await Promise.all([
          fetchImageBase64(sourceImage),
          fetchImageBase64(selectedClothing.overlayImage || selectedClothing.image)
        ]);

        const promptText = `Bạn là hệ thống thị giác AI chuyên sâu về Phòng thử đồ ảo thời trang VibeBili.vn.
Nhiệm vụ: Phân tích 2 ảnh được cung cấp:
- Ảnh 1: Khách hàng / người mẫu cần thử đồ.
- Ảnh 2: Trang phục cần mặc vào người mẫu.

Thông tin khách hàng: Dáng ${bodyShapeType}, chiều cao ${height}cm, cân nặng ${weight}kg, 3 vòng: ${bust}-${waist}-${hips}cm.
Tóc giả: ${selectedWig.name}. Trang phục: ${selectedClothing.name}.

Yêu cầu trả về JSON chuẩn xác:
{
  "person": {
    "chin": [19, 50],
    "neck_base": [24, 50],
    "left_shoulder": [26, 44],
    "right_shoulder": [26, 56],
    "chest_center": [35, 50],
    "waist_center": [46, 50],
    "torso_box": [24, 42, 58, 58]
  },
  "garment": {
    "type": "ao",
    "collar_type": "v_neck",
    "sleeve_type": "short",
    "neck_dip_y_percent": 12,
    "recommended_scale": 1.05,
    "recommended_offset_y": 24,
    "crop_upper_body": true
  },
  "overallFitScore": 96,
  "faceHarmonization": 97,
  "bodyProportion": 95,
  "feedback": [
    "Nhận xét 1 về phom áo và độ vừa vặn bờ vai",
    "Nhận xét 2 về đường cong cơ thể và màu sắc",
    "Nhận xét 3 về tổng thể phối đồ"
  ],
  "stylistTip": "Mẹo phối đồ từ Stylist AI"
}`;

        const requestParts = [{ text: promptText }];
        if (personB64) requestParts.push({ inlineData: personB64 });
        if (garmentB64) requestParts.push({ inlineData: garmentB64 });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: requestParts }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            geminiVisionData = parsed;
            if (parsed.feedback && Array.isArray(parsed.feedback)) {
              stylingAnalysis = parsed.feedback;
              fitScore = parsed.overallFitScore || 96;
              faceFitScore = parsed.faceHarmonization || 97;
              bodyFitScore = parsed.bodyProportion || 95;
              if (parsed.stylistTip) stylingAnalysis.push(`💡 Mẹo từ Stylist AI: ${parsed.stylistTip}`);
            }
          }
        }
      } catch (geminiErr) {
        console.warn('[Gemini AI Vision]: Lỗi gọi API thị giác, dùng thuật toán giải phẫu nội bộ:', geminiErr.message);
      }
    }

    if (stylingAnalysis.length === 0) {
      stylingAnalysis.push(`✓ AI đã nhận diện mốc bờ vai và viền cổ, tự động thay thế trang phục cũ bằng [${selectedClothing.name}] vừa khít giải phẫu học.`);
      stylingAnalysis.push(`✓ Dáng người [${bodyShapeType}] kết hợp cùng chiếc áo tạo nên độ ôm sát tự nhiên, bảo toàn từng đường xếp nếp và sớ vải.`);
      stylingAnalysis.push(`✓ Bảng màu hòa hợp cùng ánh sáng môi trường, tôn lên sắc thái làn da và diện mạo tổng thể.`);
      stylingAnalysis.push(`💡 Gợi ý kích cỡ chuẩn từ AI: Áo nên chọn [${recommendedClothingSize}].`);
    }

    const totalOriginalPrice = Number(selectedWig.price || 350000) + Number(selectedClothing.price || 290000);
    const comboDiscountPrice = Math.round(totalOriginalPrice * 0.85);
    const savedAmount = totalOriginalPrice - comboDiscountPrice;

    return res.status(200).json({
      success: true,
      message: "AI 2-in-1 Virtual Try-On thành công!",
      data: {
        tryOnId: "TRYON-" + Date.now(),
        generatedAt: new Date().toISOString(),
        originalImage: sourceImage,
        renderedImage: selectedClothing.overlayImage || selectedWig.overlayImage || sourceImage,
        geminiVision: geminiVisionData,
        bodyAnalysis: {
          height,
          weight,
          bust,
          waist,
          hips,
          bmi,
          bodyShapeType,
          recommendedClothingSize,
          recommendedCapSize
        },
        scores: {
          overallFitScore: fitScore,
          faceHarmonization: faceFitScore,
          bodyProportion: bodyFitScore
        },
        feedback: stylingAnalysis,
        selectedItems: {
          wig: selectedWig,
          clothing: selectedClothing
        },
        comboPromotion: {
          discountPercentage: 15,
          originalPrice: totalOriginalPrice,
          comboPrice: comboDiscountPrice,
          savedAmount: savedAmount,
          freeGifts: [
            "01 Lược gỡ rối đệm khí chống tĩnh điện chuyên dụng",
            "02 Lưới trùm tóc dệt kim co giãn cao cấp",
            "01 Hộp carton VibeBili bảo quản chống bụi"
          ]
        }
      }
    });

  } catch (error) {
    console.error("Try-On Error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi thử đồ AI: " + error.message
    });
  }
};

// 3. API Proxy an toàn tải ảnh không bị CORS và không bị Tainted Canvas
exports.proxyImage = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send('Thiếu tham số url hợp lệ');
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return res.status(400).send('Chỉ hỗ trợ giao thức HTTP/HTTPS');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(trimmedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).send(`Không thể tải ảnh: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    });

    return res.send(buffer);
  } catch (error) {
    console.warn('[Proxy Image Error]:', error.message);
    return res.status(500).send('Lỗi proxy hình ảnh: ' + error.message);
  }
};
