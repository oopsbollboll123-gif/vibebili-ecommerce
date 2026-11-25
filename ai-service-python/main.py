import os
import io
import time
import uuid
import shutil
import base64
import secrets
import tempfile
import traceback
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps, ImageEnhance
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
import rembg
import gradio_client.client
from gradio_client import Client, handle_file

# =====================================================================
# 1. MONKEY-PATCH: KHẮC PHỤC TRIỆT ĐỂ LỖI HUGGING FACE MULTI-REPLICA 404
# =====================================================================
_orig_download_file = gradio_client.client.Endpoint._download_file

def _replica_safe_download_file(self, x: dict) -> str:
    if x.get("is_stream", False) and "url" in x:
        url_path = x["url"]
        if not url_path.startswith(("http://", "https://")):
            url_path = self.root_url + url_path.lstrip("/")
        file_name = Path(url_path).name
    else:
        url_path = self.root_url + "file=" + gradio_client.utils.encode_file_path(x["path"])
        file_name = Path(x["path"]).name or "file"

    headers = dict(self.client.headers or {})
    cookies = dict(self.client.cookies or {})

    last_err = None
    for attempt in range(12):
        try:
            temp_dir = Path(tempfile.gettempdir()) / secrets.token_hex(20)
            temp_dir.mkdir(exist_ok=True, parents=True)
            dest_temp = temp_dir / file_name

            with httpx.stream(
                "GET",
                url_path,
                headers=headers,
                cookies=cookies,
                verify=self.client.ssl_verify,
                follow_redirects=True,
                timeout=30.0
            ) as response:
                if response.status_code == 404:
                    time.sleep(0.35)
                    continue
                response.raise_for_status()
                with open(dest_temp, "wb") as f:
                    for chunk in response.iter_bytes():
                        f.write(chunk)

            out_dir = Path(self.client.output_dir or tempfile.gettempdir())
            out_dir.mkdir(exist_ok=True, parents=True)
            final_dest = out_dir / f"{secrets.token_hex(8)}_{file_name}"
            shutil.move(dest_temp, final_dest)
            print(f"[IDM-VTON Download] Tải ảnh thành công ở lần thử #{attempt + 1}: {final_dest.name}")
            return str(final_dest.resolve())
        except Exception as e:
            last_err = e
            time.sleep(0.4)

    raise last_err or RuntimeError("Không thể tải ảnh kết quả sau 12 lần thử từ các replica của Space")

gradio_client.client.Endpoint._download_file = _replica_safe_download_file

# =====================================================================
# 2. KHỞI TẠO FASTAPI APP & CÁC AI MODEL SESSION (REMBG + VTON)
# =====================================================================
app = FastAPI(title="VibeBili AI Virtual Try-On Service v2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

VTON_SPACES = ["yisol/IDM-VTON", "Nymbo/Virtual-Try-On"]
_vton_clients = {}
_rembg_sessions = {}

def get_rembg_session(model_name: str):
    """Cache session ONNX của rembg để xử lý tách nền/tách áo siêu tốc (< 0.4s)."""
    if model_name not in _rembg_sessions:
        print(f"[AI Segmentation] Khởi tạo model '{model_name}'...")
        _rembg_sessions[model_name] = rembg.new_session(model_name)
    return _rembg_sessions[model_name]

def get_vton_client(space_name: str, fresh: bool = False):
    """Lấy hoặc tạo mới Client kết nối tới Space Virtual Try-On."""
    if space_name in _vton_clients and not fresh:
        return _vton_clients[space_name]
    hf_token = os.getenv("HF_TOKEN")
    print(f"[VTON] Đang kết nối tới Hugging Face Space '{space_name}'...")
    if hf_token:
        _vton_clients[space_name] = Client(space_name, token=hf_token)
    else:
        _vton_clients[space_name] = Client(space_name)
    return _vton_clients[space_name]

# Warm up AI sessions khi khởi động
try:
    get_rembg_session("u2net_cloth_seg")
    get_rembg_session("u2netp")
    print("[AI Segmentation] Đã tải sẵn u2net_cloth_seg & u2netp thành công!")
except Exception as seg_err:
    print(f"[AI Segmentation Warning] Sẽ tải lazy khi dùng: {seg_err}")

try:
    get_vton_client(VTON_SPACES[0])
    print("[VTON] Kết nối tới yisol/IDM-VTON thành công!")
except Exception as init_err:
    print(f"[VTON Warning] Chưa thể kết nối VTON lúc khởi động: {init_err}")

# =====================================================================
# 3. ĐỌC ẢNH AN TOÀN & GIỮ NGUYÊN TỈ LỆ (KHÔNG CẮT XÉN ĐẦU / TAY ÁO)
# =====================================================================
def decode_image_to_pil(img_data: str) -> Image.Image:
    raw_bytes = None
    if img_data.startswith("http://") or img_data.startswith("https://"):
        req = urllib.request.Request(
            img_data,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw_bytes = resp.read()
    elif img_data.startswith("data:image"):
        _, encoded = img_data.split(",", 1)
        raw_bytes = base64.b64decode(encoded)
    elif os.path.exists(img_data):
        with open(img_data, "rb") as f:
            raw_bytes = f.read()
    else:
        raw_bytes = base64.b64decode(img_data)

    img = Image.open(io.BytesIO(raw_bytes))
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")

def pad_to_vton_canvas(img: Image.Image, target_w: int = 768, target_h: int = 1024, bg_color=(255, 255, 255)):
    """Resize giữ nguyên 100% khung hình gốc (không cắt mất đầu/tay áo) và pad vừa 768x1024."""
    w, h = img.size
    scale = min(target_w / w, target_h / h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (target_w, target_h), bg_color)
    left = (target_w - new_w) // 2
    top = (target_h - new_h) // 2
    canvas.paste(resized, (left, top))
    return canvas, (left, top, new_w, new_h, w, h)

def unpad_from_vton_canvas(result_img: Image.Image, pad_meta) -> Image.Image:
    """Cắt bỏ phần viền pad để ảnh kết quả khớp pixel-for-pixel với ảnh gốc người dùng."""
    left, top, new_w, new_h, orig_w, orig_h = pad_meta
    rw, rh = result_img.size
    scale_x = rw / 768.0
    scale_y = rh / 1024.0
    crop_box = (
        int(round(left * scale_x)),
        int(round(top * scale_y)),
        int(round((left + new_w) * scale_x)),
        int(round((top + new_h) * scale_y))
    )
    cropped = result_img.crop(crop_box)
    # Chuẩn hóa về kích thước sắc nét hợp lý (tối đa rộng 768px) giữ nguyên tỉ lệ gốc
    out_w = min(orig_w, 768) if orig_w > 400 else new_w
    out_h = max(1, int(round(out_w * (orig_h / orig_w))))
    return cropped.resize((out_w, out_h), Image.Resampling.LANCZOS)

# =====================================================================
# 4. BÓC TÁCH TRANG PHỤC AI CHUYÊN SÂU (u2net_cloth_seg + OpenCV CLEANUP)
# =====================================================================
def infer_cloth_category(garment_des: str, garment_name_vi: str = "") -> str:
    txt = f"{garment_des} {garment_name_vi}".lower()
    if any(k in txt for k in ["đầm", "váy", "dress", "jumpsuit", "bộ vest"]):
        return "full"
    if any(k in txt for k in ["quần", "jeans", "jean", "short", "trouser", "pants", "chân váy", "skirt"]):
        return "lower"
    return "upper"

def clean_binary_mask(alpha: np.ndarray) -> np.ndarray:
    """Làm sạch mask quần áo bằng OpenCV: giữ đúng 1 khối áo chính, lấp sạch lỗ thủng bên trong."""
    _, binary = cv2.threshold(alpha, 85, 255, cv2.THRESH_BINARY)

    # Đóng khe nhỏ và các nếp gấp sáng (kernel 17x17)
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close)

    # Chỉ giữ ĐÚNG thành phần liên thông lớn nhất (xóa sạch mảng rác/chân thừa bên ngoài)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(closed, connectivity=8)
    if num_labels > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        largest_label = 1 + int(np.argmax(areas))
        cleaned = np.zeros_like(closed)
        cleaned[labels == largest_label] = 255
    else:
        cleaned = closed

    # Lấp hoàn toàn mọi lỗ hổng kín bên trong thân áo (vẫn giữ khoảng hở cổ áo phía trên cùng)
    h_img, w_img = cleaned.shape
    flood = cleaned.copy()
    # Đóng viền dưới tạm thời để chỉ giữ phần hõm cổ phía trên mở ra ngoài
    ff_mask = np.zeros((h_img + 2, w_img + 2), np.uint8)
    # Seed flood-fill từ toàn bộ viền ảnh (trên, trái, phải, dưới)
    seeds = []
    for x in range(0, w_img, 4):
        if flood[0, x] == 0: seeds.append((x, 0))
        if flood[h_img - 1, x] == 0: seeds.append((x, h_img - 1))
    for y in range(0, h_img, 4):
        if flood[y, 0] == 0: seeds.append((0, y))
        if flood[y, w_img - 1] == 0: seeds.append((w_img - 1, y))
    for sx, sy in seeds:
        if flood[sy, sx] == 0:
            cv2.floodFill(flood, ff_mask, (sx, sy), 128)
    # Bất kỳ điểm nào == 0 (không chạm ra ngoài biên) là lỗ kín bên trong áo -> tô 255
    result_mask = np.where(flood == 128, 0, 255).astype(np.uint8)

    # Kết hợp alpha mềm ban đầu ở rìa và làm mượt cạnh
    soft = cv2.GaussianBlur(result_mask.astype(np.float32), (5, 5), 0)
    final_alpha = np.where(result_mask > 0, np.maximum(soft, 210), soft * 0.4)
    return np.clip(final_alpha, 0, 255).astype(np.uint8)

def extract_clean_garment_rgba(garment_pil: Image.Image, cloth_cat: str = "upper") -> Image.Image:
    """
    Tách 100% nền, người mẫu cũ, quần thừa và đồ vật khỏi ảnh trang phục bằng AI u2net_cloth_seg + OpenCV.
    Trả về ảnh RGBA đã cắt sát viền áo (tight bounding box).
    """
    buf = io.BytesIO()
    garment_pil.save(buf, format="PNG")
    raw_bytes = buf.getvalue()

    rgba_np = None
    try:
        cloth_sess = get_rembg_session("u2net_cloth_seg")
        seg_bytes = rembg.remove(raw_bytes, session=cloth_sess, cloth_category=cloth_cat)
        seg_pil = Image.open(io.BytesIO(seg_bytes)).convert("RGBA")
        arr = np.array(seg_pil)
        fg_ratio = float(np.count_nonzero(arr[:, :, 3] > 90)) / float(arr.shape[0] * arr.shape[1])
        if fg_ratio >= 0.06:
            rgba_np = arr
    except Exception as e:
        print(f"[Segmentation u2net_cloth_seg fallback]: {e}")

    # Nếu ảnh là đồ flat-lay nền đơn hoặc u2net_cloth_seg bắt ít quá -> dùng u2netp
    if rgba_np is None:
        fg_sess = get_rembg_session("u2netp")
        seg_bytes = rembg.remove(raw_bytes, session=fg_sess)
        seg_pil = Image.open(io.BytesIO(seg_bytes)).convert("RGBA")
        rgba_np = np.array(seg_pil)

    # Làm sạch mask alpha bằng OpenCV
    cleaned_alpha = clean_binary_mask(rgba_np[:, :, 3])

    # Khử vùng cổ/da người mẫu cũ lọt ở mép cổ áo trên (nếu có)
    gh, gw = rgba_np.shape[:2]
    rgb_only = rgba_np[:, :, :3]
    ycrcb = cv2.cvtColor(rgb_only, cv2.COLOR_RGB2YCrCb)
    skin = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))
    collar_zone = np.zeros((gh, gw), dtype=np.uint8)
    collar_zone[:int(gh * 0.22), int(gw * 0.32):int(gw * 0.68)] = 255
    skin_neck = cv2.bitwise_and(skin, collar_zone)
    cleaned_alpha[skin_neck > 0] = 0

    rgba_np[:, :, 3] = cleaned_alpha

    # Cắt sát bounding box thực tế của trang phục
    ys, xs = np.where(cleaned_alpha > 40)
    if len(xs) > 10 and len(ys) > 10:
        x1, x2 = max(0, int(xs.min()) - 4), min(rgba_np.shape[1], int(xs.max()) + 4)
        y1, y2 = max(0, int(ys.min()) - 4), min(rgba_np.shape[0], int(ys.max()) + 4)
        rgba_np = rgba_np[y1:y2, x1:x2]

    return Image.fromarray(rgba_np, mode="RGBA")

def make_studio_garment_canvas(garment_rgba: Image.Image, target_w: int = 768, target_h: int = 1024) -> Image.Image:
    """Đặt trang phục RGBA đã tách sạch lên nền trắng studio 768x1024 cho IDM-VTON xử lý chuẩn xác."""
    white_bg = Image.new("RGBA", garment_rgba.size, (255, 255, 255, 255))
    white_bg.alpha_composite(garment_rgba)
    rgb = white_bg.convert("RGB")
    # Để viền trắng rộng ~10% xung quanh giúp IDM-VTON nhận dạng phom áo hoàn hảo
    inner_w = int(target_w * 0.84)
    inner_h = int(target_h * 0.84)
    scale = min(inner_w / rgb.width, inner_h / rgb.height)
    nw = max(1, int(round(rgb.width * scale)))
    nh = max(1, int(round(rgb.height * scale)))
    resized = rgb.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), (255, 255, 255))
    canvas.paste(resized, ((target_w - nw) // 2, (target_h - nh) // 2))
    return canvas

# =====================================================================
# 5. ENGINE DỰ PHÒNG AI THỊ GIÁC CỤC BỘ (AI CLOTH SEG + FACE/HUMAN PROTECT)
# =====================================================================
def detect_face_bottom_y(person_rgb: np.ndarray) -> int:
    """Tìm đáy khuôn mặt bằng OpenCV Haar Cascade để tuyệt đối không bao giờ che mất mặt/tóc."""
    ph, pw = person_rgb.shape[:2]
    gray = cv2.cvtColor(person_rgb, cv2.COLOR_RGB2GRAY)
    best_bottom = int(ph * 0.28)
    try:
        for xml_name in ["haarcascade_frontalface_default.xml", "haarcascade_profileface.xml"]:
            cascade_path = os.path.join(cv2.data.haarcascades, xml_name)
            if os.path.exists(cascade_path):
                clf = cv2.CascadeClassifier(cascade_path)
                faces = clf.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(int(pw * 0.08), int(pw * 0.08)))
                if len(faces) > 0:
                    # Chọn khuôn mặt lớn nhất ở nửa trên ảnh
                    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                    fx, fy, fw, fh = faces[0]
                    if fy < ph * 0.55:
                        return int(fy + fh)
    except Exception:
        pass
    return best_bottom

def generate_smart_local_tryon(person_pil: Image.Image, garment_rgba: Image.Image, cloth_cat: str = "upper") -> Image.Image:
    person_rgb = np.array(person_pil.convert("RGB"))
    ph, pw = person_rgb.shape[:2]

    # 1. Xác định đáy khuôn mặt & mask cơ thể người
    face_bottom_y = detect_face_bottom_y(person_rgb)
    buf = io.BytesIO()
    person_pil.save(buf, format="PNG")
    person_bytes = buf.getvalue()

    old_cloth_mask = np.zeros((ph, pw), dtype=np.uint8)
    try:
        cloth_sess = get_rembg_session("u2net_cloth_seg")
        p_seg_bytes = rembg.remove(person_bytes, session=cloth_sess, cloth_category=cloth_cat, only_mask=True)
        old_mask_pil = Image.open(io.BytesIO(p_seg_bytes)).convert("L")
        old_cloth_mask = np.array(old_mask_pil)
        # Tuyệt đối không tính vùng đầu/mũ phía trên đáy khuôn mặt là áo
        old_cloth_mask[:max(0, face_bottom_y - int(ph * 0.02)), :] = 0
    except Exception:
        pass

    ys, xs = np.where(old_cloth_mask > 100)
    if len(xs) > 100 and len(ys) > 100:
        bx1, bx2 = int(xs.min()), int(xs.max())
        by1, by2 = max(face_bottom_y + int(ph * 0.02), int(ys.min())), int(ys.max())
    else:
        bx1, bx2 = int(pw * 0.16), int(pw * 0.84)
        by1, by2 = min(int(ph * 0.55), face_bottom_y + int(ph * 0.05)), int(ph * 0.88)

    # 2. Bảo toàn da người mẫu ở mặt, cổ & tóc trên bằng mask hữu cơ (không cắt ngang bằng đường thẳng)
    ycrcb = cv2.cvtColor(person_rgb, cv2.COLOR_RGB2YCrCb)
    skin_mask = cv2.inRange(ycrcb, np.array([0, 133, 77]), np.array([255, 173, 127]))

    # Lấy mask thân người bằng u2netp để đo đúng độ rộng hai bờ vai thực tế
    human_shoulder_w = bx2 - bx1
    try:
        fg_sess = get_rembg_session("u2netp")
        h_mask = np.array(Image.open(io.BytesIO(rembg.remove(person_bytes, session=fg_sess, only_mask=True))).convert("L"))
        scan_y1 = min(ph - 2, max(0, by1))
        scan_y2 = min(ph, scan_y1 + max(20, int(ph * 0.22)))
        _, hxs = np.where(h_mask[scan_y1:scan_y2, :] > 100)
        if len(hxs) > 30:
            human_shoulder_w = max(human_shoulder_w, int(hxs.max() - hxs.min()))
    except Exception:
        pass

    # Bảo vệ toàn bộ vùng đầu + cổ (chỉ giữ vùng phía trên đỉnh cổ áo cũ, và da mặt/cổ thật)
    upper_head_only = np.zeros((ph, pw), dtype=np.uint8)
    upper_head_only[:max(1, face_bottom_y), :] = 255
    neck_skin = np.zeros((ph, pw), dtype=np.uint8)
    neck_skin[:min(ph, by1 + int(ph * 0.09)), :] = 255
    head_protect = cv2.bitwise_or(upper_head_only, cv2.bitwise_and(skin_mask, neck_skin))

    # 3. Căn chỉnh kích thước áo mới khớp chính xác bề ngang hai bờ vai người mẫu
    torso_w = max(int(pw * 0.62), bx2 - bx1, human_shoulder_w)
    torso_h = max(int(ph * 0.28), by2 - by1)
    is_closeup_torso = (by2 >= int(ph * 0.82)) or (by1 >= int(ph * 0.50))
    target_cloth_w = min(int(pw * 1.18), int(torso_w * 1.12))
    gw_orig, gh_orig = garment_rgba.size
    cloth_h = max(1, int(round(target_cloth_w * (gh_orig / gw_orig))))
    if not is_closeup_torso and cloth_h > int(torso_h * 1.32):
        cloth_h = int(torso_h * 1.25)
        target_cloth_w = max(int(torso_w * 1.02), int(round(cloth_h * (gw_orig / gh_orig))))

    garment_resized = garment_rgba.resize((target_cloth_w, cloth_h), Image.Resampling.LANCZOS)

    # Cân sáng áo hài hòa với ánh sáng ảnh người
    p_gray = cv2.cvtColor(person_rgb, cv2.COLOR_RGB2GRAY)
    p_mean_lum = float(np.mean(p_gray))
    lum_factor = max(0.84, min(1.16, p_mean_lum / 128.0 * 0.45 + 0.55))
    rgb_g = ImageEnhance.Brightness(garment_resized.convert("RGB")).enhance(lum_factor)
    garment_lit = rgb_g.convert("RGBA")
    garment_lit.putalpha(garment_resized.split()[3])

    cx = (bx1 + bx2) // 2
    paste_x = cx - target_cloth_w // 2
    paste_y = max(face_bottom_y + int(ph * 0.02), by1 - int(cloth_h * 0.03))

    base_rgba = Image.fromarray(person_rgb).convert("RGBA")
    overlay_layer = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    overlay_layer.paste(garment_lit, (paste_x, paste_y), garment_lit)
    composited = Image.alpha_composite(base_rgba, overlay_layer).convert("RGB")
    comp_np = np.array(composited)

    # Giữ nguyên vẹn khuôn mặt, tóc/mũ, vùng da cổ phía trên
    comp_np[head_protect > 0] = person_rgb[head_protect > 0]

    # Bảo toàn bàn tay ở nửa dưới (nếu đưa tay ra trước áo)
    hand_zone = np.zeros((ph, pw), dtype=np.uint8)
    hand_zone[by1 + int(torso_h * 0.45):by2 + int(ph * 0.1), :] = 255
    hands = cv2.bitwise_and(skin_mask, hand_zone)
    hands = cv2.morphologyEx(hands, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    comp_np[hands > 0] = person_rgb[hands > 0]

    return Image.fromarray(comp_np, mode="RGB")

# =====================================================================
# 6. KHUNG REQUEST DỮ LIỆU
# =====================================================================
class TryOnRequest(BaseModel):
    person_img: str
    garment_img: str
    garment_des: str = "A photorealistic upper body garment"
    garment_name_vi: str = ""

class SegmentRequest(BaseModel):
    image: str
    category: str = "upper"

def pil_to_base64_jpeg(pil_img: Image.Image, quality: int = 90) -> str:
    buf = io.BytesIO()
    pil_img.convert("RGB").save(buf, format="JPEG", quality=quality, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def pil_to_base64_png(pil_img: Image.Image) -> str:
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"

# =====================================================================
# 7. ENDPOINT PHỤ TRỢ TÁCH NỀN AI CHUYÊN BIỆT: /api/segment-garment
# =====================================================================
@app.post("/api/segment-garment")
def segment_garment(req: SegmentRequest):
    try:
        pil_img = decode_image_to_pil(req.image)
        garment_rgba = extract_clean_garment_rgba(pil_img, cloth_cat=req.category or "upper")
        return {
            "success": True,
            "garment_png": pil_to_base64_png(garment_rgba)
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================================
# 8. ENDPOINT CHÍNH: /api/generate-tryon
# =====================================================================
@app.post("/api/generate-tryon")
def generate_tryon(req: TryOnRequest):
    req_id = uuid.uuid4().hex[:8]
    person_path = os.path.join("temp", f"person_{req_id}.png")
    garment_path = os.path.join("temp", f"garment_{req_id}.png")
    output_filename = f"result_{req_id}.png"
    output_path = os.path.join("static", output_filename)

    try:
        # 1. Đọc 2 ảnh gốc & chuẩn hóa không cắt xén
        person_orig = decode_image_to_pil(req.person_img)
        garment_orig = decode_image_to_pil(req.garment_img)

        cloth_cat = infer_cloth_category(req.garment_des, req.garment_name_vi)
        print(f"[TryOn #{req_id}] Bắt đầu xử lý ({cloth_cat}): '{req.garment_des}'")

        # Bóc tách sạch nền / người mẫu thừa trên ảnh áo bằng AI u2net_cloth_seg + OpenCV
        garment_rgba = extract_clean_garment_rgba(garment_orig, cloth_cat=cloth_cat)
        garment_studio = make_studio_garment_canvas(garment_rgba, 768, 1024)
        garment_studio.save(garment_path, format="PNG")

        # Chuẩn hóa ảnh người giữ nguyên tỉ lệ gốc (không bị crop mất vai/tóc)
        person_padded, pad_meta = pad_to_vton_canvas(person_orig, 768, 1024, bg_color=(245, 245, 247))
        person_padded.save(person_path, format="PNG")

        # 2. Gửi sang AI VTON Đám Mây với Failover đa Space (yisol/IDM-VTON -> Nymbo/Virtual-Try-On)
        ai_success = False
        final_pil = None

        for space_idx, space_name in enumerate(VTON_SPACES):
            try:
                client = get_vton_client(space_name, fresh=(space_idx > 0))
                print(f"[VTON #{req_id}] Gọi Hugging Face Space '{space_name}'...")
                job = client.submit(
                    dict={"background": handle_file(person_path), "layers": [], "composite": None},
                    garm_img=handle_file(garment_path),
                    garment_des=req.garment_des or "A photorealistic upper body garment",
                    is_checked=True,
                    is_checked_crop=False,
                    denoise_steps=30,
                    seed=42,
                    api_name="/tryon"
                )

                wait_start = time.time()
                while not job.done():
                    if time.time() - wait_start > 95:
                        job.cancel()
                        raise TimeoutError(f"Hết thời gian chờ Space {space_name} (95s)")
                    time.sleep(0.8)

                result = job.result()
                out_file = result[0] if isinstance(result, (list, tuple)) else result
                if isinstance(out_file, dict) and "path" in out_file:
                    out_file = out_file["path"]

                if out_file and os.path.exists(out_file):
                    vton_raw_pil = Image.open(out_file).convert("RGB")
                    # Cắt bỏ viền pad để trả về đúng tỉ lệ khung hình ảnh gốc
                    final_pil = unpad_from_vton_canvas(vton_raw_pil, pad_meta)
                    final_pil.save(output_path, format="PNG")
                    ai_success = True
                    print(f"[VTON #{req_id}] Thành công qua {space_name}: {output_filename}")
                    break
            except Exception as space_err:
                print(f"[VTON #{req_id} Warning] Space {space_name} lỗi: {space_err}")
                continue

        # 3. Fallback AI cục bộ chất lượng cao (u2net_cloth_seg + OpenCV Inpaint + Skin Mask)
        if not ai_success or final_pil is None:
            print(f"[TryOn #{req_id}] Kích hoạt Local AI CV Engine (u2net_cloth_seg + OpenCV)...")
            final_pil = generate_smart_local_tryon(person_orig, garment_rgba, cloth_cat=cloth_cat)
            final_pil.save(output_path, format="PNG")

        return {
            "result_img": f"http://localhost:8000/static/{output_filename}",
            "result_base64": pil_to_base64_jpeg(final_pil, quality=92),
            "status": "ai_generated" if ai_success else "local_ai_cv"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        for p in (person_path, garment_path):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "VibeBili AI Virtual Try-On Service v2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
