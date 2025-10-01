import { useEffect } from 'react';

/**
 * Хук для управления цветом статус-бара и подвала страницы
 * @param color - цвет в формате hex (например, "#50958c")
 */
export const useThemeColor = (color: string) => {
  useEffect(() => {
    // Обновляем theme-color для статус-бара
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    }

    // Обновляем для IE/Edge
    const metaMsNavButton = document.querySelector('meta[name="msapplication-navbutton-color"]');
    if (metaMsNavButton) {
      metaMsNavButton.setAttribute('content', color);
    }

    // Обновляем для iOS Safari (статус-бар)
    const metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaAppleStatusBar) {
      // Используем 'default', 'black' или 'black-translucent'
      // Для светлых фонов - default, для темных - black-translucent
      const isLightColor = isColorLight(color);
      metaAppleStatusBar.setAttribute('content', isLightColor ? 'default' : 'black-translucent');
    }

    // Обновляем цвет фона body для подвала
    document.body.style.backgroundColor = color;

    // Cleanup при размонтировании
    return () => {
      // Возвращаем дефолтный цвет
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff');
      }
      if (metaMsNavButton) {
        metaMsNavButton.setAttribute('content', '#ffffff');
      }
      document.body.style.backgroundColor = '';
    };
  }, [color]);
};

/**
 * Определяет, является ли цвет светлым
 */
const isColorLight = (color: string): boolean => {
  // Конвертируем hex в RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Вычисляем яркость
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 155;
};

