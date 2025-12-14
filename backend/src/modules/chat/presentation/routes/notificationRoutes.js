/**
 * Notification Routes
 * Routes for notification management
 */
const express = require('express');
const authMiddleware = require('../../../../shared/middleware/authMiddleware');

/**
 * @param {NotificationController} notificationController
 */
module.exports = (notificationController) => {
  const router = express.Router();

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: Get user notifications
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *       - in: query
   *         name: isRead
   *         schema:
   *           type: boolean
   *         description: Filter by read status
   *     responses:
   *       200:
   *         description: Notifications retrieved successfully
   */
  router.get(
    '/',
    authMiddleware,
    (req, res) => notificationController.getNotifications(req, res)
  );

  /**
   * @swagger
   * /api/notifications/unread-count:
   *   get:
   *     summary: Get unread notification count
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Unread count retrieved successfully
   */
  router.get(
    '/unread-count',
    authMiddleware,
    (req, res) => notificationController.getUnreadCount(req, res)
  );

  /**
   * @swagger
   * /api/notifications/mark-all-read:
   *   patch:
   *     summary: Mark all notifications as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read
   */
  router.patch(
    '/mark-all-read',
    authMiddleware,
    (req, res) => notificationController.markAllAsRead(req, res)
  );

  /**
   * @swagger
   * /api/notifications/{id}/read:
   *   patch:
   *     summary: Mark single notification as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Notification ID
   *     responses:
   *       200:
   *         description: Notification marked as read
   *       404:
   *         description: Notification not found
   *       403:
   *         description: Access denied
   */
  router.patch(
    '/:id/read',
    authMiddleware,
    (req, res) => notificationController.markAsRead(req, res)
  );

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     summary: Delete notification
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Notification ID
   *     responses:
   *       200:
   *         description: Notification deleted successfully
   *       404:
   *         description: Notification not found
   *       403:
   *         description: Access denied
   */
  router.delete(
    '/:id',
    authMiddleware,
    (req, res) => notificationController.deleteNotification(req, res)
  );

  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     summary: Create notification (internal/testing use)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - tipe
   *               - judul
   *               - pesan
   *             properties:
   *               userId:
   *                 type: string
   *               tipe:
   *                 type: string
   *                 enum: [pesanan_baru, pesanan_diterima, pesanan_ditolak, pesanan_selesai, pembayaran_berhasil, pesan_baru, ulasan_baru]
   *               judul:
   *                 type: string
   *               pesan:
   *                 type: string
   *               relatedId:
   *                 type: string
   *               relatedType:
   *                 type: string
   *               sendViaSocket:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Notification created successfully
   */
  router.post(
    '/',
    authMiddleware,
    (req, res) => notificationController.createNotification(req, res)
  );

  return router;
};
