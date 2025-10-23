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
  MessageOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PersonalPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, authData, logout } = useAuth();
  const [psychologistForm] = Form.useForm();
  const [feedbackText, setFeedbackText] = useState('');
  
  // Состояния загрузки для AI операций
  const [loadingPersonalPlan, setLoadingPersonalPlan] = useState(false);
  const [loadingSessionPreparation, setLoadingSessionPreparation] = useState(false);
  const [loadingPsychologistRecommendations, setLoadingPsychologistRecommendations] = useState(false);
  const [psychologistRequestSent, setPsychologistRequestSent] = useState(false); // Анимация отправки заявки
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Состояния для проверки готовности документов
  const [documentsStatus, setDocumentsStatus] = useState({
    personal_plan: false,
    session_preparation: false,
    psychologist_pdf: false,
    generation_completed: false
  });
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#c3cfe2');

  // Проверяем авторизацию и редиректим если не авторизован
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('❌ [PERSONAL PLAN] Пользователь не авторизован, редирект на логин');
      message.error('Необходимо войти в личный кабинет');
      navigate('/lk/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Проверяем статус генерации документов при загрузке страницы
  useEffect(() => {
    if (isAuthenticated && authData?.sessionId) {
      checkDocumentsStatus();
    }
  }, [isAuthenticated, authData?.sessionId]);

  const checkDocumentsStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await apiRequest(`api/background-generation/status/${authData?.sessionId}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 [PERSONAL PLAN] Статус документов:', data);
        
        setDocumentsStatus({
          personal_plan: data.documents.personal_plan,
          session_preparation: data.documents.session_preparation,
          psychologist_pdf: data.documents.psychologist_pdf,
          generation_completed: data.status === 'completed'
        });
      }
    } catch (error) {
      console.error('❌ [PERSONAL PLAN] Ошибка проверки статуса документов:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 [LOGOUT] Выход из ЛК');
    // Используем функцию logout из хука useAuth
    logout();
    navigate('/', { replace: true });
  };

  // Утилитарная функция для определения мобильных браузеров
  const isMobileSafari = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    return isMobile && isSafari;
  };

  // Утилитарная функция для открытия PDF
  const openPdf = (url: string, filename: string, successMessage: string) => {
    if (isMobileSafari()) {
      // Для мобильного Safari используем скачивание
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success(`${successMessage} скачан!`);
    } else {
      // Для десктопных браузеров открываем в новой вкладке
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        message.success(`${successMessage} открыт в новой вкладке!`);
      } else {
        // Fallback: если popup заблокирован, скачиваем
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success(`${successMessage} скачан!`);
      }
    }
    
    // Очищаем URL через 5 секунд
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  };

  const downloadPersonalPlan = async () => {
    setLoadingPersonalPlan(true);
    try {
      const response = await apiRequest(`api/background-generation/download/personal-plan/${authData?.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        
        // Используем утилитарную функцию для открытия PDF
        openPdf(url, 'personal-plan.pdf', 'Персональный план');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Ошибка при скачивании персонального плана');
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
      const response = await apiRequest(`api/background-generation/download/session-preparation/${authData?.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        
        // Используем утилитарную функцию для открытия PDF
        openPdf(url, `session-preparation-${specialistType}.pdf`, 'Подготовка к сеансу');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Ошибка при скачивании подготовки к сеансу');
      }
    } catch (error) {
      console.error('Error downloading session preparation:', error);
      message.error('Произошла ошибка при скачивании подготовки к сеансу');
    } finally {
      setLoadingSessionPreparation(false);
    }
  };

  const handlePsychologistRequest = async (values: any) => {
    console.log('🚀 [PERSONAL-PLAN] Начинаем отправку заявки:', values);
    try {
      // Получаем UTM-метки из URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utmSource: urlParams.get('utm_source'),
        utmMedium: urlParams.get('utm_medium'),
        utmCampaign: urlParams.get('utm_campaign'),
        utmTerm: urlParams.get('utm_term'),
        utmContent: urlParams.get('utm_content')
      };

      console.log('📤 [PERSONAL-PLAN] Отправляем запрос на сервер...');
      const response = await apiRequest('api/telegram/psychologist-request', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: authData?.sessionId,
          ...values,
          ...utmData
        }),
      });
      console.log('📥 [PERSONAL-PLAN] Получен ответ от сервера:', response.status);

      if (response.ok) {
        // Запускаем анимацию успешной отправки
        console.log('🎉 [PERSONAL-PLAN] Запускаем анимацию отправки заявки');
        setPsychologistRequestSent(true);
        
        // Показываем всплывающее уведомление с анимацией
        message.success({
          content: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              <CheckOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
              <div>
                <div style={{ color: '#52c41a', fontWeight: '600' }}>
                  Заявка успешно отправлена!
                </div>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                  Мы свяжемся с вами в ближайшее время
                </div>
              </div>
            </div>
          ),
          duration: 5,
          style: {
            marginTop: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #52c41a'
          }
        });
        
        // Очищаем форму
        psychologistForm.resetFields();
        
        // Сбрасываем анимацию через 3 секунды
        setTimeout(() => {
          console.log('🔄 [PERSONAL-PLAN] Сбрасываем анимацию отправки заявки');
          setPsychologistRequestSent(false);
        }, 3000);
      } else {
        message.error({
          content: (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              <div style={{ color: '#ff4d4f' }}>
                ❌ Ошибка при отправке заявки
              </div>
            </div>
          ),
          duration: 4,
          style: {
            marginTop: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #ff4d4f'
          }
        });
      }
    } catch (error) {
      console.error('❌ [PERSONAL-PLAN] Ошибка при отправке заявки:', error);
      console.error('❌ [PERSONAL-PLAN] Детали ошибки:', error.message, error.stack);
      message.error({
        content: (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            <div style={{ color: '#ff4d4f' }}>
              ❌ Произошла ошибка при отправке заявки
            </div>
          </div>
        ),
        duration: 4,
        style: {
          marginTop: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid #ff4d4f'
        }
      });
    }
  };

  const downloadPsychologistRecommendations = async () => {
    setLoadingPsychologistRecommendations(true);
    try {
      const response = await apiRequest(`api/background-generation/download/psychologist-pdf/${authData?.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        
        // Используем утилитарную функцию для открытия PDF
        openPdf(url, 'psychologist-recommendations.pdf', 'Рекомендации для психолога');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Ошибка при скачивании рекомендаций для психолога');
      }
    } catch (error) {
      console.error('Error downloading psychologist recommendations:', error);
      message.error('Произошла ошибка при скачивании рекомендаций для психолога');
    } finally {
      setLoadingPsychologistRecommendations(false);
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
            sessionId: authData?.sessionId,
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

  // Показываем загрузку во время проверки авторизации
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>Загрузка...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Проверяем авторизацию</div>
        </div>
      </div>
    );
  }

  // Показываем загрузку во время проверки статуса документов
  if (checkingStatus) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>Проверяем документы...</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Загружаем статус генерации</div>
        </div>
      </div>
    );
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
        {authData?.nickname && (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#60CDEA',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              {authData?.nickname.charAt(0).toUpperCase()}
            </div>
            <Text style={{ 
              fontSize: '18px',
              fontWeight: '500',
              color: '#333'
            }}>
              {authData?.nickname}
            </Text>
          </div>
        )}
        <Button 
          type="primary"
          onClick={handleLogout}
          style={{ 
            backgroundColor: '#60CDEA',
            borderColor: '#60CDEA',
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
              disabled={!documentsStatus.personal_plan}
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '22px',
                backgroundColor: documentsStatus.personal_plan ? '#60CDEA' : '#D9D9D9',
                borderColor: documentsStatus.personal_plan ? '#60CDEA' : '#D9D9D9',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loadingPersonalPlan ? 'Генерируем план...' : 
               documentsStatus.personal_plan ? 'Скачать план' : 'План готовится...'}
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
                  backgroundColor: psychologistRequestSent ? '#52c41a' : '#60CDEA',
                  borderColor: psychologistRequestSent ? '#52c41a' : '#60CDEA',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  transform: psychologistRequestSent ? 'scale(0.95)' : 'scale(1)'
                }}
                icon={psychologistRequestSent ? <CheckOutlined /> : null}
              >
                {psychologistRequestSent ? 'Заявка отправлена!' : 'Оставить заявку'}
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
              Подготовка к сеансам с психологом и психиатром
            </Title>
            <Text style={{ 
              color: '#7B8794', 
              fontSize: '14px',
              display: 'block',
              marginBottom: '25px',
              lineHeight: '1.5'
            }}>
              Руководство для эффективной подготовки к сеансу
            </Text>
            <Button 
              type="primary"
              onClick={() => downloadSessionPreparation('psychologist')}
              loading={loadingSessionPreparation}
              disabled={!documentsStatus.session_preparation}
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '22px',
                backgroundColor: documentsStatus.session_preparation ? '#60CDEA' : '#D9D9D9',
                borderColor: documentsStatus.session_preparation ? '#60CDEA' : '#D9D9D9',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loadingSessionPreparation ? 'Генерируем...' : 
               documentsStatus.session_preparation ? 'Скачать подготовку' : 'Подготовка готовится...'}
            </Button>
          </div>

          {/* Psychologist Recommendations Card */}
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
              backgroundColor: '#FFF7E6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <UserOutlined style={{ fontSize: '24px', color: '#FA8C16' }} />
            </div>
            <Title level={4} style={{ 
              color: '#2C3E50', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Рекомендации для психолога и психиатра
            </Title>
            <Text style={{ 
              color: '#7B8794', 
              fontSize: '14px',
              display: 'block',
              marginBottom: '25px',
              lineHeight: '1.5'
            }}>
              Специальный отчет для психолога и психиатра с рекомендациями
            </Text>
            <Button 
              type="primary"
              onClick={downloadPsychologistRecommendations}
              loading={loadingPsychologistRecommendations}
              disabled={!documentsStatus.psychologist_pdf}
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '22px',
                backgroundColor: documentsStatus.psychologist_pdf ? '#60CDEA' : '#D9D9D9',
                borderColor: documentsStatus.psychologist_pdf ? '#60CDEA' : '#D9D9D9',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loadingPsychologistRecommendations ? 'Генерируем...' : 
               documentsStatus.psychologist_pdf ? 'Скачать рекомендации' : 'Рекомендации готовятся...'}
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
                  backgroundColor: '#60CDEA',
                  borderColor: '#60CDEA',
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

