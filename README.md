<h1 align="center">🤖️ chatbot-telegram</h1>
<p  align="center">
  <img alt="Version 1.0.0" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg" />
  </a>
  <a href="https://twitter.com/ciyou_lee" target="_blank">
    <img alt="Twitter: Ciyou" src="https://img.shields.io/twitter/follow/ciyou_lee.svg?style=social" />
  </a>
</p>

> Yet another telegram bot powered by OpenRouter models which allows you to
> setup and run your bot with one simple command. PRs and suggestions are
> welcome. Leave a 🌟 if you find this project helpful.

> ⚠️ Warning: The default model is
> `cognitivecomputations/dolphin-mistral-24b-venice-edition:free` via
> OpenRouter. You can change the model in the environment settings.

> Support for using a reverse proxy to access other providers will be added
> soon.

<div  align="center">
<video src="https://user-images.githubusercontent.com/13758730/206657062-eec01c2a-0ef8-4605-b0b9-19a48fff236e.mp4"/>
</div>

## 🪄 Features

- [x] Run your OpenRouter telegram bot with single command.
- [x] Support group chat by metioning `@` bot while `bot privacy mode` turned
      off.
- [x] Reload conversion with `/reload` command.
- [ ] Support group chat with `/chat` command while `bot privacy mode` turned
      on.
- [ ] Support multiple conversions, unique for each chatID.

## 💿 Installation

1. Make sure you have installed `Deno` already.

   If you don't, follow this official document to install.
   https://deno.land/manual@v1.28.3/getting_started/installation#download-and-install

2. Simply `git clone` or download this repo, `cd` into the project folder.

3. Cache dependencies and check integrity with `lock.json`, _you only need to do
   this once_.

```
deno cache --lock=lock.json chatbot.ts
```

## 🔮 Usage

1. Complete Telegram bot token, OpenRouter API key and model in `env.example`.

```
BOT_TOKEN=YOUR_BOT_TOKEN
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
OPENROUTER_MODEL=cognitivecomputations/dolphin-mistral-24b-venice-edition:free
```


To get your API key, see [Get OpenRouter API Key](#-get-openrouter-api-key).

2. Rename `env.example` to `.env`

```
mv env.example .env
```

3. `deno run` and enjoy!

```
deno run chatbot.ts
```

Deno requires you to approve file system reading, enviroment variables access
and network access manually. You can also run with these parammeters to give
permission by default.

```
deno run --allow-read --allow-env --allow-net chatbot.ts
```

## 🔑 Get OpenRouter API Key

1. Sign up for an OpenRouter account at https://openrouter.ai/

2. Generate a new API key from your dashboard. This is your API key, anyone can
   use it to access your account which may cause unexpected charges. Keep it
   secret!

3. Paste it in your `.env` file.

## 💌 Credits

- [chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) Node.js
  client for the unofficial ChatGPT API. -
  [License](https://github.com/transitive-bullshit/chatgpt-api/blob/main/license)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
  Telegram Bot API for NodeJS. -
  [License](https://github.com/yagop/node-telegram-bot-api/blob/master/LICENSE.md)
- [Lodash](https://github.com/lodash/lodash) -
  [License](https://github.com/lodash/lodash/blob/master/LICENSE)
- One-third of final code & almost all the comments was written by
  [Github Copilot](https://github.com/features/copilot). How far are we from the
  day where AI build whole project itself with AI 👀
