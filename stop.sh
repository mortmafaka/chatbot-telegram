#!/bin/bash
# Скрипт остановки бота для Linux
# Запуск: ./stop.sh

echo "🛑 Остановка Telegram бота..."

# Функция для цветного вывода
print_color() {
    local color=$1
    local message=$2
    case $color in
        "green") echo -e "\033[32m$message\033[0m" ;;
        "red") echo -e "\033[31m$message\033[0m" ;;
        "yellow") echo -e "\033[33m$message\033[0m" ;;
        "blue") echo -e "\033[34m$message\033[0m" ;;
        *) echo "$message" ;;
    esac
}

# Останавливаем по PID файлу
if [ -f "bot.pid" ]; then
    PID=$(cat bot.pid)
    if kill -0 $PID 2>/dev/null; then
        print_color "yellow" "⏹️  Останавливаем процесс PID: $PID"
        kill $PID
        
        # Ждём вежливого завершения
        for i in {1..10}; do
            if ! kill -0 $PID 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Если процесс всё ещё работает, принудительно останавливаем
        if kill -0 $PID 2>/dev/null; then
            print_color "yellow" "⚠️  Принудительная остановка..."
            kill -9 $PID
        fi
    fi
    rm -f bot.pid
fi

# Останавливаем все процессы по имени
print_color "yellow" "🔍 Поиск и остановка всех процессов бота..."
pkill -f "deno.*chatbot.ts" 2>/dev/null || true

# Ждём завершения
sleep 2

# Проверяем что все процессы остановлены
if pgrep -f "deno.*chatbot.ts" > /dev/null; then
    print_color "yellow" "⚠️  Принудительная остановка оставшихся процессов..."
    pkill -9 -f "deno.*chatbot.ts" 2>/dev/null || true
fi

print_color "green" "✅ Все процессы бота остановлены!"
print_color "green" "🏁 Готово!"