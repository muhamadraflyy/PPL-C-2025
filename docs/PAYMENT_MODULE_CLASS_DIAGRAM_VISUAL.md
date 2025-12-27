# Class Diagram - Payment Module

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLEAN ARCHITECTURE - PAYMENT MODULE                       │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
 LAYER 1: DOMAIN (Entities & Value Objects)
═══════════════════════════════════════════════════════════════════════════════

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    Payment       │  │     Escrow       │  │     Refund       │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ + id             │  │ + id             │  │ + id             │
│ + transaction_id │  │ + pembayaran_id  │  │ + pembayaran_id  │
│ + total_bayar    │  │ + jumlah_escrow  │  │ + jumlah_refund  │
│ + status         │  │ + status         │  │ + status         │
│                  │  │                  │  │ + alasan         │
│ + create()       │  │ + release()      │  │ + approve()      │
│ + verify()       │  │ + refund()       │  │ + reject()       │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│   Withdrawal     │  │  PlatformConfig  │
├──────────────────┤  ├──────────────────┤
│ + id             │  │ + config_key     │
│ + freelancer_id  │  │ + config_value   │
│ + jumlah         │  │                  │
│ + status         │  │ + getFees()      │
│ + bank_details   │  │ + updateFees()   │
│                  │  └──────────────────┘
│ + approve()      │
│ + reject()       │
└──────────────────┘


═══════════════════════════════════════════════════════════════════════════════
 LAYER 2: APPLICATION (Use Cases)
═══════════════════════════════════════════════════════════════════════════════

PAYMENT USE CASES
┌────────────────────────────────────────────────────────────────────────────┐
│ CreatePayment                                                              │
│ ├─ execute(orderId, userId, paymentMethod)                                │
│ └─ Dependencies: PaymentGateway, EscrowService                            │
│                                                                            │
│ VerifyPayment                                                              │
│ ├─ execute(transactionId, webhookData)                                    │
│ └─ Dependencies: PaymentRepository, EscrowService                         │
│                                                                            │
│ RetryPayment                                                               │
│ ├─ execute(paymentId, newMethod)                                          │
│ └─ Dependencies: PaymentRepository, PaymentGateway                        │
└────────────────────────────────────────────────────────────────────────────┘

ESCROW USE CASES
┌────────────────────────────────────────────────────────────────────────────┐
│ ReleaseEscrow                                                              │
│ ├─ execute(escrowId, userId)                                              │
│ └─ Dependencies: EscrowRepository, OrderRepository                        │
└────────────────────────────────────────────────────────────────────────────┘

REFUND USE CASES
┌────────────────────────────────────────────────────────────────────────────┐
│ RequestRefund                                                              │
│ ├─ execute(paymentId, userId, reason)                                     │
│ └─ Dependencies: PaymentRepo, EscrowRepo, RefundRepo                     │
│                                                                            │
│ ProcessRefund                                                              │
│ ├─ execute(refundId, adminId, action, catatan_admin)  ← ENHANCED         │
│ └─ Dependencies: RefundRepository                                         │
│                                                                            │
│ NOTE: catatan_admin parameter added for admin feedback                    │
└────────────────────────────────────────────────────────────────────────────┘

WITHDRAWAL USE CASES
┌────────────────────────────────────────────────────────────────────────────┐
│ WithdrawFunds                                                              │
│ ├─ execute(freelancerId, amount, bankDetails)                             │
│ └─ Dependencies: WithdrawalService, EscrowService                         │
│                                                                            │
│ AdminApproveWithdrawal                                                     │
│ ├─ execute(withdrawalId, adminId, buktiTransfer)                          │
│ └─ Dependencies: WithdrawalRepository                                     │
│                                                                            │
│ AdminRejectWithdrawal                                                      │
│ ├─ execute(withdrawalId, adminId, reason)                                 │
│ └─ Dependencies: WithdrawalRepository                                     │
└────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
 LAYER 3: INFRASTRUCTURE (Services, Repositories, Models)
═══════════════════════════════════════════════════════════════════════════════

EXTERNAL SERVICES
┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│  MidtransService    │  │  MockPaymentGateway  │  │   EmailService      │
├─────────────────────┤  ├──────────────────────┤  ├─────────────────────┤
│ + createTransaction │  │ + simulatePayment    │  │ + sendInvoice()     │
│ + getStatus()       │  │ + autoSuccess()      │  │ + sendNotification()│
│ + verifySignature() │  └──────────────────────┘  └─────────────────────┘
└─────────────────────┘

BUSINESS SERVICES
┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│   EscrowService     │  │  WithdrawalService   │  │  InvoiceService     │
├─────────────────────┤  ├──────────────────────┤  ├─────────────────────┤
│ + createEscrow()    │  │ + requestWithdrawal()│  │ + generatePDF()     │
│ + releaseEscrow()   │  │ + approveWithdrawal()│  │ + sendEmail()       │
│ + calculateFees()   │  │ + rejectWithdrawal() │  └─────────────────────┘
│ + getBalance()      │  │ + getBalance()       │
└─────────────────────┘  └──────────────────────┘

REPOSITORIES (Data Access)
┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│ PaymentRepository   │  │  EscrowRepository    │  │  RefundRepository   │
├─────────────────────┤  ├──────────────────────┤  ├─────────────────────┤
│ + create()          │  │ + create()           │  │ + create()          │
│ + findById()        │  │ + findById()         │  │ + findById()        │
│ + findByTrxId()     │  │ + findByPaymentId()  │  │ + findAll()         │
│ + updateStatus()    │  │ + release()          │  │ + updateStatus()    │
└─────────────────────┘  └──────────────────────┘  └─────────────────────┘

┌─────────────────────┐
│WithdrawalRepository │
├─────────────────────┤
│ + create()          │
│ + findById()        │
│ + findPending()     │
│ + updateStatus()    │
└─────────────────────┘

MODELS (ORM/Sequelize)
┌─────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│   PaymentModel      │  │    EscrowModel       │  │   RefundModel       │
├─────────────────────┤  ├──────────────────────┤  ├─────────────────────┤
│ Sequelize Model     │  │ Sequelize Model      │  │ Sequelize Model     │
│ Table: pembayaran   │  │ Table: escrow        │  │ Table: refund       │
└─────────────────────┘  └──────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌──────────────────────┐
│ WithdrawalModel     │  │ PlatformConfigModel  │
├─────────────────────┤  ├──────────────────────┤
│ Sequelize Model     │  │ Sequelize Model      │
│ Table: withdrawal   │  │ Table: platform_cfg  │
└─────────────────────┘  └──────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
 LAYER 4: PRESENTATION (Controllers & Routes)
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│                          PaymentController                                 │
├────────────────────────────────────────────────────────────────────────────┤
│ PAYMENT ENDPOINTS                                                          │
│ ├─ POST   /create              → createPayment()                          │
│ ├─ GET    /:id                 → getPaymentById()                         │
│ ├─ GET    /check-status/:txId  → checkPaymentStatus()                     │
│ ├─ POST   /webhook             → handleWebhook()                          │
│ └─ POST   /:id/retry           → retryPayment()                           │
│                                                                            │
│ ESCROW ENDPOINTS                                                           │
│ ├─ POST   /escrow/release      → releaseEscrow()                          │
│ ├─ GET    /escrow              → getAllEscrows()                          │
│ └─ GET    /escrow/:id          → getEscrowById()                          │
│                                                                            │
│ REFUND ENDPOINTS                                                           │
│ ├─ POST   /:id/refund          → requestRefund()                          │
│ ├─ POST   /refund/request      → requestRefundAlt()                       │
│ ├─ PUT    /refund/:id/process  → processRefund()                          │
│ └─ GET    /refunds             → getAllRefunds()                          │
│                                                                            │
│ WITHDRAWAL ENDPOINTS                                                       │
│ ├─ POST   /withdrawal/create         → createWithdrawal()                 │
│ ├─ GET    /withdrawal/history        → getWithdrawalHistory()             │
│ ├─ GET    /withdrawal/:id            → getWithdrawalById()                │
│ ├─ GET    /admin/withdrawals         → adminGetWithdrawals()              │
│ ├─ POST   /admin/withdrawals/:id/approve → adminApproveWithdrawal()       │
│ └─ POST   /admin/withdrawals/:id/reject  → adminRejectWithdrawal()        │
│                                                                            │
│ OTHER ENDPOINTS                                                            │
│ ├─ GET    /:id/invoice         → getInvoice()                             │
│ ├─ POST   /:id/send-invoice    → sendInvoice()                            │
│ ├─ GET    /balance             → getUserBalance()                         │
│ └─ GET    /analytics/*         → getAnalytics()                           │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                      PlatformConfigController                              │
├────────────────────────────────────────────────────────────────────────────┤
│ ├─ GET    /platform-config/fees       → getFees()                         │
│ └─ PUT    /platform-config/fees       → updateFees()                      │
└────────────────────────────────────────────────────────────────────────────┘
```

## Dependency Flow

```
┌─────────────┐
│ Controller  │ (Presentation Layer)
└──────┬──────┘
       │ uses
       ▼
┌─────────────┐
│  Use Case   │ (Application Layer)
└──────┬──────┘
       │ uses
       ▼
┌─────────────┐     ┌─────────────┐
│ Repository  │────▶│   Model     │ (Infrastructure Layer)
└─────────────┘     └─────────────┘
       │
       │ uses
       ▼
┌─────────────┐
│  Service    │ (Infrastructure Layer)
└─────────────┘
```

## Design Patterns

```
REPOSITORY PATTERN
└─ Abstraksi data access
   Files: *Repository.js

USE CASE PATTERN
└─ Single responsibility per action
   Files: use-cases/*.js

SERVICE PATTERN
└─ External integration & complex logic
   Files: services/*.js

DEPENDENCY INJECTION
└─ Constructor injection
   Example: new CreatePayment({ paymentRepo, escrowService })

STRATEGY PATTERN
└─ Multiple payment gateways
   Files: MidtransService, MockPaymentGateway
```

## File Checklist

```
EXISTING FILES (✓)
├─ Use Cases (10 files)
│  ├─ CreatePayment.js
│  ├─ VerifyPayment.js
│  ├─ RetryPayment.js
│  ├─ ReleaseEscrow.js
│  ├─ RequestRefund.js
│  ├─ ProcessRefund.js
│  ├─ WithdrawFunds.js
│  ├─ GetPendingWithdrawals.js
│  ├─ AdminApproveWithdrawal.js
│  └─ AdminRejectWithdrawal.js
│
├─ Models (5 files)
│  ├─ PaymentModel.js
│  ├─ EscrowModel.js
│  ├─ RefundModel.js
│  ├─ WithdrawalModel.js
│  └─ PlatformConfigModel.js
│
├─ Services (6 files)
│  ├─ MidtransService.js
│  ├─ MockPaymentGatewayService.js
│  ├─ EscrowService.js
│  ├─ WithdrawalService.js
│  ├─ InvoiceService.js
│  └─ EmailService.js
│
└─ Controllers (2 files)
   ├─ PaymentController.js
   └─ PlatformConfigController.js

RECOMMENDED TO CREATE (□)
├─ Domain Entities (4 files)
│  ├─ entities/Payment.js
│  ├─ entities/Escrow.js
│  ├─ entities/Refund.js
│  └─ entities/Withdrawal.js
│
└─ Repository Interfaces (4 files)
   ├─ repositories/PaymentRepository.js
   ├─ repositories/EscrowRepository.js
   ├─ repositories/RefundRepository.js
   └─ repositories/WithdrawalRepository.js
```

## Recent Updates & Enhancements (2025)

```
╔══════════════════════════════════════════════════════════════════════════╗
║           PAYMENT MODULE - CLASS DIAGRAM UPDATES                         ║
╚══════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│ 1. REFUND PROCESSING ENHANCEMENT                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ProcessRefund Use Case (ENHANCED)                                       │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ class ProcessRefund                                        │         │
│  │                                                            │         │
│  │ execute(refundId, adminId, action, catatan_admin)         │         │
│  │         ↑                                                  │         │
│  │         └─ NEW: Admin dapat tambahkan notes                │         │
│  │            saat approve/reject refund                      │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  RefundModel (UPDATED)                                                   │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ + catatan_admin (TEXT)  ← NEW FIELD                        │         │
│  │   - Stores admin feedback                                  │         │
│  │   - Visible to client in refund response                   │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  PaymentController.getAllRefunds() (ENHANCED)                            │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ Returns:                                                   │         │
│  │   - Full order details                                     │         │
│  │   - Service/layanan info  ← NEW                            │         │
│  │   - User details                                           │         │
│  │   - Admin notes (catatan_admin)  ← NEW                     │         │
│  └────────────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ 2. WITHDRAWAL SERVICE ENHANCEMENT                                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WithdrawalService (ENHANCED)                                            │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ + requestWithdrawal(freelancerId, amount, bankDetails)     │         │
│  │   ├─ FIFO Escrow Selection  ← NEW LOGIC                    │         │
│  │   │  Automatically selects escrows in order                │         │
│  │   │  to fulfill requested amount                           │         │
│  │   │                                                         │         │
│  │   ├─ Flexible Amount Support  ← NEW                        │         │
│  │   │  Any amount >= Rp 50,000                               │         │
│  │   │  (previously might be fixed)                           │         │
│  │   │                                                         │         │
│  │   └─ Bank Name Field  ← NEW                                │         │
│  │      Store specific bank (BCA, BRI, etc)                   │         │
│  └────────────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ 3. ANALYTICS CONTROLLERS (NEW ENDPOINTS)                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PaymentController (ENHANCED)                                            │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ NEW METHODS:                                               │         │
│  │                                                            │         │
│  │ + getAnalyticsSummary(req, res)                           │         │
│  │   └─ Role-based: Different data per role                  │         │
│  │                                                            │         │
│  │ + getFreelancerEarnings(req, res)                         │         │
│  │   └─ Freelancer earning stats                             │         │
│  │                                                            │         │
│  │ + getClientSpending(req, res)                             │         │
│  │   └─ Client spending stats                                │         │
│  │                                                            │         │
│  │ + getUserBalance(req, res)                                │         │
│  │   └─ Freelancer available balance                         │         │
│  └────────────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ 4. PLATFORM CONFIG ENHANCEMENTS                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PlatformConfigController (ENHANCED)                                     │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ + updateConfig(configKey, value)                           │         │
│  │   ├─ Dynamic platform fee updates                          │         │
│  │   ├─ Category-based organization                           │         │
│  │   └─ Data type validation                                  │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                          │
│  PlatformConfigModel (ENHANCED)                                          │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │ + category (VARCHAR 50)  ← NEW                             │         │
│  │ + data_type (ENUM)  ← NEW                                  │         │
│  │ + is_editable (BOOLEAN)  ← NEW                             │         │
│  └────────────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────────────┘
```

## Updated Flow Diagram - Refund dengan Admin Notes

```
CLIENT REQUEST REFUND
        │
        ▼
┌───────────────────┐
│ RequestRefund UC  │ → Create refund (status: pending)
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────────────────────────────┐
│           ADMIN REVIEWS IN DASHBOARD                  │
│  (getAllRefunds shows full order + service details)   │
└─────────┬─────────────────────────────────────────────┘
          │
          ├─────────────────┬─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    [APPROVE]          [REJECT]          [NEEDS MORE INFO]
          │                 │                 │
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼──────────┐
│           ProcessRefund Use Case                       │
│                                                        │
│  Params:                                               │
│  - refundId                                            │
│  - adminId                                             │
│  - action (approve/reject)                             │
│  - catatan_admin  ← NEW                                │
│                                                        │
│  Examples:                                             │
│  "Refund disetujui, layanan tidak sesuai"             │
│  "Bukti tidak cukup, upload screenshot"               │
│  "Menunggu konfirmasi freelancer"                     │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ Update Refund    │
          │ - status         │
          │ - catatan_admin  │
          │ - diproses_pada  │
          └──────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ Notify Client    │
          │ (includes notes) │
          └──────────────────┘
```

---

**Documentation Last Updated**: 2025-12-27
**Changes**:
- Added refund processing enhancements with catatan_admin
- Added withdrawal FIFO selection and flexible amounts
- Added analytics endpoints documentation
- Added platform config enhancements
- Updated flow diagrams for refund with admin notes
