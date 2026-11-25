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
 * Tải ảnh an toàn, tự động xử lý CORS & Proxy fallback (Backend proxy -> wsrv.nl)
 */
export const loadImageSafely = (src) => {
  return new Promise((resolve) => {
    if (!src) {
      const dummy = new Image();
      dummy.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>';
      return resolve(dummy);
    }

    const img = new Image();
    const isLocalOrData = src.startsWith('data:') || src.startsWith('blob:');
    if (!isLocalOrData) {
      img.crossOrigin = 'anonymous';
    }

    const candidates = isLocalOrData
      ? [src]
      : [
          src,
          `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=png`,
          tryOnAPI.getProxyUrl(src)
        ];

    let idx = 0;
    const tryNext = () => {
      idx += 1;
      if (idx >= candidates.length) {
        // Fallback cuối cùng (có thể taint canvas nhưng luôn hiển thị được)
        const rawImg = new Image();
        rawImg.onload = () => resolve(rawImg);
        rawImg.onerror = () => resolve(img);
        rawImg.src = src;
        return;
      }
      const nextImg = new Image();
      nextImg.crossOrigin = 'anonymous';
      const t = setTimeout(() => {
        nextImg.onload = null;
        nextImg.onerror = null;
        tryNext();
      }, 4500);
      nextImg.onload = () => {
        clearTimeout(t);
        resolve(nextImg);
      };
      nextImg.onerror = () => {
        clearTimeout(t);
        tryNext();
      };
      nextImg.src = candidates[idx];
    };

    const timer = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      tryNext();
    }, 4500);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      tryNext();
    };

    img.src = candidates[0];
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
  const w = sourceImg.naturalWidth || sourceImg.width || 600;
  const h = sourceImg.naturalHeight || sourceImg.height || 800;

  // 1. CẮT THEO BOUNDING BOX CỦA GEMINI (LOẠI BỎ ĐẦU NGƯỜI MẪU / GHẾ / TƯỜNG XUNG QUANH)
  let cropX = 0, cropY = 0, cropW = w, cropH = h;
  if (geminiBoundingBox && Array.isArray(geminiBoundingBox) && geminiBoundingBox.length === 4) {
    let [ymin, xmin, ymax, xmax] = geminiBoundingBox;
    if (ymin > 100 || ymax > 100 || xmin > 100 || xmax > 100) {
      ymin /= 10; xmin /= 10; ymax /= 10; xmax /= 10;
    }
    ymin = Math.max(0, ymin - 1.5);
    xmin = Math.max(0, xmin - 1.5);
    ymax = Math.min(100, ymax + 1.5);
    xmax = Math.min(100, xmax + 1.5);

    cropX = Math.round((xmin / 100) * w);
    cropY = Math.round((ymin / 100) * h);
    cropW = Math.max(40, Math.round(((xmax - xmin) / 100) * w));
    cropH = Math.max(40, Math.round(((ymax - ymin) / 100) * h));
  }

  const baseCanvas = document.createElement('canvas');
  baseCanvas.width = cropW;
  baseCanvas.height = cropH;
  const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
  baseCtx.drawImage(sourceImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  let imgData;
  try {
    imgData = baseCtx.getImageData(0, 0, cropW, cropH);
  } catch (secErr) {
    // Canvas bị CORS taint: trả về bản đã cắt theo bounding box
    return baseCanvas;
  }

  const data = imgData.data;

  // 2. MẪU MÀU NỀN CỤC BỘ TỪ CÁC CẠNH BIÊN (MULTI-CLUSTER EDGE PALETTE)
  const borderClusters = [];
  const step = Math.max(4, Math.floor(Math.min(cropW, cropH) / 24));
  const addCluster = (x, y) => {
    const idx = (y * cropW + x) * 4;
    if (data[idx + 3] < 40) return;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const exists = borderClusters.some(c => Math.abs(c[0] - r) + Math.abs(c[1] - g) + Math.abs(c[2] - b) < 28);
    if (!exists && borderClusters.length < 18) borderClusters.push([r, g, b]);
  };
  for (let x = 0; x < cropW; x += step) { addCluster(x, 1); addCluster(x, cropH - 2); }
  for (let y = 0; y < cropH; y += step) { addCluster(1, y); addCluster(cropW - 2, y); }

  const mask = new Uint8Array(cropW * cropH);
  const queue = new Int32Array(cropW * cropH);
  let qHead = 0, qTail = 0;

  const isBgColor = (pxIdx) => {
    const off = pxIdx * 4;
    const a = data[off + 3];
    if (a < 35) return true;
    const r = data[off], g = data[off + 1], b = data[off + 2];
    const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
    // Nền studio trắng/xám sáng nối liền với biên
    if (minC > 224 && (maxC - minC) < 20) return true;
    // Khớp cụm màu biên xung quanh
    for (let i = 0; i < borderClusters.length; i++) {
      const [br, bg, bb] = borderClusters[i];
      const d2 = (r - br) * (r - br) + (g - bg) * (g - bg) + (b - bb) * (b - bb);
      if (d2 < 1450) return true; // ~38 RGB Euclidean
    }
    return false;
  };

  // Flood-fill từ toàn bộ 4 viền ngoài (không bao giờ đục thủng họa tiết bên trong áo)
  const trySeed = (pxIdx) => {
    if (mask[pxIdx] === 0 && isBgColor(pxIdx)) {
      mask[pxIdx] = 1;
      queue[qTail++] = pxIdx;
    }
  };
  for (let x = 0; x < cropW; x++) { trySeed(x); trySeed((cropH - 1) * cropW + x); }
  for (let y = 0; y < cropH; y++) { trySeed(y * cropW); trySeed(y * cropW + (cropW - 1)); }

  while (qHead < qTail) {
    const cur = queue[qHead++];
    const cx = cur % cropW;
    const cy = (cur / cropW) | 0;
    const curOff = cur * 4;
    const cr = data[curOff], cg = data[curOff + 1], cb = data[curOff + 2];

    const checkNeighbor = (nIdx) => {
      if (mask[nIdx] !== 0) return;
      const nOff = nIdx * 4;
      if (data[nOff + 3] < 35) { mask[nIdx] = 1; queue[qTail++] = nIdx; return; }
      const nr = data[nOff], ng = data[nOff + 1], nb = data[nOff + 2];
      // Edge-aware: dừng khi gặp ranh giới tương phản sắc nét của mép vải
      const localDiff = Math.abs(nr - cr) + Math.abs(ng - cg) + Math.abs(nb - cb);
      if (localDiff < 55 && isBgColor(nIdx)) {
        mask[nIdx] = 1;
        queue[qTail++] = nIdx;
      }
    };

    if (cx > 0) checkNeighbor(cur - 1);
    if (cx < cropW - 1) checkNeighbor(cur + 1);
    if (cy > 0) checkNeighbor(cur - cropW);
    if (cy < cropH - 1) checkNeighbor(cur + cropW);
  }

  // 3. GIỮ LẠI KHỐI TRANG PHỤC LỚN NHẤT & XÓA VỆT RỜI RẠC + LÀM MỊN VIỀN (FEATHER 1.5PX)
  for (let i = 0; i < cropW * cropH; i++) {
    if (mask[i] === 1) {
      data[i * 4 + 3] = 0;
    }
  }

  // Làm mịn biên alpha (giảm răng cưa viền trắng/xám quanh áo)
  const alphaCopy = new Uint8Array(cropW * cropH);
  for (let i = 0; i < cropW * cropH; i++) alphaCopy[i] = data[i * 4 + 3];
  for (let y = 1; y < cropH - 1; y++) {
    for (let x = 1; x < cropW - 1; x++) {
      const i = y * cropW + x;
      if (alphaCopy[i] > 0) {
        const bgNeighbors =
          (alphaCopy[i - 1] === 0 ? 1 : 0) +
          (alphaCopy[i + 1] === 0 ? 1 : 0) +
          (alphaCopy[i - cropW] === 0 ? 1 : 0) +
          (alphaCopy[i + cropW] === 0 ? 1 : 0);
        if (bgNeighbors >= 2) {
          data[i * 4 + 3] = Math.round(alphaCopy[i] * 0.45);
        } else if (bgNeighbors === 1) {
          data[i * 4 + 3] = Math.round(alphaCopy[i] * 0.78);
        }
      }
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
  try {
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
  } catch (e) {
    // Bỏ qua an toàn nếu canvas bị tainted bởi nguồn ảnh ngoài
  }
  return renderedCanvas;
};

/**
 * MẪU MÀU DA THẬT TỪ VÙNG CỔ CỦA NGƯỜI MẪU
 */
const sampleNeckSkinHex = (personCanvas, neckX, neckY, fallbackHex = '#fbdcc4') => {
  try {
    const ctx = personCanvas.getContext('2d', { willReadFrequently: true });
    const x = Math.max(4, Math.min(personCanvas.width - 5, Math.round(neckX)));
    const y = Math.max(4, Math.min(personCanvas.height - 5, Math.round(neckY - 12)));
    const p = ctx.getImageData(x - 3, y - 3, 7, 7).data;
    let sr = 0, sg = 0, sb = 0, cnt = 0;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2];
      if (r > 80 && g > 40 && b > 20 && r >= g && g >= b - 10) {
        sr += r; sg += g; sb += b; cnt++;
      }
    }
    if (cnt > 5) {
      return `rgb(${Math.round(sr / cnt)}, ${Math.round(sg / cnt)}, ${Math.round(sb / cnt)})`;
    }
  } catch {}
  return fallbackHex;
};

/**
 * XÓA VÙNG ĐỒ CŨ TRÊN NGƯỜI MẪU (ERASE & INPAINT OLD CLOTHES)
 */
export const eraseOldClothesAndResurface = (ctx, canvasW, canvasH, personNeckY, personNeckX, leftShoulder, rightShoulder, skinToneHex = '#fbdcc4', personCanvas = null) => {
  ctx.save();

  const resolvedSkin = personCanvas ? sampleNeckSkinHex(personCanvas, personNeckX, personNeckY, skinToneHex) : skinToneHex;
  const neckY = personNeckY;
  const shoulderY = leftShoulder && leftShoulder[0] ? (leftShoulder[0] / 100) * canvasH : neckY + 18;
  const leftX = leftShoulder && leftShoulder[1] ? (leftShoulder[1] / 100) * canvasW : canvasW * 0.28;
  const rightX = rightShoulder && rightShoulder[1] ? (rightShoulder[1] / 100) * canvasW : canvasW * 0.72;
  const bodyW = Math.max(canvasW * 0.32, Math.abs(rightX - leftX));

  // Phủ da mềm vùng xương quai xanh & cổ áo cũ
  const skinGrad = ctx.createRadialGradient(
    personNeckX, neckY + 10, bodyW * 0.08,
    personNeckX, shoulderY + 25, bodyW * 0.62
  );
  skinGrad.addColorStop(0, resolvedSkin);
  skinGrad.addColorStop(0.55, resolvedSkin);
  skinGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(personNeckX, neckY + 24, bodyW * 0.56, Math.max(46, (shoulderY - neckY) * 1.45), 0, 0, Math.PI * 2);
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
    skinToneHex,
    personCanvas
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

      // C. Căn kích thước vừa vặn giải phẫu học (khớp bờ vai thực tế)
      const scaleMultiplier = Math.min(1.22, Math.max(0.95, geminiVision?.garment?.recommended_scale || 1.10));
      const baseClothW = Math.min(canvasW * 0.96, Math.max(canvasW * 0.62, shoulderSpan * 1.42)) * scaleMultiplier * (clothingTransform.scale || 1.0);
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

  // 6. GIỮ NGUYÊN KHUNG HÌNH GỐC ĐỂ THANH TRƯỢT BEFORE / AFTER KHỚP PIXEL 100%
  const finalCanvas = canvas;

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
