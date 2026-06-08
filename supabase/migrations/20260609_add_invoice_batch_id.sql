-- Migration: Tambah batch_id ke tabel invoices
-- Jalankan di Supabase SQL Editor — DEV dulu, lalu PROD
-- Tanggal: 2026-06-09

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_invoices_batch_id ON invoices(batch_id);

-- Backfill: invoice multi-item (transaksi sudah punya batch_id)
UPDATE invoices i
SET batch_id = t.batch_id
FROM transactions t
WHERE t.id = (i.transaction_ids[1])::uuid
  AND t.batch_id IS NOT NULL
  AND i.batch_id IS NULL;

-- Backfill: invoice single-item (transaksi belum punya batch_id)
DO $$
DECLARE
  inv  RECORD;
  nb   UUID;
  txid UUID;
BEGIN
  FOR inv IN
    SELECT id, transaction_ids
    FROM invoices
    WHERE batch_id IS NULL
      AND transaction_ids IS NOT NULL
      AND array_length(transaction_ids, 1) > 0
  LOOP
    nb   := gen_random_uuid();
    txid := (inv.transaction_ids[1])::uuid;

    UPDATE invoices     SET batch_id = nb WHERE id   = inv.id;
    UPDATE transactions SET batch_id = nb WHERE id   = txid AND batch_id IS NULL;
  END LOOP;
END $$;

-- Verifikasi: semua invoice sudah punya batch_id
-- SELECT COUNT(*) FROM invoices WHERE batch_id IS NULL;
