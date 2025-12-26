const CreateReview = require('../../application/use-cases/CreateReview');
const GetReviews = require('../../application/use-cases/GetReviews');
const UpdateReview = require('../../application/use-cases/UpdateReview');
const DeleteReview = require('../../application/use-cases/DeleteReview');
const ReportReview = require('../../application/use-cases/ReportReview');
const ReplyToReview = require('../../application/use-cases/ReplyToReview');

const SequelizeReviewRepository = require('../../infrastructure/repositories/SequelizeReviewRepository');
const OrderRepository = require('../../infrastructure/repositories/OrderRepository');
const ServiceRepository = require('../../infrastructure/repositories/ServiceRepository');
const ModerationService = require('../../infrastructure/services/ModerationService');

const initModels = require('../../infrastructure/models');

class ReviewController {
  constructor(sequelize, notificationService = null) {
    this.sequelize = sequelize;
    this.notificationService = notificationService;

    initModels(this.sequelize);

    // Repositories
    this.reviewRepository = new SequelizeReviewRepository(sequelize);
    this.orderRepository = new OrderRepository(sequelize);
    this.serviceRepository = new ServiceRepository(sequelize);
    this.moderationService = new ModerationService();

    // Use cases
    this.createReviewUseCase = new CreateReview(
      this.reviewRepository,
      this.orderRepository,
      this.serviceRepository,
      this.notificationService
    );

    this.getReviewsUseCase = new GetReviews(this.reviewRepository);
    this.updateReviewUseCase = new UpdateReview(
      this.reviewRepository,
      this.moderationService
    );
    this.deleteReviewUseCase = new DeleteReview(
      this.reviewRepository,
      this.serviceRepository
    );
    this.reportReviewUseCase = new ReportReview(
      this.reviewRepository,
      this.moderationService,
      this.notificationService
    );
    this.replyToReviewUseCase = new ReplyToReview(
      this.reviewRepository,
      this.notificationService
    );

    // BINDING SEMUA FUNGSI AGAR 'this' TIDAK HILANG
    this.createReview = this.createReview.bind(this);
    this.getMyReviews = this.getMyReviews.bind(this);
    this.getUserReviews = this.getUserReviews.bind(this);
    this.getServiceReviews = this.getServiceReviews.bind(this);
    this.getReviewsByFreelancer = this.getReviewsByFreelancer.bind(this);
    this.getLatestReviews = this.getLatestReviews.bind(this);
    this.updateReview = this.updateReview.bind(this);
    this.deleteReview = this.deleteReview.bind(this);
    this.reportReview = this.reportReview.bind(this);
    this.replyToReview = this.replyToReview.bind(this);
  }

  /** POST /api/reviews */
  async createReview(req, res) {
    try {
      const userId = req.user?.id;
      const payload = req.body || {};

      const data = await this.createReviewUseCase.execute(userId, payload);

      return res.status(201).json({
        success: true,
        message: 'Ulasan berhasil dibuat',
        data
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /** GET /api/reviews/my */
  async getMyReviews(req, res) {
    try {
      const userId = req.user?.id;
      const filters = req.query || {};

      const result = await this.getReviewsUseCase.byUser(userId, filters);

      const items = result.items || result.rows || result || [];
      const total = result.total ?? result.count ?? items.length;
      const page = Number(filters.page ?? 1);
      const limit = Number(filters.limit ?? 10);

      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil ulasan saya',
        data: { items, meta: { total, page, limit } }
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /** GET /api/reviews/user/:user_id */
  async getUserReviews(req, res) {
    try {
      const { user_id } = req.params;
      const filters = req.query || {};

      const result = await this.getReviewsUseCase.byUser(user_id, filters);

      const items = result.items || result.rows || result || [];
      const total = result.total ?? result.count ?? items.length;
      const page = Number(filters.page ?? 1);
      const limit = Number(filters.limit ?? 10);

      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil ulasan user',
        data: { items, meta: { total, page, limit } }
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /** GET /api/reviews/service/:layanan_id */
  async getServiceReviews(req, res) {
    try {
      const { layanan_id } = req.params;
      const filters = req.query || {};

      const result = await this.getReviewsUseCase.byService(layanan_id, filters);

      const items = result.items || result.rows || result || [];
      const total = result.total ?? result.count ?? items.length;
      const page = Number(filters.page ?? 1);
      const limit = Number(filters.limit ?? 2);

      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil ulasan layanan',
        data: { items, meta: { total, page, limit } }
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /** GET /api/reviews/freelancer/:id */
  // --- FUNGSI PINTAR: MENDETEKSI ID DARI BERBAGAI NAMA PARAMETER ---
  async getReviewsByFreelancer(req, res) {
    try {
      console.log("🔍 [DEBUG] Controller: getReviewsByFreelancer Dipanggil");
      console.log("🔍 [DEBUG] Params yang diterima:", req.params);

      // SOLUSI: Coba ambil ID dari berbagai kemungkinan key (id, freelancerId, user_id)
      const id = req.params.id || req.params.freelancerId || req.params.user_id || req.params.freelancer_id;

      console.log("🔍 [DEBUG] ID Freelancer Final yang digunakan:", id);

      // Validasi ID
      if (!id || id === 'undefined') {
        throw new Error(`ID Freelancer GAGAL ditangkap. Pastikan routes menggunakan parameter yang benar. Params diterima: ${JSON.stringify(req.params)}`);
      }

      const filters = req.query || {};

      // Cek apakah Use Case siap
      if (!this.getReviewsUseCase) {
        throw new Error("GetReviews UseCase belum diinisialisasi.");
      }

      // Cek apakah method byFreelancer ada
      let result;
      if (typeof this.getReviewsUseCase.byFreelancer === 'function') {
        result = await this.getReviewsUseCase.byFreelancer(id, filters);
      } else if (typeof this.getReviewsUseCase.byUser === 'function') {
        // Fallback: Jika byFreelancer tidak ada, coba pakai byUser
        console.log("⚠️ Method 'byFreelancer' tidak ada, mencoba fallback ke 'byUser'...");
        result = await this.getReviewsUseCase.byUser(id, filters);
      } else {
        throw new Error("Method untuk mengambil review tidak ditemukan di Use Case.");
      }

      const items = result.items || result.rows || result || [];
      const total = result.total ?? result.count ?? items.length;
      const page = Number(filters.page ?? 1);
      const limit = Number(filters.limit ?? 2);

      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil ulasan freelancer',
        data: {
          items,
          meta: { total, page, limit }
        }
      });

    } catch (error) {
      console.error("🔥 ERROR ASLI DI GET REVIEWS:", error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengambil data',
      });
    }
  }

  /** GET /api/reviews/latest */
  async getLatestReviews(req, res) {
    try {
      const limit = Number(req.query.limit ?? 5);
      const items = await this.getReviewsUseCase.latest(limit);

      return res.status(200).json({
        success: true,
        message: 'Berhasil mengambil ulasan terbaru',
        data: {
          items,
          meta: { total: items.length, limit }
        }
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /** PUT /api/reviews/:id */
  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const payload = req.body || {};

      const result = await this.updateReviewUseCase.execute(userId, id, payload);

      return res.status(200).json({
        success: true,
        message: 'Ulasan berhasil diperbarui',
        data: result.data || result
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /** DELETE /api/reviews/:id */
  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const isAdmin = req.user?.role === 'admin' || req.body?.isAdmin === true;

      await this.deleteReviewUseCase.execute(isAdmin, id);

      return res.status(200).json({
        success: true,
        message: 'Ulasan berhasil dihapus',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /** POST /api/reviews/:id/report */
  async reportReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body || {};

      await this.reportReviewUseCase.execute(userId, id, reason);

      return res.status(200).json({
        success: true,
        message: 'Ulasan berhasil dilaporkan',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /** POST /api/reviews/:id/reply */
  async replyToReview(req, res) {
    try {
      const reviewId = req.params.id;
      const sellerId = req.user?.id;
      const { reply } = req.body || {};

      const result = await this.replyToReviewUseCase.execute(reviewId, sellerId, reply);

      return res.status(200).json({
        success: true,
        message: 'Balasan ulasan berhasil dikirim',
        data: result.data || result
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = ReviewController;