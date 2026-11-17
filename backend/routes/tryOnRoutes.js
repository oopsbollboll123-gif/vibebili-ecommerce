const express = require('express');
const router = express.Router();
const { virtualTryOn } = require('../controllers/tryOnController');

router.post('/virtual-try-on', virtualTryOn);

module.exports = router;
