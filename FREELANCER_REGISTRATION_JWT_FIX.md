# Freelancer Registration JWT Token Fix

## Tanggal: 9 Desember 2025

### Masalah
Setelah user mendaftar sebagai freelancer (dari client), user diarahkan ke dashboard tapi muncul error:
> "Hanya freelancer yang dapat melihat pesanan masuk"

User harus switch role ke client, lalu switch lagi ke freelancer agar bisa melihat transaksi.

### Root Cause
1. Setelah user mendaftar sebagai freelancer, backend mengupdate role di database menjadi "freelancer"
2. Frontend mengupdate localStorage dengan role "freelancer"
3. **TAPI** JWT token yang lama masih menyimpan role "client"
4. Backend mengecek role dari JWT token (bukan localStorage)
5. Endpoint `/api/orders/incoming` memvalidasi `req.user.role === 'freelancer'` dari JWT token
6. Karena token masih "client", maka muncul error 403

### Solusi
Backend harus mengirimkan JWT token baru setelah role berubah, dan frontend harus menggunakan token baru tersebut.

### File yang Diubah

#### Backend

1. **`backend/src/modules/user/application/use-cases/CreateFreelancerProfile.js`**
   - Menambahkan `jwtService` ke constructor
   - Generate token JWT baru dengan role "freelancer"
   - Return token baru di response

2. **`backend/src/modules/user/application/use-cases/ChangeUserRole.js`**
   - Menambahkan `jwtService` ke constructor
   - Generate token JWT baru dengan role yang baru
   - Return token baru di response

3. **`backend/src/modules/user/presentation/controllers/UserController.js`**
   - Pass `jwtService` ke `CreateFreelancerProfile` use case
   - Pass `jwtService` ke `ChangeUserRole` use case

#### Frontend

4. **`frontend/src/services/authService.js`**
   - Update `createFreelancerProfile()` untuk menyimpan token baru dari backend
   - Token baru disimpan ke `localStorage.setItem("token", res.data.data.token)`

### Flow Setelah Fix

1. User (client) mendaftar sebagai freelancer
2. Backend:
   - Update role di database → "freelancer"
   - Generate JWT token baru dengan role "freelancer"
   - Return: `{ user, freelancerProfile, token }`
3. Frontend:
   - Update localStorage user dengan role "freelancer"
   - **Update JWT token dengan token baru**
   - Set active role ke "freelancer"
4. User diarahkan ke dashboard
5. Dashboard memanggil `/api/orders/incoming`
6. Backend membaca JWT token → role = "freelancer" ✅
7. Data transaksi berhasil dimuat

### Testing Checklist
- [ ] User baru mendaftar sebagai client
- [ ] User mendaftar sebagai freelancer
- [ ] Setelah registrasi freelancer, langsung diarahkan ke dashboard
- [ ] Dashboard freelancer langsung menampilkan data (tidak ada error)
- [ ] Tidak perlu switch role manual
- [ ] JWT token di localStorage ter-update dengan role "freelancer"
- [ ] Endpoint `/api/orders/incoming` berhasil diakses

### Catatan Tambahan
Fix ini juga berlaku untuk `switchRole()` yang sudah ada implementasi update token di frontend. Sekarang backend juga mengirimkan token baru saat role berubah, sehingga konsisten.
