/**
 * Interface for Admin Dashboard Repository
 * Defines contract for data access operations related to admin dashboard
 */
class IAdminDashboardRepository {
    /**
     * Get recommendation statistics with chart data
     * @param {string} timeRange - Time range: 'daily', 'weekly', 'monthly'
     * @returns {Promise<Object>} Recommendation statistics
     */
    async getRecommendationStatistics(timeRange) {
        throw new Error('Method getRecommendationStatistics() must be implemented');
    }

    /**
     * Get transaction statistics with chart data
     * @param {string} timeRange - Time range: 'daily', 'weekly', 'monthly'
     * @returns {Promise<Object>} Transaction statistics
     */
    async getTransactionStatistics(timeRange) {
        throw new Error('Method getTransactionStatistics() must be implemented');
    }

    /**
     * Get recent transactions
     * @param {number} limit - Number of transactions to retrieve
     * @returns {Promise<Array>} Array of recent transactions
     */
    async getRecentTransactions(limit) {
        throw new Error('Method getRecentTransactions() must be implemented');
    }

    /**
     * Get favorites statistics with chart data
     * @param {string} timeRange - Time range: 'daily', 'weekly', 'monthly'
     * @returns {Promise<Object>} Favorites statistics
     */
    async getFavoritesStatistics(timeRange) {
        throw new Error('Method getFavoritesStatistics() must be implemented');
    }

    /**
     * Get favorites count by service
     * @param {number} limit - Number of services to retrieve
     * @returns {Promise<Array>} Array of services with favorite counts
     */
    async getFavoritesByService(limit) {
        throw new Error('Method getFavoritesByService() must be implemented');
    }

    /**
     * Get top recommended services
     * @param {number} limit - Number of services to retrieve
     * @param {string} timeRange - Time range: 'daily', 'weekly', 'monthly'
     * @returns {Promise<Array>} Array of top recommended services
     */
    async getTopRecommendedServices(limit, timeRange) {
        throw new Error('Method getTopRecommendedServices() must be implemented');
    }

    /**
     * Get activity type breakdown
     * @param {string} timeRange - Time range: 'daily', 'weekly', 'monthly'
     * @returns {Promise<Array>} Array of activity types with counts
     */
    async getActivityTypeBreakdown(timeRange) {
        throw new Error('Method getActivityTypeBreakdown() must be implemented');
    }
}

module.exports = IAdminDashboardRepository;