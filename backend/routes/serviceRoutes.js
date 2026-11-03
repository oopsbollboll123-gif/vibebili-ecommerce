const express = require('express');
const router = express.Router();
const {
  createSpaRequest,
  getCustomerSpaRequests,
  getSellerSpaRequests,
  updateSpaStatus,
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getPendingProducts,
  moderateProduct,
  getComplaints,
  updateComplaint,
  getSellerFinance,
  updateBankAccount,
  requestWithdrawal
} = require('../controllers/serviceController');

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../middleware/authMiddleware');
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) req.user = user;
    next();
  });
};

// --- SPA ROUTES ---
router.post('/spa', optionalAuth, createSpaRequest);
router.get('/spa/my', optionalAuth, getCustomerSpaRequests);
router.get('/spa/seller', optionalAuth, getSellerSpaRequests);
router.put('/spa/:id/status', optionalAuth, updateSpaStatus);

// --- MARKETING & VOUCHERS ---
router.get('/marketing/vouchers', optionalAuth, getVouchers);
router.post('/marketing/vouchers', optionalAuth, createVoucher);
router.put('/marketing/vouchers/:id', optionalAuth, updateVoucher);
router.delete('/marketing/vouchers/:id', optionalAuth, deleteVoucher);

// --- KIỂM DUYỆT SẢN PHẨM (ADMIN MODERATOR) ---
router.get('/moderation/products', optionalAuth, getPendingProducts);
router.put('/moderation/products/:id', optionalAuth, moderateProduct);

// --- KHIẾU NẠI & CSKH (ADMIN SUPPORT) ---
router.get('/support/complaints', optionalAuth, getComplaints);
router.put('/support/complaints/:id', optionalAuth, updateComplaint);

// --- SELLER FINANCE & WALLET ---
router.get('/finance', optionalAuth, getSellerFinance);
router.put('/finance/bank-account', optionalAuth, updateBankAccount);
router.post('/finance/withdraw', optionalAuth, requestWithdrawal);

module.exports = router;
