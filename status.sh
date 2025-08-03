#!/bin/bash
# Скрипт проверки статуса бота для Linux
# Запуск: ./status.sh

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

print_color "cyan" "📊 Статус Telegram бота"
echo "================================"

# Проверяем наличие PID файла
if [ -f "bot.pid" ]; then
    PID=$(cat bot.pid)
    if kill -0 $PID 2>/dev/null; then
        print_color "green" "✅ Бот запущен (PID: $PID)"
        
        # Показываем информацию о процессе
        echo ""
        print_color "blue" "📋 Информация о процессе:"
        ps -p $PID -o pid,ppid,cmd,etime,pcpu,pmem --no-headers
        
        # Показываем последние строки логов
        if [ -f "bot.log" ]; then
            echo ""
            print_color "blue" "📝 Последние 5 строк логов:"
            tail -n 5 bot.log
        fi
    else
        print_color "red" "❌ Процесс с PID $PID не найден"
        rm -f bot.pid
    fi
else
    print_color "yellow" "⚠️  PID файл не найден"
fi

# Проверяем все процессы deno с chatbot.ts
PROCESSES=$(pgrep -f "deno.*chatbot.ts")
if [ ! -z "$PROCESSES" ]; then
    echo ""
    print_color "blue" "🔍 Все найденные процессы бота:"
    ps -p $PROCESSES -o pid,ppid,cmd,etime,pcpu,pmem --no-headers
else
    if [ ! -f "bot.pid" ] || ! kill -0 $(cat bot.pid) 2>/dev/null; then
        print_color "red" "❌ Бот не запущен"
    fi
fi

# Проверяем логи на ошибки
if [ -f "bot.log" ]; then
    ERROR_COUNT=$(grep -c "error\|Error\|ERROR" bot.log 2>/dev/null || echo 0)
    if [ $ERROR_COUNT -gt 0 ]; then
        print_color "yellow" "⚠️  Найдено ошибок в логах: $ERROR_COUNT"
    fi
fi

echo ""
print_color "blue" "💡 Команды управления:"
echo "  ./start.sh   - Запуск бота"
echo "  ./stop.sh    - Остановка бота"
echo "  ./restart.sh - Перезапуск бота"
echo "  ./status.sh  - Проверка статуса"
if [ -f "bot.log" ]; then
    echo "  tail -f bot.log - Просмотр логов в реальном времени"
fi