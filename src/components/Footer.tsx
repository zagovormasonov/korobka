import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  style?: React.CSSProperties;
}

const Footer: React.FC<FooterProps> = ({ style }) => {
  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '40px',
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
      justifyContent: 'center',
      ...style
    }}>
      <Link 
        to="/offer" 
        style={{ 
          color: 'rgb(0, 0, 0)', 
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          textDecoration: 'none'
        }}
      >
        Публичная оферта
      </Link>
      <Link 
        to="/privacy-policy" 
        style={{ 
          color: 'rgb(0, 0, 0)', 
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          textDecoration: 'none'
        }}
      >
        Политика конфиденциальности
      </Link>
      <Link 
        to="/consent" 
        style={{ 
          color: 'rgb(0, 0, 0)', 
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          textDecoration: 'none'
        }}
      >
        Согласие на обработку персональных данных
      </Link>
    </div>
  );
};

export default Footer;

