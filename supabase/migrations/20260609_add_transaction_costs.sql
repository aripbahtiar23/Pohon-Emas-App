-- Migration: Tabel transaction_costs — pisah biaya ops/ongkir dari kolom notes
-- Jalankan di Supabase SQL Editor — DEV dulu, lalu PROD
-- Tanggal: 2026-06-09

CREATE TABLE IF NOT EXISTS transaction_costs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID        NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  type           TEXT        NOT NULL CHECK (type IN ('ongkir', 'operasional')),
  amount         NUMERIC     NOT NULL CHECK (amount > 0),
  keterangan     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_costs_tx_id ON transaction_costs(transaction_id);

-- Aktifkan realtime untuk table baru
ALTER PUBLICATION supabase_realtime ADD TABLE transaction_costs;

-- ── BACKFILL ──────────────────────────────────────────────────────────────────

-- 1. Backfill ongkir dari notes (format: ongkir:10000)
INSERT INTO transaction_costs (transaction_id, type, amount, keterangan)
SELECT
  id,
  'ongkir',
  CAST(SUBSTRING(notes FROM 'ongkir:(\d+)') AS NUMERIC),
  'Ongkos kirim'
FROM transactions
WHERE notes ~ 'ongkir:\d+'
  AND type = 'keluar'
  AND NOT EXISTS (
    SELECT 1 FROM transaction_costs tc
    WHERE tc.transaction_id = transactions.id AND tc.type = 'ongkir'
  );

-- 2. Backfill ops dari notes — bisa multiple per transaksi (format: ops:50000:komisi)
INSERT INTO transaction_costs (transaction_id, type, amount, keterangan)
SELECT
  t.id,
  'operasional',
  CAST(m[1] AS NUMERIC),
  NULLIF(TRIM(m[2]), '')
FROM transactions t,
  regexp_matches(t.notes, 'ops:(\d+):([^|]*)', 'g') AS m
WHERE t.notes ~ 'ops:\d+'
  AND t.type = 'keluar'
  AND NOT EXISTS (
    SELECT 1 FROM transaction_costs tc
    WHERE tc.transaction_id = t.id AND tc.type = 'operasional'
  );

-- 3. Backfill format lama: biaya_ops:X atau biaya_jual:X (sebelum format ops:X:label)
INSERT INTO transaction_costs (transaction_id, type, amount, keterangan)
SELECT
  id,
  'operasional',
  COALESCE(
    CAST(NULLIF(SUBSTRING(notes FROM 'biaya_ops:(\d+)'), '') AS NUMERIC),
    CAST(NULLIF(SUBSTRING(notes FROM 'biaya_jual:(\d+)'), '') AS NUMERIC)
  ),
  NULL
FROM transactions
WHERE (notes ~ 'biaya_ops:\d+' OR notes ~ 'biaya_jual:\d+')
  AND type = 'keluar'
  AND notes !~ 'ops:\d+'
  AND NOT EXISTS (
    SELECT 1 FROM transaction_costs tc
    WHERE tc.transaction_id = transactions.id AND tc.type = 'operasional'
  );

-- Verifikasi setelah migration:
-- SELECT type, COUNT(*), SUM(amount) FROM transaction_costs GROUP BY type;
-- SELECT COUNT(*) FROM transactions WHERE (notes ~ 'ongkir:\d+' OR notes ~ 'ops:\d+') AND type = 'keluar';
