#!/bin/bash
# Скрипт установки и запуска n8n через Docker
# Запуск: ./install-n8n.sh

# Цветной вывод
print_color() {
    local color=$1
    local message=$2
    case $color in
        "green") echo -e "\033[32m$message\033[0m" ;;
        "red") echo -e "\033[31m$message\033[0m" ;;
        "yellow") echo -e "\033[33m$message\033[0m" ;;
        "blue") echo -e "\033[34m$message\033[0m" ;;
        "cyan") echo -e "\033[36m$message\033[0m" ;;
        *) echo "$message" ;;
    esac
}

print_color "cyan" "🚀 Установка n8n..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    print_color "yellow" "❌ Docker не найден. Устанавливаем..."
    curl -fsSL https://get.docker.com | sh
    print_color "green" "✅ Docker установлен!"
fi

# Загружаем образ n8n
print_color "cyan" "📦 Загружаем образ n8n..."
docker pull n8nio/n8n

# Запускаем контейнер
print_color "cyan" "🔧 Запускаем контейнер n8n..."
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n

print_color "green" "✅ n8n запущен: http://localhost:5678"
