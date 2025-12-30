
const SequelizeConversationRepository = require('../../infrastructure/repositories/SequelizeConversationRepository');
const SequelizeMessageRepository = require('../../infrastructure/repositories/SequelizeMessageRepository');
const GetConversations = require('../../application/use-cases/GetConversations');
const GetMessages = require('../../application/use-cases/GetMessages');
const SequelizeUserRepository = require('../../../user/infrastructure/repositories/SequelizeUserRepository');
const EmailService = require('../../../payment/infrastructure/services/EmailService');
const EmailNotificationService = require('../../infrastructure/services/EmailNotificationService');
const SendMessage = require('../../application/use-cases/SendMessage');
const MarkAsRead = require('../../application/use-cases/MarkAsRead');

class ChatController {
  constructor(sequelize, socketService) {
    this.sequelize = sequelize;
    this.socketService = socketService;

    // Inisialisasi repository
    this.conversationRepository = new SequelizeConversationRepository(sequelize);
    this.messageRepository = new SequelizeMessageRepository(sequelize);
    this.userRepository = new SequelizeUserRepository(sequelize);
    this.emailService = new EmailService(/* dependencies EmailService, misal: new Mailer() */);
    this.notificationService = new EmailNotificationService(this.userRepository, this.emailService);

    // Inisialisasi use case
    this.getConversationsUseCase = new GetConversations(this.conversationRepository);
    this.getMessagesUseCase = new GetMessages(this.messageRepository, this.conversationRepository);

    // Inisialisasi MarkAsRead
    this.markAsReadUseCase = new MarkAsRead(
      this.messageRepository,
      this.conversationRepository,
      this.socketService
    );

    this.sendMessageUseCase = new SendMessage(
      this.messageRepository,
      this.conversationRepository,
      this.socketService,
      this.notificationService,
      this.userRepository
    );
  }

  /**
   * Get all conversations for logged in user
   * GET /api/chat/conversations
   */
  async getConversations(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        console.error('[ChatController] userId not found in req.user:', req.user);
        return res.status(401).json({
          status: 'error',
          message: 'Autentikasi gagal. Silakan login kembali.'
        });
      }

      console.log('[ChatController] Getting conversations for user:', userId);
      
      // Convert query params to integers (req.query values are always strings)
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      
      const conversations = await this.getConversationsUseCase.execute(userId, { page, limit });
      
      console.log('[ChatController] Retrieved', conversations.length, 'conversations');
      
      // Debug: Check if first conversation has User1/User2 data
      if (conversations.length > 0) {
        console.log('[ChatController] First conversation:', {
          id: conversations[0].id,
          has_User1: !!conversations[0].User1,
          has_User2: !!conversations[0].User2,
          User1: conversations[0].User1,
          User2: conversations[0].User2
        });
      }
      
      // Prevent caching - always get fresh data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).json({
        status: 'success',
        data: conversations
      });

    } catch (error) {
      console.error('[ChatController] Error getting conversations:', error);
      console.error('[ChatController] Error stack:', error.stack);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil daftar percakapan',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get messages in a conversation
   * GET /api/chat/conversations/:id/messages
   */
  async getMessages(req, res) {
    try {
      const { id: percakapanId } = req.params;
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const data = await this.getMessagesUseCase.execute(
        userId,
        percakapanId,
        { page, limit }
      );

      return res.status(200).json({
        status: 'success',
        data: data
      });

    } catch (error) {
      console.error('Error getting messages:', error);
      // Handel error spesifiknya
      if (error.message === 'Percakapan tidak ditemukan') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      if (error.message === 'Anda bukan bagian dari percakapan ini') {
        return res.status(403).json({ status: 'error', message: error.message });
      }
      // Error  umumnya
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal Server Error'
      });
    }
  }


  /**
   * Send message
   * POST /api/chat/conversations/:id/messages
   */
  async sendMessage(req, res) {
    try {
      const { id: percakapanId } = req.params;
      const userId = req.user.userId;
      const { pesan, tipe = 'text', lampiran = null } = req.body;

      if (!pesan && tipe == 'text') {
        return res.status(400).json({ status: 'error', message: 'Pesan teks tidak boleh kosong' });

      }

      const messageData = { pesan, tipe, lampiran };
      const newMessage = await this.sendMessageUseCase.execute(userId, percakapanId, messageData);

      // Helper untuk safely serialize date
      const serializeDate = (dateValue) => {
        if (!dateValue) return null;
        try {
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date.toISOString();
        } catch (e) {
          return null;
        }
      };

      // Serialize date fields untuk frontend
      const serializedMessage = {
        ...newMessage,
        created_at: serializeDate(newMessage.created_at),
        updated_at: serializeDate(newMessage.updated_at)
      };

      return res.status(201).json({
        status: 'success',
        data: serializedMessage
      });

    } catch (error) {
      console.error('Error sending message:', error)
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  /**
   * Mark messages as read
   * PATCH /api/chat/conversations/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id: percakapanId } = req.params;
      const userId = req.user.userId;

      await this.markAsReadUseCase.execute(percakapanId, userId);

      return res.status(200).json({
        status: 'success',
        message: 'Pesan berhasil ditandai sebagai terbaca'
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      if (error.message.includes('Percakapan')) {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Internal Server Error'
      });
    }
  }

  /**
   * Create or get conversation with another user
   * POST /api/chat/conversations
   */
  async createConversation(req, res) {
    try {
      const { user2_id } = req.body;
      const user1_id = req.user?.userId;

      // Enhanced validation
      if (!user1_id) {
        console.error('[ChatController] user1_id not found in req.user:', req.user);
        return res.status(401).json({ 
          status: 'error', 
          message: 'Autentikasi gagal. Silakan login kembali.' 
        });
      }

      if (!user2_id) {
        console.error('[ChatController] user2_id missing from request body');
        return res.status(400).json({ 
          status: 'error', 
          message: 'user2_id diperlukan' 
        });
      }

      // Prevent self-conversation
      if (user1_id === user2_id) {
        console.warn('[ChatController] User trying to create conversation with self:', user1_id);
        return res.status(400).json({ 
          status: 'error', 
          message: 'Tidak dapat membuat percakapan dengan diri sendiri' 
        });
      }

      console.log('[ChatController] Creating conversation:', { user1_id, user2_id });

      const conversation = await this.conversationRepository.createOrFind(user1_id, user2_id);

      console.log('[ChatController] Conversation created/found:', conversation.id);

      return res.status(200).json({
        status: 'success',
        message: 'percakapan berhasil ditemukan atau dibuat',
        data: conversation
      });

    } catch (error) {
      console.error('[ChatController] Error creating conversation:', error);
      console.error('[ChatController] Error stack:', error.stack);
      
      // Handle specific Sequelize errors
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
          status: 'error',
          message: 'User ID tidak valid atau tidak ditemukan'
        });
      }

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          status: 'error',
          message: 'Data tidak valid: ' + error.message
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Gagal membuat percakapan. Silakan coba lagi.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Upload file/image for chat
   * POST /api/chat/upload
   */
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }

      const fileUrl = `/chat-attachments/${req.file.filename}`;
      const fileData = {
        url: fileUrl,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };

      return res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: fileData
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = ChatController;
