import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

// Проверяем, отключена ли PDF генерация
const isPdfDisabled = process.env.DISABLE_PDF === 'true';

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
            color: #1890ff;
            border-bottom: 2px solid #1890ff;
            padding-bottom: 10px;
          }
          h2 {
            color: #52c41a;
            margin-top: 30px;
          }
          h3 {
            color: #fa8c16;
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
            background: #1890ff;
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
            <h1>Персональный план психологического благополучия</h1>
            <p>Создан на основе результатов тестирования</p>
            <button class="print-button" onclick="window.print()">Печать</button>
          </div>
          
          <div class="plan-content">
            ${plan.replace(/\n/g, '<br>')}
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
            color: #1890ff;
            border-bottom: 2px solid #1890ff;
            padding-bottom: 10px;
          }
          h2 {
            color: #52c41a;
            margin-top: 30px;
          }
          h3 {
            color: #fa8c16;
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
            background: #1890ff;
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
            ${preparation.replace(/\n/g, '<br>')}
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
