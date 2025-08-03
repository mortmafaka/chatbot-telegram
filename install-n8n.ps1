# Скрипт установки и запуска n8n через Docker
# Запуск: .\install-n8n.ps1

Write-Host "🚀 Установка n8n..." -ForegroundColor Cyan

# Проверяем наличие Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не найден. Установите Docker Desktop и запустите скрипт снова." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Загружаем образ n8n..." -ForegroundColor Cyan
docker pull n8nio/n8n

Write-Host "🔧 Запускаем контейнер n8n..." -ForegroundColor Cyan
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

Write-Host "✅ n8n запущен: http://localhost:5678" -ForegroundColor Green
