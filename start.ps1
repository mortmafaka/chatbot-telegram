# Скрипт запуска бота для Windows
# Запуск: .\start.ps1

Write-Host "🚀 Запуск Telegram бота..." -ForegroundColor Green

# Проверяем наличие Deno
if (-not (Get-Command deno -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Deno не найден в PATH. Используем полный путь..." -ForegroundColor Yellow
    $denoPath = "$env:USERPROFILE\.deno\bin\deno.exe"
    
    if (-not (Test-Path $denoPath)) {
        Write-Host "❌ Deno не установлен. Устанавливаем..." -ForegroundColor Red
        powershell -Command "irm https://deno.land/x/install/install.ps1 | iex"
        Write-Host "✅ Deno установлен!" -ForegroundColor Green
    }
} else {
    $denoPath = "deno"
}

# Проверяем наличие файла .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Файл .env не найден. Создаём из примера..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "⚠️  Отредактируйте файл .env с вашими API ключами!" -ForegroundColor Yellow
        notepad .env
        Read-Host "Нажмите Enter после настройки .env файла"
    } else {
        Write-Host "❌ Файл env.example не найден!" -ForegroundColor Red
        exit 1
    }
}

# Останавливаем существующие процессы
Write-Host "🔄 Останавливаем существующие процессы..." -ForegroundColor Yellow
Get-Process -Name "deno" -ErrorAction SilentlyContinue | Stop-Process -Force

# Запускаем бота
Write-Host "🤖 Запускаем бота..." -ForegroundColor Green
& $denoPath run --allow-read --allow-write --allow-env --allow-net chatbot.ts

Write-Host "✅ Бот запущен!" -ForegroundColor Green