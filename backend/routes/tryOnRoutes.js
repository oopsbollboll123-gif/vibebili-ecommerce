const express = require('express');
const router = express.Router();
const { virtualTryOn, proxyImage } = require('../controllers/tryOnController');

router.post('/virtual-try-on', virtualTryOn);
router.get('/proxy-image', proxyImage);

module.exports = router;
