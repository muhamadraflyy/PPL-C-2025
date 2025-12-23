const IHiddenServiceRepository = require('../../domain/repositories/IHiddenServiceRepository');
const HiddenService = require('../../domain/entities/HiddenService');
const { v4: uuidv4 } = require('uuid');

/**
 * Implementation of IHiddenServiceRepository using Sequelize
 * Menggunakan tabel 'aktivitas_user' dengan tipe_aktivitas = 'hide_layanan'
 */
class HiddenServiceRepositoryImpl extends IHiddenServiceRepository {
    constructor(sequelize) {
        super();
        this.sequelize = sequelize;
    }

    async hideService(userId, serviceId) {
        try {
            const id = uuidv4();
            const createdAt = new Date();

            // Insert into aktivitas_user with tipe_aktivitas = 'hide_layanan'
            await this.sequelize.query(`
                INSERT INTO aktivitas_user (id, user_id, layanan_id, tipe_aktivitas, created_at)
                VALUES (:id, :userId, :serviceId, 'hide_layanan', NOW())
            `, {
                replacements: {
                    id,
                    userId,
                    serviceId
                },
                type: this.sequelize.QueryTypes.INSERT
            });

            return new HiddenService({
                id: id,
                userId: userId,
                serviceId: serviceId,
                hiddenAt: createdAt,
                createdAt: createdAt
            });
        } catch (error) {
            console.error('HiddenServiceRepository.hideService Error:', error);

            // Handle duplicate hide error
            if (error.name === 'SequelizeUniqueConstraintError' ||
                error.message.includes('duplicate') ||
                error.message.includes('Duplicate entry')) {
                throw new Error('Service is already hidden');
            }

            throw new Error('Failed to hide service: ' + error.message);
        }
    }

    async unhideService(userId, serviceId) {
        try {
            // Cek dulu apakah service memang di-hide
            const [checkResult] = await this.sequelize.query(`
                SELECT id FROM aktivitas_user
                WHERE user_id = :userId 
                AND layanan_id = :serviceId 
                AND tipe_aktivitas = 'hide_layanan'
                LIMIT 1
            `, {
                replacements: { userId, serviceId },
                type: this.sequelize.QueryTypes.SELECT
            });

            // Jika tidak ada, return false
            if (!checkResult) {
                return false;
            }

            // Delete the record
            await this.sequelize.query(`
                DELETE FROM aktivitas_user
                WHERE user_id = :userId 
                AND layanan_id = :serviceId 
                AND tipe_aktivitas = 'hide_layanan'
            `, {
                replacements: { userId, serviceId },
                type: this.sequelize.QueryTypes.DELETE
            });

            return true;
        } catch (error) {
            console.error('HiddenServiceRepository.unhideService Error:', error);
            throw new Error('Failed to unhide service: ' + error.message);
        }
    }

    async getHiddenServiceData(userId, serviceId) {
        try {
            const [result] = await this.sequelize.query(`
                SELECT 
                    au.id,
                    au.user_id,
                    au.layanan_id,
                    au.created_at,
                    l.judul as service_name,
                    l.harga as service_price,
                    l.kategori_id,
                    k.nama as kategori_nama
                FROM aktivitas_user au
                LEFT JOIN layanan l ON au.layanan_id = l.id
                LEFT JOIN kategori k ON l.kategori_id = k.id
                WHERE au.user_id = :userId 
                AND au.layanan_id = :serviceId
                AND au.tipe_aktivitas = 'hide_layanan'
                LIMIT 1
            `, {
                replacements: { userId, serviceId },
                type: this.sequelize.QueryTypes.SELECT
            });

            if (!result) {
                return null;
            }

            return new HiddenService({
                id: result.id,
                userId: result.user_id,
                serviceId: result.layanan_id,
                hiddenAt: result.created_at,
                createdAt: result.created_at,
                serviceData: {
                    serviceName: result.service_name,
                    servicePrice: parseFloat(result.service_price) || 0,
                    kategoriId: result.kategori_id,
                    kategoriNama: result.kategori_nama
                }
            });
        } catch (error) {
            console.error('HiddenServiceRepository.getHiddenServiceData Error:', error);
            throw new Error('Failed to get hidden service data: ' + error.message);
        }
    }

    async getHiddenServices(userId) {
        try {
            const hiddenServices = await this.sequelize.query(`
                SELECT 
                    au.id,
                    au.user_id,
                    au.layanan_id,
                    au.created_at,
                    l.judul as service_name,
                    l.harga as service_price,
                    l.kategori_id,
                    k.nama as kategori_nama
                FROM aktivitas_user au
                LEFT JOIN layanan l ON au.layanan_id = l.id
                LEFT JOIN kategori k ON l.kategori_id = k.id
                WHERE au.user_id = :userId 
                AND au.tipe_aktivitas = 'hide_layanan'
                ORDER BY au.created_at DESC
            `, {
                replacements: { userId },
                type: this.sequelize.QueryTypes.SELECT
            });

            return hiddenServices.map(hs => new HiddenService({
                id: hs.id,
                userId: hs.user_id,
                serviceId: hs.layanan_id,
                hiddenAt: hs.created_at,
                createdAt: hs.created_at,
                serviceData: {
                    serviceName: hs.service_name,
                    servicePrice: parseFloat(hs.service_price) || 0,
                    kategoriId: hs.kategori_id,
                    kategoriNama: hs.kategori_nama
                }
            }));
        } catch (error) {
            console.error('HiddenServiceRepository.getHiddenServices Error:', error);
            throw new Error('Failed to get hidden services: ' + error.message);
        }
    }

    async isHidden(userId, serviceId) {
        try {
            const [result] = await this.sequelize.query(`
                SELECT COUNT(*) as count
                FROM aktivitas_user
                WHERE user_id = :userId 
                AND layanan_id = :serviceId 
                AND tipe_aktivitas = 'hide_layanan'
            `, {
                replacements: { userId, serviceId },
                type: this.sequelize.QueryTypes.SELECT
            });

            return parseInt(result.count) > 0;
        } catch (error) {
            console.error('HiddenServiceRepository.isHidden Error:', error);
            throw new Error('Failed to check hidden status: ' + error.message);
        }
    }

    async getHiddenServiceIds(userId) {
        try {
            const results = await this.sequelize.query(`
                SELECT DISTINCT layanan_id 
                FROM aktivitas_user 
                WHERE user_id = :userId 
                AND tipe_aktivitas = 'hide_layanan'
                AND layanan_id IS NOT NULL
            `, {
                replacements: { userId },
                type: this.sequelize.QueryTypes.SELECT
            });

            return results.map(r => r.layanan_id);
        } catch (error) {
            console.error('HiddenServiceRepository.getHiddenServiceIds Error:', error);
            throw new Error('Failed to get hidden service IDs: ' + error.message);
        }
    }

    async getHiddenCount(userId) {
        try {
            const [result] = await this.sequelize.query(`
                SELECT COUNT(DISTINCT layanan_id) as count
                FROM aktivitas_user
                WHERE user_id = :userId 
                AND tipe_aktivitas = 'hide_layanan'
                AND layanan_id IS NOT NULL
            `, {
                replacements: { userId },
                type: this.sequelize.QueryTypes.SELECT
            });

            return parseInt(result.count) || 0;
        } catch (error) {
            console.error('HiddenServiceRepository.getHiddenCount Error:', error);
            throw new Error('Failed to get hidden count: ' + error.message);
        }
    }
}

module.exports = HiddenServiceRepositoryImpl;