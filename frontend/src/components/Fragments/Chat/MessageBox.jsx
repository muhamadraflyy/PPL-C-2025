import { useState, useEffect, useRef } from 'react';
import Avatar from "../../Elements/Common/Avatar";
import Button from "../../Elements/Buttons/Button";
import MessageBubble from "./MessageBubble";
import { Text } from "../../Elements/Text/Text";
import { useChatContext } from '../../../contexts/ChatContext';

export default function MessageBox({ userData }) {
  const { 
    activeConversation, 
    messages, 
    sendMessage, 
    sendTypingIndicator,
    typingUsers,
    isConnected,
    onlineUsers
  } = useChatContext();
  
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;

  // Get conversation messages
  const conversationMessages = activeConversation?.id 
    ? messages[activeConversation.id] || []
    : [];

  // Get other participant
  const otherUser = activeConversation 
    ? (activeConversation.user1_id === userId ? activeConversation.User2 : activeConversation.User1)
    : null;
  
  // Debug log untuk cek otherUser
  console.log('[MessageBox] Other user:', otherUser);
  console.log('[MessageBox] User ID:', otherUser?.id, 'Role:', otherUser?.role);

  // Format nama lengkap dari nama_depan dan nama_belakang
  const formatName = (user) => {
    if (!user) return 'Unknown User';
    return `${user.nama_depan || ''} ${user.nama_belakang || ''}`.trim() || 'Unknown User';
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator
    if (activeConversation?.id) {
      sendTypingIndicator(activeConversation.id, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(activeConversation.id, false);
      }, 3000);
    }
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !activeConversation?.id || isSending) {
      return;
    }

    setIsSending(true);
    
    try {
      await sendMessage(activeConversation.id, messageInput.trim());
      setMessageInput('');
      
      // Stop typing indicator
      if (activeConversation?.id) {
        sendTypingIndicator(activeConversation.id, false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // If no conversation selected
  if (!activeConversation) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full bg-gray-50">
        <svg className="mb-4 w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <Text variant="h2" className="text-gray-400">Select a conversation to start chatting</Text>
        <Text className="text-sm text-gray-400 mt-2">Choose a conversation from the list</Text>
      </div>
    );
  }

  // Debug: Log data untuk troubleshooting
  console.log('[MessageBox] Active conversation:', activeConversation);
  console.log('[MessageBox] Other user:', otherUser);
  console.log('[MessageBox] User ID:', userId);
  console.log('[MessageBox] Is connected:', isConnected);

  // Check if otherUser data is missing
  if (!otherUser) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full bg-gray-50">
        <div className="text-center p-6">
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">⚠️ Loading conversation data...</p>
            <p className="text-xs text-yellow-700 mt-2">
              Conversation ID: {activeConversation.id}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Please wait or try refreshing the page
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  // Check if other user is typing
  const isOtherUserTyping = otherUser && typingUsers[otherUser.id];

  const getDateLabel = (timestamp) => {
    if (!timestamp) return '';
    
    const messageDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const msgDate = new Date(messageDate);
    msgDate.setHours(0, 0, 0, 0);

    if (msgDate.getTime() === today.getTime()) {
      return "Hari ini";
    }

    if (msgDate.getTime() === yesterday.getTime()) {
      return "Kemarin";
    }

    return messageDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Group messages by date
  const groupedMessages = conversationMessages.reduce((acc, message) => {
    const messageDate = new Date(message.created_at).toLocaleDateString('id-ID');
    const lastGroup = acc[acc.length - 1];
    
    if (lastGroup && lastGroup.date === messageDate) {
      lastGroup.messages.push(message);
    } else {
      acc.push({ date: messageDate, messages: [message] });
    }
    return acc;
  }, []);

  return (
    <div className="flex relative flex-col w-full h-full bg-gray-200">
      {/* Header */}
      <div className="flex gap-2 items-center px-4 py-4 w-full rounded-none bg-primary-500/30 border-b">
        <div className="relative">
          <Avatar
            src={otherUser?.avatar || "https://placehold.co/200"}
            alt={formatName(otherUser)}
            size="lg"
          />
          {/* Online indicator - green dot */}
          {otherUser && onlineUsers.has(otherUser.id) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        <div className="flex flex-col flex-1">
          <Text variant="h2">{formatName(otherUser)}</Text>
          <span className="text-sm text-slate-500">
            {otherUser?.role === 'freelancer' ? otherUser?.profesi : 'Client'}
          </span>
          {/* Show typing indicator or online status below profession */}
          {isOtherUserTyping ? (
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-0.5">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </span>
              sedang mengetik...
            </span>
          ) : otherUser && onlineUsers.has(otherUser.id) ? (
            <span className="text-xs text-green-600 font-medium mt-0.5">● online</span>
          ) : (
            <span className="text-xs text-gray-500 mt-0.5">● offline</span>
          )}
          {!isConnected && (
            <span className="text-xs text-red-600">⚠️ Disconnected</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto flex-1 pb-20 min-h-0">
        {conversationMessages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400">
            <svg className="mb-2 w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <Text>No messages yet</Text>
            <Text className="text-sm">Send a message to start the conversation</Text>
          </div>
        ) : (
          <div className="px-4 pt-2">
            {groupedMessages.map((group, groupIndex) => (
              <ul key={groupIndex} className="flex flex-col">
                <li className="self-center">
                  <Text className="mx-auto my-4 text-sm text-gray-500">
                    {getDateLabel(group.messages[0].created_at)}
                  </Text>
                </li>
                {group.messages.map((message) => {
                  // Format timestamp dengan error handling
                  let timestamp = '';
                  try {
                    const date = new Date(message.created_at);
                    if (!isNaN(date.getTime())) {
                      timestamp = date.toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                    } else {
                      console.error('[MessageBox] Invalid date:', message.created_at);
                      timestamp = '';
                    }
                  } catch (error) {
                    console.error('[MessageBox] Error formatting timestamp:', error, message.created_at);
                    timestamp = '';
                  }

                  return (
                    <MessageBubble
                      key={message.id}
                      isSender={message.pengirim_id !== userId}
                      timestamp={timestamp}
                      isRead={message.is_read}
                      status={message.status || 'sent'}
                    >
                      {message.pesan}
                    </MessageBubble>
                  );
                })}
              </ul>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSendMessage} className="absolute bottom-0 px-2 pb-2 w-full bg-gray-200">
        <div className="flex gap-2 items-center">
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            className="py-3 pr-12 pl-4 w-full rounded-2xl shadow-md resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your message..."
            rows="1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={isSending || !isConnected}
          />
          <Button
            className="rounded-full !p-3 absolute right-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
            type="submit"
            disabled={isSending || !messageInput.trim() || !isConnected}
          >
            {isSending ? (
              <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}