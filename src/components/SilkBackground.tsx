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
      time += speed * 0.005; // Еще медленнее
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Создаем базовый градиентный фон
      const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      baseGradient.addColorStop(0, color);
      baseGradient.addColorStop(1, accentColor);
      ctx.fillStyle = baseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Создаем шелковый эффект с помощью медленных волн
      ctx.globalCompositeOperation = 'overlay';
      
      for (let i = 0; i < 5; i++) { // Меньше слоев для более мягкого эффекта
        ctx.beginPath();
        
        const amplitude = 60 * scale * noiseIntensity;
        const frequency = 0.003 * scale * (1 + i * 0.05); // Более низкая частота
        const phase = time * (0.5 + i * 0.1) + i * Math.PI * 0.2; // Медленнее
        
        // Создаем плавные волны
        for (let x = 0; x <= canvas.width; x += 2) {
          const y = canvas.height * 0.5 + 
                   Math.sin(x * frequency + phase) * amplitude +
                   Math.sin(x * frequency * 1.5 + phase * 1.2) * amplitude * 0.3;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        // Замыкаем путь до краев экрана
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        
        // Создаем мягкий градиент для волны
        const waveGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        const lightColor = accentColor.replace('rgb(', 'rgba(').replace(')', ', 0.3)');
        const darkColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.2)');
        
        waveGradient.addColorStop(0, lightColor);
        waveGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        waveGradient.addColorStop(1, darkColor);
        
        ctx.fillStyle = waveGradient;
        ctx.fill();
      }
      
      // Добавляем дополнительный мягкий слой
      ctx.globalCompositeOperation = 'soft-light';
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        
        const amplitude = 30 * scale * noiseIntensity;
        const frequency = 0.002 * scale;
        const phase = time * 0.3 + i * Math.PI * 0.5;
        
        for (let x = 0; x <= canvas.width; x += 3) {
          const y = canvas.height * (0.3 + i * 0.2) + 
                   Math.sin(x * frequency + phase) * amplitude;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        
        const highlightColor = accentColor.replace('rgb(', 'rgba(').replace(')', ', 0.15)');
        ctx.fillStyle = highlightColor;
        ctx.fill();
      }
      
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
