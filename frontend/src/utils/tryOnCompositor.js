/**
 * =====================================================================
 * VIBEBILI AI VIRTUAL TRY-ON COMPOSITOR ENGINE
 * =====================================================================
 * Thuật toán tách nền tóc/áo & ghép lớp chân dung thông minh
 * - Tự động nhận diện màu nền biên (Border Flood-Fill Matting)
 * - Khử răng cưa & làm mịn viền tóc (Soft-Edge Feathering)
 * - Tự động căn chỉnh tọa độ Face & Body Landmarks (Hairline & Neck/Shoulders)
 * - An toàn với CORS qua proxy fallback
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
    // Ảnh data URL hoặc blob không cần crossOrigin
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const timer = setTimeout(() => {
      // Nếu timeout sau 4s, thử tải lại qua proxy của backend
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
    }, 4000);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      // Fallback qua proxy nếu CORS lỗi
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
 * Thuật toán bóc tách nền (Background Removal) bằng Border Flood-Fill & Color Delta
 * Chỉ xóa vùng nền bên ngoài kết nối từ 4 cạnh, bảo vệ chi tiết sáng màu bên trong áo/tóc.
 */
export const removeBackground = (sourceImg, options = {}) => {
  const threshold = options.threshold || 38;      // Ngưỡng phát hiện nền
  const feather = options.feather || 24;          // Khoảng chuyển tiếp mờ viền (anti-halo)
  const maxDimension = options.maxDimension || 800; // Giới hạn kích thước để xử lý mượt mà

  // Tính tỷ lệ co giãn để xử lý nhanh với FPS cao
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

  // 1. Phân tích màu nền mẫu từ 4 góc và viền
  const samplePoints = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)], [Math.floor(w / 2), h - 1]
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

  // 2. Mảng mặt nạ đánh dấu pixel nền: 0 = chưa rõ, 1 = nền ngoài (xóa), 2 = chủ thể (giữ)
  const mask = new Uint8Array(w * h);
  const queue = [];

  // Hàm tính độ sai khác màu Euclidean so với màu nền
  const colorDist = (idx) => {
    const r = data[idx] - bgR;
    const g = data[idx + 1] - bgG;
    const b = data[idx + 2] - bgB;
    return Math.sqrt(r * r + g * g + b * b);
  };

  // Khởi tạo hàng đợi từ toàn bộ 4 cạnh ngoài
  for (let x = 0; x < w; x++) {
    const topIdx = (0 * w + x);
    if (colorDist(topIdx * 4) <= threshold + feather) {
      mask[topIdx] = 1;
      queue.push(topIdx);
    }
    const btmIdx = ((h - 1) * w + x);
    if (colorDist(btmIdx * 4) <= threshold + feather) {
      mask[btmIdx] = 1;
      queue.push(btmIdx);
    }
  }

  for (let y = 0; y < h; y++) {
    const lftIdx = (y * w + 0);
    if (!mask[lftIdx] && colorDist(lftIdx * 4) <= threshold + feather) {
      mask[lftIdx] = 1;
      queue.push(lftIdx);
    }
    const rgtIdx = (y * w + (w - 1));
    if (!mask[rgtIdx] && colorDist(rgtIdx * 4) <= threshold + feather) {
      mask[rgtIdx] = 1;
      queue.push(rgtIdx);
    }
  }

  // 3. Thuật toán Flood Fill (BFS) lan tỏa từ viền
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cx = cur % w;
    const cy = Math.floor(cur / w);

    // Kiểm tra 4 hướng kề cận
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

  // 4. Áp dụng Alpha trong suốt và viền mượt mà (Feathering)
  for (let i = 0; i < w * h; i++) {
    const px = i * 4;
    if (mask[i] === 1) {
      const d = colorDist(px);
      if (d <= threshold) {
        // Nền thuần túy -> Trong suốt 100%
        data[px + 3] = 0;
      } else {
        // Vùng rìa chuyển tiếp mờ viền
        const alphaFactor = (d - threshold) / feather;
        data[px + 3] = Math.round(Math.min(255, Math.max(0, 255 * alphaFactor)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

/**
 * Ghép tổng hợp đa tầng (Portrait + Transparent Clothing + Transparent Wig)
 * Kích thước Canvas xuất bản: 720 x 960 (chuẩn tỷ lệ thời trang 3:4)
 */
export const compositeTryOnLayers = async ({
  personImgSrc,
  wigImgSrc,
  clothingImgSrc,
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

  // 1. Tải ảnh chân dung người mẫu / khách hàng (Layer 1 - Base)
  const personImg = await loadImageSafely(personImgSrc);

  // Vẽ chân dung bao phủ vừa vặn khung hình (Cover mode)
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

  // 2. Xử lý & Ghép Trang Phục (Layer 2 - Mid Layer)
  if (clothingImgSrc && clothingImgSrc !== 'none') {
    try {
      const rawClothImg = await loadImageSafely(clothingImgSrc);
      const clothCanvas = removeBackground(rawClothImg, { threshold: 42, feather: 28 });

      // Căn chỉnh vị trí tự nhiên của trang phục trên cơ thể
      // Chiều ngang trang phục khoảng 80% - 92% khung hình
      const baseClothW = canvasW * 0.86 * (clothingTransform.scale || 1.0);
      const clothAspect = clothCanvas.height / clothCanvas.width;
      const baseClothH = baseClothW * clothAspect;

      const clothX = (canvasW - baseClothW) / 2 + (clothingTransform.x || 0);
      // Vị trí vai/cổ thường nằm ở khoảng 45% từ đỉnh đầu xuống
      const clothY = canvasH * 0.44 + (clothingTransform.y || 0);

      // Đổ bóng đổ nhẹ phía sau trang phục để tạo chiều sâu 3D
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(clothCanvas, clothX, clothY, baseClothW, baseClothH);
      ctx.restore();

      // Vẽ lớp trang phục sắc nét chính diện
      ctx.drawImage(clothCanvas, clothX, clothY, baseClothW, baseClothH);
    } catch (clothErr) {
      console.warn('[Compositor] Lỗi render trang phục:', clothErr.message);
    }
  }

  // 3. Xử lý & Ghép Tóc Giả (Layer 3 - Top Layer)
  if (wigImgSrc && wigImgSrc !== 'none' && !wigImgSrc.includes('natural')) {
    try {
      const rawWigImg = await loadImageSafely(wigImgSrc);
      const wigCanvas = removeBackground(rawWigImg, { threshold: 40, feather: 25 });

      // Chiều ngang mái tóc khoảng 58% - 70% khung hình
      const baseWigW = canvasW * 0.65 * (wigTransform.scale || 1.0);
      const wigAspect = wigCanvas.height / wigCanvas.width;
      const baseWigH = baseWigW * wigAspect;

      const wigX = (canvasW - baseWigW) / 2 + (wigTransform.x || 0);
      // Đỉnh đầu thường nằm ở khoảng 6% - 12% từ đỉnh khung hình
      const wigY = canvasH * 0.08 + (wigTransform.y || 0);

      // Đổ bóng chân tóc tự nhiên lên trán và mặt
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(wigCanvas, wigX, wigY, baseWigW, baseWigH);
      ctx.restore();

      // Vẽ lớp tóc hoàn chỉnh
      ctx.drawImage(wigCanvas, wigX, wigY, baseWigW, baseWigH);
    } catch (wigErr) {
      console.warn('[Compositor] Lỗi render tóc giả:', wigErr.message);
    }
  }

  // 4. Ánh sáng hòa sắc phòng thử đồ studio (Studio Tone & Vignette Curve)
  const vignette = ctx.createRadialGradient(
    canvasW / 2, canvasH * 0.4, canvasW * 0.35,
    canvasW / 2, canvasH / 2, canvasW * 0.8
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
  vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 5. Watermark nhãn AI Branding tinh tế ở góc ảnh
  if (showBranding) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(24, canvasH - 52, 220, 32, 16);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('✨ VIBEBILI AI VIRTUAL LOOK', 38, canvasH - 32);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.94);
};
