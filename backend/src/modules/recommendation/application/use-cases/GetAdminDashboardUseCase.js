/**
 * Get Admin Dashboard
 * Membuka Halaman Dashboard Monitoring
 * 
 * Business logic untuk menampilkan:
 * - Grafik statistik rekomendasi yang sering digunakan
 * - Grafik total transaksi
 * - Tabel detail transaksi terakhir
 * - Grafik total favorit
 * - Tabel jumlah favorit
 * - Tabel Top 10 Layanan yang Paling Direkomendasikan
 * - Filter berdasarkan periode waktu (hari/minggu/bulan)
 */
class GetAdminDashboardUseCase {
    constructor(adminDashboardRepository) {
        this.adminDashboardRepository = adminDashboardRepository;
    }

    /**
     * Execute use case - Get dashboard data
     * @param {string} timeRange - Time range filter: 'daily', 'weekly', 'monthly'
     * @returns {Promise<Object>} Result with dashboard data
     */
    async execute(timeRange = 'weekly') {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('GET ADMIN DASHBOARD - START');
            console.log('='.repeat(80));
            console.log('Time Range:', timeRange);

            // Validate time range
            const validTimeRanges = ['daily', 'weekly', 'monthly'];
            if (!validTimeRanges.includes(timeRange)) {
                console.error('Invalid time range');
                return {
                    success: false,
                    error: `Invalid time range. Must be one of: ${validTimeRanges.join(', ')}`
                };
            }

            // STEP 1: Get recommendation statistics
            console.log('\nGetting recommendation statistics...');
            const recommendationStats = await this.adminDashboardRepository
                .getRecommendationStatistics(timeRange);
            console.log('Recommendation stats retrieved');

            // STEP 2: Get transaction statistics
            console.log('\nGetting transaction statistics...');
            const transactionStats = await this.adminDashboardRepository
                .getTransactionStatistics(timeRange);
            console.log('Transaction stats retrieved');

            // STEP 3: Get recent transactions
            console.log('\nGetting recent transactions...');
            const recentTransactions = await this.adminDashboardRepository
                .getRecentTransactions(10);
            console.log('Recent transactions retrieved:', recentTransactions.length);

            // STEP 4: Get favorites statistics
            console.log('\nGetting favorites statistics...');
            const favoritesStats = await this.adminDashboardRepository
                .getFavoritesStatistics(timeRange);
            console.log('Favorites stats retrieved');

            // STEP 5: Get favorites count by service
            console.log('\nGetting favorites count by service...');
            const favoritesByService = await this.adminDashboardRepository
                .getFavoritesByService(10);
            console.log('Favorites by service retrieved:', favoritesByService.length);

            // STEP 6: Get top 10 recommended services
            console.log('\nGetting top 10 recommended services...');
            const topRecommendedServices = await this.adminDashboardRepository
                .getTopRecommendedServices(10, timeRange);
            console.log('Top recommended services retrieved:', topRecommendedServices.length);

            // STEP 7: Get activity type breakdown
            console.log('\nGetting activity type breakdown...');
            const activityBreakdown = await this.adminDashboardRepository
                .getActivityTypeBreakdown(timeRange);
            console.log('Activity breakdown retrieved');

            console.log('\n' + '='.repeat(80));
            console.log('COMPLETE');
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: {
                    timeRange,
                    period: this._getPeriodInfo(timeRange),

                    // Grafik statistik rekomendasi
                    recommendationStats: {
                        chart: recommendationStats.chart,
                        summary: recommendationStats.summary
                    },

                    // Grafik total transaksi
                    transactionStats: {
                        chart: transactionStats.chart,
                        summary: transactionStats.summary
                    },

                    // Tabel detail transaksi terakhir
                    recentTransactions,

                    // Grafik total favorit
                    favoritesStats: {
                        chart: favoritesStats.chart,
                        summary: favoritesStats.summary
                    },

                    // Tabel jumlah favorit per layanan
                    favoritesByService,

                    // Tabel Top 10 Layanan yang Paling Direkomendasikan
                    topRecommendedServices,

                    // Activity breakdown (pie chart data)
                    activityBreakdown
                },
                metadata: {
                    generatedAt: new Date(),
                    timeRange,
                    description: 'Admin dashboard monitoring data'
                }
            };
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('ERROR');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.error('='.repeat(80) + '\n');

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get period information based on time range
     */
    _getPeriodInfo(timeRange) {
        const now = new Date();
        let startDate;

        switch (timeRange) {
            case 'daily':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'weekly':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return {
            startDate: startDate.toISOString(),
            endDate: now.toISOString(),
            days: Math.ceil((now - startDate) / (1000 * 60 * 60 * 24))
        };
    }
}

module.exports = GetAdminDashboardUseCase;