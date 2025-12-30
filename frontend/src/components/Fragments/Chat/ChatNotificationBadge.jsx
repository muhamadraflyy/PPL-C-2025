import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Avatar from '../../Elements/Common/Avatar';
import socketService from '../../../services/Chat/socketService';
import chatService from '../../../services/Chat/chatService';

/**
 * ChatNotificationBadge - Shows a floating notification when new messages arrive
 * Features:
 * - Appears at top-center when new message received
 * - Shows sender avatar, name, message preview
 * - Quick reply input field
 * - Button to open full conversation
 * - Auto-hides after 10 seconds or on dismiss
 * 
 * NOTE: This component listens to socket events directly instead of using
 * ChatContext because it needs to work across all pages, not just /messages.
 */
export default function ChatNotificationBadge() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notification, setNotification] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Get current user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // Initialize socket connection when component mounts (this makes online status work site-wide)
  // This component is in Navbar which is present on all pages
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socketService.isConnected()) {
      console.log('[ChatNotificationBadge] Initializing socket connection for site-wide online status');
      socketService.connect();
    }
  }, []);

  // Listen for new messages via socket directly
  useEffect(() => {
    if (!socketService.socket) return;

    const handleNewMessage = async (message) => {
      console.log('[ChatNotificationBadge] New message received:', message);
      
      // Only show notification if message is from someone else
      if (message.pengirim_id === userId) {
        console.log('[ChatNotificationBadge] Ignoring own message');
        return;
      }

      // Don't show if user is on /messages page (they can see it there)
      if (location.pathname === '/messages') {
        console.log('[ChatNotificationBadge] User is on messages page, skipping notification');
        return;
      }

      try {
        // Fetch conversation to get sender info
        const response = await chatService.getConversations(1, 50);
        const conversations = response.data || [];
        const conversation = conversations.find(c => c.id === message.percakapan_id);
        
        if (conversation) {
          const sender = conversation.user1_id === userId 
            ? conversation.User2 
            : conversation.User1;
          
          showNotification({
            conversationId: message.percakapan_id,
            conversation,
            sender,
            message: message.pesan || message.isi_pesan,
            messageId: message.id
          });
        }
      } catch (error) {
        console.error('[ChatNotificationBadge] Error fetching conversation:', error);
      }
    };

    socketService.socket.on('chat:new-message', handleNewMessage);

    return () => {
      socketService.socket?.off('chat:new-message', handleNewMessage);
    };
  }, [userId, location.pathname]);

  const showNotification = (data) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setNotification(data);
    setIsVisible(true);
    setReplyText('');
    
    // Auto-hide after 10 seconds
    timeoutRef.current = setTimeout(() => {
      handleDismiss();
    }, 10000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setNotification(null);
      setReplyText('');
    }, 300); // Wait for animation
  };

  const handleQuickReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !notification?.conversationId || isSending) return;
    
    setIsSending(true);
    try {
      // Use chatService directly instead of context
      await chatService.sendMessage(notification.conversationId, replyText.trim());
      setReplyText('');
      handleDismiss();
    } catch (error) {
      console.error('Error sending quick reply:', error);
      alert('Gagal mengirim balasan. Coba lagi.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenConversation = () => {
    handleDismiss();
    // Navigate to messages with the conversation ID
    navigate(`/messages?conversationId=${notification?.conversationId}`);
  };

  const formatName = (user) => {
    if (!user) return 'Unknown';
    return `${user.nama_depan || ''} ${user.nama_belakang || ''}`.trim() || 'Unknown';
  };

  const truncateMessage = (text, maxLength = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!notification) return null;

  return (
    <div 
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        w-full max-w-md px-4
        transition-all duration-300 ease-out
        ${isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4 pointer-events-none'
        }
      `}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-white border-b">
          <div className="relative flex-shrink-0">
            <Avatar
              src={notification.sender?.avatar || "https://placehold.co/200"}
              alt={formatName(notification.sender)}
              size="md"
            />
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {formatName(notification.sender)}
            </p>
            <p className="text-xs text-blue-600 font-medium">Pesan baru</p>
          </div>
          
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Message preview */}
        <div className="px-4 py-3 bg-gray-50">
          <p className="text-sm text-gray-700">
            {truncateMessage(notification.message)}
          </p>
        </div>
        
        {/* Quick reply form */}
        <form onSubmit={handleQuickReply} className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Ketik balasan cepat..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !replyText.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {isSending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              )}
            </button>
          </div>
        </form>
        
        {/* Open conversation button */}
        <div className="p-3 pt-0">
          <button
            type="button"
            onClick={handleOpenConversation}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Buka Percakapan
          </button>
        </div>
      </div>
    </div>
  );
}
