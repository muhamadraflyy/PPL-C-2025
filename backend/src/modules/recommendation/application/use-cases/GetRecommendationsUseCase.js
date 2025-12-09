/**
 * Use Case: Get Personalized Recommendations
 * Melihat Layanan Rekomendasi dengan Filter Kategori
 * 
 * Flow:
 * 1. Analisis favorit user
 * 2. Analisis transaksi user
 * 3. Terapkan algoritma rekomendasi
 * 4. Tampilkan 10 layanan rekomendasi
 * 5. Support filter kategori
 */
class GetRecommendationsUseCase {
    constructor(recommendationRepository, recommendationService) {
        this.recommendationRepository = recommendationRepository;
        this.recommendationService = recommendationService;
        this.RECOMMENDATION_LIMIT = 10; // Tampilkan 10 layanan
    }

    /**
     * Execute dengan support filter kategori
     * @param {string} userId - User ID
     * @param {string} kategoriId - Optional kategori filter
     * @returns {Promise<Object>} Result with recommendations
     */
    async execute(userId, kategoriId = null) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('UC-01: GET RECOMMENDATIONS - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);
            console.log('kategoriId filter:', kategoriId || 'ALL (no filter)');

            if (!userId) {
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }

            // STEP 1: Analisis favorit user (dari tabel 'favorit')
            console.log('\nMenganalisis favorit user...');
            const userFavorites = await this._getUserFavorites(userId);
            console.log('User favorites:', userFavorites.length);
            if (userFavorites.length > 0) {
                console.log('  Sample:', userFavorites.slice(0, 2).map(f => f.layanan_id));
            }

            // STEP 2: Analisis transaksi user (dari tabel 'pesanan')
            console.log('\nMenganalisis transaksi user...');
            const userOrders = await this._getUserOrders(userId);
            console.log('User orders:', userOrders.length);
            if (userOrders.length > 0) {
                console.log('  Sample:', userOrders.slice(0, 2).map(o => o.layanan_id));
            }

            // STEP 3: Gabungkan layanan dari favorit & orders
            const userServiceIds = [
                ...userFavorites.map(f => f.layanan_id),
                ...userOrders.map(o => o.layanan_id)
            ];
            const uniqueUserServiceIds = [...new Set(userServiceIds)];
            console.log('\nUnique services interacted:', uniqueUserServiceIds.length);

            // STEP 4: Ambil hidden services untuk exclude
            console.log('\nMendapatkan layanan tersembunyi...');
            const hiddenServiceIds = await this._getHiddenServices(userId);
            console.log('Hidden services:', hiddenServiceIds.length);
            if (hiddenServiceIds.length > 0) {
                console.log('  Hidden IDs:', hiddenServiceIds);
            }

            // STEP 5: FALLBACK jika user belum pernah like/order
            if (uniqueUserServiceIds.length === 0) {
                console.warn('\nUser belum punya favorit/order');
                console.log('Gunakan POPULAR SERVICES sebagai fallback');
                return this._getPopularServicesAsFallback(userId, hiddenServiceIds, kategoriId);
            }

            // STEP 6: Ambil kategori dari layanan yang user sudah interaksi
            console.log('\nMenganalisis kategori preferensi user...');
            const userCategories = await this._getCategoriesFromServices(uniqueUserServiceIds);
            console.log('User interested categories:', userCategories.length);
            if (userCategories.length > 0) {
                console.log('  Category IDs:', userCategories);
            }

            if (userCategories.length === 0) {
                console.warn('\nTidak ada kategori ditemukan');
                console.log('Gunakan POPULAR SERVICES sebagai fallback');
                return this._getPopularServicesAsFallback(userId, hiddenServiceIds, kategoriId);
            }

            // STEP 7: Cari layanan serupa (exclude yang sudah interaksi + hidden)
            console.log('\nMenerapkan algoritma rekomendasi...');
            const excludeServiceIds = [...uniqueUserServiceIds, ...hiddenServiceIds];
            console.log('Excluding services:', excludeServiceIds.length);
            console.log('Already interacted:', uniqueUserServiceIds.length);
            console.log('Hidden by user:', hiddenServiceIds.length);

            const recommendations = await this._findSimilarServices(
                userId,
                userCategories,
                excludeServiceIds,
                kategoriId
            );

            console.log('\n✓ Found', recommendations.length, 'candidate services');

            // STEP 8: Limit hasil menjadi 10
            const finalRecommendations = recommendations.slice(0, this.RECOMMENDATION_LIMIT);

            // STEP 9: Format output
            const formattedData = finalRecommendations.map(rec => ({
                id: rec.id,
                serviceId: rec.serviceId,
                serviceName: rec.metadata.serviceName,
                kategoriId: rec.metadata.kategoriId,
                kategoriNama: rec.metadata.kategoriNama,
                harga: rec.metadata.harga,
                batasRevisi: rec.metadata.batasRevisi,
                waktuPengerjaan: rec.metadata.waktuPengerjaan,
                score: rec.score,
                reason: rec.reason,
                source: rec.source,
                stats: {
                    views: rec.metadata.views,
                    favorites: rec.metadata.favorites,
                    orders: rec.metadata.orders,
                    rating: rec.metadata.rating
                }
            }));

            // STEP 10: Ambil available categories untuk filter
            const availableCategories = await this._getAvailableCategories();

            console.log('\n' + '='.repeat(80));
            console.log('COMPLETE');
            console.log('Final recommendations:', formattedData.length);
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: formattedData,
                metadata: {
                    total: formattedData.length,
                    basedOn: {
                        favorites: userFavorites.length,
                        orders: userOrders.length,
                        categories: userCategories.length
                    },
                    excluded: {
                        alreadyInteracted: uniqueUserServiceIds.length,
                        hidden: hiddenServiceIds.length,
                        total: excludeServiceIds.length
                    },
                    filters: {
                        kategoriId: kategoriId || 'all',
                        availableCategories
                    },
                    timestamp: new Date().toISOString(),
                    userId
                }
            };
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('CRITICAL ERROR');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.error('='.repeat(80) + '\n');

            return {
                success: false,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }

    // ============================================================
    // PRIVATE METHODS - Database Queries
    // ============================================================

    /**
     * Get user favorites from 'favorit' table
     */
    async _getUserFavorites(userId) {
        const results = await this.recommendationRepository.sequelize.query(`
            SELECT layanan_id, created_at
            FROM favorit
            WHERE user_id = :userId
            ORDER BY created_at DESC
        `, {
            replacements: { userId },
            type: this.recommendationRepository.sequelize.QueryTypes.SELECT
        });
        return results;
    }

    /**
     * Get user orders from 'pesanan' table
     */
    async _getUserOrders(userId) {
        const results = await this.recommendationRepository.sequelize.query(`
            SELECT DISTINCT layanan_id, created_at
            FROM pesanan
            WHERE client_id = :userId
            AND status IN ('dibayar', 'dikerjakan', 'menunggu_review', 'revisi', 'selesai')
            ORDER BY created_at DESC
        `, {
            replacements: { userId },
            type: this.recommendationRepository.sequelize.QueryTypes.SELECT
        });
        return results;
    }

    /**
     * Get categories from services
     */
    async _getCategoriesFromServices(serviceIds) {
        if (serviceIds.length === 0) return [];

        const results = await this.recommendationRepository.sequelize.query(`
            SELECT DISTINCT kategori_id
            FROM layanan
            WHERE id IN (:serviceIds)
            AND kategori_id IS NOT NULL
        `, {
            replacements: { serviceIds },
            type: this.recommendationRepository.sequelize.QueryTypes.SELECT
        });

        return results.map(r => r.kategori_id);
    }

    /**
     * Get hidden services from 'aktivitas_user' table
     */
    async _getHiddenServices(userId) {
        const results = await this.recommendationRepository.sequelize.query(`
            SELECT DISTINCT layanan_id 
            FROM aktivitas_user 
            WHERE user_id = :userId 
            AND tipe_aktivitas = 'hide_layanan'
            AND layanan_id IS NOT NULL
        `, {
            replacements: { userId },
            type: this.recommendationRepository.sequelize.QueryTypes.SELECT
        });
        return results.map(r => r.layanan_id);
    }

    /**
     * Find similar services dengan FILTER KATEGORI
     * Algorithm: Content-based filtering berdasarkan kategori
     */
    async _findSimilarServices(userId, categories, excludeServiceIds, kategoriId = null) {
        if (categories.length === 0) return [];

        const Recommendation = require('../../domain/entities/Recommendation');

        let excludeCondition = '';
        let categoryFilterCondition = '';
        let replacements = {
            categories,
            limit: this.RECOMMENDATION_LIMIT * 2
        };

        // Exclude services
        if (excludeServiceIds.length > 0) {
            excludeCondition = 'AND l.id NOT IN (:excludeServiceIds)';
            replacements.excludeServiceIds = excludeServiceIds;
        }

        // Filter kategori (JIKA USER PILIH KATEGORI TERTENTU)
        if (kategoriId) {
            categoryFilterCondition = 'AND l.kategori_id = :kategoriId';
            replacements.kategoriId = kategoriId;
            replacements.categories = [kategoriId]; // Override
        }

        const query = `
            SELECT 
                l.id as layanan_id,
                l.judul as nama_layanan,
                l.kategori_id,
                k.nama as kategori_nama,
                l.harga,
                l.batas_revisi,
                l.waktu_pengerjaan,
                COUNT(DISTINCT CASE WHEN au.tipe_aktivitas = 'lihat_layanan' THEN au.id END) as views,
                COUNT(DISTINCT f.id) as favorites,
                COUNT(DISTINCT CASE WHEN p.status = 'selesai' THEN p.id END) as orders,
                COALESCE(AVG(u.rating), 0) as avg_rating,
                CASE 
                    WHEN l.kategori_id IN (:categories) THEN 100
                    ELSE 50
                END as category_match_score
            FROM layanan l
            LEFT JOIN kategori k ON l.kategori_id = k.id
            LEFT JOIN aktivitas_user au ON l.id = au.layanan_id 
            LEFT JOIN favorit f ON l.id = f.layanan_id
            LEFT JOIN pesanan p ON l.id = p.layanan_id
            LEFT JOIN ulasan u ON l.id = u.layanan_id
            WHERE l.status = 'aktif'
            AND l.kategori_id IN (:categories)
            ${excludeCondition}
            ${categoryFilterCondition}
            GROUP BY l.id, l.judul, l.kategori_id, k.nama, l.harga, l.batas_revisi, l.waktu_pengerjaan
            ORDER BY category_match_score DESC, orders DESC, favorites DESC, avg_rating DESC, views DESC
            LIMIT :limit
        `;

        const results = await this.recommendationRepository.sequelize.query(query, {
            replacements,
            type: this.recommendationRepository.sequelize.QueryTypes.SELECT
        });

        return results.map((layanan, index) => {
            const views = parseInt(layanan.views) || 0;
            const favorites = parseInt(layanan.favorites) || 0;
            const orders = parseInt(layanan.orders) || 0;
            const avgRating = parseFloat(layanan.avg_rating) || 0;
            const categoryScore = parseInt(layanan.category_match_score) || 0;

            const popularityScore = (
                views * 0.2 +
                favorites * 0.3 +
                orders * 0.4 +
                avgRating * 2
            );

            const totalScore = categoryScore + popularityScore;

            return new Recommendation({
                id: `rec-${Date.now()}-${index}-${layanan.layanan_id}`,
                userId,
                serviceId: layanan.layanan_id,
                score: Math.round(totalScore),
                reason: 'Berdasarkan layanan yang Anda sukai',
                source: 'favorites_and_orders',
                metadata: {
                    serviceName: layanan.nama_layanan,
                    kategoriId: layanan.kategori_id,
                    kategoriNama: layanan.kategori_nama,
                    harga: parseFloat(layanan.harga) || 0,
                    batasRevisi: parseInt(layanan.batas_revisi) || 0,
                    waktuPengerjaan: parseInt(layanan.waktu_pengerjaan) || 0,
                    views,
                    favorites,
                    orders,
                    rating: avgRating
                }
            });
        });
    }

    /**
     * FALLBACK: Popular services jika user belum ada favorit/order
     */
    async _getPopularServicesAsFallback(userId, hiddenServiceIds = [], kategoriId = null) {
        let excludeCondition = '';
        let categoryFilterCondition = '';
        let replacements = { limit: this.RECOMMENDATION_LIMIT };

        if (hiddenServiceIds.length > 0) {
            excludeCondition = 'AND l.id NOT IN (:hiddenServiceIds)';
            replacements.hiddenServiceIds = hiddenServiceIds;
        }

        if (kategoriId) {
            categoryFilterCondition = 'AND l.kategori_id = :kategoriId';
            replacements.kategoriId = kategoriId;
        }

        const query = `
            SELECT 
                l.id as layanan_id,
                l.judul as nama_layanan,
                l.kategori_id,
                k.nama as kategori_nama,
                l.harga,
                l.batas_revisi,
                l.waktu_pengerjaan,
                COUNT(DISTINCT CASE WHEN au.tipe_aktivitas = 'lihat_layanan' THEN au.id END) as views,
                COUNT(DISTINCT f.id) as favorites,
                COUNT(DISTINCT CASE WHEN p.status = 'selesai' THEN p.id END) as orders,
                COALESCE(AVG(u.rating), 0) as avg_rating
            FROM layanan l
            LEFT JOIN kategori k ON l.kategori_id = k.id
            LEFT JOIN aktivitas_user au ON l.id = au.layanan_id
            LEFT JOIN favorit f ON l.id = f.layanan_id
            LEFT JOIN pesanan p ON l.id = p.layanan_id
            LEFT JOIN ulasan u ON l.id = u.layanan_id
            WHERE l.status = 'aktif'
            ${excludeCondition}
            ${categoryFilterCondition}
            GROUP BY l.id, l.judul, l.kategori_id, k.nama, l.harga, l.batas_revisi, l.waktu_pengerjaan
            ORDER BY orders DESC, favorites DESC, views DESC
            LIMIT :limit
        `;

        const results = await this.recommendationRepository.sequelize.query(query, {
            replacements,
            type: this.recommendationRepository.sequelize.QueryTypes.SELECT
        });

        const formattedData = results.map((layanan, index) => {
            const views = parseInt(layanan.views) || 0;
            const favorites = parseInt(layanan.favorites) || 0;
            const orders = parseInt(layanan.orders) || 0;
            const avgRating = parseFloat(layanan.avg_rating) || 0;

            const popularityScore = (
                views * 0.2 +
                favorites * 0.3 +
                orders * 0.4 +
                avgRating * 2
            );

            return {
                id: `pop-${Date.now()}-${index}-${layanan.layanan_id}`,
                serviceId: layanan.layanan_id,
                serviceName: layanan.nama_layanan,
                kategoriId: layanan.kategori_id,
                kategoriNama: layanan.kategori_nama,
                harga: parseFloat(layanan.harga) || 0,
                batasRevisi: parseInt(layanan.batas_revisi) || 0,
                waktuPengerjaan: parseInt(layanan.waktu_pengerjaan) || 0,
                score: Math.round(popularityScore),
                reason: 'Layanan populer',
                source: 'popular',
                stats: {
                    views,
                    favorites,
                    orders,
                    rating: avgRating
                }
            };
        });

        const availableCategories = await this._getAvailableCategories();

        return {
            success: true,
            data: formattedData,
            metadata: {
                total: formattedData.length,
                basedOn: {
                    favorites: 0,
                    orders: 0,
                    fallback: 'popular'
                },
                excluded: {
                    hidden: hiddenServiceIds.length
                },
                filters: {
                    kategoriId: kategoriId || 'all',
                    availableCategories
                },
                timestamp: new Date().toISOString(),
                userId
            }
        };
    }

    /**
     * Get available categories untuk filter dropdown
     */
    async _getAvailableCategories() {
        const results = await this.recommendationRepository.sequelize.query(`
            SELECT DISTINCT 
                k.id,
                k.nama
            FROM kategori k
            INNER JOIN layanan l ON k.id = l.kategori_id
            WHERE l.status = 'aktif'
            ORDER BY k.nama ASC
        `, {
            type: this.recommendationRepository.sequelize.QueryTypes.SELECT
        });

        return results.map(r => ({
            id: r.id,
            nama: r.nama
        }));
    }
}

module.exports = GetRecommendationsUseCase;