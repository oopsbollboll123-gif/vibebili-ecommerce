/**
 * =====================================================================
 * CLIENT-SIDE HUGGING FACE IDM-VTON ENGINE (CHẠY TRỰC TIẾP TRÊN VERCEL)
 * Cho phép chạy Try-On AI thật ngay trên trình duyệt khi Backend/Python
 * local (localhost:5000 / 8000) không khả dụng (như khi mở web Vercel trên máy khác).
 * =====================================================================
 */
import { Client } from '@gradio/client';
import { removeBackground } from '@imgly/background-removal';

const VTON_SPACES = ['yisol/IDM-VTON', 'Nymbo/Virtual-Try-On'];

/**
 * Chuyển đổi URL hoặc Data URL thành Blob (qua proxy CORS nếu cần)
 */
const fetchImageAsBlob = async (src) => {
  if (!src) throw new Error('Thiếu ảnh đầu vào');

  const urls = src.startsWith('data:') || src.startsWith('blob:')
    ? [src]
    : [src, `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=png&w=768`];

  for (const u of urls) {
    try {
      const resp = await fetch(u);
      if (!resp.ok) continue;
      const blob = await resp.blob();
      if (blob && blob.size > 200) return blob;
    } catch {
      continue;
    }
  }
  throw new Error('Không thể tải ảnh từ nguồn: ' + src);
};

/**
 * Chuẩn hóa ảnh thành Blob 768x1024 giữ nguyên tỉ lệ (pad nền studio)
 */
const padBlobToVton = async (blob, bgColor = '#ffffff') => {
  const bitmap = await createImageBitmap(blob);
  const w = bitmap.width;
  const h = bitmap.height;
  const targetW = 768;
  const targetH = 1024;
  const scale = Math.min(targetW / w, targetH / h);
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const left = Math.round((targetW - nw) / 2);
  const top = Math.round((targetH - nh) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(bitmap, left, top, nw, nh);
  bitmap.close?.();

  const outBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  return { blob: outBlob, padMeta: { left, top, nw, nh, origW: w, origH: h } };
};

/**
 * Cắt bỏ viền pad khỏi ảnh kết quả IDM-VTON để khớp tỉ lệ ảnh gốc 100%
 */
const unpadResultUrlToDataUrl = async (resultUrl, padMeta) => {
  const blob = await fetchImageAsBlob(resultUrl);
  const bitmap = await createImageBitmap(blob);
  const rw = bitmap.width;
  const rh = bitmap.height;
  const sx = rw / 768;
  const sy = rh / 1024;

  const cropX = Math.round(padMeta.left * sx);
  const cropY = Math.round(padMeta.top * sy);
  const cropW = Math.max(1, Math.round(padMeta.nw * sx));
  const cropH = Math.max(1, Math.round(padMeta.nh * sy));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = Math.min(padMeta.origW, 768);
  outCanvas.height = Math.max(1, Math.round(outCanvas.width * (padMeta.origH / padMeta.origW)));
  const ctx = outCanvas.getContext('2d');
  ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, outCanvas.width, outCanvas.height);
  bitmap.close?.();

  return outCanvas.toDataURL('image/jpeg', 0.92);
};

/**
 * Dịch mô tả sản phẩm sang tiếng Anh để IDM-VTON hiểu chính xác loại áo
 */
export const buildEnglishGarmentDes = (clothingData = {}) => {
  const raw = `${clothingData.name || ''} ${clothingData.category || ''}`.toLowerCase();
  if (raw.includes('đầm') || raw.includes('váy') || raw.includes('dress')) return 'A photorealistic stylish fashion dress';
  if (raw.includes('hoodie')) return 'A photorealistic pullover hoodie sweatshirt';
  if (raw.includes('bomber')) return 'A photorealistic bomber jacket outerwear';
  if (raw.includes('blazer') || raw.includes('vest')) return 'A photorealistic tailored blazer jacket';
  if (raw.includes('khoác') || raw.includes('jacket') || raw.includes('cardigan')) return 'A photorealistic casual fashion jacket';
  if (raw.includes('sơ mi') || raw.includes('so mi')) {
    return raw.includes('ngắn') || raw.includes('cộc')
      ? 'A photorealistic short sleeve button-up collared shirt'
      : 'A photorealistic long sleeve button-up collared shirt';
  }
  if (raw.includes('polo')) return 'A photorealistic collared polo shirt';
  if (raw.includes('croptop') || raw.includes('crop top')) return 'A photorealistic fitted women crop top';
  if (raw.includes('len') || raw.includes('sweater')) return 'A photorealistic knitted pullover sweater';
  if (raw.includes('quần') || raw.includes('jeans') || raw.includes('short')) return 'A photorealistic fashion trousers pants';
  return 'A photorealistic upper body cotton t-shirt';
};

/**
 * Tách nền trang phục bằng @imgly/background-removal AI trên trình duyệt (ONNX WASM)
 */
export const removeGarmentBgInBrowser = async (garmentSrc) => {
  const rawBlob = await fetchImageAsBlob(garmentSrc);
  const segBlob = await removeBackground(rawBlob);
  return segBlob;
};

/**
 * Gọi Hugging Face IDM-VTON trực tiếp từ trình duyệt (dùng khi chạy trên Vercel)
 */
export const runDirectBrowserVton = async ({ personImgSrc, clothingImgSrc, clothingData = {} }) => {
  const rawPersonBlob = await fetchImageAsBlob(personImgSrc);
  let garmentBlob;
  try {
    // Bóc tách nền quần áo bằng AI @imgly/background-removal trước khi đưa vào VTON
    garmentBlob = await removeGarmentBgInBrowser(clothingImgSrc);
  } catch (segErr) {
    console.warn('[Browser AI Seg]: Dùng ảnh áo gốc do tách nền trình duyệt bận:', segErr.message);
    garmentBlob = await fetchImageAsBlob(clothingImgSrc);
  }

  const { blob: personPadded, padMeta } = await padBlobToVton(rawPersonBlob, '#f5f5f7');
  const { blob: garmentStudio } = await padBlobToVton(garmentBlob, '#ffffff');
  const garmentDes = buildEnglishGarmentDes(clothingData);

  for (const spaceName of VTON_SPACES) {
    try {
      const client = await Client.connect(spaceName);
      const result = await client.predict('/tryon', {
        dict: { background: personPadded, layers: [], composite: null },
        garm_img: garmentStudio,
        garment_des: garmentDes,
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42
      });

      const outUrl = result?.data?.[0]?.url || result?.data?.[0]?.path || result?.data?.[0];
      if (outUrl && typeof outUrl === 'string') {
        const finalDataUrl = await unpadResultUrlToDataUrl(outUrl, padMeta);
        return {
          resultImageUrl: finalDataUrl,
          source: 'ai_generated_browser'
        };
      }
    } catch (err) {
      console.warn(`[Browser VTON] Space ${spaceName} thất bại:`, err.message);
      continue;
    }
  }

  throw new Error('Không thể kết nối tới không gian thử đồ AI đám mây.');
};
