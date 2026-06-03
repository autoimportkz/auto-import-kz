# Telegram bot for site leads

This setup sends every site lead from Google Apps Script to a Telegram chat.
It also lets the same Telegram bot answer clients who open the bot first.

The bot cannot message a client first by phone number. A client must open the bot and press `Start`, or submit a site form so the manager can reply in WhatsApp/call.

## 1. Create a Telegram bot

1. Open Telegram and message `@BotFather`.
2. Send `/newbot`.
3. Copy the bot token.

## 2. Get manager chat id

Option A: send leads to yourself.

1. Open your new bot and press `Start`.
2. Open this URL in browser, replacing `<TOKEN>`:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Find `message.chat.id`.

Option B: send leads to a group.

1. Add the bot to the group.
2. Send any message in the group.
3. Open:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Find the group `chat.id`. It usually starts with `-`.

## 3. Update Google Apps Script

1. Open the Google Apps Script project used by the site form webhook.
2. Replace the current `doPost` code with `apps-script/telegram-leads-bot.gs`.
3. Open `Project Settings`.
4. Add Script Properties:
   - `TELEGRAM_BOT_TOKEN` = token from BotFather
   - `TELEGRAM_CHAT_ID` = manager or group chat id
   - `WEB_APP_URL` = Apps Script Web App URL
5. Deploy as Web App:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Keep the web app URL in `script.js` as `WEBHOOK_URL`.

## 4. Connect Telegram webhook

After deployment:

1. Copy the Web App URL.
2. Save it in Script Properties as `WEB_APP_URL`.
3. In Apps Script, select function `setupTelegramWebhook`.
4. Press `Run`.
5. Approve permissions.

Telegram will now send bot messages to this Apps Script project.

## 5. What the bot can answer

When a client opens the bot and presses `Start`, the bot shows buttons:

- `Рассчитать авто`
- `Этапы сделки`
- `Сроки доставки`
- `Связаться с менеджером`
- `Открыть сайт`

If the client sends a phone number or shares contact, the bot forwards it to the manager chat.

## 6. Test

Submit the site form. Telegram should receive:

- name
- phone
- budget
- requested car
- comment
- buttons: WhatsApp, call, open site

Then open the bot as a client and press `Start`.

If Telegram is silent, check Apps Script `Executions` for errors.
