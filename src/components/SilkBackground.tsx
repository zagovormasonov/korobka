import React, { useEffect, useRef } from 'react';

interface SilkBackgroundProps {
  speed?: number;
  scale?: number;
  noiseIntensity?: number;
  rotation?: number;
  color?: string;
  accentColor?: string;
  style?: React.CSSProperties;
}

const SilkBackground: React.FC<SilkBackgroundProps> = ({
  speed = 1.0, // Медленнее
  scale = 0.5,
  noiseIntensity = 0.7,
  rotation = 0,
  color = 'rgb(80, 149, 140)', // Основной цвет
  accentColor = 'rgb(255, 213, 183)', // Акцентный цвет
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;

    const animate = () => {
      time += speed * 0.008;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Создаем переливающийся градиент с изменяющимися позициями
      const phase1 = Math.sin(time * 0.4) * 0.5 + 0.5; // От 0 до 1
      const phase2 = Math.sin(time * 0.3 + Math.PI * 0.5) * 0.5 + 0.5; // Сдвиг по фазе
      const phase3 = Math.sin(time * 0.25 + Math.PI) * 0.5 + 0.5; // Еще один сдвиг
      
      // Динамически изменяющиеся точки градиента
      const x1 = canvas.width * (0.2 + phase1 * 0.6);
      const y1 = canvas.height * (0.1 + phase2 * 0.8);
      const x2 = canvas.width * (0.8 - phase1 * 0.6);
      const y2 = canvas.height * (0.9 - phase2 * 0.8);
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      
      // Плавно меняющиеся цветовые остановки
      const colorMix1 = phase1;
      const colorMix2 = phase2;
      const colorMix3 = phase3;
      
      // Извлекаем RGB значения из цветов
      const color1RGB = color.match(/\d+/g).map(Number);
      const color2RGB = accentColor.match(/\d+/g).map(Number);
      
      // Создаем промежуточные цвета
      const mixedColor1 = `rgb(${Math.round(color1RGB[0] + (color2RGB[0] - color1RGB[0]) * colorMix1)}, ${Math.round(color1RGB[1] + (color2RGB[1] - color1RGB[1]) * colorMix1)}, ${Math.round(color1RGB[2] + (color2RGB[2] - color1RGB[2]) * colorMix1)})`;
      const mixedColor2 = `rgb(${Math.round(color2RGB[0] + (color1RGB[0] - color2RGB[0]) * colorMix2)}, ${Math.round(color2RGB[1] + (color1RGB[1] - color2RGB[1]) * colorMix2)}, ${Math.round(color2RGB[2] + (color1RGB[2] - color2RGB[2]) * colorMix2)})`;
      const mixedColor3 = `rgb(${Math.round(color1RGB[0] * (1 - colorMix3) + color2RGB[0] * colorMix3)}, ${Math.round(color1RGB[1] * (1 - colorMix3) + color2RGB[1] * colorMix3)}, ${Math.round(color1RGB[2] * (1 - colorMix3) + color2RGB[2] * colorMix3)})`;
      
      // Динамические цветовые остановки
      gradient.addColorStop(0, colorMix1 > 0.5 ? accentColor : color);
      gradient.addColorStop(0.3, mixedColor1);
      gradient.addColorStop(0.6, mixedColor2);
      gradient.addColorStop(1, colorMix2 > 0.5 ? color : accentColor);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Добавляем второй переливающийся слой
      const radialPhase = Math.sin(time * 0.35) * 0.5 + 0.5;
      const centerX = canvas.width * (0.3 + radialPhase * 0.4);
      const centerY = canvas.height * (0.3 + radialPhase * 0.4);
      
      const gradient2 = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(canvas.width, canvas.height) * (0.6 + radialPhase * 0.4)
      );
      
      const radialMix = Math.sin(time * 0.28 + Math.PI * 0.3) * 0.5 + 0.5;
      const radialColor1 = `rgba(${color2RGB.join(', ')}, ${0.15 + radialMix * 0.15})`;
      const radialColor2 = `rgba(${color1RGB.join(', ')}, ${0.1 + (1 - radialMix) * 0.1})`;
      
      gradient2.addColorStop(0, radialColor1);
      gradient2.addColorStop(0.4, 'rgba(255, 255, 255, 0.05)');
      gradient2.addColorStop(1, radialColor2);
      
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Третий слой для еще более богатого эффекта
      const gradient3 = ctx.createLinearGradient(
        0, canvas.height * (0.2 + phase3 * 0.6),
        canvas.width, canvas.height * (0.8 - phase3 * 0.6)
      );
      
      const finalMix = Math.sin(time * 0.22) * 0.5 + 0.5;
      gradient3.addColorStop(0, `rgba(${color1RGB.join(', ')}, ${0.08 * finalMix})`);
      gradient3.addColorStop(1, `rgba(${color2RGB.join(', ')}, ${0.08 * (1 - finalMix)})`);
      
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = gradient3;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'source-over';
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, scale, noiseIntensity, rotation, color, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        transform: `rotate(${rotation}deg)`,
        ...style
      }}
    />
  );
};

export default SilkBackground;
