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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

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

  // Setup listeners for online status - separate from message listeners
  // This needs to be registered as soon as socket connects, not dependent on activeConversation
  useEffect(() => {
    if (!socketService.socket) return;

    console.log('[ChatContext] Setting up online status listeners');

    // Dengarkan daftar online users saat pertama kali connect
    socketService.onUserOnlineList((data) => {
      console.log('[ChatContext] Received online users list:', data.users);
      setOnlineUsers(new Set(data.users));
    });

    // Dengarkan user online status
    socketService.onUserOnline((data) => {
      console.log('[ChatContext] User came online:', data.userId);
      setOnlineUsers(prev => {
        const newSet = new Set([...prev, data.userId]);
        console.log('[ChatContext] Online users:', Array.from(newSet));
        return newSet;
      });
    });

    // Dengarkan user offline status
    socketService.onUserOffline((data) => {
      console.log('[ChatContext] User went offline:', data.userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.off('user:online');
      socketService.off('user:online-list');
      socketService.off('user:offline');
    };
  }, []); // Empty dependency - register once when component mounts

  // Setup listener socket untuk pesan baru
  useEffect(() => {
    if (!socketService.socket) return;

    // Dengarkan pesan baru
    socketService.onNewMessage((message) => {
      console.log('[ChatContext] New message received:', message);
      
      const conversationId = message.percakapan_id;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.id;

      // WhatsApp pattern: Hanya tambahkan message dari USER LAIN
      // Message dari diri sendiri sudah ada via optimistic update
      if (message.pengirim_id === userId) {
        console.log('[ChatContext] Ignoring own message (already shown via optimistic update)');
        return;
      }
      
      // Cek duplikat - jangan tambah jika message ID sudah ada
      setMessages(prev => {
        const existingMessages = prev[conversationId] || [];
        const isDuplicate = existingMessages.some(msg => msg.id === message.id);
        
        if (isDuplicate) {
          console.log('[ChatContext] Duplicate message, ignoring:', message.id);
          return prev;
        }

        return {
          ...prev,
          [conversationId]: [...existingMessages, message]
        };
      });

      // Update conversation's last message, unread count, and move to top
      setConversations(prev => {
        const isViewingConversation = activeConversation?.id === conversationId;
        
        const updated = prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                pesan_terakhir: message.pesan || message.isi_pesan,
                pesan_terakhir_pada: message.created_at || new Date().toISOString(),
                // Increment unread count only if NOT viewing this conversation
                unread_count: isViewingConversation ? 0 : (conv.unread_count || 0) + 1
              }
            : conv
        );
        // Sort by latest message (newest first)
        return updated.sort((a, b) => {
          const dateA = new Date(a.pesan_terakhir_pada || 0);
          const dateB = new Date(b.pesan_terakhir_pada || 0);
          return dateB - dateA;
        });
      });

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
      console.log('[ChatContext] Typing indicator:', data);
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

    // Cleanup listeners on unmount (only chat-related, online status is in separate useEffect)
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
      
      // Set empty conversations instead of crashing
      setConversations([]);
      
      // Don't throw - let UI show empty state
      return { data: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId, page = 1, limit = 50) => {
    setIsLoadingMessages(true);
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
      setIsLoadingMessages(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId, pesan, tipe = 'text', lampiran = null) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.id;

      // OPTIMISTIC UPDATE: Tampilkan message segera (WhatsApp pattern)
      const optimisticMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        percakapan_id: conversationId,
        pengirim_id: userId,
        pesan,
        tipe,
        lampiran,
        status: 'sending',
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          id: userId,
          nama_depan: user.nama_depan,
          nama_belakang: user.nama_belakang,
          avatar: user.avatar
        }
      };

      // Langsung tambahkan ke UI
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimisticMessage]
      }));

      // Try socket first (real-time)
      if (socketService.isConnected()) {
        return new Promise((resolve, reject) => {
          socketService.sendMessage(conversationId, pesan, tipe, lampiran, (response) => {
            if (response.status === 'success') {
              console.log('[ChatContext] Message sent via socket, updating optimistic message');
              console.log('[ChatContext] Server response.data:', response.data);
              
              // Update optimistic message dengan data real dari server
              setMessages(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).map(msg => 
                  msg.id === optimisticMessage.id 
                    ? { 
                        ...response.data, 
                        status: 'sent',
                        // Preserve created_at dari optimistic jika server tidak kirim
                        created_at: response.data.created_at || msg.created_at
                      }
                    : msg
                )
              }));
              
              resolve(response);
            } else {
              // Hapus optimistic message jika gagal
              setMessages(prev => ({
                ...prev,
                [conversationId]: (prev[conversationId] || []).filter(msg => msg.id !== optimisticMessage.id)
              }));
              reject(new Error(response.message));
            }
          });
        });
      } else {
        // Fallback to REST API
        console.log('[ChatContext] Socket not connected, using REST API');
        const response = await chatService.sendMessage(conversationId, pesan, tipe, lampiran);
        
        // Update optimistic message dengan real data
        if (response.data) {
          setMessages(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).map(msg => 
              msg.id === optimisticMessage.id 
                ? { 
                    ...response.data, 
                    status: 'sent',
                    created_at: response.data.created_at || msg.created_at
                  }
                : msg
            )
          }));
        } else {
          // Hapus jika gagal
          setMessages(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(msg => msg.id !== optimisticMessage.id)
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
      
      // Update messages as read
      setMessages(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map(msg => ({
          ...msg,
          is_read: true
        }))
      }));

      // IMPORTANT: Update conversation list to clear unread badge
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0, user1_unread_count: 0, user2_unread_count: 0 }
          : conv
      ));

      // Dispatch event to notify NavHeader to refresh badge count
      window.dispatchEvent(new CustomEvent('chat:messages-read'));
      console.log('[ChatContext] Dispatched chat:messages-read event');
    } catch (error) {
      console.error('[ChatContext] Error marking as read:', error);
      throw error;
    }
  }, []);

  const selectConversation = useCallback(async (conversation) => {
    console.log('[ChatContext] selectConversation called with conv:', conversation?.id);
    setActiveConversation(conversation);
    console.log('[ChatContext] activeConversation set to:', conversation?.id);
    
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
    isLoadingMessages,
    isConnected,
    onlineUsers,
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
