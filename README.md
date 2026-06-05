# Pohon Emas — Aplikasi Pembukuan Reseller Emas

Aplikasi web PWA untuk reseller emas Indonesia. Mencatat transaksi masuk/keluar stok logam mulia & perhiasan, generate story pricelist harian, buat invoice pelanggan, dan pantau harga emas dari logammulia.com.

**Live:** https://pohonemas.vercel.app | **Staging:** https://stgpohonemas.vercel.app

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Compact stat cards, urutan: Total Aset → Keuntungan → Modal → Stok. Filter Kategori/Tahun/Bulan. Tooltip Popover tap-friendly. |
| Barang Masuk | Form LM (Ganti Stok / Tambah Stok) & perhiasan. No Seri wajib & unik. Filter tanggal di riwayat. |
| Barang Keluar | Multi-item, Biaya Jual opsional, Ringkasan Penjualan dengan keuntungan per transaksi. |
| Riwayat | Sort by waktu input (terbaru atas). Eye icon detail masuk/keluar, batch detail + invoice. |
| Invoice | PDF landscape A4, Biaya Lain auto-fill, footnote *, brand custom, share WhatsApp. |
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

### 3. Database Migration

```sql
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('masuk', 'keluar')),
  category text not null check (category in ('logam_mulia', 'perhiasan')),
  date timestamptz not null,
  gramasi numeric not null, harga numeric not null,
  nama_product text, no_seri text, nomer_ref text, karat text,
  kode text, notes text, asal_barang text, source_id uuid, pembeli text,
  batch_id uuid, created_at timestamptz default now()
);
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, invoice_number text not null,
  sequence_number int not null, transaction_ids text[] not null,
  created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.harga_emas (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null, berat varchar(20) not null,
  berat_gram numeric not null, harga_dasar bigint not null,
  harga_pajak bigint not null, created_at timestamptz default now()
);
CREATE UNIQUE INDEX ON public.harga_emas (tanggal, berat);
ALTER TABLE public.harga_emas DISABLE ROW LEVEL SECURITY;
```

### 4. Jalankan

```bash
npm run dev
```

---

## Kalkulasi Dashboard

| Metric | Formula |
|--------|---------|
| Keuntungan Ganti Emas | Σ harga jual Ganti Stok − Σ harga beli Ganti Stok |
| Keuntungan HPP | Total Penjualan − HPP |
| HPP (Harga Pokok Penjualan) | Σ harga beli semua terjual + Σ biaya jual keluar |
| Total Penjualan | Σ harga jual keluar + Σ biaya jual (total dari customer) |
| Total Modal | Semua masuk termasuk stok belum terjual |
| Total Stok | Kumulatif masuk − keluar s/d akhir periode (tidak bisa minus) |
| Total Aset | Stok tersedia × harga per gramasi dari logammulia.com |

### Jenis Pencatatan Barang Masuk LM

| Jenis | Keterangan | Dampak Dashboard |
|-------|-----------|-----------------|
| **Ganti Stok** | Beli setelah jual, gramasi sama | Masuk Keuntungan Ganti Emas |
| **Tambah Stok** | Beli untuk menambah stok | Masuk HPP |

### Biaya Jual
Disimpan di `notes` per transaksi keluar: `biaya_jual:50000|ket:keterangan`. Hanya item pertama batch yang menyimpan biaya (tidak double-count). HPP mem-parse nilai ini otomatis.

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
