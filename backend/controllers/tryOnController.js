const crypto = require('crypto');
const sharp = require('sharp');
const axios = require('axios');
const db = require('../config/db');

// =========================================================
// GEMINI SIZE ADVICE — dùng fetch() trực tiếp, KHÔNG dùng SDK
// Model chain: gemini-flash-lite-latest → gemini-3.1-flash-lite → gemini-3-flash-preview
// =========================================================
async function getGeminiSizeAdvice(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  const models = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview'
  ];

  for (const model of models) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: AbortSignal.timeout(15000)
        }
      );

      if (!r.ok) {
        console.warn(`Gemini model ${model} returned ${r.status}, trying next...`);
        continue;
      }

      const data = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return JSON.parse(text);
      }
    } catch (err) {
      console.warn(`Gemini model ${model} error: ${err.message}, trying next...`);
    }
  }

  return null;
}

// =========================================================
// HELPER: Tính độ chênh lệch kích thước
// =========================================================
function calculateEaseAllowance(userMeasurements, sizeChart) {
  const analysis = {};
  for (const [sizeName, specs] of Object.entries(sizeChart)) {
    analysis[sizeName] = {
      chest_diff: specs.chest ? specs.chest - (userMeasurements.chest || 0) : null,
      shoulder_diff: specs.shoulder ? specs.shoulder - (userMeasurements.shoulder || 0) : null,
      waist_diff: specs.waist ? specs.waist - (userMeasurements.waist || 0) : null,
    };
  }
  return analysis;
}

// =========================================================
// CONTROLLER: POST /api/try-on/virtual-try-on
// =========================================================
exports.virtualTryOn = async (req, res) => {
  try {
    const { userId, productId, productData, userImageBase64, measurements } = req.body;

    if (!userImageBase64 || !productId) {
      return res.status(400).json({ message: 'Thiếu ảnh hoặc productId' });
    }

    // 1. Nén & resize ảnh đầu vào (hỗ trợ cả URL người mẫu có sẵn lẫn ảnh upload Base64)
    let imgBuffer;
    if (userImageBase64.startsWith('http')) {
      const imgRes = await axios.get(userImageBase64, { responseType: 'arraybuffer' });
      imgBuffer = Buffer.from(imgRes.data);
    } else {
      imgBuffer = Buffer.from(
        userImageBase64.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
    }

    const optimizedBuffer = await sharp(imgBuffer)
      .resize({ width: 768, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;

    // 2. Kiểm tra Cache MySQL
    const imageHash = crypto.createHash('md5').update(optimizedBuffer).digest('hex');
    try {
      const [cachedRows] = await db.query(
        'SELECT result_image_url, size_advice FROM try_on_history WHERE product_id = ? AND user_image_hash = ? LIMIT 1',
        [productId, imageHash]
      );
      if (cachedRows.length > 0) {
        return res.json({
          source: 'cache',
          resultImageUrl: cachedRows[0].result_image_url,
          sizeAdvice: typeof cachedRows[0].size_advice === 'string'
            ? JSON.parse(cachedRows[0].size_advice)
            : cachedRows[0].size_advice
        });
      }
    } catch (dbErr) {
      console.warn('MySQL cache check failed (non-fatal):', dbErr.message);
    }

    // 3. Lấy thông tin sản phẩm từ MySQL (hoặc dùng productData từ Frontend gửi kèm)
    let product = null;
    try {
      const [products] = await db.query(
        'SELECT name, image_url, size_chart, material FROM products WHERE id = ?',
        [productId]
      );
      if (products.length > 0) {
        product = products[0];
      }
    } catch (dbErr) {
      console.warn('MySQL product fetch failed (non-fatal):', dbErr.message);
    }

    if (!product && productData) {
      product = {
        name: productData.name || 'Trang phục thời trang',
        image_url: productData.overlayImage || productData.image_url || productData.image || productData.main_image || productData.link_anh || productData.rawProduct?.main_image || productData.rawProduct?.image,
        size_chart: productData.rawProduct?.size_chart || productData.size_chart || null,
        material: productData.rawProduct?.material || productData.material || 'Cotton thoáng mát'
      };
    }

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const parsedSizeChart = (() => {
      try {
        return typeof product.size_chart === 'string'
          ? JSON.parse(product.size_chart)
          : product.size_chart;
      } catch { return null; }
    })();

    // Đảm bảo link ảnh sản phẩm là URL đầy đủ hoặc Data URL
    const fullGarmentUrl = product.image_url && (product.image_url.startsWith('http') || product.image_url.startsWith('data:'))
      ? product.image_url
      : product.image_url
        ? `http://localhost:${process.env.PORT || 5000}${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`
        : null;

    if (!fullGarmentUrl) {
      return res.status(400).json({ message: 'Sản phẩm chưa có ảnh để thử đồ' });
    }

    // 4. Chạy song song: Python AI Try-On + Gemini Size Advice
    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:8000';

    const tryOnPromise = axios.post(`${pythonUrl}/api/generate-tryon`, {
      person_img: optimizedBase64,
      garment_img: fullGarmentUrl,
      garment_des: product.name
    }, { timeout: 120000 }); // IDM-VTON có thể mất đến 2 phút

    let sizeAdvicePromise = Promise.resolve(null);
    if (measurements) {
      const easeSection = parsedSizeChart
        ? `Độ dư (Ease Allowance = Áo - Người) theo từng size: ${JSON.stringify(calculateEaseAllowance(measurements, parsedSizeChart))}.`
        : `Sản phẩm dùng bảng size chuẩn Việt Nam (S, M, L, XL).`;

      const prompt = `Bạn là chuyên gia tư vấn thời trang của sàn thương mại điện tử VibeBili.
Sản phẩm: ${product.name} | Chất liệu: ${product.material || 'không rõ'}.
Số đo khách hàng (cm/kg): ${JSON.stringify(measurements)}.
${easeSection}
Hãy phân tích độ vừa vặn tại ngực, vai, eo dựa trên độ co giãn của chất liệu và đề xuất 1 size chuẩn nhất.
Trả về đúng định dạng JSON: {"recommended_size": "...", "fit_analysis": "...", "warning": "..."}`;

      sizeAdvicePromise = getGeminiSizeAdvice(prompt);
    }

    const [pythonRes, sizeAdvice] = await Promise.all([tryOnPromise, sizeAdvicePromise]);

    // Lấy đúng biến result_img từ Python service
    const resultImageUrl = pythonRes?.data?.result_img;
    if (!resultImageUrl) {
      throw new Error('Python AI service không trả về result_img');
    }

    // 5. Lưu kết quả vào Cache MySQL
    try {
      await db.query(
        'INSERT INTO try_on_history (user_id, product_id, user_image_hash, result_image_url, size_advice) VALUES (?, ?, ?, ?, ?)',
        [userId || null, productId, imageHash, resultImageUrl, JSON.stringify(sizeAdvice)]
      );
    } catch (dbErr) {
      console.warn('MySQL cache insert failed (non-fatal):', dbErr.message);
    }

    return res.json({
      source: 'ai_generated',
      resultImageUrl,
      sizeAdvice
    });

  } catch (error) {
    const detailError = error.response?.data?.detail || error.response?.data?.message || error.message;
    console.error('Lỗi Virtual Try-On:', detailError);
    res.status(500).json({
      message: 'Lỗi xử lý phòng thử đồ AI',
      error: detailError
    });
  }
};