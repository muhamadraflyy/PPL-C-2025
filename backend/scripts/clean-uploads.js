/**
 * Clean Uploads Script
 * Menghapus semua file upload (profiles, layanan, portfolio) saat migrate:fresh
 * 
 * CATATAN: Script ini dinonaktifkan untuk menjaga data portfolio dan profiles
 */

const fs = require('fs');
const path = require('path');

// Daftar folder yang akan dibersihkan (DINONAKTIFKAN)
const foldersToClean = [
  // path.join(__dirname, '../public/profiles'),   // Avatar & cover photo - DINONAKTIFKAN
  // path.join(__dirname, '../public/portfolio')   // Portfolio freelancer - DINONAKTIFKAN
];

/**
 * Hapus semua file di dalam folder (tapi tetap pertahankan foldernya)
 */
function cleanFolder(folderPath) {
  try {
    if (!fs.existsSync(folderPath)) {
      console.log(`📁 Folder tidak ditemukan, membuat folder: ${folderPath}`);
      fs.mkdirSync(folderPath, { recursive: true });
      return;
    }

    const files = fs.readdirSync(folderPath);
    
    if (files.length === 0) {
      console.log(`✅ Folder sudah kosong: ${folderPath}`);
      return;
    }

    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        fs.unlinkSync(filePath);
        deletedCount++;
      } else if (stat.isDirectory()) {
        // Hapus subfolder secara rekursif
        fs.rmSync(filePath, { recursive: true, force: true });
        deletedCount++;
      }
    });

    console.log(`✅ Berhasil menghapus ${deletedCount} file/folder dari: ${folderPath}`);
  } catch (error) {
    console.error(`❌ Error membersihkan folder ${folderPath}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log('\n🧹 Membersihkan folder uploads...\n');
  
  if (foldersToClean.length === 0) {
    console.log('⚠️  Pembersihan folder dinonaktifkan - data portfolio dan profiles akan dipertahankan');
  } else {
    foldersToClean.forEach(folder => {
      cleanFolder(folder);
    });
  }
  
  console.log('\n✨ Selesai!\n');
}

// Run script
main();
