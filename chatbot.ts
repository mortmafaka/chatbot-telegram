import _ from "npm:lodash@^4.17.21";
import { ChatGPTAPI, ChatMessage } from "npm:chatgpt@5.0.6";
// @deno-types="npm:@types/node-telegram-bot-api@^0.57.6"
import TelegramBot from "npm:node-telegram-bot-api@^0.60.0";

import "https://deno.land/x/dotenv@v3.2.0/load.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") ??
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free";
const OPENROUTER_API_BASE = Deno.env.get("OPENROUTER_API_BASE") ??
  "https://openrouter.ai/api";

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
    bot.sendMessage(
      msg.chat.id,
      "🤖 This is a chatbot powered by OpenRouter models. You can use the following commands:\n\n/reload - Reset the conversation\n/style <text> - Set response style\n/help - Show this message",
    );
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
  const trimmedText = msg.text.replace(`@${botName}`, "").trim();

  // Only respond to messages that start with @botName or a valid command in a group chat
  if (msg.chat.type === "group" || msg.chat.type === "supergroup") {
    if (!msg.text.startsWith(`@${botName}`)) {
      handleCommand(msg, trimmedText);
      return;
    }
  }

  // Handle commands if needed
  if (handleCommand(msg, trimmedText)) {
    return;
  }

  if (trimmedText === "") {
    return;
  }

  logWithTime(`📩 Message from ${msg.chat.id}:`, trimmedText);

  // Send a message to the chat acknowledging receipt of their message
  let respMsg: TelegramBot.Message;
  try {
    respMsg = await bot.sendMessage(chatId, "🤔", {
      reply_to_message_id: msg.message_id,
    });
    bot.sendChatAction(chatId, "typing");
  } catch (err) {
    logWithTime("⛔️ Telegram API error:", err.message);
    return;
  }

  // Send message to OpenRouter
  try {
    const state = chatContext.get(chatId) ?? {};
    const response: ChatMessage = await openRouterAPI.sendMessage(trimmedText, {
      conversationId: state.conversationID,
      parentMessageId: state.parentMessageID,
      systemMessage: state.style,
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
    editMessage(respMsg, escapeMarkdown(response.text));
    logWithTime("📨 Response:", response);
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

// deno-lint-ignore no-explicit-any
function logWithTime(...args: any[]) {
  console.log(new Date().toLocaleString(), ...args);
}
