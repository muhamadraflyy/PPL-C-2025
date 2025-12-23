/**
 * Create Notification Use Case
 * Creates a new notification and optionally sends it via socket
 */
const Notification = require('../../domain/entities/Notification');

class CreateNotification {
  constructor(notificationRepository, socketService = null) {
    this.notificationRepository = notificationRepository;
    this.socketService = socketService;
  }

  /**
   * Execute use case
   * @param {Object} data - Notification data
   * @param {string} data.userId - Target user ID
   * @param {string} data.tipe - Notification type
   * @param {string} data.judul - Title
   * @param {string} data.pesan - Message
   * @param {string} data.relatedId - Related entity ID (optional)
   * @param {string} data.relatedType - Related entity type (optional)
   * @param {boolean} data.sendViaSocket - Send real-time via socket (default: true)
   * @returns {Promise<Notification>}
   */
  async execute(data) {
    // Validate notification type
    if (!Notification.isValidType(data.tipe)) {
      throw new Error(`Tipe notifikasi tidak valid: ${data.tipe}`);
    }

    // Validate required fields
    if (!data.userId || !data.judul || !data.pesan) {
      throw new Error('userId, judul, dan pesan wajib diisi');
    }

    // Create notification in database
    const notification = await this.notificationRepository.create({
      userId: data.userId,
      tipe: data.tipe,
      judul: data.judul,
      pesan: data.pesan,
      relatedId: data.relatedId || null,
      relatedType: data.relatedType || null,
      dikirimViaEmail: data.dikirimViaEmail || false
    });

    // Send real-time notification via socket (if enabled)
    if (this.socketService && data.sendViaSocket !== false) {
      this.socketService.emitNewNotification(data.userId, notification.toJSON());
    }

    return notification;
  }
}

module.exports = CreateNotification;
