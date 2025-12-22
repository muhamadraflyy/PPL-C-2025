/**
 * Review Routes
 * API routes untuk review dan rating
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../../shared/middleware/authMiddleware');

module.exports = (reviewController) => {
   
  /**
   * @swagger
   * /api/reviews:
   *   post:
   *     tags: [Reviews]
   *     summary: Create review
   *     description: Membuat ulasan untuk pesanan yang sudah selesai
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pesanan_id
   *               - rating
   *               - komentar
   *             properties:
   *               pesanan_id:
   *                 type: string
   *                 format: uuid
   *                 example: 83b5c2de-baf1-4a96-84de-5681b62aab98
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 example: 5
   *               komentar:
   *                 type: string
   *                 minLength: 10
   *                 example: amboi bagus banget
   *     responses:
   *       201:
   *         description: Ulasan berhasil dibuat
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
   *                   example: Ulasan berhasil dibuat
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     is_approved:
   *                       type: boolean
   *                       example: true
   *                     is_reported:
   *                       type: boolean
   *                       example: false
   *                     pesanan_id:
   *                       type: string
   *                       format: uuid
   *                     layanan_id:
   *                       type: string
   *                       format: uuid
   *                     pemberi_ulasan_id:
   *                       type: string
   *                       format: uuid
   *                     penerima_ulasan_id:
   *                       type: string
   *                       format: uuid
   *                     rating:
   *                       type: integer
   *                       example: 5
   *                     komentar:
   *                       type: string
   *                       example: amboi bagus banget
   *                     created_at:
   *                       type: string
   *                       format: date-time
   *                     updated_at:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Validasi gagal
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
   *                   oneOf:
   *                     - example: Pesanan tidak ditemukan
   *                     - example: Anda bukan pembeli dari pesanan ini
   *                     - example: Pesanan belum selesai, tidak bisa memberi ulasan
   *                     - example: Pesanan ini sudah pernah diulas
   *                     - example: Rating harus antara 1 dan 5
   *                     - example: Komentar ulasan minimal 5 karakter
   *       401:
   *         description: Unauthorized
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
   *                   example: Unauthorized
   */
  router.post('/', authMiddleware, (req, res) => reviewController.createReview(req, res));

  /**
   * @swagger
   * /api/reviews/my:
   *   get:
   *     tags: [Reviews]
   *     summary: Get my reviews
   *     description: Mengambil semua ulasan yang dibuat oleh user yang sedang login
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           example: 1
   *         description: Nomor halaman
   *     responses:
   *       200:
   *         description: Berhasil mengambil ulasan saya
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               message: "Berhasil mengambil ulasan saya"
   *               data:
   *                 items:
   *                   - id: "93fab14e-a467-4953-aa07-a488dbfecbbd"
   *                     pesanan_id: "83b5c2de-baf1-4a96-84de-5681b62aab98"
   *                     layanan_id: "4c432983-5115-4a4d-b3c8-b0583bf15d57"
   *                     pemberi_ulasan_id: "c9392b64-397d-4a56-807f-e670003d84d8"
   *                     penerima_ulasan_id: "b80e9f42-de4e-4a96-89cf-636504a2f0a9"
   *                     rating: 5
   *                     judul: null
   *                     komentar: "amboi bagus banget"
   *                     gambar: null
   *                     balasan: null
   *                     dibalas_pada: null
   *                     is_approved: 1
   *                     is_reported: 0
   *                     created_at: "2025-12-19T07:50:31.000Z"
   *                     updated_at: "2025-12-19T07:50:31.000Z"
   *                 meta:
   *                   total: 1
   *                   page: 1
   *                   limit: 10
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             example:
   *               success: false
   *               message: "Unauthorized"
   */
  router.get('/my', authMiddleware, (req, res) => reviewController.getMyReviews(req, res));

  /**
   * @swagger
   * /api/reviews/service/{serviceId}:
   *   get:
   *     tags: [Reviews]
   *     summary: Get reviews by service
   *     description: Mengambil ulasan berdasarkan layanan
   *     parameters:
   *       - in: path
   *         name: serviceId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID layanan
   *     responses:
   *       200:
   *         description: Berhasil mengambil ulasan layanan
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               message: "Berhasil mengambil ulasan layanan"
   *               data:
   *                 items:
   *                   - id: "93fab14e-a467-4953-aa07-a488dbfecbbd"
   *                     pesanan_id: "83b5c2de-baf1-4a96-84de-5681b62aab98"
   *                     layanan_id: "4c432983-5115-4a4d-b3c8-b0583bf15d57"
   *                     pemberi_ulasan_id: "c9392b64-397d-4a56-807f-e670003d84d8"
   *                     penerima_ulasan_id: "b80e9f42-de4e-4a96-89cf-636504a2f0a9"
   *                     rating: 5
   *                     judul: null
   *                     komentar: "amboi bagus banget"
   *                     gambar: null
   *                     balasan: null
   *                     dibalas_pada: null
   *                     is_approved: 1
   *                     is_reported: 0
   *                     created_at: "2025-12-19T07:50:31.000Z"
   *                     updated_at: "2025-12-19T07:50:31.000Z"
   *                 meta:
   *                   total: 1
   *                   page: 1
   *                   limit: 2
   */
  router.get('/service/:serviceId', (req, res) => reviewController.getReviewsByService(req, res));


  /**
   * @swagger
   * /api/reviews/freelancer/{freelancerId}:
   *   get:
   *     tags: [Reviews]
   *     summary: Get reviews by freelancer
   *     description: Mengambil ulasan berdasarkan freelancer
   *     parameters:
   *       - in: path
   *         name: freelancerId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID freelancer
   *     responses:
   *       200:
   *         description: Berhasil mengambil ulasan freelancer
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               message: "Berhasil mengambil ulasan freelancer"
   *               data:
   *                 items:
   *                   - id: "93fab14e-a467-4953-aa07-a488dbfecbbd"
   *                     pesanan_id: "83b5c2de-baf1-4a96-84de-5681b62aab98"
   *                     layanan_id: "4c432983-5115-4a4d-b3c8-b0583bf15d57"
   *                     pemberi_ulasan_id: "c9392b64-397d-4a56-807f-e670003d84d8"
   *                     penerima_ulasan_id: "b80e9f42-de4e-4a96-89cf-636504a2f0a9"
   *                     rating: 5
   *                     judul: null
   *                     komentar: "amboi bagus banget"
   *                     gambar: null
   *                     balasan: null
   *                     dibalas_pada: null
   *                     is_approved: 1
   *                     is_reported: 0
   *                     created_at: "2025-12-19T07:50:31.000Z"
   *                     updated_at: "2025-12-19T07:50:31.000Z"
   *                 meta:
   *                   total: 1
   *                   page: 1
   *                   limit: 2
   */
  router.get('/freelancer/:freelancerId', (req, res) => reviewController.getReviewsByFreelancer(req, res));

  /**
   * @swagger
   * /api/reviews/latest:
   *   get:
   *     tags: [Reviews]
   *     summary: Get latest reviews
   *     description: Mengambil ulasan terbaru
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           example: 5
   *         description: Jumlah ulasan terbaru yang diambil
   *     responses:
   *       200:
   *         description: Berhasil mengambil ulasan terbaru
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               message: "Berhasil mengambil ulasan terbaru"
   *               data:
   *                 items:
   *                   - id: "93fab14e-a467-4953-aa07-a488dbfecbbd"
   *                     pesanan_id: "83b5c2de-baf1-4a96-84de-5681b62aab98"
   *                     layanan_id: "4c432983-5115-4a4d-b3c8-b0583bf15d57"
   *                     pemberi_ulasan_id: "c9392b64-397d-4a56-807f-e670003d84d8"
   *                     penerima_ulasan_id: "b80e9f42-de4e-4a96-89cf-636504a2f0a9"
   *                     rating: 5
   *                     judul: null
   *                     komentar: "amboi bagus banget"
   *                     gambar: null
   *                     balasan: null
   *                     dibalas_pada: null
   *                     is_approved: 1
   *                     is_reported: 0
   *                     created_at: "2025-12-19T07:50:31.000Z"
   *                     updated_at: "2025-12-19T07:50:31.000Z"
   *                 meta:
   *                   total: 1
   *                   limit: 5
   */
  router.get('/latest', (req, res) => reviewController.getLatestReviews(req, res));


  /**
   * @swagger
   * /api/reviews/user/{userId}:
   *   get:
   *     tags: [Reviews]
   *     summary: Get reviews by user
   *     description: Mengambil ulasan berdasarkan user
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID user
   *     responses:
   *       200:
   *         description: Berhasil mengambil ulasan user
   *         content:
   *           application/json:
   *             example:
   *               success: true
   *               message: "Berhasil mengambil ulasan user"
   *               data:
   *                 items:
   *                   - id: "93fab14e-a467-4953-aa07-a488dbfecbbd"
   *                     pesanan_id: "83b5c2de-baf1-4a96-84de-5681b62aab98"
   *                     layanan_id: "4c432983-5115-4a4d-b3c8-b0583bf15d57"
   *                     pemberi_ulasan_id: "c9392b64-397d-4a56-807f-e670003d84d8"
   *                     penerima_ulasan_id: "b80e9f42-de4e-4a96-89cf-636504a2f0a9"
   *                     rating: 5
   *                     judul: null
   *                     komentar: "amboi bagus banget"
   *                     gambar: null
   *                     balasan: null
   *                     dibalas_pada: null
   *                     is_approved: 1
   *                     is_reported: 0
   *                     created_at: "2025-12-19T07:50:31.000Z"
   *                     updated_at: "2025-12-19T07:50:31.000Z"
   *                 meta:
   *                   total: 1
   *                   page: 1
   *                   limit: 10
   */
  router.get('/user/:userId', (req, res) => reviewController.getReviewsByUser(req, res));


    /**
     * @swagger
     * /api/reviews/{id}/report:
     *   post:
     *     tags: [Reviews]
     *     summary: Report review
     *     description: Laporkan review yang melanggar
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ReportReviewRequest'
     *     responses:
     *       200:
     *         description: Review berhasil dilaporkan
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     */
    router.post('/:id/report', authMiddleware, (req, res) => reviewController.reportReview(req, res));

    /**
     * @swagger
     * /api/reviews/{id}/reply:
     *   post:
     *     tags: [Reviews]
     *     summary: Reply to review (seller only)
     *     description: Membalas ulasan sebagai freelancer
     *     parameters:
     *       - in: path
     *         name: ulasanId
     *         required: true
     *         schema:
     *           type: string
     *         description: ID Ulasan 
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - Balasan
     *             properties:
     *               reply:
     *                 type: string
     *                 example: Why kenapa tuh bintang star 3
     *     responses:
     *       200:
     *         description: Balasan ulasan berhasil dikirim
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
     *                   example: Balasan ulasan berhasil dikirim
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       format: uuid
     *                     is_approved:
     *                       type: boolean
     *                       example: true
     *                     is_reported:
     *                       type: boolean
     *                       example: false
     *                     pesanan_id:
     *                       type: string
     *                       format: uuid
     *                     layanan_id:
     *                       type: string
     *                       format: uuid
     *                     pemberi_ulasan_id:
     *                       type: string
     *                       format: uuid
     *                     penerima_ulasan_id:
     *                       type: string
     *                       format: uuid
     *                     rating:
     *                       type: integer
     *                       example: 3
     *                     komentar:
     *                       type: string
     *                       example: lebih baik better lha yah
     *                     balasan:
     *                       type: string
     *                       example: Why kenapa tuh bintang star 3
     *                     dibalas pada:
     *                       type: string
     *                       format: date-time
     *                     created_at:
     *                       type: string
     *                       format: date-time
     *                     updated_at:
     *                       type: string
     *                       format: date-time
     *       400:
     *         description: Validasi gagal
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
     *                   oneOf:
     *                     - example: Ulasan tidak ditemukan
     *                     - example: Kamu bukan pemilik layanan, tidak bisa membalas ulasan ini
     *                     - example: Ulasan ini sudah memiliki balasan
     *                     - example: Balasan minimal 5 karakter
     *       401:
     *         description: Unauthorized
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
     *                   example: Unauthorized
     */
    router.post('/:id/reply', authMiddleware, (req, res) => reviewController.replyToReview(req, res));

     /**
   * @swagger
   * /api/reviews{id}:
   *   put:
   *     tags: [Reviews]
   *     summary: Update review
   *     description: Mengupdate ulasan yang pernah dibuat
   *     parameters:
   *       - in: path
   *         name: ulasanID
   *         required: true
   *         schema:
   *           type: string
   *         description: ID Ulasan
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rating
   *               - komentar
   *             properties:
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 example: 3
   *               komentar:
   *                 type: string
   *                 minLength: 10
   *                 example: lebih baik better lha yah
   *     responses:
   *       200:
   *         description: Ulasan berhasil diperbarui
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
   *                   example: Ulasan berhasil diperbarui
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       format: uuid
   *                     is_approved:
   *                       type: boolean
   *                       example: true
   *                     is_reported:
   *                       type: boolean
   *                       example: false
   *                     pesanan_id:
   *                       type: string
   *                       format: uuid
   *                     layanan_id:
   *                       type: string
   *                       format: uuid
   *                     pemberi_ulasan_id:
   *                       type: string
   *                       format: uuid
   *                     penerima_ulasan_id:
   *                       type: string
   *                       format: uuid
   *                     rating:
   *                       type: integer
   *                       example: 3
   *                     komentar:
   *                       type: string
   *                       example: lebih baik better lha yah
   *                     created_at:
   *                       type: string
   *                       format: date-time
   *                     updated_at:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Validasi gagal
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
   *                   oneOf:
   *                     - example: Ulasan tidak ditemukan
   *                     - example: Tidak punya izin untuk mengubah ulasan ini
   *                     - example: Rating harus antara 1 dan 5
   *                     - example: Komentar ulasan minimal 5 karakter
   *       401:
   *         description: Unauthorized
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
   *                   example: Unauthorized
   */
    router.put('/:id', authMiddleware, (req, res) => reviewController.updateReview(req, res));

    /**
     * @swagger
     * /api/reviews/{id}:
     *   delete:
     *     tags: [Reviews]
     *     summary: Delete review
     *     description: Menghapus ulasan yang melanggar (khusus admin)
     *     parameters:
     *       - in: path
     *         name: ulasanId
     *         required: true
     *         schema:
     *           type: string
     *         description: ID Ulasan
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Ulasan berhasil dihapus
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
     *                   example: Ulasan berhasil dihapus
     *       401:
     *         description: Unauthorized
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
     *                   example: Unauthorized
     */
    router.delete('/:id', authMiddleware, (req, res) => reviewController.deleteReview(req, res));

  return router;
};
