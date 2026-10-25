const { uploadImageAsWebP } = require('../utils/cloudinaryService');

/**
 * @desc    Upload single image, convert to WebP, and store in Cloudinary
 * @route   POST /api/upload/image
 * @access  Private
 */
exports.uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please provide an image under field name "image" or "file".',
        error: 'NO_FILE_PROVIDED',
      });
    }

    const { folder, quality } = req.body;

    const result = await uploadImageAsWebP(req.file.buffer, {
      folder: folder || 'safe_passage',
      filename: req.file.originalname,
      quality: quality ? parseInt(quality, 10) : 85,
    });

    return res.status(200).json({
      success: true,
      message: 'Image converted to WebP and stored in Cloudinary successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload multiple images, convert each to WebP, and store in Cloudinary
 * @route   POST /api/upload/multiple
 * @access  Private
 */
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files uploaded.',
        error: 'NO_FILES_PROVIDED',
      });
    }

    const { folder, quality } = req.body;

    const uploadPromises = req.files.map((file) =>
      uploadImageAsWebP(file.buffer, {
        folder: folder || 'safe_passage',
        filename: file.originalname,
        quality: quality ? parseInt(quality, 10) : 85,
      })
    );

    const results = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      count: results.length,
      message: `${results.length} images converted to WebP and stored in Cloudinary.`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};
