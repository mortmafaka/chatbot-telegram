# Скрипт проверки статуса бота для Windows
# Запуск: .\status.ps1

Write-Host "📊 Статус Telegram бота" -ForegroundColor Cyan
Write-Host "================================"

# Ищем процессы deno
$denoProcesses = Get-Process -Name "deno" -ErrorAction SilentlyContinue

if ($denoProcesses) {
    Write-Host "✅ Найдено процессов Deno: $($denoProcesses.Count)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Информация о процессах:" -ForegroundColor Blue
    
    foreach ($process in $denoProcesses) {
        $startTime = $process.StartTime
        $runTime = if ($startTime) { (Get-Date) - $startTime } else { "N/A" }
        $cpuTime = $process.TotalProcessorTime
        $workingSet = [math]::Round($process.WorkingSet / 1MB, 2)
        
        Write-Host "  PID: $($process.Id)" -ForegroundColor Yellow
        Write-Host "  Время работы: $($runTime.ToString('hh\:mm\:ss'))" -ForegroundColor Gray
        Write-Host "  CPU время: $($cpuTime.ToString('hh\:mm\:ss'))" -ForegroundColor Gray
        Write-Host "  Память: $workingSet MB" -ForegroundColor Gray
        Write-Host "  ---"
    }
} else {
    Write-Host "❌ Процессы бота не найдены" -ForegroundColor Red
}

# Проверяем наличие файлов
Write-Host ""
Write-Host "📁 Файлы проекта:" -ForegroundColor Blue

$files = @(
    @{Name="chatbot.ts"; Required=$true},
    @{Name=".env"; Required=$true},
    @{Name="env.example"; Required=$false},
    @{Name="lock.json"; Required=$false}
)

foreach ($file in $files) {
    if (Test-Path $file.Name) {
        $size = (Get-Item $file.Name).Length
        Write-Host "  ✅ $($file.Name) ($size bytes)" -ForegroundColor Green
    } else {
        if ($file.Required) {
            Write-Host "  ❌ $($file.Name) (отсутствует)" -ForegroundColor Red
        } else {
            Write-Host "  ⚠️  $($file.Name) (отсутствует)" -ForegroundColor Yellow
        }
    }
}

# Проверяем .env файл
if (Test-Path ".env") {
    Write-Host ""
    Write-Host "🔧 Настройки .env:" -ForegroundColor Blue
    
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    $configs = @("BOT_TOKEN", "OPENROUTER_API_KEY", "OPENROUTER_MODEL", "COMMENT_ALL_MESSAGES", "DEFAULT_STYLE")
    
    foreach ($config in $configs) {
        $line = $envContent | Where-Object { $_ -match "^$config=" }
        if ($line) {
            $value = ($line -split "=", 2)[1]
            if ($value -and $value -ne "YOUR_BOT_TOKEN" -and $value -ne "YOUR_OPENROUTER_API_KEY") {
                Write-Host "  ✅ $config настроен" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $config не настроен" -ForegroundColor Red
            }
        } else {
            Write-Host "  ⚠️  $config отсутствует" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "💡 Команды управления:" -ForegroundColor Blue
Write-Host "  .\start.ps1   - Запуск бота"
Write-Host "  .\stop.ps1    - Остановка бота" 
Write-Host "  .\restart.ps1 - Перезапуск бота"
Write-Host "  .\status.ps1  - Проверка статуса"