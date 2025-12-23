/**
 * Get Notifications Use Case
 * Retrieves notifications for a user with pagination
 */
class GetNotifications {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  /**
   * Execute use case
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {boolean} options.isRead - Filter by read status (null = all)
   * @returns {Promise<Object>} - Paginated notifications
   */
  async execute(userId, options = {}) {
    if (!userId) {
      throw new Error('userId wajib diisi');
    }

    const result = await this.notificationRepository.findByUserId(userId, {
      page: options.page || 1,
      limit: options.limit || 20,
      isRead: options.isRead !== undefined ? options.isRead : null
    });

    // Get unread count
    const unreadCount = await this.notificationRepository.countUnread(userId);

    return {
      ...result,
      unreadCount
    };
  }
}

module.exports = GetNotifications;
