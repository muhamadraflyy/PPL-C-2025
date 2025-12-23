# Guide: Auto Clean Uploads on Migrate Fresh

**Tanggal:** 9 Desember 2024  
**Status:** ✅ Implemented

---

## 🎯 Tujuan

Menghapus otomatis semua file upload (avatar, cover photo, portfolio) saat menjalankan `npm run migrate:fresh`.

---

## 📁 File yang Ditambahkan

### 1. `backend/scripts/clean-uploads.js`
Script untuk membersihkan folder uploads.

**Folder yang dibersihkan:**
- `backend/public/profiles/` - Avatar & cover photo user
- `backend/public/portfolio/` - File portfolio freelancer

**Fitur:**
- ✅ Menghapus semua file di dalam folder
- ✅ Menghapus subfolder secara rekursif
- ✅ Tetap mempertahankan folder utama
- ✅ Error handling yang baik
- ✅ Logging yang informatif

---

## 🔧 Perubahan pada `backend/package.json`

### Script Baru:
```json
"clean:uploads": "node scripts/clean-uploads.js"
```

### Script yang Diupdate:
```json
"migrate:fresh": "node scripts/clean-uploads.js && sequelize db:drop --config config/config.js && sequelize db:create --config config/config.js && sequelize db:migrate --config config/config.js --migrations-path src/shared/database/migrations"
```

---

## 🚀 Cara Penggunaan

### 1. Clean Uploads Saja
```bash
cd backend
npm run clean:uploads
```

**Output:**
```
🧹 Membersihkan folder uploads...

✅ Berhasil menghapus 48 file/folder dari: C:\PPL-C-2025\backend\public\profiles

✨ Selesai membersihkan uploads!
```

### 2. Migrate Fresh (Auto Clean)
```bash
cd backend
npm run migrate:fresh
```

**Alur Eksekusi:**
1. 🧹 Clean uploads (hapus semua file)
2. 🗑️ Drop database
3. 🆕 Create database baru
4. 📊 Run migrations

### 3. Seed Fresh (Auto Clean)
```bash
cd backend
npm run seed:fresh
```

**Alur Eksekusi:**
1. 🧹 Clean uploads
2. 🗑️ Drop database
3. 🆕 Create database baru
4. 📊 Run migrations
5. 🌱 Run seeders

---

## 📊 Struktur Folder

```
backend/
├── public/
│   ├── profiles/          ← Dibersihkan ✅
│   │   ├── avatar1.jpg
│   │   └── cover1.jpg
│   ├── layanan/           ← Tidak dihapus ❌
│   │   ├── service1.jpg
│   │   └── service2.jpg
│   └── portfolio/         ← Tidak dihapus ❌
│       ├── portfolio1.jpg
│       └── portfolio2.jpg
├── scripts/
│   ├── clean-uploads.js   ← Script baru ✅
│   └── README.md
└── package.json           ← Updated ✅
```

---

## ⚠️ Warning

### Development
- ✅ Aman digunakan
- ✅ Data akan di-seed ulang

### Production
- ⚠️ **HATI-HATI!** Semua file upload akan terhapus
- 💾 Backup file penting sebelum migrate:fresh
- 🚫 Jangan jalankan di production tanpa backup

---

## 🧪 Testing

### Test 1: Clean Uploads Saja
```bash
# 1. Upload beberapa file via aplikasi
# 2. Jalankan clean
npm run clean:uploads

# 3. Cek folder profiles - seharusnya kosong
ls public/profiles
```

### Test 2: Migrate Fresh
```bash
# 1. Upload beberapa file via aplikasi
# 2. Jalankan migrate:fresh
npm run migrate:fresh

# 3. Cek folder - seharusnya kosong
# 4. Cek database - seharusnya fresh
```

### Test 3: Seed Fresh
```bash
# 1. Jalankan seed:fresh
npm run seed:fresh

# 2. Cek folder - seharusnya kosong
# 3. Cek database - seharusnya ada data seed
```

---

## 🔍 Troubleshooting

### Error: "Cannot find module"
```bash
# Pastikan di folder backend
cd backend

# Install dependencies
npm install
```

### Error: "Permission denied"
```bash
# Windows: Run as Administrator
# Linux/Mac: Check folder permissions
chmod -R 755 public/
```

### Folder tidak terhapus
```bash
# Cek apakah ada file yang sedang digunakan
# Tutup aplikasi yang mengakses file tersebut
# Jalankan ulang script
```

---

## 📝 Notes

1. **Folder tetap ada** - Script hanya menghapus isi, bukan foldernya
2. **Recursive delete** - Subfolder juga ikut terhapus
3. **Safe operation** - Error handling mencegah crash
4. **Logging** - Output informatif untuk debugging

---

## ✅ Checklist

- [x] Script `clean-uploads.js` dibuat
- [x] Package.json updated
- [x] Script `clean:uploads` berfungsi
- [x] Auto-run saat `migrate:fresh`
- [x] Auto-run saat `seed:fresh`
- [x] Dokumentasi lengkap
- [x] Testing passed

---

**Status:** ✅ Ready to use!
