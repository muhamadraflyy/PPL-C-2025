const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'bukti-transfer');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `bukti-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// Middleware wrapper: handle single file upload and map to req.body.bukti_transfer
const uploadBuktiTransfer = [
  upload.single('bukti_transfer'),
  (req, res, next) => {
    try {
      console.log('[UPLOAD MIDDLEWARE] File received:', req.file);
      console.log('[UPLOAD MIDDLEWARE] Body before:', req.body);

      if (req.file) {
        // Map to public URL with backend domain
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5001';
        req.body.bukti_transfer = `${baseUrl}/public/bukti-transfer/${req.file.filename}`;
        console.log('[UPLOAD MIDDLEWARE] Bukti transfer set to:', req.body.bukti_transfer);
      } else {
        console.log('[UPLOAD MIDDLEWARE] No file received');
        // If no file but bukti_transfer exists in body, keep it as is
        if (!req.body.bukti_transfer) {
          return res.status(400).json({
            success: false,
            message: 'File bukti transfer wajib diupload',
          });
        }
      }
      next();
    } catch (err) {
      console.error('[UPLOAD MIDDLEWARE] Error:', err);
      return res.status(400).json({
        success: false,
        message: 'Gagal memproses bukti transfer',
      });
    }
  },
];

module.exports = uploadBuktiTransfer;
