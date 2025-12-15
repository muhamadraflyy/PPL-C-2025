import api from '../../utils/axiosConfig';

class ChatService {
  async getConversations(page = 1, limit = 20) {
    try {
      const response = await api.get('/chat/conversations', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('[ChatService] Error getting conversations:', error);
      throw error;
    }
  }

  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('[ChatService] Error getting messages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId, pesan, tipe = 'text', lampiran = null) {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
        pesan,
        tipe,
        lampiran
      });
      return response.data;
    } catch (error) {
      console.error('[ChatService] Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(conversationId) {
    try {
      const response = await api.patch(`/chat/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      console.error('[ChatService] Error marking as read:', error);
      throw error;
    }
  }

  async createOrGetConversation(user2Id) {
    try {
      const response = await api.post('/chat/conversations', {
        user2_id: user2Id
      });
      return response.data;
    } catch (error) {
      console.error('[ChatService] Error creating conversation:', error);
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('[ChatService] Error uploading file:', error);
      throw error;
    }
  }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService;
