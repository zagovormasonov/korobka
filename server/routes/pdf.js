import express from 'express';
import { supabase } from '../index.js';
import htmlPdf from 'html-pdf-node';

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

// Генерировать PDF для психолога
router.post('/psychologist-pdf', async (req, res) => {
  try {
    console.log('🎯 [PDF-PSYCHOLOGIST-PDF] Начало обработки запроса');
    
    if (isPdfDisabled) {
      console.log('⚠️ [PDF-PSYCHOLOGIST-PDF] PDF генерация отключена');
      return res.status(503).json({ 
        success: false, 
        error: 'PDF generation is disabled. Please contact support.' 
      });
    }

    const { sessionId } = req.body;
    console.log('🎯 [PDF-PSYCHOLOGIST-PDF] SessionId:', sessionId);
    
    if (!sessionId) {
      console.error('❌ [PDF-PSYCHOLOGIST-PDF] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем PDF для психолога от AI API
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    console.log('🔗 [PDF-PSYCHOLOGIST-PDF] Вызываем AI API:', `${baseUrl}/api/ai/psychologist-pdf`);
    
    const pdfResponse = await fetch(`${baseUrl}/api/ai/psychologist-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    console.log('📥 [PDF-PSYCHOLOGIST-PDF] Ответ от AI API:', pdfResponse.status, pdfResponse.statusText);

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ [PDF-PSYCHOLOGIST-PDF] Ошибка от AI API:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to generate psychologist PDF' });
    }

    const pdfData = await pdfResponse.json();
    
    if (!pdfData.success || !pdfData.psychologistPdf) {
      console.error('❌ [PDF-PSYCHOLOGIST-PDF] AI API вернул ошибку или пустой PDF');
      return res.status(500).json({ success: false, error: 'Failed to generate psychologist PDF' });
    }

    const psychologistPdf = pdfData.psychologistPdf;
    console.log('✅ [PDF-PSYCHOLOGIST-PDF] PDF для психолога получен, длина:', psychologistPdf.length, 'символов');

    // Форматируем контент для HTML
    const formattedContent = formatPlanContent(psychologistPdf);
    
    // Создаем HTML документ
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF для психолога</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .content h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-top: 30px;
            margin-bottom: 20px;
        }
        .content h2:first-child {
            margin-top: 0;
        }
        .content h3 {
            color: #34495e;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        .content p {
            margin-bottom: 15px;
            text-align: justify;
        }
        .content ul, .content ol {
            margin-bottom: 15px;
            padding-left: 25px;
        }
        .content li {
            margin-bottom: 8px;
        }
        .highlight {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
        }
        @media print {
            body { background: white; }
            .header { background: #667eea !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PDF для психолога</h1>
        <p>Краткая выжимка результатов тестирования</p>
    </div>
    
    <div class="content">
        ${formattedContent}
    </div>
    
    <div class="footer">
        <p>Документ сгенерирован автоматически на основе результатов психологического тестирования</p>
        <p>Дата формирования: ${new Date().toLocaleDateString('ru-RU', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
    </div>
</body>
</html>`;

    console.log('✅ [PDF-PSYCHOLOGIST-PDF] HTML сгенерирован, длина:', html.length, 'символов');
    
    // Генерируем PDF
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: false
    };

    const pdfBuffer = await htmlPdf.generatePdf({ content: html }, options);
    
    console.log('✅ [PDF-PSYCHOLOGIST-PDF] PDF сгенерирован, размер:', pdfBuffer.length, 'байт');
    
    // Устанавливаем заголовки для скачивания PDF файла
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="psychologist-pdf.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ [PDF-PSYCHOLOGIST-PDF] Критическая ошибка:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при генерации PDF для психолога',
      details: error.message 
    });
  }
});

// Генерировать PDF для психолога
router.post('/psychologist', async (req, res) => {
  try {
    if (isPdfDisabled) {
      console.log('⚠️ [PDF-PSYCHOLOGIST] PDF генерация отключена');
      return res.status(503).json({ 
        success: false, 
        error: 'PDF generation is disabled. Please contact support.' 
      });
    }

    const { sessionId } = req.body;
    console.log('🎯 [PDF-PSYCHOLOGIST] SessionId:', sessionId);
    
    if (!sessionId) {
      console.error('❌ [PDF-PSYCHOLOGIST] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем данные пользователя и результаты тестов
    const { data: primaryTest, error: primaryError } = await supabase
      .from('primary_test_results')
      .select('answers, email, personal_plan')
      .eq('session_id', sessionId)
      .single();

    if (primaryError || !primaryTest) {
      console.error('❌ [PDF-PSYCHOLOGIST] Ошибка получения данных:', primaryError);
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Получаем результаты дополнительных тестов
    const { data: additionalTests, error: additionalError } = await supabase
      .from('additional_test_results')
      .select('test_type, answers')
      .eq('session_id', sessionId);

    if (additionalError) {
      console.error('❌ [PDF-PSYCHOLOGIST] Ошибка получения дополнительных тестов:', additionalError);
    }

    // Формируем HTML для PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Отчет для психолога</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #2C3E50; border-bottom: 2px solid #4F958B; padding-bottom: 5px; }
          .test-result { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .highlight { background: #E8F4FD; padding: 2px 4px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Отчет для психолога</h1>
          <p>Данные пациента: ${primaryTest.email || 'Не указан'}</p>
          <p>Дата создания: ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>

        <div class="section">
          <h2>Результаты первичного тестирования</h2>
          <div class="test-result">
            <strong>Ответы на вопросы:</strong><br>
            ${JSON.stringify(primaryTest.answers, null, 2)}
          </div>
        </div>

        ${additionalTests && additionalTests.length > 0 ? `
        <div class="section">
          <h2>Результаты дополнительных тестов</h2>
          ${additionalTests.map(test => `
            <div class="test-result">
              <strong>${test.test_type}:</strong><br>
              ${test.answers}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${primaryTest.personal_plan ? `
        <div class="section">
          <h2>Персональный план пациента</h2>
          <div class="test-result">
            ${primaryTest.personal_plan}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2>Рекомендации для психолога</h2>
          <div class="test-result">
            <p>На основе проведенного тестирования рекомендуется:</p>
            <ul>
              <li>Провести углубленную диагностику с учетом выявленных симптомов</li>
              <li>Обратить внимание на эмоциональную регуляцию пациента</li>
              <li>Рассмотреть возможность комплексного подхода к терапии</li>
              <li>Учесть индивидуальные особенности при составлении плана лечения</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('✅ [PDF-PSYCHOLOGIST] HTML сгенерирован, длина:', html.length);
    
    // Возвращаем HTML вместо PDF (так как PDF генерация отключена)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);

  } catch (error) {
    console.error('❌ [PDF-PSYCHOLOGIST] Ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
