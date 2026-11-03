const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  bulkCreateProducts,
  deleteProduct,
  getCategories,
  updateCategory,
  getProductReviews,
  createProductReview
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { upload, validateUploadedImages } = require('../middleware/uploadMiddleware');

// Upload ảnh sản phẩm an toàn (Xác thực MIME type, Magic Bytes và giới hạn 5MB)
router.post('/upload', upload.single('image'), validateUploadedImages, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp ảnh để tải lên!' });
  }

  const base64 = req.file.buffer.toString('base64');
  const imageUrl = `data:${req.file.mimetype};base64,${base64}`;

  return res.status(200).json({
    success: true,
    message: 'Tải ảnh lên và xác thực Magic Bytes bảo mật thành công!',
    data: {
      url: imageUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    }
  });
});

// Lấy danh sách danh mục (đặt trước /:id để tránh trùng lặp)
router.get('/categories', getCategories);
router.put('/categories/:id', updateCategory);

// Lấy danh sách sản phẩm (có filter, search)
router.get('/', getAllProducts);

// Lấy chi tiết 1 sản phẩm kèm Ma trận biến thể SKU
router.get('/:id', getProductById);

// Đánh giá sản phẩm (Reviews kèm Fit Tags)
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', createProductReview);

// Đăng tải sản phẩm hàng loạt (Bulk Upload)
router.post('/bulk', bulkCreateProducts);

// Thêm sản phẩm mới (Kênh người bán & Admin)
router.post('/', createProduct);

// Xóa sản phẩm
router.delete('/:id', deleteProduct);

module.exports = router;
