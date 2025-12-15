import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/Chat/socketService';
import chatService from '../services/Chat/chatService';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Inisialisasi koneksi socket saat component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('[ChatContext] Initializing socket connection');
      socketService.connect();
      
      // Cek status koneksi
      const checkConnection = setInterval(() => {
        setIsConnected(socketService.isConnected());
      }, 1000);

      return () => {
        clearInterval(checkConnection);
      };
    }
  }, []);

  // Setup listener socket untuk pesan baru
  useEffect(() => {
    if (!socketService.socket) return;

    // Dengarkan pesan baru
    socketService.onNewMessage((message) => {
      console.log('[ChatContext] New message received:', message);
      
      const conversationId = message.percakapan_id;
      
      // Add message to state
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), message]
      }));

      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId
            ? { 
                ...conv, 
                pesan_terakhir: message.pesan || message.isi_pesan,
                pesan_terakhir_pada: message.created_at || new Date().toISOString()
              }
            : conv
        )
      );

      // Send delivered confirmation if user is viewing this conversation
      if (activeConversation?.id === conversationId) {
        socketService.sendMessageDelivered(
          message.id,
          conversationId,
          message.pengirim_id
        );
      }
    });

    // Dengarkan indikator typings
    socketService.onTypingIndicator((data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));

      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: false
          }));
        }, 3000);
      }
    });

    // Listen for delivery status updates
    socketService.onDeliveryStatus((data) => {
      console.log('[ChatContext] Delivery status update:', data);
      
      const { messageId, conversationId, status } = data;
      
      // Update message status in state
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg =>
          msg.id === messageId
            ? { ...msg, status, is_read: status === 'read' }
            : msg
        )
      }));
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.off('chat:new-message');
      socketService.off('chat:typing-indicator');
      socketService.off('chat:delivery-status');
    };
  }, [activeConversation]);

  const fetchConversations = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const response = await chatService.getConversations(page, limit);
      
      // Check if response has valid data
      if (response.data && Array.isArray(response.data)) {
        setConversations(response.data);
      } else {
        console.warn('[ChatContext] Invalid response format, setting empty array');
        setConversations([]);
      }
      
      return response;
    } catch (error) {
      console.error('[ChatContext] Error fetching conversations:', error);
      
      // Handle backend errors gracefully
      if (error.response?.status === 500) {
        console.error('[ChatContext] Backend error 500 - Chat feature may not be fully configured');
        console.error('[ChatContext] Please contact backend developer to fix model associations');
      }
      
      // Set empty conversations instead of crashing
      setConversations([]);
      
      // Don't throw - let UI show empty state
      return { data: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId, page = 1, limit = 50) => {
    setIsLoading(true);
    try {
      const response = await chatService.getMessages(conversationId, page, limit);
      
      // Store messages in state
      setMessages(prev => ({
        ...prev,
        [conversationId]: response.data?.messages || []
      }));

      return response;
    } catch (error) {
      console.error('[ChatContext] Error fetching messages:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId, pesan, tipe = 'text', lampiran = null) => {
    try {
      // Try socket first (real-time)
      if (socketService.isConnected()) {
        return new Promise((resolve, reject) => {
          socketService.sendMessage(conversationId, pesan, tipe, lampiran, (response) => {
            if (response.status === 'success') {
              resolve(response);
            } else {
              reject(new Error(response.message));
            }
          });
        });
      } else {
        // Fallback to REST API
        console.log('[ChatContext] Socket not connected, using REST API');
        const response = await chatService.sendMessage(conversationId, pesan, tipe, lampiran);
        
        // Manually add to messages state
        if (response.data) {
          setMessages(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), response.data]
          }));
        }
        
        return response;
      }
    } catch (error) {
      console.error('[ChatContext] Error sending message:', error);
      throw error;
    }
  }, []);

  const markAsRead = useCallback(async (conversationId) => {
    try {
      await chatService.markAsRead(conversationId);
      
      // Update local state
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg => ({
          ...msg,
          is_read: true
        }))
      }));
    } catch (error) {
      console.error('[ChatContext] Error marking as read:', error);
      throw error;
    }
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    
    // Join socket room
    if (socketService.isConnected() && conversation?.id) {
      socketService.joinConversation(conversation.id);
    }
    
    // Fetch messages if not loaded
    if (conversation?.id && !messages[conversation.id]) {
      await fetchMessages(conversation.id);
    }
    
    // Mark as read
    if (conversation?.id) {
      await markAsRead(conversation.id);
    }
  }, [fetchMessages, markAsRead, messages]);

  const createOrGetConversation = useCallback(async (user2Id) => {
    try {
      console.log('[ChatContext] Creating conversation with user:', user2Id);
      const response = await chatService.createOrGetConversation(user2Id);
      console.log('[ChatContext] API Response:', response);
      
      // Backend bisa return format berbeda, handle keduanya
      const conversation = response.data?.conversation || response.data;
      
      console.log('[ChatContext] Conversation data:', conversation);
      
      if (!conversation || !conversation.id) {
        throw new Error('Invalid conversation data received');
      }
      
      // Add to conversations list if not exists
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        if (exists) {
          console.log('[ChatContext] Conversation already exists, updating');
          return prev.map(c => c.id === conversation.id ? conversation : c);
        }
        console.log('[ChatContext] Adding new conversation to list');
        return [conversation, ...prev];
      });
      
      return conversation;
    } catch (error) {
      console.error('[ChatContext] Error creating conversation:', error);
      console.error('[ChatContext] Error response:', error.response?.data);
      throw error;
    }
  }, []);

  const sendTypingIndicator = useCallback((conversationId, isTyping) => {
    if (socketService.isConnected()) {
      socketService.sendTypingIndicator(conversationId, isTyping);
    }
  }, []);

  const value = {
    conversations,
    messages,
    activeConversation,
    typingUsers,
    isLoading,
    isConnected,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markAsRead,
    selectConversation,
    createOrGetConversation,
    sendTypingIndicator
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
