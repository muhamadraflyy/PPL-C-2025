# Panduan Integrasi Frontend - Chat & Notification

**Module:** Chat & Notification System
**Backend Branch:** `be-chat`
**Target:** Tim Frontend
**Last Updated:** December 2025

---

## 📋 Daftar Isi

1. [Persiapan](#1-persiapan)
2. [Setup Koneksi](#2-setup-koneksi)
3. [Cara Pakai REST API](#3-cara-pakai-rest-api)
4. [Cara Pakai Socket.IO](#4-cara-pakai-socketio)
5. [Flow Lengkap](#5-flow-lengkap)
6. [Tips & Troubleshooting](#6-tips--troubleshooting)

---

## 1. Persiapan

### 1.1 Library yang Dibutuhkan

```bash
npm install socket.io-client axios
```

### 1.2 Informasi Server

**Development:**
- API URL: `http://localhost:5001/api`
- Socket URL: `http://localhost:5001`

**Production:**
- API URL: `https://api-ppl.vinmedia.my.id/api`
- Socket URL: `https://api-ppl.vinmedia.my.id`

### 1.3 Authentication

Semua request harus pakai **JWT Token** di header:
```
Authorization: Bearer <your-jwt-token>
```

Token didapat dari login user (Modul 1 - User Management).

---

## 2. Setup Koneksi

### 2.1 Setup HTTP Client (Axios)

Buat file `api.js` untuk handle HTTP request:

**Yang perlu dilakukan:**
- Set base URL ke backend API
- Auto-inject JWT token ke setiap request
- Handle error (401 → redirect login)

**Cara pakai:**
```javascript
// GET request
const response = await api.get('/chat/conversations');

// POST request
const response = await api.post('/chat/conversations', { user2_id: 'uuid-123' });
```

### 2.2 Setup Socket.IO Client

Buat file `socket.js` untuk handle real-time connection:

**Yang perlu dilakukan:**
- Connect ke socket server saat login
- Pass JWT token saat connect (di auth object)
- Disconnect saat logout

**Cara pakai:**
```javascript
// Connect
socketService.connect(token);

// Listen event
socket.on('chat:new-message', (message) => {
  // Handle new message
});

// Disconnect
socketService.disconnect();
```

---

## 3. Cara Pakai REST API

### 3.1 Chat Endpoints

#### A. List Semua Conversations
**Endpoint:** `GET /api/chat/conversations`

**Kapan dipanggil:**
- Saat buka halaman chat/inbox
- Untuk tampilkan daftar percakapan user

**Response yang didapat:**
```javascript
{
  status: "success",
  data: {
    conversations: [
      {
        id: "uuid-123",
        other_user: {
          id: "user-456",
          nama: "John Doe",
          foto_profil: "http://..."
        },
        pesan_terakhir: "Hello!",
        pesan_terakhir_pada: "2025-12-15T10:30:00.000Z",
        unread_count: 3
      }
    ]
  }
}
```

**Cara pakai:**
- Loop array conversations
- Tampilkan nama other_user, foto_profil, pesan_terakhir
- Tampilkan badge unread_count jika > 0

---

#### B. Buat/Dapatkan Conversation dengan User
**Endpoint:** `POST /api/chat/conversations`

**Body:**
```javascript
{
  user2_id: "uuid-user-target"
}
```

**Kapan dipanggil:**
- Saat user klik "Kirim Pesan" di profil freelancer
- Pertama kali mau chat dengan user baru

**Response:**
```javascript
{
  status: "success",
  data: {
    id: "uuid-conversation",
    user1_id: "current-user",
    user2_id: "target-user",
    created_at: "..."
  }
}
```

**Cara pakai:**
- Ambil `id` dari response
- Redirect ke halaman chat dengan conversationId

---

#### C. Load Messages (Chat History)
**Endpoint:** `GET /api/chat/conversations/:conversationId/messages`

**Query Params:**
- `limit`: Berapa banyak message (default: 50)
- `offset`: Mulai dari message ke berapa (untuk pagination)

**Kapan dipanggil:**
- Saat buka conversation/chat window
- Saat load more messages (scroll ke atas)

**Response:**
```javascript
{
  status: "success",
  data: {
    messages: [
      {
        id: "msg-1",
        percakapan_id: "conv-123",
        pengirim_id: "user-1",
        pesan: "Hello!",
        tipe: "text", // "text", "image", "file"
        lampiran: null, // atau { url: "...", filename: "..." }
        status: "read", // "sent", "delivered", "read"
        is_mine: true, // true jika kamu yang kirim
        created_at: "2025-12-15T10:30:00.000Z"
      }
    ],
    total: 100,
    limit: 50,
    offset: 0
  }
}
```

**Cara pakai:**
- Loop messages array
- Tampilkan di chat window (bubble kiri/kanan tergantung is_mine)
- Untuk load more: panggil lagi dengan offset += limit

---

#### D. Kirim Message
**Endpoint:** `POST /api/chat/conversations/:conversationId/messages`

**Body (text message):**
```javascript
{
  pesan: "Hello, are you available?",
  tipe: "text"
}
```

**Body (image/file message):**
```javascript
{
  pesan: "Check this out!",
  tipe: "image", // atau "file"
  lampiran: {
    filename: "image.jpg",
    url: "http://...",
    mimetype: "image/jpeg",
    size: 245678
  }
}
```

**Kapan dipanggil:**
- Saat user ketik pesan dan klik Send

**Response:**
```javascript
{
  status: "success",
  message: "Pesan berhasil dikirim",
  data: {
    id: "msg-123",
    pesan: "Hello!",
    status: "sent",
    created_at: "..."
  }
}
```

**Cara pakai:**
- Tampilkan message langsung di chat window
- Message akan muncul via Socket.IO juga (ke sender & receiver)

---

#### E. Upload File/Image
**Endpoint:** `POST /api/chat/upload`

**Content-Type:** `multipart/form-data`

**Body:**
- `file`: File binary (gambar/dokumen)

**Kapan dipanggil:**
- Sebelum kirim message tipe image/file
- User pilih file → upload dulu → baru kirim message

**Response:**
```javascript
{
  status: "success",
  data: {
    filename: "1234567890-image.jpg",
    url: "http://localhost:5001/chat-attachments/1234567890-image.jpg",
    mimetype: "image/jpeg",
    size: 245678
  }
}
```

**Cara pakai:**
1. Upload file dulu
2. Ambil response.data (filename, url, mimetype)
3. Kirim message dengan lampiran response.data

---

#### F. Mark Messages as Read
**Endpoint:** `PATCH /api/chat/conversations/:conversationId/read`

**Kapan dipanggil:**
- Saat user buka conversation
- Otomatis mark semua unread messages jadi read

**Response:**
```javascript
{
  status: "success",
  message: "Messages marked as read"
}
```

**Cara pakai:**
- Panggil saat load conversation
- Unread count akan berkurang

---

### 3.2 Notification Endpoints

#### A. Get Notifications
**Endpoint:** `GET /api/notifications`

**Query Params:**
- `isRead`: `true` atau `false` (filter read/unread)
- `limit`: Berapa banyak (default: 20)
- `offset`: Pagination

**Kapan dipanggil:**
- Saat buka notification panel/dropdown
- Untuk tampilkan daftar notifikasi

**Response:**
```javascript
{
  status: "success",
  data: {
    notifications: [
      {
        id: "notif-1",
        tipe: "pesan_baru", // ada 7 tipe (lihat bawah)
        judul: "Pesan Baru dari John Doe",
        pesan: "Hello, are you available?",
        is_read: false,
        created_at: "2025-12-15T10:30:00.000Z"
      }
    ],
    total: 15,
    limit: 20,
    offset: 0
  }
}
```

**Tipe Notifikasi:**
1. `pesanan_baru` - New order
2. `pesanan_diterima` - Order accepted
3. `pesanan_ditolak` - Order rejected
4. `pesanan_selesai` - Order completed
5. `pembayaran_berhasil` - Payment success
6. `pesan_baru` - New message
7. `ulasan_baru` - New review

---

#### B. Get Unread Count
**Endpoint:** `GET /api/notifications/unread-count`

**Kapan dipanggil:**
- Untuk tampilkan badge angka notifikasi
- Auto-refresh setiap X detik (optional)

**Response:**
```javascript
{
  status: "success",
  data: {
    count: 5
  }
}
```

**Cara pakai:**
- Tampilkan di notification bell badge

---

#### C. Mark as Read
**Endpoint:** `PATCH /api/notifications/:notificationId/read`

**Kapan dipanggil:**
- Saat user klik notifikasi

**Response:**
```javascript
{
  status: "success",
  message: "Notification marked as read"
}
```

---

#### D. Mark All as Read
**Endpoint:** `PATCH /api/notifications/mark-all-read`

**Kapan dipanggil:**
- Saat user klik "Mark all as read"

---

#### E. Delete Notification
**Endpoint:** `DELETE /api/notifications/:notificationId`

**Kapan dipanggil:**
- Saat user swipe delete notifikasi

---

## 4. Cara Pakai Socket.IO

### 4.1 Connect & Disconnect

**Connect saat Login:**
```javascript
// Setelah login berhasil, dapat token
const token = response.data.token;

// Connect socket
socketService.connect(token);
```

**Disconnect saat Logout:**
```javascript
socketService.disconnect();
```

---

### 4.2 Events yang Harus di-Listen

#### A. New Message (`chat:new-message`)
**Kapan trigger:** Ada pesan baru masuk

**Payload:**
```javascript
{
  id: "msg-123",
  percakapan_id: "conv-456",
  pengirim_id: "user-789",
  pesan: "Hello!",
  tipe: "text",
  status: "sent",
  created_at: "..."
}
```

**Apa yang harus dilakukan:**
1. Cek apakah message untuk conversation yang sedang dibuka
2. Jika iya → tambahkan message ke chat window
3. Jika tidak → update conversation list (last message)
4. **PENTING:** Kirim delivery confirmation (lihat section 4.3)

---

#### B. Typing Indicator (`chat:typing-indicator`)
**Kapan trigger:** User lain sedang typing

**Payload:**
```javascript
{
  userId: "user-789",
  isTyping: true // atau false
}
```

**Apa yang harus dilakukan:**
- Tampilkan "User is typing..." di chat window
- Hide saat isTyping = false

---

#### C. Delivery Status (`chat:delivery-status`)
**Kapan trigger:** Message di-delivered atau di-read

**Payload:**
```javascript
{
  messageId: "msg-123",
  conversationId: "conv-456",
  status: "delivered", // atau "read"
  deliveredAt: "2025-12-15T10:31:00.000Z",
  readAt: "2025-12-15T10:32:00.000Z"
}
```

**Apa yang harus dilakukan:**
- Update status message di chat window
- Tampilkan checkmark (✓ = sent, ✓✓ = delivered/read)

---

#### D. New Notification (`notification:new`)
**Kapan trigger:** Ada notifikasi baru

**Payload:**
```javascript
{
  id: "notif-1",
  tipe: "pesan_baru",
  judul: "Pesan Baru",
  pesan: "You have a new message",
  created_at: "..."
}
```

**Apa yang harus dilakukan:**
1. Update unread count (+1)
2. Tampilkan toast/banner notification
3. Update notification list jika panel terbuka

---

### 4.3 Events yang Harus di-Emit

#### A. Join Conversation (`chat:join-conversation`)
**Kapan emit:** Saat buka conversation/chat window

**Payload:**
```javascript
socket.emit('chat:join-conversation', conversationId);
```

**Kenapa:** Agar socket tahu user ada di conversation mana, supaya bisa terima new message

---

#### B. Typing Indicator (`chat:typing`)
**Kapan emit:** Saat user lagi ketik

**Payload:**
```javascript
socket.emit('chat:typing', {
  conversationId: 'conv-123',
  isTyping: true // false saat stop typing
});
```

**Tips:**
- Emit `isTyping: true` saat user mulai ketik
- Emit `isTyping: false` setelah 2 detik tidak ada input

---

#### C. Message Delivered Confirmation (`chat:message-delivered`)
**Kapan emit:** Setelah terima new message via socket

**Payload:**
```javascript
socket.emit('chat:message-delivered', {
  messageId: message.id,
  conversationId: message.percakapan_id,
  senderId: message.pengirim_id
});
```

**Kenapa:** Biar pengirim tahu message sudah delivered (checkmark ✓✓)

---

#### D. Message Read Confirmation (`chat:message-read`)
**Kapan emit:** Setelah user baca message (mark as read)

**Payload:**
```javascript
socket.emit('chat:message-read', {
  messageId: message.id,
  conversationId: message.percakapan_id,
  senderId: message.pengirim_id
});
```

---

## 5. Flow Lengkap

### 5.1 Flow: Kirim Pesan Text

```
User → Input text → Klik Send
  ↓
POST /api/chat/conversations/:id/messages
  ↓
Message tersimpan di database
  ↓
Socket.IO emit 'chat:new-message' ke:
  - Sender (kamu)
  - Receiver (lawan bicara)
  ↓
Frontend terima event → Tampilkan message
  ↓
Receiver emit 'chat:message-delivered' (jika online)
  ↓
Sender terima 'chat:delivery-status' → Update checkmark
```

---

### 5.2 Flow: Kirim Pesan dengan File

```
User → Pilih file → Klik Send
  ↓
1. POST /api/chat/upload (upload file dulu)
  ↓
2. Dapat response: { filename, url, mimetype, size }
  ↓
3. POST /api/chat/conversations/:id/messages
   Body: {
     pesan: "Check this out!",
     tipe: "image",
     lampiran: { ... response dari upload ... }
   }
  ↓
4. Message dengan file tersimpan
  ↓
5. Socket.IO emit ke sender & receiver
  ↓
6. Tampilkan image/file di chat window
```

---

### 5.3 Flow: Buka Conversation

```
User → Klik conversation dari list
  ↓
1. GET /api/chat/conversations/:id/messages
   → Load 50 messages terakhir
  ↓
2. Tampilkan messages di chat window
  ↓
3. PATCH /api/chat/conversations/:id/read
   → Mark all as read
  ↓
4. socket.emit('chat:join-conversation', conversationId)
   → Join room untuk terima new messages
  ↓
5. socket.on('chat:new-message', handleNewMessage)
   → Listen new messages
```

---

### 5.4 Flow: Terima Message Baru

```
Socket.IO emit 'chat:new-message' dari server
  ↓
Frontend on('chat:new-message', (message) => { ... })
  ↓
1. Cek: Apakah message untuk conversation yang dibuka?
   - Jika YA: Tambahkan ke chat window
   - Jika TIDAK: Update conversation list (last message)
  ↓
2. Emit delivery confirmation:
   socket.emit('chat:message-delivered', {
     messageId: message.id,
     conversationId: message.percakapan_id,
     senderId: message.pengirim_id
   })
  ↓
3. Jika conversation dibuka → Auto mark as read:
   PATCH /api/chat/conversations/:id/read
```

---

### 5.5 Flow: Notifikasi

```
Backend create notification (dari modul lain)
  ↓
Socket.IO emit 'notification:new' ke user
  ↓
Frontend on('notification:new', (notif) => { ... })
  ↓
1. Update unread count (+1)
  ↓
2. Tampilkan toast/banner notification
  ↓
3. User klik notification
  ↓
4. PATCH /api/notifications/:id/read
  ↓
5. Navigate ke related page (order/chat/etc)
```

---

## 6. Tips & Troubleshooting

### 6.1 Best Practices

#### ✅ Pagination untuk Messages
- Load 50 messages pertama
- Saat scroll ke atas → load more dengan offset += 50
- Jangan load semua messages sekaligus (berat!)

#### ✅ Error Handling
- Wrap semua API call dengan try-catch
- Tampilkan error message yang user-friendly
- Handle 401 → redirect to login

#### ✅ Loading States
- Tampilkan loading indicator saat fetch data
- Disable button Send saat kirim message (prevent spam)

#### ✅ Socket Cleanup
- Jangan lupa `socket.off()` saat component unmount
- Disconnect socket saat logout

---

### 6.2 Troubleshooting

#### ❌ Socket tidak connect
**Problem:** Socket connection error

**Solusi:**
1. Cek token valid (belum expired)
2. Cek URL socket benar
3. Cek CORS setting backend

---

#### ❌ Message tidak muncul
**Problem:** Send message berhasil tapi tidak tampil

**Solusi:**
1. Pastikan sudah join conversation room (`chat:join-conversation`)
2. Pastikan listening ke event `chat:new-message`
3. Cek apakah message.percakapan_id sama dengan conversation yang dibuka

---

#### ❌ Duplicate messages
**Problem:** Message muncul 2x

**Solusi:**
1. Pastikan cleanup socket listener saat unmount
2. Jangan listen event multiple times

---

#### ❌ 401 Unauthorized
**Problem:** API return 401

**Solusi:**
1. Cek token masih valid
2. Cek header Authorization sudah diset
3. Re-login jika token expired

---

#### ❌ File upload gagal
**Problem:** Upload file error

**Solusi:**
1. Cek ukuran file (max 50MB)
2. Cek Content-Type header: `multipart/form-data`
3. Cek format file supported

---

## 7. Environment Variables

Buat file `.env` di frontend project:

```bash
# Development
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001

# Production
# REACT_APP_API_URL=https://api-ppl.vinmedia.my.id/api
# REACT_APP_SOCKET_URL=https://api-ppl.vinmedia.my.id
```

---

## 8. Quick Reference

### REST API Endpoints
```
Chat:
GET    /api/chat/conversations
POST   /api/chat/conversations
GET    /api/chat/conversations/:id/messages
POST   /api/chat/conversations/:id/messages
PATCH  /api/chat/conversations/:id/read
POST   /api/chat/upload

Notifications:
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/mark-all-read
DELETE /api/notifications/:id
```

### Socket.IO Events

**Emit (Frontend → Backend):**
```javascript
socket.emit('chat:join-conversation', conversationId)
socket.emit('chat:typing', { conversationId, isTyping })
socket.emit('chat:message-delivered', { messageId, conversationId, senderId })
socket.emit('chat:message-read', { messageId, conversationId, senderId })
```

**Listen (Backend → Frontend):**
```javascript
socket.on('chat:new-message', callback)
socket.on('chat:typing-indicator', callback)
socket.on('chat:delivery-status', callback)
socket.on('notification:new', callback)
```

---

## 📚 Resources

- **Backend API Docs (Swagger):** http://localhost:5001/api-docs
- **Test Pages (untuk referensi):** http://localhost:5001/test-u53r-0n3
- **Technical Report:** `MODULE_6_CHAT_NOTIFICATION_REPORT.md`
- **Socket.IO Client Docs:** https://socket.io/docs/v4/client-api/

---

## 📞 Need Help?

Jika ada kendala atau pertanyaan:
1. Cek API documentation di Swagger
2. Test dulu pakai test pages
3. Tanya tim backend jika ada error

---

**Document Version:** 1.0
**Last Updated:** December 15, 2025
**Prepared By:** Backend Development Team
