import _ from "npm:lodash@^4.17.21";
import { ChatGPTAPI, ChatMessage } from "npm:chatgpt@5.0.6";
// @deno-types="npm:@types/node-telegram-bot-api@^0.57.6"
import TelegramBot from "npm:node-telegram-bot-api@^0.60.0";

import "https://deno.land/x/dotenv@v3.2.0/load.ts";

// Функция для записи диалогов в лог
async function logDialog(
  chatId: number,
  chatType: string,
  userName: string,
  userMessage: string,
  botResponse: string,
  isAutoComment: boolean = false,
) {
  const timestamp = new Date().toISOString();

  const logLine =
    `[${timestamp}] ${chatType} | ${userName} (${chatId}): "${userMessage}" → BOT: "${botResponse}" ${
      isAutoComment ? "(AUTO)" : ""
    }\n${"=".repeat(100)}\n`;

  try {
    await Deno.writeTextFile("dialogs.log", logLine, { append: true });
  } catch (error) {
    console.error("Ошибка записи в лог диалогов:", error);
  }
}

// Функция для логирования с временем
function logWithTime(...args: unknown[]) {
  const timestamp = new Date().toLocaleString("ru-RU");
  console.log(timestamp, ...args);
}

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ??
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free";
const OPENROUTER_API_BASE = Deno.env.get("OPENROUTER_API_BASE") ??
  "https://openrouter.ai/api";
// Настройка поведения бота в групповых чатах
const COMMENT_ALL_MESSAGES = Deno.env.get("COMMENT_ALL_MESSAGES") === "true";
// Настройка постоянного стиля общения
const DEFAULT_STYLE = Deno.env.get("DEFAULT_STYLE") || "";
const BATCH_SUMMARY_INTERVAL = parseInt(
  Deno.env.get("BATCH_SUMMARY_INTERVAL") || "300",
); // Интервал в секундах для суммаризации батча

if (!BOT_TOKEN || !OPENROUTER_API_KEY) {
  logWithTime("⛔️ BOT_TOKEN and OPENROUTER_API_KEY must be set");
  Deno.exit(1);
}

// Start telegram bot

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const botInfo = await bot.getMe();
const botName = botInfo.username ?? "";

if (!botName) {
  logWithTime("⛔️ Bot username not found");
  Deno.exit(1);
} else {
  logWithTime("🤖 Bot", `@${botName}`, "has started...");
}

// Start OpenRouter API
let openRouterAPI: ChatGPTAPI;
try {
  openRouterAPI = new ChatGPTAPI({
    apiKey: OPENROUTER_API_KEY,
    apiBaseUrl: OPENROUTER_API_BASE,
    completionParams: { model: OPENROUTER_MODEL },
  });
} catch (err) {
  logWithTime("⛔️ OpenRouter API error:", err.message);
  Deno.exit(1);
}
logWithTime(
  "🔮 OpenRouter API has started with model",
  OPENROUTER_MODEL,
);

// Track conversation, parent message IDs and style for each chat
const chatContext = new Map<
  number,
  { conversationID?: string; parentMessageID?: string; style?: string }
>();

// Система отслеживания активности чатов
const chatActivity = new Map<
  number,
  {
    lastMessages: Array<{ text: string; timestamp: number; userName: string }>;
    lastMessageTime: number;
    summaries: string[];
    isInitialized: boolean; // Флаг инициализации контекста
  }
>();

// Суммаризация сообщений батча
async function summarizeMessages(
  messages: Array<{ text: string; userName: string }>,
): Promise<string> {
  const conversation = messages
    .map((m) => `${m.userName}: ${m.text}`)
    .join(" | ");
  const response = await openRouterAPI.sendMessage(
    `Суммаризируй по темам следующие сообщения: ${conversation}`,
  );
  return response.text.trim();
}

// Функция для инициализации контекста чата при перезапуске
async function initializeChatContext(chatId: number): Promise<void> {
  try {
    // Получаем последние 30 сообщений из чата
    const updates = await bot.getUpdates({
      limit: 100, // Получаем больше обновлений для поиска нужного чата
      timeout: 1,
    });

    // Фильтруем сообщения для конкретного чата
    const chatMessages = updates
      .filter((update) => update.message?.chat.id === chatId)
      .map((update) => update.message)
      .filter((msg) => msg && msg.text && !msg.from?.is_bot)
      .slice(-30); // Берем последние 30 сообщений

    if (chatMessages.length > 0) {
      const activity = chatActivity.get(chatId) || {
        lastMessages: [],
        lastMessageTime: 0,
        summaries: [],
        isInitialized: false,
      };

      // Добавляем исторические сообщения в контекст
      const now = Date.now();
      activity.lastMessages = chatMessages.map((msg) => ({
        text: msg.text!,
        timestamp: now -
          (chatMessages.length - chatMessages.indexOf(msg)) * 60000, // Примерное время
        userName: msg.from?.first_name || msg.from?.username || "Unknown",
      }));

      activity.lastMessageTime = activity.lastMessages.at(-1)?.timestamp || now;
      activity.isInitialized = true;
      chatActivity.set(chatId, activity);

      logWithTime(
        `📚 Инициализирован контекст для чата ${chatId} с ${chatMessages.length} сообщениями`,
      );
    }
  } catch (error) {
    logWithTime(`❌ Ошибка инициализации контекста для чата ${chatId}:`, error);
  }
}

// Обновление активности чата и суммаризация сообщений
async function updateChatActivity(
  chatId: number,
  messageText: string,
  userName: string,
): Promise<void> {
  const now = Date.now();
  const activity = chatActivity.get(chatId) || {
    lastMessages: [],
    lastMessageTime: 0,
    summaries: [],
    isInitialized: false,
  };

  // Суммаризируем предыдущий батч при длительном простое
  if (
    activity.lastMessageTime &&
    now - activity.lastMessageTime > BATCH_SUMMARY_INTERVAL * 1000 &&
    activity.lastMessages.length > 0
  ) {
    try {
      const summary = await summarizeMessages(activity.lastMessages);
      activity.summaries.push(summary);
      // Ограничиваем количество сохраненных суммаризаций
      if (activity.summaries.length > 10) activity.summaries.shift();
    } catch (error) {
      logWithTime(`❌ Ошибка суммаризации для чата ${chatId}:`, error);
    }
    activity.lastMessages = [];
  }

  // Обновляем активность
  activity.lastMessages.push({ text: messageText, timestamp: now, userName });
  activity.lastMessageTime = now;

  // Удаляем сообщения старше 5 минут (300 секунд)
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  activity.lastMessages = activity.lastMessages.filter((msg) =>
    msg.timestamp > fiveMinutesAgo
  );

  chatActivity.set(chatId, activity);
}

// Handle messages
bot.on("message", async (msg) => {
  await handleMessage(msg);
});

function handleCommand(
  msg: TelegramBot.Message,
  trimmedText: string,
): boolean {
  // reload command
  if (trimmedText === "/reload" || trimmedText == "/reset") {
    chatContext.delete(msg.chat.id);
    bot.sendMessage(msg.chat.id, "🔄 Conversation has been reset, enjoy!");
    logWithTime("🔄 Conversation has been reset");
    return true;
  }

  // style command
  if (trimmedText.startsWith("/style")) {
    const styleText = trimmedText.replace("/style", "").trim();
    if (styleText) {
      const state = chatContext.get(msg.chat.id) ?? {};
      state.style = styleText;
      chatContext.set(msg.chat.id, state);
      bot.sendMessage(msg.chat.id, "✅ Style updated");
      logWithTime("🎨 Style updated for", msg.chat.id, styleText);
    } else {
      bot.sendMessage(msg.chat.id, "⚠️ Please provide a style");
    }
    return true;
  }

  // help command
  if (trimmedText === "/help") {
    const state = chatContext.get(msg.chat.id) ?? {};
    const currentStyle = state.style || DEFAULT_STYLE;

    const helpText =
      `🤖 This is a chatbot powered by OpenRouter models. You can use the following commands:

/reload - Reset the conversation
/style <text> - Set response style
/help - Show this message

${
        COMMENT_ALL_MESSAGES
          ? "✅ Commenting all messages in groups"
          : "❌ Only responding to @mentions in groups"
      }
${
        currentStyle
          ? `🎭 Current style: ${currentStyle.slice(0, 50)}${
            currentStyle.length > 50 ? "..." : ""
          }`
          : "🎭 No style set"
      }`;

    bot.sendMessage(msg.chat.id, helpText);
    return true;
  }
  return false;
}

// Parse message and send to OpenRouter if needed
async function handleMessage(msg: TelegramBot.Message) {
  const chatId = msg.chat.id;
  if (!msg.text) {
    return;
  }

  // Игнорируем сообщения от самого бота
  if (msg.from?.is_bot && msg.from?.username === botName) {
    return;
  }

  const userName =
    `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim() ||
    msg.from?.username || "Unknown";
  logWithTime(
    `📥 Получено сообщение в чате ${chatId} от ${userName}: ${msg.text}`,
  );

  // Инициализируем контекст при первом сообщении в чате
  const activity = chatActivity.get(chatId);
  if (
    !activity?.isInitialized &&
    (msg.chat.type === "group" || msg.chat.type === "supergroup")
  ) {
    await initializeChatContext(chatId);
  }

  // Обрабатываем команды в любом типе чата
  if (handleCommand(msg, msg.text.trim())) {
    return;
  }

  await updateChatActivity(chatId, msg.text, userName);

  // Для групповых чатов: отвечаем по упоминанию
  // Для личных чатов: используем весь текст
  let trimmedText: string;
  let shouldRespond = false;

  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    const entities = msg.entities || [];
    const isMentioned = entities.some((entity) => {
      if (entity.type === "mention") {
        const mentionText = msg.text?.slice(
          entity.offset,
          entity.offset + entity.length,
        );
        return mentionText?.toLowerCase() === `@${botName.toLowerCase()}`;
      }
      if (entity.type === "text_mention") {
        return entity.user?.username?.toLowerCase() === botName.toLowerCase();
      }
      return false;
    });
    const isReplyToBot = msg.reply_to_message?.from?.username?.toLowerCase() ===
      botName.toLowerCase();

    if (isMentioned || isReplyToBot) {
      // Если упоминают бота или отвечают ему - отвечаем с учетом контекста
      const mentionRegex = new RegExp(`@${botName}`, "gi");
      const baseText = msg.text.replace(mentionRegex, "").trim();
      const activityNow = chatActivity.get(chatId);
      const summaries = activityNow?.summaries?.slice(-3) || [];
      const recentMessages = activityNow?.lastMessages.slice(0, -1) || [];
      const contextWithUsers = [
        ...summaries,
        ...recentMessages.map((m) => `${m.userName}: ${m.text}`),
      ].join(" | ");
      trimmedText = contextWithUsers
        ? `Контекст беседы: ${contextWithUsers}. Вопрос: ${baseText}`
        : baseText;
      shouldRespond = true;
      logWithTime(
        `📢 Прямое упоминание или ответ в чате ${chatId}: ${trimmedText}`,
      );
    } else if (COMMENT_ALL_MESSAGES) {
      // Старый режим: комментируем все сообщения
      trimmedText = msg.text.trim();
      shouldRespond = true;
    } else {
      return;
    }
  } else {
    // В личных чатах используем весь текст
    trimmedText = msg.text.trim();
    shouldRespond = true;
  }

  if (!shouldRespond) {
    return;
  }

  if (trimmedText === "") {
    return;
  }

  logWithTime(`📩 Message from ${msg.chat.id}:`, trimmedText);

  // Send a message to the chat acknowledging receipt of their message
  let respMsg: TelegramBot.Message;
  try {
    respMsg = await bot.sendMessage(chatId, "🤔");
    bot.sendChatAction(chatId, "typing");
  } catch (err) {
    logWithTime("⛔️ Telegram API error:", err.message);
    return;
  }

  // Send message to OpenRouter
  try {
    const state = chatContext.get(chatId) ?? {};
    // Используем стиль из настроек чата или стиль по умолчанию
    const currentStyle = state.style || DEFAULT_STYLE;
    const response: ChatMessage = await openRouterAPI.sendMessage(trimmedText, {
      conversationId: state.conversationID,
      parentMessageId: state.parentMessageID,
      systemMessage: currentStyle,
      onProgress: _.throttle(
        async (partialResponse: ChatMessage) => {
          respMsg = await editMessage(
            respMsg,
            escapeMarkdown(partialResponse.text),
            false,
          );
          bot.sendChatAction(chatId, "typing");
        },
        4000,
        { leading: true, trailing: false },
      ),
    });
    // Update conversationID and parentMessageID for this chat
    chatContext.set(chatId, {
      conversationID: response.conversationId,
      parentMessageID: response.id,
    });

    // Проверяем, просит ли пользователь пояснить что-то
    const isAskingForExplanation =
      trimmedText.toLowerCase().includes("поясни") ||
      trimmedText.toLowerCase().includes("объясни") ||
      trimmedText.toLowerCase().includes("расскажи подробнее") ||
      trimmedText.toLowerCase().includes("что ты имеешь в виду");

    // Ограничиваем длину ответа для краткости (если не просят пояснить)
    const maxLength = isAskingForExplanation ? 500 : 200;
    const limitedResponse = limitResponseLength(response.text, maxLength);
    editMessage(respMsg, escapeMarkdown(limitedResponse));
    logWithTime(
      `📨 Response (limited to ${maxLength} chars):`,
      limitedResponse,
    );

    // Логируем диалог в файл
    const chatType = msg.chat.type === "private" ? "PRIVATE" : "GROUP";
    await logDialog(
      chatId,
      chatType,
      userName,
      msg.text,
      limitedResponse,
    );
  } catch (err) {
    logWithTime("⛔️ OpenRouter API error:", err.message);
    // If the error contains session token has expired, then get a new session token
    if (err.message.includes("session token may have expired")) {
      bot.sendMessage(chatId, "🔑 Token has expired, please update the token.");
    } else {
      bot.sendMessage(
        chatId,
        "🤖 Sorry, I'm having trouble connecting to the server, please try again later.",
      );
    }
  }
}

// Функция для ограничения длины ответа
function limitResponseLength(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Ищем последнее предложение, которое поместится в лимит
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  let result = "";

  for (const sentence of sentences) {
    const testResult = result + sentence + ".";
    if (testResult.length <= maxLength) {
      result = testResult;
    } else {
      break;
    }
  }

  // Если не удалось найти подходящие предложения, обрезаем по словам
  if (!result) {
    const words = text.split(" ");
    result = words.slice(0, Math.floor(maxLength / 8)).join(" ") + "...";
  }

  return result;
}

// Escape Telegram MarkdownV2 special characters
function escapeMarkdown(text: string): string {
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// Edit telegram message
async function editMessage(
  msg: TelegramBot.Message,
  text: string,
  needParse = true,
): Promise<TelegramBot.Message> {
  if (msg.text === text || !text || text.trim() === "") {
    return msg;
  }
  try {
    const resp = await bot.editMessageText(text, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: needParse ? "MarkdownV2" : undefined,
    });
    // type of resp is boolean | Message
    if (typeof resp === "object") {
      // return a Message type instance if resp is a Message type
      return resp as TelegramBot.Message;
    } else {
      // return the original message if resp is a boolean type
      return msg;
    }
  } catch (err) {
    logWithTime("⛔️ Edit message error:", err.message);
    return msg;
  }
}
