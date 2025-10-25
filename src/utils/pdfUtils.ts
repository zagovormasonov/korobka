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
    // Создаем iframe для отображения PDF в новой вкладке
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
    
    // Добавляем кнопку скачивания
    const downloadButton = document.createElement('button');
    downloadButton.innerHTML = '📥 Скачать';
    downloadButton.style.position = 'fixed';
    downloadButton.style.top = '10px';
    downloadButton.style.right = '120px';
    downloadButton.style.zIndex = '10000';
    downloadButton.style.padding = '10px 15px';
    downloadButton.style.backgroundColor = '#4F958B';
    downloadButton.style.color = 'white';
    downloadButton.style.border = 'none';
    downloadButton.style.borderRadius = '5px';
    downloadButton.style.cursor = 'pointer';
    downloadButton.style.fontSize = '14px';
    
    closeButton.onclick = () => {
      document.body.removeChild(iframe);
      document.body.removeChild(closeButton);
      document.body.removeChild(downloadButton);
    };
    
    downloadButton.onclick = () => {
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    document.body.appendChild(iframe);
    document.body.appendChild(closeButton);
    document.body.appendChild(downloadButton);
    
    // Показываем сообщение об успехе
    const message = `${successMessage} открыт в новой вкладке!`;
    if (onSuccess) {
      onSuccess(message);
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
    link.setAttribute('target', '_blank');
    
    // Добавляем ссылку в DOM, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Показываем сообщение об успехе
    const message = `${successMessage} скачан!`;
    if (onSuccess) {
      onSuccess(message);
    }
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
