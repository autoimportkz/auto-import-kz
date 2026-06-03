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

    sendLeadToTelegram(botToken, chatId, payload);

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

  UrlFetchApp.fetch(TELEGRAM_API + botToken + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: keyboard
      }
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
