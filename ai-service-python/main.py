import os
import uuid
import shutil
import base64
import urllib.request
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from gradio_client import Client, handle_file

app = FastAPI()

# 1. Bật CORS theo đúng lưu ý của trưởng nhóm
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Kết nối sẵn tới model IDM-VTON
vton_client = Client("yisol/IDM-VTON")

# 2. Khung dữ liệu JSON nhận vào đúng chuẩn trưởng nhóm yêu cầu
class TryOnRequest(BaseModel):
    person_img: str
    garment_img: str
    garment_des: str = "A stylish garment"

# Hàm phụ trợ: Tự động chuyển link URL hoặc chuỗi Base64 thành file ảnh tạm trên máy
def save_input_image(img_data: str, save_path: str):
    if img_data.startswith("http://") or img_data.startswith("https://"):
        urllib.request.urlretrieve(img_data, save_path)
    elif img_data.startswith("data:image"):
        header, encoded = img_data.split(",", 1)
        with open(save_path, "wb") as f:
            f.write(base64.b64decode(encoded))
    elif os.path.exists(img_data):
        shutil.copy(img_data, save_path)
    else:
        with open(save_path, "wb") as f:
            f.write(base64.b64decode(img_data))

# 3. Đúng tên đường dẫn API trưởng nhóm quy định: /api/generate-tryon
@app.post("/api/generate-tryon")
def generate_tryon(req: TryOnRequest):
    req_id = uuid.uuid4().hex[:8]
    person_path = os.path.join("temp", f"person_{req_id}.png")
    garment_path = os.path.join("temp", f"garment_{req_id}.png")

    try:
        # Lưu 2 ảnh từ dữ liệu JSON gửi sang
        save_input_image(req.person_img, person_path)
        save_input_image(req.garment_img, garment_path)

        # Gửi sang AI xử lý
        result = vton_client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_path),
            garment_des=req.garment_des,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )

        # Lưu ảnh kết quả vào thư mục static
        output_filename = f"result_{req_id}.png"
        output_path = os.path.join("static", output_filename)
        shutil.copy(result[0], output_path)

        # 4. Trả về đúng tên biến JSON trưởng nhóm yêu cầu: result_img
        return {
            "result_img": f"http://localhost:8000/static/{output_filename}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if os.path.exists(person_path): os.remove(person_path)
        if os.path.exists(garment_path): os.remove(garment_path)