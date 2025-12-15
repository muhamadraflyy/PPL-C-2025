import api from '../../utils/axiosConfig';

class NotificationService {
  async getNotifications(page = 1, limit = 20, isRead = undefined) {
    try {
      const params = { page, limit };
      if (isRead !== undefined) {
        params.isRead = isRead;
      }

      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('[NotificationService] Error getting notifications:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('[NotificationService] Error getting unread count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('[NotificationService] Error marking all as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('[NotificationService] Error deleting notification:', error);
      throw error;
    }
  }

  async createNotification(notificationData) {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
