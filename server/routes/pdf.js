import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

// Проверяем, отключена ли PDF генерация
const isPdfDisabled = process.env.DISABLE_PDF === 'true';

// Функция для форматирования содержимого плана
function formatPlanContent(text) {
  if (!text) return '';
  
  // Сначала убираем все лишние символы
  let formatted = text
    // Убираем множественные символы
    .replace(/\*{3,}/g, '') 
    .replace(/#{4,}/g, '')  
    .replace(/-{4,}/g, '---') 
    
    // Обрабатываем заголовки
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    
    // Обрабатываем жирный текст
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    
    // Обрабатываем курсив (простой способ)
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    
    // Обрабатываем нумерованные списки
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
    
    // Обрабатываем маркированные списки
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    
    // Заменяем тройное тире на горизонтальную линию
    .replace(/^---$/gm, '<hr>')
    
    // Разделяем на параграфы (двойные переносы)
    .split(/\n\s*\n/)
    .map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Если это заголовок, HR или список - не оборачиваем в <p>
      if (paragraph.startsWith('<h') || paragraph.startsWith('<hr') || paragraph.includes('<li>')) {
        // Для списков оборачиваем в <ul>
        if (paragraph.includes('<li>')) {
          return '<ul>' + paragraph + '</ul>';
        }
        return paragraph;
      }
      
      // Обычный параграф
      return '<p>' + paragraph.replace(/\n/g, '<br>') + '</p>';
    })
    .filter(p => p) // Убираем пустые
    .join('\n');
  
  return formatted;
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
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
            max-width: 800px;
            margin: 40px auto;
          }
          h1 {
            color: #00695c;
            border-bottom: 2px solid #00695c;
            padding-bottom: 10px;
          }
          h2 {
            color: #00695c;
            margin-top: 30px;
          }
          h3 {
            color: #00695c;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .content {
            max-width: 800px;
            margin: 0 auto;
          }
          ul, ol {
            margin-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .print-button {
            background: #00695c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 20px 0;
          }
          p {
            margin-bottom: 15px;
            text-align: justify;
          }
          strong {
            color: #00695c;
            font-weight: 600;
          }
          em {
            color: #666;
            font-style: italic;
          }
          ul {
            margin: 15px 0;
            padding-left: 25px;
          }
          li {
            margin-bottom: 8px;
            line-height: 1.5;
          }
          hr {
            border: none;
            height: 2px;
            background: linear-gradient(to right, #00695c, transparent);
            margin: 25px 0;
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
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
            max-width: 800px;
            margin: 40px auto;
          }
          h1 {
            color: #00695c;
            border-bottom: 2px solid #00695c;
            padding-bottom: 10px;
          }
          h2 {
            color: #00695c;
            margin-top: 30px;
          }
          h3 {
            color: #00695c;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .content {
            max-width: 800px;
            margin: 0 auto;
          }
          ul, ol {
            margin-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background: #fff7e6;
            border: 1px solid #ffd591;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .print-button {
            background: #00695c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 20px 0;
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
