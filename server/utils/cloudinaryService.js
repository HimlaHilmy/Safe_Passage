const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');

/**
 * Convert an image buffer to WebP format before storing in Cloudinary
 * @param {Buffer} buffer - Original image file buffer
 * @param {Object} options - Sharp WebP options (quality, lossless, etc.)
 * @returns {Promise<Buffer>} - Converted WebP image buffer
 */
async function convertToWebP(buffer, options = { quality: 85 }) {
  try {
    return await sharp(buffer)
      .webp(options)
      .toBuffer();
  } catch (err) {
    console.warn('[Sharp Conversion Warning]:', err.message);
    // If sharp fails (e.g., SVG or raw buffer), return original buffer
    return buffer;
  }
}

/**
 * Upload an image buffer to Cloudinary after converting to WebP
 * @param {Buffer} buffer - Image file buffer
 * @param {Object} uploadOptions - Custom Cloudinary options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
function uploadToCloudinary(buffer, uploadOptions = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'safe_passage',
      format: 'webp',
      resource_type: 'image',
      ...uploadOptions,
    };

    const stream = cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(buffer);
  });
}

/**
 * Combined service: Converts to WebP first, then uploads to Cloudinary
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Custom folder and conversion options
 */
async function uploadImageAsWebP(buffer, options = {}) {
  // 1. Convert to WebP format locally using Sharp
  const webpBuffer = await convertToWebP(buffer, {
    quality: options.quality || 85,
    effort: 4,
  });

  // 2. Upload WebP buffer to Cloudinary
  const result = await uploadToCloudinary(webpBuffer, {
    folder: options.folder || 'safe_passage',
    public_id: options.publicId,
    tags: ['safe_passage', 'webp_converted', ...(options.tags || [])],
  });

  return {
    url: result.secure_url || result.url,
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format || 'webp',
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    originalFilename: options.filename || 'image',
  };
}

module.exports = {
  convertToWebP,
  uploadToCloudinary,
  uploadImageAsWebP,
};
