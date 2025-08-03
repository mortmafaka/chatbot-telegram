#!/bin/bash
# Скрипт перезапуска бота для Linux
# Запуск: ./restart.sh

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

print_color "cyan" "🔄 Перезапуск Telegram бота..."

echo ""
print_color "red" "=== ОСТАНОВКА ==="
./stop.sh

echo ""
print_color "yellow" "⏱️  Пауза 3 секунды..."
sleep 3

echo ""
print_color "green" "=== ЗАПУСК ==="
./start.sh