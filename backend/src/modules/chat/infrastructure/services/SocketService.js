/**
 * Socket.IO Service
 * Mengelola koneksi real-time, autentikasi, dan event emitting.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
    constructor() {
        this.onlineUsers = new Map();
        this.io = null;
        this.sendMessageUseCase = null;
    }

    /**
     * Inject SendMessage use case for socket event handling
     * @param {SendMessage} sendMessageUseCase
     */
    setSendMessageUseCase(sendMessageUseCase) {
        this.sendMessageUseCase = sendMessageUseCase;
    }

    async isUserOnline(userId) {
        return this.onlineUsers.has(userId);
    }

    /**
   * Inisialisasi Socket.IO server
   * @param {http.Server} httpServer - Server HTTP Express
   */

    init(httpServer) {
        // Allow multiple origins for Socket.IO
        const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5001",
            "http://localhost:5137",
            "https://api-ppl.vinmedia.my.id",
            "http://api-ppl.vinmedia.my.id",
            "https://bekenppl.vinmedia.my.id",
            "https://frontenppl.vinmedia.my.id"
        ];

        this.io = new Server(httpServer, {
            cors: {
                origin: (origin, callback) => {
                    // Allow requests with no origin (like mobile apps or curl requests)
                    if (!origin) return callback(null, true);

                    if (allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true
            }
        });

        this.setupMiddleware();
        this.setupEventHandlers();

        console.log('✅ Socket.IO Service Initialized');
        return this.io;
    }

    /**
   * Middleware untuk autentikasi socket
   */
    setupMiddleware() {
        this.io.use((socket, next) => {
            // 1. Coba ambil token dari 'auth' object (cara client modern)
            let token = socket.handshake.auth.token;

            // 2. JIKA GAGAL, coba ambil dari 'headers' 
            if (!token && socket.handshake.headers.authorization) {
                const authHeader = socket.handshake.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7); // Ambil token setelah "Bearer "
                }
            }

            // 3. Jika masih tidak ada token, tolak
            if (!token) {
                return next(new Error('Autentikasi gagal: Token tidak ditemukan (di auth/headers)'));
            }

            // 4. Verifikasi token
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                next();
            } catch (err) {
                next(new Error('Autentikasi gagal: Token tidak valid'));
            }
        });
    }

    /**
   * Setup listener untuk event dari client
   */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🎉 User connected: ${socket.userId}`);
            // Tambahkan ke daftar online users
            this.onlineUsers.set(socket.userId, socket.id);
            // user join room pribadi
            socket.join(`user:${socket.userId}`);
            
            // Broadcast ke semua user bahwa user ini online
            socket.broadcast.emit('user:online', {
                userId: socket.userId,
                timestamp: new Date()
            });
            
            // handle join room percakapan
            socket.on('chat:join-conversation', (percakapanId) => {
                socket.join(`conversation:${percakapanId}`);
                console.log(`User ${socket.userId} joined room conversation:${percakapanId}`);
            });

            // Handle 'Typing' indicator
            socket.on('chat:typing', (data) => {
                console.log(`[Socket] User ${socket.userId} typing status:`, data.isTyping, 'in conversation:', data.conversationId);
                socket.to(`conversation:${data.conversationId}`).emit('chat:typing-indicator', {
                    userId: socket.userId,
                    isTyping: data.isTyping
                });
            });

            // Handle message delivered confirmation
            socket.on('chat:message-delivered', (data) => {
                const { messageId, conversationId, senderId } = data;
                console.log(`[Socket] Message ${messageId} delivered to user ${socket.userId}`);

                // Notify sender that message was delivered
                if (senderId) {
                    this.io.to(`user:${senderId}`).emit('chat:delivery-status', {
                        messageId,
                        conversationId,
                        status: 'delivered',
                        deliveredAt: new Date()
                    });
                }
            });

            // Handle message read confirmation
            socket.on('chat:message-read', (data) => {
                const { messageId, conversationId, senderId } = data;
                console.log(`[Socket] Message ${messageId} read by user ${socket.userId}`);

                // Notify sender that message was read
                if (senderId) {
                    this.io.to(`user:${senderId}`).emit('chat:delivery-status', {
                        messageId,
                        conversationId,
                        status: 'read',
                        readAt: new Date()
                    });
                }
            });

            // Handle send message via socket (alternative to HTTP POST)
            socket.on('chat:send-message', async (data, callback) => {
                try {
                    const { conversationId, pesan, tipe = 'text', lampiran = null } = data;

                    // Validasi
                    if (!conversationId || (!pesan && tipe === 'text')) {
                        return callback?.({
                            status: 'error',
                            message: 'conversationId dan pesan wajib diisi'
                        });
                    }

                    console.log(`[Socket] User ${socket.userId} sending message to conversation ${conversationId}`);

                    // Call SendMessage use case if injected
                    if (this.sendMessageUseCase) {
                        const message = await this.sendMessageUseCase.execute(
                            socket.userId,
                            conversationId,
                            { pesan, tipe, lampiran }
                        );

                        callback?.({
                            status: 'success',
                            message: 'Pesan berhasil dikirim',
                            data: message
                        });
                    } else {
                        // Fallback jika use case belum di-inject
                        console.warn('[Socket] SendMessage use case not injected - message not saved to DB');
                        callback?.({
                            status: 'error',
                            message: 'SendMessage use case not configured. Please use REST API instead.'
                        });
                    }
                } catch (error) {
                    console.error('[Socket] Error handling chat:send-message:', error);
                    callback?.({
                        status: 'error',
                        message: error.message
                    });
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`🔌 User disconnected: ${socket.userId}`);
                // Hapus dari daftar online users
                this.onlineUsers.delete(socket.userId);
                
                // Broadcast ke semua user bahwa user ini offline
                socket.broadcast.emit('user:offline', {
                    userId: socket.userId,
                    timestamp: new Date()
                });
            });
        });
    }

    /**
   * Method untuk di-panggil dari Use Case (SendMessage)
   * @param {string} percakapanId
   * @param {object} message
   * @param {string} receiverId - ID penerima pesan (opsional)
   */
    emitNewMessage(percakapanId, message, receiverId = null) {
        console.log('[SocketService] emitNewMessage called:', {
            percakapanId,
            receiverId,
            senderId: message?.pengirim_id,
            messageId: message?.id,
            pesan: message?.pesan || message?.isi_pesan
        });

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

        // Serialize date fields to ISO string untuk frontend
        const serializedMessage = {
            ...message,
            created_at: serializeDate(message.created_at),
            updated_at: serializeDate(message.updated_at)
        };

        // WhatsApp pattern: Broadcast hanya ke RECEIVER, BUKAN ke sender
        // Sender sudah melihat message melalui optimistic update di frontend
        
        // Broadcast ke semua user di conversation room KECUALI pengirim
        if (message?.pengirim_id) {
            this.io.to(`conversation:${percakapanId}`).except(`user:${message.pengirim_id}`).emit('chat:new-message', serializedMessage);
            console.log(`[SocketService] Broadcast to conversation:${percakapanId} (excluding sender)`);
        }

        // Kirim ke room pribadi PENERIMA (backup jika belum join conversation room)
        if (receiverId && receiverId !== message?.pengirim_id) {
            this.io.to(`user:${receiverId}`).emit('chat:new-message', serializedMessage);
            console.log(`[SocketService] Emitted to receiver user:${receiverId}`);
        }

        // TIDAK kirim ke pengirim - mereka sudah punya optimistic update!
    }

    /**
   * Method untuk di-panggil dari Use Case (SendNotification)
   * @param {string} userId
   * @param {object} notification
   */
    emitNewNotification(userId, notification) {
        // Kirim notifikasi ke room pribadi user
        this.io.to(`user:${userId}`).emit('notification:new', notification);
    }
}

module.exports = new SocketService();
