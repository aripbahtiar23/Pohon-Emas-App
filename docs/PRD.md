# PRD — Pohon Emas App
**Product Requirements Document**
Versi 1.0 · Juni 2026

---

## 1. Ringkasan Produk

**Pohon Emas** adalah aplikasi web PWA (Progressive Web App) untuk reseller emas Indonesia. Aplikasi ini membantu reseller mencatat transaksi pembelian dan penjualan emas, menghitung keuntungan secara otomatis, memantau harga emas harian, dan menghasilkan invoice serta pricelist untuk pelanggan.

**Live:** https://pohonemas.vercel.app

---

## 2. Latar Belakang & Masalah

Reseller emas skala kecil-menengah sering menghadapi tantangan:
- Pencatatan manual di buku/spreadsheet yang rawan salah
- Sulit melacak stok emas per item (gramasi, seri, asal)
- Tidak ada kalkulasi otomatis keuntungan per transaksi maupun per periode
- Proses pembuatan invoice dan pricelist memakan waktu
- Tidak ada visibilitas real-time terhadap harga pasar emas

---

## 3. Target Pengguna

| Persona | Deskripsi |
|---------|-----------|
| Reseller Emas | Penjual emas logam mulia & perhiasan, skala usaha kecil-menengah |
| Pemilik Bisnis | Membutuhkan laporan keuangan sederhana dan ringkasan stok |

---

## 4. Tujuan Produk

1. Menyederhanakan pencatatan transaksi masuk/keluar emas
2. Menampilkan kalkulasi keuntungan secara otomatis dan akurat
3. Memudahkan pembuatan invoice untuk pelanggan
4. Menyediakan pricelist harian yang dapat dibagikan via media sosial
5. Menampilkan harga emas terkini dari logammulia.com

---

## 5. Fitur Utama

### 5.1 Dashboard

**Tujuan:** Ringkasan bisnis dalam satu tampilan tanpa perlu scroll.

**Urutan card (atas ke bawah):**
1. **Total Aset** — estimasi nilai pasar stok saat ini berdasarkan harga logammulia.com + Pergerakan Harga Emas Hari Ini
2. **Keuntungan Ganti Emas** + **Keuntungan HPP** — dua metrik keuntungan terpisah
3. **Total Modal** + **Harga Pokok Penjualan** + **Total Penjualan**
4. **Total Stok** + **Stok Logam Mulia** + **Stok Perhiasan**
5. **Riwayat Transaksi Terbaru** (tabel)

**Filter:** Kategori (LM/Perhiasan), Tahun, Bulan — dengan tombol reset.

**Tooltip:** Setiap card memiliki ikon ℹ️ yang bisa diklik/tap untuk penjelasan.

**Sub-text card keuntungan:**
- Keuntungan Ganti Emas: jumlah terjual · jumlah masuk ganti stok
- Keuntungan HPP: jumlah terjual · total barang masuk

---

### 5.2 Barang Masuk

**Tujuan:** Mencatat pembelian emas (logam mulia & perhiasan).

**Jenis pencatatan (Logam Mulia):**

| Jenis | Definisi | Dampak Kalkulasi |
|-------|----------|-----------------|
| **Ganti Stok** | Emas dibeli setelah melakukan penjualan, gramasi sesuai yang dijual | Masuk Keuntungan Ganti Emas |
| **Tambah Stok** | Emas yang dimiliki/dibeli untuk menambah stok, tidak harus sama gramasinya | Masuk HPP (Harga Pokok Penjualan) |

**Field Logam Mulia:**
- Jenis Pencatatan * (Ganti Stok / Tambah Stok)
- Nama Product * (Antam Redmark, UBS, dll)
- Gramasi *
- No Seri * — wajib, unik per stok aktif; re-buy diizinkan jika sudah terjual
- Nomer REF (opsional)
- Asal Barang (opsional)
- Tanggal Pembelian *
- Harga Beli *

**Field Perhiasan:**
- Karat *, Gramasi *, Kode (opsional), Asal Barang (opsional), Tanggal *, Harga Beli *

---

### 5.3 Barang Keluar

**Tujuan:** Mencatat penjualan emas ke pelanggan, bisa multi-item dalam satu transaksi.

**Field utama:**
- Daftar barang (pilih dari stok tersedia via search combobox)
- Harga Jual per item *
- Nama Pembeli *
- Tanggal Penjualan *
- Biaya Jual (opsional) — disimpan per transaksi, bukan per item
- Keterangan Biaya Jual (opsional)

**Ringkasan Penjualan (preview sebelum simpan):**
- Jumlah Barang · Total Gramasi
- Biaya Jual (jika ada)
- Total Harga Jual (= harga jual items + biaya jual)
- Keuntungan (= Total Harga Jual − harga beli asal items)

**Edit Barang Keluar:** Bisa ubah Harga Jual, Nama Pembeli, Tanggal, Biaya Jual, Keterangan.

---

### 5.4 Riwayat Transaksi

**Tujuan:** Melihat semua transaksi dengan filter dan pencarian.

**Fitur:**
- Tabs filter: Semua / Logam Mulia / Perhiasan
- Search: nama pembeli / asal barang
- Filter tanggal: Dari–Sampai
- Urutan: terbaru diinput tampil di atas (`created_at` desc)
- Eye icon → popup detail lengkap per transaksi
- Edit & Delete per transaksi
- Generate Invoice (barang keluar)

**Popup Detail Barang Keluar:**
- Info lengkap: tanggal, pembeli, produk, no seri, gramasi, harga beli asal, harga jual, biaya jual, keterangan, keuntungan bersih
- Batch: detail per item + total harga jual + keuntungan bersih
- Tombol Invoice di footer

---

### 5.5 Invoice

**Tujuan:** Generate invoice PDF untuk pelanggan.

**Konten invoice:**
- No. Invoice (auto-generate atau manual)
- Nama Brand + logo custom (tersimpan di localStorage)
- Billed To: nama, alamat, no HP pelanggan
- Issued Date (opsional) + Due Date
- Tabel produk: nama, gramasi, unit price, total
- Summary: Subtotal, Biaya Lain* (jika ada), Down Payment, Repayment
- Total Price
- Rekening bank (tersimpan di localStorage)
- Footnote `*` jika ada biaya lain

**Output:** PDF landscape A4, bisa di-share via WhatsApp atau download.

---

### 5.6 Generator Story

**Tujuan:** Membuat pricelist PNG untuk posting Instagram Story / WhatsApp Status.

**Fitur:**
- Daftar harga sortable (drag & drop)
- Auto-fill dari database harga emas terkini
- Pergerakan harga (naik/turun) dengan nilai
- Pengaturan brand: logo, nama, sub-brand, lokasi, WhatsApp, headline
- Footer opsional: catatan harga, disclaimer
- Output: PNG 1080×1920px

---

### 5.7 Harga Emas Hari Ini

**Tujuan:** Menampilkan harga emas terkini dari logammulia.com.

**Fitur:**
- Tabel semua gramasi + harga dasar + harga pajak
- Pergerakan harga vs hari sebelumnya (naik/turun, persentase)

---

## 6. Kalkulasi Bisnis

### 6.1 Keuntungan Ganti Emas
```
= Σ harga jual (item Ganti Stok yang terjual)
− Σ harga beli (masuk Ganti Stok yang terjual)
```
Hanya menghitung item yang sebelumnya dicatat sebagai **Ganti Stok**.

### 6.2 Keuntungan HPP
```
= Total Penjualan − HPP
```

### 6.3 HPP (Harga Pokok Penjualan)
```
= Σ harga beli semua item terjual (Ganti Stok + Tambah Stok)
+ Σ biaya jual per transaksi keluar
```

### 6.4 Total Penjualan
```
= Σ harga jual per item keluar
+ Σ biaya jual (total yang diterima dari customer)
```

### 6.5 Total Aset
```
= Σ (gramasi item tersedia × harga pasar per gramasi hari ini)
```
Harga dari logammulia.com, diambil otomatis via scraper.

---

## 7. Aturan Bisnis Penting

| Aturan | Detail |
|--------|--------|
| No Seri wajib | Setiap logam mulia masuk harus punya No Seri |
| No Seri unik | Tidak boleh ada 2 item dengan SN sama yang masih di stok |
| Re-buy SN | SN yang pernah dijual boleh dipakai lagi untuk item baru |
| Biaya jual per trx | Biaya jual adalah biaya per transaksi (bukan per barang), tidak mengurangi keuntungan bersih |
| Stok tidak minus | Total stok selalu ≥ 0 (`Math.max(0, ...)`) |
| Filter stok | Filter kategori berlaku untuk stock cards di dashboard |

---

## 8. Arsitektur Teknis

### Stack
| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite + TanStack Router (SPA) |
| Styling | Tailwind v4 + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Deploy | Vercel |

### Realtime
- Supabase realtime subscription + custom `goldbook:update` event sebagai fallback
- Setiap CRUD dispatch `goldbook:update` untuk force re-fetch

### Penyimpanan Data Khusus
- **Jenis pencatatan masuk:** field `notes` = `entry_type:stok_awal` (Tambah Stok) atau null (Ganti Stok)
- **Biaya jual keluar:** field `notes` = `biaya_jual:50000|ket:keterangan`, hanya item pertama batch
- **Invoice settings:** localStorage (bank, brand)

---

## 9. Scraper Harga Emas

- Source: logammulia.com
- Frekuensi: otomatis 08:58 WIB via Windows Task Scheduler
- Jalankan dari komputer lokal (bukan server — logammulia.com blokir datacenter IP)
- Menggunakan browser-like headers untuk bypass Cloudflare protection
- Data disimpan ke tabel `harga_emas` di Supabase (upsert by tanggal+berat)

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Responsive | HP Android/iPhone, iPad, tablet, laptop, desktop |
| PWA | Installable ke home screen, offline-ready assets |
| Performance | First load < 3s, filter/search instan (client-side) |
| Security | Auth via Clerk, Supabase RLS disabled (single-tenant per user_id) |
| Urutan data | Terbaru diinput tampil paling atas (created_at desc) |

---

## 11. Out of Scope (Versi Ini)

- Multi-user / multi-toko
- Laporan ekspor Excel/PDF
- Notifikasi harga emas
- Integrasi payment gateway
- Manajemen pelanggan (CRM)

---

*Dokumen ini mencerminkan status produk per Juni 2026.*
