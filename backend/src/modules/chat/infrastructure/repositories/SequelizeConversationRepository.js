/**
 * Sequelize Conversation Repository Implementation
 *
 * Important: Enforce unique constraint (user1_id, user2_id)
 * Di migration, tambahkan:
 * - UNIQUE index pada kombinasi user1_id dan user2_id
 * - Normalisasi: user1_id selalu < user2_id untuk konsistensi
 */

const Conversation = require('../../domain/entities/Conversation');
const { Op } = require('sequelize');

class SequelizeConversationRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Percakapan = sequelize.models.percakapan; // Sesuaikan jika nama model beda
    this.User = sequelize.models.users;
    this.ProfilFreelancer = sequelize.models.profil_freelancer;
  }

  async createOrFind(user1Id, user2Id) {
    try {
      // Validate input
      if (!user1Id || !user2Id) {
        throw new Error('user1Id and user2Id are required');
      }

      // Normalize IDs: ensure user1_id < user2_id for consistency
      const [userId1, userId2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

      console.log('[ConversationRepository] Creating/finding conversation:', { 
        original: { user1Id, user2Id },
        normalized: { userId1, userId2 }
      });

      // Use findOrCreate to avoid duplicates
      const [conversation, created] = await this.Percakapan.findOrCreate({
        where: {
          user1_id: userId1,
          user2_id: userId2
        },
        defaults: {
          user1_id: userId1,
          user2_id: userId2,
        },
        include: [
          { 
            model: this.User, 
            as: 'user1',
            attributes: ['id', 'nama_depan', 'nama_belakang', 'avatar', 'email']
          },
          { 
            model: this.User, 
            as: 'user2',
            attributes: ['id', 'nama_depan', 'nama_belakang', 'avatar', 'email']
          }
        ]
      });

      console.log('[ConversationRepository] Conversation result:', {
        id: conversation.id,
        created,
        user1_id: conversation.user1_id,
        user2_id: conversation.user2_id
      });

      return new Conversation(conversation.toJSON());
    } catch (error) {
      console.error('[ConversationRepository] Error in createOrFind:', error);
      console.error('[ConversationRepository] Error name:', error.name);
      console.error('[ConversationRepository] Error message:', error.message);
      throw error; // Re-throw to let controller handle it
    }
  }

  async findById(id) {
    // TODO: Implementasi find by ID
    // Include both users untuk info lawan bicara
    //
    const result = await this.Percakapan.findByPk(id, {
      include: [
        { model: this.User, as: 'user1' },
        { model: this.User, as: 'user2' }
      ]
    });

    if (!result) return null;
    return new Conversation(result.toJSON());

    // throw new Error('Not implemented - findByPk dengan include users');
  }

  async findByUserId(userId, options = {}) {
    try {
      console.log('[ConversationRepository] Finding conversations for user:', userId);
      console.log('[ConversationRepository] Options:', options);

      const where = {
        [Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ]
      };

      const result = await this.Percakapan.findAll({
        where,
        include: options.includeOtherUser ? [
          {
            model: this.User,
            as: 'user1',
            attributes: ['id', 'nama_depan', 'nama_belakang', 'avatar', 'role'],
            include: [{
              model: this.ProfilFreelancer,
              as: 'freelancerProfile',
              attributes: ['judul_profesi'],
              required: false
            }]
          },
          {
            model: this.User,
            as: 'user2',
            attributes: ['id', 'nama_depan', 'nama_belakang', 'avatar', 'role'],
            include: [{
              model: this.ProfilFreelancer,
              as: 'freelancerProfile',
              attributes: ['judul_profesi'],
              required: false
            }]
          }
        ] : [],
        order: [['pesan_terakhir_pada', options.order || 'DESC']],
        limit: options.limit || 20,
        offset: ((options.page || 1) - 1) * (options.limit || 20)
      });

      console.log('[ConversationRepository] Found', result.length, 'conversations');

      const conversations = result.map((r, idx) => {
        const jsonData = r.toJSON();
        
        // Debug: Check if user data exists in raw result
        if (idx === 0) {
          console.log('[ConversationRepository] Sample raw data:', {
            id: jsonData.id,
            user1_id: jsonData.user1_id,
            user2_id: jsonData.user2_id,
            hasUser1: !!jsonData.user1,
            hasUser2: !!jsonData.user2,
            user1Keys: jsonData.user1 ? Object.keys(jsonData.user1) : 'null',
            user2Keys: jsonData.user2 ? Object.keys(jsonData.user2) : 'null'
          });
        }
        
        return new Conversation(jsonData);
      });
      
      // Log first conversation for debugging
      if (conversations.length > 0) {
        console.log('[ConversationRepository] Sample conversation after entity creation:', {
          id: conversations[0].id,
          user1_id: conversations[0].user1_id,
          user2_id: conversations[0].user2_id,
          hasUser1: !!conversations[0].user1,
          hasUser2: !!conversations[0].user2
        });
      }

      return conversations;
    } catch (error) {
      console.error('[ConversationRepository] Error in findByUserId:', error);
      console.error('[ConversationRepository] Error name:', error.name);
      throw error;
    }

    // throw new Error('Not implemented - Query dengan OR condition untuk user1/user2');
  }

  async update(id, data) {
    // TODO: Implementasi update conversation
    await this.Percakapan.update(data, { where: { id } });
    const updateConversation = await this.Percakapan.findByPk(id);
    return new Conversation(updateConversation.toJSON());

    // throw new Error('Not implemented - Standard update');
  }

  async incrementUnreadCount(id, forUserId) {
    const conversation = await this.Percakapan.findByPk(id);
    if (!conversation) throw new Error('Conversation not found');

    const field = conversation.user1_id === forUserId ? 'user1_unread_count' : 'user2_unread_count';

    await conversation.increment(field);
  }

  async resetUnreadCount(id, userId) {
    const conversation = await this.Percakapan.findByPk(id);
    if (!conversation) return;

    const field = conversation.user1_id === userId ? 'user1_unread_count' : 'user2_unread_count';

    await conversation.update({ [field]: 0 });
  }
}

module.exports = SequelizeConversationRepository;
