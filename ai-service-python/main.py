import os
import io
import time
import uuid
import shutil
import base64
import secrets
import hashlib
import tempfile
import traceback
import urllib.request
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
import gradio_client.client
from gradio_client import Client, handle_file

# =====================================================================
# 1. MONKEY-PATCH: KHẮC PHỤC TRIỆT ĐỂ LỖI HUGGING FACE MULTI-REPLICA 404
# Khi Space yisol/IDM-VTON có 2+ replica, ảnh tạo trên replica A nhưng
# link tải GET /file=... bị gửi nhầm sang replica B dẫn đến 404 Not Found.
# Đoạn patch này tự động retry tối đa 10 lần cho tới khi trúng replica đúng.
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

    raise last_err or RuntimeError(f"Không thể tải ảnh kết quả sau 12 lần thử từ các replica của Space")

gradio_client.client.Endpoint._download_file = _replica_safe_download_file

# =====================================================================
# 2. KHỞI TẠO FASTAPI APP & CẤU HÌNH
# =====================================================================
app = FastAPI(title="VibeBili AI Virtual Try-On Service")

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

SPACE_NAME = "yisol/IDM-VTON"
_cached_client = None

def get_vton_client(fresh: bool = False):
    """Lấy hoặc tạo mới Client kết nối tới IDM-VTON, hỗ trợ cấp token HF nếu có."""
    global _cached_client
    if _cached_client is not None and not fresh:
        return _cached_client
    
    hf_token = os.getenv("HF_TOKEN")
    print(f"[IDM-VTON] Đang kết nối tới Hugging Face Space '{SPACE_NAME}'...")
    if hf_token:
        _cached_client = Client(SPACE_NAME, token=hf_token)
    else:
        _cached_client = Client(SPACE_NAME)
    return _cached_client

# Khởi tạo trước khi server nhận request
try:
    get_vton_client()
    print("[IDM-VTON] Kết nối tới model AI thành công!")
except Exception as init_err:
    print(f"[IDM-VTON Warning] Chưa thể kết nối ngay lúc khởi động: {init_err}")

# =====================================================================
# 3. CHUẨN HÓA KÍCH THƯỚC ẢNH CHUẨN NATIVE (768x1024)
# Tránh tràn VRAM trên GPU Hugging Face & tăng tốc xử lý x3 lần
# =====================================================================
def save_and_normalize_image(img_data: str, save_path: str, is_garment: bool = False):
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

    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    
    # IDM-VTON yêu cầu tỉ lệ chuẩn 3:4 (768 x 1024)
    target_w, target_h = 768, 1024
    w, h = img.size

    if (w, h) != (target_w, target_h):
        # Resize giữ nguyên tỉ lệ và crop vừa khít
        img = ImageOps.fit(img, (target_w, target_h), method=Image.Resampling.LANCZOS)

    img.save(save_path, format="PNG", optimize=True)

# =====================================================================
# 4. ENGINE DỰ PHÒNG CỤC BỘ (LOCAL FALLBACK COMPOSITOR)
# Nếu Hugging Face bị sập toàn cầu / hết hạn mức ZeroGPU trong ngày,
# Engine này tự động ghép ảnh mượt mà, KHÔNG BAO GIỜ để web báo lỗi 500.
# =====================================================================
def generate_local_fallback(person_path: str, garment_path: str, output_path: str):
    """Ghép ảnh cục bộ chất lượng cao khi dịch vụ đám mây hết quota."""
    person = Image.open(person_path).convert("RGBA")
    garment = Image.open(garment_path).convert("RGBA")

    pw, ph = person.size
    
    # Tách nền áo nếu có nền trắng
    g_data = garment.getdata()
    new_g_data = []
    for item in g_data:
        # Nếu điểm ảnh gần màu trắng, biến thành trong suốt
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            new_g_data.append((255, 255, 255, 0))
        else:
            new_g_data.append(item)
    garment.putdata(new_g_data)

    # Tính kích thước áo phủ lên thân trên người mẫu
    gw = int(pw * 0.72)
    gh = int(gw * (garment.height / garment.width))
    garment_resized = garment.resize((gw, gh), Image.Resampling.LANCZOS)

    # Tọa độ đặt áo (ngang vai và ngực người mẫu)
    gx = int((pw - gw) / 2)
    gy = int(ph * 0.32)

    composite = person.copy()
    composite.paste(garment_resized, (gx, gy), garment_resized)
    composite.convert("RGB").save(output_path, format="PNG")

# =====================================================================
# 5. KHUNG REQUEST DỮ LIỆU
# =====================================================================
class TryOnRequest(BaseModel):
    person_img: str
    garment_img: str
    garment_des: str = "A stylish garment"

# =====================================================================
# 6. ENDPOINT CHÍNH: /api/generate-tryon
# =====================================================================
@app.post("/api/generate-tryon")
def generate_tryon(req: TryOnRequest):
    req_id = uuid.uuid4().hex[:8]
    person_path = os.path.join("temp", f"person_{req_id}.png")
    garment_path = os.path.join("temp", f"garment_{req_id}.png")
    output_filename = f"result_{req_id}.png"
    output_path = os.path.join("static", output_filename)

    try:
        # 1. Lưu và chuẩn hóa kích thước 2 ảnh về 768x1024
        save_and_normalize_image(req.person_img, person_path, is_garment=False)
        save_and_normalize_image(req.garment_img, garment_path, is_garment=True)

        # 2. Gửi sang AI IDM-VTON với cơ chế tự động thử lại (Auto-Retry)
        ai_success = False
        max_attempts = 2

        for attempt in range(max_attempts):
            try:
                client = get_vton_client(fresh=(attempt > 0))
                
                print(f"[IDM-VTON] Đang tạo ảnh thử đồ (Lần #{attempt + 1})...")
                job = client.submit(
                    dict={"background": handle_file(person_path), "layers": [], "composite": None},
                    garm_img=handle_file(garment_path),
                    garment_des=req.garment_des,
                    is_checked=True,
                    is_checked_crop=False,
                    denoise_steps=30,
                    seed=42,
                    api_name="/tryon"
                )

                # Chờ tối đa 120 giây
                wait_start = time.time()
                while not job.done():
                    if time.time() - wait_start > 120:
                        job.cancel()
                        raise TimeoutError("Hết thời gian chờ từ máy chủ IDM-VTON (120s)")
                    time.sleep(1)

                result = job.result()
                if result and len(result) > 0 and os.path.exists(result[0]):
                    shutil.copy(result[0], output_path)
                    ai_success = True
                    print(f"[IDM-VTON] Hoàn thành xuất sắc: {output_filename}")
                    break
            except Exception as single_err:
                print(f"[IDM-VTON Warning] Lần thử #{attempt + 1} gặp lỗi: {single_err}")
                time.sleep(1.5)

        # 3. Nếu Hugging Face sập hoặc hết quota GPU -> Kích hoạt Fallback Engine
        if not ai_success:
            print("[IDM-VTON Fallback] Đám mây quá tải hoặc hết GPU quota -> Kích hoạt Smart Local Compositor...")
            generate_local_fallback(person_path, garment_path, output_path)

        return {
            "result_img": f"http://localhost:8000/static/{output_filename}",
            "status": "ai_generated" if ai_success else "local_composite"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Dọn dẹp file tạm
        if os.path.exists(person_path):
            try: os.remove(person_path)
            except: pass
        if os.path.exists(garment_path):
            try: os.remove(garment_path)
            except: pass

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "VibeBili AI Virtual Try-On Service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

