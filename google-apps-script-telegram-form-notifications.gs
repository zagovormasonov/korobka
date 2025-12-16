/**
 * Google Apps Script для отправки уведомлений в Telegram
 * о новых ответах в Google Form
 * 
 * Инструкция по установке:
 * 1. Откройте Google Sheet, связанный с формой
 * 2. Расширения → Apps Script
 * 3. Вставьте этот код
 * 4. Запустите функцию setupTrigger() один раз (вручную)
 * 5. Готово! Теперь каждое новое ответы будет отправляться в Telegram
 */

// Константы для Telegram бота
const BOT_TOKEN = '8395215919:AAFXTQ29icwmafsv9FnUl0rI0zddztzfTFQ';
const CHAT_ID = '155478977';

// URL для отправки сообщений в Telegram
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

/**
 * Устанавливает триггер для автоматической отправки уведомлений
 * Запустите эту функцию ОДИН РАЗ вручную после установки скрипта
 */
function setupTrigger() {
  // Удаляем старые триггеры (если есть)
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('Удален старый триггер');
    }
  });
  
  // Создаем новый триггер
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('onFormSubmit')
    .onFormSubmit()
    .create();
  
  Logger.log('✅ Триггер успешно установлен!');
  Logger.log('Теперь каждое новое ответы в форме будет отправляться в Telegram');
}

/**
 * Основная функция, которая вызывается при отправке новой формы
 * @param {Event} e - Событие формы
 */
function onFormSubmit(e) {
  try {
    Logger.log('📨 Получен новый ответ в форме');
    
    // Получаем данные из события
    const formResponse = e.response;
    const form = FormApp.getActiveForm();
    const itemResponses = formResponse.getItemResponses();
    
    // Формируем сообщение
    let message = '<b>🔔 Новый ответ в форме!</b>\n\n';
    
    // Перебираем все вопросы и ответы
    itemResponses.forEach((itemResponse, index) => {
      const question = itemResponse.getItem().getTitle();
      let answer = itemResponse.getResponse();
      
      // Обрабатываем разные типы ответов
      if (Array.isArray(answer)) {
        // Если ответ - массив (например, множественный выбор)
        answer = answer.join(', ');
      } else if (answer === '') {
        answer = '(пусто)';
      }
      
      // Добавляем вопрос и ответ в сообщение
      message += `<b>Вопрос ${index + 1}:</b> ${escapeHtml(question)}\n`;
      message += `<b>Ответ:</b> ${escapeHtml(String(answer))}\n\n`;
    });
    
    // Добавляем время отправки
    const timestamp = new Date(formResponse.getTimestamp()).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    message += `⏰ <b>Время:</b> ${timestamp}`;
    
    // Отправляем сообщение в Telegram
    sendToTelegram(message);
    
    Logger.log('✅ Уведомление успешно отправлено в Telegram');
    
  } catch (error) {
    Logger.log('❌ Ошибка при обработке ответа формы:');
    Logger.log(error.toString());
    Logger.log('Stack trace: ' + error.stack);
  }
}

/**
 * Отправляет сообщение в Telegram
 * @param {string} message - Текст сообщения (HTML форматирование)
 */
function sendToTelegram(message) {
  try {
    const payload = {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // Не выбрасывать исключения при HTTP ошибках
    };
    
    const response = UrlFetchApp.fetch(TELEGRAM_API_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      // Если запрос не удался, логируем ошибку
      Logger.log('❌ Ошибка отправки в Telegram:');
      Logger.log('HTTP Code: ' + responseCode);
      Logger.log('Response: ' + responseText);
      
      // Пытаемся распарсить JSON ответ для более детальной информации
      try {
        const errorData = JSON.parse(responseText);
        Logger.log('Error description: ' + errorData.description);
      } catch (parseError) {
        Logger.log('Не удалось распарсить ответ ошибки');
      }
      
      throw new Error(`Telegram API вернул код ${responseCode}: ${responseText}`);
    }
    
    // Проверяем, что сообщение действительно отправлено
    const responseData = JSON.parse(responseText);
    if (!responseData.ok) {
      Logger.log('❌ Telegram API вернул ошибку:');
      Logger.log(responseData);
      throw new Error('Telegram API вернул ошибку: ' + JSON.stringify(responseData));
    }
    
    Logger.log('✅ Сообщение успешно отправлено в Telegram');
    Logger.log('Message ID: ' + responseData.result.message_id);
    
  } catch (error) {
    Logger.log('❌ Критическая ошибка при отправке в Telegram:');
    Logger.log(error.toString());
    Logger.log('Stack trace: ' + error.stack);
    throw error; // Пробрасываем ошибку дальше
  }
}

/**
 * Экранирует HTML символы для безопасной отправки
 * @param {string} text - Текст для экранирования
 * @return {string} Экранированный текст
 */
function escapeHtml(text) {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Тестовая функция для проверки работы скрипта
 * Можно запустить вручную для проверки подключения к Telegram
 */
function testTelegramConnection() {
  const testMessage = '<b>🧪 Тестовое сообщение</b>\n\nЭто тестовое сообщение для проверки работы скрипта.\n\n✅ Если вы видите это сообщение, значит всё работает!';
  
  try {
    sendToTelegram(testMessage);
    Logger.log('✅ Тестовое сообщение отправлено успешно!');
  } catch (error) {
    Logger.log('❌ Ошибка при отправке тестового сообщения:');
    Logger.log(error.toString());
  }
}

/**
 * Удаляет все триггеры (для отладки или отключения уведомлений)
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    Logger.log('Удален триггер: ' + trigger.getHandlerFunction());
  });
  Logger.log('✅ Все триггеры удалены');
}

