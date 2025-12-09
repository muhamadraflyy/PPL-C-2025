# Backend Scripts

Kumpulan utility scripts untuk maintenance dan development.

## Available Scripts

### 1. `clean-uploads.js`
Membersihkan semua file upload (profiles, layanan, portfolio).

**Usage:**
```bash
npm run clean:uploads
```

**Otomatis dijalankan saat:**
```bash
npm run migrate:fresh
npm run seed:fresh
```

**Folder yang dibersihkan:**
- `public/profiles/` - Avatar & cover photo user
- `public/portfolio/` - File portfolio freelancer

---

### 2. `cleanup-expired-otp.js`
Membersihkan OTP yang sudah expired dari database.

**Usage:**
```bash
node scripts/cleanup-expired-otp.js
```

---

### 3. `test-notifications.js`
Testing pengiriman notifikasi (email/SMS).

**Usage:**
```bash
node scripts/test-notifications.js
```

---

## Notes

- Semua script aman dijalankan di development & production
- `clean-uploads.js` hanya menghapus file, tidak menghapus folder
- Backup data penting sebelum menjalankan `migrate:fresh`
