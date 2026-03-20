import express from 'express';
import { supabase } from '../index.js';
import htmlPdf from 'html-pdf-node';

const router = express.Router();

// Функция для правильного форматирования markdown в HTML
function formatPlanContent(text) {
  if (!text) {
    console.log('⚠️ [FORMAT PLAN] Пустой текст получен');
    return '<p class="plan-paragraph">Контент не загружен</p>';
  }
  
  console.log('📝 [FORMAT PLAN] Обрабатываем текст длиной:', text.length);
  
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
  
  return html;
}

// Генерировать персональный план в PDF формате
router.post('/personal-plan', async (req, res) => {
  try {
    console.log('🎯 [PDF-HTML-PERSONAL-PLAN] Начало обработки запроса');
    
    const { sessionId } = req.body;
    console.log('🎯 [PDF-HTML-PERSONAL-PLAN] SessionId:', sessionId);
    
    if (!sessionId) {
      console.error('❌ [PDF-HTML-PERSONAL-PLAN] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем персональный план от Gemini AI (он уже кешируется в БД!)
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    console.log('🔗 [PDF-HTML-PERSONAL-PLAN] Вызываем AI API:', `${baseUrl}/api/ai/personal-plan`);
    
    const planResponse = await fetch(`${baseUrl}/api/ai/personal-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    console.log('📥 [PDF-HTML-PERSONAL-PLAN] Ответ от AI API:', planResponse.status, planResponse.statusText);

    if (!planResponse.ok) {
      const errorText = await planResponse.text();
      console.error('❌ [PDF-HTML-PERSONAL-PLAN] Ошибка от AI API:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to generate plan' });
    }

    const planData = await planResponse.json();
    
    if (!planData.success || !planData.plan) {
      console.error('❌ [PDF-HTML-PERSONAL-PLAN] AI API вернул ошибку или пустой план');
      return res.status(500).json({ success: false, error: 'Failed to generate plan' });
    }

    const plan = planData.plan;
    console.log('✅ [PDF-HTML-PERSONAL-PLAN] План получен, длина:', plan.length, 'символов');
    console.log('🔄 [PDF-HTML-PERSONAL-PLAN] Кешировано:', planData.cached ? 'Да' : 'Нет');
    console.log('📝 [PDF-HTML-PERSONAL-PLAN] Генерируем PDF...');

    // HTML шаблон с полной поддержкой кириллицы
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Персональный план психологического благополучия</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: Arial, 'DejaVu Sans', 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: white;
            padding: 20px;
          }
          
          .content {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          
          .header {
            background: linear-gradient(135deg, #00695c 0%, #4db6ac 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.95;
          }
          
          .preparation-content {
            padding: 20px 40px 40px 40px;
            font-size: 14px;
            line-height: 1.8;
          }
          
          .preparation-content .main-title {
            font-size: 22px;
            color: #00695c;
            font-weight: 600;
            margin: 35px 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 3px solid #00695c;
            text-align: center;
            page-break-after: avoid;
          }
          
          .preparation-content .main-title:first-child {
            margin-top: 0;
          }
          
          .preparation-content .section-title {
            font-size: 18px;
            color: #2c3e50;
            font-weight: 600;
            margin: 28px 0 16px 0;
            padding-left: 15px;
            border-left: 4px solid #4db6ac;
            background: #f8f9fa;
            padding: 12px 0 12px 15px;
            page-break-after: avoid;
          }
          
          .preparation-content .subsection-title {
            font-size: 16px;
            color: #34495e;
            font-weight: 600;
            margin: 22px 0 12px 0;
            padding-left: 10px;
            border-left: 3px solid #81c784;
            page-break-after: avoid;
          }
          
          .preparation-content .minor-title {
            font-size: 15px;
            color: #5d6d7e;
            font-weight: 500;
            margin: 18px 0 10px 0;
            padding-left: 8px;
            border-left: 2px solid #a5d6a7;
            page-break-after: avoid;
          }
          
          .preparation-content .plan-paragraph {
            margin-bottom: 14px;
            text-align: justify;
            color: #34495e;
            line-height: 1.7;
            page-break-inside: avoid;
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
            font-size: 13px;
            color: #e74c3c;
          }
          
          .preparation-content .plan-list {
            margin: 16px 0;
            padding-left: 0;
            list-style: none;
          }
          
          .preparation-content .plan-list li {
            margin-bottom: 10px;
            padding-left: 25px;
            position: relative;
            color: #34495e;
            line-height: 1.6;
            page-break-inside: avoid;
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
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            margin-top: 40px;
          }
          
          .footer p {
            color: #6c757d;
            font-size: 12px;
            margin-bottom: 8px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <div class="header">
            <h1>Персональный план психологического благополучия</h1>
            <p>Создан на основе результатов тестирования</p>
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

    console.log('📝 [PDF-HTML-PERSONAL-PLAN] HTML сформирован, размер:', htmlContent.length);

    // Опции для html-pdf-node с полной поддержкой кириллицы
    const options = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      // Критически важно для кириллицы!
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
        '--disable-dev-shm-usage'
      ]
    };

    const file = { content: htmlContent };

    console.log('🔄 [PDF-HTML-PERSONAL-PLAN] Генерируем PDF с html-pdf-node...');
    
    // Генерируем PDF
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    
    console.log('✅ [PDF-HTML-PERSONAL-PLAN] PDF сгенерирован успешно!');
    console.log('📦 [PDF-HTML-PERSONAL-PLAN] Размер PDF:', pdfBuffer.length, 'байт');

    // Отправляем PDF клиенту
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="personal-plan.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
    
    console.log('✅ [PDF-HTML-PERSONAL-PLAN] PDF успешно отправлен клиенту');
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [PDF-HTML-PERSONAL-PLAN] Критическая ошибка: ${errMsg} name=${error?.name || ''}`, error?.stack || '');
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при генерации PDF',
      details: errMsg 
    });
  }
});

// Генерировать PDF для психолога
router.post('/psychologist-pdf', async (req, res) => {
  try {
    console.log('🎯 [PDF-HTML-PSYCHOLOGIST-PDF] Начало обработки запроса');
    
    const { sessionId } = req.body;
    console.log('🎯 [PDF-HTML-PSYCHOLOGIST-PDF] SessionId:', sessionId);
    
    if (!sessionId) {
      console.error('❌ [PDF-HTML-PSYCHOLOGIST-PDF] SessionId не передан');
      return res.status(400).json({ success: false, error: 'SessionId is required' });
    }
    
    // Получаем PDF для психолога от AI API
    const baseUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
    console.log('🔗 [PDF-HTML-PSYCHOLOGIST-PDF] Вызываем AI API:', `${baseUrl}/api/ai/psychologist-pdf`);
    
    const pdfResponse = await fetch(`${baseUrl}/api/ai/psychologist-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    console.log('📥 [PDF-HTML-PSYCHOLOGIST-PDF] Ответ от AI API:', pdfResponse.status, pdfResponse.statusText);

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ [PDF-HTML-PSYCHOLOGIST-PDF] Ошибка от AI API:', errorText);
      return res.status(500).json({ success: false, error: 'Failed to generate psychologist PDF' });
    }

    const pdfData = await pdfResponse.json();
    
    if (!pdfData.success || !pdfData.psychologistPdf) {
      console.error('❌ [PDF-HTML-PSYCHOLOGIST-PDF] AI API вернул ошибку или пустой PDF');
      return res.status(500).json({ success: false, error: 'Failed to generate psychologist PDF' });
    }

    const psychologistPdf = pdfData.psychologistPdf;
    const userNickname = pdfData.userNickname || 'Пользователь';
    console.log('✅ [PDF-HTML-PSYCHOLOGIST-PDF] PDF для психолога получен, длина:', psychologistPdf.length, 'символов');

    // Форматируем контент для HTML
    const formattedContent = formatPlanContent(psychologistPdf);
    
    // Создаем HTML документ
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF для психолога - ${userNickname}</title>
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

    console.log('✅ [PDF-HTML-PSYCHOLOGIST-PDF] HTML сгенерирован, длина:', html.length, 'символов');
    
    // Устанавливаем заголовки для скачивания PDF файла
    res.setHeader('Content-Type', 'application/pdf; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="psychologist-pdf-${userNickname}.pdf"`);
    
    res.send(html);

  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(`❌ [PDF-HTML-PSYCHOLOGIST-PDF] Критическая ошибка: ${errMsg} name=${error?.name || ''}`, error?.stack || '');
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при генерации PDF для психолога',
      details: errMsg 
    });
  }
});

export default router;

