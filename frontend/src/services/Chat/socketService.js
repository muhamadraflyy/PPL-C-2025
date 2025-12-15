import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('[SocketService] No token found - cannot connect');
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketService] Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error.message);
    });

    // Tangani error autentikasi
    this.socket.on('error', (error) => {
      console.error('[SocketService] Socket error:', error);
    });
  }

  joinConversation(conversationId) {
    if (!this.socket) {
      console.error('[SocketService] Socket not initialized');
      return;
    }

    console.log('[SocketService] Joining conversation:', conversationId);
    this.socket.emit('chat:join-conversation', conversationId);
  }

  sendMessage(conversationId, pesan, tipe = 'text', lampiran = null, callback) {
    if (!this.socket) {
      console.error('[SocketService] Socket not initialized');
      return;
    }

    const messageData = {
      conversationId,
      pesan,
      tipe,
      lampiran
    };

    console.log('[SocketService] Sending message:', messageData);
    
    this.socket.emit('chat:send-message', messageData, (response) => {
      if (response.status === 'success') {
        console.log('[SocketService] Message sent successfully:', response.data);
      } else {
        console.error('[SocketService] Failed to send message:', response.message);
      }
      
      if (callback) callback(response);
    });
  }

  onNewMessage(callback) {
    if (!this.socket) return;

    this.socket.on('chat:new-message', (message) => {
      console.log('[SocketService] New message received:', message);
      callback(message);
    });
  }

  onTypingIndicator(callback) {
    if (!this.socket) return;

    this.socket.on('chat:typing-indicator', (data) => {
      callback(data);
    });
  }

  sendTypingIndicator(conversationId, isTyping) {
    if (!this.socket) return;

    this.socket.emit('chat:typing', {
      conversationId,
      isTyping
    });
  }

  sendMessageDelivered(messageId, conversationId, senderId) {
    if (!this.socket) return;

    this.socket.emit('chat:message-delivered', {
      messageId,
      conversationId,
      senderId
    });
  }

  sendMessageRead(messageId, conversationId, senderId) {
    if (!this.socket) return;

    this.socket.emit('chat:message-read', {
      messageId,
      conversationId,
      senderId
    });
  }

  onDeliveryStatus(callback) {
    if (!this.socket) return;

    this.socket.on('chat:delivery-status', (data) => {
      console.log('[SocketService] Delivery status update:', data);
      callback(data);
    });
  }

  onNewNotification(callback) {
    if (!this.socket) return;

    this.socket.on('notification:new', (notification) => {
      console.log('[SocketService] New notification received:', notification);
      callback(notification);
    });
  }

  off(eventName) {
    if (!this.socket) return;
    this.socket.off(eventName);
  }

  disconnect() {
    if (this.socket) {
      console.log('[SocketService] Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
