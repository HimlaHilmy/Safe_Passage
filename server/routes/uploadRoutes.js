const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { uploadSingleImage, uploadMultipleImages } = require('../controllers/uploadController');

// Allow both authenticated and public incident reporting image uploads
const optionalProtect = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

// POST /api/upload/image (Single image upload with WebP conversion)
router.post(
  '/image',
  optionalProtect,
  upload.single('image'),
  uploadSingleImage
);

// Fallback field name 'file'
router.post(
  '/file',
  optionalProtect,
  upload.single('file'),
  uploadSingleImage
);

// POST /api/upload/multiple (Multiple images upload with WebP conversion)
router.post(
  '/multiple',
  optionalProtect,
  upload.array('images', 8),
  uploadMultipleImages
);

module.exports = router;
