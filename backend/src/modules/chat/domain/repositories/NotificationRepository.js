/**
 * Notification Repository Interface
 * Defines contract for notification data access
 */
class NotificationRepository {
  /**
   * Create a new notification
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Notification>}
   */
  async create(notificationData) {
    throw new Error('Method not implemented');
  }

  /**
   * Find notification by ID
   * @param {string} id - Notification ID
   * @returns {Promise<Notification|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all notifications for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (page, limit, isRead)
   * @returns {Promise<Array<Notification>>}
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @returns {Promise<Notification>}
   */
  async markAsRead(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Mark all user notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of notifications marked
   */
  async markAllAsRead(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get unread count for user
   * @param {string} userId - User ID
   * @returns {Promise<number>}
   */
  async countUnread(userId) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete notification
   * @param {string} id - Notification ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete all notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of notifications deleted
   */
  async deleteAllByUserId(userId) {
    throw new Error('Method not implemented');
  }
}

module.exports = NotificationRepository;
