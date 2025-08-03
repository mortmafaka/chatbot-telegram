# Скрипт остановки бота для Windows
# Запуск: .\stop.ps1

Write-Host "🛑 Остановка Telegram бота..." -ForegroundColor Red

# Ищем и останавливаем все процессы deno
$denoProcesses = Get-Process -Name "deno" -ErrorAction SilentlyContinue

if ($denoProcesses) {
    Write-Host "🔍 Найдено процессов Deno: $($denoProcesses.Count)" -ForegroundColor Yellow
    
    foreach ($process in $denoProcesses) {
        Write-Host "⏹️  Останавливаем процесс PID: $($process.Id)" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force
    }
    
    # Ждём завершения процессов
    Start-Sleep -Seconds 2
    
    # Проверяем что все процессы остановлены
    $remainingProcesses = Get-Process -Name "deno" -ErrorAction SilentlyContinue
    if ($remainingProcesses) {
        Write-Host "⚠️  Некоторые процессы не остановились. Принудительная остановка..." -ForegroundColor Yellow
        $remainingProcesses | Stop-Process -Force
    }
    
    Write-Host "✅ Все процессы бота остановлены!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Процессы бота не найдены" -ForegroundColor Blue
}

Write-Host "🏁 Готово!" -ForegroundColor Green