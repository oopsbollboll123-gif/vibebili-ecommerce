const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ bộ nhớ tạm (MemoryStorage) để kiểm tra Magic Bytes trước khi chấp nhận
const storage = multer.memoryStorage();

// Whitelist định dạng hình ảnh an toàn
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Kiểm tra Magic Bytes thực sự của file buffer (Chống giả mạo phần mở rộng file)
const verifyMagicBytes = (buffer) => {
  if (!buffer || buffer.length < 8) return false;

  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A;

  // WebP: RIFF ... WEBP (offset 0: 'RIFF', offset 8: 'WEBP')
  const isWebp =
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  return isJpeg || isPng || isWebp;
};

// Multer Filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Kiểm tra phần mở rộng file
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Phần mở rộng file không hợp lệ! Chỉ chấp nhận: .jpg, .jpeg, .png, .webp'), false);
  }

  // 2. Kiểm tra MIME type do client gửi
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('MIME Type không được phép! Chỉ chấp nhận hình ảnh JPEG/PNG/WebP.'), false);
  }

  cb(null, true);
};

// Middleware Multer với giới hạn 5MB
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Tối đa 5 file cùng lúc
  },
  fileFilter
});

// Middleware xác thực Magic Bytes sau khi upload vào memory
const validateUploadedImages = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  for (const f of files) {
    if (!verifyMagicBytes(f.buffer)) {
      return res.status(400).json({
        success: false,
        message: `Tệp "${f.originalname}" không phải là ảnh hợp lệ hoặc có dấu hiệu chèn mã độc vào header ảnh (Magic Bytes mismatch)!`
      });
    }
  }

  next();
};

module.exports = {
  upload,
  validateUploadedImages,
  verifyMagicBytes
};
