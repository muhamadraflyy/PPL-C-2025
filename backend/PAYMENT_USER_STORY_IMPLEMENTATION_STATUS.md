# Module 4 - Payment Gateway: User Story vs Implementation

**Tanggal:** 15 Desember 2025
**Status:** Implementation Review

---

## 📋 Module 4 Requirements Overview

### Fitur Utama:
1. ✅ Pembayaran digital (Midtrans/Xendit)
2. ✅ Verifikasi status pembayaran otomatis
3. ⚠️ Lihat riwayat pembayaran
4. ✅ Freelancer melihat penghasilan
5. ❌ Admin unduh laporan transaksi
6. ✅ Sistem kirim invoice otomatis

---

## 📊 Detailed User Story Implementation Status

### User Story #1: Pembayaran Digital Secara Aman

**User Story:**
> "Sebagai pengguna, saya ingin melakukan pembayaran digital secara aman."

**Status:** ✅ **IMPLEMENTED**

**Implementasi:**
- **Endpoint:** `POST /api/payments/create`
- **Payment Gateway:** Midtrans Payment Gateway (Sandbox)
- **Payment Methods:** QRIS, Virtual Account, E-Wallet, Transfer Bank, Kartu Kredit
- **Security:**
  - JWT Authentication required
  - HTTPS encryption
  - Midtrans signature verification untuk webhook
  - Payment URL expires dalam 24 jam

**Features:**
```javascript
// Metode pembayaran yang didukung:
- QRIS (GoPay, ShopeePay, DANA, dll)
- Virtual Account (BCA, Mandiri, BNI, BRI, Permata)
- E-Wallet (GoPay, OVO, ShopeePay, DANA)
- Transfer Bank
- Kartu Kredit

// Security measures:
- Transaction ID format: PAY-{timestamp}-{random}
- Platform fee: 5%
- Gateway fee: 1%
- Auto-expiry: 24 jam
```

**File Reference:**
- Controller: `PaymentController.createPayment()` (line 47)
- Use Case: `CreatePayment.execute()`
- Service: `MidtransService.createTransaction()`
- Route: `POST /api/payments/create`

---

### User Story #2: Verifikasi Status Pembayaran Otomatis

**User Story:**
> "Sebagai sistem, saya ingin memverifikasi status pembayaran otomatis."

**Status:** ✅ **IMPLEMENTED**

**Implementasi:**
- **Webhook Endpoint:** `POST /api/payments/webhook`
- **Status Check Endpoint:** `GET /api/payments/check-status/:transactionId`

**Features:**
```javascript
// Webhook dari Midtrans:
1. Midtrans kirim POST notification ke /api/payments/webhook
2. Sistem verify signature hash
3. Update payment status di database
4. Auto-create escrow kalau payment berhasil
5. Update order status jadi 'dibayar'
6. Send email notification (optional)

// Manual status check:
1. Query real-time dari Midtrans API
2. Auto-update database kalau status berubah
3. Generate invoice kalau payment berhasil
4. Return redirect URL sesuai status
```

**Status Mapping:**
- `settlement` → `berhasil` → Create escrow + Update order
- `pending` → `menunggu` → No action
- `expire` → `kadaluarsa` → Mark as expired
- `deny/cancel` → `gagal` → Mark as failed

**File Reference:**
- Controller: `PaymentController.handleWebhook()` (line 179)
- Controller: `PaymentController.checkPaymentStatus()` (line 230)
- Use Case: `VerifyPayment.execute()`
- Route: `POST /api/payments/webhook` (no auth, verified by signature)
- Route: `GET /api/payments/check-status/:transactionId` (public)

---

### User Story #3: Lihat Riwayat Pembayaran

**User Story:**
> "Sebagai pengguna, saya ingin melihat riwayat pembayaran."

**Status:** ⚠️ **PARTIALLY IMPLEMENTED**

**Implementasi:**

#### ✅ Yang Ada:

**1. Get Payment by Order ID**
- **Endpoint:** `GET /api/payments/order/:orderId`
- **Function:** Get single payment untuk specific order
- **Response:** Detail payment untuk 1 order

**2. Analytics - Client Spending (untuk Client)**
- **Endpoint:** `GET /api/payments/analytics/client-spending`
- **Function:** Riwayat spending dengan monthly breakdown
- **Response:**
```json
{
  "summary": {
    "total_orders": 30,
    "completed_orders": 28,
    "total_spent": 3000000
  },
  "monthly_spending": [
    { "month": "2025-10", "orders": 10, "spent": 1000000 },
    { "month": "2025-11", "orders": 15, "spent": 1500000 }
  ]
}
```

**3. Analytics - Freelancer Earnings (untuk Freelancer)**
- **Endpoint:** `GET /api/payments/analytics/freelancer-earnings`
- **Function:** Riwayat earnings dengan monthly breakdown
- **Response:**
```json
{
  "summary": {
    "total_orders": 50,
    "completed_orders": 45,
    "total_earned": 5000000
  },
  "monthly_earnings": [
    { "month": "2025-10", "orders": 10, "earnings": 1000000 }
  ]
}
```

**4. Get Payment by ID**
- **Endpoint:** `GET /api/payments/:id`
- **Function:** Get detail single payment by ID

**5. Analytics Summary (Role-based)**
- **Endpoint:** `GET /api/payments/analytics/summary`
- **Function:** Summary dengan daily transactions
- **Response:** Includes `daily_transactions` array

#### ❌ Yang TIDAK Ada:

**Dedicated Payment History Endpoint**
- ❌ Tidak ada endpoint `GET /api/payments/history` atau `GET /api/payments`
- ❌ Tidak ada endpoint untuk list SEMUA payments user dengan pagination
- ❌ Tidak ada filter by date range untuk riwayat payment

**Gap:**
User tidak bisa dengan mudah:
- List semua payments mereka secara paged
- Filter payments by date range
- Search payments by transaction ID
- Sort payments by status/date

**Rekomendasi:**
Tambahkan endpoint baru:
```javascript
GET /api/payments/history
Query params:
- status: berhasil|menunggu|gagal|kadaluarsa
- start_date: 2025-01-01
- end_date: 2025-12-31
- limit: 50
- offset: 0
- sort: created_at|amount (desc|asc)

Response:
{
  "success": true,
  "data": {
    "payments": [...],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

**File Reference:**
- Route: `GET /api/payments/order/:orderId` (line 214)
- Route: `GET /api/payments/analytics/client-spending` (line 730)
- Route: `GET /api/payments/analytics/freelancer-earnings` (line 687)

---

### User Story #4: Freelancer Melihat Penghasilan

**User Story:**
> "Sebagai freelancer, saya ingin melihat penghasilan dari order yang selesai."

**Status:** ✅ **FULLY IMPLEMENTED**

**Implementasi:**

**1. Freelancer Earnings Analytics**
- **Endpoint:** `GET /api/payments/analytics/freelancer-earnings`
- **Auth:** Freelancer only (own data) / Admin (any freelancer)
- **Features:**
  - Total orders & completed orders
  - Total earned & platform fees
  - Net earnings
  - Average order value
  - **Monthly earnings breakdown**
  - Pending escrow
  - Available balance
  - Total withdrawn

**Response Example:**
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
      { "month": "2025-11", "orders": 15, "earnings": 1500000 },
      { "month": "2025-12", "orders": 20, "earnings": 2500000 }
    ],
    "period": {
      "start": "2025-01-01",
      "end": "2025-12-15"
    }
  }
}
```

**2. User Balance**
- **Endpoint:** `GET /api/payments/balance`
- **Auth:** Freelancer only
- **Features:**
  - Total earned
  - Platform fees
  - Pending escrow (held)
  - Total withdrawn
  - **Available balance** (released escrow yang bisa di-withdraw)

**Response Example:**
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

**3. Withdrawal History**
- **Endpoint:** `GET /api/payments/withdrawal/history`
- **Auth:** Freelancer only
- **Features:**
  - List semua withdrawal requests
  - Filter by status (pending, processing, completed, failed)
  - Pagination support
  - Total pages & items

**File Reference:**
- Controller: `PaymentController.getFreelancerEarnings()` (line 1380)
- Controller: `PaymentController.getUserBalance()` (line 1632)
- Controller: `PaymentController.getWithdrawalHistory()` (line 1920)
- Route: `GET /api/payments/analytics/freelancer-earnings` (line 687)
- Route: `GET /api/payments/balance` (line 755)
- Route: `GET /api/payments/withdrawal/history` (line 412)

---

### User Story #5: Admin Unduh Laporan Transaksi

**User Story:**
> "Sebagai admin, saya ingin mengunduh laporan transaksi."

**Status:** ❌ **NOT IMPLEMENTED**

**Yang Ada:**

**1. Analytics Summary (JSON only)**
- **Endpoint:** `GET /api/payments/analytics/summary`
- **Format:** JSON only (tidak bisa download CSV/Excel)
- **Data:**
  - Total payments, success/failed breakdown
  - Success rate
  - Total revenue, platform fees
  - Payment methods breakdown
  - Daily transactions
  - Status breakdown

**2. Get All Escrows (Admin)**
- **Endpoint:** `GET /api/payments/escrow`
- **Format:** JSON only
- **Data:** List semua escrow dengan detail

**3. Get All Refunds (Admin)**
- **Endpoint:** `GET /api/payments/refund/all`
- **Format:** JSON only
- **Data:** List semua refund requests

**4. Get Pending Withdrawals (Admin)**
- **Endpoint:** `GET /api/admin/payments/withdrawals`
- **Format:** JSON only
- **Data:** List withdrawal requests

**Yang TIDAK Ada:**

❌ **Export/Download Endpoints:**
- Tidak ada endpoint `GET /api/payments/export/csv`
- Tidak ada endpoint `GET /api/payments/export/excel`
- Tidak ada endpoint `GET /api/payments/report/download`
- Tidak ada generate PDF report

**Gap:**
Admin tidak bisa:
- Download laporan dalam format CSV
- Download laporan dalam format Excel (.xlsx)
- Download PDF report
- Export data untuk analisis eksternal
- Generate monthly/yearly reports

**Rekomendasi:**
Tambahkan export endpoints:
```javascript
// CSV Export
GET /api/admin/payments/export/csv
Query params:
- start_date: 2025-01-01
- end_date: 2025-12-31
- type: payments|escrow|withdrawals|refunds
Response: CSV file download

// Excel Export
GET /api/admin/payments/export/excel
Query params: (same as CSV)
Response: .xlsx file download

// PDF Report
GET /api/admin/payments/report/pdf
Query params:
- period: monthly|quarterly|yearly
- year: 2025
- month: 12 (optional)
Response: PDF report download
```

**Libraries yang bisa dipakai:**
- CSV: `fast-csv` atau `csv-writer`
- Excel: `exceljs` atau `xlsx`
- PDF: `pdfkit` atau `puppeteer`

**File Reference:**
- Route: `GET /api/payments/analytics/summary` (line 598)
- Route: `GET /api/payments/escrow` (line 290)
- Route: `GET /api/payments/refund/all` (line 913)
- Route: `GET /api/admin/payments/withdrawals` (line 1092)

---

### User Story #6: Sistem Kirim Invoice Otomatis

**User Story:**
> "Sebagai sistem, saya ingin mengirimkan invoice pembayaran secara otomatis."

**Status:** ✅ **FULLY IMPLEMENTED**

**Implementasi:**

**1. Auto-Generate Invoice**
- **Trigger:** Payment status berhasil (`settlement`)
- **Process:**
  - Generate nomor invoice: `INV/{year}/{month}/{uniqueId}`
  - Create PDF invoice dengan detail payment
  - Save PDF ke storage
  - Link invoice ke payment record

**2. Get Invoice PDF**
- **Endpoint:** `GET /api/payments/:id/invoice`
- **Alias:** `GET /api/payments/invoice/:id`
- **Auth:** Required
- **Features:**
  - Auto-generate invoice kalau belum ada
  - Fetch order & user data untuk detail
  - Return PDF inline (display di browser)
  - Cache PDF untuk subsequent requests

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `inline; filename=INV-{nomor_invoice}.pdf`

**3. Send Invoice via Email**
- **Endpoint:** `POST /api/payments/:id/send-invoice`
- **Alias:** `POST /api/payments/invoice/:id/send-email`
- **Auth:** Required
- **Features:**
  - Generate invoice PDF kalau belum ada
  - Send email dengan PDF attachment
  - Support custom email atau default dari payment record

**Request Body:**
```json
{
  "email": "custom@example.com"  // optional
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

**Invoice Content:**
- Nomor invoice
- Tanggal pembayaran
- Detail order (judul, deskripsi)
- Customer details (nama, email)
- Breakdown biaya:
  - Jumlah order
  - Platform fee (5%)
  - Gateway fee (1%)
  - Total bayar
- Payment method
- Transaction ID
- Status pembayaran

**Auto-Send:**
⚠️ **Semi-automatic** - Invoice di-generate otomatis saat payment berhasil, tapi email **TIDAK** otomatis terkirim. User/Admin harus manual trigger send via endpoint.

**Enhancement Suggestion:**
Tambahkan auto-send email invoice:
```javascript
// Di VerifyPayment use case, setelah payment berhasil:
if (payment.status === 'berhasil') {
  // 1. Generate invoice
  await invoiceService.generateInvoice(payment);

  // 2. Auto-send email (NEW)
  await emailService.sendPaymentSuccessEmail(
    payment.customer_email,
    payment,
    invoicePath
  );
}
```

**File Reference:**
- Controller: `PaymentController.getInvoice()` (line 846)
- Controller: `PaymentController.sendInvoice()` (line 913)
- Service: `InvoiceService.generateInvoice()`
- Service: `EmailService.sendPaymentSuccessEmail()`
- Route: `GET /api/payments/:id/invoice` (line 490)
- Route: `POST /api/payments/:id/send-invoice` (line 531)
- Route: `GET /api/payments/invoice/:id` (line 540) - alias
- Route: `POST /api/payments/invoice/:id/send-email` (line 546) - alias

---

## 📈 Implementation Summary

| User Story | Status | Implementasi | Gap/Notes |
|------------|--------|--------------|-----------|
| **#1: Pembayaran Digital Aman** | ✅ **100%** | Midtrans integration, multiple payment methods, secure | None |
| **#2: Verifikasi Otomatis** | ✅ **100%** | Webhook + manual check, auto-update DB, auto-create escrow | None |
| **#3: Riwayat Pembayaran** | ⚠️ **70%** | Analytics endpoints ada, detail payment per order ada | **Missing:** Dedicated payment history list endpoint with pagination & filters |
| **#4: Freelancer Penghasilan** | ✅ **100%** | Comprehensive analytics + balance + withdrawal history | None |
| **#5: Admin Download Laporan** | ❌ **0%** | Analytics endpoints JSON only | **Missing:** CSV/Excel/PDF export functionality |
| **#6: Invoice Otomatis** | ✅ **90%** | Auto-generate PDF, manual send via endpoint | **Enhancement:** Auto-send email setelah payment berhasil |

**Overall Implementation:** 76.7% (460/600 points)

---

## 🎯 Priority Recommendations

### HIGH PRIORITY (Required untuk complete user stories)

**1. Add Payment History Endpoint**
```javascript
// Route: GET /api/payments/history
// Purpose: List semua payments dengan filter & pagination
// Impact: Complete User Story #3
// Effort: LOW (1-2 jam)
```

**2. Add Export Endpoints (CSV/Excel/PDF)**
```javascript
// Routes:
// - GET /api/admin/payments/export/csv
// - GET /api/admin/payments/export/excel
// - GET /api/admin/payments/report/pdf
// Purpose: Admin download reports
// Impact: Complete User Story #5
// Effort: MEDIUM (4-6 jam)
```

### MEDIUM PRIORITY (Enhancement)

**3. Auto-Send Invoice Email**
```javascript
// Trigger: Payment status = berhasil
// Action: Auto-send invoice email
// Impact: Enhance User Story #6 to 100%
// Effort: LOW (30 menit - 1 jam)
```

---

## 📝 Acceptance Criteria Checklist

### User Story #1: Pembayaran Digital
- [x] User bisa pilih metode pembayaran (QRIS, VA, E-Wallet, etc)
- [x] Sistem generate payment URL dari Midtrans
- [x] Payment secure dengan HTTPS & JWT
- [x] Payment expires dalam 24 jam
- [x] Platform fee & gateway fee calculated otomatis

### User Story #2: Verifikasi Otomatis
- [x] Midtrans webhook auto-update payment status
- [x] Signature verification untuk security
- [x] Auto-create escrow kalau payment berhasil
- [x] Auto-update order status
- [x] Manual check status via endpoint

### User Story #3: Riwayat Pembayaran
- [x] User bisa lihat detail payment per order
- [x] Analytics monthly breakdown
- [ ] **MISSING:** List semua payments dengan pagination
- [ ] **MISSING:** Filter by date range
- [ ] **MISSING:** Search by transaction ID

### User Story #4: Freelancer Penghasilan
- [x] Total earnings & net earnings
- [x] Monthly earnings breakdown
- [x] Available balance real-time
- [x] Pending escrow tracking
- [x] Withdrawal history

### User Story #5: Admin Download Laporan
- [x] View analytics summary (JSON)
- [x] View all transactions (JSON)
- [ ] **MISSING:** Download CSV report
- [ ] **MISSING:** Download Excel report
- [ ] **MISSING:** Generate PDF report

### User Story #6: Invoice Otomatis
- [x] Auto-generate invoice saat payment berhasil
- [x] Generate PDF invoice
- [x] Send invoice via email (manual trigger)
- [ ] **ENHANCEMENT:** Auto-send email tanpa manual trigger

---

## 🔍 Technical Debt & Improvements

### Current Issues:

1. **No Payment History Pagination**
   - Analytics endpoints return aggregated data only
   - Cannot paginate through individual payments

2. **No Export Functionality**
   - All admin data only available as JSON
   - No CSV/Excel export for reporting

3. **Semi-Manual Invoice Sending**
   - Invoice generated automatically
   - Email must be triggered manually via endpoint

4. **Refund Process Semi-Manual**
   - System tracks refund requests
   - Actual refund via Midtrans Dashboard manually
   - Could automate via Midtrans Refund API

### Suggested Improvements:

1. **Add Payment History Endpoint**
2. **Add Export/Download Functionality**
3. **Auto-send Invoice Email**
4. **Automate Refund via Midtrans API**
5. **Add Payment Filters & Search**

---

**Last Updated:** 15 Desember 2025
**Reviewed By:** Claude Code
**Next Review:** Setelah menambahkan missing features
