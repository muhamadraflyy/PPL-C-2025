/**
 * Upload Middleware
 * Handles file uploads using multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan upload directory exists
const uploadDir = path.join(__dirname, '../../../public/chat-attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter - only allow images and common file types
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
  // Allowed file types
  const allowedFileTypes = /pdf|doc|docx|xls|xlsx|txt|zip|rar/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Check if image
  if (allowedImageTypes.test(extname.substring(1)) && mimetype.startsWith('image/')) {
    return cb(null, true);
  }

  // Check if allowed file type
  if (allowedFileTypes.test(extname.substring(1))) {
    return cb(null, true);
  }

  cb(new Error('File type not allowed. Only images and documents (pdf, doc, xls, txt, zip) are permitted.'));
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
