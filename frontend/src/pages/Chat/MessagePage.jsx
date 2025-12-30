import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MessageBox from "../../components/Fragments/Chat/MessageBox";
import ConversationList from "../../components/Fragments/Chat/ConversationList";
import Navbar from "../../components/Fragments/Common/Navbar";
import { ChatProvider, useChatContext } from "../../contexts/ChatContext";
import chatService from "../../services/Chat/chatService";

function MessagesContent() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const conversationId = searchParams.get('conversationId');
  const autoSelect = searchParams.get('autoSelect') !== 'false'; // default true
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  const { 
    createOrGetConversation, 
    selectConversation, 
    conversations,
    fetchConversations,
    fetchMessages 
  } = useChatContext();

  // Auto-select existing conversation if conversationId provided (from notification badge)
  useEffect(() => {
    if (conversationId && !isCreatingConversation) {
      const openConversation = async () => {
        setIsCreatingConversation(true);
        try {
          console.log('[MessagesPage] Opening conversation by ID:', conversationId);
          
          // ALWAYS fetch fresh conversations to get latest data
          await fetchConversations();
          
          // Wait a moment for state to update
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Now get from updated state - we need to access directly since state may not be fresh
          const response = await chatService.getConversations(1, 50);
          const freshConversations = response.data || [];
          
          // Find the conversation
          const conversation = freshConversations.find(c => c.id === conversationId);
          if (conversation) {
            // Force-fetch messages first to ensure we have latest
            await fetchMessages(conversationId);
            await selectConversation(conversation);
            console.log('[MessagesPage] Conversation selected with fresh messages:', conversation.id);
          } else {
            console.error('[MessagesPage] Conversation not found:', conversationId);
          }
          
          // Clear the param
          setSearchParams({});
        } catch (error) {
          console.error('[MessagesPage] Error opening conversation:', error);
        } finally {
          setIsCreatingConversation(false);
        }
      };
      
      openConversation();
    }
  }, [conversationId]);

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
          
          // Pilih percakapan HANYA jika autoSelect = true
          if (autoSelect) {
            console.log('[MessagesPage] Step 4: Selecting conversation:', conversation.id);
            await selectConversation(conversation);
            console.log('[MessagesPage] Step 5: Done! Conversation ready.');
          } else {
            console.log('[MessagesPage] Step 4: Skipping auto-select (autoSelect=false)');
            console.log('[MessagesPage] Step 5: Done! Conversation created but not selected.');
          }
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
          <span className="ml-2 text-sm text-gray-500">Opening chat...</span>
        )}
      </div>

      <div className="flex flex-1 gap-1 p-5 w-full min-h-0">
        <aside className="w-96 h-full min-h-0 bg-white rounded-lg border shadow-sm">
          <ConversationList />
        </aside>

        <main className="overflow-hidden flex-1 h-full min-h-0 rounded-lg shadow-sm">
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
