import React from 'react';

interface TelegramButtonProps {
  style?: React.CSSProperties;
  className?: string;
  variant?: 'glass' | 'solid'; // glass для главной страницы, solid для личного кабинета
}

const TelegramButton: React.FC<TelegramButtonProps> = ({ style, className, variant = 'solid' }) => {
  const isGlass = variant === 'glass';
  
  return (
    <div style={{ textAlign: 'center', margin: '20px 0', ...style }} className={className}>
      <a 
        href="https://t.me/idenself" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '12px 24px',
          backgroundColor: isGlass ? 'rgba(255, 255, 255, 0.25)' : '#ffffff',
          backdropFilter: isGlass ? 'blur(10px)' : 'none',
          WebkitBackdropFilter: isGlass ? 'blur(10px)' : 'none',
          borderRadius: '50px',
          textDecoration: 'none',
          boxShadow: isGlass ? 'none' : '0 4px 15px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          border: isGlass ? '1px solid rgba(255, 255, 255, 0.6)' : '1px solid rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isGlass ? '0 4px 15px rgba(0,0,0,0.1)' : '0 8px 20px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isGlass ? 'none' : '0 4px 15px rgba(0,0,0,0.08)';
        }}
      >
        <img 
          src="/telegram1.png" 
          alt="Telegram" 
          style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
        />
        <span style={{ 
          color: isGlass ? 'black' : '#2C3E50', 
          fontSize: '16px',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif'
        }}>
          Связаться с нами в telegram
        </span>
      </a>
    </div>
  );
};

export default TelegramButton;

