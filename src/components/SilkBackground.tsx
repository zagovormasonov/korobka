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
      
      // Создаем градиент
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Преобразуем rgb в rgba с прозрачностью
      const rgbaColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.5)');
      
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, rgbaColor); // 50% прозрачности
      gradient.addColorStop(1, color);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Создаем шелковый эффект с помощью волн
      ctx.globalCompositeOperation = 'overlay';
      
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        
        const amplitude = 50 * scale * noiseIntensity;
        const frequency = 0.01 * scale;
        const phase = time + i * 0.5;
        
        for (let x = 0; x <= canvas.width; x += 2) {
          const y1 = canvas.height * 0.3 + Math.sin(x * frequency + phase) * amplitude;
          const y2 = canvas.height * 0.7 + Math.cos(x * frequency * 1.5 + phase) * amplitude * 0.7;
          
          if (x === 0) {
            ctx.moveTo(x, y1);
          } else {
            ctx.lineTo(x, y1);
          }
        }
        
        for (let x = canvas.width; x >= 0; x -= 2) {
          const y2 = canvas.height * 0.7 + Math.cos(x * frequency * 1.5 + phase) * amplitude * 0.7;
          ctx.lineTo(x, y2);
        }
        
        ctx.closePath();
        
        const waveGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        const waveColor1 = color.replace('rgb(', 'rgba(').replace(')', ', 0.1)'); // 10% прозрачности
        const waveColor2 = color.replace('rgb(', 'rgba(').replace(')', ', 0.2)'); // 20% прозрачности
        
        waveGradient.addColorStop(0, waveColor1);
        waveGradient.addColorStop(0.5, waveColor2);
        waveGradient.addColorStop(1, waveColor1);
        
        ctx.fillStyle = waveGradient;
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
