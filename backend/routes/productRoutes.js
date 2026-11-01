const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  bulkCreateProducts,
  deleteProduct,
  getCategories,
  getProductReviews,
  createProductReview
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Lấy danh sách danh mục (đặt trước /:id để tránh trùng lặp)
router.get('/categories', getCategories);

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
