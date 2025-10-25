/**
 * Утилиты для работы с PDF файлами
 * Нативное открытие PDF в новой вкладке браузера с возможностью скачивания
 */

/**
 * Открывает PDF файл нативно в новой вкладке браузера
 * @param url - URL PDF файла
 * @param filename - имя файла
 * @param successMessage - сообщение об успехе
 * @param onSuccess - функция обратного вызова при успехе
 */
export const openPdf = (
  url: string, 
  filename: string, 
  successMessage: string,
  onSuccess?: (message: string) => void
): void => {
  try {
    // Создаем новую вкладку с PDF
    const newWindow = window.open('', '_blank', 'noopener,noreferrer');
    
    if (newWindow) {
      // Создаем HTML страницу с PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${filename}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #f5f5f5;
              font-family: Arial, sans-serif;
            }
            .header {
              background: #4F958B;
              color: white;
              padding: 15px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: 500;
            }
            .buttons {
              display: flex;
              gap: 10px;
            }
            .btn {
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: background-color 0.2s;
            }
            .btn-download {
              background: #2E7D32;
              color: white;
            }
            .btn-download:hover {
              background: #1B5E20;
            }
            .btn-close {
              background: #f44336;
              color: white;
            }
            .btn-close:hover {
              background: #d32f2f;
            }
            .pdf-container {
              height: calc(100vh - 70px);
              width: 100%;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${filename}</h1>
            <div class="buttons">
              <button class="btn btn-download" onclick="downloadPdf()">📥 Скачать</button>
              <button class="btn btn-close" onclick="closeWindow()">✕ Закрыть</button>
            </div>
          </div>
          <div class="pdf-container">
            <iframe src="${url}" type="application/pdf"></iframe>
          </div>
          <script>
            function downloadPdf() {
              const link = document.createElement('a');
              link.href = '${url}';
              link.download = '${filename}';
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            function closeWindow() {
              window.close();
            }
          </script>
        </body>
        </html>
      `;
      
      // Записываем HTML в новую вкладку
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      // Показываем сообщение об успехе
      const message = `${successMessage} открыт в новой вкладке!`;
      if (onSuccess) {
        onSuccess(message);
      }
    } else {
      // Fallback: если popup заблокирован, используем iframe
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.zIndex = '9999';
      iframe.style.backgroundColor = 'white';
      
      // Добавляем кнопку закрытия
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '✕ Закрыть';
      closeButton.style.position = 'fixed';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.zIndex = '10000';
      closeButton.style.padding = '10px 15px';
      closeButton.style.backgroundColor = '#ff4444';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '5px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '14px';
      
      closeButton.onclick = () => {
        document.body.removeChild(iframe);
        document.body.removeChild(closeButton);
      };
      
      document.body.appendChild(iframe);
      document.body.appendChild(closeButton);
      
      const message = `${successMessage} открыт в текущей вкладке!`;
      if (onSuccess) {
        onSuccess(message);
      }
    }
  } catch (error) {
    console.error('Error opening PDF:', error);
    if (onSuccess) {
      onSuccess('Ошибка при открытии PDF файла');
    }
  }
};

/**
 * Скачивает PDF файл напрямую без открытия в новой вкладке
 * @param url - URL PDF файла
 * @param filename - имя файла
 * @param successMessage - сообщение об успехе
 * @param onSuccess - функция обратного вызова при успехе
 */
export const downloadPdf = (
  url: string, 
  filename: string, 
  successMessage: string,
  onSuccess?: (message: string) => void
): void => {
  try {
    // Создаем временную ссылку только для скачивания
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Добавляем атрибуты для принудительного скачивания
    link.setAttribute('download', filename);
    
    // Добавляем ссылку в DOM, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Небольшая задержка для проверки успешности скачивания
    setTimeout(() => {
      const message = `${successMessage} скачан!`;
      if (onSuccess) {
        onSuccess(message);
      }
    }, 500);
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    // Fallback: попробуем открыть в новой вкладке для ручного скачивания
    try {
      window.open(url, '_blank');
      const message = `${successMessage} открыт в новой вкладке для скачивания!`;
      if (onSuccess) {
        onSuccess(message);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      if (onSuccess) {
        onSuccess('Ошибка при скачивании PDF файла');
      }
    }
  }
};
