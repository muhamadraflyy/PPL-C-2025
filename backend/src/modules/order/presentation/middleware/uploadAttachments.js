const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload directory exists
// Server dijalankan dari folder backend, jadi public ada di <backend>/public
const uploadDir = path.join(process.cwd(), 'public', 'order-attachments');
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
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 10,
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
});

// Middleware wrapper: handle upload + map to req.body.lampiran_client (array of URLs)
const uploadClientAttachments = [
  upload.array('lampiran_client', 10),
  (req, res, next) => {
    try {
      if (Array.isArray(req.files) && req.files.length > 0) {
        // Map to public URLs (assuming app serves /public)
        const basePath = '/public/order-attachments';
        const urls = req.files.map((f) => `${basePath}/${f.filename}`);
        req.body.lampiran_client = urls;
      }
      next();
    } catch (err) {
      // Jika terjadi error di mapping, fail dengan 400
      return res.status(400).json({
        success: false,
        message: 'Gagal memproses lampiran pesanan',
      });
    }
  },
];

module.exports = uploadClientAttachments;
