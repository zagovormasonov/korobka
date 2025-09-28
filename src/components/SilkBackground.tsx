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
      time += speed * 0.01;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Создаем анимированный градиент
      const angle = time * 0.5; // Медленное вращение градиента
      const x1 = canvas.width * 0.5 + Math.cos(angle) * canvas.width * 0.5;
      const y1 = canvas.height * 0.5 + Math.sin(angle) * canvas.height * 0.5;
      const x2 = canvas.width * 0.5 - Math.cos(angle) * canvas.width * 0.5;
      const y2 = canvas.height * 0.5 - Math.sin(angle) * canvas.height * 0.5;
      
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      
      // Создаем плавные переходы между цветами
      const phase = Math.sin(time * 0.3) * 0.5 + 0.5; // От 0 до 1
      
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, `rgba(${color.match(/\d+/g).join(', ')}, ${0.7 + phase * 0.3})`);
      gradient.addColorStop(1, accentColor);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Добавляем второй слой для более богатого эффекта
      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.3, 0,
        canvas.width * 0.7, canvas.height * 0.7, Math.max(canvas.width, canvas.height)
      );
      
      const phase2 = Math.sin(time * 0.2 + Math.PI) * 0.5 + 0.5;
      gradient2.addColorStop(0, `rgba(${accentColor.match(/\d+/g).join(', ')}, ${0.3 * phase2})`);
      gradient2.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      gradient2.addColorStop(1, `rgba(${color.match(/\d+/g).join(', ')}, ${0.2 * (1 - phase2)})`);
      
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = gradient2;
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
