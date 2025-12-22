/**
 * Use Case: Manage Favorites
 * Business logic untuk mengelola favorit user (add, remove, get)
 */
class ManageFavoritesUseCase {
    constructor(favoriteRepository, recommendationRepository, cacheService) {
        this.favoriteRepository = favoriteRepository;
        this.recommendationRepository = recommendationRepository;
        this.cacheService = cacheService;
    }

    /**
     * Add service to favorites
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @param {string} notes - Optional notes
     * @returns {Promise<Object>} Result with favorite data
     */
    async addFavorite(userId, serviceId, notes = '') {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('ADD FAVORITE - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);
            console.log('serviceId:', serviceId);

            if (!userId || !serviceId) {
                console.error('Missing required fields');
                return {
                    success: false,
                    error: 'User ID and Service ID are required'
                };
            }

            console.log('\nChecking if already favorited...');
            const isFavorite = await this.favoriteRepository.isFavorite(userId, serviceId);

            if (isFavorite) {
                console.warn('Service already in favorites');
                return {
                    success: false,
                    error: 'Service already in favorites'
                };
            }
            console.log('Not favorited yet');

            console.log('\nAdding to favorites table...');
            const favorite = await this.favoriteRepository.addFavorite(userId, serviceId, notes);
            console.log('Added to favorites:', favorite.id);

            console.log('\nTracking interaction...');
            await this.recommendationRepository.trackInteraction(
                userId,
                serviceId,
                'like',
                5,
                { action: 'add_favorite', notes }
            );
            console.log('Interaction tracked');

            console.log('\nClearing recommendation cache...');
            await this.cacheService.clearCache(userId);
            console.log('Cache cleared. Will regenerate on next request.');

            console.log('\n' + '='.repeat(80));
            console.log('COMPLETE');
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: favorite.toJSON(),
                message: 'Service added to favorites successfully. Recommendations will be updated.',
                cacheCleared: true
            };
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('ERROR');
            console.error('Error:', error.message);
            console.error('='.repeat(80) + '\n');

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove service from favorites
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @returns {Promise<Object>} Result
     */
    async removeFavorite(userId, serviceId) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('REMOVE FAVORITE - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);
            console.log('serviceId:', serviceId);

            if (!userId || !serviceId) {
                console.error('Missing required fields');
                return {
                    success: false,
                    error: 'User ID and Service ID are required'
                };
            }

            console.log('\nRemoving from favorites table...');
            const removed = await this.favoriteRepository.removeFavorite(userId, serviceId);

            if (!removed) {
                console.warn('Favorite not found');
                return {
                    success: false,
                    error: 'Favorite not found'
                };
            }
            console.log('Removed from favorites');

            console.log('\nTracking interaction...');
            await this.recommendationRepository.trackInteraction(
                userId,
                serviceId,
                'unlike',
                -3,
                { action: 'remove_favorite' }
            );
            console.log('Interaction tracked');

            console.log('\nClearing recommendation cache...');
            await this.cacheService.clearCache(userId);
            console.log('Cache cleared. Will regenerate on next request.');

            console.log('\n' + '='.repeat(80));
            console.log('COMPLETE');
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                message: 'Service removed from favorites successfully. Recommendations will be updated.',
                cacheCleared: true
            };
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('ERROR');
            console.error('Error:', error.message);
            console.error('='.repeat(80) + '\n');

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all favorites for user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Result with favorites
     */
    async getFavorites(userId) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('GET FAVORITES - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);

            if (!userId) {
                console.error('Missing userId');
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }

            console.log('\nFetching favorites from database...');
            const favorites = await this.favoriteRepository.getFavorites(userId);
            console.log('Found', favorites.length, 'favorites');

            console.log('='.repeat(80));
            console.log('GET FAVORITES COMPLETE');
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: favorites.map(fav => fav.toJSON()),
                metadata: {
                    total: favorites.length,
                    userId,
                    timestamp: new Date()
                }
            };
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('GET FAVORITES ERROR');
            console.error('Error:', error.message);
            console.error('='.repeat(80) + '\n');

            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = ManageFavoritesUseCase;