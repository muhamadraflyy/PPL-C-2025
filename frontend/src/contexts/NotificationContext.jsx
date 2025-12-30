import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/Chat/socketService';
import notificationService from '../services/Chat/notificationService';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Setup listener socket for new notifications
  useEffect(() => {
    if (!socketService.socket) return;

    socketService.onNewNotification((notification) => {
      console.log('[NotificationContext] New notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Increment unread count if not read
      if (!notification.is_read) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.judul || 'SkillConnect', {
          body: notification.pesan,
          icon: '/logo.png',
          tag: notification.id
        });
      }
      
      // Play notification sound (optional)
      playNotificationSound();
    });

    // Cleanup
    return () => {
      socketService.off('notification:new');
    };
  }, []);

  // Minta izin notifikasi browser on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.log('[NotificationContext] Could not play sound:', err);
      });
    } catch (error) {
      console.log('[NotificationContext] Notification sound not available');
    }
  };

  const fetchNotifications = useCallback(async (page = 1, limit = 20, isRead = undefined) => {
    setIsLoading(true);
    try {
      const response = await notificationService.getNotifications(page, limit, isRead);
      
      console.log('[NotificationContext] API Response:', response);
      console.log('[NotificationContext] Response data:', response.data);
      console.log('[NotificationContext] Notifications array:', response.data?.notifications);
      
      // Backend returns: { status, data: { notifications: [], total, page, ... } }
      const notificationsArray = response.data?.notifications || [];
      
      // Ensure it's an array
      if (!Array.isArray(notificationsArray)) {
        console.error('[NotificationContext] notifications is not an array:', notificationsArray);
        setNotifications([]);
      } else {
        setNotifications(notificationsArray);
      }
      
      // Update unread count if provided
      if (response.data?.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      }
      
      return response;
    } catch (error) {
      console.error('[NotificationContext] Error fetching notifications:', error);
      // Set empty array on error to prevent crash
      setNotifications([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.unreadCount || 0);
      return response;
    } catch (error) {
      console.error('[NotificationContext] Error fetching unread count:', error);
      throw error;
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, dibaca_pada: new Date().toISOString() }
            : notif
        )
      );
      
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[NotificationContext] Error marking as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          is_read: true,
          dibaca_pada: new Date().toISOString()
        }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('[NotificationContext] Error marking all as read:', error);
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        
        // Decrement unread count if notification was unread
        if (notification && !notification.is_read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (error) {
      console.error('[NotificationContext] Error deleting notification:', error);
      throw error;
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
