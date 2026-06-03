-- Tabel harga emas harian dari logammulia.com
CREATE TABLE IF NOT EXISTS public.harga_emas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal      DATE        NOT NULL,
  berat        VARCHAR(20) NOT NULL,
  berat_gram   NUMERIC     NOT NULL,
  harga_dasar  BIGINT      NOT NULL,
  harga_pajak  BIGINT      NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Unique: 1 baris per tanggal + berat
CREATE UNIQUE INDEX IF NOT EXISTS idx_harga_emas_tanggal_berat
  ON public.harga_emas (tanggal, berat);

CREATE INDEX IF NOT EXISTS idx_harga_emas_tanggal
  ON public.harga_emas (tanggal DESC);

-- RLS
ALTER TABLE public.harga_emas ENABLE ROW LEVEL SECURITY;

-- Public bisa SELECT
CREATE POLICY "public_read_harga_emas"
  ON public.harga_emas FOR SELECT
  TO anon, authenticated
  USING (true);

-- Hanya service_role yang bisa INSERT/UPDATE (scraper)
CREATE POLICY "service_role_write_harga_emas"
  ON public.harga_emas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
