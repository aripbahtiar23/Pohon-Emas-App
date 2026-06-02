-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  type        text not null check (type in ('masuk', 'keluar')),
  category    text not null check (category in ('logam_mulia', 'perhiasan')),
  date        timestamptz not null,
  gramasi     numeric not null,
  harga       numeric not null,
  nama_product text,
  no_seri     text,
  nomer_ref   text,
  karat       text,
  kode        text,
  notes       text,
  asal_barang text,
  source_id   uuid,
  pembeli     text,
  created_at  timestamptz default now()
);

create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_date    on public.transactions(date desc);

-- Realtime
alter publication supabase_realtime add table public.transactions;
