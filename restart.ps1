# Скрипт перезапуска бота для Windows
# Запуск: .\restart.ps1

Write-Host "🔄 Перезапуск Telegram бота..." -ForegroundColor Cyan

Write-Host ""
Write-Host "=== ОСТАНОВКА ===" -ForegroundColor Red
& .\stop.ps1

Write-Host ""
Write-Host "⏱️  Пауза 3 секунды..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=== ЗАПУСК ===" -ForegroundColor Green
& .\start.ps1