const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  deleteProduct,
  getCategories
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Lấy danh sách danh mục (đặt trước /:id để tránh trùng lặp)
router.get('/categories', getCategories);

// Lấy danh sách sản phẩm (có filter, search)
router.get('/', getAllProducts);

// Lấy chi tiết 1 sản phẩm kèm Ma trận biến thể SKU
router.get('/:id', getProductById);

// Thêm sản phẩm mới (Kênh người bán & Admin)
router.post('/', createProduct);

// Xóa sản phẩm
router.delete('/:id', deleteProduct);

module.exports = router;
