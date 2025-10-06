import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

// Проверяем, отключена ли PDF генерация
const isPdfDisabled = process.env.DISABLE_PDF === 'true';

// PDF генерация отключена, используем HTML с возможностью сохранения

// Функция для правильного форматирования markdown в HTML
function formatPlanContent(text) {
  if (!text) {
    console.log('⚠️ [FORMAT PLAN] Пустой текст получен');
    return '<p class="plan-paragraph">Контент не загружен</p>';
  }
  
  console.log('📝 [FORMAT PLAN] Обрабатываем текст длиной:', text.length);
  console.log('📝 [FORMAT PLAN] Первые 200 символов:', text.substring(0, 200));
  
  // Разбиваем текст на строки для обработки
  let lines = text.split('\n');
  let html = '';
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Пропускаем пустые строки
    if (line === '') {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      continue;
    }
    
    // Обрабатываем заголовки
    if (line.match(/^#{1,6}\s/)) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      
      const level = line.match(/^#+/)[0].length;
      const title = line.replace(/^#+\s*/, '').replace(/\*+/g, '');
      
      if (level === 1) {
        html += `<h1 class="main-title">${title}</h1>\n`;
      } else if (level === 2) {
        html += `<h2 class="section-title">${title}</h2>\n`;
      } else if (level === 3) {
        html += `<h3 class="subsection-title">${title}</h3>\n`;
      } else {
        html += `<h4 class="minor-title">${title}</h4>\n`;
      }
      continue;
    }
    
    // Обрабатываем списки
    if (line.match(/^[\-\*\+]\s/) || line.match(/^\d+\.\s/)) {
      if (!inList) {
        html += '<ul class="plan-list">\n';
        inList = true;
      }
      
      const content = line.replace(/^[\-\*\+\d\.]\s*/, '').replace(/\*+/g, '');
      html += `<li>${content}</li>\n`;
      continue;
    }
    
    // Закрываем список если он был открыт
    if (inList) {
      html += '</ul>\n';
      inList = false;
    }
    
    // Обрабатываем обычные параграфы
    if (line.length > 0) {
      // Убираем markdown символы из текста
      const cleanLine = line
        .replace(/\*{2,}(.*?)\*{2,}/g, '<strong>$1</strong>') // Жирный текст
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Курсив
        .replace(/`(.*?)`/g, '<code>$1</code>') // Код
        .replace(/_{2,}(.*?)_{2,}/g, '<strong>$1</strong>') // Альтернативный жирный
        .replace(/_(.*?)_/g, '<em>$1</em>'); // Альтернативный курсив
      
      html += `<p class="plan-paragraph">${cleanLine}</p>\n`;
    }
  }
  
  // Закрываем список если он остался открытым
  if (inList) {
    html += '</ul>\n';
  }
  
  console.log('✅ [FORMAT PLAN] Сгенерированный HTML длиной:', html.length);
  console.log('✅ [FORMAT PLAN] Первые 300 символов HTML:', html.substring(0, 300));
  
  return html;
}

// Генерировать персональный план (скопировано из session-preparation)
router.post('/personal-plan', async (req, res) => {
  try {
    console.log('🎯 [PDF-PERSONAL-PLAN] Начало обработки запроса');
    
    if (isPdfDisabled) {
      console.log('⚠️ [PDF-PERSONAL-PLAN] PDF генерация отключена');
      return res.status(503).json({ 
        success: false, 
        error: 'PDF generation is disabled. Please contact support.' 
      });
    }

    const { sessionId } = req.body;
    console.log('🎯 [PDF-PERSONAL-PLAN] SessionId:', sessionId);
    
    if (!sessionId) {
      console.error('❌ [PDF-PERSONAL-PLAN] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем персональный план от Gemini AI
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    console.log('🔗 [PDF-PERSONAL-PLAN] Вызываем AI API:', `${baseUrl}/api/ai/personal-plan`);
    
    const planResponse = await fetch(`${baseUrl}/api/ai/personal-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    console.log('📥 [PDF-PERSONAL-PLAN] Ответ от AI API:', planResponse.status, planResponse.statusText);

    if (!planResponse.ok) {
      const errorText = await planResponse.text();
      console.error('❌ [PDF-PERSONAL-PLAN] Ошибка от AI API:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to generate plan' });
    }

    const planData = await planResponse.json();
    console.log('📊 [PDF-PERSONAL-PLAN] Данные от AI API:', {
      success: planData.success,
      hasPlan: !!planData.plan,
      planLength: planData.plan?.length || 0,
      cached: planData.cached
    });
    
    if (!planData.success) {
      console.error('❌ [PDF-PERSONAL-PLAN] AI API вернул ошибку');
      return res.status(500).json({ success: false, error: 'Failed to generate plan' });
    }

    const plan = planData.plan;
    console.log('✅ [PDF-PERSONAL-PLAN] План получен, генерируем HTML...');

    // HTML шаблон - ТОЧНАЯ копия из session-preparation
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Персональный план</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: #f8f9fa;
            padding: 20px;
          }
          
          .content {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #00695c 0%, #4db6ac 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: 400;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 25px;
          }
          
          .print-button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .print-button:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .preparation-content {
            padding: 40px;
            font-size: 16px;
            line-height: 1.8;
          }
          
          /* Используем те же стили что и для персонального плана */
          .preparation-content .main-title {
            font-size: 28px;
            color: #00695c;
            font-weight: 600;
            margin: 40px 0 25px 0;
            padding-bottom: 15px;
            border-bottom: 3px solid #00695c;
            text-align: center;
          }
          
          .preparation-content .main-title:first-child {
            margin-top: 0;
          }
          
          .preparation-content .section-title {
            font-size: 22px;
            color: #2c3e50;
            font-weight: 600;
            margin: 35px 0 20px 0;
            padding-left: 15px;
            border-left: 4px solid #4db6ac;
            background: linear-gradient(90deg, #f8f9fa 0%, transparent 100%);
            padding: 15px 0 15px 15px;
          }
          
          .preparation-content .subsection-title {
            font-size: 19px;
            color: #34495e;
            font-weight: 600;
            margin: 25px 0 15px 0;
            padding-left: 10px;
            border-left: 3px solid #81c784;
          }
          
          .preparation-content .minor-title {
            font-size: 17px;
            color: #5d6d7e;
            font-weight: 500;
            margin: 20px 0 10px 0;
            padding-left: 8px;
            border-left: 2px solid #a5d6a7;
          }
          
          .preparation-content .plan-paragraph {
            margin-bottom: 18px;
            text-align: justify;
            color: #34495e;
            line-height: 1.7;
          }
          
          .preparation-content .plan-paragraph strong {
            color: #2c3e50;
            font-weight: 600;
          }
          
          .preparation-content .plan-paragraph em {
            color: #5d6d7e;
            font-style: italic;
          }
          
          .preparation-content .plan-paragraph code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #e74c3c;
          }
          
          .preparation-content .plan-list {
            margin: 20px 0;
            padding-left: 0;
            list-style: none;
          }
          
          .preparation-content .plan-list li {
            margin-bottom: 12px;
            padding-left: 25px;
            position: relative;
            color: #34495e;
            line-height: 1.6;
          }
          
          .preparation-content .plan-list li:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #00695c;
            font-weight: bold;
            font-size: 16px;
          }
          
          .preparation-content .plan-list li strong {
            color: #2c3e50;
            font-weight: 600;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer p {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          @media print {
            body { 
              background: white;
              padding: 0; 
            }
            .print-button { 
              display: none; 
            }
            .content { 
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="content">
          <div class="header">
            <h1>Персональный план психологического благополучия</h1>
            <p>Создан на основе результатов тестирования</p>
            <button class="print-button" onclick="window.print()">Печать</button>
          </div>
          
          <div class="preparation-content">
            ${formatPlanContent(plan)}
          </div>
          
          <div class="footer">
            <p>Данный план создан на основе ваших ответов в тесте и не заменяет консультацию специалиста.</p>
            <p>При возникновении кризисных ситуаций обращайтесь к специалистам.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Отправляем HTML точно так же, как session-preparation
    console.log('📤 [PDF-PERSONAL-PLAN] Отправляем HTML клиенту, размер:', html.length);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    console.log('✅ [PDF-PERSONAL-PLAN] HTML успешно отправлен клиенту');
  } catch (error) {
    console.error('❌ [PDF-PERSONAL-PLAN] Критическая ошибка:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Генерировать PDF подготовки к сеансу
router.post('/session-preparation', async (req, res) => {
  try {
    if (isPdfDisabled) {
      return res.status(503).json({ 
        success: false, 
        error: 'PDF generation is disabled. Please contact support.' 
      });
    }

    const { sessionId, specialistType } = req.body;
    
    // Получаем подготовку от Gemini AI
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    const prepResponse = await fetch(`${baseUrl}/api/ai/session-preparation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, specialistType }),
    });

    const prepData = await prepResponse.json();
    if (!prepData.success) {
      return res.status(500).json({ success: false, error: 'Failed to generate preparation' });
    }

    const preparation = prepData.preparation;
    const specialistName = specialistType === 'psychologist' ? 'психологу' : 'психиатру';

    // Возвращаем HTML вместо PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Подготовка к сеансу</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: #f8f9fa;
            padding: 20px;
          }
          
          .content {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #00695c 0%, #4db6ac 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: 400;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 25px;
          }
          
          .print-button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
          }
          
          .print-button:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .warning {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border-left: 4px solid #f39c12;
            padding: 20px;
            margin: 0;
            color: #856404;
            font-weight: 500;
          }
          
          .preparation-content {
            padding: 40px;
            font-size: 16px;
            line-height: 1.8;
          }
          
          /* Используем те же стили что и для персонального плана */
          .preparation-content .main-title {
            font-size: 28px;
            color: #00695c;
            font-weight: 600;
            margin: 40px 0 25px 0;
            padding-bottom: 15px;
            border-bottom: 3px solid #00695c;
            text-align: center;
          }
          
          .preparation-content .main-title:first-child {
            margin-top: 0;
          }
          
          .preparation-content .section-title {
            font-size: 22px;
            color: #2c3e50;
            font-weight: 600;
            margin: 35px 0 20px 0;
            padding-left: 15px;
            border-left: 4px solid #4db6ac;
            background: linear-gradient(90deg, #f8f9fa 0%, transparent 100%);
            padding: 15px 0 15px 15px;
          }
          
          .preparation-content .subsection-title {
            font-size: 19px;
            color: #34495e;
            font-weight: 600;
            margin: 25px 0 15px 0;
            padding-left: 10px;
            border-left: 3px solid #81c784;
          }
          
          .preparation-content .minor-title {
            font-size: 17px;
            color: #5d6d7e;
            font-weight: 500;
            margin: 20px 0 10px 0;
            padding-left: 8px;
            border-left: 2px solid #a5d6a7;
          }
          
          .preparation-content .plan-paragraph {
            margin-bottom: 18px;
            text-align: justify;
            color: #34495e;
            line-height: 1.7;
          }
          
          .preparation-content .plan-paragraph strong {
            color: #2c3e50;
            font-weight: 600;
          }
          
          .preparation-content .plan-paragraph em {
            color: #5d6d7e;
            font-style: italic;
          }
          
          .preparation-content .plan-paragraph code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #e74c3c;
          }
          
          .preparation-content .plan-list {
            margin: 20px 0;
            padding-left: 0;
            list-style: none;
          }
          
          .preparation-content .plan-list li {
            margin-bottom: 12px;
            padding-left: 25px;
            position: relative;
            color: #34495e;
            line-height: 1.6;
          }
          
          .preparation-content .plan-list li:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #00695c;
            font-weight: bold;
            font-size: 16px;
          }
          
          .preparation-content .plan-list li strong {
            color: #2c3e50;
            font-weight: 600;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          
          .footer p {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          @media print {
            body { 
              background: white;
              padding: 0; 
            }
            .print-button { 
              display: none; 
            }
            .content { 
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="content">
          <div class="header">
            <h1>Подготовка к сеансу с ${specialistName}</h1>
            <p>Руководство по эффективному использованию времени</p>
            <button class="print-button" onclick="window.print()">Печать</button>
          </div>
          
          <div class="warning">
            <strong>Важно:</strong> Не забудьте взять с собой историю назначений и приёма препаратов, если обращаетесь к психиатру.
          </div>
          
          <div class="preparation-content">
            ${formatPlanContent(preparation)}
          </div>
          
          <div class="footer">
            <p>Данное руководство создано на основе ваших ответов в тесте и не заменяет профессиональную консультацию.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Отправляем HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating preparation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
