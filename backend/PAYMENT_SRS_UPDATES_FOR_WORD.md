# SRS Modul 4 - Payment Gateway: Dokumen Update

**Versi:** 2.0
**Tanggal Update:** 15 Desember 2025
**Alasan Update:** Perubahan dari Mock Payment Gateway ke Midtrans Payment Gateway
**Status:** Siap untuk review dan approval

---

## RINGKASAN PERUBAHAN

Dokumen SRS Modul 4 - Payment Gateway perlu diupdate untuk mencerminkan implementasi actual yang menggunakan **Midtrans Payment Gateway** bukan Mock Payment Gateway.

**Total Perubahan:** 10-15 instance di 6 section utama
**Jenis Perubahan:** Find & Replace text
**Dampak:** Documentation only (kode sudah menggunakan Midtrans)

---

## DAFTAR PERUBAHAN PER SECTION

### Section 2.1.1 - Tahapan Pembayaran Order (Halaman 7)

#### Perubahan 1: Step 8

**Teks Lama (Salah):**
```
Step 8: Sistem mengirim request pembayaran ke Mock Payment Gateway dengan detail:
- Transaction ID
- Jumlah pembayaran (termasuk biaya platform)
- Metode pembayaran
- Customer details
```

**Teks Baru (Benar):**
```
Step 8: Sistem mengirim request pembayaran ke Midtrans Payment Gateway dengan detail:
- Transaction ID
- Jumlah pembayaran (termasuk biaya platform)
- Metode pembayaran
- Customer details
```

#### Perubahan 2: Step 9

**Teks Lama (Salah):**
```
Step 9: Mock Payment Gateway mengembalikan Payment URL dan instruksi pembayaran sesuai metode yang dipilih
```

**Teks Baru (Benar):**
```
Step 9: Midtrans Payment Gateway mengembalikan Payment URL dan instruksi pembayaran sesuai metode yang dipilih
```

---

### Section 2.3 - Software Requirements (Halaman 12-13)

#### Perubahan 3: Requirement SR-06

**Teks Lama (Salah):**
```
SR-06: Sistem harus dapat membuat payment URL dari Mock Payment Gateway untuk berbagai metode pembayaran (QRIS, Virtual Account, E-Wallet, Transfer Bank, Kartu Kredit).
```

**Teks Baru (Benar):**
```
SR-06: Sistem harus dapat membuat payment URL dari Midtrans Payment Gateway untuk berbagai metode pembayaran (QRIS, Virtual Account, E-Wallet, Transfer Bank, Kartu Kredit).
```

---

### Section 3.1.1 - Use Case UC-01: Membuat Pembayaran (Halaman 18-19)

#### Perubahan 4: Main Flow Step 6

**Teks Lama (Salah):**
```
6. Sistem mengirim request pembayaran ke Mock Payment Gateway dengan detail:
   - Transaction ID
   - Jumlah pembayaran
   - Metode pembayaran
   - Customer details (nama, email, nomor telepon)
```

**Teks Baru (Benar):**
```
6. Sistem mengirim request pembayaran ke Midtrans Payment Gateway dengan detail:
   - Transaction ID
   - Jumlah pembayaran
   - Metode pembayaran
   - Customer details (nama, email, nomor telepon)
```

#### Perubahan 5: Main Flow Step 7

**Teks Lama (Salah):**
```
7. Mock Payment Gateway mengembalikan Payment URL dan instruksi pembayaran
```

**Teks Baru (Benar):**
```
7. Midtrans Payment Gateway mengembalikan Payment URL dan instruksi pembayaran
```

---

### Section 3.1.2 - Use Case UC-02: Verifikasi Pembayaran (Halaman 20-21)

#### Perubahan 6: Main Flow Step 1

**Teks Lama (Salah):**
```
1. Mock Payment Gateway mengirim webhook notification ke sistem
```

**Teks Baru (Benar):**
```
1. Midtrans Payment Gateway mengirim webhook notification ke sistem
```

#### Perubahan 7: Main Flow Step 2

**Teks Lama (Salah):**
```
2. Sistem menerima dan memverifikasi signature dari Mock Payment Gateway
```

**Teks Baru (Benar):**
```
2. Sistem menerima dan memverifikasi signature dari Midtrans Payment Gateway
```

---

### Section 3.2 - Diagram Sekuens UC-01 (Halaman 29)

#### Perubahan 8: Nama Entity/Actor

**Teks Lama (Salah):**
```
Entity: MockPayment Gateway
```

**Teks Baru (Benar):**
```
Entity: Midtrans Gateway
```

**Catatan untuk Diagram:**
Ubah semua label "MockPayment Gateway" menjadi "Midtrans Gateway" di diagram sequence.

**Interaksi yang Terlibat:**
1. Sistem → Midtrans Gateway: `createTransaction(params)`
2. Midtrans Gateway → Sistem: `{ payment_url, external_id, instructions }`
3. Midtrans Gateway → Sistem: `webhook notification { status, transaction_id }`

---

### Section 3.3 - Diagram Analisis Kelas (Halaman 30-34)

Ubah di SEMUA class analysis diagrams (UC-01 sampai UC-05):

#### Perubahan 9: Class Boundary Name

**Teks Lama (Salah):**
```
<<Boundary>>
MockPayment Gateway
```

**Teks Baru (Benar):**
```
<<Boundary>>
MidtransGateway
```

**Atau alternatif (lebih generic):**
```
<<Boundary>>
PaymentGateway
```

---

#### Detail per Use Case:

**UC-01: Membuat Pembayaran (Halaman 30)**
- Ubah: `MockPayment Gateway` → `MidtransGateway`
- Class methods tetap sama

**UC-02: Verifikasi Pembayaran (Halaman 31)**
- Ubah: `MockPayment Gateway` → `MidtransGateway`
- Class methods tetap sama

**UC-03: Release Escrow (Halaman 32)**
- Ubah: `MockPayment Gateway` → `MidtransGateway`
- **Catatan:** UC-03 sebenarnya tidak memerlukan interaksi dengan payment gateway, pertimbangkan untuk menghapus entitas ini dari diagram

**UC-04: Pencairan Dana (Halaman 33)**
- Ubah: `MockPayment Gateway` → `MidtransGateway` (jika ada)
- **Catatan:** UC-04 (withdrawal) tidak menggunakan payment gateway karena admin transfer manual. Pertimbangkan untuk menghapus entitas payment gateway dari diagram ini.

**UC-05: Refund (Halaman 34)**
- Ubah: `MockPayment Gateway` → `MidtransGateway`
- **Catatan:** Proses refund saat ini semi-manual (admin approve di sistem, proses actual di Midtrans Dashboard)

---

## CATATAN TAMBAHAN UNTUK DIAGRAM

### Rekomendasi Perubahan Class Structure:

**Class: MidtransGateway**

```
<<Boundary>>
MidtransGateway
────────────────────
+ createTransaction(params): Object
+ getPaymentStatus(transactionId): Object
+ handleWebhook(notification): Object
+ verifySignature(data, signature): Boolean
```

**Attributes:**
- merchantId: String
- serverKey: String
- clientKey: String
- isProduction: Boolean

**Methods:**
- `createTransaction()`: Membuat transaksi payment dan return payment URL
- `getPaymentStatus()`: Query status payment dari Midtrans API
- `handleWebhook()`: Process webhook notification dari Midtrans
- `verifySignature()`: Verify signature hash untuk keamanan

---

## SECTION YANG SUDAH BENAR (TIDAK PERLU DIUBAH)

### Section 1.6 - Referensi (Halaman 4-5)

Sudah benar mention Midtrans:
```
✓ Midtrans Payment Gateway API Documentation
✓ Xendit Payment Gateway API Documentation (alternatif)
```

**Saran tambahan:**
Tambahkan catatan di section ini:

```
Catatan Implementasi:
Sistem menggunakan Midtrans Payment Gateway untuk production environment.
Mock Payment Gateway tersedia hanya untuk keperluan testing dan development.
```

---

## TABEL RINGKASAN PERUBAHAN

| No | Section | Halaman | Teks yang Diubah | Jumlah Instance |
|----|---------|---------|------------------|-----------------|
| 1 | 2.1.1 Business Process | 7 | Mock Payment Gateway → Midtrans Payment Gateway | 2 |
| 2 | 2.3 Requirements | 12-13 | Mock Payment Gateway → Midtrans Payment Gateway | 1 |
| 3 | 3.1.1 UC-01 Scenario | 18-19 | Mock Payment Gateway → Midtrans Payment Gateway | 2 |
| 4 | 3.1.2 UC-02 Scenario | 20-21 | Mock Payment Gateway → Midtrans Payment Gateway | 2 |
| 5 | 3.2 Sequence Diagram | 29 | MockPayment Gateway → Midtrans Gateway | 1+ |
| 6 | 3.3.1 Class Diagram UC-01 | 30 | MockPayment Gateway → MidtransGateway | 1 |
| 7 | 3.3.2 Class Diagram UC-02 | 31 | MockPayment Gateway → MidtransGateway | 1 |
| 8 | 3.3.3 Class Diagram UC-03 | 32 | MockPayment Gateway → MidtransGateway | 1 |
| 9 | 3.3.4 Class Diagram UC-04 | 33 | MockPayment Gateway → (Remove/Update) | 1 |
| 10 | 3.3.5 Class Diagram UC-05 | 34 | MockPayment Gateway → MidtransGateway | 1 |

**Total Perubahan:** 13-15 instance

---

## FIND & REPLACE QUICK REFERENCE

Gunakan Find & Replace di Microsoft Word:

| Find (Cari) | Replace (Ganti Dengan) |
|-------------|------------------------|
| `Mock Payment Gateway` | `Midtrans Payment Gateway` |
| `MockPayment Gateway` | `Midtrans Gateway` |
| `MockPaymentGateway` | `MidtransGateway` |

**Peringatan:**
Lakukan Find & Replace dengan hati-hati. Review setiap perubahan sebelum apply all.

---

## VERIFICATION CHECKLIST

Setelah melakukan update, verifikasi hal berikut:

- [ ] Section 2.1.1: Semua mention "Mock" sudah diganti "Midtrans"
- [ ] Section 2.3: Requirement SR-06 sudah menggunakan "Midtrans"
- [ ] Section 3.1.1: UC-01 scenario sudah menggunakan "Midtrans"
- [ ] Section 3.1.2: UC-02 scenario sudah menggunakan "Midtrans"
- [ ] Section 3.2: Sequence diagram entity name sudah "Midtrans Gateway"
- [ ] Section 3.3: Semua class diagrams sudah menggunakan "MidtransGateway"
- [ ] Tidak ada typo atau formatting error
- [ ] Diagram-diagram sudah di-update visual-nya (jika menggunakan tools seperti draw.io)
- [ ] Version number dokumen sudah di-increment (misalnya: v1.0 → v2.0)
- [ ] Change log sudah ditambahkan di awal dokumen

---

## INFORMASI IMPLEMENTASI TEKNIS

### Environment Configuration

Implementasi backend saat ini menggunakan:

**Environment Variable:**
```
PAYMENT_GATEWAY=midtrans
NODE_ENV=development

MIDTRANS_MERCHANT_ID=G799521996
MIDTRANS_SERVER_KEY=SB-Mid-server-5FHTcUDCpZq1g8TIgjgbas-4
MIDTRANS_CLIENT_KEY=SB-Mid-client-sySq1i7cCIQnCtxH
MIDTRANS_IS_PRODUCTION=false
```

**Gateway Selection Logic:**
```javascript
const useRealGateway = process.env.PAYMENT_GATEWAY === 'midtrans' ||
                      process.env.NODE_ENV === 'production';

this.paymentGateway = useRealGateway
  ? new MidtransService()
  : new MockPaymentGatewayService();
```

Karena `PAYMENT_GATEWAY=midtrans`, sistem menggunakan **MidtransService** untuk production.

### Payment Methods yang Didukung

Midtrans Payment Gateway mendukung:

1. **QRIS** - QR Code Indonesia Standard
2. **Virtual Account** - BCA, Mandiri, BNI, BRI, Permata
3. **E-Wallet** - GoPay, OVO, ShopeePay, DANA, LinkAja
4. **Transfer Bank** - Manual bank transfer
5. **Kartu Kredit** - Visa, MasterCard, JCB

### Transaction Flow

1. Client request payment → Backend create transaction via Midtrans API
2. Midtrans return payment URL
3. Client complete payment di Midtrans page
4. Midtrans send webhook notification → Backend
5. Backend verify signature & update payment status
6. Auto-create escrow jika payment berhasil
7. Update order status menjadi "dibayar"

---

## ADDITIONAL NOTES

### Kenapa Mock Service Masih Ada di Codebase?

Mock Payment Gateway Service (`MockPaymentGatewayService.js`) masih ada di codebase untuk:

1. **Development & Testing** - Testing flow payment tanpa charge real payment
2. **Unit Testing** - Test automation tanpa dependency ke Midtrans
3. **QA Testing** - Manual trigger success/failure untuk testing
4. **Demo Purposes** - Demo fitur tanpa setup Midtrans account

**Endpoint Testing (Development Only):**
- `POST /api/payments/mock/trigger-success`
- `POST /api/payments/mock/trigger-failure`

Endpoint ini **HANYA** aktif di `NODE_ENV=development` dan tidak tersedia di production.

---

## APPROVAL & SIGN-OFF

**Dokumen ini telah direview dan disetujui oleh:**

| Role | Nama | Tanggal | Tanda Tangan |
|------|------|---------|--------------|
| Backend Developer |  | ___/___/2025 |  |
| QA Engineer |  | ___/___/2025 |  |
| Technical Lead |  | ___/___/2025 |  |
| Project Manager |  | ___/___/2025 |  |

---

## REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [Original Date] | [Original Author] | Initial SRS document |
| 2.0 | 15 Dec 2025 | [Your Name] | Update Mock Payment Gateway → Midtrans Payment Gateway (13-15 instances) |

---

## CONTACT & SUPPORT

Untuk pertanyaan atau klarifikasi mengenai update ini, hubungi:

**Backend Team:**
Email: backend@skillconnect.com
Slack: #backend-payment-module

**Documentation Team:**
Email: docs@skillconnect.com
Slack: #documentation

---

**DOKUMEN INI SIAP UNTUK:**
✓ Copy-paste ke Microsoft Word
✓ Review oleh stakeholder
✓ Approval dan sign-off
✓ Integrasi ke SRS final

**END OF DOCUMENT**
