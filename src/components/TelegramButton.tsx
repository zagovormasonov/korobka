import React from 'react';

interface TelegramButtonProps {
  style?: React.CSSProperties;
  className?: string;
}

const TelegramButton: React.FC<TelegramButtonProps> = ({ style, className }) => {
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
          backgroundColor: '#ffffff',
          borderRadius: '50px',
          textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          border: '1px solid rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
        }}
      >
        <img 
          src="/telegram1.png" 
          alt="Telegram" 
          style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
        />
        <span style={{ 
          color: '#2C3E50', 
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

