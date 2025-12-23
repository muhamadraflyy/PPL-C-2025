const FavoriteRepositoryImpl = require('../../infrastructure/repositories/FavoriteRepositoryImpl');
const RecommendationRepositoryImpl = require('../../infrastructure/repositories/RecommendationRepositoryImpl');
const ManageFavoritesUseCase = require('../../application/use-cases/ManageFavoritesUseCase');

const {
    AddFavoriteDTO,
    RemoveFavoriteDTO,
    GetFavoritesDTO
} = require('../../application/dtos/RecommendationDTOs');

/**
 * Controller untuk menangani request terkait Favorites
 * Compatible dengan pattern instantiasi di server.js
 */
class FavoriteController {
    constructor(sequelize) {
        // Initialize dependencies
        this.sequelize = sequelize;
        this.favoriteRepository = new FavoriteRepositoryImpl(sequelize);
        this.recommendationRepository = new RecommendationRepositoryImpl(sequelize);

        // Initialize use case
        this.manageFavoritesUseCase = new ManageFavoritesUseCase(
            this.favoriteRepository,
            this.recommendationRepository
        );
    }

    /**
     * POST /api/recommendations/favorites/:serviceId
     * Add service to favorites
     */
    async addFavorite(req, res) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('API: POST /api/recommendations/favorites/:serviceId');
            console.log('='.repeat(80));

            const userId = req.user?.userId || req.body.userId;
            let { serviceId } = req.params;

            console.log('Request from user:', userId);
            console.log('Service to favorite:', serviceId);

            // VALIDASI userId
            if (!userId) {
                console.error('No userId');
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required. Please login first.'
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

            // VALIDASI: Cek apakah layanan exists di database
            console.log('\n→ Validating service existence...');
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

            // Check if service is active
            if (service.status !== 'aktif') {
                console.warn('Service is not active:', service.status);
                return res.status(400).json({
                    success: false,
                    message: 'Service is not active'
                });
            }

            console.log('Service exists:', service.judul);

            // Call use case
            console.log('\n→ Calling ManageFavoritesUseCase.addFavorite()...');
            const result = await this.manageFavoritesUseCase.addFavorite(
                userId,
                serviceId,
                req.body.notes || ''
            );

            if (!result.success) {
                console.warn('Use case returned error:', result.error);

                // Handle specific errors
                if (result.error?.includes('already in favorites')) {
                    return res.status(400).json({
                        success: false,
                        message: 'Service already in favorites'
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
                message: 'Service added to favorites successfully',
                data: result.data
            });

        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('CONTROLLER ERROR');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.error('='.repeat(80) + '\n');

            // Handle Sequelize specific errors
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid service ID or user ID'
                });
            }

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({
                    success: false,
                    message: 'Service already in favorites'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
            });
        }
    }

    /**
     * DELETE /api/recommendations/favorites/:serviceId
     * Remove service from favorites
     */
    async removeFavorite(req, res) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('API: DELETE /api/recommendations/favorites/:serviceId');
            console.log('='.repeat(80));

            const userId = req.user?.userId || req.query.userId;
            let { serviceId } = req.params;

            console.log('Request from user:', userId);
            console.log('Service to unfavorite:', serviceId);

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
            console.log('\n→ Calling ManageFavoritesUseCase.removeFavorite()...');
            const result = await this.manageFavoritesUseCase.removeFavorite(
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
                message: 'Service removed from favorites successfully'
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
     * GET /api/recommendations/favorites
     * Get user's favorite services
     */
    async getFavorites(req, res) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('API: GET /api/recommendations/favorites');
            console.log('='.repeat(80));

            const userId = req.user?.userId || req.query.userId;

            console.log('Request from user:', userId);

            if (!userId) {
                console.error('No userId');
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            console.log('\n→ Calling ManageFavoritesUseCase.getFavorites()...');
            const result = await this.manageFavoritesUseCase.getFavorites(userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            console.log('\nSuccess! Found', result.data.length, 'favorites');
            console.log('='.repeat(80) + '\n');

            return res.status(200).json({
                success: true,
                message: 'Favorites retrieved successfully',
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
}

module.exports = FavoriteController;