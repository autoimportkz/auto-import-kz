var TELEGRAM_API = "https://api.telegram.org/bot";

function doPost(e) {
  try {
    var payload = parsePayload(e);
    var props = PropertiesService.getScriptProperties();
    var botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
    var chatId = props.getProperty("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required");
    }

    if (payload.message || payload.callback_query) {
      handleTelegramUpdate(botToken, chatId, payload);
    } else {
      sendLeadToTelegram(botToken, chatId, payload);
    }

    return jsonResponse({
      ok: true
    });
  } catch (error) {
    console.error(error);

    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  }
}

function handleTelegramUpdate(botToken, managerChatId, update) {
  if (update.callback_query) {
    handleCallback(botToken, managerChatId, update.callback_query);
    return;
  }

  if (!update.message) return;

  var message = update.message;
  var chatId = message.chat.id;
  var text = cleanText(message.text);
  var contact = message.contact;

  if (contact && contact.phone_number) {
    handleClientContact(botToken, managerChatId, message, contact);
    return;
  }

  if (text === "/start" || text === "/menu" || !text) {
    sendClientMenu(botToken, chatId);
    return;
  }

  if (looksLikePhone(text)) {
    handleClientTextPhone(botToken, managerChatId, message, text);
    return;
  }

  notifyManagerFromClient(botToken, managerChatId, message, "Сообщение клиента");
  sendTelegramMessage(botToken, chatId, [
    "Спасибо, принял сообщение.",
    "Менеджер Auto-import KZ подключится и поможет подобрать варианты под ваш бюджет."
  ].join("\n"), clientMenuKeyboard());
}

function handleCallback(botToken, managerChatId, query) {
  var chatId = query.message.chat.id;
  var data = cleanText(query.data);

  answerCallbackQuery(botToken, query.id);

  if (data === "calc") {
    sendTelegramMessage(botToken, chatId, [
      "<b>Предварительный расчёт</b>",
      "",
      "Для точной сметы нужны:",
      "1. Марка и модель",
      "2. Год выпуска",
      "3. Объём двигателя",
      "4. Цена лота или ссылка на аукцион",
      "5. Город доставки в Казахстане",
      "",
      "Напишите эти данные одним сообщением, и менеджер подготовит расчёт."
    ].join("\n"), requestContactKeyboard());
    return;
  }

  if (data === "steps") {
    sendTelegramMessage(botToken, chatId, [
      "<b>Как проходит сделка</b>",
      "",
      "1. Подбираем авто и проверяем историю",
      "2. Считаем полную смету до Казахстана",
      "3. Участвуем в торгах",
      "4. Организуем доставку, документы и оформление",
      "5. Передаём авто клиенту"
    ].join("\n"), clientMenuKeyboard());
    return;
  }

  if (data === "terms") {
    sendTelegramMessage(botToken, chatId, [
      "<b>Сроки</b>",
      "",
      "Обычно доставка занимает от 45 до 90 дней.",
      "Срок зависит от штата покупки, порта, маршрута, документов и очередей на перевозку."
    ].join("\n"), clientMenuKeyboard());
    return;
  }

  if (data === "manager") {
    sendTelegramMessage(botToken, chatId, [
      "Оставьте телефон кнопкой ниже или напишите номер сообщением.",
      "Менеджер свяжется с вами и доведёт до точного расчёта."
    ].join("\n"), requestContactKeyboard());
    notifyManagerFromClient(botToken, managerChatId, query.message, "Клиент запросил менеджера");
    return;
  }

  sendClientMenu(botToken, chatId);
}

function sendClientMenu(botToken, chatId) {
  sendTelegramMessage(botToken, chatId, [
    "<b>Здравствуйте! Это Auto-import KZ.</b>",
    "",
    "Поможем подобрать, купить и доставить авто из США в Казахстан под ключ.",
    "Выберите, что хотите узнать:"
  ].join("\n"), clientMenuKeyboard());
}

function handleClientContact(botToken, managerChatId, message, contact) {
  var chatId = message.chat.id;
  var lead = {
    name: contact.first_name || message.chat.first_name || "",
    phone: contact.phone_number,
    car: "Клиент пришёл через Telegram-бота",
    budget: "Не указан",
    comment: "Клиент отправил контакт в боте",
    pageUrl: "Telegram bot",
    submittedAt: new Date().toISOString()
  };

  sendLeadToTelegram(botToken, managerChatId, lead);
  sendTelegramMessage(botToken, chatId, [
    "Спасибо! Контакт получили.",
    "Менеджер свяжется с вами и подготовит точный расчёт."
  ].join("\n"), clientMenuKeyboard());
}

function handleClientTextPhone(botToken, managerChatId, message, phoneText) {
  var chatId = message.chat.id;
  var lead = {
    name: message.chat.first_name || "",
    phone: phoneText,
    car: "Клиент пришёл через Telegram-бота",
    budget: "Не указан",
    comment: "Клиент написал номер сообщением",
    pageUrl: "Telegram bot",
    submittedAt: new Date().toISOString()
  };

  sendLeadToTelegram(botToken, managerChatId, lead);
  sendTelegramMessage(botToken, chatId, [
    "Номер получили.",
    "Менеджер скоро напишет вам в WhatsApp или позвонит."
  ].join("\n"), clientMenuKeyboard());
}

function notifyManagerFromClient(botToken, managerChatId, message, title) {
  var from = message.chat || message.from || {};
  var client = [
    from.first_name,
    from.last_name,
    from.username ? "@" + from.username : ""
  ].filter(Boolean).join(" ");
  var text = [
    "<b>" + escapeHtml(title) + "</b>",
    "",
    "<b>Клиент:</b> " + escapeHtml(client || "Не указан"),
    "<b>Telegram ID:</b> " + escapeHtml(String(from.id || message.chat.id || "")),
    "<b>Сообщение:</b> " + escapeHtml(cleanText(message.text) || "Без текста")
  ].join("\n");

  sendTelegramMessage(botToken, managerChatId, text, null);
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    return e.parameter || {};
  }
}

function sendLeadToTelegram(botToken, chatId, lead) {
  var phone = cleanText(lead.phone);
  var normalizedPhone = normalizePhone(phone);
  var message = [
    "<b>Новая заявка Auto-import KZ</b>",
    "",
    "<b>Имя:</b> " + escapeHtml(cleanText(lead.name) || "Не указано"),
    "<b>Телефон:</b> " + escapeHtml(phone || "Не указан"),
    "<b>Бюджет:</b> " + escapeHtml(cleanText(lead.budget) || "Не указан"),
    "<b>Авто:</b> " + escapeHtml(cleanText(lead.car) || "Не указано"),
    "<b>Комментарий:</b> " + escapeHtml(cleanText(lead.comment) || "Нет"),
    "",
    "<b>Источник:</b> " + escapeHtml(cleanText(lead.pageUrl) || "Сайт"),
    "<b>Время:</b> " + escapeHtml(cleanText(lead.submittedAt) || new Date().toISOString())
  ].join("\n");
  var keyboard = [];

  if (normalizedPhone) {
    keyboard.push([
      {
        text: "Ответить в WhatsApp",
        url: buildWhatsappUrl(phone, lead)
      }
    ]);
    keyboard.push([
      {
        text: "Позвонить",
        url: "tel:" + normalizedPhone
      }
    ]);
  }

  keyboard.push([
    {
      text: "Открыть сайт",
      url: cleanText(lead.pageUrl) || "https://movixstudio-kz.github.io/auto-import-kz/"
    }
  ]);

  sendTelegramMessage(botToken, chatId, message, {
    inline_keyboard: keyboard
  });
}

function sendTelegramMessage(botToken, chatId, text, replyMarkup) {
  var payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  UrlFetchApp.fetch(TELEGRAM_API + botToken + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  });
}

function answerCallbackQuery(botToken, callbackQueryId) {
  UrlFetchApp.fetch(TELEGRAM_API + botToken + "/answerCallbackQuery", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      callback_query_id: callbackQueryId
    })
  });
}

function buildWhatsappUrl(phone, lead) {
  var normalized = normalizePhone(phone);
  var text = [
    "Здравствуйте, " + (cleanText(lead.name) || "") + "!",
    "Вы оставляли заявку на подбор авто из США в Auto-import KZ.",
    "Подскажите, удобно сейчас обсудить варианты?"
  ].join("\n");

  return "https://wa.me/" + normalized + "?text=" + encodeURIComponent(text);
}

function normalizePhone(phone) {
  var digits = String(phone || "").replace(/\D/g, "");

  if (digits.charAt(0) === "8" && digits.length === 11) {
    digits = "7" + digits.slice(1);
  }

  return digits;
}

function looksLikePhone(value) {
  return normalizePhone(value).length >= 10;
}

function clientMenuKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "Рассчитать авто",
          callback_data: "calc"
        }
      ],
      [
        {
          text: "Этапы сделки",
          callback_data: "steps"
        },
        {
          text: "Сроки доставки",
          callback_data: "terms"
        }
      ],
      [
        {
          text: "Связаться с менеджером",
          callback_data: "manager"
        }
      ],
      [
        {
          text: "Открыть сайт",
          url: "https://movixstudio-kz.github.io/auto-import-kz/"
        }
      ]
    ]
  };
}

function requestContactKeyboard() {
  return {
    keyboard: [
      [
        {
          text: "Отправить телефон",
          request_contact: true
        }
      ],
      [
        {
          text: "/menu"
        }
      ]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  };
}

function setupTelegramWebhook() {
  var props = PropertiesService.getScriptProperties();
  var botToken = props.getProperty("TELEGRAM_BOT_TOKEN");
  var webAppUrl = props.getProperty("WEB_APP_URL");

  if (!botToken || !webAppUrl) {
    throw new Error("TELEGRAM_BOT_TOKEN and WEB_APP_URL are required");
  }

  var response = UrlFetchApp.fetch(TELEGRAM_API + botToken + "/setWebhook", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      url: webAppUrl,
      allowed_updates: ["message", "callback_query"]
    })
  });

  console.log(response.getContentText());
}

function cleanText(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
