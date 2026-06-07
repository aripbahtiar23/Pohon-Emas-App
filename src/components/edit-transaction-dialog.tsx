import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGr, formatIDR, PRODUK_LM, patchTx, type Transaction } from "@/lib/goldbook";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

const KARAT_OPTIONS = ["24K", "22K", "21K", "18K", "14K", "10K"];

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

interface Props {
  tx: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function EditTransactionDialog({ tx, open, onClose }: Props) {
  const { userId } = useAuth();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [entryType, setEntryType] = useState<"beli" | "stok_awal">("beli");

  useEffect(() => {
    if (!tx) return;
    if (tx.type === "keluar") {
      const biayaVal = parseInt(tx.notes?.match(/biaya_jual:(\d+)/)?.[1] ?? "0") || 0;
      const ketVal = tx.notes?.match(/ket:(.+)/)?.[1]?.trim() ?? "";
      setFields({
        harga: formatRupiah(String(tx.harga)),
        pembeli: tx.pembeli ?? "",
        tanggal: toDateInput(tx.date),
        biayaJual: biayaVal > 0 ? formatRupiah(String(biayaVal)) : "",
        keteranganBiaya: ketVal,
      });
    } else if (tx.category === "logam_mulia") {
      setEntryType(tx.notes?.includes("entry_type:stok_awal") ? "stok_awal" : "beli");
      setFields({
        namaProduct: tx.namaProduct ?? PRODUK_LM[0],
        gramasi: String(tx.gramasi),
        noSeri: tx.noSeri ?? "",
        harga: formatRupiah(String(tx.harga)),
        nomerRef: tx.nomerRef ?? "",
        asalBarang: tx.asalBarang ?? "",
        tanggal: toDateInput(tx.date),
      });
    } else {
      setFields({
        karat: tx.karat ?? "24K",
        gramasi: String(tx.gramasi),
        kode: tx.kode ?? "",
        harga: formatRupiah(String(tx.harga)),
        asalBarang: tx.asalBarang ?? "",
        tanggal: toDateInput(tx.date),
      });
    }
  }, [tx]);

  if (!tx) return null;

  const set = (key: string, val: string) =>
    setFields((prev) => ({ ...prev, [key]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const harga = parseRupiah(fields.harga);
    if (!harga) return toast.error("Harga wajib diisi");
    const date = new Date(fields.tanggal + "T00:00:00").toISOString();
    try {
      if (tx.type === "keluar") {
        const biayaNum = parseRupiah(fields.biayaJual) || 0;
        const ket = fields.keteranganBiaya?.trim() ?? "";
        const parts: string[] = [];
        if (biayaNum > 0) parts.push(`biaya_jual:${biayaNum}`);
        if (ket) parts.push(`ket:${ket}`);
        await patchTx(tx.id, {
          harga, pembeli: fields.pembeli.trim() || undefined, date,
          notes: parts.length ? parts.join("|") : "",
        });
      } else if (tx.category === "logam_mulia") {
        const gramasi = parseFloat(fields.gramasi);
        if (!fields.noSeri?.trim()) return toast.error("No Seri wajib diisi");
        if (!gramasi) return toast.error("Gramasi wajib diisi");
        // Cek SN duplikat — hanya blokir kalau SN masih ada di stok (belum terjual), exclude tx ini sendiri
        const { data: existingMasuk } = await supabase
          .from("transactions")
          .select("id")
          .eq("user_id", userId ?? "")
          .eq("type", "masuk")
          .eq("category", "logam_mulia")
          .eq("no_seri", fields.noSeri.trim())
          .neq("id", tx.id);
        if (existingMasuk && existingMasuk.length > 0) {
          const masukIds = existingMasuk.map((m) => m.id);
          const { data: soldOnes } = await supabase
            .from("transactions")
            .select("source_id")
            .eq("user_id", userId ?? "")
            .eq("type", "keluar")
            .in("source_id", masukIds);
          const soldIds = new Set((soldOnes ?? []).map((s) => s.source_id));
          const hasUnsold = masukIds.some((id) => !soldIds.has(id));
          if (hasUnsold) return toast.error(`No Seri "${fields.noSeri.trim()}" masih ada di stok`);
        }
        await patchTx(tx.id, {
          namaProduct: fields.namaProduct, gramasi,
          noSeri: fields.noSeri.trim(), harga,
          nomerRef: fields.nomerRef.trim() || undefined,
          asalBarang: fields.asalBarang.trim() || undefined, date,
          notes: entryType === "stok_awal" ? "entry_type:stok_awal" : "",
        });
      } else {
        const gramasi = parseFloat(fields.gramasi);
        if (!gramasi) return toast.error("Gramasi wajib diisi");
        await patchTx(tx.id, {
          karat: fields.karat, gramasi,
          kode: fields.kode.trim() || undefined, harga,
          asalBarang: fields.asalBarang.trim() || undefined, date,
        });
      }
      toast.success("Transaksi diperbarui");
      onClose();
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    }
  };

  const hargaLabel = tx.type === "masuk" ? "Harga Beli" : "Harga Jual";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit {tx.type === "masuk" ? "Barang Masuk" : "Barang Keluar"}
            {" — "}
            {tx.category === "logam_mulia" ? "Logam Mulia" : "Perhiasan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 pt-2">
          {/* Keluar: info read-only + edit harga/pembeli/tanggal */}
          {tx.type === "keluar" && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Info Barang</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {tx.category === "logam_mulia" ? (
                  <>
                    <div><span className="text-muted-foreground">Nama Product</span><p className="font-medium">{tx.namaProduct}</p></div>
                    <div><span className="text-muted-foreground">Gramasi</span><p className="font-medium">{formatGr(tx.gramasi)}</p></div>
                    {tx.noSeri && <div><span className="text-muted-foreground">No Seri</span><p className="font-medium">{tx.noSeri}</p></div>}
                  </>
                ) : (
                  <>
                    <div><span className="text-muted-foreground">Karat</span><p className="font-medium">{tx.karat}</p></div>
                    <div><span className="text-muted-foreground">Gramasi</span><p className="font-medium">{formatGr(tx.gramasi)}</p></div>
                    {tx.kode && <div><span className="text-muted-foreground">Kode</span><p className="font-medium">{tx.kode}</p></div>}
                  </>
                )}
                <div><span className="text-muted-foreground">Harga Beli</span><p className="font-medium">{formatIDR(tx.harga)}</p></div>
              </div>
            </div>
          )}

          {/* Masuk LM fields */}
          {tx.type === "masuk" && tx.category === "logam_mulia" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Jenis Pencatatan <span className="text-muted-foreground text-xs font-normal">(pilih salah satu)</span> <span className="text-destructive">*</span></Label>
                <div className="flex rounded-md border border-input overflow-hidden h-10">
                  <button type="button" onClick={() => setEntryType("stok_awal")}
                    className={`flex-1 text-sm transition-colors ${entryType === "stok_awal" ? "bg-amber-600 text-white" : "bg-background hover:bg-muted"}`}>
                    Tambah Stok
                  </button>
                  <button type="button" onClick={() => setEntryType("beli")}
                    className={`flex-1 text-sm border-l border-input transition-colors ${entryType === "beli" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                    Ganti Stok
                  </button>
                </div>
                <div className="rounded-lg border border-border/50 bg-transparent px-4 py-3 flex gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-foreground">Tambah Stok</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Emas yang kamu miliki atau beli untuk menambah stok saat ini</li>
                      <li>Tidak perlu sama gramasinya dengan yang dijual</li>
                      <li>Harga beli masuk perhitungan HPP di dashboard</li>
                      <li>Mempengaruhi Keuntungan HPP di dashboard</li>
                    </ul>
                  </div>
                  <div className="w-px bg-border/40 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-foreground">Ganti Stok</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Emas dibeli setelah melakukan penjualan</li>
                      <li>Gramasi sesuai dengan yang sudah dijual</li>
                      <li>Harga beli masuk Keuntungan Ganti Emas</li>
                      <li>Mempengaruhi Keuntungan Ganti Emas di dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nama Product <span className="text-destructive">*</span></Label>
                <Select value={fields.namaProduct} onValueChange={(v) => set("namaProduct", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUK_LM.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gramasi (gr) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.001" value={fields.gramasi}
                  onChange={(e) => set("gramasi", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>No Seri <span className="text-destructive">*</span></Label>
                <Input value={fields.noSeri} onChange={(e) => set("noSeri", e.target.value)} placeholder="Serial number" />
              </div>
              <div className="space-y-2">
                <Label>Nomer REF <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <Input value={fields.nomerRef} onChange={(e) => set("nomerRef", e.target.value)} placeholder="Reference number" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Asal Barang <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <Input value={fields.asalBarang} onChange={(e) => set("asalBarang", e.target.value)} placeholder="Dibeli dari / sumber barang" />
              </div>
            </div>
          )}

          {/* Masuk Perhiasan fields */}
          {tx.type === "masuk" && tx.category === "perhiasan" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Karat <span className="text-destructive">*</span></Label>
                <Select value={fields.karat} onValueChange={(v) => set("karat", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KARAT_OPTIONS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gramasi (gr) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.001" value={fields.gramasi}
                  onChange={(e) => set("gramasi", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Kode <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <Input value={fields.kode} onChange={(e) => set("kode", e.target.value)} placeholder="Kode perhiasan" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Asal Barang <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <Input value={fields.asalBarang} onChange={(e) => set("asalBarang", e.target.value)} placeholder="Dibeli dari / sumber barang" />
              </div>
            </div>
          )}

          {/* Shared editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{hargaLabel} <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={fields.harga}
                  onChange={(e) => set("harga", formatRupiah(e.target.value))}
                  placeholder="0"
                  className="pl-9"
                />
              </div>
            </div>

            {tx.type === "keluar" && (
              <div className="space-y-2">
                <Label>Nama Pembeli <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <Input value={fields.pembeli} onChange={(e) => set("pembeli", e.target.value)}
                  placeholder="Nama pembeli" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Tanggal <span className="text-destructive">*</span></Label>
              <DatePicker value={fields.tanggal} onChange={(v) => set("tanggal", v)} />
            </div>
          </div>

          {tx.type === "keluar" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Biaya Jual <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
                  <Input type="text" inputMode="numeric" placeholder="0" className="pl-9"
                    value={fields.biayaJual ?? ""}
                    onChange={(e) => set("biayaJual", formatRupiah(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Keterangan Biaya Jual <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                <Input value={fields.keteranganBiaya ?? ""}
                  onChange={(e) => set("keteranganBiaya", e.target.value)}
                  placeholder="mis. ongkos kirim, komisi, dll" />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
