const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload directory exists (reuse order-attachments folder)
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
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 10,
    fileSize: 20 * 1024 * 1024, // 20 MB per file
  },
});

// Middleware wrapper: handle upload + map to req.body.lampiranFreelancer (array of metadata)
const uploadFreelancerAttachments = [
  upload.array('lampiranFreelancer', 10),
  (req, res, next) => {
    try {
      if (Array.isArray(req.files) && req.files.length > 0) {
        const basePath = '/public/order-attachments';
        const attachments = req.files.map((f) => ({
          url: `${basePath}/${f.filename}`,
          name: f.originalname || f.filename,
          size: typeof f.size === 'number' ? f.size : null,
        }));
        req.body.lampiranFreelancer = attachments;
      }
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Gagal memproses lampiran hasil pekerjaan',
      });
    }
  },
];

module.exports = uploadFreelancerAttachments;
