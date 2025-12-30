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


┌──────────────────────────────────────────┐
│      metode_pembayaran                   │
│      (PK: id)                            │
│                                          │
│ - FK: user_id → users                   │
│ - tipe (e_wallet/bank/cc)               │
│ - provider (gopay/ovo/bca/dll)          │
│ - nomor_rekening (encrypted)            │
│ - nama_pemilik                           │
│ - empat_digit_terakhir                  │
│ - is_default (boolean)                  │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│           revisi                         │
│         (PK: id)                         │
│                                          │
│ - FK: pesanan_id → pesanan              │
│ - ke_berapa (int)                        │
│ - catatan (text)                         │
│ - lampiran (url)                         │
│ - status (pending/diterima/ditolak)     │
│ - tanggapan_revisi                      │
│ - selesai_pada                           │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│           dispute                        │
│         (PK: id)                         │
│                                          │
│ - FK: pesanan_id → pesanan              │
│ - FK: pembayaran_id → pembayaran        │
│ - FK: escrow_id → escrow                │
│ - FK: diajukan_oleh → users             │
│ - tipe (quality/late/scope/payment)     │
│ - alasan (text)                          │
│ - bukti (url)                            │
│ - status (open/investigating/           │
│           resolved/closed)               │
│ - keputusan (text)                       │
│ - alasan_keputusan (text)               │
│ - FK: diputuskan_oleh → users           │
│ - dibuka_pada, diselesaikan_pada        │
└──────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────────────────────┐
│       dispute_pesanan                    │
│         (PK: id)                         │
│                                          │
│ - FK: dispute_id → dispute              │
│ - FK: pengirim_id → users               │
│ - pesan (text)                           │
│ - lampiran (url)                         │
│ - created_at                             │
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


5. DISPUTE FLOW
═══════════════
User (Client/Freelancer) ──> Open Dispute (status: open)
                                   │
                            Admin Investigates
                                   │
                            Escrow di-hold (status: investigating)
                                   │
                    ┌──────────────┴──────────────┐
                    │    Dispute Messages         │
                    │    (dispute_pesanan)        │
                    │  - Client: "Issue X"        │
                    │  - Freelancer: "Response Y" │
                    │  - Admin: "Mediating..."    │
                    └──────────────┬──────────────┘
                                   │
                            Admin Decision
                       ╱           │           ╲
                      ▼            ▼            ▼
              Refund Penuh   Refund 50%   Lanjutkan
                    │            │            │
                    ▼            ▼            ▼
              Escrow→Client  Split Escrow  Escrow→FL
                    └────────────┴────────────┘
                                 │
                          status: resolved


6. REVISI FLOW
══════════════
Client ──> Request Revision
              │
        Create Revisi (status: pending)
              │
        Notify Freelancer
              │
        Freelancer Review
           ╱       ╲
      Terima      Tolak
         │          │
         ▼          ▼
    Work on it  status: ditolak
         │       (kuota tidak berkurang)
         ▼
    Submit Work
         │
         ▼
    status: diterima
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

METODE_PEMBAYARAN
├─ User bisa simpan multiple payment methods
├─ Hanya satu metode bisa dijadikan default
├─ Nomor rekening harus di-encrypt
├─ Display hanya tampilkan 4 digit terakhir
└─ User bisa hapus kapan saja

REVISI
├─ Jumlah revisi dibatasi sesuai paket layanan
├─ Hanya bisa diminta jika pesanan in_progress
├─ Auto-increment ke_berapa untuk tracking
├─ Freelancer bisa terima/tolak request
└─ Jika ditolak, kuota tidak berkurang

DISPUTE
├─ Hanya bisa diajukan setelah payment berhasil
├─ Escrow auto di-hold saat investigating
├─ Client & freelancer bisa kirim pesan
├─ Admin harus putuskan dalam 7 hari kerja
├─ Keputusan: refund penuh/sebagian/lanjutkan
├─ Escrow dirilis sesuai keputusan admin
└─ Dispute closed tidak bisa dibuka kembali

DISPUTE_PESANAN
├─ Thread komunikasi 3 pihak (client/FL/admin)
├─ Semua bisa upload bukti/attachment
├─ Messages tidak bisa edit/delete (audit trail)
└─ Auto-delete saat parent dispute dihapus
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

metode_pembayaran.tipe
├─ e_wallet
├─ bank_transfer
└─ credit_card

revisi.status
├─ pending
├─ diterima
└─ ditolak

dispute.tipe
├─ quality_issue
├─ delivery_late
├─ scope_change
└─ payment_issue

dispute.status
├─ open
├─ investigating
├─ resolved
└─ closed
```

## Recent Updates (2025)

```
╔══════════════════════════════════════════════════════════════════╗
║                    MODUL PAYMENT - UPDATES                       ║
╚══════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────┐
│ 0. COMPLETE ERD - 10 TABEL (dari erdmod4.jpeg)                  │
├──────────────────────────────────────────────────────────────────┤
│ Dokumentasi sekarang mencakup SEMUA 10 tabel dari ERD asli:     │
│                                                                  │
│ CORE PAYMENT (5 tabel):                                         │
│  ✓ pembayaran       - Payment transactions                      │
│  ✓ escrow           - Escrow management                         │
│  ✓ refund           - Refund requests                           │
│  ✓ pencairan_dana   - Withdrawals                               │
│  ✓ platform_config  - Configuration                             │
│                                                                  │
│ ADDITIONAL FEATURES (4 tabel - BARU DITAMBAHKAN):               │
│  ✓ metode_pembayaran - Saved payment methods                    │
│  ✓ revisi            - Order revisions                          │
│  ✓ dispute           - Dispute management                       │
│  ✓ dispute_pesanan   - Dispute messages/thread                  │
│                                                                  │
│ REFERENCED (1 tabel - dari modul lain):                         │
│  ✓ users, pesanan, layanan - Referenced tables                  │
│                                                                  │
│ Total: 10 TABEL PAYMENT MODULE TERDOKUMENTASI LENGKAP!          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 1. REFUND ENHANCEMENTS                                           │
├──────────────────────────────────────────────────────────────────┤
│ • catatan_admin (TEXT) - Admin notes saat approve/reject         │
│ • Order details di GET /api/payments/refunds endpoint            │
│ • Enhanced workflow dengan feedback lebih detail                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. WITHDRAWAL ENHANCEMENTS                                       │
├──────────────────────────────────────────────────────────────────┤
│ • Flexible withdrawal amount (min. Rp 50,000)                    │
│ • FIFO escrow selection untuk memenuhi jumlah withdrawal         │
│ • bank_name field untuk simpan nama bank spesifik                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. PAYMENT FEATURES                                              │
├──────────────────────────────────────────────────────────────────┤
│ • Dynamic platform fee via platform_config                       │
│ • Role-based analytics (freelancer/client/admin)                 │
│ • Real-time payment status check dari gateway                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 4. API RESPONSE EXAMPLE - Refund dengan Order Details           │
├──────────────────────────────────────────────────────────────────┤
│ GET /api/payments/refunds                                        │
│                                                                  │
│ {                                                                │
│   refund: {                                                      │
│     id, jumlah, alasan, status,                                 │
│     catatan_admin: "Memerlukan bukti tambahan",  ← NEW          │
│     user: { nama_depan, nama_belakang, email },                 │
│     pembayaran: {                                               │
│       total_bayar, status,                                      │
│       pesanan: {                                                │
│         judul: "Website Development",                           │
│         layanan: {                            ← NEW             │
│           judul: "Full Stack Development",                      │
│           slug: "full-stack-dev"                                │
│         }                                                       │
│       }                                                         │
│     }                                                           │
│   }                                                             │
│ }                                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

**Documentation Last Updated**: 2025-12-27

**Changes**:
- ✅ Added recent enhancements (catatan_admin, order details, FIFO withdrawal)
- ✅ Added 4 new tables from erdmod4.jpeg:
  - metode_pembayaran (Saved payment methods)
  - revisi (Order revisions)
  - dispute (Dispute management)
  - dispute_pesanan (Dispute messages/thread)
- ✅ Added complete ASCII diagrams for all tables
- ✅ Added flow diagrams for dispute and revisi
- ✅ Added business rules for all features
- ✅ **COMPLETE: 10 TABLES DOCUMENTED - Ready for ERD diagram creation!**
