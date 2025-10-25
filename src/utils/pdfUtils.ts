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
    // Принудительно открываем в новой вкладке с помощью window.open
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (newWindow) {
      // Устанавливаем заголовок новой вкладки
      newWindow.document.title = filename;
      
      // Показываем сообщение об успехе
      const message = `${successMessage} открыт в новой вкладке! Вы можете скачать его, нажав Ctrl+S (Cmd+S на Mac) или через меню браузера.`;
      if (onSuccess) {
        onSuccess(message);
      }
    } else {
      // Если popup заблокирован, используем fallback с ссылкой
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const message = `${successMessage} открыт в новой вкладке! Вы можете скачать его, нажав Ctrl+S (Cmd+S на Mac) или через меню браузера.`;
      if (onSuccess) {
        onSuccess(message);
      }
    }
  } catch (error) {
    console.error('Error opening PDF:', error);
    // Fallback к window.open если что-то пошло не так
    try {
      window.open(url, '_blank');
      const message = `${successMessage} открыт в новой вкладке! Вы можете скачать его, нажав Ctrl+S (Cmd+S на Mac) или через меню браузера.`;
      if (onSuccess) {
        onSuccess(message);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      if (onSuccess) {
        onSuccess('Ошибка при открытии PDF файла');
      }
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
    if (onSuccess) {
      onSuccess('Ошибка при скачивании PDF файла');
    }
  }
};
