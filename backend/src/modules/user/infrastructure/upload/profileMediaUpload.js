"use strict";

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Directory untuk menyimpan foto profile dan portfolio
const PROFILES_DIR = path.join(process.cwd(), "public", "profiles");
const PORTFOLIO_DIR = path.join(process.cwd(), "public", "portfolio");

// Buat directory jika belum ada
if (!fs.existsSync(PROFILES_DIR)) {
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}
if (!fs.existsSync(PORTFOLIO_DIR)) {
  fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
}

// Konfigurasi storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Portfolio files go to portfolio folder, others to profiles folder
    if (file.fieldname === 'portfolio') {
      cb(null, PORTFOLIO_DIR);
    } else {
      cb(null, PROFILES_DIR);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp-fieldname.ext
    const userId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const fieldName = file.fieldname; // 'foto_profil', 'foto_latar', or 'portfolio'
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}-${fieldName}${ext}`;
    cb(null, filename);
  }
});

// Filter file - hanya terima gambar
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files are allowed (jpeg, jpg, png, webp)`), false);
  }
};

// Konfigurasi multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Middleware untuk upload foto profil, foto latar, dan portfolio
const profileMediaUpload = upload.fields([
  { name: "foto_profil", maxCount: 1 },
  { name: "foto_latar", maxCount: 1 },
  { name: "portfolio", maxCount: 10 } // Support up to 10 portfolio images
]);

module.exports = profileMediaUpload;
