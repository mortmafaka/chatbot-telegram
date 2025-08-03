#!/bin/bash
# Скрипт запуска бота для Linux
# Запуск: ./start.sh

echo "🚀 Запуск Telegram бота..."

# Функция для цветного вывода
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

# Проверяем наличие Deno
if ! command -v deno &> /dev/null; then
    print_color "yellow" "❌ Deno не найден. Устанавливаем..."
    curl -fsSL https://deno.land/x/install/install.sh | sh
    export PATH="$HOME/.deno/bin:$PATH"
    print_color "green" "✅ Deno установлен!"
fi

# Проверяем наличие файла .env
if [ ! -f ".env" ]; then
    print_color "yellow" "❌ Файл .env не найден. Создаём из примера..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_color "yellow" "⚠️  Отредактируйте файл .env с вашими API ключами!"
        nano .env
        read -p "Нажмите Enter после настройки .env файла"
    else
        print_color "red" "❌ Файл env.example не найден!"
        exit 1
    fi
fi

# Останавливаем существующие процессы
print_color "yellow" "🔄 Останавливаем существующие процессы..."
pkill -f "deno.*chatbot.ts" 2>/dev/null || true

# Ждём завершения процессов
sleep 2

# Запускаем бота в фоне
print_color "green" "🤖 Запускаем бота..."
nohup deno run --allow-read --allow-write --allow-env --allow-net chatbot.ts > bot.log 2>&1 &

# Сохраняем PID
echo $! > bot.pid

print_color "green" "✅ Бот запущен в фоне! PID: $(cat bot.pid)"
print_color "blue" "📝 Логи: tail -f bot.log"