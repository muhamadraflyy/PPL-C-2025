import Avatar from "../../Elements/Common/Avatar";
import Button from "../../Elements/Buttons/Button";
import { Text } from "../../Elements/Text/Text";

export default function ConversationListItem({ conversation, isActive, onClick }) {
  // Get other participant data
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id;
  
  // Determine which user is the "other" participant
  const otherUser = conversation.user1_id === userId 
    ? conversation.User2 
    : conversation.User1;

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
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
  };

  // Truncate last message
  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return 'No messages yet';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Button 
      variant={isActive ? "primary" : "neutral"} 
      className={`w-full rounded-none !justify-start ${isActive ? 'bg-blue-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex gap-2 justify-between items-center w-full">
        <div className="flex gap-2 items-center flex-1 min-w-0">
          <Avatar
            src={otherUser?.foto_profil || "https://placehold.co/200"}
            alt={otherUser?.nama_lengkap || "avatar"}
            size="lg"
          />
          <div className="flex flex-col flex-1 min-w-0">
            <Text variant="h2" className="truncate">
              {otherUser?.nama_lengkap || "Unknown User"}
            </Text>
            <span className="text-sm text-slate-500 truncate">
              {truncateMessage(conversation.pesan_terakhir)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400">
            {formatTime(conversation.pesan_terakhir_pada)}
          </span>
          {conversation.unread_count > 0 && (
            <span className="px-2 py-0.5 mt-1 text-xs text-white bg-blue-500 rounded-full">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Button>
  );
}
