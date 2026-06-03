# Telegram bot for site leads

This setup sends every site lead from Google Apps Script to a Telegram chat.
The bot cannot message a client first by phone number. It sends the lead to a manager with buttons for WhatsApp, phone call, and site link.

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
5. Deploy as Web App:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Keep the web app URL in `script.js` as `WEBHOOK_URL`.

## 4. Test

Submit the site form. Telegram should receive:

- name
- phone
- budget
- requested car
- comment
- buttons: WhatsApp, call, open site

If Telegram is silent, check Apps Script `Executions` for errors.
