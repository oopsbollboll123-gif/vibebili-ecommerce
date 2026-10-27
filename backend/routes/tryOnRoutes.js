const express = require('express');
const router = express.Router();
const { getPresets, generateTryOn } = require('../controllers/tryOnController');

// 1. Lấy danh sách Người mẫu Avatar & Catalog đồ thử có sẵn
router.get('/presets', getPresets);

// 2. Kích hoạt tính toán thử đồ đa tầng (AI 2-in-1 Virtual Try-On)
router.post('/generate', generateTryOn);

module.exports = router;
