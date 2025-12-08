"use strict";

/**
 * Use Case: Get Popular Services
 * Mengambil layanan terpopuler berdasarkan total pesanan selesai,
 * dikelompokkan per kategori (Top 1-10 per kategori)
 */
class GetPopularServices {
  /**
   * @param {import("../../infrastructure/repositories/SequelizeServiceRepository")} serviceRepository
   */
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  /**
   * Execute use case
   * @param {Object} filters
   * @param {string} [filters.kategori_id] - Filter berdasarkan kategori tertentu
   * @param {number} [filters.limit] - Jumlah layanan per kategori (default: 10)
   * @returns {Promise<Object>} { categories: Array<{ kategori_id, nama_kategori, services: Array }> }
   */
  async execute(filters = {}) {
    try {
      const limit = Math.min(Math.max(1, Number(filters.limit) || 10), 50);
      const kategoriId = filters.kategori_id || null;

      // Query untuk mendapatkan layanan terpopuler per kategori
      // Hanya layanan dengan status 'aktif' dan yang memiliki pesanan selesai
      const query = `
        WITH RankedServices AS (
          SELECT 
            l.id,
            l.freelancer_id,
            l.kategori_id,
            l.judul,
            l.slug,
            l.deskripsi,
            l.harga,
            l.waktu_pengerjaan,
            l.batas_revisi,
            l.thumbnail,
            l.gambar,
            l.rating_rata_rata,
            l.jumlah_rating,
            l.total_pesanan,
            l.jumlah_dilihat,
            l.status,
            l.created_at,
            l.updated_at,
            k.nama AS nama_kategori,
            CONCAT(u.nama_depan, ' ', u.nama_belakang) AS freelancer_name,
            -- Ranking per kategori berdasarkan total_pesanan (pesanan selesai)
            ROW_NUMBER() OVER (
              PARTITION BY l.kategori_id 
              ORDER BY l.total_pesanan DESC, l.rating_rata_rata DESC, l.created_at DESC
            ) AS rank_in_category
          FROM layanan l
          INNER JOIN kategori k ON k.id = l.kategori_id
          LEFT JOIN users u ON u.id = l.freelancer_id
          WHERE l.status = 'aktif'
            AND l.total_pesanan > 0
            ${kategoriId ? 'AND l.kategori_id = ?' : ''}
        )
        SELECT *
        FROM RankedServices
        WHERE rank_in_category <= ?
        ORDER BY kategori_id, rank_in_category
      `;

      const replacements = kategoriId ? [kategoriId, limit] : [limit];

      const [rows] = await this.serviceRepository.sequelize.query(query, {
        replacements,
      });

      // Parse hasil query dan kelompokkan per kategori
      const categoriesMap = new Map();

      for (const row of rows) {
        const kategoriId = row.kategori_id;

        if (!categoriesMap.has(kategoriId)) {
          categoriesMap.set(kategoriId, {
            kategori_id: kategoriId,
            nama_kategori: row.nama_kategori,
            services: [],
          });
        }

        // Parse gambar JSON
        let gambar = [];
        try {
          if (row.gambar && typeof row.gambar === "string") {
            gambar = JSON.parse(row.gambar);
          } else if (Array.isArray(row.gambar)) {
            gambar = row.gambar;
          }
        } catch (e) {
          // Jika gagal parse, biarkan array kosong
        }

        const service = {
          id: row.id,
          freelancer_id: row.freelancer_id,
          kategori_id: row.kategori_id,
          judul: row.judul,
          slug: row.slug,
          deskripsi: row.deskripsi,
          harga: parseFloat(row.harga) || 0,
          waktu_pengerjaan: row.waktu_pengerjaan,
          batas_revisi: row.batas_revisi,
          thumbnail: row.thumbnail,
          gambar,
          rating_rata_rata: parseFloat(row.rating_rata_rata) || 0,
          jumlah_rating: row.jumlah_rating || 0,
          total_pesanan: row.total_pesanan || 0,
          jumlah_dilihat: row.jumlah_dilihat || 0,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          nama_kategori: row.nama_kategori,
          freelancer_name: row.freelancer_name,
          rank_in_category: row.rank_in_category,
        };

        categoriesMap.get(kategoriId).services.push(service);
      }

      // Convert Map ke Array
      const categories = Array.from(categoriesMap.values());

      // Hitung total layanan
      const totalServices = categories.reduce(
        (sum, cat) => sum + cat.services.length,
        0
      );

      return {
        categories,
        totalServices,
        totalCategories: categories.length,
      };
    } catch (error) {
      console.error("[GetPopularServices] Error:", error);
      throw new Error(`Failed to get popular services: ${error.message}`);
    }
  }
}

module.exports = GetPopularServices;