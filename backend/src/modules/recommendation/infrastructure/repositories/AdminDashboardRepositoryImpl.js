const IAdminDashboardRepository = require('../../domain/repositories/IAdminDashboardRepository');

/**
 * Implementation of IAdminDashboardRepository using Sequelize
 * FIXED VERSION - MySQL Compatible
 */
class AdminDashboardRepositoryImpl extends IAdminDashboardRepository {
    constructor(sequelize) {
        super();
        this.sequelize = sequelize;
    }

    async getRecommendationStatistics(timeRange) {
        try {
            const startDate = this._getStartDate(timeRange);

            // Get chart data (daily breakdown)
            const chartData = await this.sequelize.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_interactions,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(CASE WHEN tipe_aktivitas = 'lihat_layanan' THEN 1 END) as views,
                    COUNT(CASE WHEN tipe_aktivitas = 'tambah_favorit' THEN 1 END) as favorites,
                    COUNT(CASE WHEN tipe_aktivitas = 'buat_pesanan' THEN 1 END) as orders
                FROM aktivitas_user
                WHERE created_at >= :startDate
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            // Get summary
            const [summary] = await this.sequelize.query(`
                SELECT 
                    COUNT(*) as total_interactions,
                    COUNT(DISTINCT user_id) as total_users,
                    COUNT(CASE WHEN tipe_aktivitas = 'lihat_layanan' THEN 1 END) as total_views,
                    COUNT(CASE WHEN tipe_aktivitas = 'tambah_favorit' THEN 1 END) as total_favorites,
                    COUNT(CASE WHEN tipe_aktivitas = 'buat_pesanan' THEN 1 END) as total_orders
                FROM aktivitas_user
                WHERE created_at >= :startDate
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            return {
                chart: chartData,
                summary: summary[0] || {
                    total_interactions: 0,
                    total_users: 0,
                    total_views: 0,
                    total_favorites: 0,
                    total_orders: 0
                }
            };
        } catch (error) {
            console.error('AdminDashboardRepository.getRecommendationStatistics Error:', error);
            throw new Error('Failed to get recommendation statistics: ' + error.message);
        }
    }

    async getTransactionStatistics(timeRange) {
        try {
            const startDate = this._getStartDate(timeRange);

            // Get chart data (daily breakdown)
            const chartData = await this.sequelize.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN status = 'selesai' THEN 1 END) as completed_orders,
                    COUNT(CASE WHEN status IN ('dibayar', 'dikerjakan') THEN 1 END) as in_progress_orders,
                    SUM(CASE WHEN status = 'selesai' THEN total_bayar ELSE 0 END) as total_revenue
                FROM pesanan
                WHERE created_at >= :startDate
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            // Get summary
            const [summary] = await this.sequelize.query(`
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN status = 'selesai' THEN 1 END) as completed_orders,
                    COUNT(CASE WHEN status IN ('dibayar', 'dikerjakan') THEN 1 END) as in_progress_orders,
                    COUNT(CASE WHEN status = 'dibatalkan' THEN 1 END) as cancelled_orders,
                    SUM(CASE WHEN status = 'selesai' THEN total_bayar ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = 'selesai' THEN total_bayar ELSE NULL END) as avg_order_value
                FROM pesanan
                WHERE created_at >= :startDate
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            return {
                chart: chartData,
                summary: summary[0] || {
                    total_orders: 0,
                    completed_orders: 0,
                    in_progress_orders: 0,
                    cancelled_orders: 0,
                    total_revenue: 0,
                    avg_order_value: 0
                }
            };
        } catch (error) {
            console.error('AdminDashboardRepository.getTransactionStatistics Error:', error);
            throw new Error('Failed to get transaction statistics: ' + error.message);
        }
    }

    async getRecentTransactions(limit = 10) {
        try {
            const transactions = await this.sequelize.query(`
                SELECT 
                    p.id,
                    p.nomor_pesanan,
                    p.judul as order_title,
                    p.total_bayar,
                    p.status,
                    p.created_at,
                    u_client.nama_depan as client_first_name,
                    u_client.nama_belakang as client_last_name,
                    u_freelancer.nama_depan as freelancer_first_name,
                    u_freelancer.nama_belakang as freelancer_last_name,
                    l.judul as service_name,
                    k.nama as category_name
                FROM pesanan p
                LEFT JOIN users u_client ON p.client_id = u_client.id
                LEFT JOIN users u_freelancer ON p.freelancer_id = u_freelancer.id
                LEFT JOIN layanan l ON p.layanan_id = l.id
                LEFT JOIN kategori k ON l.kategori_id = k.id
                ORDER BY p.created_at DESC
                LIMIT :limit
            `, {
                replacements: { limit },
                type: this.sequelize.QueryTypes.SELECT
            });

            return transactions.map(t => ({
                id: t.id,
                orderNumber: t.nomor_pesanan,
                orderTitle: t.order_title,
                totalAmount: parseFloat(t.total_bayar) || 0,
                status: t.status,
                createdAt: t.created_at,
                client: {
                    firstName: t.client_first_name,
                    lastName: t.client_last_name,
                    fullName: `${t.client_first_name || ''} ${t.client_last_name || ''}`.trim()
                },
                freelancer: {
                    firstName: t.freelancer_first_name,
                    lastName: t.freelancer_last_name,
                    fullName: `${t.freelancer_first_name || ''} ${t.freelancer_last_name || ''}`.trim()
                },
                service: {
                    name: t.service_name,
                    category: t.category_name
                }
            }));
        } catch (error) {
            console.error('AdminDashboardRepository.getRecentTransactions Error:', error);
            throw new Error('Failed to get recent transactions: ' + error.message);
        }
    }

    async getFavoritesStatistics(timeRange) {
        try {
            const startDate = this._getStartDate(timeRange);

            // Get chart data (daily breakdown)
            const chartData = await this.sequelize.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_favorites,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT layanan_id) as unique_services
                FROM favorit
                WHERE created_at >= :startDate
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            // Get summary - FIXED: Removed nested subquery
            const summaryResults = await this.sequelize.query(`
                SELECT 
                    COUNT(*) as total_favorites,
                    COUNT(DISTINCT user_id) as total_users,
                    COUNT(DISTINCT layanan_id) as total_services
                FROM favorit
                WHERE created_at >= :startDate
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            // Calculate average favorites per user separately
            const avgResults = await this.sequelize.query(`
                SELECT 
                    AVG(favorites_per_user) as avg_favorites_per_user
                FROM (
                    SELECT user_id, COUNT(*) as favorites_per_user
                    FROM favorit
                    WHERE created_at >= :startDate
                    GROUP BY user_id
                ) as subquery
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            const summary = {
                total_favorites: summaryResults[0]?.total_favorites || 0,
                total_users: summaryResults[0]?.total_users || 0,
                total_services: summaryResults[0]?.total_services || 0,
                avg_favorites_per_user: parseFloat(avgResults[0]?.avg_favorites_per_user || 0).toFixed(2)
            };

            return {
                chart: chartData,
                summary
            };
        } catch (error) {
            console.error('AdminDashboardRepository.getFavoritesStatistics Error:', error);
            throw new Error('Failed to get favorites statistics: ' + error.message);
        }
    }

    async getFavoritesByService(limit = 10) {
        try {
            const favorites = await this.sequelize.query(`
                SELECT 
                    l.id as service_id,
                    l.judul as service_name,
                    k.nama as category_name,
                    COUNT(*) as favorite_count,
                    COUNT(DISTINCT f.user_id) as unique_users
                FROM favorit f
                LEFT JOIN layanan l ON f.layanan_id = l.id
                LEFT JOIN kategori k ON l.kategori_id = k.id
                GROUP BY l.id, l.judul, k.nama
                ORDER BY favorite_count DESC
                LIMIT :limit
            `, {
                replacements: { limit },
                type: this.sequelize.QueryTypes.SELECT
            });

            return favorites.map(f => ({
                serviceId: f.service_id,
                serviceName: f.service_name,
                categoryName: f.category_name,
                favoriteCount: parseInt(f.favorite_count) || 0,
                uniqueUsers: parseInt(f.unique_users) || 0
            }));
        } catch (error) {
            console.error('AdminDashboardRepository.getFavoritesByService Error:', error);
            throw new Error('Failed to get favorites by service: ' + error.message);
        }
    }

    async getTopRecommendedServices(limit = 10, timeRange = 'weekly') {
        try {
            const startDate = this._getStartDate(timeRange);

            const topServices = await this.sequelize.query(`
                SELECT 
                    l.id as service_id,
                    l.judul as service_name,
                    k.nama as category_name,
                    COUNT(DISTINCT CASE WHEN au.tipe_aktivitas = 'lihat_layanan' THEN au.user_id END) as unique_views,
                    COUNT(CASE WHEN au.tipe_aktivitas = 'lihat_layanan' THEN 1 END) as total_views,
                    COUNT(CASE WHEN au.tipe_aktivitas = 'tambah_favorit' THEN 1 END) as total_favorites,
                    COUNT(CASE WHEN au.tipe_aktivitas = 'buat_pesanan' THEN 1 END) as total_orders,
                    COALESCE(AVG(u.rating), 0) as avg_rating,
                    COUNT(DISTINCT u.id) as total_reviews
                FROM layanan l
                LEFT JOIN kategori k ON l.kategori_id = k.id
                LEFT JOIN aktivitas_user au ON l.id = au.layanan_id AND au.created_at >= :startDate
                LEFT JOIN ulasan u ON l.id = u.layanan_id
                WHERE l.status = 'aktif'
                GROUP BY l.id, l.judul, k.nama
                ORDER BY unique_views DESC, total_favorites DESC, total_orders DESC
                LIMIT :limit
            `, {
                replacements: { limit, startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            return topServices.map(s => ({
                serviceId: s.service_id,
                serviceName: s.service_name,
                categoryName: s.category_name,
                uniqueViews: parseInt(s.unique_views) || 0,
                totalViews: parseInt(s.total_views) || 0,
                totalFavorites: parseInt(s.total_favorites) || 0,
                totalOrders: parseInt(s.total_orders) || 0,
                avgRating: parseFloat(s.avg_rating) || 0,
                totalReviews: parseInt(s.total_reviews) || 0,
                engagementScore: this._calculateEngagementScore(s)
            }));
        } catch (error) {
            console.error('AdminDashboardRepository.getTopRecommendedServices Error:', error);
            throw new Error('Failed to get top recommended services: ' + error.message);
        }
    }

    async getActivityTypeBreakdown(timeRange) {
        try {
            const startDate = this._getStartDate(timeRange);

            // FIXED: MySQL compatible percentage calculation
            const breakdown = await this.sequelize.query(`
                SELECT 
                    tipe_aktivitas,
                    COUNT(*) as count,
                    COUNT(DISTINCT user_id) as unique_users,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM aktivitas_user WHERE created_at >= :startDate)), 2) as percentage
                FROM aktivitas_user
                WHERE created_at >= :startDate
                GROUP BY tipe_aktivitas
                ORDER BY count DESC
            `, {
                replacements: { startDate },
                type: this.sequelize.QueryTypes.SELECT
            });

            return breakdown.map(b => ({
                activityType: b.tipe_aktivitas,
                count: parseInt(b.count) || 0,
                uniqueUsers: parseInt(b.unique_users) || 0,
                percentage: parseFloat(b.percentage) || 0
            }));
        } catch (error) {
            console.error('AdminDashboardRepository.getActivityTypeBreakdown Error:', error);
            throw new Error('Failed to get activity type breakdown: ' + error.message);
        }
    }

    // Helper methods
    _getStartDate(timeRange) {
        const now = new Date();
        switch (timeRange) {
            case 'daily':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'weekly':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'monthly':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    }

    _calculateEngagementScore(service) {
        const views = parseInt(service.unique_views) || 0;
        const favorites = parseInt(service.total_favorites) || 0;
        const orders = parseInt(service.total_orders) || 0;
        const rating = parseFloat(service.avg_rating) || 0;

        return Math.round(
            views * 0.2 +
            favorites * 0.3 +
            orders * 0.4 +
            rating * 2
        );
    }
}

module.exports = AdminDashboardRepositoryImpl;