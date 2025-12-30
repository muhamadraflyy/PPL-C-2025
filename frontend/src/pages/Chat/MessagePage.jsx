import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MessageBox from "../../components/Fragments/Chat/MessageBox";
import ConversationList from "../../components/Fragments/Chat/ConversationList";
import Navbar from "../../components/Fragments/Common/Navbar";
import { ChatProvider, useChatContext } from "../../contexts/ChatContext";

function MessagesContent() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  const { 
    createOrGetConversation, 
    selectConversation, 
    conversations,
    fetchConversations 
  } = useChatContext();

  // Auto-create/select conversation if userId provided
  useEffect(() => {
    if (userId && user && !isCreatingConversation) {
      const initConversation = async () => {
        setIsCreatingConversation(true);
        try {
          console.log('[MessagesPage] Step 1: Creating conversation with user:', userId);
          
          // Create or get conversation
          const conversation = await createOrGetConversation(userId);
          console.log('[MessagesPage] Step 2: Conversation received:', conversation);
          
          // Hapus userId dari URL to prevent re-triggering
          setSearchParams({});
          
          // Tunggu conversations dimuat
          console.log('[MessagesPage] Step 3: Waiting for conversations to load...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refresh conversations list
          await fetchConversations();
          
          // Pilih percakapan
          console.log('[MessagesPage] Step 4: Selecting conversation:', conversation.id);
          await selectConversation(conversation);
          
          console.log('[MessagesPage] Step 5: Done! Conversation ready.');
        } catch (error) {
          console.error('[MessagesPage] Error:', error);
          console.error('[MessagesPage] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          
          alert('Failed to open chat. Error: ' + (error.response?.data?.message || error.message));
        } finally {
          setIsCreatingConversation(false);
        }
      };
      
      initConversation();
    }
  }, [userId, user?.id]);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <div className="flex gap-2 items-center px-5 py-3 border-b">
        <h1 className="text-xl font-bold">Messages</h1>
        {isCreatingConversation && (
          <span className="text-sm text-gray-500 ml-2">Opening chat...</span>
        )}
      </div>

      <div className="flex gap-1 flex-1 p-5 w-full min-h-0">
        <aside className="w-96 h-full min-h-0 bg-white rounded-lg shadow-sm border">
          <ConversationList />
        </aside>

        <main className="flex-1 h-full min-h-0 rounded-lg shadow-sm overflow-hidden">
          <MessageBox userData={user} />
        </main>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ChatProvider>
      <MessagesContent />
    </ChatProvider>
  );
}
