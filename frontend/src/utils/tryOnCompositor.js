/**
 * =====================================================================
 * VIBEBILI AI VIRTUAL TRY-ON COMPOSITOR ENGINE 4.0 (REAL-FIT PRO)
 * =====================================================================
 * Hệ thống thử đồ ảo cao cấp chuẩn giải phẫu học cơ thể (Anatomical Fitting):
 * 1. Bóc tách trang phục sạch 100% nền biên, tự động xén sát viền áo (Tight Bounding Box).
 * 2. Căn chỉnh giải phẫu tự nhiên: Viền cổ áo khớp chân cổ/xương quai xanh (y ~ 28%-30%).
 * 3. Bảo toàn 100% nếp nhăn vải (Authentic Wrinkles) và kết cấu sợi dệt thực tế.
 * 4. Hiệu ứng ánh sáng vòm 3D (Cylindrical Torso Shading) & Đổ bóng cằm/cổ tự nhiên.
 * 5. Giữ nguyên bàn tay & cánh tay phía trước áo (Hand Occlusion Preservation).
 * 6. Xóa bỏ hoàn toàn tóc vẽ giả; Mặc định giữ nguyên mái tóc thật tuyệt đẹp của khách hàng!
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
 * Chỉ loại bỏ các pixel nền nối liền với viền ngoài, bảo toàn 100% chi tiết họa tiết bên trong áo
 */
export const removeBackground = (sourceImg, options = {}) => {
  const threshold = options.threshold || 32;
  const feather = options.feather || 16;
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

  // Lấy mẫu màu nền từ 4 góc và 12 điểm rìa biên ngoài
  const samplePoints = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1],
    [3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4]
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  samplePoints.forEach(([x, y]) => {
    const idx = (y * w + x) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  });
  bgR = Math.round(bgR / samplePoints.length);
  bgG = Math.round(bgG / samplePoints.length);
  bgB = Math.round(bgB / samplePoints.length);

  const mask = new Uint8Array(w * h);
  const queue = [];

  const colorDist = (idx) => {
    const r = data[idx] - bgR;
    const g = data[idx + 1] - bgG;
    const b = data[idx + 2] - bgB;
    return Math.sqrt(r * r + g * g + b * b);
  };

  // Chỉ nạp các pixel thực sự ở viền ngoài vào hàng đợi BFS
  for (let x = 0; x < w; x++) {
    const topIdx = x;
    if (colorDist(topIdx * 4) <= threshold + feather) {
      mask[topIdx] = 1;
      queue.push(topIdx);
    }
    const btmIdx = (h - 1) * w + x;
    if (colorDist(btmIdx * 4) <= threshold + feather) {
      mask[btmIdx] = 1;
      queue.push(btmIdx);
    }
  }

  for (let y = 0; y < h; y++) {
    const lftIdx = y * w;
    if (!mask[lftIdx] && colorDist(lftIdx * 4) <= threshold + feather) {
      mask[lftIdx] = 1;
      queue.push(lftIdx);
    }
    const rgtIdx = y * w + (w - 1);
    if (!mask[rgtIdx] && colorDist(rgtIdx * 4) <= threshold + feather) {
      mask[rgtIdx] = 1;
      queue.push(rgtIdx);
    }
  }

  // BFS Flood Fill loang nền từ ngoài vào trong
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
        const d = colorDist(nIdx * 4);
        if (d <= threshold + feather) {
          mask[nIdx] = 1;
          queue.push(nIdx);
        }
      }
    }
  }

  // Xóa nền với làm mịn biên alpha mềm mại
  for (let i = 0; i < w * h; i++) {
    const px = i * 4;
    if (mask[i] === 1) {
      const d = colorDist(px);
      if (d <= threshold) {
        data[px + 3] = 0;
      } else {
        const alphaFactor = (d - threshold) / feather;
        data[px + 3] = Math.round(Math.min(255, Math.max(0, 255 * alphaFactor)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

/**
 * XÉN SÁT BIÊN ĐỘ THỰC TẾ CỦA TRANG PHỤC (TIGHT BOUNDING BOX CROPPER)
 * Loại bỏ toàn bộ khoảng trắng rỗng xung quanh áo để tọa độ y=0 chính là bờ vai áo thật!
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
      if (alpha > 25) { // Pixel áo có độ hiển thị rõ
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found || minX >= maxX || minY >= maxY) return canvas;

  // Thêm lề an toàn 4px
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
 * (3D Cylindrical Torso Shading & Wrinkle Preservation)
 */
export const apply3DFabricShading = (garmentCanvas, personLuminance = 0.5) => {
  const w = garmentCanvas.width;
  const h = garmentCanvas.height;

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = w;
  resultCanvas.height = h;
  const ctx = resultCanvas.getContext('2d');

  // 1. Vẽ nguyên bản trang phục (Bảo toàn 100% nếp nhăn vải thật và kết cấu len/jeans/lụa)
  ctx.drawImage(garmentCanvas, 0, 0);

  // 2. Phủ bóng đổ vòm cơ thể hình trụ 3D (Cylindrical Lighting)
  // Hai bên sườn ôm cong ra sau nên tối hơn, phần ngực chính diện đón sáng tự nhiên
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop'; // Chỉ áp dụng lên các pixel của áo
  const bodyCylinder = ctx.createLinearGradient(0, 0, w, 0);
  bodyCylinder.addColorStop(0, 'rgba(0, 0, 0, 0.22)');    // Đổ bóng sườn trái
  bodyCylinder.addColorStop(0.18, 'rgba(0, 0, 0, 0.04)');
  bodyCylinder.addColorStop(0.50, 'rgba(255, 255, 255, 0.09)'); // Ánh sáng nổi giữa ngực
  bodyCylinder.addColorStop(0.82, 'rgba(0, 0, 0, 0.04)');
  bodyCylinder.addColorStop(1, 'rgba(0, 0, 0, 0.22)');    // Đổ bóng sườn phải
  ctx.fillStyle = bodyCylinder;
  ctx.fillRect(0, 0, w, h);

  // 3. Đổ bóng võng cổ & xương đòn tự nhiên (Collarbone Falloff Shadow)
  const collarShadow = ctx.createLinearGradient(0, 0, 0, h * 0.28);
  collarShadow.addColorStop(0, 'rgba(0, 0, 0, 0.25)'); // Bóng dưới cằm
  collarShadow.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = collarShadow;
  ctx.fillRect(0, 0, w, h * 0.28);

  ctx.restore();
  return resultCanvas;
};

/**
 * BẢO TOÀN BÀN TAY & CÁNH TAY TRƯỚC ÁO (HAND OCCLUSION PRESERVATION)
 * Nếu khách hàng có bàn tay chống cằm/đặt trước ngực, đưa bàn tay lên phía trước áo
 */
export const blendForegroundHands = (personCanvas, renderedCanvas, clothX, clothY, clothW, clothH) => {
  const w = renderedCanvas.width;
  const h = renderedCanvas.height;

  const pCtx = personCanvas.getContext('2d', { willReadFrequently: true });
  const pData = pCtx.getImageData(0, 0, w, h).data;

  const rCtx = renderedCanvas.getContext('2d', { willReadFrequently: true });
  const rImgData = rCtx.getImageData(0, 0, w, h);
  const rData = rImgData.data;

  // Quét vùng quanh ngực và cằm nơi bàn tay có thể xuất hiện
  const startX = Math.max(0, Math.round(clothX + clothW * 0.25));
  const endX = Math.min(w - 1, Math.round(clothX + clothW * 0.75));
  const startY = Math.max(0, Math.round(clothY));
  const endY = Math.min(h - 1, Math.round(clothY + clothH * 0.45));

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * w + x) * 4;
      const r = pData[idx];
      const g = pData[idx + 1];
      const b = pData[idx + 2];

      // Nhận diện màu da người trong hệ màu YCbCr
      const cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128;
      const cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128;

      const isSkin = (cb >= 78 && cb <= 126 && cr >= 134 && cr <= 172) &&
                     (r > 95 && g > 40 && b > 20 && r > g && g > b);

      if (isSkin) {
        // Phục hồi lại pixel ngón tay/bàn tay của người mẫu lên trên lớp áo
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
 * GHÉP TỔNG HỢP THỜI TRANG ĐA TẦNG CHUYÊN NGHIỆP 100% (SMART REAL-FIT TRY-ON)
 */
export const compositeTryOnLayers = async ({
  personImgSrc,
  wigImgSrc,
  clothingImgSrc,
  wigData = null,
  clothingData = null,
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

  // 2. XỬ LÝ & GHÉP TRANG PHỤC THẬT (REAL GARMENT FIT)
  let appliedClothX = 0, appliedClothY = 0, appliedClothW = 0, appliedClothH = 0;

  if (clothingImgSrc && clothingImgSrc !== 'none') {
    try {
      const rawClothImg = await loadImageSafely(clothingImgSrc);
      
      // Bóc tách nền áo sạch sẽ
      const cleanClothBg = removeBackground(rawClothImg, { threshold: 34, feather: 18 });
      // Xén sát tuyệt đối vào biên áo (Bounding Box)
      const croppedCloth = cropToGarmentBounds(cleanClothBg);
      // Tạo ánh sáng vòm 3D & nổi bật nếp nhăn tự nhiên
      const cloth3D = apply3DFabricShading(croppedCloth);

      // CĂN CHỈNH GIẢI PHẪU CHUẨN XÁC:
      // Trong ảnh chân dung, bờ vai người mẫu nằm ở khoảng 29%-33% chiều cao khung hình
      // Chiều ngang bờ vai chiếm khoảng 78%-84% khung hình
      const baseClothW = canvasW * 0.82 * (clothingTransform.scale || 1.0);
      const clothAspect = cloth3D.height / cloth3D.width;
      const baseClothH = baseClothW * clothAspect;

      const clothX = (canvasW - baseClothW) / 2 + (clothingTransform.x || 0);
      // Khớp viền cổ áo ngay chân cổ / xương quai xanh (29% chiều cao canvas)
      const clothY = canvasH * 0.29 + (clothingTransform.y || 0);

      appliedClothX = clothX;
      appliedClothY = clothY;
      appliedClothW = baseClothW;
      appliedClothH = baseClothH;

      // Đổ bóng 3D mềm mại phía sau áo lên cơ thể
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(cloth3D, clothX, clothY, baseClothW, baseClothH);
      ctx.restore();

      // Vẽ lớp trang phục sắc nét hoàn thiện
      ctx.drawImage(cloth3D, clothX, clothY, baseClothW, baseClothH);

      // Bảo toàn bàn tay/ngón tay đặt trước ngực
      blendForegroundHands(personCanvas, canvas, clothX, clothY, baseClothW, baseClothH);

    } catch (clothErr) {
      console.warn('[Compositor] Lỗi ghép áo:', clothErr.message);
    }
  }

  // 3. XỬ LÝ TÓC (TUYỆT ĐỐI KHÔNG VẼ TÓC GIẢ HÌNH VẼ NẾU LÀ TÓC TỰ NHIÊN)
  // Chỉ khi khách hàng chủ động chọn một mẫu tóc giả dạng ảnh trong suốt thật thì mới ghép
  const isNaturalHair = !wigImgSrc || wigImgSrc === 'none' || wigImgSrc.includes('natural') || wigData?.id === 'wig-natural';

  if (!isNaturalHair) {
    // Nếu khách hàng chọn đổi kiểu tóc giả, chỉ dùng ảnh tóc thật đã tách nền sạch
    try {
      const rawWigImg = await loadImageSafely(wigImgSrc);
      // Tách nền ảnh tóc
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

  // 4. Hòa sắc studio (Lighting Vignette Curve)
  const vignette = ctx.createRadialGradient(
    canvasW / 2, canvasH * 0.35, canvasW * 0.35,
    canvasW / 2, canvasH / 2, canvasW * 0.82
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
  vignette.addColorStop(0.75, 'rgba(0, 0, 0, 0.0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.20)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 5. Watermark nhãn AI Branding
  if (showBranding) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(24, canvasH - 48, 230, 28, 14);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('✨ VIBEBILI AI REAL-FIT STUDIO', 36, canvasH - 30);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.95);
};
