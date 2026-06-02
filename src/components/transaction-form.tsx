import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  insertTx,
  fetchAvailableStock,
  formatGr,
  formatIDR,
  PRODUK_LM,
  type Transaction,
  type TxType,
} from "@/lib/goldbook";
import { supabase } from "@/lib/supabase";
import { formatRupiah, parseRupiah } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Props {
  type: TxType;
}

const KARAT_OPTIONS = ["24K", "22K", "21K", "18K", "14K", "10K"];

function MasukForm() {
  const { userId } = useAuth();

  const [lm, setLm] = useState({
    namaProduct: PRODUK_LM[0] as string,
    gramasi: "",
    noSeri: "",
    harga: "",
    nomerRef: "",
    asalBarang: "",
    tanggal: todayStr(),
  });

  const [ph, setPh] = useState({
    karat: "24K",
    gramasi: "",
    kode: "",
    harga: "",
    asalBarang: "",
    tanggal: todayStr(),
  });

  const submitLm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const gramasi = parseFloat(lm.gramasi);
    const harga = parseRupiah(lm.harga);
    if (!gramasi || !harga) return toast.error("Gramasi dan harga wajib diisi");
    try {
      await insertTx(userId, {
        type: "masuk",
        category: "logam_mulia",
        date: new Date(lm.tanggal + "T00:00:00").toISOString(),
        namaProduct: lm.namaProduct,
        gramasi,
        noSeri: lm.noSeri || undefined,
        harga,
        nomerRef: lm.nomerRef || undefined,
        asalBarang: lm.asalBarang.trim() || undefined,
      });
      toast.success("Barang masuk dicatat");
      setLm({ ...lm, gramasi: "", noSeri: "", harga: "", nomerRef: "", asalBarang: "", tanggal: todayStr() });
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    }
  };

  const submitPh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const gramasi = parseFloat(ph.gramasi);
    const harga = parseRupiah(ph.harga);
    if (!gramasi || !harga) return toast.error("Gramasi dan harga wajib diisi");
    try {
      await insertTx(userId, {
        type: "masuk",
        category: "perhiasan",
        date: new Date(ph.tanggal + "T00:00:00").toISOString(),
        karat: ph.karat,
        gramasi,
        kode: ph.kode || undefined,
        harga,
        asalBarang: ph.asalBarang.trim() || undefined,
      });
      toast.success("Barang masuk dicatat");
      setPh({ ...ph, gramasi: "", kode: "", harga: "", asalBarang: "", tanggal: todayStr() });
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    }
  };

  return (
    <Tabs defaultValue="logam_mulia">
      <TabsList className="mb-6">
        <TabsTrigger value="logam_mulia">Logam Mulia</TabsTrigger>
        <TabsTrigger value="perhiasan">Perhiasan</TabsTrigger>
      </TabsList>

      <TabsContent value="logam_mulia">
        <form onSubmit={submitLm} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Nama Product</Label>
            <Select value={lm.namaProduct} onValueChange={(v) => setLm({ ...lm, namaProduct: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRODUK_LM.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gramasi (gr)</Label>
            <Input type="number" step="0.001" value={lm.gramasi}
              onChange={(e) => setLm({ ...lm, gramasi: e.target.value })} placeholder="contoh: 5" />
          </div>
          <div className="space-y-2">
            <Label>No Seri</Label>
            <Input value={lm.noSeri} onChange={(e) => setLm({ ...lm, noSeri: e.target.value })} placeholder="Serial number" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Nomer REF</Label>
            <Input value={lm.nomerRef} onChange={(e) => setLm({ ...lm, nomerRef: e.target.value })} placeholder="Reference number" />
          </div>
          <div className="space-y-2">
            <Label>Asal Barang</Label>
            <Input value={lm.asalBarang} onChange={(e) => setLm({ ...lm, asalBarang: e.target.value })} placeholder="Dibeli dari / sumber barang" />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Pembelian</Label>
            <DatePicker value={lm.tanggal} onChange={(v) => setLm({ ...lm, tanggal: v })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Harga Beli</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
              <Input type="text" inputMode="numeric" value={lm.harga}
                onChange={(e) => setLm({ ...lm, harga: formatRupiah(e.target.value) })}
                placeholder="0" className="pl-9" />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button type="submit" size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-elegant">
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="perhiasan">
        <form onSubmit={submitPh} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Karat</Label>
            <Select value={ph.karat} onValueChange={(v) => setPh({ ...ph, karat: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KARAT_OPTIONS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gramasi (gr)</Label>
            <Input type="number" step="0.001" value={ph.gramasi}
              onChange={(e) => setPh({ ...ph, gramasi: e.target.value })} placeholder="contoh: 3.5" />
          </div>
          <div className="space-y-2">
            <Label>Kode</Label>
            <Input value={ph.kode} onChange={(e) => setPh({ ...ph, kode: e.target.value })} placeholder="Kode perhiasan" />
          </div>
          <div className="space-y-2">
            <Label>Asal Barang</Label>
            <Input value={ph.asalBarang} onChange={(e) => setPh({ ...ph, asalBarang: e.target.value })} placeholder="Dibeli dari / sumber barang" />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Pembelian</Label>
            <DatePicker value={ph.tanggal} onChange={(v) => setPh({ ...ph, tanggal: v })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Harga Beli</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
              <Input type="text" inputMode="numeric" value={ph.harga}
                onChange={(e) => setPh({ ...ph, harga: formatRupiah(e.target.value) })}
                placeholder="0" className="pl-9" />
            </div>
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button type="submit" size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-elegant">
              Simpan Transaksi
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function stockLabel(t: Transaction) {
  if (t.category === "logam_mulia") {
    const parts = [t.namaProduct, formatGr(t.gramasi)];
    if (t.noSeri) parts.push(`SN ${t.noSeri}`);
    return parts.join(" · ");
  }
  const parts = [t.kode || "Perhiasan", t.karat, formatGr(t.gramasi)];
  return parts.filter(Boolean).join(" · ");
}

function SaleForm() {
  const { userId } = useAuth();
  const [stock, setStock] = useState<Transaction[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [harga, setHarga] = useState("");
  const [pembeli, setPembeli] = useState("");
  const [tanggal, setTanggal] = useState(todayStr);

  useEffect(() => {
    if (!userId) return;
    fetchAvailableStock(userId).then(setStock);

    const channel = supabase
      .channel(`stock-${userId}-${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => { fetchAvailableStock(userId).then(setStock); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const selected = stock.find((t) => t.id === selectedId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selected) return toast.error("Pilih barang terlebih dahulu");
    const hargaJual = parseRupiah(harga);
    if (!hargaJual) return toast.error("Harga jual wajib diisi");
    try {
      await insertTx(userId, {
        type: "keluar",
        category: selected.category,
        date: new Date(tanggal + "T00:00:00").toISOString(),
        namaProduct: selected.namaProduct,
        noSeri: selected.noSeri,
        nomerRef: selected.nomerRef,
        karat: selected.karat,
        kode: selected.kode,
        gramasi: selected.gramasi,
        harga: hargaJual,
        sourceId: selected.id,
        pembeli: pembeli.trim() || undefined,
      });
      toast.success("Penjualan dicatat");
      setSelectedId(""); setHarga(""); setPembeli(""); setTanggal(todayStr());
    } catch {
      toast.error("Gagal menyimpan. Coba lagi.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <Label>Pilih Barang dari Stok</Label>
        {stock.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Tidak ada stok tersedia.</p>
        ) : (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="— Pilih barang —" />
            </SelectTrigger>
            <SelectContent>
              {stock.map((t) => (
                <SelectItem key={t.id} value={t.id}>{stockLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selected && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Info Barang</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Kategori</span>
              <p className="font-medium">{selected.category === "logam_mulia" ? "Logam Mulia" : "Perhiasan"}</p>
            </div>
            {selected.category === "logam_mulia" ? (
              <>
                <div><span className="text-muted-foreground">Nama Product</span><p className="font-medium">{selected.namaProduct}</p></div>
                <div><span className="text-muted-foreground">Gramasi</span><p className="font-medium">{formatGr(selected.gramasi)}</p></div>
                {selected.noSeri && <div><span className="text-muted-foreground">No Seri</span><p className="font-medium">{selected.noSeri}</p></div>}
                {selected.nomerRef && <div><span className="text-muted-foreground">Nomer REF</span><p className="font-medium">{selected.nomerRef}</p></div>}
              </>
            ) : (
              <>
                <div><span className="text-muted-foreground">Karat</span><p className="font-medium">{selected.karat}</p></div>
                <div><span className="text-muted-foreground">Gramasi</span><p className="font-medium">{formatGr(selected.gramasi)}</p></div>
                {selected.kode && <div><span className="text-muted-foreground">Kode</span><p className="font-medium">{selected.kode}</p></div>}
              </>
            )}
            {selected.asalBarang && <div><span className="text-muted-foreground">Asal Barang</span><p className="font-medium">{selected.asalBarang}</p></div>}
            <div><span className="text-muted-foreground">Harga Beli</span><p className="font-medium">{formatIDR(selected.harga)}</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Harga Jual</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">Rp</span>
            <Input type="text" inputMode="numeric" value={harga}
              onChange={(e) => setHarga(formatRupiah(e.target.value))} placeholder="0" className="pl-9" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nama Pembeli</Label>
          <Input value={pembeli} onChange={(e) => setPembeli(e.target.value)} placeholder="Nama pembeli (opsional)" />
        </div>
        <div className="space-y-2">
          <Label>Tanggal Penjualan</Label>
          <DatePicker value={tanggal} onChange={setTanggal} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 shadow-elegant">
          Catat Penjualan
        </Button>
      </div>
    </form>
  );
}

export function TransactionForm({ type }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-soft p-6">
      {type === "keluar" ? <SaleForm /> : <MasukForm />}
    </div>
  );
}
