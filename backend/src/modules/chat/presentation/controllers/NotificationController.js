/**
 * Notification Controller
 * Handles HTTP requests for notifications
 */
const SequelizeNotificationRepository = require('../../infrastructure/repositories/SequelizeNotificationRepository');
const CreateNotification = require('../../application/use-cases/CreateNotification');
const GetNotifications = require('../../application/use-cases/GetNotifications');
const MarkNotificationAsRead = require('../../application/use-cases/MarkNotificationAsRead');

class NotificationController {
  constructor(sequelize, socketService) {
    this.sequelize = sequelize;
    this.socketService = socketService;

    // Initialize repository
    this.notificationRepository = new SequelizeNotificationRepository(sequelize);

    // Initialize use cases
    this.createNotificationUseCase = new CreateNotification(
      this.notificationRepository,
      this.socketService
    );
    this.getNotificationsUseCase = new GetNotifications(this.notificationRepository);
    this.markAsReadUseCase = new MarkNotificationAsRead(this.notificationRepository);
  }

  /**
   * Get all notifications for logged in user
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const { page, limit, isRead } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };

      // Filter by read status if provided
      if (isRead !== undefined) {
        options.isRead = isRead === 'true' || isRead === true;
      }

      const result = await this.getNotificationsUseCase.execute(userId, options);

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Get unread count
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const count = await this.notificationRepository.countUnread(userId);

      return res.status(200).json({
        status: 'success',
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await this.markAsReadUseCase.execute(id, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Notifikasi berhasil ditandai sebagai terbaca',
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);

      if (error.message.includes('tidak ditemukan')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }

      if (error.message.includes('tidak memiliki akses')) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }

      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/mark-all-read
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const count = await this.markAsReadUseCase.executeAll(userId);

      return res.status(200).json({
        status: 'success',
        message: `${count} notifikasi berhasil ditandai sebagai terbaca`,
        data: { markedCount: count }
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      // Check if notification belongs to user
      const notification = await this.notificationRepository.findById(id);
      if (!notification) {
        return res.status(404).json({
          status: 'error',
          message: 'Notifikasi tidak ditemukan'
        });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Anda tidak memiliki akses ke notifikasi ini'
        });
      }

      await this.notificationRepository.delete(id);

      return res.status(200).json({
        status: 'success',
        message: 'Notifikasi berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Create notification (internal use / for testing)
   * POST /api/notifications
   * Note: In production, this should only be accessible internally or by admin
   */
  async createNotification(req, res) {
    try {
      const { userId, tipe, judul, pesan, relatedId, relatedType, sendViaSocket } = req.body;

      const notification = await this.createNotificationUseCase.execute({
        userId,
        tipe,
        judul,
        pesan,
        relatedId,
        relatedType,
        sendViaSocket
      });

      return res.status(201).json({
        status: 'success',
        message: 'Notifikasi berhasil dibuat',
        data: notification
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = NotificationController;
