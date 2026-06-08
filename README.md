# Pohon Emas — Aplikasi Pembukuan Reseller Emas

Aplikasi web PWA untuk reseller emas Indonesia. Mencatat transaksi masuk/keluar stok logam mulia & perhiasan, generate story pricelist harian, buat invoice pelanggan, dan pantau harga emas dari logammulia.com.

**Live:** https://pohonemas.vercel.app | **Staging:** https://stgpohonemas.vercel.app

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Total Aset (harga pasar), Keuntungan Ganti Stok + Buyback, Keuntungan Total Penjualan. Filter Kategori/Tahun/Bulan. Pergerakan harga emas hari ini. |
| Barang Masuk | 3 jenis: Tambah Stok, Ganti Stok, Buyback. LM & perhiasan. No Seri wajib & unik. |
| Barang Keluar | Multi-item, biaya ongkir + operasional (tersimpan di `transaction_costs`), ringkasan keuntungan per transaksi. |
| Riwayat | Sort by waktu input (terbaru atas). Eye icon detail masuk/keluar, batch detail + invoice. |
| Invoice | PDF landscape A4, biaya ongkir auto-fill, nomor urut otomatis, share WhatsApp. |
| Generator Story | Pricelist PNG 1080×1920px, auto-fill harga dari logammulia.com |
| Harga Emas Hari Ini | Tabel harga & pergerakan naik/turun dari logammulia.com |
| Auth | Login/daftar/profil via Clerk |
| PWA | Installable ke home screen Android & iOS |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite + TanStack Router |
| Styling | Tailwind v4 + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Deploy | Vercel |

---

## Setup Local

### 1. Clone & Install

```bash
git clone https://github.com/aripbahtiar23/Pohon-Emas-App.git
cd Pohon-Emas-App
npm install
```

### 2. Environment Variables

Buat file `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://[dev-project].supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### 3. Database Setup

Jalankan `supabase/schema.sql` di Supabase SQL Editor untuk setup dari awal.

Untuk database yang sudah ada, jalankan migrations secara urut:
```
supabase/migrations/20260603_harga_emas.sql
supabase/migrations/20260608_add_entry_type.sql
supabase/migrations/20260609_add_transaction_costs.sql
supabase/migrations/20260609_add_invoice_batch_id.sql
```

### 4. Jalankan

```bash
npm run dev
```

---

## Kalkulasi Dashboard

| Metric | Formula |
|--------|---------|
| Keuntungan Ganti Stok | Gramasi-matching FIFO cross-period: setiap Ganti Stok dicocokkan keluar gramasi sama |
| Keuntungan Buyback | item-level via source_id: harga jual − harga beli buyback |
| Keuntungan Total Penjualan | Total Penjualan − HPP |
| HPP | Σ harga beli (terjual) + Σ biaya operasional keluar |
| Total Penjualan | Σ harga jual keluar |
| Total Stok | Kumulatif masuk − keluar s/d akhir periode |
| Total Aset | Stok tersedia × harga per gramasi dari logammulia.com |

### Jenis Pencatatan Barang Masuk LM

| Jenis | DB `entry_type` | Dampak Dashboard |
|-------|----------------|-----------------|
| **Tambah Stok** | `tambah_stok` | Masuk HPP |
| **Ganti Stok** | `ganti_stok` | Masuk Keuntungan Ganti Stok |
| **Buyback** | `buyback` | Masuk Keuntungan Buyback |

### Biaya Keluar
Disimpan di tabel `transaction_costs` (type: `ongkir` atau `operasional`), linked ke transaksi keluar pertama per batch. HPP menggunakan biaya operasional. Ongkir ditampilkan di invoice.

### No Seri (Logam Mulia)
- Wajib diisi, unik per stok aktif
- Re-buy SN sama diizinkan jika barang sebelumnya sudah terjual

### Urutan Riwayat
Transaksi diurutkan berdasarkan `created_at` (waktu input) — transaksi terbaru muncul di atas.

---

## Scraper Harga Emas

Scraper mengambil harga dari [logammulia.com](https://www.logammulia.com/id/harga-emas-hari-ini).

> **Catatan:** logammulia.com kadang memblokir automated requests. Scraper menggunakan browser-like headers untuk bypass. Jalankan dari komputer lokal.

### Setup `.env.scraper` dan `.env.scraper.dev` (tidak di-commit)

```env
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### Jalankan
```bash
# Prod
scripts\run-scraper.bat

# Dev  
scripts\run-scraper-dev.bat
```

### Automasi — Task Scheduler jam 08:58 WIB

---

## Data Dummy (Dev Only)

```bash
$env:SUPABASE_URL="https://[dev].supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
node scripts/seed-dummy-data.mjs
```

⚠️ Hanya untuk dev Supabase.

---

## Deploy

### Vercel Environment Variables

| Variable | Keterangan |
|----------|------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

### Branch Workflow

```
develop → dev → push → staging → test → merge main → prod
```

---

## Lisensi

Private — untuk penggunaan internal reseller Pohon Emas.
