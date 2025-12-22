const RecommendationService = require('../../domain/services/RecommendationService');
const RecommendationRepositoryImpl = require('../../infrastructure/repositories/RecommendationRepositoryImpl');
const HiddenServiceRepositoryImpl = require('../../infrastructure/repositories/HiddenServiceRepositoryImpl');
const AdminDashboardRepositoryImpl = require('../../infrastructure/repositories/AdminDashboardRepositoryImpl');
const GetRecommendationsUseCase = require('../../application/use-cases/GetRecommendationsUseCase');
const GetSimilarServicesUseCase = require('../../application/use-cases/GetSimilarServicesUseCase');
const GetPopularServicesUseCase = require('../../application/use-cases/GetPopularServicesUseCase');
const TrackInteractionUseCase = require('../../application/use-cases/TrackInteractionUseCase');
const ManageHiddenServicesUseCase = require('../../application/use-cases/ManageHiddenServicesUseCase');
const GetAdminDashboardUseCase = require('../../application/use-cases/GetAdminDashboardUseCase');
const RecommendationCacheService = require('../../domain/services/RecommendationCacheService');

const {
  GetRecommendationsDTO,
  GetSimilarServicesDTO,
  GetPopularServicesDTO,
  TrackInteractionDTO,
  HideServiceDTO,
  UnhideServiceDTO,
  GetHiddenServicesDTO
} = require('../../application/dtos/RecommendationDTOs');

/**
 * Controller untuk menangani request terkait Recommendations
 * Compatible dengan pattern instantiasi di server.js
 */
class RecommendationController {
  constructor(sequelize) {
    // Initialize dependencies
    console.log('[RecommendationController] Initializing with sequelize:', !!sequelize);
    this.sequelize = sequelize;

    // Initialize repositories
    this.recommendationRepository = new RecommendationRepositoryImpl(sequelize);
    this.hiddenServiceRepository = new HiddenServiceRepositoryImpl(sequelize);
    this.adminDashboardRepository = new AdminDashboardRepositoryImpl(sequelize);

    // Initialize services
    this.recommendationService = new RecommendationService();
    this.cacheService = new RecommendationCacheService(sequelize);

    // Initialize use cases
    this.getRecommendationsUseCase = new GetRecommendationsUseCase(
      this.recommendationRepository,
      this.recommendationService,
      this.cacheService
    );

    this.getSimilarServicesUseCase = new GetSimilarServicesUseCase(
      this.recommendationRepository,
      this.recommendationService
    );

    this.getPopularServicesUseCase = new GetPopularServicesUseCase(
      this.recommendationRepository,
      this.recommendationService
    );

    this.trackInteractionUseCase = new TrackInteractionUseCase(
      this.recommendationRepository,
      this.cacheService
    );

    this.manageHiddenServicesUseCase = new ManageHiddenServicesUseCase(
      this.hiddenServiceRepository,
      this.recommendationRepository,
      this.cacheService
    );

    this.getAdminDashboardUseCase = new GetAdminDashboardUseCase(
      this.adminDashboardRepository
    );
  }

  /**
   * GET /api/recommendations
   * Get personalized recommendations for user
   */
  async getRecommendations(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('API ENDPOINT: GET /api/recommendations');
      console.log('='.repeat(80));

      // Get userId from authenticated user
      const userId = req.user?.userId || req.query.userId;

      // Get kategoriId from query params (optional)
      const kategoriId = req.query.kategoriId || null;

      console.log('Request from user:', userId);
      console.log('Category filter:', kategoriId || 'NONE (all categories)');

      // Validate userId
      if (!userId) {
        console.error('No userId provided');
        return res.status(401).json({
          success: false,
          message: 'User authentication required. Please login first.',
          error: 'User ID is required'
        });
      }

      // Validate kategoriId format if provided
      if (kategoriId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(kategoriId)) {
          console.error('Invalid kategoriId format');
          return res.status(400).json({
            success: false,
            message: 'Invalid category ID format',
            error: 'Category ID must be a valid UUID'
          });
        }
      }

      // Execute use case
      console.log('\nCalling GetRecommendationsUseCase...');
      const result = await this.getRecommendationsUseCase.execute(
        userId,
        kategoriId
      );

      if (!result.success) {
        console.error('Use case returned error:', result.error);
        return res.status(400).json({
          success: false,
          message: 'Failed to get recommendations',
          error: result.error
        });
      }

      console.log('\nSuccess! Returning', result.data.length, 'recommendations');
      console.log('='.repeat(80) + '\n');

      return res.status(200).json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data: result.data,
        metadata: result.metadata
      });

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('CONTROLLER ERROR');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('='.repeat(80) + '\n');

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while fetching recommendations'
      });
    }
  }

  /**
   * GET /api/recommendations/similar/:serviceId
   * Get similar services
   */
  async getSimilarServices(req, res) {
    try {
      const { serviceId } = req.params;

      const dto = new GetSimilarServicesDTO({
        serviceId,
        limit: parseInt(req.query.limit) || 5,
        excludeServiceIds: req.query.exclude ? req.query.exclude.split(',') : []
      });

      const result = await this.getSimilarServicesUseCase.execute(dto.serviceId, {
        limit: dto.limit,
        excludeServiceIds: dto.excludeServiceIds
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Similar services retrieved successfully',
        data: result.data,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('RecommendationController.getSimilarServices Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/recommendations/popular
   * Get popular services
   */
  async getPopularServices(req, res) {
    try {
      const dto = new GetPopularServicesDTO({
        limit: parseInt(req.query.limit) || 10,
        timeRange: req.query.timeRange || '7d',
        category: req.query.category || null,
        excludeServiceIds: req.query.exclude ? req.query.exclude.split(',') : []
      });

      const result = await this.getPopularServicesUseCase.execute({
        limit: dto.limit,
        timeRange: dto.timeRange,
        category: dto.category,
        excludeServiceIds: dto.excludeServiceIds
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Popular services retrieved successfully',
        data: result.data,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('RecommendationController.getPopularServices Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * POST /api/recommendations/interactions
   * Menyimpan interaksi view/click ke database
   */
  async trackInteraction(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('API: POST /api/recommendations/interactions/:serviceId');
      console.log('='.repeat(80));

      const userId = req.user?.userId;
      let { serviceId } = req.params;
      const { interactionType } = req.body; // 'view' atau 'click'

      console.log('Request from user:', userId);
      console.log('Service ID:', serviceId);
      console.log('Interaction Type:', interactionType || 'view (default)');

      // VALIDASI userId
      if (!userId) {
        console.error('No userId');
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // VALIDASI serviceId
      if (!serviceId) {
        console.error('No serviceId');
        return res.status(400).json({
          success: false,
          message: 'Service ID is required'
        });
      }

      // Trim whitespace
      serviceId = serviceId.trim();

      // VALIDASI format UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(serviceId)) {
        console.error('Invalid UUID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid service ID format. Must be a valid UUID.'
        });
      }

      // VALIDASI interactionType (default = 'view')
      const type = interactionType || 'view';
      const validTypes = ['view', 'click'];

      if (!validTypes.includes(type)) {
        console.error('Invalid interaction type');
        return res.status(400).json({
          success: false,
          message: "Interaction type must be 'view' or 'click'"
        });
      }

      // VALIDASI: Cek apakah layanan exists
      console.log('\nValidating service existence...');
      const [service] = await this.sequelize.query(`
            SELECT id, judul, status, jumlah_dilihat 
            FROM layanan 
            WHERE id = :serviceId 
            LIMIT 1
        `, {
        replacements: { serviceId },
        type: this.sequelize.QueryTypes.SELECT
      });

      if (!service) {
        console.error('Service not found in database');
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      if (service.status !== 'aktif') {
        console.error('Service is not active');
        return res.status(400).json({
          success: false,
          message: 'Service is not active'
        });
      }

      console.log('Service exists:', service.judul);
      console.log('Current view count:', service.jumlah_dilihat);

      // Call use case
      console.log('\nCalling TrackInteractionUseCase.saveInteraction()...');
      const result = await this.trackInteractionUseCase.saveInteraction(
        userId,
        serviceId,
        type,
        req.body.metadata || {}
      );

      if (!result.success) {
        console.error('Use case returned error:', result.error);
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      console.log('\nSuccess!');
      console.log('New view count:', result.data.newViewCount);
      console.log('='.repeat(80) + '\n');

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('CONTROLLER ERROR');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('='.repeat(80) + '\n');

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      });
    }
  }

  /**
   * GET /api/recommendations/track
   * Menampilkan layanan yang user lihat + berapa kali
   */
  async getInteractionHistory(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('API: GET /api/recommendations/track');
      console.log('='.repeat(80));

      const userId = req.user?.userId || req.query.userId;

      console.log('Request from user:', userId);

      // VALIDASI userId
      if (!userId) {
        console.error('No userId');
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Call use case
      console.log('\nCalling TrackInteractionUseCase.getViewHistory()...');
      const result = await this.trackInteractionUseCase.getViewHistory(userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      console.log('\nSuccess! Found', result.data.length, 'services');
      console.log('='.repeat(80) + '\n');

      return res.status(200).json({
        success: true,
        message: 'View history retrieved successfully',
        data: result.data,
        metadata: result.metadata
      });

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('CONTROLLER ERROR');
      console.error('Error:', error.message);
      console.error('='.repeat(80) + '\n');

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      });
    }
  }

  /**
   * POST /api/recommendations/hide/:serviceId
   * Hide service from recommendations
   */
  async hideService(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('API: POST /api/recommendations/hide/:serviceId');
      console.log('='.repeat(80));

      const userId = req.user?.userId;
      let { serviceId } = req.params;

      console.log('Request from user:', userId);
      console.log('Service to hide:', serviceId);

      // VALIDASI userId
      if (!userId) {
        console.error('No userId');
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // VALIDASI serviceId
      if (!serviceId) {
        console.error('No serviceId');
        return res.status(400).json({
          success: false,
          message: 'Service ID is required'
        });
      }

      // Trim whitespace
      serviceId = serviceId.trim();

      // VALIDASI format UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(serviceId)) {
        console.error('Invalid UUID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid service ID format. Must be a valid UUID.'
        });
      }

      // VALIDASI: Cek apakah layanan exists
      console.log('\nValidating service existence...');
      const [service] = await this.sequelize.query(`
        SELECT id, judul, status 
        FROM layanan 
        WHERE id = :serviceId 
        LIMIT 1
      `, {
        replacements: { serviceId },
        type: this.sequelize.QueryTypes.SELECT
      });

      if (!service) {
        console.error('Service not found in database');
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      console.log('Service exists:', service.judul);

      // Call use case
      console.log('\nCalling ManageHiddenServicesUseCase.hideService()...');
      const result = await this.manageHiddenServicesUseCase.hideService(
        userId,
        serviceId
      );

      if (!result.success) {
        console.warn('Use case returned error:', result.error);

        // Handle specific errors
        if (result.error?.includes('already hidden')) {
          return res.status(400).json({
            success: false,
            message: 'Service is already hidden from recommendations'
          });
        }

        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      console.log('\nSuccess!');
      console.log('='.repeat(80) + '\n');

      return res.status(200).json({
        success: true,
        message: 'Service hidden from recommendations successfully',
        data: result.data
      });

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('CONTROLLER ERROR');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('='.repeat(80) + '\n');

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      });
    }
  }

  /**
   * DELETE /api/recommendations/hide/:serviceId
   * Unhide service (remove from hidden list)
   */
  async unhideService(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('API: DELETE /api/recommendations/hide/:serviceId');
      console.log('='.repeat(80));

      const userId = req.user?.userId;
      let { serviceId } = req.params;

      console.log('Request from user:', userId);
      console.log('Service to unhide:', serviceId);

      // VALIDASI userId
      if (!userId) {
        console.error('No userId');
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // VALIDASI serviceId
      if (!serviceId) {
        console.error('No serviceId');
        return res.status(400).json({
          success: false,
          message: 'Service ID is required'
        });
      }

      // Trim whitespace
      serviceId = serviceId.trim();

      // VALIDASI format UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(serviceId)) {
        console.error('Invalid UUID format');
        return res.status(400).json({
          success: false,
          message: 'Invalid service ID format'
        });
      }

      // Call use case
      console.log('\nCalling ManageHiddenServicesUseCase.unhideService()...');
      const result = await this.manageHiddenServicesUseCase.unhideService(
        userId,
        serviceId
      );

      if (!result.success) {
        console.warn('Use case returned error:', result.error);
        return res.status(404).json({
          success: false,
          message: result.error
        });
      }

      console.log('\nSuccess!');
      console.log('='.repeat(80) + '\n');

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('CONTROLLER ERROR');
      console.error('Error:', error.message);
      console.error('='.repeat(80) + '\n');

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      });
    }
  }

  /**
   * GET /api/recommendations/hidden
   * Get list of hidden services
   */
  async getHiddenServices(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('API: GET /api/recommendations/hidden');
      console.log('='.repeat(80));

      const userId = req.user?.userId || req.query.userId;

      console.log('Request from user:', userId);

      // VALIDASI userId
      if (!userId) {
        console.error('No userId');
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // Call use case
      console.log('\nCalling ManageHiddenServicesUseCase.getHiddenServices()...');
      const result = await this.manageHiddenServicesUseCase.getHiddenServices(userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      console.log('\nSuccess! Found', result.data.length, 'hidden services');
      console.log('='.repeat(80) + '\n');

      return res.status(200).json({
        success: true,
        message: 'Hidden services retrieved successfully',
        data: result.data,
        metadata: result.metadata
      });

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('CONTROLLER ERROR');
      console.error('Error:', error.message);
      console.error('='.repeat(80) + '\n');

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      });
    }
  }

  /**
   * GET /api/recommendations/admin/stats
   * Get recommendation statistics (ADMIN ONLY)
   */
  async getAdminDashboard(req, res) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log('API: GET /api/recommendations/admin/dashboard');
      console.log('='.repeat(80));

      // Get timeRange from query params (default: weekly)
      const timeRange = req.query.timeRange || 'weekly';

      console.log('Time Range:', timeRange);

      // Validate timeRange
      const validTimeRanges = ['daily', 'weekly', 'monthly'];
      if (!validTimeRanges.includes(timeRange)) {
        console.error('Invalid time range');
        return res.status(400).json({
          success: false,
          message: 'Invalid time range',
          error: `Time range must be one of: ${validTimeRanges.join(', ')}`
        });
      }

      // Call use case
      console.log('\nCalling GetAdminDashboardUseCase.execute()...');
      const result = await this.getAdminDashboardUseCase.execute(timeRange);

      if (!result.success) {
        console.error('Use case returned error:', result.error);
        return res.status(400).json({
          success: false,
          message: 'Failed to get dashboard data',
          error: result.error
        });
      }

      console.log('\nSuccess!');
      console.log('='.repeat(80) + '\n');

      return res.status(200).json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: result.data,
        metadata: result.metadata
      });

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('CONTROLLER ERROR');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('='.repeat(80) + '\n');

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
      });
    }
  }

  /**
   * GET /api/recommendations/admin/stats
   * Get recommendation statistics (ADMIN ONLY)
   */
  async getAdminStats(req, res) {
    try {
      const timeRange = req.query.timeRange || '7d';
      const startDate = this._getStartDate(timeRange);

      // 1. CTR (Click-Through Rate) - FIXED
      const ctrStats = await this.sequelize.query(`
        SELECT 
          COUNT(CASE WHEN tipe_aktivitas = 'lihat_layanan' THEN 1 END) as views,
          COUNT(CASE WHEN tipe_aktivitas IN ('tambah_favorit', 'buat_pesanan') THEN 1 END) as conversions,
          ROUND(
            (COUNT(CASE WHEN tipe_aktivitas IN ('tambah_favorit', 'buat_pesanan') THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN tipe_aktivitas = 'lihat_layanan' THEN 1 END), 0)), 2
          ) as ctr_percentage
        FROM aktivitas_user
        WHERE created_at >= :startDate
      `, {
        replacements: { startDate },
        type: this.sequelize.QueryTypes.SELECT
      });

      // 2. Most Recommended Services
      const topServices = await this.sequelize.query(`
        SELECT 
          l.id,
          l.judul as nama_layanan,
          k.nama as kategori,
          COUNT(DISTINCT au.user_id) as unique_views,
          COUNT(*) as total_interactions,
          COUNT(CASE WHEN au.tipe_aktivitas = 'tambah_favorit' THEN 1 END) as favorites,
          COUNT(CASE WHEN au.tipe_aktivitas = 'buat_pesanan' THEN 1 END) as orders
        FROM layanan l
        LEFT JOIN kategori k ON l.kategori_id = k.id
        LEFT JOIN aktivitas_user au ON l.id = au.layanan_id
        WHERE au.created_at >= :startDate
        GROUP BY l.id, l.judul, k.nama
        ORDER BY total_interactions DESC
        LIMIT 10
      `, {
        replacements: { startDate },
        type: this.sequelize.QueryTypes.SELECT
      });

      // 3. User Engagement Stats - FIXED: Separate queries
      const engagementCount = await this.sequelize.query(`
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_interactions
        FROM aktivitas_user
        WHERE created_at >= :startDate
      `, {
        replacements: { startDate },
        type: this.sequelize.QueryTypes.SELECT
      });

      const avgInteractions = await this.sequelize.query(`
        SELECT 
          AVG(interactions_per_user) as avg_interactions_per_user
        FROM (
          SELECT 
            user_id,
            COUNT(*) as interactions_per_user
          FROM aktivitas_user
          WHERE created_at >= :startDate
          GROUP BY user_id
        ) as subquery
      `, {
        replacements: { startDate },
        type: this.sequelize.QueryTypes.SELECT
      });

      const engagementStats = {
        active_users: engagementCount[0]?.active_users || 0,
        total_interactions: engagementCount[0]?.total_interactions || 0,
        avg_interactions_per_user: parseFloat(avgInteractions[0]?.avg_interactions_per_user || 0).toFixed(2)
      };

      // 4. Conversion Rate by Activity Type - FIXED: MySQL compatible
      const totalCount = await this.sequelize.query(`
        SELECT COUNT(*) as total
        FROM aktivitas_user
        WHERE created_at >= :startDate
      `, {
        replacements: { startDate },
        type: this.sequelize.QueryTypes.SELECT
      });

      const conversionByType = await this.sequelize.query(`
        SELECT 
          tipe_aktivitas,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / :total), 2) as percentage
        FROM aktivitas_user
        WHERE created_at >= :startDate
        GROUP BY tipe_aktivitas
        ORDER BY count DESC
      `, {
        replacements: {
          startDate,
          total: totalCount[0]?.total || 1
        },
        type: this.sequelize.QueryTypes.SELECT
      });

      return res.status(200).json({
        success: true,
        message: 'Admin statistics retrieved successfully',
        data: {
          timeRange,
          period: {
            start: startDate,
            end: new Date()
          },
          ctr: ctrStats[0] || { views: 0, conversions: 0, ctr_percentage: 0 },
          topServices: topServices || [],
          engagement: engagementStats,
          conversionByType: conversionByType || []
        }
      });
    } catch (error) {
      console.error('RecommendationController.getAdminStats Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * GET /api/recommendations/admin/performance
   * Get recommendation performance metrics
   */
  async getRecommendationPerformance(req, res) {
    try {
      const timeRange = req.query.timeRange || '7d';
      const startDate = this._getStartDate(timeRange);

      const performance = await this.sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_interactions,
          COUNT(CASE WHEN tipe_aktivitas = 'lihat_layanan' THEN 1 END) as views,
          COUNT(CASE WHEN tipe_aktivitas = 'tambah_favorit' THEN 1 END) as favorites,
          COUNT(CASE WHEN tipe_aktivitas = 'buat_pesanan' THEN 1 END) as orders,
          ROUND(
            (COUNT(CASE WHEN tipe_aktivitas = 'buat_pesanan' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN tipe_aktivitas = 'lihat_layanan' THEN 1 END), 0)), 2
          ) as conversion_rate
        FROM aktivitas_user
        WHERE created_at >= :startDate
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, {
        replacements: { startDate },
        type: this.sequelize.QueryTypes.SELECT
      });

      return res.status(200).json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: {
          timeRange,
          metrics: performance || []
        }
      });
    } catch (error) {
      console.error('RecommendationController.getRecommendationPerformance Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Helper method
  _getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'all':
        return new Date('2020-01-01');
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}

module.exports = RecommendationController;