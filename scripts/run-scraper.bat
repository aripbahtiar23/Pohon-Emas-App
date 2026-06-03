@echo off
cd /d "C:\Users\User\Documents\Pohon emas Project\Project Buku Pohon emas\gold-ledger-charm-main"

:: Load env vars dari .env.scraper
for /f "tokens=1,2 delims==" %%a in (.env.scraper) do set %%a=%%b

:: Buat folder logs jika belum ada
if not exist logs mkdir logs

:: Jalankan scraper
echo [%date% %time%] Menjalankan scraper... >> logs\scraper.log
node scripts/scrape-harga-emas.js >> logs\scraper.log 2>&1
echo [%date% %time%] Selesai. >> logs\scraper.log
