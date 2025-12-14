/**
 * Sequelize Notification Repository Implementation
 */
const NotificationRepository = require('../../domain/repositories/NotificationRepository');
const Notification = require('../../domain/entities/Notification');
const NotificationModel = require('../models/NotificationModel');

class SequelizeNotificationRepository extends NotificationRepository {
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.Notification = NotificationModel;
  }

  /**
   * Create a new notification
   */
  async create(notificationData) {
    const notification = await this.Notification.create({
      user_id: notificationData.userId,
      tipe: notificationData.tipe,
      judul: notificationData.judul,
      pesan: notificationData.pesan,
      related_id: notificationData.relatedId,
      related_type: notificationData.relatedType,
      dikirim_via_email: notificationData.dikirimViaEmail || false
    });

    return new Notification(notification.toJSON());
  }

  /**
   * Find notification by ID
   */
  async findById(id) {
    const notification = await this.Notification.findByPk(id);
    if (!notification) return null;
    return new Notification(notification.toJSON());
  }

  /**
   * Find all notifications for a user
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      isRead = null // null = all, true = read only, false = unread only
    } = options;

    const where = { user_id: userId };

    if (isRead !== null) {
      where.is_read = isRead;
    }

    const result = await this.Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    return {
      notifications: result.rows.map(n => new Notification(n.toJSON())),
      total: result.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.count / parseInt(limit))
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    const notification = await this.Notification.findByPk(id);
    if (!notification) {
      throw new Error('Notifikasi tidak ditemukan');
    }

    await notification.update({
      is_read: true,
      dibaca_pada: new Date()
    });

    return new Notification(notification.toJSON());
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId) {
    const [updatedCount] = await this.Notification.update(
      {
        is_read: true,
        dibaca_pada: new Date()
      },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return updatedCount;
  }

  /**
   * Get unread count for user
   */
  async countUnread(userId) {
    return await this.Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
  }

  /**
   * Delete notification
   */
  async delete(id) {
    const result = await this.Notification.destroy({
      where: { id }
    });
    return result > 0;
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllByUserId(userId) {
    return await this.Notification.destroy({
      where: { user_id: userId }
    });
  }
}

module.exports = SequelizeNotificationRepository;
