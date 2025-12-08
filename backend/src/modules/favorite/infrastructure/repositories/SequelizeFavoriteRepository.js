const FavoriteModel = require('../models/FavoriteModel');
const { sequelize } = require('../../../../shared/database/connection');

class SequelizeFavoriteRepository {
  /**
   * Get all favorites for a user
   * @param {string} userId - User ID
   * @param {string} type - Optional type filter ('favorite' or 'bookmark')
   * @returns {Promise<Array>} - List of favorites with layanan details
   */
  async findByUserId(userId, type = null) {
    try {
      const where = { user_id: userId };
      if (type) {
        where.type = type;
      }

      // Use raw query to join with layanan and kategori
      const whereType = type ? `AND f.type = '${type}'` : '';
      const [favorites] = await sequelize.query(`
        SELECT
          f.id,
          f.user_id,
          f.layanan_id,
          f.type,
          f.created_at,
          l.judul,
          l.slug,
          l.harga,
          l.thumbnail,
          l.rating_rata_rata,
          l.jumlah_rating,
          l.jumlah_favorit,
          k.nama AS nama_kategori,
          CONCAT(u.nama_depan, ' ', u.nama_belakang) AS freelancer_name
        FROM favorit f
        LEFT JOIN layanan l ON l.id = f.layanan_id
        LEFT JOIN kategori k ON k.id = l.kategori_id
        LEFT JOIN users u ON u.id = l.freelancer_id
        WHERE f.user_id = ? ${whereType}
        ORDER BY f.created_at DESC
      `, {
        replacements: [userId],
        type: sequelize.QueryTypes.SELECT
      });

      return favorites;
    } catch (error) {
      throw new Error(`Failed to fetch favorites: ${error.message}`);
    }
  }

  /**
   * Add a favorite
   * @param {string} userId - User ID
   * @param {string} layananId - Service ID
   * @param {string} type - Type ('favorite' or 'bookmark')
   * @returns {Promise<Object>} - Created favorite
   */
  async create(userId, layananId, type = 'favorite') {
    try {
      const favorite = await FavoriteModel.create({
        user_id: userId,
        layanan_id: layananId,
        type
      });
      return favorite;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error(`Layanan sudah ada di ${type === 'bookmark' ? 'bookmark' : 'favorit'}`);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new Error('Layanan tidak ditemukan. Pastikan layanan_id valid.');
      }
      throw new Error(`Failed to add ${type}: ${error.message}`);
    }
  }

  /**
   * Remove a favorite
   * @param {string} userId - User ID
   * @param {string} layananId - Service ID
   * @param {string} type - Optional type filter ('favorite' or 'bookmark')
   * @returns {Promise<boolean>} - Success status
   */
  async delete(userId, layananId, type = null) {
    try {
      const where = {
        user_id: userId,
        layanan_id: layananId
      };
      if (type) {
        where.type = type;
      }

      const result = await FavoriteModel.destroy({ where });
      return result > 0;
    } catch (error) {
      throw new Error(`Failed to remove favorite: ${error.message}`);
    }
  }

  /**
   * Check if a service is favorited by user
   * @param {string} userId - User ID
   * @param {string} layananId - Service ID
   * @param {string} type - Optional type filter ('favorite' or 'bookmark')
   * @returns {Promise<boolean>} - Favorite status
   */
  async exists(userId, layananId, type = null) {
    try {
      const where = {
        user_id: userId,
        layanan_id: layananId
      };
      if (type) {
        where.type = type;
      }

      const favorite = await FavoriteModel.findOne({ where });
      return !!favorite;
    } catch (error) {
      throw new Error(`Failed to check favorite status: ${error.message}`);
    }
  }

  /**
   * Get favorite count for a user
   * @param {string} userId - User ID
   * @param {string} type - Optional type filter ('favorite' or 'bookmark')
   * @returns {Promise<number>} - Count of favorites
   */
  async countByUserId(userId, type = null) {
    try {
      const where = { user_id: userId };
      if (type) {
        where.type = type;
      }

      const count = await FavoriteModel.count({ where });
      return count;
    } catch (error) {
      throw new Error(`Failed to count favorites: ${error.message}`);
    }
  }
}

module.exports = SequelizeFavoriteRepository;
