/**
 * Recommendation Routes
 * API routes untuk fitur rekomendasi layanan SkillConnect
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../shared/middleware/authMiddleware');
const adminMiddleware = require('../../../../shared/middleware/adminMiddleware');

// Import validators
const {
  getRecommendationsValidation,
  getSimilarServicesValidation,
  getPopularServicesValidation,
  trackInteractionValidation,
  addFavoriteValidation,
  removeFavoriteValidation,
  getInteractionHistoryValidation
} = require('../validators/recommendationValidators');

module.exports = (recommendationController, favoriteController) => {
  /**
   * @swagger
   * tags:
   *   name: Recommendations
   *   description: API untuk fitur rekomendasi layanan berdasarkan tren, histori pengguna, dan preferensi
   */

  /**
   * @swagger
   * components:
   *   schemas:
   *     Recommendation:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: ID rekomendasi
   *         userId:
   *           type: string
   *           description: ID pengguna
   *         serviceId:
   *           type: string
   *           description: ID layanan
   *         score:
   *           type: number
   *           description: Skor rekomendasi (0-100)
   *         reason:
   *           type: string
   *           description: Alasan rekomendasi
   *         source:
   *           type: string
   *           enum: [clicks, likes, orders, similar, popular]
   *           description: Sumber rekomendasi
   *         metadata:
   *           type: object
   *           description: Data tambahan layanan
   */

  // ==================== RECOMMENDATION ENDPOINTS ====================

  /**
 * @swagger
 * /api/recommendations:
 *   get:
 *     tags: [Recommendations]
 *     summary: Generate rekomendasi personal untuk pengguna
 *     description: |
 *       Menghasilkan rekomendasi layanan berdasarkan:
 *       - Layanan yang di-LIKE/Favorit user
 *       - History transaksi/order user
 *       - Preferensi kategori user
 *       
 *       **Filter Kategori:**
 *       - Tanpa parameter kategoriId Sistem otomatis filter berdasarkan preferensi user
 *       - Dengan parameter kategoriId User manual pilih kategori tertentu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: kategoriId
 *         schema:
 *           type: string
 *           format: uuid
 *           example:
 *         required: false
 *         description: |
 *           Kosongkan untuk melihat semua kategori sesuai preferensi user.
 * 
 *           UUID kategori untuk filter rekomendasi (optional).
 *     responses:
 *       200:
 *         description: Daftar rekomendasi berhasil dihasilkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recommendations retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "rec-1765221860998-0-d4e5f6a7-b8c9-0123-def0-123456789abc"
 *                       serviceId:
 *                         type: string
 *                         format: uuid
 *                         example: "d4e5f6a7-b8c9-0123-def0-123456789abc"
 *                       serviceName:
 *                         type: string
 *                         example: "Desain Brosur Company Profile"
 *                       kategoriId:
 *                         type: string
 *                         format: uuid
 *                         example: "c8b5da8f-b200-405f-9a2d-a2325bf14e87"
 *                       kategoriNama:
 *                         type: string
 *                         example: "Desain Grafis"
 *                       harga:
 *                         type: number
 *                         example: 350000
 *                       batasRevisi:
 *                         type: integer
 *                         example: 3
 *                       waktuPengerjaan:
 *                         type: integer
 *                         example: 5
 *                         description: "Waktu pengerjaan dalam hari"
 *                       score:
 *                         type: integer
 *                         example: 100
 *                         description: "Recommendation score (0-200)"
 *                       reason:
 *                         type: string
 *                         example: "Berdasarkan layanan yang Anda sukai"
 *                       source:
 *                         type: string
 *                         enum: [favorites_and_orders, popular]
 *                         example: "favorites_and_orders"
 *                       stats:
 *                         type: object
 *                         properties:
 *                           views:
 *                             type: integer
 *                             example: 150
 *                           favorites:
 *                             type: integer
 *                             example: 48
 *                           orders:
 *                             type: integer
 *                             example: 48
 *                           rating:
 *                             type: number
 *                             format: float
 *                             example: 4.9
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 10
 *                       description: "Jumlah rekomendasi yang dikembalikan"
 *                     basedOn:
 *                       type: object
 *                       properties:
 *                         favorites:
 *                           type: integer
 *                           example: 4
 *                           description: "Jumlah favorit user"
 *                         orders:
 *                           type: integer
 *                           example: 2
 *                           description: "Jumlah pesanan user"
 *                         categories:
 *                           type: integer
 *                           example: 2
 *                           description: "Jumlah kategori yang user minati"
 *                     excluded:
 *                       type: object
 *                       properties:
 *                         alreadyInteracted:
 *                           type: integer
 *                           example: 5
 *                           description: "Layanan yang sudah pernah user like/order"
 *                         hidden:
 *                           type: integer
 *                           example: 1
 *                           description: "Layanan yang user sembunyikan"
 *                         total:
 *                           type: integer
 *                           example: 6
 *                     filters:
 *                       type: object
 *                       properties:
 *                         kategoriId:
 *                           type: string
 *                           example: "all"
 *                           description: "Kategori yang sedang difilter ('all' = semua kategori)"
 *                         availableCategories:
 *                           type: array
 *                           description: "Daftar kategori yang tersedia untuk filter"
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                                 example: "c8b5da8f-b200-405f-9a2d-a2325bf14e87"
 *                               nama:
 *                                 type: string
 *                                 example: "Desain Grafis"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-08T19:24:21.006Z"
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "334b02ce-07d6-49da-ac8e-df32c59b3e6d"
 *       400:
 *         description: Bad Request - Parameter tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid category ID format"
 *                 error:
 *                   type: string
 *                   example: "Category ID must be a valid UUID"
 *       401:
 *         description: Unauthorized - token tidak valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User authentication required"
 *       500:
 *         description: Terjadi kesalahan server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
  router.get(
    '/',
    authMiddleware,
    getRecommendationsValidation,
    (req, res) => recommendationController.getRecommendations(req, res)
  );

  /**
   * @swagger
   * /api/recommendations/popular:
   *   get:
   *     tags: [Recommendations]
   *     summary: Ambil layanan yang sedang populer/trending
   *     description: Menampilkan daftar layanan yang paling populer berdasarkan metrik (clicks, likes, orders, rating)
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *           minimum: 1
   *           maximum: 50
   *         description: Jumlah layanan populer
   *       - in: query
   *         name: timeRange
   *         schema:
   *           type: string
   *           enum: [24h, 7d, 30d, all]
   *           default: 7d
   *         description: Rentang waktu untuk menghitung popularitas
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter berdasarkan kategori
   *     responses:
   *       200:
   *         description: Daftar layanan populer berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Recommendation'
   *       500:
   *         description: Terjadi kesalahan server
   */
  router.get(
    '/popular',
    getPopularServicesValidation,
    (req, res) => recommendationController.getPopularServices(req, res)
  );

  // /**
  //  * @swagger
  //  * /api/recommendations/similar/{serviceId}:
  //  *   get:
  //  *     tags: [Recommendations]
  //  *     summary: Ambil layanan serupa
  //  *     description: Mengambil layanan yang mirip berdasarkan kategori dan karakteristik
  //  *     parameters:
  //  *       - in: path
  //  *         name: serviceId
  //  *         required: true
  //  *         schema:
  //  *           type: string
  //  *         description: ID layanan untuk mencari layanan serupa
  //  *       - in: query
  //  *         name: limit
  //  *         schema:
  //  *           type: integer
  //  *           default: 5
  //  *           minimum: 1
  //  *           maximum: 20
  //  *         description: Jumlah layanan serupa
  //  *     responses:
  //  *       200:
  //  *         description: Daftar layanan serupa berhasil diambil
  //  *         content:
  //  *           application/json:
  //  *             schema:
  //  *               type: object
  //  *               properties:
  //  *                 success:
  //  *                   type: boolean
  //  *                 message:
  //  *                   type: string
  //  *                 data:
  //  *                   type: array
  //  *                   items:
  //  *                     $ref: '#/components/schemas/Recommendation'
  //  *       404:
  //  *         description: Layanan tidak ditemukan
  //  *       500:
  //  *         description: Terjadi kesalahan server
  //  */
  // router.get(
  //   '/similar/:serviceId',
  //   getSimilarServicesValidation,
  //   (req, res) => recommendationController.getSimilarServices(req, res)
  // );

  /**
   * @swagger
   * /api/recommendations/track:
   *   get:
   *     tags: [Recommendations]
   *     summary: Menampilkan layanan yang user lihat + berapa kali
   *     description: |
   *       Menampilkan history view user.
   *       
   *       **Response includes:**
   *       - List layanan yang pernah dilihat
   *       - Jumlah berapa kali user lihat setiap layanan
   *       - Kapan terakhir kali dilihat
   *       - Layanan yang paling sering dilihat
   *       
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: View history berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "View history retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       layananId:
   *                         type: string
   *                         format: uuid
   *                       namaLayanan:
   *                         type: string
   *                       jumlahDilihat:
   *                         type: integer
   *                         description: "Berapa kali user lihat layanan ini"
   *                       terakhirDilihat:
   *                         type: string
   *                         format: date-time
   *                 metadata:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     mostViewed:
   *                       type: object
   *       401:
   *         description: Unauthorized
   */
  router.get(
    '/track',
    authMiddleware,
    (req, res) => recommendationController.getInteractionHistory(req, res)
  );

  /**
   * @swagger
   * /api/recommendations/interactions/{serviceId}:
   *   post:
   *     tags: [Recommendations]
   *     summary: Menyimpan interaksi view/click ke database
   *     description: |
   *       Endpoint ini menyimpan data ketika user melihat atau klik layanan.
   *       
   *       **Apa yang dilakukan:**
   *       1. Simpan ke tabel `aktivitas_user` (history log)
   *       2. Increment counter `jumlah_dilihat` di tabel `layanan`
   *       
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID layanan yang dilihat
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               interactionType:
   *                 type: string
   *                 enum: [view, click]
   *                 default: view
   *                 description: Tipe interaksi
   *                 example: "view"
   *               metadata:
   *                 type: object
   *                 description: Data tambahan (optional)
   *                 example: { "source": "homepage", "device": "mobile" }
   *     responses:
   *       200:
   *         description: Interaksi berhasil disimpan
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Interaction saved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     userId:
   *                       type: string
   *                     serviceId:
   *                       type: string
   *                     interactionType:
   *                       type: string
   *                       example: "view"
   *                     newViewCount:
   *                       type: integer
   *                       example: 151
   *       400:
   *         description: Bad Request
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Service not found
   */
  router.post(
    '/interactions/:serviceId',
    authMiddleware,
    (req, res) => recommendationController.trackInteraction(req, res)
    // 👆 Pakai method trackInteraction (nama lama)
  );

  // ==================== FAVORITES ENDPOINTS ====================

  /**
   * @swagger
   * /api/recommendations/favorites/{serviceId}:
   *   post:
   *     tags: [Recommendations]
   *     summary: Tambahkan layanan ke favorit
   *     description: Menambahkan layanan ke daftar favorit user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID layanan yang akan ditambahkan ke favorit
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes:
   *                 type: string
   *                 maxLength: 500
   *                 description: Catatan tentang favorit (optional)
   *     responses:
   *       200:
   *         description: Layanan berhasil ditambahkan ke favorit
   *       400:
   *         description: Layanan sudah ada di favorit
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.post(
    '/favorites/:serviceId',
    authMiddleware,
    addFavoriteValidation,
    (req, res) => favoriteController.addFavorite(req, res)
  );

  /**
   * @swagger
   * /api/recommendations/favorites/{serviceId}:
   *   delete:
   *     tags: [Recommendations]
   *     summary: Hapus layanan dari favorit
   *     description: Menghapus layanan dari daftar favorit user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID layanan yang akan dihapus dari favorit
   *     responses:
   *       200:
   *         description: Layanan berhasil dihapus dari favorit
   *       400:
   *         description: Favorit tidak ditemukan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.delete(
    '/favorites/:serviceId',
    authMiddleware,
    removeFavoriteValidation,
    (req, res) => favoriteController.removeFavorite(req, res)
  );

  /**
   * @swagger
   * /api/recommendations/favorites:
   *   get:
   *     tags: [Recommendations]
   *     summary: Ambil daftar favorit user
   *     description: Mengambil semua layanan yang ada di daftar favorit user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Daftar favorit berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       userId:
   *                         type: string
   *                       serviceId:
   *                         type: string
   *                       notes:
   *                         type: string
   *                       addedAt:
   *                         type: string
   *                         format: date-time
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get(
    '/favorites',
    authMiddleware,
    (req, res) => favoriteController.getFavorites(req, res)
  );

  // ==================== HIDE SERVICE ENDPOINTS ====================

  /**
   * @swagger
   * /api/recommendations/hidden:
   *   get:
   *     tags: [Recommendations]
   *     summary: Membuka Layanan Rekomendasi yang Disembunyikan
   *     description: Menampilkan daftar layanan yang telah disembunyikan oleh pengguna
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Daftar layanan tersembunyi berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Hidden services retrieved successfully"
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "abc123"
   *                       userId:
   *                         type: string
   *                         example: "user-123"
   *                       serviceId:
   *                         type: string
   *                         example: "service-456"
   *                       hiddenAt:
   *                         type: string
   *                         format: date-time
   *                       serviceData:
   *                         type: object
   *                         properties:
   *                           serviceName:
   *                             type: string
   *                           servicePrice:
   *                             type: number
   *                           kategoriNama:
   *                             type: string
   *                 metadata:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     userId:
   *                       type: string
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: User tidak terautentikasi
   *       500:
   *         description: Terjadi kesalahan server
   */
  router.get(
    '/hidden',
    authMiddleware,
    (req, res) => recommendationController.getHiddenServices(req, res)
  );

  /**
   * @swagger
   * /api/recommendations/hide/{serviceId}:
   *   post:
   *     tags: [Recommendations]
   *     summary: Menyembunyikan Layanan Rekomendasi
   *     description: |
   *       Pengguna dapat menyembunyikan layanan tertentu yang dianggap tidak relevan.
   *       Sistem menyimpan preferensi ini ke database dan layanan tidak akan muncul lagi di rekomendasi.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID layanan yang ingin disembunyikan
   *     responses:
   *       200:
   *         description: Layanan berhasil disembunyikan
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Service hidden from recommendations successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     userId:
   *                       type: string
   *                     serviceId:
   *                       type: string
   *                     hiddenAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Bad request - layanan sudah disembunyikan atau ID tidak valid
   *       401:
   *         description: User tidak terautentikasi
   *       404:
   *         description: Layanan tidak ditemukan
   *       500:
   *         description: Terjadi kesalahan server
   */
  router.post(
    '/hide/:serviceId',
    authMiddleware,
    (req, res) => recommendationController.hideService(req, res)
  );

  /**
   * @swagger
   * /api/recommendations/hide/{serviceId}:
   *   delete:
   *     tags: [Recommendations]
   *     summary: Menghapus Layanan dari Daftar Tersembunyi
   *     description: |
   *       Pengguna dapat menghapus layanan dari daftar tersembunyi.
   *       Sistem menghapus preferensi dan layanan akan kembali muncul di rekomendasi.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID layanan yang ingin ditampilkan kembali
   *     responses:
   *       200:
   *         description: Layanan berhasil ditampilkan kembali
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Service unhidden successfully. It will appear in recommendations again."
   *       400:
   *         description: Bad request - ID tidak valid
   *       401:
   *         description: User tidak terautentikasi
   *       404:
   *         description: Layanan tidak ada di daftar tersembunyi
   *       500:
   *         description: Terjadi kesalahan server
   */
  router.delete(
    '/hide/:serviceId',
    authMiddleware,
    (req, res) => recommendationController.unhideService(req, res)
  );


  // ==================== ADMIN ENDPOINTS ====================

  /**
     * @swagger
     * /api/recommendations/admin/dashboard:
     *   get:
     *     tags: [Admin]
     *     summary: Membuka Halaman Dashboard Monitoring
     *     description: |
     *       Menampilkan dashboard visual lengkap untuk admin memantau performa sistem rekomendasi:
     *       - Grafik statistik rekomendasi yang sering digunakan
     *       - Grafik total transaksi
     *       - Tabel detail transaksi terakhir
     *       - Grafik total favorit
     *       - Tabel jumlah favorit per layanan
     *       - Tabel Top 10 Layanan yang Paling Direkomendasikan
     *       - Filter berdasarkan periode waktu (hari/minggu/bulan)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: timeRange
     *         schema:
     *           type: string
     *           enum: [daily, weekly, monthly]
     *           default: weekly
     *         description: Periode waktu untuk filter data (hari/minggu/bulan)
     *     responses:
     *       200:
     *         description: Dashboard data berhasil diambil
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Dashboard data retrieved successfully"
     *                 data:
     *                   type: object
     *                   properties:
     *                     timeRange:
     *                       type: string
     *                       example: "weekly"
     *                     period:
     *                       type: object
     *                       properties:
     *                         startDate:
     *                           type: string
     *                           format: date-time
     *                         endDate:
     *                           type: string
     *                           format: date-time
     *                         days:
     *                           type: integer
     *                     recommendationStats:
     *                       type: object
     *                       properties:
     *                         chart:
     *                           type: array
     *                           description: Data untuk grafik statistik rekomendasi
     *                         summary:
     *                           type: object
     *                           description: Ringkasan total statistik
     *                     transactionStats:
     *                       type: object
     *                       properties:
     *                         chart:
     *                           type: array
     *                           description: Data untuk grafik transaksi
     *                         summary:
     *                           type: object
     *                     recentTransactions:
     *                       type: array
     *                       description: Tabel detail transaksi terakhir
     *                     favoritesStats:
     *                       type: object
     *                       properties:
     *                         chart:
     *                           type: array
     *                           description: Data untuk grafik favorit
     *                         summary:
     *                           type: object
     *                     favoritesByService:
     *                       type: array
     *                       description: Tabel jumlah favorit per layanan
     *                     topRecommendedServices:
     *                       type: array
     *                       description: Tabel Top 10 Layanan yang Paling Direkomendasikan
     *                     activityBreakdown:
     *                       type: array
     *                       description: Breakdown aktivitas user (untuk pie chart)
     *       400:
     *         description: Bad request - parameter tidak valid
     *       401:
     *         description: User tidak terautentikasi atau bukan admin
     *       500:
     *         description: Terjadi kesalahan server
     */
  router.get(
    '/admin/dashboard',
    authMiddleware,
    adminMiddleware,
    (req, res) => recommendationController.getAdminDashboard(req, res)
  );

  /**
   * @swagger
   * /api/recommendations/admin/stats:
   *   get:
   *     tags: [Admin]
   *     summary: Dapatkan statistik rekomendasi (Admin)
   *     description: Endpoint untuk melihat ringkasan statistik data rekomendasi, seperti total rekomendasi, jumlah interaksi, dan performa keseluruhan.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistik rekomendasi berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Recommendation statistics retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalRecommendations:
   *                       type: integer
   *                       example: 120
   *                     totalInteractions:
   *                       type: integer
   *                       example: 480
   *                     topCategory:
   *                       type: string
   *                       example: "Design & Creative"
   *                     generatedAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-11-08T10:35:00.000Z"
   *       401:
   *         description: User tidak terautentikasi atau tidak memiliki akses admin
   *       500:
   *         description: Terjadi kesalahan server
   */
  router.get(
    '/admin/stats',
    authMiddleware,
    adminMiddleware,
    (req, res) => recommendationController.getAdminStats(req, res)
  );


  /**
   * @swagger
   * /api/recommendations/admin/performance:
   *   get:
   *     tags: [Admin]
   *     summary: Dapatkan metrik performa rekomendasi (Admin)
   *     description: Endpoint untuk melihat performa algoritma rekomendasi berdasarkan engagement pengguna (clicks, likes, orders).
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Data performa berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Recommendation performance metrics retrieved successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     accuracy:
   *                       type: number
   *                       format: float
   *                       example: 0.87
   *                     precision:
   *                       type: number
   *                       format: float
   *                       example: 0.81
   *                     recall:
   *                       type: number
   *                       format: float
   *                       example: 0.84
   *                     lastUpdated:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-11-08T10:40:00.000Z"
   *       401:
   *         description: User tidak terautentikasi atau tidak memiliki akses admin
   *       500:
   *         description: Terjadi kesalahan server
   */
  router.get(
    '/admin/performance',
    authMiddleware,
    adminMiddleware,
    (req, res) => recommendationController.getRecommendationPerformance(req, res)
  );

  return router;
};