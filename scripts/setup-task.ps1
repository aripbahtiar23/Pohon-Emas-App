$bat = "C:\Users\User\Documents\Pohon emas Project\Project Buku Pohon emas\gold-ledger-charm-main\scripts\run-scraper.bat"
Unregister-ScheduledTask -TaskName "Scraper Harga Emas" -Confirm:$false -ErrorAction SilentlyContinue
$action  = New-ScheduledTaskAction -Execute $bat
$trigger = New-ScheduledTaskTrigger -Daily -At "10:00AM"
Register-ScheduledTask -TaskName "Scraper Harga Emas" -Action $action -Trigger $trigger -RunLevel Highest -Force
Write-Output "Task berhasil dibuat!"
