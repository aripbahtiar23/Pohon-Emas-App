$root = "C:\Users\User\Documents\Pohon emas Project\Project Buku Pohon emas\gold-ledger-charm-main"
Set-Location $root

if (-not (Test-Path "logs")) { New-Item -ItemType Directory "logs" | Out-Null }

$logFile = "logs\scraper-dev.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "[$timestamp] Menjalankan scraper (DEV)..."

# Load .env.scraper.dev
$envFile = Join-Path $root ".env.scraper.dev"
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*?)\s*=\s*(.*)\s*$") {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

$output = node scripts/scrape-harga-emas.js 2>&1
$output | ForEach-Object { Add-Content $logFile $_ }
$output | ForEach-Object { Write-Host $_ }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content $logFile "[$timestamp] Selesai. Exit: $LASTEXITCODE"
