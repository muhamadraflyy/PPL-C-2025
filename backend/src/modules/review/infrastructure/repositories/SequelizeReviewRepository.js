const { Op } = require('sequelize');

class SequelizeReviewRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;

    this.Review =
      (sequelize.models &&
        (sequelize.models.ulasan || sequelize.models.Ulasan)) ||
      null;
  }

  async create(reviewData) {
    if (!this.Review) throw new Error('Review model not registered');
    const result = await this.Review.create(reviewData);
    return result.toJSON();
  }

  async findById(id) {
    if (!this.Review) return null;
    const review = await this.Review.findByPk(id);
    return review ? review.toJSON() : null;
  }

  async findByOrderId(orderId) {
    if (!this.Review) return null;
    const review = await this.Review.findOne({
      where: { pesanan_id: orderId },
    });
    return review ? review.toJSON() : null;
  }

  async findByServiceId(serviceId, filters = {}) {
    if (!this.Review) return [];

    const where = {};
    if (serviceId !== null) where.layanan_id = serviceId;
    if (filters.rating) where.rating = filters.rating;

    const page = Math.max(parseInt(filters.page || 1, 10), 1);
    const limit = parseInt(filters.limit || 20, 10);
    const offset = (page - 1) * limit;
    const sortDirection = filters.sortBy === 'oldest' ? 'ASC' : 'DESC';

    return await this.Review.findAll({
      where,
      order: [['created_at', sortDirection]],
      limit,
      offset,
      raw: true,
    });
  }

  async countByServiceId(serviceId, filters = {}) {
    if (!this.Review) return 0;

    const where = { layanan_id: serviceId };
    if (filters.rating) where.rating = filters.rating;

    return this.Review.count({ where });
  }

  async findByFreelancerId(freelancerId, filters = {}) {
    if (!this.Review) return [];

    const where = { penerima_ulasan_id: freelancerId };
    if (filters.rating) where.rating = filters.rating;

    const page = Math.max(parseInt(filters.page || 1, 10), 1);
    const limit = parseInt(filters.limit || 20, 10);
    const offset = (page - 1) * limit;

    return await this.Review.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      raw: true,
    });
  }

  async countByFreelancerId(freelancerId, filters = {}) {
    if (!this.Review) return 0;

    const where = { penerima_ulasan_id: freelancerId };
    if (filters.rating) where.rating = filters.rating;

    return this.Review.count({ where });
  }

  async findByUserId(userId, filters = {}) {
    if (!this.Review) return [];

    const where = { pemberi_ulasan_id: userId };
    if (filters.rating) where.rating = filters.rating;

    const page = Math.max(parseInt(filters.page || 1, 10), 1);
    const limit = parseInt(filters.limit || 20, 10);
    const offset = (page - 1) * limit;

    return await this.Review.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      raw: true,
    });
  }

  async countByUserId(userId, filters = {}) {
    if (!this.Review) return 0;

    const where = { pemberi_ulasan_id: userId };
    if (filters.rating) where.rating = filters.rating;

    return this.Review.count({ where });
  }

  async findLatest(limit = 5) {
    if (!this.Review) return [];

    return await this.Review.findAll({
      order: [['created_at', 'DESC']],
      limit,
      raw: true,
    });
  }

  async update(id, reviewData) {
    if (!this.Review) return null;

    await this.Review.update(reviewData, { where: { id } });
    return this.findById(id);
  }

  async delete(id) {
    if (!this.Review) return false;
    const deleted = await this.Review.destroy({ where: { id } });
    return deleted > 0;
  }

  async calculateAverageRating(serviceId) {
    if (!this.Review) return { average: 0, count: 0 };

    const result = await this.Review.findOne({
      where: { layanan_id: serviceId },
      attributes: [
        [this.sequelize.fn('AVG', this.sequelize.col('rating')), 'average'],
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
      ],
      raw: true,
    });

    return {
      average: parseFloat(result?.average || 0),
      count: parseInt(result?.count || 0, 10),
    };
  }

  async getRatingDistribution(serviceId) {
    if (!this.Review)
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const rows = await this.Review.findAll({
      where: { layanan_id: serviceId },
      attributes: [
        'rating',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count'],
      ],
      group: ['rating'],
      raw: true,
    });

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    rows.forEach((row) => {
      dist[row.rating] = parseInt(row.count, 10);
    });

    return dist;
  }
}

module.exports = SequelizeReviewRepository;
