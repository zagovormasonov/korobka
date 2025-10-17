import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Silk from '../components/Silk';
import { useThemeColor } from '../hooks/useThemeColor';

const { Title, Text } = Typography;

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'client' | 'expert' | null>(null);
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#f5b878');

  const handleClientSelect = () => {
    setSelectedType('client');
    // Переходим к обычной регистрации клиента
    navigate('/payment-success?type=client');
  };

  const handleExpertSelect = () => {
    setSelectedType('expert');
    // Переходим к лендингу эксперта
    navigate('/expert-landing');
  };

  const handleExpertBenefits = () => {
    setSelectedType('expert');
    // Переходим к лендингу эксперта
    navigate('/expert-landing');
  };

  const handleExpertContinue = () => {
    setSelectedType('expert');
    // Переходим к лендингу эксперта
    navigate('/expert-landing');
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
          color="#ffe59e"
          darkColor="#e8722a"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div style={{ width: '100%', maxWidth: '800px' }}>
        {/* Кнопка назад */}
        <div style={{ marginBottom: '20px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
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
            fontSize: '32px',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            Выберите тип аккаунта
          </Title>
          <Text style={{ 
            fontSize: '18px', 
            color: '#666',
            fontFamily: 'Inter, sans-serif'
          }}>
            Выберите, как вы хотите использовать платформу
          </Text>
        </div>

        {/* Карточки выбора */}
        <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
          {/* Клиент */}
          <Col xs={24} md={12}>
            <Card
              hoverable
              onClick={handleClientSelect}
              style={{
                height: '400px',
                borderRadius: '24px',
                border: selectedType === 'client' ? '2px solid #f3ba6f' : '1px solid rgba(255, 255, 255, 0.6)',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Title level={2} style={{ 
                    color: '#333',
                    fontFamily: 'Comfortaa, sans-serif',
                    fontSize: '24px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    Я - клиент
                  </Title>
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Text style={{ 
                    fontSize: '16px', 
                    color: '#333',
                    lineHeight: '1.6',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Найдите лучших специалистов, получите ценные знания, откройте новые горизонты!
                  </Text>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="primary"
                  size="large"
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                  }}
                >
                  Зарегистрироваться
                </Button>
                
                <Text style={{ 
                  display: 'block',
                  fontSize: '12px', 
                  color: '#999',
                  marginTop: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Вы можете изменить тип аккаунта и стать экспертом позже
                </Text>
              </div>
            </Card>
          </Col>

          {/* Эксперт */}
          <Col xs={24} md={12}>
            <Card
              hoverable
              onClick={handleExpertSelect}
              style={{
                height: '400px',
                borderRadius: '24px',
                border: selectedType === 'expert' ? '2px solid #f3ba6f' : '1px solid rgba(255, 255, 255, 0.6)',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Title level={2} style={{ 
                    color: '#333',
                    fontFamily: 'Comfortaa, sans-serif',
                    fontSize: '24px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    Я - эксперт
                  </Title>
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <Text style={{ 
                    fontSize: '16px', 
                    color: '#333',
                    lineHeight: '1.6',
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: '16px',
                    display: 'block'
                  }}>
                    Монетизируйте свои знания, расширяйте аудиторию, станьте лидером мнений!
                  </Text>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#333',
                      fontWeight: '600',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      Пожизненный доступ
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Text style={{ 
                        fontSize: '18px', 
                        color: '#999',
                        textDecoration: 'line-through',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        3369 ₽
                      </Text>
                      <Text style={{ 
                        fontSize: '24px', 
                        color: '#f3ba6f',
                        fontWeight: '700',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        990 ₽
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="primary"
                  size="large"
                  onClick={handleExpertBenefits}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                    marginBottom: '8px'
                  }}
                >
                  Узнать о преимуществах Эксперта
                </Button>
                
                <Button 
                  type="default"
                  size="large"
                  onClick={handleExpertContinue}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    color: '#333',
                    border: '1px solid rgba(255, 255, 255, 0.6)'
                  }}
                >
                  Продолжить регистрацию
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RegistrationPage;
