import { load } from "cheerio";

const res = await fetch("https://www.logammulia.com/id/harga-emas-hari-ini", {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
});
const html = await res.text();
const $ = load(html);

console.log("Tables found:", $("table").length);

$("table").each((i, t) => {
  const headers = [];
  $(t).find("th").each((_, th) => headers.push($(th).text().trim()));
  // Coba semua tr, bukan hanya tbody tr
  const allRows = [];
  $(t).find("tr").each((ri, tr) => {
    const cols = [];
    $(tr).find("td").each((_, td) => cols.push($(td).text().trim().slice(0, 30)));
    if (cols.length > 0) allRows.push(cols);
  });
  console.log(`\nTable ${i}:`);
  console.log("  Headers:", headers.slice(0,4));
  console.log("  Rows (first 3):", allRows.slice(0,3));
});
