# 🤖 Скрипты управления Telegram ботом

Набор скриптов для удобного управления Telegram ботом на Windows и Linux.

## 🪟 Windows (PowerShell)

### Запуск скриптов:
```powershell
# Разрешить выполнение скриптов (выполнить один раз)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Управление ботом
.\start.ps1    # Запуск бота
.\stop.ps1     # Остановка бота  
.\restart.ps1  # Перезапуск бота
.\status.ps1   # Проверка статуса
```

### Возможности:
- ✅ Автоматическая установка Deno
- ✅ Создание .env из примера
- ✅ Остановка существующих процессов
- ✅ Проверка статуса и процессов
- ✅ Цветной вывод

## 🐧 Linux (Bash)

### Запуск скриптов:
```bash
# Сделать скрипты исполняемыми (выполнить один раз)
chmod +x *.sh

# Управление ботом  
./start.sh    # Запуск бота в фоне
./stop.sh     # Остановка бота
./restart.sh  # Перезапуск бота
./status.sh   # Проверка статуса
```

### Возможности:
- ✅ Автоматическая установка Deno
- ✅ Запуск в фоновом режиме  
- ✅ Сохранение PID процесса
- ✅ Логирование в файл bot.log
- ✅ Проверка статуса процессов
- ✅ Цветной вывод

## 📁 Структура файлов

### Windows скрипты:
- `start.ps1` - Запуск бота
- `stop.ps1` - Остановка бота
- `restart.ps1` - Перезапуск бота  
- `status.ps1` - Проверка статуса

### Linux скрипты:
- `start.sh` - Запуск бота в фоне
- `stop.sh` - Остановка бота
- `restart.sh` - Перезапуск бота
- `status.sh` - Проверка статуса

### Основные файлы:
- `chatbot.ts` - Основной код бота
- `.env` - Настройки (API ключи)
- `env.example` - Пример настроек
- `bot.log` - Логи бота (только Linux)
- `bot.pid` - PID процесса (только Linux)

## 🔧 Первоначальная настройка

### 1. Настройка API ключей:
Отредактируйте файл `.env`:
```env
BOT_TOKEN=ваш_токен_от_BotFather
OPENROUTER_API_KEY=ваш_ключ_от_OpenRouter
OPENROUTER_MODEL=cognitivecomputations/dolphin-mistral-24b-venice-edition:free
COMMENT_ALL_MESSAGES=true
DEFAULT_STYLE=Ваш стиль общения бота
```

### 2. Получение токенов:

**Telegram Bot Token:**
1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте токен

**OpenRouter API Key:**
1. Зарегистрируйтесь на https://openrouter.ai/
2. Перейдите в Dashboard  
3. Создайте новый API ключ
4. Скопируйте ключ

## 📊 Мониторинг

### Linux:
```bash
# Просмотр логов в реальном времени
tail -f bot.log

# Проверка статуса
./status.sh

# Проверка процессов
ps aux | grep deno
```

### Windows:
```powershell
# Проверка статуса
.\status.ps1

# Проверка процессов
Get-Process -Name "deno"
```

## 🚨 Устранение проблем

### Проблема: "Conflict: terminated by other getUpdates request"
**Решение:** Остановите все процессы бота и запустите заново
```bash
# Linux
./stop.sh && sleep 3 && ./start.sh

# Windows  
.\stop.ps1; Start-Sleep 3; .\start.ps1
```

### Проблема: Скрипт не выполняется в Windows
**Решение:** Разрешите выполнение PowerShell скриптов
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Проблема: Permission denied в Linux
**Решение:** Сделайте скрипты исполняемыми
```bash
chmod +x *.sh
```

## 💡 Советы

1. **Автозапуск при загрузке системы:**
   - Linux: добавьте в crontab или systemd
   - Windows: добавьте в автозагрузку или Task Scheduler

2. **Мониторинг ошибок:**
   - Регулярно проверяйте статус: `./status.sh` или `.\status.ps1`
   - В Linux следите за файлом `bot.log`

3. **Обновление бота:**
   - Остановите бота: `./stop.sh` или `.\stop.ps1`
   - Обновите код
   - Запустите: `./start.sh` или `.\start.ps1`

## 📞 Поддержка

При возникновении проблем:
1. Проверьте статус: `./status.sh` или `.\status.ps1`
2. Убедитесь что API ключи настроены правильно в `.env`
3. Проверьте логи (в Linux: `tail -f bot.log`)
4. Перезапустите бота: `./restart.sh` или `.\restart.ps1`