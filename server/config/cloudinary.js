const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'l6nfjxlg',
  api_key: process.env.CLOUDINARY_API_KEY || '296512619581421',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'sEdKs-8xTJvaRlx49GrX-tywEJs',
  secure: true,
});

module.exports = cloudinary;
