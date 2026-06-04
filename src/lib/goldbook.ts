import { supabase } from "./supabase";

export type Category = "logam_mulia" | "perhiasan";
export type TxType   = "masuk" | "keluar";

export const PRODUK_LM = [
  "UBS",
  "Galeri24",
  "Antam Redmark",
  "Antam Non Redmark",
  "Antam Retro",
] as const;

export interface Transaction {
  id: string;
  type: TxType;
  category: Category;
  date: string;
  namaProduct?: string;
  noSeri?: string;
  nomerRef?: string;
  karat?: string;
  kode?: string;
  gramasi: number;
  harga: number;
  notes?: string;
  asalBarang?: string;
  sourceId?: string;
  pembeli?: string;
  batchId?: string;
}

// ── DB row ↔ app type mappers ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToTx(row: any): Transaction {
  return {
    id:          row.id,
    type:        row.type,
    category:    row.category,
    date:        row.date,
    gramasi:     Number(row.gramasi),
    harga:       Number(row.harga),
    namaProduct: row.nama_product  ?? undefined,
    noSeri:      row.no_seri       ?? undefined,
    nomerRef:    row.nomer_ref     ?? undefined,
    karat:       row.karat         ?? undefined,
    kode:        row.kode          ?? undefined,
    notes:       row.notes         ?? undefined,
    asalBarang:  row.asal_barang   ?? undefined,
    sourceId:    row.source_id     ?? undefined,
    pembeli:     row.pembeli       ?? undefined,
    batchId:     row.batch_id      ?? undefined,
  };
}

function txToDb(userId: string, tx: Omit<Transaction, "id">) {
  return {
    user_id:      userId,
    type:         tx.type,
    category:     tx.category,
    date:         tx.date,
    gramasi:      tx.gramasi,
    harga:        tx.harga,
    nama_product: tx.namaProduct ?? null,
    no_seri:      tx.noSeri      ?? null,
    nomer_ref:    tx.nomerRef    ?? null,
    karat:        tx.karat       ?? null,
    kode:         tx.kode        ?? null,
    notes:        tx.notes       ?? null,
    asal_barang:  tx.asalBarang  ?? null,
    source_id:    tx.sourceId    ?? null,
    pembeli:      tx.pembeli     ?? null,
    batch_id:     tx.batchId     ?? null,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function fetchTx(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbToTx);
}

export async function insertTx(userId: string, tx: Omit<Transaction, "id">): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .insert(txToDb(userId, tx));
  if (error) throw error;
  // Force update pada hook useTransactions (fallback jika realtime lambat)
  if (typeof window !== "undefined") window.dispatchEvent(new Event("goldbook:update"));
}

export async function removeBatch(batchId: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("batch_id", batchId);
  if (error) throw error;
}

export async function removeTx(id: string): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("goldbook:update"));
}

export async function patchTx(
  id: string,
  patch: Partial<Omit<Transaction, "id">>,
): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.type         !== undefined) dbPatch.type         = patch.type;
  if (patch.category     !== undefined) dbPatch.category     = patch.category;
  if (patch.date         !== undefined) dbPatch.date         = patch.date;
  if (patch.gramasi      !== undefined) dbPatch.gramasi      = patch.gramasi;
  if (patch.harga        !== undefined) dbPatch.harga        = patch.harga;
  if (patch.namaProduct  !== undefined) dbPatch.nama_product = patch.namaProduct;
  if (patch.noSeri       !== undefined) dbPatch.no_seri      = patch.noSeri;
  if (patch.nomerRef     !== undefined) dbPatch.nomer_ref    = patch.nomerRef;
  if (patch.karat        !== undefined) dbPatch.karat        = patch.karat;
  if (patch.kode         !== undefined) dbPatch.kode         = patch.kode;
  if (patch.notes        !== undefined) dbPatch.notes        = patch.notes;
  if (patch.asalBarang   !== undefined) dbPatch.asal_barang  = patch.asalBarang;
  if (patch.sourceId     !== undefined) dbPatch.source_id    = patch.sourceId;
  if (patch.pembeli      !== undefined) dbPatch.pembeli      = patch.pembeli;
  if (patch.batchId      !== undefined) dbPatch.batch_id     = patch.batchId;

  const { error } = await supabase
    .from("transactions")
    .update(dbPatch)
    .eq("id", id);
  if (error) throw error;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("goldbook:update"));
}

export async function fetchAvailableStock(userId: string): Promise<Transaction[]> {
  const all = await fetchTx(userId);
  const soldIds = new Set(
    all.filter((t) => t.type === "keluar" && t.sourceId).map((t) => t.sourceId!),
  );
  return all.filter((t) => t.type === "masuk" && !soldIds.has(t.id));
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

export function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatGr(n: number) {
  return `${n.toLocaleString("id-ID", { maximumFractionDigits: 3 })} gr`;
}

export function summarize(list: Transaction[]) {
  let lmIn = 0, lmOut = 0, phIn = 0, phOut = 0, beli = 0, jual = 0;

  for (const t of list) {
    if (t.type === "masuk") {
      beli += t.harga;
      if (t.category === "logam_mulia") lmIn += t.gramasi;
      else phIn += t.gramasi;
    } else {
      jual += t.harga;
      if (t.category === "logam_mulia") lmOut += t.gramasi;
      else phOut += t.gramasi;
    }
  }

  return {
    lmStock:    lmIn - lmOut,
    phStock:    phIn - phOut,
    totalStock: lmIn - lmOut + phIn - phOut,
    totalBeli:  beli,
    totalJual:  jual,
    profit:   jual - beli,  // Total Penjualan - Total Pembelian
    count:      list.length,
  };
}
