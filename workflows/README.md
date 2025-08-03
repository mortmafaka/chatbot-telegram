# n8n Workflows для Telegram Bot

Этот каталог содержит рабочие процессы n8n для интеграции с Telegram ботом.

## Файлы

### `telegram-logger.json`
**Назначение**: Логирование всех сообщений из Telegram

**Функции**:
- Получает сообщения через Telegram Trigger
- Сохраняет в DataStore: chatId, userName, text, timestamp, chatType
- Отправляет данные в процесс определения темы

**Настройки**:
- `N8N_TOPIC_URL` - URL для отправки данных в topic detection
- `N8N_TIMEOUT_MS` - таймаут для HTTP запросов

### `topic-detection-openrouter.json`
**Назначение**: Определение темы разговора через OpenRouter API

**Функции**:
- Получает данные через Webhook
- Сохраняет последние 5 сообщений
- Анализирует тему через OpenRouter API
- Возвращает одну из тем: технологии, работа, развлечения, спорт, политика, семья, общий

**Настройки**:
- `OPENROUTER_API_KEY` - ключ API OpenRouter
- `OPENROUTER_MODEL` - модель для анализа (из env.example)

## Установка

1. **Импортируйте рабочие процессы** в n8n:
   - Откройте http://localhost:5678
   - Импортируйте `telegram-logger.json`
   - Импортируйте `topic-detection-openrouter.json`

2. **Настройте переменные окружения** в n8n:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `N8N_TOPIC_URL`
   - `N8N_TIMEOUT_MS`

3. **Настройте Telegram Bot API**:
   - Создайте credentials для Telegram API
   - Добавьте токен бота

4. **Активируйте рабочие процессы**

## Использование

1. **Telegram Logger** будет автоматически логировать все сообщения
2. **Topic Detection** будет анализировать темы разговоров
3. Результаты сохраняются в DataStore n8n

## Интеграция с ботом

Бот может отправлять данные в topic detection через webhook:
```bash
curl -X POST http://localhost:5678/webhook/topic \
  -H "Content-Type: application/json" \
  -d '{"userName":"User","text":"Hello","chatId":123}'
``` 