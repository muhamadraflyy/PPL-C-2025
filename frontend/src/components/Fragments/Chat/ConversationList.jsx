import { useEffect } from 'react';
import ConversationListItem from "../../Fragments/Chat/ConversationListItem";
import { useChatContext } from '../../../contexts/ChatContext';

export default function ConversationList() {
  const { conversations, isLoading, fetchConversations, selectConversation, activeConversation } = useChatContext();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 rounded-full border-4 border-blue-500 animate-spin border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center p-6 h-full">
        <div className="text-center text-gray-500">
          <svg className="mx-auto mb-3 w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="mb-1 text-base font-medium text-gray-700">No Conversations</h3>
          <p className="text-sm text-gray-500">Start chatting with freelancers!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto space-y-1 h-full">
      {conversations.map((conversation) => {
        const isActive = activeConversation?.id === conversation.id;
        console.log(`[ConversationList] Conv ${conversation.id} active? ${isActive} (activeConvId: ${activeConversation?.id})`);
        return (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isActive={isActive}
            onClick={() => selectConversation(conversation)}
          />
        );
      })}
    </div>
  );
}