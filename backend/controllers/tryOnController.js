const crypto = require('crypto');
const sharp = require('sharp');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const db = require('../config/db'); // Sửa lại đường dẫn này cho đúng với file kết nối MySQL hiện tại của bạn

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function calculateEaseAllowance(userMeasurements, sizeChart) {
    const analysis = {};
    for (const [sizeName, specs] of Object.entries(sizeChart)) {
        analysis[sizeName] = {
            chest_diff: specs.chest ? specs.chest - userMeasurements.chest : null,
            shoulder_diff: specs.shoulder ? specs.shoulder - userMeasurements.shoulder : null,
            waist_diff: specs.waist ? specs.waist - userMeasurements.waist : null,
        };
    }
    return analysis;
}

exports.virtualTryOn = async (req, res) => {
    try {
        const { userId, productId, userImageBase64, measurements } = req.body;

        // 1. Nén & resize ảnh đầu vào cho nhẹ trước khi gửi AI
        const imgBuffer = Buffer.from(userImageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const optimizedBuffer = await sharp(imgBuffer)
            .resize({ width: 768, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
        const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;

        // 2. Kiểm tra Cache trong MySQL xem khách đã thử ảnh này với món đồ này chưa
        const imageHash = crypto.createHash('md5').update(optimizedBuffer).digest('hex');
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

        // 3. Lấy thông tin sản phẩm từ MySQL
        const [products] = await db.query('SELECT name, image_url, size_chart, material FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        const product = products[0];
        const parsedSizeChart = typeof product.size_chart === 'string' ? JSON.parse(product.size_chart) : product.size_chart;

        // 4. Chạy song song: Gọi Python của B ghép ảnh + Gọi Gemini tư vấn Size
        // LƯU Ý: Kiểm tra file ai-service-python/main.py của B để sửa đúng đường dẫn (/api/try-on) và tên biến nếu B đặt khác
        const tryOnPromise = axios.post(`${process.env.PYTHON_AI_URL}/api/try-on`, {
            person_image: optimizedBase64,
            garment_image_url: product.image_url
        });

        let sizeAdvicePromise = Promise.resolve(null);
        if (measurements && parsedSizeChart) {
            const easeData = calculateEaseAllowance(measurements, parsedSizeChart);
            const prompt = `
                Bạn là chuyên gia tư vấn thời trang của sàn thương mại điện tử VibeBili.
                Sản phẩm: ${product.name} | Chất liệu: ${product.material}.
                Số đo khách hàng (cm/kg): ${JSON.stringify(measurements)}.
                Độ dư (Ease Allowance = Áo - Người) theo từng size: ${JSON.stringify(easeData)}.
                Hãy phân tích độ vừa vặn tại ngực, vai, eo dựa trên độ co giãn của chất liệu và đề xuất 1 size chuẩn nhất.
                Trả về đúng định dạng JSON: {"recommended_size": "...", "fit_analysis": "...", "warning": "..."}
            `;

            sizeAdvicePromise = ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });
        }

        const [pythonRes, geminiRes] = await Promise.all([tryOnPromise, sizeAdvicePromise]);

        // LƯU Ý: Kiểm tra tên biến trả về từ Python của B (result_image_url)
        const resultImageUrl = pythonRes.data.result_image_url;
        const sizeAdvice = geminiRes ? JSON.parse(geminiRes.text) : null;

        // 5. Lưu kết quả vào Cache MySQL
        await db.query(
            'INSERT INTO try_on_history (user_id, product_id, user_image_hash, result_image_url, size_advice) VALUES (?, ?, ?, ?, ?)',
            [userId || null, productId, imageHash, resultImageUrl, JSON.stringify(sizeAdvice)]
        );

        return res.json({
            source: 'ai_generated',
            resultImageUrl,
            sizeAdvice
        });

    } catch (error) {
        console.error('Lỗi Virtual Try-On:', error);
        res.status(500).json({ message: 'Lỗi xử lý phòng thử đồ AI', error: error.message });
    }
};