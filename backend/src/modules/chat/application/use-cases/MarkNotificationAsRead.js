/**
 * Mark Notification As Read Use Case
 * Marks one or all notifications as read
 */
class MarkNotificationAsRead {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  /**
   * Mark single notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Notification>}
   */
  async execute(notificationId, userId) {
    if (!notificationId) {
      throw new Error('notificationId wajib diisi');
    }

    // Find notification
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notifikasi tidak ditemukan');
    }

    // Check authorization
    if (notification.userId !== userId) {
      throw new Error('Anda tidak memiliki akses ke notifikasi ini');
    }

    // Mark as read
    return await this.notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all user notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of notifications marked
   */
  async executeAll(userId) {
    if (!userId) {
      throw new Error('userId wajib diisi');
    }

    return await this.notificationRepository.markAllAsRead(userId);
  }
}

module.exports = MarkNotificationAsRead;
