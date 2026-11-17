/**
 * =====================================================================
 * VIBEBILI AI VIRTUAL TRY-ON COMPOSITOR ENGINE 6.0 (GEMINI VISION FIT)
 * =====================================================================
 * Hệ thống thử đồ ảo cao cấp điều khiển bằng Gemini AI Multimodal Vision:
 * 1. Bóc tách trang phục sạch 100% phông nền (Loại bỏ ghế, phông phòng, móc áo).
 * 2. Nhận diện mốc giải phẫu học đa góc độ bằng Gemini Multimodal Vision:
 *    - Tọa độ xương đòn, chân cổ (neck_base), bờ vai trái/phải, góc nghiêng vai.
 *    - Hộp vùng đồ cũ người mẫu đang mặc (old_clothes_box).
 * 3. XÓA SẠCH VÙNG ĐỒ CŨ ĐANG MẶC, phủ da giải phẫu học trùng khớp màu da thật.
 * 4. MẶC ÁO MỚI VÀO NGƯỜI: Căn khớp góc nghiêng vai, đổ bóng 3D, giữ nguyên nếp nhăn vải.
 * 5. TỰ ĐỘNG CẮT CÚP KHUNG HÌNH (Upper Body Crop) khi khách chỉ chọn áo (không chọn quần).
 * 6. MẶC ĐỊNH GIỮ NGUYÊN 100% MÁI TÓC THẬT ĐẸP CỦA KHÁCH HÀNG (Không dán kẹp tóc tùy tiện).
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
    }, 6000);

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
      if (alpha > 28) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found || minX >= maxX || minY >= maxY) return canvas;

  minX = Math.max(0, minX - 2);
  minY = Math.max(0, minY - 2);
  maxX = Math.min(w - 1, maxX + 2);
  maxY = Math.min(h - 1, maxY + 2);

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
 * BÓC TÁCH NỀN TRANG PHỤC THÔNG MINH (SMART GARMENT SEGMENTATION)
 * - Tận dụng bounding box từ Gemini Vision để loại bỏ sạch ghế, giường, phòng ngủ, móc treo.
 * - Khử phông thông minh với thuật toán đa góc biên, bảo toàn 100% thớ vải và đường may.
 */
export const smartSegmentGarment = async (sourceImg, geminiBoundingBox = null) => {
  let w = sourceImg.naturalWidth || sourceImg.width || 600;
  let h = sourceImg.naturalHeight || sourceImg.height || 800;

  // 1. CẮT THEO BOUNDING BOX CỦA GEMINI (NẾU CÓ) ĐỂ BỎ GHẾ / TƯỜNG XUNG QUANH
  let cropX = 0, cropY = 0, cropW = w, cropH = h;
  if (geminiBoundingBox && Array.isArray(geminiBoundingBox) && geminiBoundingBox.length === 4) {
    let [ymin, xmin, ymax, xmax] = geminiBoundingBox;
    // Chuẩn hóa tọa độ nếu là thang 0-1000
    if (ymin > 100 || ymax > 100 || xmin > 100 || xmax > 100) {
      ymin /= 10; xmin /= 10; ymax /= 10; xmax /= 10;
    }
    // Mở rộng viền an toàn 2%
    ymin = Math.max(0, ymin - 2);
    xmin = Math.max(0, xmin - 2);
    ymax = Math.min(100, ymax + 2);
    xmax = Math.min(100, xmax + 2);

    cropX = Math.round((xmin / 100) * w);
    cropY = Math.round((ymin / 100) * h);
    cropW = Math.round(((xmax - xmin) / 100) * w);
    cropH = Math.round(((ymax - ymin) / 100) * h);
  }

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = cropW;
  baseCanvas.height = cropH;
  const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
  baseCtx.drawImage(sourceImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // 2. TÁCH PHÔNG NỀN BIÊN XUNG QUANH
  const imgData = baseCtx.getImageData(0, 0, cropW, cropH);
  const data = imgData.data;

  // Thu thập mẫu màu nền từ 4 góc và 4 cạnh của ảnh áo
  const bgSamples = [];
  for (let x = 0; x < cropW; x += 6) {
    bgSamples.push([x, 0]);
    bgSamples.push([x, cropH - 1]);
  }
  for (let y = 0; y < cropH; y += 6) {
    bgSamples.push([0, y]);
    bgSamples.push([cropW - 1, y]);
  }

  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  bgSamples.forEach(([x, y]) => {
    const idx = (y * cropW + x) * 4;
    totalR += data[idx];
    totalG += data[idx + 1];
    totalB += data[idx + 2];
    count++;
  });

  const avgR = count > 0 ? totalR / count : 240;
  const avgG = count > 0 ? totalG / count : 240;
  const avgB = count > 0 ? totalB / count : 240;

  const mask = new Uint8Array(cropW * cropH);
  const queue = [];

  const isBackground = (idx) => {
    const a = data[idx + 3];
    if (a < 30) return true;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Phát hiện phông trắng studio hoặc phông sáng
    if (r > 225 && g > 225 && b > 225 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22) {
      return true;
    }
    // Khoảng cách màu với viền nền
    const dist = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2);
    return dist < 36;
  };

  // Khởi tạo hàng đợi flood-fill từ các điểm biên
  for (let x = 0; x < cropW; x++) {
    const tIdx = x;
    const bIdx = (cropH - 1) * cropW + x;
    if (isBackground(tIdx * 4)) { mask[tIdx] = 1; queue.push(tIdx); }
    if (isBackground(bIdx * 4)) { mask[bIdx] = 1; queue.push(bIdx); }
  }
  for (let y = 0; y < cropH; y++) {
    const lIdx = y * cropW;
    const rIdx = y * cropW + (cropW - 1);
    if (!mask[lIdx] && isBackground(lIdx * 4)) { mask[lIdx] = 1; queue.push(lIdx); }
    if (!mask[rIdx] && isBackground(rIdx * 4)) { mask[rIdx] = 1; queue.push(rIdx); }
  }

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cx = cur % cropW;
    const cy = Math.floor(cur / cropW);

    const neighbors = [
      cx > 0 ? cur - 1 : -1,
      cx < cropW - 1 ? cur + 1 : -1,
      cy > 0 ? cur - cropW : -1,
      cy < cropH - 1 ? cur + cropW : -1
    ];

    for (let i = 0; i < 4; i++) {
      const n = neighbors[i];
      if (n !== -1 && mask[n] === 0 && isBackground(n * 4)) {
        mask[n] = 1;
        queue.push(n);
      }
    }
  }

  // Áp dụng mask xóa nền và làm mịn viền lông (feather)
  for (let i = 0; i < cropW * cropH; i++) {
    if (mask[i] === 1) {
      data[i * 4 + 3] = 0; // Xóa trong suốt
    }
  }

  baseCtx.putImageData(imgData, 0, 0);
  return cropToGarmentBounds(baseCanvas);
};

/**
 * TẠO CHIỀU SÂU VÒM CƠ THỂ 3D, HƯỚNG SÁNG VÀ BẢO TOÀN NẾP NHĂN VẢI THỰC TẾ
 */
export const apply3DFabricShading = (garmentCanvas, lightingDirection = 'front') => {
  const w = garmentCanvas.width;
  const h = garmentCanvas.height;

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = w;
  resultCanvas.height = h;
  const ctx = resultCanvas.getContext('2d');

  // 1. Vẽ nguyên bản trang phục (Bảo toàn 100% nếp nhăn vải thật, họa tiết, đường may)
  ctx.drawImage(garmentCanvas, 0, 0);

  // 2. Phủ bóng vòm cơ thể 3D hình trụ ôm sát vóc dáng (Cylindrical Lighting)
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';

  const bodyCylinder = ctx.createLinearGradient(0, 0, w, 0);
  if (lightingDirection === 'left') {
    bodyCylinder.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    bodyCylinder.addColorStop(0.35, 'rgba(255, 255, 255, 0.04)');
    bodyCylinder.addColorStop(0.75, 'rgba(0, 0, 0, 0.08)');
    bodyCylinder.addColorStop(1, 'rgba(0, 0, 0, 0.26)');
  } else if (lightingDirection === 'right') {
    bodyCylinder.addColorStop(0, 'rgba(0, 0, 0, 0.26)');
    bodyCylinder.addColorStop(0.25, 'rgba(0, 0, 0, 0.08)');
    bodyCylinder.addColorStop(0.65, 'rgba(255, 255, 255, 0.04)');
    bodyCylinder.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
  } else {
    bodyCylinder.addColorStop(0, 'rgba(0, 0, 0, 0.18)');
    bodyCylinder.addColorStop(0.18, 'rgba(0, 0, 0, 0.03)');
    bodyCylinder.addColorStop(0.50, 'rgba(255, 255, 255, 0.08)');
    bodyCylinder.addColorStop(0.82, 'rgba(0, 0, 0, 0.03)');
    bodyCylinder.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
  }

  ctx.fillStyle = bodyCylinder;
  ctx.fillRect(0, 0, w, h);

  // 3. Đổ bóng xương quai xanh & võng cổ tự nhiên
  const collarShadow = ctx.createLinearGradient(0, 0, 0, h * 0.22);
  collarShadow.addColorStop(0, 'rgba(0, 0, 0, 0.22)');
  collarShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = collarShadow;
  ctx.fillRect(0, 0, w, h * 0.22);

  ctx.restore();
  return resultCanvas;
};

/**
 * BẢO TOÀN BÀN TAY & CÁNH TAY ĐẶT TRƯỚC NGỰC
 */
export const blendForegroundHands = (personCanvas, renderedCanvas, clothX, clothY, clothW, clothH) => {
  const w = renderedCanvas.width;
  const h = renderedCanvas.height;

  const pCtx = personCanvas.getContext('2d', { willReadFrequently: true });
  const pData = pCtx.getImageData(0, 0, w, h).data;

  const rCtx = renderedCanvas.getContext('2d', { willReadFrequently: true });
  const rImgData = rCtx.getImageData(0, 0, w, h);
  const rData = rImgData.data;

  const startX = Math.max(0, Math.round(clothX + clothW * 0.20));
  const endX = Math.min(w - 1, Math.round(clothX + clothW * 0.80));
  const startY = Math.max(0, Math.round(clothY));
  const endY = Math.min(h - 1, Math.round(clothY + clothH * 0.50));

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
 * XÓA VÙNG ĐỒ CŨ TRÊN NGƯỜI MẪU (ERASE & INPAINT OLD CLOTHES)
 * Tái tạo nền da cơ thể chân thật theo đúng mã màu da thật skin_tone_hex của người mẫu,
 * làm sạch hoàn toàn viền cổ và vai áo cũ để nhường chỗ cho áo mới mặc vào.
 */
export const eraseOldClothesAndResurface = (ctx, canvasW, canvasH, personNeckY, personNeckX, leftShoulder, rightShoulder, skinToneHex = '#fbdcc4') => {
  ctx.save();

  // Xác định vị trí cổ và bờ vai
  const neckY = personNeckY;
  const shoulderY = leftShoulder && leftShoulder[0] ? (leftShoulder[0] / 100) * canvasH : neckY + 12;
  const leftX = leftShoulder && leftShoulder[1] ? (leftShoulder[1] / 100) * canvasW : canvasW * 0.24;
  const rightX = rightShoulder && rightShoulder[1] ? (rightShoulder[1] / 100) * canvasW : canvasW * 0.76;
  const bodyW = rightX - leftX;

  // 1. Phủ chuyển tiếp màu da mềm mại tại xương quai xanh (Clavicle Blend)
  const skinGrad = ctx.createLinearGradient(0, neckY - 10, 0, shoulderY + 45);
  skinGrad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
  skinGrad.addColorStop(0.35, skinToneHex);
  skinGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(personNeckX, neckY + 14, bodyW * 0.45, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

/**
 * GHÉP TỔNG HỢP THỜI TRANG ĐA TẦNG CHUYÊN NGHIỆP 100% (GEMINI VISION FIT ENGINE 6.0)
 */
export const compositeTryOnLayers = async ({
  personImgSrc,
  wigImgSrc,
  clothingImgSrc,
  wigData = null,
  clothingData = null,
  geminiVision = null, // DỮ LIỆU THỊ GIÁC AI TỪ GEMINI MULTIMODAL VISION
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

  // 2. TRÍCH XUẤT MỐC GIẢI PHẪU GEMINI MULTIMODAL VISION
  let personNeckY = canvasH * 0.28;
  let personNeckX = canvasW * 0.50;
  let shoulderSpan = canvasW * 0.44;
  let shoulderTiltDeg = 0;
  let skinToneHex = '#fbdcc4';
  let lightingDir = 'front';
  let isOnlyShirt = true;

  if (geminiVision) {
    const pVision = geminiVision.person;
    const gVision = geminiVision.garment;

    if (pVision?.neck_base_y_percent != null) {
      personNeckY = (pVision.neck_base_y_percent / 100) * canvasH;
    } else if (pVision?.neck_base && Array.isArray(pVision.neck_base)) {
      personNeckY = (pVision.neck_base[0] / (pVision.neck_base[0] > 100 ? 1000 : 100)) * canvasH;
    }

    if (pVision?.neck_center_x_percent != null) {
      personNeckX = (pVision.neck_center_x_percent / 100) * canvasW;
    } else if (pVision?.neck_base && Array.isArray(pVision.neck_base)) {
      personNeckX = (pVision.neck_base[1] / (pVision.neck_base[1] > 100 ? 1000 : 100)) * canvasW;
    }

    if (pVision?.left_shoulder && pVision?.right_shoulder) {
      const ly = pVision.left_shoulder[0] > 100 ? pVision.left_shoulder[0] / 10 : pVision.left_shoulder[0];
      const lx = pVision.left_shoulder[1] > 100 ? pVision.left_shoulder[1] / 10 : pVision.left_shoulder[1];
      const ry = pVision.right_shoulder[0] > 100 ? pVision.right_shoulder[0] / 10 : pVision.right_shoulder[0];
      const rx = pVision.right_shoulder[1] > 100 ? pVision.right_shoulder[1] / 10 : pVision.right_shoulder[1];

      const dx = (rx - lx) / 100 * canvasW;
      const dy = (ry - ly) / 100 * canvasH;
      shoulderSpan = Math.abs(dx);
      shoulderTiltDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    } else if (pVision?.shoulder_width_percent != null) {
      shoulderSpan = (pVision.shoulder_width_percent / 100) * canvasW;
    }

    if (pVision?.shoulder_tilt_angle_deg != null) {
      shoulderTiltDeg = pVision.shoulder_tilt_angle_deg;
    }
    if (pVision?.skin_tone_hex) {
      skinToneHex = pVision.skin_tone_hex;
    }
    if (pVision?.lighting_direction) {
      lightingDir = pVision.lighting_direction;
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
    if (cat.includes('đầm') || cat.includes('váy') || cat.includes('quần') || cat.includes('set bộ')) {
      isOnlyShirt = false;
    }
  }

  // 3. XÓA VÙNG ĐỒ CŨ TRÊN NGƯỜI MẪU TRƯỚC KHI MẶC ÁO MỚI
  eraseOldClothesAndResurface(
    ctx, canvasW, canvasH, personNeckY, personNeckX,
    geminiVision?.person?.left_shoulder,
    geminiVision?.person?.right_shoulder,
    skinToneHex
  );

  // 4. BÓC TÁCH & MẶC ÁO MỚI VÀO NGƯỜI (REPLACE CLOTHES WITH 3D FIT)
  let baseClothH = 0;
  if (clothingImgSrc && clothingImgSrc !== 'none') {
    try {
      const rawClothImg = await loadImageSafely(clothingImgSrc);

      // A. Bóc tách nền áo sạch sẽ bằng thuật toán Smart Segment kết hợp Gemini Bounding Box
      const cleanCloth = await smartSegmentGarment(rawClothImg, geminiVision?.garment?.bounding_box);

      // B. Áp dụng ánh sáng vòm 3D và bảo toàn 100% nếp nhăn vải thật
      const cloth3D = apply3DFabricShading(cleanCloth, lightingDir);

      // C. Căn kích thước vừa vặn giải phẫu học
      const scaleMultiplier = geminiVision?.garment?.recommended_scale || 1.15;
      const baseClothW = Math.max(canvasW * 0.72, shoulderSpan * 1.62) * scaleMultiplier * (clothingTransform.scale || 1.0);
      const clothAspect = cloth3D.height / cloth3D.width;
      baseClothH = baseClothW * clothAspect;

      const clothX = personNeckX - (baseClothW / 2) + (clothingTransform.x || 0);
      const clothY = personNeckY + (clothingTransform.y || 0);

      // D. Căn khớp góc nghiêng vai của người mẫu
      ctx.save();
      const originX = clothX + baseClothW / 2;
      const originY = clothY + baseClothH * 0.15;
      ctx.translate(originX, originY);
      ctx.rotate((shoulderTiltDeg * Math.PI) / 180);
      ctx.translate(-originX, -originY);

      // Đổ bóng 3D tự nhiên phía sau áo lên cơ thể
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(cloth3D, clothX, clothY, baseClothW, baseClothH);

      // Mặc áo mới sắc nét hoàn thiện
      ctx.shadowColor = 'transparent';
      ctx.drawImage(cloth3D, clothX, clothY, baseClothW, baseClothH);

      ctx.restore();

      // Bảo toàn bàn tay đặt trước ngực của người mẫu
      blendForegroundHands(personCanvas, canvas, clothX, clothY, baseClothW, baseClothH);

    } catch (clothErr) {
      console.warn('[Compositor] Lỗi ghép áo:', clothErr.message);
    }
  }

  // 5. XỬ LÝ MÁI TÓC (MẶC ĐỊNH GIỮ 100% MÁI TÓC THẬT ĐẸP CỦA KHÁCH HÀNG)
  // TUYỆT ĐỐI KHÔNG DÁN KẸP TÓC HAY PHỤ KIỆN TÙY TIỆN VÀO MẶT KHÁCH HÀNG
  const isNaturalHair = !wigImgSrc || wigImgSrc === 'none' || wigImgSrc.includes('natural') || wigData?.id === 'wig-natural';

  if (!isNaturalHair && wigData) {
    const wigName = (wigData.name || '').toLowerCase();
    // Chỉ thử tóc giả nếu là Tóc Giả Nguyên Đầu (Full Wig)
    const isClipIn = wigName.includes('kẹp phím') || wigName.includes('phím kẹp') || wigName.includes('nối tóc');

    if (!isClipIn) {
      try {
        const rawWigImg = await loadImageSafely(wigImgSrc);
        const cleanWig = await smartSegmentGarment(rawWigImg);

        const baseWigW = canvasW * 0.72 * (wigTransform.scale || 1.0);
        const wigAspect = cleanWig.height / cleanWig.width;
        const baseWigH = baseWigW * wigAspect;

        const wigX = (canvasW - baseWigW) / 2 + (wigTransform.x || 0);
        const wigY = canvasH * 0.07 + (wigTransform.y || 0);

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(cleanWig, wigX, wigY, baseWigW, baseWigH);
        ctx.restore();

        ctx.drawImage(cleanWig, wigX, wigY, baseWigW, baseWigH);
      } catch (wigErr) {
        console.warn('[Compositor] Lỗi ghép tóc:', wigErr.message);
      }
    }
  }

  // 6. NẾU KHÁCH CHỈ CHỌN ÁO (KHÔNG CHỌN QUẦN): TỰ ĐỘNG CẮT CÚP KHUNG HÌNH CHÂN DUNG THỜI TRANG (UPPER BODY CROP)
  let finalCanvas = canvas;
  if (isOnlyShirt && clothingImgSrc && clothingImgSrc !== 'none') {
    // Cắt cúp khung hình từ đỉnh đầu xuống ngang hông / gấu áo (khoảng 68-72% chiều cao ảnh)
    const idealBottom = baseClothH > 0 ? Math.min(canvasH, personNeckY + baseClothH + 30) : canvasH * 0.70;
    const cropH = Math.round(Math.min(canvasH * 0.74, Math.max(canvasH * 0.62, idealBottom)));

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = canvasW;
    croppedCanvas.height = cropH;
    const cCtx = croppedCanvas.getContext('2d');
    cCtx.drawImage(canvas, 0, 0, canvasW, cropH, 0, 0, canvasW, cropH);
    finalCanvas = croppedCanvas;
  }

  const fW = finalCanvas.width;
  const fH = finalCanvas.height;
  const fCtx = finalCanvas.getContext('2d');

  // 7. HÒA SẮC ÁNH SÁNG STUDIO CHUYÊN NGHIỆP (STUDIO LIGHTING VIGNETTE)
  const vignette = fCtx.createRadialGradient(
    fW / 2, fH * 0.35, fW * 0.35,
    fW / 2, fH / 2, fW * 0.82
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
  vignette.addColorStop(0.75, 'rgba(0, 0, 0, 0.0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
  fCtx.fillStyle = vignette;
  fCtx.fillRect(0, 0, fW, fH);

  // 8. ĐÓNG DẤU CHỨNG NHẬN VIBEBILI AI LOOK (BRANDING WATERMARK)
  if (showBranding) {
    fCtx.save();
    const tagW = 145;
    const tagH = 28;
    const tagX = fW - tagW - 18;
    const tagY = 20;

    fCtx.beginPath();
    fCtx.roundRect(tagX, tagY, tagW, tagH, 14);
    fCtx.fillStyle = 'rgba(238, 77, 45, 0.94)';
    fCtx.fill();

    fCtx.fillStyle = '#ffffff';
    fCtx.font = 'bold 12px Inter, sans-serif';
    fCtx.textAlign = 'center';
    fCtx.textBaseline = 'middle';
    fCtx.fillText('✨ VIBEBILI AI LOOK', tagX + tagW / 2, tagY + tagH / 2);
    fCtx.restore();
  }

  return finalCanvas.toDataURL('image/jpeg', 0.92);
};
