import React, { useEffect, useRef } from 'react';

interface SilkBackgroundProps {
  speed?: number;
  scale?: number;
  noiseIntensity?: number;
  rotation?: number;
  color?: string;
  style?: React.CSSProperties;
}

const SilkBackground: React.FC<SilkBackgroundProps> = ({
  speed = 3.3,
  scale = 0.5,
  noiseIntensity = 0.7,
  rotation = 0,
  color = 'rgb(0, 105, 92)',
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
      
      // Создаем базовый цветной фон
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Создаем шелковый эффект с помощью множественных волн
      ctx.globalCompositeOperation = 'multiply';
      
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        
        const amplitude = 80 * scale * noiseIntensity;
        const frequency = 0.005 * scale * (1 + i * 0.1);
        const phase = time * (1 + i * 0.2) + i * Math.PI * 0.3;
        
        // Создаем сложные волны
        for (let x = 0; x <= canvas.width; x += 1) {
          const y = canvas.height * 0.5 + 
                   Math.sin(x * frequency + phase) * amplitude +
                   Math.sin(x * frequency * 2 + phase * 1.5) * amplitude * 0.5 +
                   Math.cos(x * frequency * 0.5 + phase * 0.8) * amplitude * 0.3;
          
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
        
        // Создаем градиент для волны
        const waveGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        const lightColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.8)');
        const darkColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.3)');
        
        waveGradient.addColorStop(0, lightColor);
        waveGradient.addColorStop(0.5, color);
        waveGradient.addColorStop(1, darkColor);
        
        ctx.fillStyle = waveGradient;
        ctx.fill();
      }
      
      // Добавляем дополнительный слой с другим режимом наложения
      ctx.globalCompositeOperation = 'screen';
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        
        const amplitude = 40 * scale * noiseIntensity;
        const frequency = 0.008 * scale;
        const phase = time * 0.5 + i * Math.PI * 0.7;
        
        for (let x = 0; x <= canvas.width; x += 2) {
          const y = canvas.height * (0.2 + i * 0.3) + 
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
        
        const highlightColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.1)');
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
  }, [speed, scale, noiseIntensity, rotation, color]);

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
