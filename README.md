# Pohon Emas — Aplikasi Pembukuan Reseller Emas

Aplikasi web PWA untuk reseller emas Indonesia. Mencatat transaksi masuk/keluar stok logam mulia & perhiasan, generate story pricelist harian, buat invoice pelanggan, dan pantau harga emas real-time dari logammulia.com.

**Live:** https://pohonemas.vercel.app

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Ringkasan stok, total aset per gramasi, pergerakan harga harian |
| Barang Masuk | Catat pembelian logam mulia & perhiasan |
| Barang Keluar | Catat penjualan multi-item, cari stok dengan search |
| Riwayat | Filter, search pembeli/asal, generate invoice |
| Invoice | Landscape 1122×793px, brand custom, share WhatsApp |
| Generator Story | Pricelist PNG 1080×1920px untuk Instagram/WhatsApp |
| Harga Emas Hari Ini | Tabel harga & pergerakan dari logammulia.com |
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
VITE_SUPABASE_URL=https://[project-id].supabase.co
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

> **Catatan:** logammulia.com memblokir request dari datacenter IP (GitHub Actions, Vercel). Scraper harus dijalankan dari komputer lokal dengan residential IP.

### Setup

Buat file `.env.scraper` (tidak di-commit):

```env
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### Jalankan manual

```bash
node scripts/scrape-harga-emas.js
```

### Automasi — Windows Task Scheduler

Gunakan `scripts/run-scraper.bat` — jadwalkan via Task Scheduler setiap hari jam 10:00 WIB.

```powershell
# Setup task (jalankan sebagai Administrator)
$bat = "C:\path\to\scripts\run-scraper.bat"
Register-ScheduledTask -TaskName "Scraper Harga Emas" `
  -Action (New-ScheduledTaskAction -Execute $bat) `
  -Trigger (New-ScheduledTaskTrigger -Daily -At "10:00AM") `
  -RunLevel Highest -Force
```

---

## Deploy

### Vercel

1. Connect repo ke Vercel
2. Set environment variables di Vercel Dashboard:

| Variable | Keterangan |
|----------|------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

3. Build command: `npm run build`
4. Output directory: `dist`

---

## Struktur Branch & Workflow

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | pohonemas.vercel.app |
| `dev` | Staging | stgpohonemas.vercel.app |

**Workflow:**
```
develop di dev → push → test staging → merge ke main → auto-deploy prod
```

---

## Lisensi

Private — untuk penggunaan internal reseller Pohon Emas.
