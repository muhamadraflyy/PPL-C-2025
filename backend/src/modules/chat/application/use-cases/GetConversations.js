/**
 * Get Conversations Use Case
 *
 * Ambil semua percakapan user.
 * Sort by last_message_at biar yang terbaru di atas.
 *
 * Steps:
 * 1. Ambil semua conversation dimana user adalah participant
 * 2. Include last message preview
 * 3. Include unread count
 * 4. Sort by last_message_at DESC
 */

class GetConversations {
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

  /**
   * @param {string} userId - ID user yang sedang login
   * @param {object} filters - { page, limit }
   */

  async execute(userId, filters = {}) {
    try {
      const { page = 1, limit = 20 } = filters;

      console.log('[GetConversations] Fetching conversations for user:', userId);

      const conversation = await this.conversationRepository.findByUserId(userId, {
        page,
        limit,
        order: 'DESC',
        includeOtherUser: true // PENTING: Include user1 dan user2 data
      });

      console.log('[GetConversations] Found', conversation.length, 'conversations');

      // IMPORTANT: Return raw conversation objects with user data
      // Frontend expects conversation.User1 and conversation.User2 format
      const result = conversation.map((conv, idx) => {
        // Debug first conversation
        if (idx === 0) {
          console.log('[GetConversations] First conversation user data:', {
            has_user1: !!conv.user1,
            has_user2: !!conv.user2,
            user1_data: conv.user1,
            user2_data: conv.user2
          });
        }
        
        // Helper function untuk safely serialize date
        const serializeDate = (dateValue) => {
          if (!dateValue) return null;
          try {
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? null : date.toISOString();
          } catch (e) {
            console.warn('[GetConversations] Invalid date value:', dateValue);
            return null;
          }
        };
        
        // Convert to plain object and rename user properties to match frontend expectation
        const mapped = {
          id: conv.id,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          pesan_terakhir: conv.pesan_terakhir,
          // Serialize Date to ISO string untuk frontend
          pesan_terakhir_pada: serializeDate(conv.pesan_terakhir_pada),
          user1_unread_count: conv.user1_unread_count,
          user2_unread_count: conv.user2_unread_count,
          // IMPORTANT: Add unified unread_count for frontend based on current user
          unread_count: conv.user1_id === userId ? conv.user1_unread_count : conv.user2_unread_count,
          created_at: serializeDate(conv.created_at),
          updated_at: serializeDate(conv.updated_at),
          // Frontend expects User1 and User2 (capitalized)
          // Extract profesi from freelancerProfile if exists
          User1: conv.user1 ? {
            ...conv.user1,
            profesi: conv.user1.freelancerProfile?.judul_profesi || null
          } : null,
          User2: conv.user2 ? {
            ...conv.user2,
            profesi: conv.user2.freelancerProfile?.judul_profesi || null
          } : null
        };
        
        if (idx === 0) {
          console.log('[GetConversations] Mapped result has User1?', !!mapped.User1);
          console.log('[GetConversations] Mapped result has User2?', !!mapped.User2);
        }
        
        return mapped;
      });

      console.log('[GetConversations] Mapped', result.length, 'conversations successfully');
      return result;
    } catch (error) {
      console.error('[GetConversations] Error in execute:', error);
      console.error('[GetConversations] Error stack:', error.stack);
      throw error;
    }
  }
}

module.exports = GetConversations;
