-- Pohon Emas App — Full Schema
-- Last updated: 2026-06-09
-- Run this in Supabase SQL Editor for a fresh database setup

-- ── transactions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  type         TEXT        NOT NULL CHECK (type IN ('masuk', 'keluar')),
  category     TEXT        NOT NULL CHECK (category IN ('logam_mulia', 'perhiasan')),
  entry_type   TEXT        CHECK (entry_type IN ('tambah_stok', 'ganti_stok', 'buyback')),
  date         TIMESTAMPTZ NOT NULL,
  gramasi      NUMERIC     NOT NULL,
  harga        NUMERIC     NOT NULL,
  nama_product TEXT,
  no_seri      TEXT,
  nomer_ref    TEXT,
  karat        TEXT,
  kode         TEXT,
  notes        TEXT,
  asal_barang  TEXT,
  source_id    UUID        REFERENCES public.transactions(id) ON DELETE SET NULL,
  pembeli      TEXT,
  batch_id     UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id  ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date     ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_batch_id ON public.transactions(batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source_id ON public.transactions(source_id);

-- ── transaction_costs ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.transaction_costs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID        NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL CHECK (type IN ('ongkir', 'operasional')),
  amount         NUMERIC     NOT NULL CHECK (amount > 0),
  keterangan     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_costs_tx_id ON public.transaction_costs(transaction_id);

-- ── invoices ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL,
  invoice_number  TEXT,
  sequence_number INTEGER,
  transaction_ids JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── harga_emas ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.harga_emas (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal     DATE        NOT NULL,
  berat       TEXT,
  berat_gram  NUMERIC,
  harga_dasar NUMERIC,
  harga_pajak NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harga_emas_tanggal ON public.harga_emas(tanggal DESC);

-- ── Realtime ──────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_costs;
