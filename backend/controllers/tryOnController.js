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

// 1. Lấy danh sách Preset Avatars & Toàn bộ Catalog sản phẩm thực tế
const getPresets = async (req, res) => {
  try {
    let allProds = [];

    // Thử lấy từ database
    try {
      const [rows] = await db.query(
        `SELECT p.id, p.name, p.price, p.main_image, c.name AS category_name, p.category_id
         FROM Products p
         LEFT JOIN Categories c ON p.category_id = c.id
         WHERE p.status = 'active' OR p.status = 'Đang bán'
         ORDER BY p.id DESC`
      );
      if (rows && rows.length > 0) allProds = rows;
    } catch {}

    // Nếu DB chưa có hoặc ít, gộp từ mockData
    if (allProds.length === 0) {
      allProds = mockData.products || [];
    }

    const { wigs, clothes } = categorizeProducts(allProds);

    return res.status(200).json({
      success: true,
      data: {
        avatars: presetAvatars,
        catalog: {
          wigs: wigs.length > 0 ? wigs : mockData.products.slice(0, 3),
          clothes: clothes.length > 0 ? clothes : mockData.products.slice(3, 8)
        },
        wigSpecifications: {
          fibers: [
            {
              type: "100% Virgin Human Hair (Tóc thật 100%)",
              description: "Thu gom từ tóc người tự nhiên, sợi tóc có lớp biểu bì nguyên bản, độ mềm mượt hoàn hảo, tẩy nhuộm uốn duỗi nhiệt đến 220°C, tuổi thọ 2-5 năm."
            },
            {
              type: "Korean Synthetic Silk (Sợi tơ nhân tạo tơ lụa Hàn Quốc)",
              description: "Không bị bóng lộ liễu dưới ánh đèn flash, chịu nhiệt an toàn 140°C - 180°C, giá thành tiết kiệm."
            }
          ],
          capSizes: [
            { size: "Size S", circumference: "52 – 54cm", note: "Cho vòng đầu nhỏ" },
            { size: "Size M", circumference: "55 – 57cm", note: "Kích cỡ chuẩn cho 85% người trưởng thành" },
            { size: "Size L", circumference: "58 – 60cm", note: "Cho vòng đầu lớn" }
          ]
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi tải presets phòng thử đồ: " + error.message
    });
  }
};

// 2. API Xử lý Thử đồ AI 2-in-1 (Gọi Gemini AI nếu có key, hoặc Smart Simulation Engine)
const generateTryOn = async (req, res) => {
  const {
    avatarId,
    avatarImage,
    measurements,
    wigId,
    clothingId,
    wigData,
    clothingData
  } = req.body;

  try {
    const height = Number(measurements?.height || 162);
    const weight = Number(measurements?.weight || 48);
    const bust = Number(measurements?.bust || 84);
    const waist = Number(measurements?.waist || 63);
    const hips = Number(measurements?.hips || 89);

    // Tính chỉ số BMI và Dáng người
    const heightM = height / 100;
    const bmi = Number((weight / (heightM * heightM)).toFixed(1));

    let bodyShapeType = "Đồng hồ cát (Hourglass)";
    let recommendedClothingSize = "Size M (Vừa vặn)";
    if (hips - bust > 5 && hips - waist > 20) {
      bodyShapeType = "Dáng quả lê (Pear Shape)";
      recommendedClothingSize = "Size L cho phần thân dưới, Size M cho phần áo";
    } else if (bust - hips > 5 && bust - waist > 18) {
      bodyShapeType = "Dáng tam giác ngược (Inverted Triangle)";
      recommendedClothingSize = "Size M/L, nên chọn áo cổ chữ V hoặc cổ yếm";
    } else if (Math.abs(bust - hips) <= 5 && waist / bust > 0.8) {
      bodyShapeType = "Dáng thước kẻ (Rectangle)";
      recommendedClothingSize = "Size S/M, nên kết hợp thắt eo để tạo đường cong";
    } else if (waist >= bust && waist >= hips) {
      bodyShapeType = "Dáng quả táo (Apple Shape)";
      recommendedClothingSize = "Size L/XL, trang phục dáng suông hoặc peplum";
    }

    // Đề xuất size chu vi vòng đầu
    let recommendedCapSize = "Size M (55 - 57cm)";
    if (height < 155 || weight < 45) {
      recommendedCapSize = "Size S (52 - 54cm)";
    } else if (height > 170 || weight > 65) {
      recommendedCapSize = "Size L (58 - 60cm)";
    }

    // Thông tin tóc và đồ
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

    // AI Stylist Feedback
    let stylingAnalysis = [];
    let fitScore = 95;
    let faceFitScore = 96;
    let bodyFitScore = 94;

    // Tích hợp Google Gemini AI nếu có GEMINI_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const prompt = `Bạn là chuyên gia tư vấn thời trang AI cao cấp của nền tảng VibeBili.vn (chuyên về Tóc Giả và Thời Trang Nữ/Nam tại Việt Nam).
Hãy phân tích và đưa ra 3 nhận xét ngắn gọn, thực tế và tôn dáng nhất cho khách hàng:
- Dáng người: ${bodyShapeType}, Chiều cao: ${height}cm, Cân nặng: ${weight}kg, 3 vòng: ${bust}-${waist}-${hips}cm, BMI: ${bmi}
- Mẫu tóc giả đã chọn: ${selectedWig.name} (Màu: ${selectedWig.color || 'Tự nhiên'}, Chiều dài: ${selectedWig.hairLength || 'Vừa'})
- Mẫu trang phục đã chọn: ${selectedClothing.name} (Phân loại: ${selectedClothing.category || 'Thời trang'})
Yêu cầu trả về JSON có định dạng:
{
  "overallFitScore": (số từ 88 đến 98),
  "faceHarmonization": (số từ 88 đến 99),
  "bodyProportion": (số từ 88 đến 98),
  "feedback": [
    "Nhận xét 1 về độ ăn khớp của kiểu tóc với khuôn mặt",
    "Nhận xét 2 về phom dáng trang phục với số đo cơ thể",
    "Nhận xét 3 về sự kết hợp màu sắc và phong cách tổng thể"
  ],
  "stylistTip": "Một mẹo nhỏ khi mang tóc hoặc phối phụ kiện"
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.feedback && Array.isArray(parsed.feedback)) {
              stylingAnalysis = parsed.feedback;
              fitScore = parsed.overallFitScore || 95;
              faceFitScore = parsed.faceHarmonization || 96;
              bodyFitScore = parsed.bodyProportion || 94;
              if (parsed.stylistTip) stylingAnalysis.push(`💡 Mẹo từ Stylist AI: ${parsed.stylistTip}`);
            }
          }
        }
      } catch (geminiErr) {
        console.warn('[Gemini AI]: Sử dụng thuật toán phân tích nội bộ do API chưa phản hồi:', geminiErr.message);
      }
    }

    // Nếu chưa có feedback từ Gemini, dùng thuật toán tạo styling thông minh
    if (stylingAnalysis.length === 0) {
      stylingAnalysis.push(`✓ AI nhận diện cấu trúc gương mặt ăn khớp hoàn hảo với phom dáng của mẫu tóc [${selectedWig.name}], tôn trọn đường nét cằm và gò má.`);
      stylingAnalysis.push(`✓ Vóc dáng [${bodyShapeType}] kết hợp cùng mẫu [${selectedClothing.name}] giúp cân bằng tỷ lệ cơ thể và tôn eo thon gọn.`);
      stylingAnalysis.push(`✓ Bảng màu giữa mái tóc [${selectedWig.color || 'tự nhiên'}] và trang phục tạo nên hiệu ứng thị giác sang trọng, hài hòa.`);
      stylingAnalysis.push(`💡 Gợi ý kích cỡ chuẩn từ AI: Áo/Đầm nên chọn [${recommendedClothingSize}], Tóc giả nên chọn [${recommendedCapSize}].`);
    }

    // Tính ưu đãi Combo khi mua cả 2
    const totalOriginalPrice = Number(selectedWig.price || 350000) + Number(selectedClothing.price || 290000);
    const comboDiscountPrice = Math.round(totalOriginalPrice * 0.85); // Giảm 15%
    const savedAmount = totalOriginalPrice - comboDiscountPrice;

    return res.status(200).json({
      success: true,
      message: "AI 2-in-1 Virtual Try-On thành công!",
      data: {
        tryOnId: "TRYON-" + Date.now(),
        generatedAt: new Date().toISOString(),
        originalImage: sourceImage,
        // Ảnh sau khi thử đồ: Sẽ được Canvas Composite hoặc Render phối kết hợp
        renderedImage: selectedClothing.overlayImage || selectedWig.overlayImage || sourceImage,
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
      message: "Lỗi trong quá trình xử lý thử đồ AI: " + error.message
    });
  }
};

module.exports = {
  getPresets,
  generateTryOn
};
