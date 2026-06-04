# Pohon Emas — Aplikasi Pembukuan Reseller Emas

Aplikasi web PWA untuk reseller emas Indonesia. Mencatat transaksi masuk/keluar stok logam mulia & perhiasan, generate story pricelist harian, buat invoice pelanggan, dan pantau harga emas dari logammulia.com.

**Live:** https://pohonemas.vercel.app | **Staging:** https://stgpohonemas.vercel.app

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Ringkasan stok, margin, total aset per gramasi, pergerakan harga — filter Kategori/Tahun/Bulan |
| Barang Masuk | Catat pembelian logam mulia & perhiasan |
| Barang Keluar | Catat penjualan multi-item, cari stok dengan search |
| Riwayat | Filter tabs kiri, search pembeli/asal kanan, generate invoice |
| Invoice | PDF landscape A4, brand custom, share WhatsApp |
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
VITE_SUPABASE_URL=https://[dev-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### 3. Database Migration

Jalankan SQL di Supabase SQL Editor:

```sql
-- Tabel transaksi
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('masuk', 'keluar')),
  category text not null check (category in ('logam_mulia', 'perhiasan')),
  date timestamptz not null,
  gramasi numeric not null,
  harga numeric not null,
  nama_product text, no_seri text, nomer_ref text, karat text,
  kode text, notes text, asal_barang text, source_id uuid, pembeli text,
  batch_id uuid, created_at timestamptz default now()
);
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Tabel invoice
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  invoice_number text not null,
  sequence_number int not null,
  transaction_ids text[] not null,
  created_at timestamptz default now()
);

-- Tabel harga emas harian
CREATE TABLE IF NOT EXISTS public.harga_emas (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  berat varchar(20) not null,
  berat_gram numeric not null,
  harga_dasar bigint not null,
  harga_pajak bigint not null,
  created_at timestamptz default now()
);
CREATE UNIQUE INDEX ON public.harga_emas (tanggal, berat);
ALTER TABLE public.harga_emas DISABLE ROW LEVEL SECURITY;
```

### 4. Jalankan

```bash
npm run dev
```

---

## Scraper Harga Emas

Scraper mengambil harga dari [logammulia.com](https://www.logammulia.com/id/harga-emas-hari-ini) dan menyimpan ke Supabase.

> **Catatan:** logammulia.com memblokir request dari datacenter IP (GitHub Actions, Vercel). Scraper harus dijalankan dari komputer lokal.

### Setup env file (tidak di-commit)

**Prod** — `.env.scraper`:
```env
SUPABASE_URL=https://[prod-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

**Dev** — `.env.scraper.dev`:
```env
SUPABASE_URL=https://[dev-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### Jalankan

```bash
# Prod
double-click scripts/run-scraper.bat

# Dev
double-click scripts/run-scraper-dev.bat
```

### Automasi — Windows Task Scheduler

Script `scripts/run-scraper.bat` dijadwalkan jam **08:58 WIB** via Task Scheduler dengan `WakeToRun` aktif.

---

## Data Dummy (Dev Only)

Script `scripts/seed-dummy-data.mjs` membuat 42 transaksi (Mar–Jun 2026) dengan margin ~Rp 51.9 juta untuk testing dashboard.

```bash
$env:SUPABASE_URL="https://[dev].supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
node scripts/seed-dummy-data.mjs
```

**⚠️ Hanya untuk dev Supabase — jangan jalankan ke prod.**

---

## Margin Calculation

`Estimasi Margin` = realized profit dari pasangan terjual saja:
- `profit` = Σ (keluar.harga − source_masuk.harga) untuk setiap keluar yang punya source_id
- `Total Harga Pembelian` = HPP = harga pokok barang yang sudah terjual
- **Bukan** total jual − total beli (bisa negatif kalau ada stok belum terjual)

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
develop → dev branch → push → staging (stgpohonemas.vercel.app) → test → merge main → prod
```

---

## Lisensi

Private — untuk penggunaan internal reseller Pohon Emas.
