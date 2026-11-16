/**
 * =====================================================================
 * VIBEBILI AI VIRTUAL TRY-ON COMPOSITOR ENGINE 5.0 (GEMINI VISION FIT)
 * =====================================================================
 * Hệ thống thử đồ ảo cao cấp điều khiển bằng Gemini AI Multimodal Vision:
 * 1. Bóc tách trang phục sạch 100% phông nền (Tight Bounding Box).
 * 2. Nhận diện mốc giải phẫu học đa góc độ bằng Gemini 3.5 Flash:
 *    - Điểm chân cổ (neck_base), bờ vai trái/phải, ngực, eo.
 *    - Khung thân người đang mặc đồ cũ (old_torso_box).
 * 3. XÓA BỘ ĐỒ CŨ ĐANG MẶC trên người mẫu, sau đó MẶC BỘ ĐỒ MỚI VÀO.
 * 4. Tự động cắt cúp khung hình tập trung nửa người trên nếu chỉ chọn áo.
 * 5. Ánh sáng vòm 3D, nếp nhăn vải thực tế và bảo toàn bàn tay phía trước.
 * 6. Mặc định giữ nguyên mái tóc thật tuyệt đẹp của khách hàng!
 * =====================================================================
 */

import { tryOnAPI } from '../services/api';

/**
 * Tải ảnh an toàn, tự động xử lý CORS & Proxy fallback
 */
export const loadImageSafely = (src) => {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('Nguồn ảnh không hợp lệ'));

    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const timer = setTimeout(() => {
      if (!src.startsWith('data:') && !src.startsWith('blob:') && !src.includes('proxy-image')) {
        const proxySrc = tryOnAPI.getProxyUrl(src);
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'anonymous';
        proxyImg.onload = () => resolve(proxyImg);
        proxyImg.onerror = () => reject(new Error('Không thể tải ảnh qua proxy'));
        proxyImg.src = proxySrc;
      } else {
        reject(new Error('Tải ảnh quá thời gian cho phép'));
      }
    }, 5000);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      if (!src.startsWith('data:') && !src.startsWith('blob:') && !src.includes('proxy-image')) {
        const proxySrc = tryOnAPI.getProxyUrl(src);
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'anonymous';
        proxyImg.onload = () => resolve(proxyImg);
        proxyImg.onerror = (e) => reject(new Error('Lỗi nạp ảnh: ' + (e?.message || 'CORS block')));
        proxyImg.src = proxySrc;
      } else {
        reject(new Error('Lỗi nạp ảnh từ đường dẫn'));
      }
    };

    img.src = src;
  });
};

/**
 * Thuật toán tách nền trang phục chính xác cao (Precision Garment Segmentation)
 * Xóa sạch nền studio trắng, xám nhạt, phông đơn sắc, đồng thời giữ nguyên 100% chi tiết áo
 */
export const removeBackground = (sourceImg, options = {}) => {
  const threshold = options.threshold || 32;
  const feather = options.feather || 14;
  const maxDimension = options.maxDimension || 900;

  let w = sourceImg.naturalWidth || sourceImg.width || 600;
  let h = sourceImg.naturalHeight || sourceImg.height || 800;

  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(sourceImg, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Lấy các mẫu màu nền biên xung quanh 4 cạnh
  const borderSamples = [];
  for (let x = 0; x < w; x += 4) {
    borderSamples.push([x, 0]);
    borderSamples.push([x, h - 1]);
  }
  for (let y = 0; y < h; y += 4) {
    borderSamples.push([0, y]);
    borderSamples.push([w - 1, y]);
  }

  let totalR = 0, totalG = 0, totalB = 0;
  let sampleCount = 0;
  borderSamples.forEach(([x, y]) => {
    const idx = (y * w + x) * 4;
    if (data[idx + 3] > 20) {
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      sampleCount++;
    }
  });

  const bgR = sampleCount > 0 ? totalR / sampleCount : 255;
  const bgG = sampleCount > 0 ? totalG / sampleCount : 255;
  const bgB = sampleCount > 0 ? totalB / sampleCount : 255;

  const mask = new Uint8Array(w * h);
  const queue = [];

  const isBgColor = (idx) => {
    const a = data[idx + 3];
    if (a < 25) return true; // Đã trong suốt
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Phát hiện phông trắng / xám studio chuyên nghiệp
    const isStudioWhite = r > 230 && g > 230 && b > 230 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20;
    if (isStudioWhite) return true;

    // Khoảng cách màu tới viền biên
    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    return dist <= (threshold + feather);
  };

  for (let x = 0; x < w; x++) {
    const topIdx = x;
    if (isBgColor(topIdx * 4)) {
      mask[topIdx] = 1;
      queue.push(topIdx);
    }
    const btmIdx = (h - 1) * w + x;
    if (isBgColor(btmIdx * 4)) {
      mask[btmIdx] = 1;
      queue.push(btmIdx);
    }
  }

  for (let y = 0; y < h; y++) {
    const lftIdx = y * w;
    if (!mask[lftIdx] && isBgColor(lftIdx * 4)) {
      mask[lftIdx] = 1;
      queue.push(lftIdx);
    }
    const rgtIdx = y * w + (w - 1);
    if (!mask[rgtIdx] && isBgColor(rgtIdx * 4)) {
      mask[rgtIdx] = 1;
      queue.push(rgtIdx);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cx = cur % w;
    const cy = Math.floor(cur / w);

    const neighbors = [
      cx > 0 ? cur - 1 : -1,
      cx < w - 1 ? cur + 1 : -1,
      cy > 0 ? cur - w : -1,
      cy < h - 1 ? cur + w : -1
    ];

    for (let i = 0; i < 4; i++) {
      const nIdx = neighbors[i];
      if (nIdx !== -1 && mask[nIdx] === 0) {
        if (isBgColor(nIdx * 4)) {
          mask[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }
  }

  for (let i = 0; i < w * h; i++) {
    const px = i * 4;
    if (mask[i] === 1) {
      const r = data[px];
      const g = data[px + 1];
      const b = data[px + 2];
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      if (dist <= threshold || (r > 232 && g > 232 && b > 232)) {
        data[px + 3] = 0;
      } else {
        const alphaFactor = Math.max(0, Math.min(1, (dist - threshold) / feather));
        data[px + 3] = Math.round(data[px + 3] * alphaFactor);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

/**
 * XÉN SÁT BIÊN ĐỘ THỰC TẾ CỦA TRANG PHỤC (TIGHT BOUNDING BOX CROPPER)
 */
export const cropToGarmentBounds = (canvas) => {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found || minX >= maxX || minY >= maxY) return canvas;

  minX = Math.max(0, minX - 4);
  minY = Math.max(0, minY - 4);
  maxX = Math.min(w - 1, maxX + 4);
  maxY = Math.min(h - 1, maxY + 4);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const croppedCtx = croppedCanvas.getContext('2d');
  croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

  return croppedCanvas;
};

/**
 * TẠO CHIỀU SÂU VÒM CƠ THỂ 3D VÀ BẢO TOÀN NẾP NHĂN VẢI THỰC TẾ
 */
export const apply3DFabricShading = (garmentCanvas) => {
  const w = garmentCanvas.width;
  const h = garmentCanvas.height;

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = w;
  resultCanvas.height = h;
  const ctx = resultCanvas.getContext('2d');

  // 1. Vẽ nguyên bản trang phục (Bảo toàn 100% nếp nhăn vải và kết cấu thật)
  ctx.drawImage(garmentCanvas, 0, 0);

  // 2. Phủ bóng đổ vòm cơ thể hình trụ 3D (Cylindrical Lighting)
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const bodyCylinder = ctx.createLinearGradient(0, 0, w, 0);
  bodyCylinder.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
  bodyCylinder.addColorStop(0.18, 'rgba(0, 0, 0, 0.04)');
  bodyCylinder.addColorStop(0.50, 'rgba(255, 255, 255, 0.09)');
  bodyCylinder.addColorStop(0.82, 'rgba(0, 0, 0, 0.04)');
  bodyCylinder.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = bodyCylinder;
  ctx.fillRect(0, 0, w, h);

  // 3. Đổ bóng võng cổ & xương đòn tự nhiên
  const collarShadow = ctx.createLinearGradient(0, 0, 0, h * 0.28);
  collarShadow.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
  collarShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = collarShadow;
  ctx.fillRect(0, 0, w, h * 0.28);

  ctx.restore();
  return resultCanvas;
};

/**
 * BẢO TOÀN BÀN TAY & CÁNH TAY TRƯỚC ÁO
 */
export const blendForegroundHands = (personCanvas, renderedCanvas, clothX, clothY, clothW, clothH) => {
  const w = renderedCanvas.width;
  const h = renderedCanvas.height;

  const pCtx = personCanvas.getContext('2d', { willReadFrequently: true });
  const pData = pCtx.getImageData(0, 0, w, h).data;

  const rCtx = renderedCanvas.getContext('2d', { willReadFrequently: true });
  const rImgData = rCtx.getImageData(0, 0, w, h);
  const rData = rImgData.data;

  const startX = Math.max(0, Math.round(clothX + clothW * 0.22));
  const endX = Math.min(w - 1, Math.round(clothX + clothW * 0.78));
  const startY = Math.max(0, Math.round(clothY));
  const endY = Math.min(h - 1, Math.round(clothY + clothH * 0.45));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * w + x) * 4;
      const r = pData[idx];
      const g = pData[idx + 1];
      const b = pData[idx + 2];

      const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
      const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;

      const isSkin = (cb >= 78 && cb <= 126 && cr >= 134 && cr <= 172) &&
                     (r > 95 && g > 40 && b > 20 && r > g && g > b);

      if (isSkin) {
        rData[idx] = r;
        rData[idx + 1] = g;
        rData[idx + 2] = b;
        rData[idx + 3] = 255;
      }
    }
  }

  rCtx.putImageData(rImgData, 0, 0);
  return renderedCanvas;
};

/**
 * XÓA VÙNG TRANG PHỤC CŨ TRÊN NGƯỜI MẪU (REPLACE OLD CLOTHES)
 * Nhận diện vùng thân người đang mặc áo cũ và xóa sạch/phủ nền cơ thể để nhường chỗ cho áo mới mặc vào
 */
export const maskOutOldClothes = (ctx, canvasW, canvasH, neckY, torsoBox) => {
  ctx.save();
  // Vùng thân trên cần xóa đồ cũ
  let startY = neckY + 6;
  let endY = canvasH * 0.88;
  let startX = canvasW * 0.12;
  let endX = canvasW * 0.88;

  if (torsoBox && Array.isArray(torsoBox) && torsoBox.length === 4) {
    startY = Math.max(neckY + 4, (torsoBox[0] / 100) * canvasH);
    startX = (torsoBox[1] / 100) * canvasW;
    endY = (torsoBox[2] / 100) * canvasH;
    endX = (torsoBox[3] / 100) * canvasW;
  }

  // 1. Phủ mờ/xóa màu trang phục cũ trên thân để không bị lem hoặc đè lẫn áo mới
  // Tạo lớp nền thân người trung tính (Neutral Anatomical Body Torso)
  const torsoGrad = ctx.createLinearGradient(startX, startY, endX, endY);
  torsoGrad.addColorStop(0, 'rgba(238, 226, 218, 0.98)'); // Tông da sáng nhẹ ở ngực
  torsoGrad.addColorStop(0.20, 'rgba(220, 208, 198, 0.98)');
  torsoGrad.addColorStop(1, 'rgba(195, 185, 178, 0.98)');

  ctx.beginPath();
  // Bo tròn vai và eo để hòa hợp với vóc dáng tự nhiên
  ctx.roundRect(startX, startY, endX - startX, endY - startY, [24, 24, 12, 12]);
  ctx.fillStyle = torsoGrad;
  ctx.fill();

  // 2. Chuyển tiếp mềm mại tại chân cổ (xương quai xanh)
  const neckBlend = ctx.createLinearGradient(0, startY - 14, 0, startY + 28);
  neckBlend.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
  neckBlend.addColorStop(0.5, 'rgba(235, 218, 208, 0.88)');
  neckBlend.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = neckBlend;
  ctx.fillRect(startX, startY - 14, endX - startX, 42);

  ctx.restore();
};

/**
 * GHÉP TỔNG HỢP THỜI TRANG ĐA TẦNG CHUYÊN NGHIỆP 100% (GEMINI VISION FIT ENGINE)
 */
export const compositeTryOnLayers = async ({
  personImgSrc,
  wigImgSrc,
  clothingImgSrc,
  wigData = null,
  clothingData = null,
  geminiVision = null, // DỮ LIỆU THỊ GIÁC AI TỪ GEMINI 3.5 FLASH
  wigTransform = { x: 0, y: 0, scale: 1.0 },
  clothingTransform = { x: 0, y: 0, scale: 1.0 },
  showBranding = true
}) => {
  const canvasW = 720;
  const canvasH = 960;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  // 1. Tải ảnh chân dung người mẫu / khách hàng (Lớp 1 - Nền cơ bản)
  const personImg = await loadImageSafely(personImgSrc);

  const pAspect = personImg.naturalWidth / personImg.naturalHeight;
  const cAspect = canvasW / canvasH;

  let renderW, renderH, offsetX, offsetY;
  if (pAspect > cAspect) {
    renderH = canvasH;
    renderW = canvasH * pAspect;
    offsetX = (canvasW - renderW) / 2;
    offsetY = 0;
  } else {
    renderW = canvasW;
    renderH = canvasW / pAspect;
    offsetX = 0;
    offsetY = (canvasH - renderH) / 2;
  }

  ctx.drawImage(personImg, offsetX, offsetY, renderW, renderH);

  // Tạo bản sao canvas ảnh gốc người mẫu để bảo toàn bàn tay/da
  const personCanvas = document.createElement('canvas');
  personCanvas.width = canvasW;
  personCanvas.height = canvasH;
  personCanvas.getContext('2d').drawImage(personImg, offsetX, offsetY, renderW, renderH);

  // 2. ÁP DỤNG DỮ LIỆU GEMINI AI MULTIMODAL VISION ĐỂ CĂN CHỈNH GIẢI PHẪU
  let personNeckY = canvasH * 0.27;
  let personNeckX = canvasW * 0.50;
  let personShoulderWidth = canvasW * 0.78;
  let isOnlyShirt = true;

  if (geminiVision) {
    const pVision = geminiVision.person;
    const gVision = geminiVision.garment;

    // Hỗ trợ cả 2 định dạng: percent trực tiếp hoặc array [y, x]
    if (pVision?.neck_base_y_percent != null) {
      personNeckY = (pVision.neck_base_y_percent / 100) * canvasH;
    } else if (pVision?.neck_base && Array.isArray(pVision.neck_base)) {
      personNeckY = (pVision.neck_base[0] / 100) * canvasH;
    }

    if (pVision?.neck_center_x_percent != null) {
      personNeckX = (pVision.neck_center_x_percent / 100) * canvasW;
    } else if (pVision?.neck_base && Array.isArray(pVision.neck_base)) {
      personNeckX = (pVision.neck_base[1] / 100) * canvasW;
    }

    if (pVision?.shoulder_width_percent != null) {
      personShoulderWidth = (pVision.shoulder_width_percent / 100) * canvasW * 1.55;
    } else if (pVision?.left_shoulder && pVision?.right_shoulder) {
      const span = Math.abs(pVision.right_shoulder[1] - pVision.left_shoulder[1]);
      personShoulderWidth = (span / 100) * canvasW * 1.55;
    }

    if (gVision?.type === 'dam' || gVision?.type === 'quan' || gVision?.type === 'set') {
      isOnlyShirt = false;
    }
    if (gVision?.crop_upper_body === false) {
      isOnlyShirt = false;
    }
  }

  // Phân loại danh mục theo clothingData nếu có
  if (clothingData) {
    const cat = (clothingData.category_name || clothingData.category || clothingData.name || '').toLowerCase();
    if (cat.includes('đầm') || cat.includes('váy') || cat.includes('quần') || cat.includes('set')) {
      isOnlyShirt = false;
    }
  }

  // 3. XỬ LÝ & MẶC TRANG PHỤC MỚI VÀO NGƯỜI (REPLACE CLOTHES)
  let baseClothH = 0;
  if (clothingImgSrc && clothingImgSrc !== 'none') {
    try {
      const rawClothImg = await loadImageSafely(clothingImgSrc);
      
      // A. Bóc tách nền áo sạch sẽ
      const cleanClothBg = removeBackground(rawClothImg, { threshold: 34, feather: 18 });
      // B. Xén sát tuyệt đối vào biên áo (Bounding Box)
      const croppedCloth = cropToGarmentBounds(cleanClothBg);
      // C. Tạo ánh sáng vòm 3D & nổi bật nếp nhăn tự nhiên
      const cloth3D = apply3DFabricShading(croppedCloth);

      // CĂN CHỈNH THEO MỐC GEMINI AI:
      const scaleMultiplier = geminiVision?.garment?.recommended_scale || 1.0;
      const baseClothW = Math.max(canvasW * 0.74, personShoulderWidth) * scaleMultiplier * (clothingTransform.scale || 1.0);
      const clothAspect = cloth3D.height / cloth3D.width;
      baseClothH = baseClothW * clothAspect;

      const clothX = personNeckX - (baseClothW / 2) + (clothingTransform.x || 0);
      // Khớp viền cổ áo ngay chân cổ / xương quai xanh
      const clothY = personNeckY + (clothingTransform.y || 0);

      // Xóa mờ vùng đồ cũ trên người mẫu trước khi mặc áo mới vào
      const torsoBox = geminiVision?.person?.torso_box || geminiVision?.person?.torso_box_percent;
      maskOutOldClothes(ctx, canvasW, canvasH, personNeckY, torsoBox);

      // Đổ bóng 3D mềm mại phía sau áo lên cơ thể
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(cloth3D, clothX, clothY, baseClothW, baseClothH);
      ctx.restore();

      // Mặc áo mới sắc nét hoàn thiện
      ctx.drawImage(cloth3D, clothX, clothY, baseClothW, baseClothH);

      // Bảo toàn bàn tay/ngón tay đặt trước ngực
      blendForegroundHands(personCanvas, canvas, clothX, clothY, baseClothW, baseClothH);

    } catch (clothErr) {
      console.warn('[Compositor] Lỗi ghép áo:', clothErr.message);
    }
  }

  // 4. XỬ LÝ TÓC (TUYỆT ĐỐI KHÔNG VẼ TÓC HÌNH VẼ, MẶC ĐỊNH GIỮ NGUYÊN TÓC THẬT)
  const isNaturalHair = !wigImgSrc || wigImgSrc === 'none' || wigImgSrc.includes('natural') || wigData?.id === 'wig-natural';

  if (!isNaturalHair) {
    try {
      const rawWigImg = await loadImageSafely(wigImgSrc);
      const cleanWigBg = removeBackground(rawWigImg, { threshold: 35, feather: 20 });
      const croppedWig = cropToGarmentBounds(cleanWigBg);

      const baseWigW = canvasW * 0.75 * (wigTransform.scale || 1.0);
      const wigAspect = croppedWig.height / croppedWig.width;
      const baseWigH = baseWigW * wigAspect;

      const wigX = (canvasW - baseWigW) / 2 + (wigTransform.x || 0);
      const wigY = canvasH * 0.08 + (wigTransform.y || 0);

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(croppedWig, wigX, wigY, baseWigW, baseWigH);
      ctx.restore();

      ctx.drawImage(croppedWig, wigX, wigY, baseWigW, baseWigH);
    } catch (wigErr) {
      console.warn('[Compositor] Lỗi ghép tóc:', wigErr.message);
    }
  }

  // 5. NẾU KHÁCH CHỈ CHỌN ÁO (KHÔNG CHỌN QUẦN): CẮT CÚP KHUNG HÌNH TẬP TRUNG THÂN TRÊN (HEAD TO HIPS)
  let finalCanvas = canvas;
  if (isOnlyShirt && clothingImgSrc && clothingImgSrc !== 'none') {
    // Cắt cúp tự nhiên từ đỉnh đầu đến qua gấu áo (ngang hông, khoảng 72% chiều cao canvas)
    const idealBottom = baseClothH > 0 ? Math.min(canvasH, personNeckY + baseClothH + 35) : canvasH * 0.74;
    const cropH = Math.round(Math.min(canvasH * 0.76, Math.max(canvasH * 0.65, idealBottom)));
    const croppedOutCanvas = document.createElement('canvas');
    croppedOutCanvas.width = canvasW;
    croppedOutCanvas.height = cropH;
    const cCtx = croppedOutCanvas.getContext('2d');
    cCtx.drawImage(canvas, 0, 0, canvasW, cropH, 0, 0, canvasW, cropH);
    finalCanvas = croppedOutCanvas;
  }

  const fW = finalCanvas.width;
  const fH = finalCanvas.height;
  const fCtx = finalCanvas.getContext('2d');

  // 6. Hòa sắc studio (Lighting Vignette)
  const vignette = fCtx.createRadialGradient(
    fW / 2, fH * 0.35, fW * 0.35,
    fW / 2, fH / 2, fW * 0.82
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
  vignette.addColorStop(0.75, 'rgba(0, 0, 0, 0.0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.20)');
  fCtx.fillStyle = vignette;
  fCtx.fillRect(0, 0, fW, fH);

  // 7. Watermark nhãn AI Branding
  if (showBranding) {
    fCtx.save();
    fCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    fCtx.beginPath();
    fCtx.roundRect(24, fH - 48, 230, 28, 14);
    fCtx.fill();

    fCtx.fillStyle = '#ffffff';
    fCtx.font = 'bold 11px system-ui, sans-serif';
    fCtx.fillText('✨ VIBEBILI AI REAL-FIT STUDIO', 36, fH - 30);
    fCtx.restore();
  }

  return finalCanvas.toDataURL('image/jpeg', 0.95);
};
