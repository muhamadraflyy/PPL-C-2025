# ERD - Payment Module

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MODUL PAYMENT                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│      users         │         │    pesanan      │         │     layanan      │
│   (PK: id)         │         │   (PK: id)      │         │   (PK: id)       │
└────────────────────┘         └─────────────────┘         └──────────────────┘
         │                              │                            │
         │ 1:N                          │ 1:1                        │
         │                              │                            │
         ▼                              ▼                            │
┌────────────────────────────────────────────────────────────────────┐        │
│                        pembayaran                                  │        │
│                        (PK: id)                                    │        │
│                                                                    │        │
│  - transaction_id (unique)                                         │        │
│  - FK: pesanan_id ──────────────────────────────────┐             │        │
│  - FK: user_id                                       │             │        │
│  - metode_pembayaran (e-wallet/va/credit_card)      │             │        │
│  - payment_gateway (midtrans/xendit/mock)           │             │        │
│  - channel (gopay/ovo/bca_va/dll)                   │             │        │
│  - jumlah_pesanan                                    │             │        │
│  - biaya_platform (5%)                              │             │        │
│  - biaya_gateway (2.5%)                             │             │        │
│  - total_bayar                                       │             │        │
│  - status (menunggu/berhasil/gagal/kadaluarsa)      │             │        │
│  - payment_url                                       │             │        │
│  - invoice_url                                       │             │        │
│  - dibayar_pada                                      │             │        │
│  - kadaluarsa_pada                                   │             │        │
└────────────────────────────────────────────────────────────────────┘        │
         │ 1:1                         │ 1:N                                  │
         │                             │                                      │
         ▼                             ▼                                      │
┌──────────────────────┐     ┌─────────────────────┐                         │
│      escrow          │     │       refund        │                         │
│   (PK: id)           │     │    (PK: id)         │                         │
│                      │     │                     │                         │
│ - FK: pembayaran_id  │     │ - FK: pembayaran_id │                         │
│ - FK: pesanan_id     │     │ - FK: escrow_id     │                         │
│ - FK: freelancer_id ─┼─────┼─────────────────────┼─────────────────────────┘
│ - jumlah_escrow      │     │ - FK: user_id       │
│ - jumlah_platform_fee│     │ - jumlah_refund     │
│ - jumlah_diterima_   │     │ - alasan            │
│   freelancer         │     │ - status (pending/  │
│ - status (held/      │     │   processing/       │
│   released/refunded/ │     │   completed/failed) │
│   disputed/completed)│     │ - transaction_id    │
│ - ditahan_pada       │     │ - diproses_pada     │
│ - dirilis_pada       │     │ - selesai_pada      │
└──────────────────────┘     │ - catatan_admin     │
         │                   └─────────────────────┘
         │ N:1
         │
         ▼
┌──────────────────────┐
│    withdrawal        │
│   (PK: id)           │
│                      │
│ - FK: freelancer_id  │
│ - jumlah             │
│ - bank_name          │
│ - account_number     │
│ - account_name       │
│ - status (pending/   │
│   processing/        │
│   completed/failed)  │
│ - bukti_transfer     │
│ - catatan            │
│ - diajukan_pada      │
│ - diproses_pada      │
│ - selesai_pada       │
└──────────────────────┘


┌──────────────────────────────────────────┐
│         platform_config                  │
│         (PK: id)                         │
│                                          │
│ - config_key (unique)                    │
│   • platform_fee_percentage (5.0%)      │
│   • payment_gateway_fee_percentage      │
│     (2.5%)                               │
│   • minimum_withdrawal_amount           │
│ - config_value                           │
│ - description                            │
│ - FK: updated_by → users                │
└──────────────────────────────────────────┘
```

## Flow Diagram

```
1. PAYMENT FLOW
═══════════════
Client                Payment Gateway           System
  │                         │                      │
  │─── Create Order ───────────────────────────────>│
  │<─── Payment URL ────────────────────────────────│
  │                         │                      │
  │─── Pay ──────────────>│                      │
  │                         │                      │
  │                         │──── Webhook ───────>│
  │                         │                      │
  │                         │                   [Create Escrow]
  │                         │                      │
  │<─── Payment Success ────────────────────────────│


2. ESCROW FLOW
═══════════════
Payment Success ──> Create Escrow (status: held)
                         │
                    Order Completed
                         │
                  Release Escrow (status: released)
                         │
                  Freelancer Balance += jumlah_diterima


3. REFUND FLOW
═══════════════
Client Request ──> Refund (status: pending)
                         │
                    Admin Review
                    ╱         ╲
            Approve              Reject
               │                    │
        status: processing    status: failed
               │
      Freelancer Transfer
               │
        status: completed


4. WITHDRAWAL FLOW
═══════════════════
Freelancer Request ──> Withdrawal (status: pending)
                            │
                       Admin Review
                       ╱         ╲
               Approve              Reject
                  │                    │
          Upload Bukti           status: failed
                  │
          status: completed
```

## Business Rules

```
PAYMENT
├─ Total = jumlah_pesanan + biaya_platform + biaya_gateway
├─ Biaya platform = jumlah_pesanan × 5%
├─ Biaya gateway = jumlah_pesanan × 2.5%
├─ Expired setelah 24 jam jika tidak dibayar
└─ Satu order = max 1 payment berhasil

ESCROW
├─ Jumlah escrow = total_bayar - biaya_gateway
├─ Platform fee dipotong saat release
├─ Hanya client yang bisa release
└─ Admin bisa intervensi untuk dispute

REFUND
├─ Hanya untuk payment 'berhasil'
├─ Full refund (tidak partial)
├─ Admin approve → status 'processing'
├─ Admin reject → status 'failed'
└─ Freelancer transfer → status 'completed'

WITHDRAWAL
├─ Min. amount: Rp 50,000 (configurable)
├─ Balance = Σ(escrow released) - Σ(withdrawn)
├─ Admin upload bukti transfer saat approve
└─ Auto reject jika insufficient balance
```

## Status Enum Values

```
pembayaran.status
├─ menunggu
├─ berhasil
├─ gagal
└─ kadaluarsa

escrow.status
├─ held
├─ released
├─ refunded
├─ disputed
└─ completed

refund.status
├─ pending
├─ processing
├─ completed
└─ failed

withdrawal.status
├─ pending
├─ processing
├─ completed
└─ failed
```
