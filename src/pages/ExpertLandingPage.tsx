import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Card, Space, Divider } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Silk from '../components/Silk';
import { useThemeColor } from '../hooks/useThemeColor';

const { Title, Text, Paragraph } = Typography;

const ExpertLandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#f5b878');

  const handlePayment = () => {
    // Переходим к оплате 990 рублей для эксперта
    navigate('/payment?type=expert&amount=990');
  };

  const handleBack = () => {
    navigate('/registration');
  };

  const benefits = [
    {
      title: 'Ваша анкета',
      description: 'Настройте ваши социальные сети, персональные ссылки и информацию. Сделайте себя заметным для клиентов вашего города и вашего направления.'
    },
    {
      title: 'Ваши услуги',
      description: 'Размещайте ваши персональные услуги и получайте стабильные заказы. Вас легко найдут, благодаря удобному расширенному поиску'
    },
    {
      title: 'Ваши знания',
      description: 'Публикуйте ваши статьи и материалы, вдохновляйте читателей и становитесь узнаваемым экспертом. Ваши знания будут доступны не только на нашей платформе, но и в поисковиках Google, Yandex и других.'
    },
    {
      title: 'Ваши мероприятия',
      description: 'Организуйте ваши офлайн мероприятия: тренинги, семинары, ретриты, мастер-классы. Пусть о вашем мероприятии узнают все!'
    },
    {
      title: 'Ваши цифровые продукты',
      description: 'Размещайте и продавайте ваши уникальные обучающие программы, полезные курсы и вебинары. Найдите свою аудиторию и монетизируйте свой опыт!'
    },
    {
      title: 'Ваш бренд',
      description: 'Наслаждайтесь! Пока вы занимаетесь тем, что любите, наша платформа заботится о вашем успехе. Прозрачные оценки и отзывы реальных людей помогут вам завоевать доверие и стать по-настоящему узнаваемым экспертом.'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      position: 'relative'
    }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}>
        <Silk 
          speed={8.7}
          scale={0.5}
          color="#ffe59e"
          darkColor="#e8722a"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Кнопка назад */}
        <div style={{ marginBottom: '20px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ 
              color: '#333',
              fontSize: '16px',
              height: 'auto',
              padding: '8px 0'
            }}
          >
            Назад
          </Button>
        </div>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={1} style={{ 
            color: '#333',
            fontFamily: 'Comfortaa, sans-serif',
            fontSize: '36px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Привилегии эксперта
          </Title>
          <Paragraph style={{ 
            fontSize: '18px', 
            color: '#666',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Приобретая профессиональный профиль, вы получаете прямой доступ к активной аудитории, 
            выбирающей осознанное развитие и готовой к трансформации.
          </Paragraph>
        </div>

        {/* Цена */}
        <Card style={{
          textAlign: 'center',
          marginBottom: '40px',
          borderRadius: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ 
              fontSize: '16px', 
              color: '#333',
              fontWeight: '600',
              display: 'block',
              marginBottom: '8px'
            }}>
              Пожизненный доступ
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Text style={{ 
                fontSize: '24px', 
                color: '#999',
                textDecoration: 'line-through',
                fontFamily: 'Inter, sans-serif'
              }}>
                3369 ₽
              </Text>
              <Text style={{ 
                fontSize: '36px', 
                color: '#f3ba6f',
                fontWeight: '700',
                fontFamily: 'Inter, sans-serif'
              }}>
                990 ₽
              </Text>
            </div>
          </div>
        </Card>

        {/* Преимущества */}
        <div style={{ marginBottom: '40px' }}>
          <Title level={2} style={{ 
            textAlign: 'center',
            color: '#333',
            fontFamily: 'Comfortaa, sans-serif',
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '32px'
          }}>
            Преимущества экспертной подписки
          </Title>

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                style={{
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.6)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <CheckCircleOutlined style={{ 
                    color: '#f3ba6f', 
                    fontSize: '24px',
                    marginTop: '4px',
                    flexShrink: 0
                  }} />
                  <div>
                    <Title level={4} style={{ 
                      color: '#333',
                      fontFamily: 'Comfortaa, sans-serif',
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      {benefit.title}
                    </Title>
                    <Paragraph style={{ 
                      color: '#666',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: 0,
                      fontFamily: 'Inter, sans-serif'
                    }}>
                      {benefit.description}
                    </Paragraph>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </div>

        {/* Призыв к действию */}
        <Card style={{
          textAlign: 'center',
          marginBottom: '40px',
          borderRadius: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.6)'
        }}>
          <Title level={3} style={{ 
            color: '#333',
            fontFamily: 'Comfortaa, sans-serif',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Станьте тем, кто вдохновляет
          </Title>
          <Paragraph style={{ 
            fontSize: '16px', 
            color: '#666',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '24px'
          }}>
            Выберите профессиональный профиль эксперта — и начните формировать свой личный бренд, 
            который будет работать на вас!
          </Paragraph>
          
          <Button 
            type="primary"
            size="large"
            onClick={handlePayment}
            style={{
              height: '56px',
              borderRadius: '28px',
              fontSize: '18px',
              fontWeight: '600',
              backgroundColor: '#f3ba6f',
              borderColor: '#f3ba6f',
              border: 'none',
              boxShadow: '0 4px 12px rgba(243, 186, 111, 0.3)',
              padding: '0 40px'
            }}
          >
            Перейти к оплате
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ExpertLandingPage;
