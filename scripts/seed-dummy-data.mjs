/**
 * Dummy data untuk user_3Ec3julooSp8DW38vusi6jt4Wsk
 * Target margin Maret - 4 Juni 2026: ~Rp 50.000.000
 * Jalankan: node scripts/seed-dummy-data.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID      = "user_3Ec3julooSp8DW38vusi6jt4Wsk";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Set SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const id = () => crypto.randomUUID();
const dt = (y, m, d) => new Date(`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}T10:00:00+07:00`).toISOString();

// ── MASUK ────────────────────────────────────────────────────────────────────
const masuk = [
  // MARET
  { _id: id(), date: dt(2026,3,3),  category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:50,  harga:134_500_000, noSeri:"LM0501", asalBarang:"Distributor Bandung" },
  { _id: id(), date: dt(2026,3,5),  category:"logam_mulia", namaProduct:"Antam Non Redmark",  gramasi:25,  harga:66_200_000,  noSeri:"LM0502", asalBarang:"Toko Mas Setia" },
  { _id: id(), date: dt(2026,3,8),  category:"logam_mulia", namaProduct:"UBS",               gramasi:10,  harga:26_300_000,  noSeri:"UB0301", asalBarang:"Distributor Bandung" },
  { _id: id(), date: dt(2026,3,10), category:"logam_mulia", namaProduct:"UBS",               gramasi:10,  harga:26_350_000,  noSeri:"UB0302", asalBarang:"Distributor Bandung" },
  { _id: id(), date: dt(2026,3,12), category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:25,  harga:66_500_000,  noSeri:"LM0503", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,3,15), category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:10,  harga:26_400_000,  noSeri:"LM0504", asalBarang:"Toko Mas Setia" },
  { _id: id(), date: dt(2026,3,18), category:"logam_mulia", namaProduct:"Galeri24",          gramasi:10,  harga:26_200_000,  noSeri:"G24001", asalBarang:"Galeri24 Bandung" },
  { _id: id(), date: dt(2026,3,20), category:"perhiasan",   karat:"22K", kode:"GEL-22K-003", gramasi:8,   harga:22_400_000,  asalBarang:"Pengrajin Jogja" },

  // APRIL
  { _id: id(), date: dt(2026,4,2),  category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:100, harga:270_500_000, noSeri:"LM0601", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,4,5),  category:"logam_mulia", namaProduct:"UBS",               gramasi:50,  harga:135_200_000, noSeri:"UB0401", asalBarang:"Distributor Jakarta" },
  { _id: id(), date: dt(2026,4,10), category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:25,  harga:66_800_000,  noSeri:"LM0602", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,4,14), category:"logam_mulia", namaProduct:"Antam Non Redmark",  gramasi:10,  harga:26_600_000,  noSeri:"LM0603", asalBarang:"Toko Mas Setia" },
  { _id: id(), date: dt(2026,4,18), category:"logam_mulia", namaProduct:"Antam Non Redmark",  gramasi:10,  harga:26_650_000,  noSeri:"LM0604", asalBarang:"Toko Mas Setia" },
  { _id: id(), date: dt(2026,4,22), category:"perhiasan",   karat:"24K", kode:"CIN-24K-007", gramasi:5,   harga:14_200_000,  asalBarang:"Pengrajin Jogja" },

  // MEI
  { _id: id(), date: dt(2026,5,5),  category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:100, harga:271_200_000, noSeri:"LM0701", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,5,8),  category:"logam_mulia", namaProduct:"Galeri24",          gramasi:50,  harga:135_800_000, noSeri:"G24002", asalBarang:"Galeri24 Bandung" },
  { _id: id(), date: dt(2026,5,12), category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:50,  harga:135_600_000, noSeri:"LM0702", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,5,16), category:"logam_mulia", namaProduct:"UBS",               gramasi:25,  harga:68_000_000,  noSeri:"UB0501", asalBarang:"Distributor Bandung" },
  { _id: id(), date: dt(2026,5,20), category:"logam_mulia", namaProduct:"UBS",               gramasi:25,  harga:68_100_000,  noSeri:"UB0502", asalBarang:"Distributor Bandung" },
  { _id: id(), date: dt(2026,5,24), category:"perhiasan",   karat:"22K", kode:"GEL-22K-009", gramasi:10,  harga:28_400_000,  asalBarang:"Pengrajin Surabaya" },

  // JUNI
  { _id: id(), date: dt(2026,6,1),  category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:50,  harga:135_000_000, noSeri:"LM0801", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,6,3),  category:"logam_mulia", namaProduct:"UBS",               gramasi:25,  harga:67_900_000,  noSeri:"UB0601", asalBarang:"Distributor Bandung" },
  // Stok tersisa (belum terjual)
  { _id: id(), date: dt(2026,6,10), category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:1,   harga:2_760_000,   noSeri:"LM0802", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,6,12), category:"logam_mulia", namaProduct:"Antam Redmark",     gramasi:1,   harga:2_765_000,   noSeri:"LM0803", asalBarang:"Kantor Antam" },
  { _id: id(), date: dt(2026,6,14), category:"logam_mulia", namaProduct:"Antam Retro",       gramasi:0.5, harga:1_435_000,   noSeri:"LM0804", asalBarang:"Toko Mas Setia" },
];

// ── KELUAR ────────────────────────────────────────────────────────────────────
// margin = jual - beli, total ~50.000.000
const buildKeluar = (masukList) => {
  const m = Object.fromEntries(masukList.map(x => [x._id, x]));
  return [
    // MARET (margin ~8.700.000)
    { sourceKey:0,  date:dt(2026,3,9),  harga:138_000_000, pembeli:"Pak Budi Hartono"   }, // +3,5jt
    { sourceKey:1,  date:dt(2026,3,13), harga:68_000_000,  pembeli:"Bu Sari Dewi"       }, // +1,8jt
    { sourceKey:2,  date:dt(2026,3,17), harga:27_100_000,  pembeli:"Pak Dedi Kurniawan" }, // +800rb
    { sourceKey:3,  date:dt(2026,3,21), harga:27_150_000,  pembeli:"Pak Anton Wijaya"   }, // +800rb
    { sourceKey:4,  date:dt(2026,3,24), harga:68_300_000,  pembeli:"Bu Rina Santoso"    }, // +1,8jt
    { sourceKey:7,  date:dt(2026,3,28), harga:24_400_000,  pembeli:"Toko Mas Berlian"   }, // +2,0jt

    // APRIL (margin ~13.300.000)
    { sourceKey:8,  date:dt(2026,4,8),  harga:277_000_000, pembeli:"CV Mulia Abadi"     }, // +6,5jt
    { sourceKey:9,  date:dt(2026,4,14), harga:138_500_000, pembeli:"Pak Hendra Gunawan" }, // +3,3jt
    { sourceKey:10, date:dt(2026,4,19), harga:68_700_000,  pembeli:"Bu Citra Lestari"   }, // +1,9jt
    { sourceKey:11, date:dt(2026,4,24), harga:27_400_000,  pembeli:"Pak Yudi Pratama"   }, // +800rb
    { sourceKey:12, date:dt(2026,4,27), harga:27_450_000,  pembeli:"Bu Wahyu Ningsih"   }, // +800rb
    { sourceKey:13, date:dt(2026,4,29), harga:16_200_000,  pembeli:"Toko Perhiasan Indah"}, // +2,0jt

    // MEI (margin ~25.400.000)
    { sourceKey:14, date:dt(2026,5,10), harga:280_000_000, pembeli:"PT Emas Nusantara"  }, // +8,8jt
    { sourceKey:15, date:dt(2026,5,16), harga:139_500_000, pembeli:"Pak Fajar Nugroho"  }, // +3,7jt
    { sourceKey:16, date:dt(2026,5,22), harga:140_000_000, pembeli:"Bu Melinda Susanto" }, // +4,4jt
    { sourceKey:17, date:dt(2026,5,26), harga:70_000_000,  pembeli:"Pak Reza Firmansyah"}, // +2,0jt
    { sourceKey:18, date:dt(2026,5,28), harga:70_100_000,  pembeli:"Bu Fitri Handayani" }, // +2,0jt
    { sourceKey:19, date:dt(2026,5,30), harga:30_000_000,  pembeli:"Toko Mas Mutiara"  }, // +1,6jt
    { sourceKey:5,  date:dt(2026,3,29), harga:28_100_000,  pembeli:"Pak Eko Prasetyo"   }, // +1,7jt (Antam 10gr - beli Mar 15)
    { sourceKey:6,  date:dt(2026,3,30), harga:27_900_000,  pembeli:"Bu Diana Kusuma"    }, // +1,7jt (Galeri24 10gr - beli Mar 18)

    // JUNI (margin +1.840.000)
    // masuk[20]=50gr Antam → jual Jun 6, masuk[21]=25gr UBS → jual Jun 8
    // masuk[22-24] = 2.5gr stok tersisa (belum dijual)
    { sourceKey:20, date:dt(2026,6,6),  harga:141_000_000, pembeli:"CV Prima Emas"      }, // +6,0jt
    { sourceKey:21, date:dt(2026,6,8),  harga:70_700_000,  pembeli:"Pak Surya Wijaya"   }, // +2,8jt
  ];
};

(async () => {
  console.log("🌱 Mulai seed dummy data...\n");

  // Insert masuk
  const masukWithId = masuk.map(({ _id, ...rest }) => ({
    id: _id,
    user_id: USER_ID,
    type: "masuk",
    date: rest.date,
    category: rest.category,
    gramasi: rest.gramasi,
    harga: rest.harga,
    nama_product: rest.namaProduct ?? null,
    no_seri:      rest.noSeri ?? null,
    karat:        rest.karat ?? null,
    kode:         rest.kode ?? null,
    asal_barang:  rest.asalBarang ?? null,
  }));

  const { error: masukErr } = await supabase.from("transactions").insert(masukWithId);
  if (masukErr) { console.error("❌ Masuk error:", masukErr.message); process.exit(1); }
  console.log(`✅ Inserted ${masukWithId.length} transaksi masuk`);

  // Insert keluar
  const keluarData = buildKeluar(masuk);
  const keluarRows = keluarData.map(({ sourceKey, date, harga, pembeli }) => {
    const src = masuk[sourceKey];
    return {
      id: id(),
      user_id: USER_ID,
      type: "keluar",
      date,
      category: src.category,
      gramasi: src.gramasi,
      harga,
      nama_product: src.namaProduct ?? null,
      karat:        src.karat ?? null,
      kode:         src.kode ?? null,
      source_id:    src._id,
      pembeli,
    };
  });

  const { error: keluarErr } = await supabase.from("transactions").insert(keluarRows);
  if (keluarErr) { console.error("❌ Keluar error:", keluarErr.message); process.exit(1); }
  console.log(`✅ Inserted ${keluarRows.length} transaksi keluar`);

  // Hitung margin
  const totalBeli = keluarRows.reduce((s, k) => s + masuk[keluarData.findIndex(x => x.sourceKey === keluarData.findIndex(y => y.pembeli === k.pembeli && y.date === k.date))?.sourceKey ?? 0]?.harga ?? 0, 0);
  const totalJual = keluarRows.reduce((s, k) => s + k.harga, 0);
  const totalBeliAct = keluarData.reduce((s, k) => s + masuk[k.sourceKey].harga, 0);
  const margin = totalJual - totalBeliAct;

  console.log(`\n📊 Summary:`);
  console.log(`   Total Jual : Rp ${totalJual.toLocaleString("id-ID")}`);
  console.log(`   Total Beli : Rp ${totalBeliAct.toLocaleString("id-ID")}`);
  console.log(`   Margin     : Rp ${margin.toLocaleString("id-ID")}`);
  console.log("\n🎉 Selesai!");
})();
