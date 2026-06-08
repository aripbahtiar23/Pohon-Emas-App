-- Migration: Add entry_type column to transactions
-- Jalankan di Supabase SQL Editor — DEV dulu, lalu PROD
-- Tanggal: 2026-06-08

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS entry_type TEXT
CHECK (entry_type IN ('tambah_stok', 'ganti_stok', 'buyback'));

-- Backfill: tambah_stok (sebelumnya notes='entry_type:stok_awal')
UPDATE transactions
SET entry_type = 'tambah_stok'
WHERE type = 'masuk'
  AND notes LIKE '%entry_type:stok_awal%'
  AND entry_type IS NULL;

-- Backfill: buyback
UPDATE transactions
SET entry_type = 'buyback'
WHERE type = 'masuk'
  AND notes LIKE '%entry_type:buyback%'
  AND entry_type IS NULL;

-- Backfill: ganti_stok (masuk tanpa entry_type di notes = ganti stok)
UPDATE transactions
SET entry_type = 'ganti_stok'
WHERE type = 'masuk'
  AND (notes IS NULL OR notes NOT LIKE '%entry_type:%')
  AND entry_type IS NULL;

-- Verifikasi setelah migration:
-- SELECT entry_type, COUNT(*) FROM transactions WHERE type = 'masuk' GROUP BY entry_type;
-- Pastikan TIDAK ada row masuk dengan entry_type IS NULL
