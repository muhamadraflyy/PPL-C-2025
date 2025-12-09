/**
 * Interface for Hidden Service Repository
 * Defines contract for data access operations related to hidden services
 */
class IHiddenServiceRepository {
    /**
     * Hide a service from user's recommendations
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @returns {Promise<Object>} HiddenService entity
     */
    async hideService(userId, serviceId) {
        throw new Error('Method hideService() must be implemented');
    }

    /**
     * Unhide a service (remove from hidden list)
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @returns {Promise<boolean>} True if removed, false if not found
     */
    async unhideService(userId, serviceId) {
        throw new Error('Method unhideService() must be implemented');
    }

    /**
     * Get all hidden services for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of HiddenService entities
     */
    async getHiddenServices(userId) {
        throw new Error('Method getHiddenServices() must be implemented');
    }

    /**
     * Check if a service is hidden by user
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @returns {Promise<boolean>} True if hidden, false otherwise
     */
    async isHidden(userId, serviceId) {
        throw new Error('Method isHidden() must be implemented');
    }

    /**
     * Get hidden service IDs for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Array of service IDs
     */
    async getHiddenServiceIds(userId) {
        throw new Error('Method getHiddenServiceIds() must be implemented');
    }

    /**
     * Get hidden service data before unhiding
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @returns {Promise<Object>} HiddenService entity or null
     */
    async getHiddenServiceData(userId, serviceId) {
        throw new Error('Method getHiddenServiceData() must be implemented');
    }

    /**
     * Get count of hidden services for a user
     * @param {string} userId - User ID
     * @returns {Promise<number>} Count of hidden services
     */
    async getHiddenCount(userId) {
        throw new Error('Method getHiddenCount() must be implemented');
    }
}

module.exports = IHiddenServiceRepository;