import Avatar from "../../Elements/Common/Avatar";
import { Text } from "../../Elements/Text/Text";
import { useChatContext } from '../../../contexts/ChatContext';

export default function ConversationListItem({ conversation, isActive, onClick }) {
  const { onlineUsers } = useChatContext();
  
  // Debug log for isActive
  console.log(`[ConversationListItem] Rendering conv ${conversation.id}, isActive=${isActive}`);
  
  // Get other participant data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;
  
  // Format nama lengkap dari nama_depan dan nama_belakang
  const formatName = (user) => {
    if (!user) return 'Unknown User';
    return `${user.nama_depan || ''} ${user.nama_belakang || ''}`.trim() || 'Unknown User';
  };
  
  // Determine which user is the "other" participant
  const otherUser = conversation.user1_id === userId 
    ? conversation.User2 
    : conversation.User1;

  // Debug: Check if online status detection works
  if (otherUser?.id) {
    console.log('[ConversationListItem]', formatName(otherUser), '('+otherUser.id+')', 'Online?', onlineUsers.has(otherUser.id));
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInMs = now - date;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      } else if (diffInDays < 7) {
        return date.toLocaleDateString('id-ID', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
      }
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return '';
    }
  };

  // Truncate last message
  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return 'No messages yet';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <button 
      type="button"
      className={`
        w-full p-3 text-left transition-all duration-200 ease-in-out
        border-l-4 relative
        ${isActive 
          ? 'bg-blue-50 border-l-blue-500 shadow-sm' 
          : 'border-l-transparent hover:bg-gray-50 hover:border-l-gray-300 hover:shadow-sm'
        }
        ${!isActive && 'hover:translate-x-1'}
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset
      `}
      onClick={onClick}
    >
      <div className="flex gap-3 justify-between items-center w-full">
        <div className="flex gap-3 items-center flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <Avatar
              src={otherUser?.avatar || "https://placehold.co/200"}
              alt={formatName(otherUser)}
              size="lg"
            />
            {/* Online indicator - small green dot */}
            {otherUser && onlineUsers.has(otherUser.id) && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <Text variant="h2" className={`truncate ${isActive ? 'text-blue-700' : ''}`}>
              {formatName(otherUser)}
            </Text>
            <span className={`text-sm truncate ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
              {truncateMessage(conversation.pesan_terakhir)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end flex-shrink-0">
          <span className={`text-xs ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
            {formatTime(conversation.pesan_terakhir_pada || conversation.created_at)}
          </span>
          {conversation.unread_count > 0 && (
            <span className="px-2 py-0.5 mt-1 text-xs text-white bg-blue-500 rounded-full font-medium shadow-sm animate-pulse">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
      
      {/* Active indicator bar at bottom */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400"></div>
      )}
    </button>
  );
}

