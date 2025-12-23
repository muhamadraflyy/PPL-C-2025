# Update Dokumentasi Modul Payment Gateway

**Modul:** Modul 4 - Payment Gateway
**Status Implementasi:** **Sudah Pakai Midtrans Payment Gateway**
**Masalah:** Dokumentasi SRS masih pakai "Mock Payment Gateway"
**Tanggal:** 15 Desember 2025

---

## 📋 Ringkasan Eksekutif

Backend Modul 4 (Payment Gateway) **SUDAH PAKAI MIDTRANS PAYMENT GATEWAY**, bukan Mock. Tapi dokumentasi SRS masih ada ~10-15 referensi ke "Mock Payment Gateway" yang harus diupdate.

### Status Implementasi Saat Ini

| Komponen | Status | Lokasi File |
|----------|--------|-------------|
| Service Payment Gateway | ✅ **Midtrans** | `src/modules/payment/infrastructure/services/MidtransService.js` |
| Konfigurasi Environment | ✅ **Sudah Dikonfigurasi** | `.env` → `PAYMENT_GATEWAY=midtrans` |
| Kredensial | ✅ **Sudah Ada** | Midtrans Sandbox credentials configured |
| Mock Service | ⚠️ **Ada (Cuma Testing)** | `src/modules/payment/infrastructure/services/MockPaymentGatewayService.js` |

---

## 🔍 Perubahan Dokumentasi yang Diperlukan

### Dokumen Sumber
**File:** `docs/SRS Modul 4 - Analisis.pdf` (35 halaman)

### Ringkasan Perubahan
**Total Perubahan:** ~10-15 instance
**Bagian yang Terpengaruh:** 6 section utama

---

## 📝 Daftar Detail Perubahan

### 1. Section 2.1.1 - Tahapan Pembayaran Order (Halaman 7)

#### ❌ Saat Ini (Salah):
```
Step 8: "Sistem mengirim request pembayaran ke Mock Payment Gateway"
Step 9: "Mock Payment Gateway mengembalikan Payment URL dan instruksi pembayaran"
```

#### ✅ Harusnya:
```
Step 8: "Sistem mengirim request pembayaran ke Midtrans Payment Gateway"
Step 9: "Midtrans Payment Gateway mengembalikan Payment URL dan instruksi pembayaran"
```

**Alasan:** Backend pakai `MidtransService.createTransaction()` untuk bikin payment URL.

---

### 2. Section 2.3 - Software Requirements (Halaman 12-13)

#### ❌ Saat Ini (Salah):
```
SR-06: "Sistem harus dapat membuat payment URL dari Mock Payment Gateway
        untuk berbagai metode pembayaran (QRIS, Virtual Account, E-Wallet,
        Transfer Bank, Kartu Kredit)"
```

#### ✅ Harusnya:
```
SR-06: "Sistem harus dapat membuat payment URL dari Midtrans Payment Gateway
        untuk berbagai metode pembayaran (QRIS, Virtual Account, E-Wallet,
        Transfer Bank, Kartu Kredit)"
```

**Alasan:** Requirement pakai Midtrans API untuk generate payment URL dengan berbagai channel.

---

### 3. Section 3.1.1 - Use Case UC-01: Membuat Pembayaran (Halaman 18-19)

#### ❌ Saat Ini (Salah):
```
Main Flow:
6. Sistem mengirim request pembayaran ke Mock Payment Gateway dengan detail:
   - Transaction ID
   - Jumlah pembayaran
   - Metode pembayaran
   - Customer details
7. Mock Payment Gateway mengembalikan Payment URL dan instruksi pembayaran
8. Sistem menyimpan Payment URL dan status "menunggu"
```

#### ✅ Harusnya:
```
Main Flow:
6. Sistem mengirim request pembayaran ke Midtrans Payment Gateway dengan detail:
   - Transaction ID
   - Jumlah pembayaran
   - Metode pembayaran
   - Customer details
7. Midtrans Payment Gateway mengembalikan Payment URL dan instruksi pembayaran
8. Sistem menyimpan Payment URL dan status "menunggu"
```

**Referensi Kode:**
- File: `src/modules/payment/application/use-cases/CreatePayment.js` (baris 75-92)
- Method: `this.paymentGateway.createTransaction()`

---

### 4. Section 3.2 - Diagram Sekuens UC-01 (Halaman 29)

#### ❌ Saat Ini (Salah):
```
Entitas: "MockPayment Gateway"
```

#### ✅ Harusnya:
```
Entitas: "Midtrans Gateway" atau "PaymentGateway"
```

**Alasan:** Diagram harus reflect payment gateway yang beneran dipake.

**Detail Interaksi:**
1. Sistem → Midtrans: `createTransaction(params)`
2. Midtrans → Sistem: `{ payment_url, external_id, instructions }`
3. Midtrans → Sistem (webhook): `notification { status, transaction_id }`

---

### 5. Section 3.3.1 - Diagram Analisis Kelas UC-01 (Halaman 30)

#### ❌ Saat Ini (Salah):
```
<<Boundary>>: MockPayment Gateway
```

#### ✅ Harusnya:
```
<<Boundary>>: MidtransGateway
atau
<<Boundary>>: PaymentGateway
```

**Alasan:** Class diagram harus sesuai dengan service class yang actually dipake.

**Struktur Class:**
```
<<Boundary>> MidtransGateway
+ createTransaction(params): Object
+ getPaymentStatus(transactionId): Object
+ handleWebhook(notification): Object
```

---

### 6. Section 3.3.2 - Diagram Analisis Kelas UC-02 (Halaman 31)

#### ❌ Saat Ini (Salah):
```
<<Boundary>>: MockPayment Gateway
```

#### ✅ Harusnya:
```
<<Boundary>>: MidtransGateway
```

**Use Case:** UC-02 Verifikasi Pembayaran via Webhook

**Flow Webhook (Implementasi Asli):**
1. Midtrans kirim POST webhook ke `/api/payments/webhook`
2. Sistem verify signature hash
3. Sistem update payment status berdasarkan `transaction_status`
4. Kalau status = "settlement" → bikin escrow, update status order

**Referensi Kode:**
- File: `src/modules/payment/application/use-cases/VerifyPayment.js`
- Webhook Handler: `PaymentController.handleWebhook()` (baris 179)

---

### 7. Section 3.3.3 - Diagram Analisis Kelas UC-03 (Halaman 32)

#### ❌ Saat Ini (Salah):
```
<<Boundary>>: MockPayment Gateway
```

#### ✅ Harusnya:
```
<<Boundary>>: MidtransGateway
```

**Use Case:** UC-03 Release Escrow

**Catatan:** Release escrow ga perlu interaksi sama Payment Gateway. Yang perlu cuma update status escrow di database.

---

### 8. Section 3.3.4 - Diagram Analisis Kelas UC-04 (Halaman 33)

#### ❌ Saat Ini (Salah):
```
<<Boundary>>: MockPayment Gateway (if applicable)
```

#### ✅ Harusnya:
```
<<Boundary>>: MidtransGateway (if applicable)
atau HAPUS kalau ga relevan
```

**Use Case:** UC-04 Pencairan Dana

**Catatan:** Withdrawal ga pake Midtrans. Payment gateway ga terlibat dalam proses withdrawal karena admin transfer manual via bank.

**Flow Asli:**
1. Freelancer request withdrawal
2. Admin approve → manual bank transfer
3. Admin upload bukti transfer
4. Sistem tandai escrow jadi "completed"

**Rekomendasi:** Hapus referensi payment gateway dari UC-04 class diagram.

---

### 9. Section 3.3.5 - Diagram Analisis Kelas UC-05 (Halaman 34)

#### ❌ Saat Ini (Salah):
```
<<Boundary>>: MockPayment Gateway
```

#### ✅ Harusnya:
```
<<Boundary>>: MidtransGateway
```

**Use Case:** UC-05 Refund

**Flow Refund (Implementasi Asli):**
1. Client request refund via sistem
2. Admin approve/reject
3. Kalau approved → admin proses refund manual di Midtrans Dashboard
4. Admin update sistem dengan status refund

**Catatan:** Saat ini refund **semi-manual** (admin proses via Midtrans dashboard, belum fully automated via API).

---

## 🔧 Detail Implementasi

### Konfigurasi Environment

**File:** `backend/.env`

```env
# Production Gateway Selection
PAYMENT_GATEWAY=midtrans           # ← Nentuin gateway yang dipake
NODE_ENV=development

# Kredensial Midtrans
MIDTRANS_MERCHANT_ID=G799521996
MIDTRANS_SERVER_KEY=SB-Mid-server-5FHTcUDCpZq1g8TIgjgbas-4
MIDTRANS_CLIENT_KEY=SB-Mid-client-sySq1i7cCIQnCtxH
MIDTRANS_IS_PRODUCTION=false       # Mode Sandbox

# Mock Gateway (Development/Testing Only)
MOCK_AUTO_SUCCESS=true
MOCK_PAYMENT_SECRET=mock-secret-key-change-in-production
```

---

### Logika Pemilihan Gateway

**File:** `src/modules/payment/application/use-cases/CreatePayment.js`

```javascript
class CreatePayment {
  constructor() {
    // Switch antara Mock dan Midtrans berdasarkan environment
    const useRealGateway = process.env.PAYMENT_GATEWAY === 'midtrans' ||
                          process.env.NODE_ENV === 'production';

    this.paymentGateway = useRealGateway
      ? new MidtransService()              // ✅ PRODUCTION
      : new MockPaymentGatewayService();   // ⚠️ TESTING DOANG

    this.gatewayType = useRealGateway ? 'midtrans' : 'mock';

    console.log(`[PAYMENT] Using ${this.gatewayType} payment gateway`);
  }
}
```

**Logika:**
- Kalau `PAYMENT_GATEWAY=midtrans` ATAU `NODE_ENV=production` → Pakai **MidtransService**
- Kalau engga → Pakai **MockPaymentGatewayService**

**Status Sekarang:** `PAYMENT_GATEWAY=midtrans` → **PAKAI MIDTRANS** ✅

---

### File Service

| File | Ukuran | Tujuan | Status |
|------|--------|--------|--------|
| `MidtransService.js` | 11,835 bytes | **Payment gateway production** | ✅ **AKTIF** |
| `MockPaymentGatewayService.js` | 8,804 bytes | Testing & development | ⚠️ **TESTING DOANG** |

---

## 🧪 Penggunaan Mock Service

MockPaymentGatewayService **MASIH ADA** tapi **CUMA buat testing**:

### Endpoint Testing (PaymentController)

```javascript
// Manual trigger payment success (testing doang)
POST /api/payments/mock/trigger-success
Body: { transaction_id: "PAY-xxx" }

// Manual trigger payment failure (testing doang)
POST /api/payments/mock/trigger-failure
Body: { transaction_id: "PAY-xxx", reason: "Saldo tidak cukup" }
```

**Tujuan:** Memudahkan testing flow pembayaran tanpa charge payment beneran ke Midtrans.

**Rekomendasi:** **TETAP DISIMPAN** endpoint ini buat testing & QA.

---

## ✅ Yang Sudah Benar

### Section 1.6 - Referensi (Halaman 4-5)

✅ **SUDAH BENAR** - Ga perlu diubah

```
- Midtrans Payment Gateway API Documentation
- Xendit Payment Gateway API Documentation (alternatif)
```

Dokumentasi udah mention Midtrans, cuma di flow & diagram masih pakai "Mock".

---

## 📊 Tabel Ringkasan

| Section | Halaman | Teks Sekarang | Harusnya | Prioritas |
|---------|---------|---------------|----------|-----------|
| 2.1.1 Business Flow | 7 | Mock Payment Gateway (2x) | Midtrans Payment Gateway | TINGGI |
| 2.3 Requirements SR-06 | 12-13 | Mock Payment Gateway | Midtrans Payment Gateway | TINGGI |
| 3.1.1 UC-01 Skenario | 18-19 | Mock Payment Gateway (2x) | Midtrans Payment Gateway | TINGGI |
| 3.2 Diagram Sekuens | 29 | MockPayment Gateway (entitas) | Midtrans Gateway | SEDANG |
| 3.3.1 Diagram Kelas UC-01 | 30 | MockPayment Gateway | MidtransGateway | SEDANG |
| 3.3.2 Diagram Kelas UC-02 | 31 | MockPayment Gateway | MidtransGateway | SEDANG |
| 3.3.3 Diagram Kelas UC-03 | 32 | MockPayment Gateway | MidtransGateway | RENDAH |
| 3.3.4 Diagram Kelas UC-04 | 33 | MockPayment Gateway | Hapus (ga dipake) | RENDAH |
| 3.3.5 Diagram Kelas UC-05 | 34 | MockPayment Gateway | MidtransGateway | SEDANG |

**Total Perubahan:** 10-15 instance di 6 section

---

## 🎯 Rekomendasi

### 1. Update Dokumentasi (PRIORITAS TINGGI)

**Aksi:** Update dokumen SRS dengan find-and-replace:

| Cari | Ganti Jadi |
|------|------------|
| `Mock Payment Gateway` | `Midtrans Payment Gateway` |
| `MockPayment Gateway` | `Midtrans Gateway` |
| `MockPaymentGateway` (di class diagrams) | `MidtransGateway` atau `PaymentGateway` |

**Bagian yang Terpengaruh:**
- Business Process (2.1.1)
- Software Requirements (2.3)
- Use Case Scenarios (3.1.x)
- Sequence Diagrams (3.2)
- Class Analysis Diagrams (3.3.x)

### 2. Tetap Simpan Mock Service untuk Testing (DIREKOMENDASIKAN)

**Alasan:**
- Berguna buat development & testing tanpa charge payment beneran
- QA team bisa test success/failure scenarios dengan mudah
- Ga ada cost buat testing payment flows

**Aksi:** Tetap simpan `MockPaymentGatewayService.js` + testing endpoints

### 3. Tambahkan Note di Dokumentasi

**Saran:** Tambahin catatan di SRS Section 1.6 (References):

```
Catatan: Sistem menggunakan Midtrans Payment Gateway untuk production environment.
Mock Payment Gateway tersedia untuk keperluan testing dan development saja.
```

---

## 🔗 File Terkait

### Dokumentasi
- `docs/SRS Modul 4 - Analisis.pdf` - **PERLU DIUPDATE**

### File Implementasi
- `src/modules/payment/application/use-cases/CreatePayment.js` - Logika pemilihan gateway
- `src/modules/payment/application/use-cases/VerifyPayment.js` - Verifikasi webhook
- `src/modules/payment/infrastructure/services/MidtransService.js` - Production gateway
- `src/modules/payment/infrastructure/services/MockPaymentGatewayService.js` - Testing gateway
- `src/modules/payment/presentation/controllers/PaymentController.js` - API endpoints
- `.env` - Konfigurasi environment

---

## 📅 Riwayat Perubahan

| Tanggal | Perubahan | Oleh |
|---------|-----------|------|
| 15 Des 2025 | Dokumentasi semua update Mock → Midtrans yang diperlukan | Claude Code |
| 15 Des 2025 | Verifikasi backend pakai Midtrans gateway | Claude Code |

---

## ❓ Tanya Jawab

### Q: Kenapa MockPaymentGatewayService masih ada di codebase?
**A:** Buat testing. Ga dipake di production karena `PAYMENT_GATEWAY=midtrans` di `.env`.

### Q: Perlu hapus MockPaymentGatewayService ga?
**A:** **Ga disarankan**. Berguna buat:
- Unit testing tanpa charge payment beneran
- Testing development
- QA automation testing
- Demo

### Q: Gimana cara switch antara Mock dan Midtrans?
**A:** Ubah environment variable:
```env
# Production
PAYMENT_GATEWAY=midtrans

# Testing/Development
PAYMENT_GATEWAY=mock
# atau comment/hapus line PAYMENT_GATEWAY
```

### Q: Refund udah fully automated via API belum?
**A:** **Belum**. Sekarang refund semi-manual:
1. Client request via sistem
2. Admin approve via sistem
3. Admin manual proses refund di Midtrans Dashboard
4. Admin update refund status di sistem

**Enhancement Kedepan:** Automate refund via Midtrans Refund API.

---

## 🚀 Langkah Selanjutnya

1. ✅ **Verifikasi backend:** DONE - Confirmed pakai Midtrans
2. ⏳ **Update dokumentasi:** Update dokumen SRS (10-15 perubahan)
3. ⏳ **Review & approval:** Dapat approval stakeholder untuk dokumen yang diupdate
4. ⏳ **Version control:** Update nomor versi SRS setelah perubahan

---

## 📡 Dokumentasi Lengkap API Endpoints

### Overview
Total: **29 endpoints** di Payment Module

| Kategori | Jumlah Endpoints |
|----------|------------------|
| Payment Operations | 6 |
| Escrow Operations | 4 |
| Withdrawal Operations | 7 |
| Refund Operations | 4 |
| Analytics & Reporting | 5 |
| Testing (Mock) | 2 |
| Invoice | 2 |

---

## 💳 Payment Operations (6 endpoints)

### 1. Create Payment
**Endpoint:** `POST /api/payments/create`
**Auth:** Required (JWT)
**Controller Method:** `PaymentController.createPayment()` (line 47)

**Request Body:**
```json
{
  "pesanan_id": "uuid",
  "jumlah": 100000,
  "metode_pembayaran": "qris|virtual_account|e_wallet|transfer_bank|kartu_kredit",
  "channel": "bca|mandiri|gopay|ovo|shopeepay|etc",
  "order_title": "Jasa Design Logo",
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment_id": "uuid",
    "transaction_id": "PAY-1234567890-ABC123",
    "payment_url": "https://app.sandbox.midtrans.com/snap/v3/...",
    "total_bayar": 106000,
    "status": "menunggu",
    "expires_at": "2025-12-16T10:00:00.000Z",
    "payment_instructions": {...}
  }
}
```

**Fitur:**
- Auto-create order kalau belum ada (temporary workaround)
- Calculate platform fee (5%) + gateway fee (1%)
- Generate unique transaction ID format: `PAY-{timestamp}-{random}`
- Pakai **MidtransService** atau **MockPaymentGatewayService** sesuai env

---

### 2. Payment Webhook Handler
**Endpoint:** `POST /api/payments/webhook`
**Auth:** None (verified by signature)
**Controller Method:** `PaymentController.handleWebhook()` (line 179)

**Request Body (dari Midtrans):**
```json
{
  "transaction_status": "settlement|pending|expire|deny|cancel",
  "order_id": "PAY-1234567890-ABC123",
  "gross_amount": "106000.00",
  "signature_key": "...",
  "fraud_status": "accept"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and status updated"
}
```

**Fitur:**
- Verify payment via `VerifyPayment` use case
- Update payment status di database
- Auto-create escrow kalau payment berhasil
- Update order status jadi 'dibayar'

---

### 3. Get Payment by ID
**Endpoint:** `GET /api/payments/:id`
**Auth:** Required
**Controller Method:** `PaymentController.getPaymentById()` (line 199)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transaction_id": "PAY-xxx",
    "jumlah": 100000,
    "total_bayar": 106000,
    "status": "berhasil",
    "payment_url": "https://...",
    "created_at": "2025-12-15T10:00:00.000Z"
  }
}
```

---

### 4. Check Payment Status
**Endpoint:** `GET /api/payments/check-status/:transactionId`
**Auth:** Optional
**Controller Method:** `PaymentController.checkPaymentStatus()` (line 230)

**Parameter:**
- `transactionId` dapat berupa `transaction_id` atau payment `id` (UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "transaction_id": "PAY-xxx",
    "status": "berhasil",
    "redirect_url": "http://localhost:3000/payment/success?order_id=...",
    "amount": 106000,
    "created_at": "2025-12-15T10:00:00.000Z"
  }
}
```

**Fitur:**
- Query real-time status dari **Midtrans API** (kalau gateway = midtrans)
- Auto-update database kalau status berubah
- Generate invoice kalau payment berhasil
- Auto-create escrow
- Update order status
- Return redirect URL sesuai status payment

**Status Mapping:**
- `berhasil/paid/success/settlement` → `/payment/success`
- `menunggu/pending` → `/payment/pending`
- `kadaluarsa/expired` → `/payment/expired`
- `gagal/failed/deny/cancel` → `/payment/error`

---

### 5. Get Payment by Order ID
**Endpoint:** `GET /api/payments/order/:orderId`
**Auth:** Required
**Controller Method:** `PaymentController.getPaymentByOrderId()` (line 371)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pesanan_id": "order-uuid",
    "transaction_id": "PAY-xxx",
    "status": "berhasil",
    "jumlah": 100000
  }
}
```

---

### 6. Retry Failed Payment
**Endpoint:** `POST /api/payments/:id/retry`
**Auth:** Required
**Controller Method:** `PaymentController.retryPayment()` (line 1842)

**Request Body:**
```json
{
  "metode_pembayaran": "qris",
  "channel": "gopay"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment retry created",
  "data": {
    "old_payment_id": "uuid-1",
    "new_payment_id": "uuid-2",
    "payment_url": "https://...",
    "retry_count": 1,
    "transaction_id": "PAY-new-xxx"
  }
}
```

**Fitur:**
- Buat payment baru dari payment yang gagal
- Mark old payment as 'retry'
- Increment retry counter

---

## 🔒 Escrow Operations (4 endpoints)

### 7. Release Escrow
**Endpoint:** `POST /api/payments/escrow/release`
**Auth:** Required (Client/Admin)
**Controller Method:** `PaymentController.releaseEscrow()` (line 403)

**Request Body:**
```json
{
  "escrow_id": "uuid",
  "payment_id": "uuid",
  "reason": "Pekerjaan selesai dengan baik"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Escrow released successfully",
  "data": {
    "escrow_id": "uuid",
    "status": "released",
    "jumlah_ditahan": 100000,
    "dirilis_pada": "2025-12-20T10:00:00.000Z"
  }
}
```

**Authorization:**
- Client yang punya order bisa release
- Admin bisa release escrow apapun

---

### 8. Get Escrow by ID
**Endpoint:** `GET /api/payments/escrow/:id`
**Auth:** Required
**Controller Method:** `PaymentController.getEscrowById()` (line 464)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pembayaran_id": "uuid",
    "pesanan_id": "uuid",
    "jumlah_ditahan": 100000,
    "biaya_platform": 5000,
    "status": "ditahan|released|completed",
    "dirilis_pada": null,
    "created_at": "2025-12-15T10:00:00.000Z"
  }
}
```

---

### 9. Get All Escrows (Admin Only)
**Endpoint:** `GET /api/payments/escrow`
**Auth:** Required (Admin)
**Controller Method:** `PaymentController.getAllEscrows()` (line 494)

**Query Parameters:**
- `status` (optional): `ditahan|released|completed`
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "escrows": [
      {
        "id": "uuid",
        "transaction_id": "PAY-xxx",
        "payment_amount": 106000,
        "nomor_pesanan": "ORD-2025-123456",
        "order_title": "Jasa Design",
        "client_email": "client@example.com",
        "freelancer_email": "freelancer@example.com",
        "status": "ditahan"
      }
    ],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

---

### 10. Get Escrow Analytics (Role-Based)
**Endpoint:** `GET /api/payments/analytics/escrow`
**Auth:** Required
**Controller Method:** `PaymentController.getEscrowAnalytics()` (line 1176)

**Response (Freelancer/Client):**
```json
{
  "success": true,
  "data": {
    "active_escrow": {
      "count": 5,
      "total_amount": 500000
    },
    "breakdown_by_status": [
      { "status": "ditahan", "count": 3, "total_amount": 300000 },
      { "status": "released", "count": 2, "total_amount": 200000 }
    ],
    "role": "freelancer"
  }
}
```

**Fitur:**
- **Freelancer:** Lihat escrow untuk order mereka
- **Client:** Lihat escrow untuk order yang mereka pesan
- **Admin:** Lihat semua escrow

---

## 💰 Withdrawal Operations (7 endpoints)

### 11. Create Withdrawal Request
**Endpoint:** `POST /api/payments/withdraw`
**Auth:** Required (Freelancer)
**Controller Method:** `PaymentController.createWithdrawal()` (line 563)

**Request Body:**
```json
{
  "jumlah": 500000,
  "bank_name": "BCA",
  "nomor_rekening": "1234567890",
  "nama_pemilik": "John Doe",
  "metode_pencairan": "transfer_bank",
  "catatan": "Penarikan bulanan"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request created (2 transaksi)",
  "data": {
    "withdrawal_count": 2,
    "total_gross": 500000,
    "total_fee": 25000,
    "total_net": 475000,
    "withdrawals": [
      {
        "id": "uuid-1",
        "jumlah": 300000,
        "jumlah_bersih": 285000,
        "status": "pending"
      },
      {
        "id": "uuid-2",
        "jumlah": 200000,
        "jumlah_bersih": 190000,
        "status": "pending"
      }
    ],
    "status": "pending",
    "message": "Permintaan penarikan sedang menunggu persetujuan admin"
  }
}
```

**Fitur:**
- **Flexible withdrawal:** Bisa tarik partial atau multiple escrows
- **FIFO logic:** Ambil escrow paling lama dirilis duluan
- **Minimum:** Rp 50,000
- **Auto-split:** Kalau jumlah melebihi 1 escrow, otomatis split jadi multiple withdrawal
- Platform fee deduction otomatis

---

### 12. Get Withdrawal by ID
**Endpoint:** `GET /api/payments/withdrawals/:id`
**Auth:** Required
**Controller Method:** `PaymentController.getWithdrawalById()` (line 720)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "escrow_id": "uuid",
    "freelancer_id": "uuid",
    "jumlah": 500000,
    "biaya_platform": 25000,
    "jumlah_bersih": 475000,
    "metode_pencairan": "transfer_bank",
    "bank_account_number": "1234567890",
    "bank_account_name": "John Doe",
    "status": "pending|processing|completed|failed",
    "bukti_transfer": null,
    "created_at": "2025-12-15T10:00:00.000Z"
  }
}
```

---

### 13. Get Withdrawal History (User)
**Endpoint:** `GET /api/payments/withdrawal/history`
**Auth:** Required (Freelancer)
**Controller Method:** `PaymentController.getWithdrawalHistory()` (line 1920)

**Query Parameters:**
- `status` (optional): `pending|processing|completed|failed`
- `limit` (default: 50)
- `page` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": "uuid",
        "jumlah": 500000,
        "jumlah_bersih": 475000,
        "status": "completed",
        "bank_account_number": "1234567890",
        "bank_account_name": "John Doe",
        "created_at": "2025-12-15T10:00:00.000Z",
        "dicairkan_pada": "2025-12-16T10:00:00.000Z"
      }
    ],
    "totalPages": 10,
    "totalItems": 500,
    "currentPage": 1
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 500
  }
}
```

---

### 14. Get Pending Withdrawals (Admin)
**Endpoint:** `GET /api/admin/payments/withdrawals`
**Auth:** Required (Admin)
**Controller Method:** `PaymentController.adminGetWithdrawals()` (line 1988)

**Query Parameters:**
- `status` (optional)
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "withdrawals": [...],
    "total": 100
  }
}
```

---

### 15. Admin Approve Withdrawal
**Endpoint:** `POST /api/admin/payments/withdrawals/:id/approve`
**Auth:** Required (Admin)
**Controller Method:** `PaymentController.adminApproveWithdrawal()` (line 2012)

**Request Body:**
```json
{
  "bukti_transfer": "https://s3.amazonaws.com/bukti-transfer.jpg",
  "catatan": "Transfer berhasil via BCA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal approved and funds transferred",
  "data": {
    "withdrawal_id": "uuid",
    "status": "completed",
    "dicairkan_pada": "2025-12-16T10:00:00.000Z"
  }
}
```

**Fitur:**
- **Wajib upload bukti transfer**
- Update escrow status jadi 'completed'
- Send email notif ke freelancer
- Logging untuk audit trail

---

### 16. Admin Reject Withdrawal
**Endpoint:** `POST /api/admin/payments/withdrawals/:id/reject`
**Auth:** Required (Admin)
**Controller Method:** `PaymentController.adminRejectWithdrawal()` (line 2053)

**Request Body:**
```json
{
  "reason": "Rekening tidak valid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal rejected",
  "data": {
    "withdrawal_id": "uuid",
    "status": "failed",
    "catatan_admin": "Rekening tidak valid"
  }
}
```

**Fitur:**
- **Wajib kasih alasan**
- Escrow kembali ke status 'released' (bisa di-withdraw lagi)
- Send email notif ke freelancer

---

### 17. Get Withdrawal Analytics (Role-Based)
**Endpoint:** `GET /api/payments/analytics/withdrawals`
**Auth:** Required
**Controller Method:** `PaymentController.getWithdrawalAnalytics()` (line 1284)

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": { "count": 5, "total_amount": 500000 },
    "processing": { "count": 2, "total_amount": 200000 },
    "completed": { "count": 50, "total_amount": 5000000 },
    "failed": { "count": 3, "total_amount": 150000 },
    "total": {
      "count": 60,
      "total_amount": 5850000
    },
    "pending_withdrawals": [...],
    "role": "freelancer"
  }
}
```

**Authorization:**
- **Freelancer:** Lihat withdrawal mereka sendiri
- **Client:** Forbidden (403)
- **Admin:** Lihat semua + list pending withdrawals

---

## 🔄 Refund Operations (4 endpoints)

### 18. Request Refund
**Endpoint:** `POST /api/payments/:id/refund`
**Auth:** Required (Client)
**Controller Method:** `PaymentController.requestRefund()` (line 1728)

**Request Body:**
```json
{
  "alasan": "Pekerjaan tidak sesuai",
  "jumlah_refund": 100000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund request submitted",
  "data": {
    "refund_id": "uuid",
    "pembayaran_id": "payment-uuid",
    "jumlah_refund": 100000,
    "alasan": "Pekerjaan tidak sesuai",
    "status": "pending"
  }
}
```

---

### 19. Request Refund (Alternative Endpoint)
**Endpoint:** `POST /api/payments/refund/request`
**Auth:** Required (Client)
**Controller Method:** `PaymentController.requestRefundAlt()` (line 1878)

**Request Body:**
```json
{
  "payment_id": "uuid",
  "reason": "Pekerjaan tidak sesuai",
  "amount": 100000
}
```

**Catatan:** Support dual naming (`alasan`/`reason`, `jumlah_refund`/`amount`)

---

### 20. Process Refund (Admin)
**Endpoint:** `PUT /api/payments/refund/:id/process`
**Auth:** Required (Admin)
**Controller Method:** `PaymentController.processRefund()` (line 1760)

**Request Body:**
```json
{
  "action": "approve|reject",
  "catatan_admin": "Refund disetujui"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund approved",
  "data": {
    "refund_id": "uuid",
    "status": "approved",
    "diproses_pada": "2025-12-16T10:00:00.000Z"
  }
}
```

**Catatan:** Saat ini refund **semi-manual** - admin approve di sistem, tapi proses refund actual via Midtrans Dashboard.

---

### 21. Get All Refunds (Admin)
**Endpoint:** `GET /api/payments/refunds`
**Auth:** Required (Admin)
**Controller Method:** `PaymentController.getAllRefunds()` (line 1799)

**Query Parameters:**
- `status` (optional): `pending|approved|rejected|completed`
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "refunds": [
      {
        "id": "uuid",
        "pembayaran_id": "uuid",
        "jumlah_refund": 100000,
        "alasan": "...",
        "status": "pending",
        "created_at": "2025-12-15T10:00:00.000Z"
      }
    ],
    "total": 50,
    "limit": 50,
    "offset": 0
  }
}
```

---

## 📊 Analytics & Reporting (5 endpoints)

### 22. Get Analytics Summary (Role-Based)
**Endpoint:** `GET /api/payments/analytics/summary`
**Auth:** Required
**Controller Method:** `PaymentController.getAnalyticsSummary()` (line 970)

**Query Parameters:**
- `start_date` (optional): `2025-01-01`
- `end_date` (optional): `2025-12-31`
- `period` (optional): `30d|60d|90d`

**Response (Admin):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_payments": 1000,
      "success_payments": 850,
      "failed_payments": 150,
      "success_rate": "85.00%",
      "total_revenue": 100000000,
      "total_platform_fee": 5000000,
      "total_gross": 106000000
    },
    "period": {
      "start": "2025-11-15",
      "end": "2025-12-15"
    },
    "payment_methods": [
      { "metode_pembayaran": "qris", "count": 500, "total_amount": 50000000 },
      { "metode_pembayaran": "virtual_account", "count": 350, "total_amount": 35000000 }
    ],
    "daily_transactions": [...],
    "status_breakdown": [...],
    "role": "admin"
  }
}
```

**Response (Freelancer):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_payments": 50,
      "success_payments": 45,
      "total_revenue": 5000000,
      "total_platform_fee": 250000,
      "net_earnings": 4750000
    },
    "period": {...},
    "role": "freelancer"
  }
}
```

**Response (Client):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_payments": 30,
      "success_payments": 28,
      "total_spent": 3000000
    },
    "period": {...},
    "role": "client"
  }
}
```

**Fitur:**
- **Role-based filtering:** Admin lihat semua, Freelancer lihat earnings, Client lihat spending
- **Caching disabled** untuk data real-time

---

### 23. Get Freelancer Earnings
**Endpoint:** `GET /api/payments/analytics/freelancer-earnings`
**Auth:** Required (Freelancer/Admin)
**Controller Method:** `PaymentController.getFreelancerEarnings()` (line 1380)

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `freelancer_id` (Admin only - view any freelancer)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_orders": 50,
      "completed_orders": 45,
      "total_earned": 5000000,
      "platform_fees": 250000,
      "net_earnings": 4750000,
      "average_order_value": 111111
    },
    "balance": {
      "pending_escrow": 500000,
      "available_balance": 1000000,
      "total_withdrawn": 3500000
    },
    "monthly_earnings": [
      { "month": "2025-10", "orders": 10, "earnings": 1000000 },
      { "month": "2025-11", "orders": 15, "earnings": 1500000 }
    ],
    "period": {
      "start": "2025-01-01",
      "end": "2025-12-15"
    }
  }
}
```

---

### 24. Get Client Spending
**Endpoint:** `GET /api/payments/analytics/client-spending`
**Auth:** Required (Client/Admin)
**Controller Method:** `PaymentController.getClientSpending()` (line 1516)

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `client_id` (Admin only - view any client)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_orders": 30,
      "completed_orders": 28,
      "active_orders": 2,
      "total_spent": 3000000,
      "average_order_value": 107142,
      "total_refunds": 2,
      "total_refunded": 200000,
      "success_rate": 93
    },
    "monthly_spending": [
      { "month": "2025-10", "orders": 10, "spent": 1000000 },
      { "month": "2025-11", "orders": 15, "spent": 1500000 }
    ],
    "period": {
      "start": "2025-01-01",
      "end": "2025-12-15"
    }
  }
}
```

---

### 25. Get User Balance (Freelancer)
**Endpoint:** `GET /api/payments/balance`
**Auth:** Required (Freelancer)
**Controller Method:** `PaymentController.getUserBalance()` (line 1632)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_earned": 10000000,
    "platform_fees": 500000,
    "pending_escrow": 1000000,
    "total_withdrawn": 7500000,
    "available_balance": 2000000
  }
}
```

**Calculation:**
- `available_balance` = Released escrow yang belum di-withdraw
- `pending_escrow` = Escrow yang masih status 'held' (belum released)

---

## 📄 Invoice Operations (2 endpoints)

### 26. Get Invoice PDF
**Endpoint:** `GET /api/payments/:id/invoice`
**Auth:** Required
**Controller Method:** `PaymentController.getInvoice()` (line 846)

**Response:** PDF file (inline display)

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: inline; filename=INV-{nomor_invoice}.pdf
```

**Fitur:**
- Auto-generate invoice kalau belum ada
- Fetch order & user data untuk detail invoice
- Save PDF ke storage
- Return existing PDF kalau sudah pernah dibuat

---

### 27. Send Invoice via Email
**Endpoint:** `POST /api/payments/:id/send-invoice`
**Auth:** Required
**Controller Method:** `PaymentController.sendInvoice()` (line 913)

**Request Body:**
```json
{
  "email": "custom@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice sent successfully",
  "data": {
    "email": "custom@example.com"
  }
}
```

**Fitur:**
- Generate invoice PDF kalau belum ada
- Send email with PDF attachment
- Default email dari payment record kalau ga dikasih

---

## 🧪 Testing Endpoints (Mock) (2 endpoints)

### 28. Mock Trigger Payment Success
**Endpoint:** `POST /api/payments/mock/trigger-success`
**Auth:** Optional (Testing only)
**Controller Method:** `PaymentController.mockTriggerSuccess()` (line 761)

**Request Body:**
```json
{
  "transaction_id": "PAY-1234567890-ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment success triggered",
  "data": {
    "transaction_id": "PAY-1234567890-ABC123",
    "status": "berhasil"
  }
}
```

**Fitur:**
- **TESTING ONLY** - Manual trigger payment jadi success
- Pakai `MockPaymentGatewayService.triggerPaymentSuccess()`
- Process webhook otomatis
- Berguna untuk testing flow tanpa bayar beneran

---

### 29. Mock Trigger Payment Failure
**Endpoint:** `POST /api/payments/mock/trigger-failure`
**Auth:** Optional (Testing only)
**Controller Method:** `PaymentController.mockTriggerFailure()` (line 804)

**Request Body:**
```json
{
  "transaction_id": "PAY-1234567890-ABC123",
  "reason": "Insufficient funds"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment failure triggered",
  "data": {
    "transaction_id": "PAY-1234567890-ABC123",
    "status": "gagal",
    "reason": "Insufficient funds"
  }
}
```

**Fitur:**
- **TESTING ONLY** - Manual trigger payment jadi gagal
- Pakai `MockPaymentGatewayService.triggerPaymentFailure()`
- Process webhook otomatis
- Berguna untuk testing error handling

---

## 🔑 Authentication & Authorization Summary

| Endpoint | Auth Required | Allowed Roles |
|----------|---------------|---------------|
| Create Payment | ✅ Yes | Client, Freelancer, Admin |
| Webhook Handler | ❌ No | Public (verified by signature) |
| Get Payment | ✅ Yes | Owner, Admin |
| Check Status | ❌ No | Public |
| Release Escrow | ✅ Yes | Client (order owner), Admin |
| Get All Escrows | ✅ Yes | **Admin only** |
| Create Withdrawal | ✅ Yes | **Freelancer only** |
| Approve/Reject Withdrawal | ✅ Yes | **Admin only** |
| Request Refund | ✅ Yes | **Client only** |
| Process Refund | ✅ Yes | **Admin only** |
| Analytics Summary | ✅ Yes | All (role-based data) |
| Freelancer Earnings | ✅ Yes | Freelancer (own data), Admin (any) |
| Client Spending | ✅ Yes | Client (own data), Admin (any) |
| User Balance | ✅ Yes | **Freelancer only** |
| Mock Triggers | ❌ No | Public (testing only) |

---

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Payment retrieved |
| 201 | Created | Payment created successfully |
| 400 | Bad Request | Invalid payment method |
| 401 | Unauthorized | Missing JWT token |
| 403 | Forbidden | Admin-only endpoint |
| 404 | Not Found | Payment not found |
| 500 | Server Error | Database connection failed |

---

## 🔗 Routes Configuration

**File:** `src/modules/payment/presentation/routes/paymentRoutes.js`

```javascript
// Payment routes
router.post('/create', auth, paymentController.createPayment);
router.post('/webhook', paymentController.handleWebhook);
router.get('/:id', auth, paymentController.getPaymentById);
router.get('/check-status/:transactionId', paymentController.checkPaymentStatus);
router.get('/order/:orderId', auth, paymentController.getPaymentByOrderId);
router.post('/:id/retry', auth, paymentController.retryPayment);

// Escrow routes
router.post('/escrow/release', auth, paymentController.releaseEscrow);
router.get('/escrow/:id', auth, paymentController.getEscrowById);
router.get('/escrow', authAdmin, paymentController.getAllEscrows);

// Withdrawal routes
router.post('/withdraw', authFreelancer, paymentController.createWithdrawal);
router.get('/withdrawals/:id', auth, paymentController.getWithdrawalById);
router.get('/withdrawal/history', authFreelancer, paymentController.getWithdrawalHistory);

// Admin withdrawal routes
router.get('/admin/payments/withdrawals', authAdmin, paymentController.adminGetWithdrawals);
router.post('/admin/payments/withdrawals/:id/approve', authAdmin, paymentController.adminApproveWithdrawal);
router.post('/admin/payments/withdrawals/:id/reject', authAdmin, paymentController.adminRejectWithdrawal);

// Refund routes
router.post('/:id/refund', authClient, paymentController.requestRefund);
router.post('/refund/request', authClient, paymentController.requestRefundAlt);
router.put('/refund/:id/process', authAdmin, paymentController.processRefund);
router.get('/refunds', authAdmin, paymentController.getAllRefunds);

// Analytics routes
router.get('/analytics/summary', auth, paymentController.getAnalyticsSummary);
router.get('/analytics/escrow', auth, paymentController.getEscrowAnalytics);
router.get('/analytics/withdrawals', auth, paymentController.getWithdrawalAnalytics);
router.get('/analytics/freelancer-earnings', authFreelancer, paymentController.getFreelancerEarnings);
router.get('/analytics/client-spending', authClient, paymentController.getClientSpending);
router.get('/balance', authFreelancer, paymentController.getUserBalance);

// Invoice routes
router.get('/:id/invoice', auth, paymentController.getInvoice);
router.post('/:id/send-invoice', auth, paymentController.sendInvoice);

// Mock testing routes (development only)
router.post('/mock/trigger-success', paymentController.mockTriggerSuccess);
router.post('/mock/trigger-failure', paymentController.mockTriggerFailure);
```

---

**Terakhir Diupdate:** 15 Desember 2025
**Diverifikasi Oleh:** Claude Code
**Status:** Siap untuk review tim dokumentasi
