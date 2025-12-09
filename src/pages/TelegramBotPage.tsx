import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Card } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import Silk from '../components/Silk';
import { useThemeColor } from '../hooks/useThemeColor';

const { Title, Text, Paragraph } = Typography;

const TelegramBotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#FFED82');

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh + 100px)',
      padding: '40px 20px 140px 20px',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        top: -50,
        left: 0,
        width: '100%',
        height: 'calc(100vh + 150px)',
        zIndex: -1
      }}>
        <Silk 
          speed={8.7}
          scale={0.5}
          color="#FFED82"
          darkColor="#4F958B"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <Card style={{ 
        width: '100%', 
        maxWidth: '600px', 
        padding: '40px 24px',
        borderRadius: '24px',
        boxShadow: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.6)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <MessageOutlined 
            style={{ 
              fontSize: '64px', 
              color: '#4F958B', 
              marginBottom: '20px' 
            }} 
          />
          <Title level={2} style={{ color: '#333', marginBottom: '16px', fontFamily: 'Comfortaa, sans-serif', fontSize: '28px' }}>
            Подпишитесь на бота в telegram🙏
          </Title>
        </div>

        <Paragraph style={{ 
          color: '#333', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          Скоро мы откроем вам доступ к множеству новых функций, а т.к. мы не собираем ваши контактные данные, бот - единственный способ получить уведомление о новых возможностях. Обещаем не спамить.
        </Paragraph>

        <div style={{ marginBottom: '30px' }}>
          <Title level={4} style={{ color: '#333', marginBottom: '16px', fontFamily: 'Comfortaa, sans-serif' }}>
            В следующих обновлениях вы получите:
          </Title>
          <ul style={{ 
            paddingLeft: '20px', 
            margin: 0,
            color: '#333',
            fontSize: '15px',
            lineHeight: '1.8'
          }}>
            <li style={{ marginBottom: '12px' }}>
              возможность подключить к платформе своего психолога, делать заметки после сеансов и отмечать свой прогресс
            </li>
            <li style={{ marginBottom: '12px' }}>
              вести умные ИИ-дневники и трекеры, созданные в реальном времени индивидуально под вас
            </li>
            <li style={{ marginBottom: '12px' }}>
              персональные аудио-медитации, созданные в реальном времени под вашу ситуацию
            </li>
            <li style={{ marginBottom: '12px' }}>
              сотни упражнений с техниками из доказательных методов психотерапии
            </li>
            <li>
              наборы упражнений, созданных в реальном времени под вашу ситуацию
            </li>
          </ul>
        </div>

        <Paragraph style={{ 
          color: '#333', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '30px',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          Всё, что нужно сейчас сделать - подписаться на бота😊
        </Paragraph>

        <Button 
          type="primary" 
          size="large" 
          icon={<MessageOutlined />}
          onClick={() => window.open('https://t.me/idenself_bot', '_blank')}
          style={{ 
            width: '100%', 
            marginBottom: '20px',
            height: '56px',
            borderRadius: '28px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: '#4F958B',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          Подписаться на бота
        </Button>

        <Button 
          type="default" 
          size="large" 
          onClick={handleContinue}
          style={{ 
            width: '100%',
            height: '56px',
            borderRadius: '28px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(79, 149, 139, 0.3)',
            border: '2px solid rgba(79, 149, 139, 0.3)',
            color: '#4F958B'
          }}
        >
          Далее
        </Button>
      </Card>
    </div>
  );
};

export default TelegramBotPage;

