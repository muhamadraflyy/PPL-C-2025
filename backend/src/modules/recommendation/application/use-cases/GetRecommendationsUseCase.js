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
    constructor(recommendationRepository, recommendationService, cacheService) {
        this.recommendationRepository = recommendationRepository;
        this.recommendationService = recommendationService;
        this.cacheService = cacheService;
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
            console.log('GET RECOMMENDATIONS - START');
            console.log('='.repeat(80));
            console.log('userId:', userId);
            console.log('kategoriId filter:', kategoriId || 'ALL');

            if (!userId) {
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }

            // STEP 1: Check cache (only if no kategori filter)
            if (!kategoriId) {
                console.log('\nChecking cache...');
                const cachedRecommendations = await this.cacheService.getCachedRecommendations(userId);

                if (cachedRecommendations && cachedRecommendations.length > 0) {
                    console.log('Cache HIT! Returning cached recommendations:', cachedRecommendations.length);

                    const availableCategories = await this._getAvailableCategories();

                    console.log('\n' + '='.repeat(80));
                    console.log('COMPLETE (FROM CACHE)');
                    console.log('='.repeat(80) + '\n');

                    return {
                        success: true,
                        data: cachedRecommendations,
                        metadata: {
                            total: cachedRecommendations.length,
                            cached: true,
                            cachedAt: cachedRecommendations[0].cachedAt,
                            expiresAt: cachedRecommendations[0].expiresAt,
                            filters: {
                                kategoriId: 'all',
                                availableCategories
                            },
                            timestamp: new Date().toISOString(),
                            userId
                        }
                    };
                }

                console.log('Cache MISS. Generating fresh recommendations...');
            } else {
                console.log('\nKategori filter detected. Skipping cache, generating fresh...');
            }

            // STEP 2: Generate fresh recommendations
            const freshRecommendations = await this._generateRecommendations(userId, kategoriId);

            // STEP 3: Save to cache (only if no kategori filter)
            if (!kategoriId && freshRecommendations.data.length > 0) {
                console.log('\nSaving to cache...');
                const saved = await this.cacheService.saveCachedRecommendations(
                    userId,
                    freshRecommendations.data
                );

                if (saved) {
                    console.log('Cache saved successfully');
                } else {
                    console.warn('Failed to save cache');
                }
            }

            console.log('\n' + '='.repeat(80));
            console.log('COMPLETE (FRESH)');
            console.log('='.repeat(80) + '\n');

            return freshRecommendations;

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

    /**
     * Generate fresh recommendations
     * @private
     */
    async _generateRecommendations(userId, kategoriId = null) {
        // STEP 1: Analisis favorit user
        console.log('\nAnalyzing user favorites...');
        const userFavorites = await this._getUserFavorites(userId);
        console.log('User favorites:', userFavorites.length);

        // STEP 2: Analisis transaksi user
        console.log('\nAnalyzing user orders...');
        const userOrders = await this._getUserOrders(userId);
        console.log('User orders:', userOrders.length);

        // STEP 3: Analisis views user
        console.log('\nAnalyzing user views...');
        const userViews = await this._getUserViews(userId);
        console.log('User views:', userViews.length);

        // STEP 4: Gabungkan layanan
        const userServiceIds = [
            ...userFavorites.map(f => f.layanan_id),
            ...userOrders.map(o => o.layanan_id),
            ...userViews.map(v => v.layanan_id)
        ];
        const uniqueUserServiceIds = [...new Set(userServiceIds)];
        console.log('\nUnique services interacted:', uniqueUserServiceIds.length);

        // STEP 5: Get hidden services
        console.log('\nGetting hidden services...');
        const hiddenServiceIds = await this._getHiddenServices(userId);
        console.log('Hidden services:', hiddenServiceIds.length);

        // STEP 6: FALLBACK if no interaction
        if (uniqueUserServiceIds.length === 0) {
            console.warn('\nUser has no interaction. Using POPULAR SERVICES');
            return this._getPopularServicesAsFallback(userId, hiddenServiceIds, kategoriId);
        }

        // STEP 7: Get categories from interactions
        console.log('\nAnalyzing user category preferences...');
        const userCategories = await this._getCategoriesFromServices(uniqueUserServiceIds);
        console.log('User interested categories:', userCategories.length);

        if (userCategories.length === 0) {
            console.warn('\nNo categories found. Using POPULAR SERVICES');
            return this._getPopularServicesAsFallback(userId, hiddenServiceIds, kategoriId);
        }

        // STEP 8: Generate recommendations from ALL sources
        const excludeServiceIds = [...uniqueUserServiceIds, ...hiddenServiceIds];
        console.log('\nExcluding services:', excludeServiceIds.length);

        const allCandidates = [];

        // Multiply limit untuk ensure cukup kandidat
        const CANDIDATE_MULTIPLIER = 5;

        // From Favorites
        if (userFavorites.length > 0) {
            console.log('\nGenerating from Favorites...');
            const fromFavorites = await this._findSimilarServicesFromSource(
                userId,
                userFavorites.map(f => f.layanan_id),
                excludeServiceIds,
                kategoriId,
                'Berdasarkan layanan yang Anda sukai',
                'favorites',
                this.RECOMMENDATION_LIMIT * CANDIDATE_MULTIPLIER
            );
            console.log('Candidates from favorites:', fromFavorites.length);
            allCandidates.push(...fromFavorites);
        }

        // From Orders
        if (userOrders.length > 0) {
            console.log('\nGenerating from Orders...');
            const fromOrders = await this._findSimilarServicesFromSource(
                userId,
                userOrders.map(o => o.layanan_id),
                excludeServiceIds,
                kategoriId,
                'Berdasarkan layanan yang sudah Anda order',
                'orders',
                this.RECOMMENDATION_LIMIT * CANDIDATE_MULTIPLIER
            );
            console.log('Candidates from orders:', fromOrders.length);
            allCandidates.push(...fromOrders);
        }

        // From Views
        if (userViews.length > 0) {
            console.log('\nGenerating from Views...');
            const fromViews = await this._findSimilarServicesFromSource(
                userId,
                userViews.map(v => v.layanan_id),
                excludeServiceIds,
                kategoriId,
                'Berdasarkan layanan yang sering Anda lihat',
                'views',
                this.RECOMMENDATION_LIMIT * CANDIDATE_MULTIPLIER
            );
            console.log('Candidates from views:', fromViews.length);
            allCandidates.push(...fromViews);
        }

        // From Popular (untuk ensure cukup kandidat)
        console.log('\nAdding popular services...');
        const popularServices = await this._getPopularServicesForMix(
            excludeServiceIds,
            kategoriId,
            this.RECOMMENDATION_LIMIT * CANDIDATE_MULTIPLIER
        );
        console.log('Popular candidates:', popularServices.length);
        allCandidates.push(...popularServices);

        // STEP 9: Remove duplicates and sort by score
        console.log('\nRemoving duplicates and sorting...');
        const uniqueCandidates = this._removeDuplicates(allCandidates);
        console.log('Unique candidates after dedup:', uniqueCandidates.length);

        const sortedCandidates = uniqueCandidates.sort((a, b) => b.score - a.score);

        // STEP 10: Take top 10
        const finalRecommendations = sortedCandidates.slice(0, this.RECOMMENDATION_LIMIT);

        console.log('\nFinal recommendations:', finalRecommendations.length);
        console.log('Sources breakdown:');
        const breakdown = this._getSourceBreakdown(finalRecommendations);
        console.log(breakdown);

        // Format output
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

        const availableCategories = await this._getAvailableCategories();

        return {
            success: true,
            data: formattedData,
            metadata: {
                total: formattedData.length,
                cached: false,
                basedOn: {
                    favorites: userFavorites.length,
                    orders: userOrders.length,
                    views: userViews.length,
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
                sourcesBreakdown: breakdown,
                timestamp: new Date().toISOString(),
                userId
            }
        };
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

    async _getUserViews(userId) {
        const results = await this.recommendationRepository.sequelize.query(`
            SELECT layanan_id, COUNT(*) as view_count, MAX(created_at) as last_viewed
            FROM aktivitas_user
            WHERE user_id = :userId
            AND tipe_aktivitas = 'lihat_layanan'
            AND layanan_id IS NOT NULL
            GROUP BY layanan_id
            HAVING COUNT(*) >= 3
            ORDER BY view_count DESC, last_viewed DESC
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
            AND tipe_aktivitas = 'hide'
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
    async _findSimilarServicesFromSource(userId, sourceServiceIds, excludeServiceIds, kategoriId, reason, source, customLimit = null) {
        if (sourceServiceIds.length === 0) return [];

        const Recommendation = require('../../domain/entities/Recommendation');

        const categories = await this._getCategoriesFromServices(sourceServiceIds);
        if (categories.length === 0) return [];

        let excludeCondition = '';
        let categoryFilterCondition = '';
        const queryLimit = customLimit || (this.RECOMMENDATION_LIMIT * 3);

        let replacements = {
            categories,
            limit: queryLimit
        };

        if (excludeServiceIds.length > 0) {
            excludeCondition = 'AND l.id NOT IN (:excludeServiceIds)';
            replacements.excludeServiceIds = excludeServiceIds;
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
                reason: reason,
                source: source,
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

    async _getPopularServicesForMix(excludeServiceIds, kategoriId, limit) {
        const Recommendation = require('../../domain/entities/Recommendation');

        let excludeCondition = '';
        let categoryFilterCondition = '';
        let replacements = { limit };

        if (excludeServiceIds.length > 0) {
            excludeCondition = 'AND l.id NOT IN (:excludeServiceIds)';
            replacements.excludeServiceIds = excludeServiceIds;
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

        return results.map((layanan, index) => {
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

            return new Recommendation({
                id: `pop-${Date.now()}-${index}-${layanan.layanan_id}`,
                userId: null,
                serviceId: layanan.layanan_id,
                score: Math.round(popularityScore),
                reason: 'Layanan populer',
                source: 'popular',
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

    _removeDuplicates(recommendations) {
        const seen = new Set();
        return recommendations.filter(rec => {
            if (seen.has(rec.serviceId)) {
                return false;
            }
            seen.add(rec.serviceId);
            return true;
        });
    }

    _getSourceBreakdown(recommendations) {
        const breakdown = {};
        recommendations.forEach(rec => {
            const source = rec.source || 'unknown';
            breakdown[source] = (breakdown[source] || 0) + 1;
        });
        return breakdown;
    }
}

module.exports = GetRecommendationsUseCase;