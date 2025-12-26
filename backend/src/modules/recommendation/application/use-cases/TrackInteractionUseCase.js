/**
 * Use Case: Track Interaction
 * 
 * GET /track → Menampilkan layanan apa saja yang user lihat + berapa kali
 * POST /interactions → Menyimpan data view/click ke database
 */
class TrackInteractionUseCase {
    constructor(recommendationRepository, cacheService) {
        this.recommendationRepository = recommendationRepository;
        this.cacheService = cacheService;
        this.VIEW_THRESHOLD_FOR_CACHE_REFRESH = 10; // Refresh cache setelah 10 views
    }

    /**
     * GET TRACK - Menampilkan layanan yang user lihat + berapa kali
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Result with view history
     */
    async getViewHistory(userId) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('GET VIEW HISTORY - START');
            console.log('='.repeat(80));
            console.log('User ID:', userId);

            if (!userId) {
                console.error('Missing userId');
                return {
                    success: false,
                    error: 'User ID is required'
                };
            }

            const sequelize = this.recommendationRepository.sequelize;

            console.log('\nFetching view history from database...');
            const viewHistory = await sequelize.query(`
                SELECT 
                    l.id as layanan_id,
                    l.judul as nama_layanan,
                    l.harga,
                    l.thumbnail,
                    k.id as kategori_id,
                    k.nama as kategori_nama,
                    COUNT(*) as jumlah_dilihat,
                    MAX(au.created_at) as terakhir_dilihat,
                    MIN(au.created_at) as pertama_dilihat
                FROM aktivitas_user au
                INNER JOIN layanan l ON au.layanan_id = l.id
                LEFT JOIN kategori k ON l.kategori_id = k.id
                WHERE au.user_id = :userId
                AND au.tipe_aktivitas = 'lihat_layanan'
                AND l.status = 'aktif'
                GROUP BY l.id, l.judul, l.harga, l.thumbnail, k.id, k.nama
                ORDER BY terakhir_dilihat DESC
            `, {
                replacements: { userId },
                type: sequelize.QueryTypes.SELECT
            });

            console.log('Found', viewHistory.length, 'services viewed');

            const formattedData = viewHistory.map(item => ({
                layananId: item.layanan_id,
                namaLayanan: item.nama_layanan,
                harga: parseFloat(item.harga) || 0,
                thumbnail: item.thumbnail,
                kategori: {
                    id: item.kategori_id,
                    nama: item.kategori_nama
                },
                jumlahDilihat: parseInt(item.jumlah_dilihat) || 0,
                terakhirDilihat: item.terakhir_dilihat,
                pertamaDilihat: item.pertama_dilihat
            }));

            const mostViewed = formattedData.length > 0
                ? formattedData.reduce((prev, current) =>
                    (prev.jumlahDilihat > current.jumlahDilihat) ? prev : current
                )
                : null;

            console.log('\n' + '='.repeat(80));
            console.log('GET VIEW HISTORY - COMPLETE');
            console.log('Total layanan dilihat:', formattedData.length);
            if (mostViewed) {
                console.log('Paling sering dilihat:', mostViewed.namaLayanan, '(' + mostViewed.jumlahDilihat + 'x)');
            }
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: formattedData,
                metadata: {
                    total: formattedData.length,
                    userId,
                    mostViewed: mostViewed ? {
                        layananId: mostViewed.layananId,
                        namaLayanan: mostViewed.namaLayanan,
                        jumlahDilihat: mostViewed.jumlahDilihat
                    } : null,
                    timestamp: new Date()
                }
            };
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('GET VIEW HISTORY - ERROR');
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
     * POST INTERACTIONS - Menyimpan view/click ke database
     * 
     * @param {string} userId - User ID
     * @param {string} serviceId - Service ID
     * @param {string} interactionType - 'view' atau 'click'
     * @param {Object} metadata - Additional metadata
     * @returns {Promise<Object>} Result with interaction data
     */
    async saveInteraction(userId, serviceId, interactionType = 'view', metadata = {}) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('SAVE INTERACTION - START');
            console.log('='.repeat(80));
            console.log('User ID:', userId);
            console.log('Service ID:', serviceId);
            console.log('Interaction Type:', interactionType);

            if (!userId || !serviceId) {
                console.error('Missing required fields');
                return {
                    success: false,
                    error: 'User ID and Service ID are required'
                };
            }

            const validTypes = ['view', 'click'];
            if (!validTypes.includes(interactionType)) {
                console.error('Invalid interaction type:', interactionType);
                return {
                    success: false,
                    error: `Invalid interaction type. Must be 'view' or 'click'`
                };
            }

            console.log('\nValidating service existence...');
            const sequelize = this.recommendationRepository.sequelize;

            const [service] = await sequelize.query(`
                SELECT id, judul, status, jumlah_dilihat 
                FROM layanan 
                WHERE id = :serviceId 
                LIMIT 1
            `, {
                replacements: { serviceId },
                type: sequelize.QueryTypes.SELECT
            });

            if (!service) {
                console.error('Service not found in database');
                return {
                    success: false,
                    error: 'Service not found'
                };
            }

            if (service.status !== 'aktif') {
                console.error('Service is not active');
                return {
                    success: false,
                    error: 'Service is not active'
                };
            }

            console.log('Service exists:', service.judul);
            console.log('Current view count:', service.jumlah_dilihat);

            console.log('\nSaving to aktivitas_user table...');
            const interaction = await this.recommendationRepository.trackInteraction(
                userId,
                serviceId,
                interactionType,
                1,
                {
                    ...metadata,
                    timestamp: new Date(),
                    source: 'api'
                }
            );
            console.log('Interaction saved to aktivitas_user');

            console.log('\nIncrementing view counter in layanan table...');
            await sequelize.query(`
                UPDATE layanan 
                SET jumlah_dilihat = jumlah_dilihat + 1,
                    updated_at = NOW()
                WHERE id = :serviceId
            `, {
                replacements: { serviceId },
                type: sequelize.QueryTypes.UPDATE
            });
            console.log('View counter incremented');

            const [updatedService] = await sequelize.query(`
                SELECT jumlah_dilihat 
                FROM layanan 
                WHERE id = :serviceId
            `, {
                replacements: { serviceId },
                type: sequelize.QueryTypes.SELECT
            });

            console.log('New view count:', updatedService.jumlah_dilihat);

            // Check if should refresh cache (threshold-based)
            const totalUserViews = await this._getTotalUserViews(userId);
            console.log('\nTotal user views:', totalUserViews);

            let cacheRefreshed = false;
            if (totalUserViews > 0 && totalUserViews % this.VIEW_THRESHOLD_FOR_CACHE_REFRESH === 0) {
                console.log('View threshold reached! Clearing cache...');
                await this.cacheService.clearCache(userId);
                cacheRefreshed = true;
                console.log('Cache cleared. Will regenerate on next request.');
            } else {
                console.log('View threshold not reached. Cache unchanged.');
            }

            console.log('\n' + '='.repeat(80));
            console.log('SAVE INTERACTION - COMPLETE');
            console.log('='.repeat(80) + '\n');

            return {
                success: true,
                data: {
                    id: interaction.id,
                    userId: interaction.userId,
                    serviceId: interaction.serviceId,
                    interactionType: interaction.interactionType,
                    createdAt: interaction.createdAt,
                    newViewCount: parseInt(updatedService.jumlah_dilihat)
                },
                message: 'Interaction saved successfully',
                cacheRefreshed
            };
        } catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error('SAVE INTERACTION - ERROR');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            console.error('='.repeat(80) + '\n');

            return {
                success: false,
                error: error.message
            };
        }
    }

    async _getTotalUserViews(userId) {
        try {
            const sequelize = this.recommendationRepository.sequelize;
            const [result] = await sequelize.query(`
                SELECT COUNT(*) as total
                FROM aktivitas_user
                WHERE user_id = :userId
                AND tipe_aktivitas = 'lihat_layanan'
            `, {
                replacements: { userId },
                type: sequelize.QueryTypes.SELECT
            });

            return parseInt(result.total) || 0;
        } catch (error) {
            console.error('Error getting total user views:', error);
            return 0;
        }
    }
}

module.exports = TrackInteractionUseCase;