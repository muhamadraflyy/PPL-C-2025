/**
 * Use Case: Manage Hidden Services
 * Business logic untuk mengelola layanan yang disembunyikan user
 * 
 * UC-04: Menyembunyikan Layanan Rekomendasi
 * UC-05: Membuka Layanan Rekomendasi yang Disembunyikan
 * UC-06: Menghapus Layanan dari Daftar Tersembunyi
 */
class ManageHiddenServicesUseCase {
    constructor(hiddenServiceRepository, recommendationRepository, cacheService) {
        this.hiddenServiceRepository = hiddenServiceRepository;
        this.recommendationRepository = recommendationRepository;
        this.cacheService = cacheService;
    }

    /**
     * Hide service from recommendations
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @returns {Promise<Object>} Result with hidden service data
     */
    async hideService(userId, serviceId) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('HIDE SERVICE - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);
            console.log('serviceId:', serviceId);

            // Validate inputs
            if (!userId || !serviceId) {
                console.error('Missing required fields');
                return {
                    success: false,
                    error: 'User ID and Service ID are required'
                };
            }

            // Check if already hidden
            console.log('\nChecking if already hidden...');
            const isHidden = await this.hiddenServiceRepository.isHidden(userId, serviceId);

            if (isHidden) {
                console.warn('Service already hidden');
                return {
                    success: false,
                    error: 'Service is already hidden from recommendations'
                };
            }
            console.log('Not hidden yet');

            // Hide the service
            console.log('\nHiding service...');
            const hidden = await this.hiddenServiceRepository.hideService(userId, serviceId);
            console.log('Service hidden:', hidden.id);

            // Track interaction for analytics
            console.log('\nTracking hide interaction...');
            await this.recommendationRepository.trackInteraction(
                userId,
                serviceId,
                'hide',
                -5,
                { action: 'hide_service' }
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
                data: hidden.toJSON(),
                message: 'Service hidden from recommendations successfully',
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
     * Get all hidden services for user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Result with hidden services
     */
    async getHiddenServices(userId) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('GET HIDDEN SERVICES - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);

            // Validate input
            if (!userId) {
                console.error('Missing userId');
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }

            console.log('\nFetching hidden services from database...');
            const hiddenServices = await this.hiddenServiceRepository.getHiddenServices(userId);
            console.log('Found', hiddenServices.length, 'hidden services');

            console.log('='.repeat(80));
            console.log('COMPLETE');
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: hiddenServices.map(hs => hs.toJSON()),
                metadata: {
                    total: hiddenServices.length,
                    userId,
                    timestamp: new Date()
                }
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
     * Unhide service (remove from hidden list)
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @returns {Promise<Object>} Result
     */
    async unhideService(userId, serviceId) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('UNHIDE SERVICE - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);
            console.log('serviceId:', serviceId);

            // Validate inputs
            if (!userId || !serviceId) {
                console.error('Missing required fields');
                return {
                    success: false,
                    error: 'User ID and Service ID are required'
                };
            }

            // Get hidden service data before deleting
            console.log('\nGetting hidden service data...');
            const hiddenServiceData = await this.hiddenServiceRepository.getHiddenServiceData(userId, serviceId);

            if (!hiddenServiceData) {
                console.warn('Service is not hidden');
                return {
                    success: false,
                    error: 'Service is not in hidden list'
                };
            }
            console.log('Found hidden service data');

            // Unhide the service
            console.log('\nUnhiding service...');
            const removed = await this.hiddenServiceRepository.unhideService(userId, serviceId);

            if (!removed) {
                console.warn('Failed to unhide service');
                return {
                    success: false,
                    error: 'Failed to unhide service'
                };
            }
            console.log('Service unhidden successfully');

            console.log('\nClearing recommendation cache...');
            await this.cacheService.clearCache(userId);
            console.log('Cache cleared. Will regenerate on next request.');

            console.log('\n' + '='.repeat(80));
            console.log('COMPLETE');
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: hiddenServiceData.toJSON(),
                message: 'Service unhidden successfully. It will appear in recommendations again.',
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
}

module.exports = ManageHiddenServicesUseCase;