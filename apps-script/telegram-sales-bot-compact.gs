const BOT_TOKEN = "PASTE_BOT_TOKEN_HERE";
const MANAGER_CHAT_ID = "45283323";
const WEB_APP_URL = "PASTE_WEB_APP_EXEC_URL_HERE";
const SITE_URL = "https://movixstudio-kz.github.io/auto-import-kz/";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    if (data.message || data.callback_query) {
      handleTelegram(data);
    } else {
      sendLead(data);
    }
    return out({ ok: true });
  } catch (err) {
    console.error(err);
    return out({ ok: false, error: String(err.message || err) });
  }
}

function handleTelegram(update) {
  if (update.callback_query) return handleButton(update.callback_query);
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  if (msg.contact && msg.contact.phone_number) return clientLead(msg, msg.contact.phone_number, "Клиент отправил контакт");
  if (text === "/start" || text === "/menu" || !text) return sendMenu(chatId);
  if (phone(text)) return clientLead(msg, text, "Клиент написал номер");
  notifyManager("Сообщение клиента", msg);
  sendMsg(chatId, "Спасибо, принял сообщение. Менеджер подключится и поможет с подбором.", menu());
}

function handleButton(q) {
  answer(q.id);
  const chatId = q.message.chat.id;
  if (q.data === "calc") {
    return sendMsg(chatId, "<b>Для расчёта отправьте:</b>\n\n1. Марка и модель\n2. Год\n3. Объём двигателя\n4. Цена лота или ссылка\n5. Город доставки\n\nИ оставьте телефон кнопкой ниже.", contactKeyboard());
  }
  if (q.data === "steps") {
    return sendMsg(chatId, "<b>Этапы сделки</b>\n\n1. Подбор и проверка авто\n2. Полная смета\n3. Торги\n4. Доставка и документы\n5. Передача авто клиенту", menu());
  }
  if (q.data === "terms") {
    return sendMsg(chatId, "<b>Сроки доставки</b>\n\nОбычно 45-90 дней. Срок зависит от штата, порта, маршрута и документов.", menu());
  }
  if (q.data === "manager") {
    notifyManager("Клиент запросил менеджера", q.message);
    return sendMsg(chatId, "Оставьте телефон кнопкой ниже или напишите номер сообщением.", contactKeyboard());
  }
  sendMenu(chatId);
}

function sendMenu(chatId) {
  sendMsg(chatId, "<b>Здравствуйте! Это Auto-import KZ.</b>\n\nПоможем подобрать, купить и доставить авто из США в Казахстан под ключ.", menu());
}

function clientLead(msg, phoneNumber, comment) {
  sendLead({
    name: [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(" "),
    phone: phoneNumber,
    budget: "Не указан",
    car: "Клиент пришёл через Telegram-бота",
    comment: comment,
    pageUrl: "Telegram bot",
    submittedAt: new Date().toISOString()
  });
  sendMsg(msg.chat.id, "Спасибо! Контакт получили. Менеджер скоро свяжется с вами.", menu());
}

function sendLead(d) {
  const p = (d.phone || "").trim();
  const text = "<b>Новая заявка Auto-import KZ</b>\n\n" +
    "<b>Имя:</b> " + esc(d.name || "Не указано") + "\n" +
    "<b>Телефон:</b> " + esc(p || "Не указан") + "\n" +
    "<b>Бюджет:</b> " + esc(d.budget || "Не указан") + "\n" +
    "<b>Авто:</b> " + esc(d.car || "Не указано") + "\n" +
    "<b>Комментарий:</b> " + esc(d.comment || "Нет") + "\n\n" +
    "<b>Источник:</b> " + esc(d.pageUrl || "Сайт") + "\n" +
    "<b>Время:</b> " + esc(d.submittedAt || new Date().toISOString());
  const keys = [];
  if (phone(p)) keys.push([{ text: "Ответить в WhatsApp", url: "https://wa.me/" + phone(p) + "?text=" + encodeURIComponent("Здравствуйте! Вы оставляли заявку в Auto-import KZ. Удобно обсудить авто?") }]);
  keys.push([{ text: "Открыть сайт", url: SITE_URL }]);
  sendMsg(MANAGER_CHAT_ID, text, { inline_keyboard: keys });
}

function notifyManager(title, msg) {
  const u = msg.chat || msg.from || {};
  sendMsg(MANAGER_CHAT_ID, "<b>" + esc(title) + "</b>\n\n<b>Клиент:</b> " + esc([u.first_name, u.last_name, u.username ? "@" + u.username : ""].filter(Boolean).join(" ") || "Не указан") + "\n<b>ID:</b> " + esc(u.id || msg.chat.id || "") + "\n<b>Сообщение:</b> " + esc(msg.text || "Без текста"), null);
}

function menu() {
  return { inline_keyboard: [[{ text: "Рассчитать авто", callback_data: "calc" }], [{ text: "Этапы сделки", callback_data: "steps" }, { text: "Сроки доставки", callback_data: "terms" }], [{ text: "Связаться с менеджером", callback_data: "manager" }], [{ text: "Открыть сайт", url: SITE_URL }]] };
}

function contactKeyboard() {
  return { keyboard: [[{ text: "Отправить телефон", request_contact: true }], [{ text: "/menu" }]], resize_keyboard: true, one_time_keyboard: true };
}

function sendMsg(chatId, text, markup) {
  const payload = { chat_id: chatId, text: text, parse_mode: "HTML", disable_web_page_preview: true };
  if (markup) payload.reply_markup = markup;
  UrlFetchApp.fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", { method: "post", contentType: "application/json", muteHttpExceptions: true, payload: JSON.stringify(payload) });
}

function answer(id) {
  UrlFetchApp.fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/answerCallbackQuery", { method: "post", contentType: "application/json", muteHttpExceptions: true, payload: JSON.stringify({ callback_query_id: id }) });
}

function setupTelegramWebhook() {
  const r = UrlFetchApp.fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/setWebhook", { method: "post", contentType: "application/json", muteHttpExceptions: true, payload: JSON.stringify({ url: WEB_APP_URL, allowed_updates: ["message", "callback_query"] }) });
  console.log(r.getContentText());
}

function phone(v) {
  const d = String(v || "").replace(/\D/g, "");
  return d.length >= 10 ? (d[0] === "8" && d.length === 11 ? "7" + d.slice(1) : d) : "";
}

function esc(v) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function out(v) {
  return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);
}
