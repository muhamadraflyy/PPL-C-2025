/**
 * Domain Service: RecommendationCacheService
 * Manages recommendation caching in rekomendasi_layanan table
 */
class RecommendationCacheService {
    constructor(sequelize) {
        this.sequelize = sequelize;
        this.CACHE_TTL_HOURS = 24; // 1 hari
    }

    /**
     * Get cached recommendations for user
     * @param {string} userId 
     * @returns {Promise<Array|null>} Cached recommendations or null if expired/not found
     */
    async getCachedRecommendations(userId) {
        try {
            console.log(`Getting cached recommendations for user: ${userId}`);
            const now = new Date();

            const cached = await this.sequelize.query(`
                SELECT 
                    rl.id,
                    rl.user_id,
                    rl.layanan_id,
                    rl.skor,
                    rl.alasan,
                    rl.created_at,
                    rl.kadaluarsa_pada,
                    l.judul as nama_layanan,
                    l.harga,
                    l.batas_revisi,
                    l.waktu_pengerjaan,
                    l.kategori_id,
                    k.nama as kategori_nama,
                    l.rating_rata_rata,
                    l.jumlah_rating,
                    l.total_pesanan,
                    l.jumlah_favorit,
                    l.jumlah_dilihat
                FROM rekomendasi_layanan rl
                INNER JOIN layanan l ON rl.layanan_id = l.id
                LEFT JOIN kategori k ON l.kategori_id = k.id
                WHERE rl.user_id = :userId
                AND rl.kadaluarsa_pada > :now
                AND l.status = 'aktif'
                ORDER BY rl.skor DESC
                LIMIT 10
            `, {
                replacements: { userId, now },
                type: this.sequelize.QueryTypes.SELECT
            });

            if (cached.length === 0) {
                console.log(`MISS - No cache found for user ${userId}`);
                return null;
            }

            console.log(`HIT - Found ${cached.length} cached recommendations for user ${userId}`);
            console.log(`Created at: ${cached[0].created_at}`);
            console.log(`Expires at: ${cached[0].kadaluarsa_pada}`);

            return cached.map(item => ({
                id: item.id,
                serviceId: item.layanan_id,
                serviceName: item.nama_layanan,
                kategoriId: item.kategori_id,
                kategoriNama: item.kategori_nama,
                harga: parseFloat(item.harga) || 0,
                batasRevisi: parseInt(item.batas_revisi) || 0,
                waktuPengerjaan: parseInt(item.waktu_pengerjaan) || 0,
                score: parseFloat(item.skor) || 0,
                reason: item.alasan,
                source: this._determineSourceFromReason(item.alasan),
                stats: {
                    views: parseInt(item.jumlah_dilihat) || 0,
                    favorites: parseInt(item.jumlah_favorit) || 0,
                    orders: parseInt(item.total_pesanan) || 0,
                    rating: parseFloat(item.rating_rata_rata) || 0
                },
                cachedAt: item.created_at,
                expiresAt: item.kadaluarsa_pada
            }));
        } catch (error) {
            console.error('Error getting cached recommendations:', error);
            return null;
        }
    }

    /**
     * Save recommendations to cache
     * @param {string} userId 
     * @param {Array} recommendations - Array of recommendation objects
     * @returns {Promise<boolean>}
     */
    async saveCachedRecommendations(userId, recommendations) {
        const transaction = await this.sequelize.transaction();

        try {
            console.log(`Saving cache for user: ${userId}`);
            console.log(`Recommendations count: ${recommendations.length}`);

            await this.clearCache(userId, transaction);

            const now = new Date();
            const expiresAt = new Date(now.getTime() + (this.CACHE_TTL_HOURS * 60 * 60 * 1000));

            const values = recommendations.map(rec => {
                return `(
                    UUID(),
                    '${userId}',
                    '${rec.serviceId}',
                    ${rec.score},
                    '${this._escapeString(rec.reason)}',
                    0,
                    0,
                    NOW(),
                    '${expiresAt.toISOString().slice(0, 19).replace('T', ' ')}'
                )`;
            }).join(',');

            if (values) {
                await this.sequelize.query(`
                    INSERT INTO rekomendasi_layanan 
                    (id, user_id, layanan_id, skor, alasan, sudah_ditampilkan, sudah_diklik, created_at, kadaluarsa_pada)
                    VALUES ${values}
                `, {
                    type: this.sequelize.QueryTypes.INSERT,
                    transaction
                });
            }

            await transaction.commit();
            console.log(`Saved successfully for user ${userId}: ${recommendations.length} recommendations`);
            console.log(`Expires at: ${expiresAt.toISOString()}`);
            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('Error saving cached recommendations:', error);
            return false;
        }
    }

    /**
     * Clear cache for user
     * @param {string} userId 
     * @param {Object} transaction - Sequelize transaction (optional)
     * @returns {Promise<boolean>}
     */
    async clearCache(userId, transaction = null) {
        try {
            await this.sequelize.query(`
                DELETE FROM rekomendasi_layanan
                WHERE user_id = :userId
            `, {
                replacements: { userId },
                type: this.sequelize.QueryTypes.DELETE,
                transaction
            });

            console.log(`Cleared cache for user ${userId}`);
            return true;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }

    /**
     * Check if cache exists and is valid
     * @param {string} userId 
     * @returns {Promise<boolean>}
     */
    async hasFreshCache(userId) {
        try {
            const now = new Date();

            const [result] = await this.sequelize.query(`
                SELECT COUNT(*) as count
                FROM rekomendasi_layanan
                WHERE user_id = :userId
                AND kadaluarsa_pada > :now
            `, {
                replacements: { userId, now },
                type: this.sequelize.QueryTypes.SELECT
            });

            const hasFresh = parseInt(result.count) > 0;
            console.log(`User ${userId} has fresh cache: ${hasFresh}`);
            return hasFresh;
        } catch (error) {
            console.error('Error checking fresh cache:', error);
            return false;
        }
    }

    /**
     * Clean up expired cache (cron job helper)
     * @returns {Promise<number>} Number of deleted records
     */
    async cleanupExpiredCache() {
        try {
            const now = new Date();

            const [result] = await this.sequelize.query(`
                DELETE FROM rekomendasi_layanan
                WHERE kadaluarsa_pada <= :now
            `, {
                replacements: { now },
                type: this.sequelize.QueryTypes.DELETE
            });

            const deletedCount = result.affectedRows || 0;
            console.log(`Cleaned up ${deletedCount} expired cache records`);
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up expired cache:', error);
            return 0;
        }
    }

    /**
         * Get cache statistics
         * @returns {Promise<Object>}
         */
    async getCacheStatistics() {
        try {
            const [stats] = await this.sequelize.query(`
                SELECT 
                    COUNT(DISTINCT user_id) as total_users_with_cache,
                    COUNT(*) as total_cached_recommendations,
                    COUNT(CASE WHEN kadaluarsa_pada > NOW() THEN 1 END) as valid_cache_count,
                    COUNT(CASE WHEN kadaluarsa_pada <= NOW() THEN 1 END) as expired_cache_count
                FROM rekomendasi_layanan
            `, {
                type: this.sequelize.QueryTypes.SELECT
            });

            return stats[0] || {
                total_users_with_cache: 0,
                total_cached_recommendations: 0,
                valid_cache_count: 0,
                expired_cache_count: 0
            };
        } catch (error) {
            console.error('Error getting cache statistics:', error);
            return null;
        }
    }

    _escapeString(str) {
        if (!str) return '';
        return str.replace(/'/g, "''");
    }

    _determineSourceFromReason(reason) {
        if (!reason) return 'popular';

        const reasonLower = reason.toLowerCase();

        if (reasonLower.includes('sukai') || reasonLower.includes('favorit')) {
            return 'favorites';
        }
        if (reasonLower.includes('order') || reasonLower.includes('pesanan')) {
            return 'orders';
        }
        if (reasonLower.includes('lihat') || reasonLower.includes('view')) {
            return 'views';
        }

        return 'popular';
    }
}

module.exports = RecommendationCacheService;