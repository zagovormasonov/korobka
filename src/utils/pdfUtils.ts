/**
 * Утилиты для работы с PDF файлами
 * Нативное открытие PDF в новой вкладке браузера
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
    // Создаем временную ссылку для скачивания/открытия PDF
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = filename;
    
    // Добавляем ссылку в DOM, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Показываем сообщение об успехе
    const message = `${successMessage} открыт в новой вкладке!`;
    if (onSuccess) {
      onSuccess(message);
    }
  } catch (error) {
    console.error('Error opening PDF:', error);
    // Fallback к window.open если что-то пошло не так
    try {
      window.open(url, '_blank');
      const message = `${successMessage} открыт в новой вкладке!`;
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
