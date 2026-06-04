const BOT_TOKEN = "PASTE_CONSULT_BOT_TOKEN_HERE";
const MANAGER_CHAT_ID = "45283323";
const SITE_URL = "https://movixstudio-kz.github.io/auto-import-kz/";
const WEB_APP_URL = "PASTE_WEB_APP_EXEC_URL_HERE";

function doGet() {
  return out({
    ok: true,
    bot: "autoimportkz_consult_bot",
    message: "Consult bot webhook is alive. Telegram updates must be sent by doPost."
  });
}

function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents || "{}");
    if (update.update_id && isDuplicateUpdate(update.update_id)) return out({ ok: true, duplicate: true });
    if (update.callback_query) return handleCallback(update.callback_query);
    if (update.message) return handleMessage(update.message);
    return out({ ok: true });
  } catch (err) {
    console.error(err);
    return out({ ok: false, error: String(err.message || err) });
  }
}

function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = clean(msg.text);
  const state = getState(chatId);

  if (text === "/start" || text === "/menu") {
    clearState(chatId);
    sendMsg(chatId, "Заявку принял. Чтобы подобрать авто под ключ, задам 3 коротких вопроса.", null);
    setState(chatId, { step: "budget" });
    sendMsg(chatId, "1/3 Какой бюджет под ключ в Казахстане?\n\nНапример: 8 млн ₸", cancelKeyboard());
    return out({ ok: true });
  }

  if (!state.step) {
    sendMsg(chatId, "Здравствуйте! Нажмите /start, и я быстро соберу данные для подбора авто.", startKeyboard());
    return out({ ok: true });
  }

  if (state.step === "budget") {
    state.budget = text || "Не указан";
    state.step = "city";
    setState(chatId, state);
    sendMsg(chatId, "2/3 В какой город доставлять авто?", cancelKeyboard());
    return out({ ok: true });
  }

  if (state.step === "city") {
    state.city = text || "Не указан";
    state.step = "damage";
    setState(chatId, state);
    sendMsg(chatId, "3/3 Рассматриваете авто с повреждениями, если итоговая цена выгоднее?", damageKeyboard());
    return out({ ok: true });
  }

  if (state.step === "damage") {
    state.damage = text || "Не указан";
    state.step = "ready";
    setState(chatId, state);
    sendSummary(chatId, state);
    return out({ ok: true });
  }

  sendMsg(chatId, "Данные уже собраны. Нажмите кнопку «Получить подбор», и я передам заявку менеджеру.", submitKeyboard());
  return out({ ok: true });
}

function handleCallback(query) {
  answer(query.id);

  const chatId = query.message.chat.id;
  const state = getState(chatId);

  if (query.data === "restart") {
    clearState(chatId);
    sendMsg(chatId, "Начнём заново. Какой бюджет под ключ в Казахстане?", cancelKeyboard());
    setState(chatId, { step: "budget" });
    return out({ ok: true });
  }

  if (query.data === "damage_yes" || query.data === "damage_no" || query.data === "damage_light") {
    state.damage = query.data === "damage_no" ? "Только целые / минимальные повреждения" : query.data === "damage_light" ? "Можно лёгкие повреждения" : "Можно с повреждениями";
    state.step = "ready";
    setState(chatId, state);
    sendSummary(chatId, state);
    return out({ ok: true });
  }

  if (query.data === "submit_lead") {
    sendLeadToManager(query.message.chat, state);
    clearState(chatId);
    sendMsg(chatId, "Готово. Заявка ушла менеджеру Auto-import KZ. Он подберёт варианты и свяжется с вами.", siteKeyboard());
    return out({ ok: true });
  }

  return out({ ok: true });
}

function sendSummary(chatId, state) {
  sendMsg(chatId, [
    "Отлично, данные собраны:",
    "",
    "Бюджет под ключ: " + esc(state.budget || "Не указан"),
    "Город: " + esc(state.city || "Не указан"),
    "Повреждения: " + esc(state.damage || "Не указан"),
    "",
    "Нажмите «Получить подбор», и я передам заявку менеджеру."
  ].join("\n"), submitKeyboard());
}

function sendLeadToManager(chat, state) {
  const client = [chat.first_name, chat.last_name, chat.username ? "@" + chat.username : ""].filter(Boolean).join(" ") || "Не указан";
  const text = [
    "<b>Новая заявка из бота-консультанта</b>",
    "",
    "<b>Клиент:</b> " + esc(client),
    "<b>Telegram ID:</b> " + esc(chat.id),
    "<b>Бюджет под ключ:</b> " + esc(state.budget || "Не указан"),
    "<b>Город:</b> " + esc(state.city || "Не указан"),
    "<b>Повреждения:</b> " + esc(state.damage || "Не указан"),
    "",
    "<b>Действие:</b> подготовить подбор и закрыть на консультацию."
  ].join("\n");

  sendMsg(MANAGER_CHAT_ID, text, {
    inline_keyboard: [[
      { text: "Открыть профиль клиента", url: "tg://user?id=" + chat.id }
    ], [
      { text: "Открыть сайт", url: SITE_URL }
    ]]
  });
}

function sendMsg(chatId, text, markup) {
  const payload = { chat_id: chatId, text: text, parse_mode: "HTML", disable_web_page_preview: true };
  if (markup) payload.reply_markup = markup;
  const response = UrlFetchApp.fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify(payload)
  });
  assertTelegramOk(response);
}

function answer(id) {
  UrlFetchApp.fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/answerCallbackQuery", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({ callback_query_id: id })
  });
}

function submitKeyboard() {
  return { inline_keyboard: [[{ text: "Получить подбор", callback_data: "submit_lead" }], [{ text: "Заполнить заново", callback_data: "restart" }]] };
}

function damageKeyboard() {
  return { inline_keyboard: [[{ text: "Можно с повреждениями", callback_data: "damage_yes" }], [{ text: "Только лёгкие", callback_data: "damage_light" }], [{ text: "Лучше целую", callback_data: "damage_no" }]] };
}

function startKeyboard() {
  return { inline_keyboard: [[{ text: "Начать подбор", callback_data: "restart" }], [{ text: "Открыть сайт", url: SITE_URL }]] };
}

function cancelKeyboard() {
  return { inline_keyboard: [[{ text: "Начать заново", callback_data: "restart" }]] };
}

function siteKeyboard() {
  return { inline_keyboard: [[{ text: "Открыть сайт", url: SITE_URL }]] };
}

function getState(chatId) {
  const raw = PropertiesService.getScriptProperties().getProperty("consult_" + chatId);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function setState(chatId, state) {
  PropertiesService.getScriptProperties().setProperty("consult_" + chatId, JSON.stringify(state));
}

function clearState(chatId) {
  PropertiesService.getScriptProperties().deleteProperty("consult_" + chatId);
}

function setupTelegramWebhook() {
  const response = UrlFetchApp.fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/setWebhook", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      url: WEB_APP_URL,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true
    })
  });
  console.log(response.getContentText());
}

function assertTelegramOk(response) {
  const body = response.getContentText();
  let data = {};
  try {
    data = JSON.parse(body);
  } catch (err) {
    throw new Error("Telegram returned invalid JSON: " + body);
  }
  if (!data.ok) throw new Error("Telegram API failed: " + body);
}

function isDuplicateUpdate(updateId) {
  const cache = CacheService.getScriptCache();
  const key = "consult_update_" + updateId;
  if (cache.get(key)) return true;
  cache.put(key, "1", 600);
  return false;
}

function clean(value) {
  return String(value || "").trim();
}

function esc(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function out(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
