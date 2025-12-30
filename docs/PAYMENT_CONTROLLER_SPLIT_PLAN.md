# Payment Module - Split into 6 Controllers (Max 300 lines each)

## Current: 2090 lines → Target: 6 x ~300 lines

---

## 1. **PaymentController.js** (~300 lines)
**Responsibility**: Core payment & Midtrans integration
**Methods**:
- createPayment
- handleMidtransNotification
- getPaymentStatus
- getPaymentById
- getPaymentByOrderId
- updatePaymentStatus
- validatePayment

**Routes**: `/api/payments/create`, `/api/payments/notification`, `/api/payments/:id`

---

## 2. **EscrowController.js** (NEW - ~300 lines)
**Responsibility**: Escrow creation & release
**Methods**:
- createEscrow
- getEscrowById
- getEscrowByOrderId
- releaseEscrow
- getPendingEscrows
- getEscrowByPaymentId

**Routes**: `/api/payments/escrow/*`

---

## 3. **WithdrawalController.js** (NEW - ~300 lines)
**Responsibility**: Freelancer withdrawal requests
**Methods**:
- createWithdrawal
- getWithdrawalHistory
- getWithdrawalById
- cancelWithdrawal (if pending)

**Routes**: `/api/payments/withdrawal/*` (freelancer only)

---

## 4. **AdminWithdrawalController.js** (NEW - ~300 lines)
**Responsibility**: Admin withdrawal management
**Methods**:
- adminGetWithdrawals
- adminApproveWithdrawal (with file upload)
- adminRejectWithdrawal
- getPendingWithdrawals

**Routes**: `/api/payments/admin/withdrawals/*` (admin only)

---

## 5. **BalanceController.js** (NEW - ~250 lines)
**Responsibility**: User balance queries
**Methods**:
- getUserBalance (freelancer/client)
- getAvailableBalance
- getPendingBalance
- getBalanceHistory

**Routes**: `/api/payments/balance`

---

## 6. **AnalyticsController.js** (NEW - ~250 lines)
**Responsibility**: Payment analytics & reports
**Methods**:
- getFreelancerEarnings
- getClientSpending
- getWithdrawalAnalytics
- getEscrowAnalytics
- getPaymentStatistics

**Routes**: `/api/payments/analytics/*`

---

## File Structure (NEW)
```
backend/src/modules/payment/
├── presentation/
│   └── controllers/
│       ├── PaymentController.js           (300 lines) ✅
│       ├── EscrowController.js            (300 lines) 🆕
│       ├── WithdrawalController.js        (300 lines) 🆕
│       ├── AdminWithdrawalController.js   (300 lines) 🆕
│       ├── BalanceController.js           (250 lines) 🆕
│       ├── AnalyticsController.js         (250 lines) 🆕
│       └── PaymentController.OLD.js       (2090 lines - BACKUP)
```

---

## Implementation Strategy

### Phase 1: Create 5 NEW Controllers ✅
1. ✅ Backup: Copy PaymentController.js → PaymentController.OLD.js
2. 🆕 Create EscrowController.js
3. 🆕 Create WithdrawalController.js
4. 🆕 Create AdminWithdrawalController.js
5. 🆕 Create BalanceController.js
6. 🆕 Create AnalyticsController.js
7. ✅ Keep PaymentController.js (trim to 300 lines)

### Phase 2: Extract Methods
- Copy methods from PaymentController.OLD to new controllers
- Each controller imports required use cases & services
- Add proper error handling & logging

### Phase 3: Update Routes (Gradual)
- Update paymentRoutes.js to import 6 controllers
- Map routes to appropriate controllers
- Test each controller independently

### Phase 4: Cleanup (After Testing)
- Remove PaymentController.OLD.js (after confirmed working)
- Update documentation

---

## Benefits
✅ Max 300 lines per file (easy to read & maintain)
✅ Clear separation of concerns
✅ Independent testing per module
✅ Easier onboarding for new developers
✅ Better code organization
✅ Tester tidak panik - OLD controller tetap ada

---

## Safety Net
🔒 PaymentController.OLD.js kept as backup
🔒 Can rollback by reverting routes
🔒 Test each controller before final switch

---

## Method Distribution Analysis

### Current PaymentController Methods (~60 methods)

#### → PaymentController.js (Core Payment)
- createPayment
- handleMidtransNotification
- getPaymentStatus
- getPaymentById
- getPaymentByOrderId
- updatePaymentStatus
- validatePayment
- handlePaymentExpired
- retryPayment
- cancelPayment

#### → EscrowController.js
- createEscrow
- getEscrowById
- getEscrowByOrderId
- releaseEscrow
- getEscrowByPaymentId
- getPendingEscrows
- getReleasedEscrows
- updateEscrowStatus

#### → WithdrawalController.js (Freelancer)
- createWithdrawal
- getWithdrawalHistory
- getWithdrawalById
- getWithdrawalByStatus
- cancelWithdrawal

#### → AdminWithdrawalController.js (Admin)
- adminGetWithdrawals
- adminApproveWithdrawal
- adminRejectWithdrawal
- getPendingWithdrawals
- getWithdrawalStatistics

#### → BalanceController.js
- getUserBalance
- getAvailableBalance
- getPendingBalance
- getBalanceHistory
- getBalanceBreakdown

#### → AnalyticsController.js
- getFreelancerEarnings
- getClientSpending
- getWithdrawalAnalytics
- getEscrowAnalytics
- getPaymentStatistics
- getRevenueReport
- getTransactionSummary

---

## Next Steps

1. Review this plan
2. Get approval from team
3. Start Phase 1: Create new controllers
4. Test independently
5. Gradual migration

---

**Created**: 2025-12-10
**Author**: Claude Code
**Status**: Planning Phase
