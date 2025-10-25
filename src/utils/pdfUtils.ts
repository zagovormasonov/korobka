/**
 * Утилиты для работы с PDF файлами
 * Решение проблемы открытия PDF в Safari приватном режиме
 */

/**
 * Проверяет, является ли браузер Safari на мобильном устройстве
 */
export const isMobileSafari = (): boolean => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
  return isMobile && isSafari;
};

/**
 * Создает iframe для отображения PDF в Safari приватном режиме
 */
const createPdfIframe = (url: string): { iframe: HTMLIFrameElement; closeButton: HTMLButtonElement } => {
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
  
  return { iframe, closeButton };
};

/**
 * Открывает PDF файл с учетом ограничений Safari приватного режима
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
  if (isMobileSafari()) {
    // Для Safari на мобильных устройствах используем iframe в той же вкладке
    const { iframe, closeButton } = createPdfIframe(url);
    
    document.body.appendChild(iframe);
    document.body.appendChild(closeButton);
    
    const message = `${successMessage} открыт в текущей вкладке!`;
    if (onSuccess) {
      onSuccess(message);
    }
  } else {
    // Для других браузеров используем стандартное открытие в новой вкладке
    window.open(url, '_blank');
    
    const message = `${successMessage} открыт в новой вкладке!`;
    if (onSuccess) {
      onSuccess(message);
    }
  }
};
