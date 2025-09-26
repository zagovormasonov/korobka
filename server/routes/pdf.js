import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

// Проверяем, отключена ли PDF генерация
const isPdfDisabled = process.env.DISABLE_PDF === 'true';

// Простая функция для очистки и базового форматирования текста
function formatPlanContent(text) {
  if (!text) return '';
  
  // Убираем все markdown символы и создаем чистый текст
  return text
    // Убираем лишние символы
    .replace(/\*{2,}/g, '') // Убираем звездочки
    .replace(/#{1,}/g, '') // Убираем решетки
    .replace(/-{3,}/g, '') // Убираем длинные тире
    .replace(/[_~`]/g, '') // Убираем другие markdown символы
    
    // Заменяем двойные переносы на разделители параграфов
    .replace(/\n\s*\n/g, '</p><p>')
    
    // Оборачиваем в параграф
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    
    // Убираем пустые параграфы
    .replace(/<p>\s*<\/p>/g, '')
    
    // Заменяем одинарные переносы на пробелы для лучшего отображения
    .replace(/\n/g, ' ')
    
    // Убираем лишние пробелы
    .replace(/\s+/g, ' ')
    .trim();
}

// Генерировать PDF персонального плана
router.post('/personal-plan', async (req, res) => {
  try {
    if (isPdfDisabled) {
      return res.status(503).json({ 
        success: false, 
        error: 'PDF generation is disabled. Please contact support.' 
      });
    }

    const { sessionId } = req.body;
    
    // Получаем персональный план от Gemini AI
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    const planResponse = await fetch(`${baseUrl}/api/ai/personal-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    const planData = await planResponse.json();
    if (!planData.success) {
      return res.status(500).json({ success: false, error: 'Failed to generate plan' });
    }

    const plan = planData.plan;

    // Возвращаем HTML вместо PDF
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
          
          .plan-content {
            padding: 40px;
            font-size: 16px;
            line-height: 1.8;
          }
          
          .plan-content p {
            margin-bottom: 20px;
            text-align: justify;
            color: #34495e;
          }
          
          .plan-content p:first-child {
            font-size: 18px;
            color: #00695c;
            font-weight: 500;
            border-left: 4px solid #00695c;
            padding-left: 20px;
            margin-bottom: 30px;
            text-align: left;
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
            <h1>Персональный план психического здоровья</h1>
            <p>Создан на основе результатов тестирования</p>
            <button class="print-button" onclick="window.print()">Печать</button>
          </div>
          
          <div class="plan-content">
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

    // Отправляем HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating plan:', error);
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
          
          .preparation-content p {
            margin-bottom: 20px;
            text-align: justify;
            color: #34495e;
          }
          
          .preparation-content p:first-child {
            font-size: 18px;
            color: #00695c;
            font-weight: 500;
            border-left: 4px solid #00695c;
            padding-left: 20px;
            margin-bottom: 30px;
            text-align: left;
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
