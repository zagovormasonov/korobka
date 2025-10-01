import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Input, 
  Form, 
  message,
  Space
} from 'antd'; 
import { apiRequest } from '../config/api'; 
import { 
  DownloadOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  MessageOutlined
} from '@ant-design/icons';
import { useThemeColor } from '../hooks/useThemeColor';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PersonalPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>('');
  const [userNickname, setUserNickname] = useState('');
  const [psychologistForm] = Form.useForm();
  const [feedbackText, setFeedbackText] = useState('');
  
  // Состояния загрузки для AI операций
  const [loadingPersonalPlan, setLoadingPersonalPlan] = useState(false);
  const [loadingSessionPreparation, setLoadingSessionPreparation] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#c3cfe2');

  // Проверка токена при загрузке
  useEffect(() => {
    const token = sessionStorage.getItem('dashboardToken');
    if (!token) {
      message.error('Требуется авторизация');
      navigate('/lk/login');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await apiRequest('api/dashboard/verify-token', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        if (data.success) {
          setSessionId(data.sessionId);
          setUserNickname(data.nickname || '');
        } else {
          message.error('Сессия истекла');
          sessionStorage.removeItem('dashboardToken');
          navigate('/lk/login');
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        navigate('/lk/login');
      }
    };

    verifyToken();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('dashboardToken');
    message.success('Вы вышли из системы');
    navigate('/');
  };

  const downloadPersonalPlan = async () => {
    setLoadingPersonalPlan(true);
    try {
      const response = await apiRequest('api/pdf/personal-plan', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'personal-plan.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('Персональный план скачан!');
      } else {
        message.error('Ошибка при генерации персонального плана');
      }
    } catch (error) {
      console.error('Error downloading personal plan:', error);
      message.error('Произошла ошибка при скачивании персонального плана');
    } finally {
      setLoadingPersonalPlan(false);
    }
  };

  const downloadSessionPreparation = async (specialistType: 'psychologist' | 'psychiatrist') => {
    setLoadingSessionPreparation(true);
    try {
      const response = await apiRequest('api/pdf/session-preparation', {
        method: 'POST',
        body: JSON.stringify({ sessionId, specialistType }),
      });

      if (response.ok) {
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `session-preparation-${specialistType}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success(`Подготовка к сеансу скачана!`);
      } else {
        message.error('Ошибка при генерации подготовки к сеансу');
      }
    } catch (error) {
      console.error('Error downloading session preparation:', error);
      message.error('Произошла ошибка при скачивании подготовки к сеансу');
    } finally {
      setLoadingSessionPreparation(false);
    }
  };

  const handlePsychologistRequest = async (values: any) => {
    try {
      const response = await apiRequest('api/telegram/psychologist-request', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          ...values
        }),
      });

      if (response.ok) {
        message.success('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
        psychologistForm.resetFields();
      } else {
        message.error('Ошибка при отправке заявки');
      }
    } catch (error) {
      console.error('Error sending psychologist request:', error);
      message.error('Произошла ошибка при отправке заявки');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      message.warning('Пожалуйста, введите текст обратной связи');
      return;
    }

    setLoadingFeedback(true);
    try {
      const response = await apiRequest('api/ai/session-feedback', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          feedbackText: feedbackText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Анализ готов! Проверьте результаты ниже.');
          // Можно добавить отображение результата
          setFeedbackText('');
        } else {
          message.error('Ошибка при анализе обратной связи');
        }
      } else {
        message.error('Ошибка при отправке обратной связи');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Произошла ошибка при отправке обратной связи');
    } finally {
      setLoadingFeedback(false);
    }
  };

  if (!sessionId) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        maxWidth: '800px',
        margin: '0 auto 20px auto'
      }}>
        {userNickname && (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgb(243, 186, 111)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {userNickname.charAt(0).toUpperCase()}
            </div>
            <Text style={{ 
              fontSize: '18px',
              fontWeight: '500',
              color: '#333'
            }}>
              {userNickname}
            </Text>
          </div>
        )}
        <Button 
          type="primary"
          onClick={handleLogout}
          style={{ 
            backgroundColor: 'rgb(243, 186, 111)',
            borderColor: 'rgb(243, 186, 111)',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '500',
            height: '40px',
            borderRadius: '20px'
          }}
        >
          Выйти
        </Button>
      </div>

      {/* Main container */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={1} style={{ 
            color: '#2C3E50',
            fontSize: '32px',
            fontWeight: '600',
            marginBottom: '10px',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            Персональный план
          </Title>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* Personal Plan Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#E8F4FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <DownloadOutlined style={{ fontSize: '24px', color: '#1890FF' }} />
            </div>
            <Title level={4} style={{ 
              color: '#2C3E50', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Скачать персональный план
            </Title>
            <Text style={{ 
              color: '#7B8794', 
              fontSize: '14px',
              display: 'block',
              marginBottom: '25px',
              lineHeight: '1.5'
            }}>
              Скачай персональный план, созданный на основе всех твоих тестов
            </Text>
            <Button 
              type="primary"
              onClick={downloadPersonalPlan}
              loading={loadingPersonalPlan}
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '22px',
                backgroundColor: 'rgb(243, 186, 111)',
                borderColor: 'rgb(243, 186, 111)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loadingPersonalPlan ? 'Генерируем план...' : 'Скачать план'}
            </Button>
          </div>

          {/* Psychologist Selection Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#FFF2E8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}>
                <UserOutlined style={{ fontSize: '24px', color: '#FA8C16' }} />
              </div>
              <Title level={4} style={{ 
                color: '#2C3E50', 
                marginBottom: '0',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Подбор психолога
              </Title>
            </div>
            
            <Form
              form={psychologistForm}
              onFinish={handlePsychologistRequest}
              layout="vertical"
            >
              <Form.Item
                name="name"
                label={<span style={{ color: '#2C3E50', fontWeight: '500' }}>Имя</span>}
                rules={[{ required: true, message: 'Введите ваше имя' }]}
              >
                <Input 
                  placeholder="Ваше имя" 
                  style={{ 
                    borderRadius: '12px',
                    height: '40px'
                  }}
                />
              </Form.Item>
              <Form.Item
                name="phone"
                label={<span style={{ color: '#2C3E50', fontWeight: '500' }}>Телефон</span>}
                rules={[{ required: true, message: 'Введите номер телефона' }]}
              >
                <Input 
                  placeholder="+7 (999) 123-45-67" 
                  style={{ 
                    borderRadius: '12px',
                    height: '40px'
                  }}
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={<span style={{ color: '#2C3E50', fontWeight: '500' }}>Email</span>}
                rules={[
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Введите корректный email' }
                ]}
              >
                <Input 
                  placeholder="example@email.com" 
                  style={{ 
                    borderRadius: '12px',
                    height: '40px'
                  }}
                />
              </Form.Item>
              <Form.Item
                name="telegramUsername"
                label={<span style={{ color: '#2C3E50', fontWeight: '500' }}>Telegram (необязательно)</span>}
              >
                <Input 
                  placeholder="username или @username" 
                  style={{ 
                    borderRadius: '12px',
                    height: '40px'
                  }}
                />
              </Form.Item>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{
                  width: '100%',
                  height: '45px',
                  borderRadius: '22px',
                  backgroundColor: 'rgb(243, 186, 111)',
                  borderColor: 'rgb(243, 186, 111)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Оставить заявку
              </Button>
            </Form>
          </div>

          {/* Session Preparation Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#F6FFED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <FileTextOutlined style={{ fontSize: '24px', color: '#4F958B' }} />
            </div>
            <Title level={4} style={{ 
              color: '#2C3E50', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Подготовка к сеансу
            </Title>
            <Text style={{ 
              color: '#7B8794', 
              fontSize: '14px',
              display: 'block',
              marginBottom: '25px',
              lineHeight: '1.5'
            }}>
              PDF с рекомендациями для психолога и психиатра
            </Text>
            <Button 
              type="primary"
              onClick={() => downloadSessionPreparation('psychologist')}
              loading={loadingSessionPreparation}
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '22px',
                backgroundColor: 'rgb(243, 186, 111)',
                borderColor: 'rgb(243, 186, 111)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loadingSessionPreparation ? 'Генерируем...' : 'Скачать подготовку'}
            </Button>
          </div>

          {/* Feedback Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#FFF0F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}>
                <MessageOutlined style={{ fontSize: '24px', color: '#EB2F96' }} />
              </div>
              <Title level={4} style={{ 
                color: '#2C3E50', 
                marginBottom: '0',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Обратная связь
              </Title>
            </div>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                placeholder="Расскажите о вашем опыте на сеансе у психолога..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                style={{ 
                  borderRadius: '12px',
                  resize: 'none'
                }}
              />
              <Button 
                type="primary" 
                onClick={handleFeedbackSubmit}
                loading={loadingFeedback}
                style={{
                  width: '100%',
                  height: '45px',
                  borderRadius: '22px',
                  backgroundColor: 'rgb(243, 186, 111)',
                  borderColor: 'rgb(243, 186, 111)',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                {loadingFeedback ? 'Анализируем...' : 'Получить обратную связь'}
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalPlanPage;

