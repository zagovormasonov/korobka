import React, { useState, useEffect, useRef } from 'react';
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
import TelegramButton from '../components/TelegramButton';
import Footer from '../components/Footer';
import { openPdf, downloadPdf } from '../utils/pdfUtils';
import { trackEvent } from '../utils/analytics';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PersonalPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, authData, logout } = useAuth();
  const [psychologistForm] = Form.useForm();
  const [feedbackText, setFeedbackText] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [feedbackLimit, setFeedbackLimit] = useState({ requestsToday: 0, limit: 5, remaining: 5, canSend: true });
  
  // Состояния загрузки для AI операций
  const [loadingPersonalPlan, setLoadingPersonalPlan] = useState(false);
  const [loadingSessionPreparation, setLoadingSessionPreparation] = useState(false);
  const [loadingPsychologistRecommendations, setLoadingPsychologistRecommendations] = useState(false);
  const [psychologistRequestSent, setPsychologistRequestSent] = useState(false); // Анимация отправки заявки
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
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
      loadChatHistory();
      checkFeedbackLimit();
    }
  }, [isAuthenticated, authData?.sessionId]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
  const handleOpenPdf = (url: string, filename: string, successMessage: string) => {
    openPdf(url, filename, successMessage, message.success);
  };

  // Утилитарная функция для скачивания PDF
  const handleDownloadPdf = (url: string, filename: string, successMessage: string) => {
    downloadPdf(url, filename, successMessage, message.success);
  };

  const downloadPersonalPlan = async () => {
    setLoadingPersonalPlan(true);
    try {
      // Создаем прямую ссылку на PDF endpoint
      const pdfUrl = `${window.location.origin}/api/background-generation/download/personal-plan/${authData?.sessionId}`;
      
      // Открываем PDF напрямую по ссылке
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      message.success('Персональный план открыт в новой вкладке!');
      
      // Tracking: скачали персональный план (PDF #1)
      if (authData?.sessionId) {
        await trackEvent('pdf_download', authData.sessionId, { pdf_type: 'personal_plan', pdf_number: 1 });
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
      // Создаем прямую ссылку на PDF endpoint
      const pdfUrl = `${window.location.origin}/api/background-generation/download/session-preparation/${authData?.sessionId}`;
      
      // Открываем PDF напрямую по ссылке
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      message.success('Подготовка к сеансу открыта в новой вкладке!');
      
      // Tracking: скачали подготовку к сеансу (PDF #2)
      if (authData?.sessionId) {
        await trackEvent('pdf_download', authData.sessionId, { pdf_type: 'session_preparation', pdf_number: 2 });
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
          }
        });
        
        // Очищаем форму
        psychologistForm.resetFields();
        
        // Tracking: оставили заявку на психолога
        if (authData?.sessionId) {
          await trackEvent('psychologist_request', authData.sessionId, { 
            name: values.name,
            contact: values.contact
          });
        }
        
        // Сбрасываем анимацию через 3 секунды
        setTimeout(() => {
          console.log('🔄 [PERSONAL-PLAN] Сбрасываем анимацию отправки заявки');
          setPsychologistRequestSent(false);
        }, 3000);
      } else {
        // Проверяем, если это ошибка превышения лимита заявок
        if (response.status === 429) {
          const errorData = await response.json();
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
                  ⏰ Слишком много заявок
                </div>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                  {errorData.message || 'Вы уже отправили максимальное количество заявок за последний час. Попробуйте позже.'}
                </div>
              </div>
            ),
            duration: 6,
            style: {
              marginTop: '20px',
              borderRadius: '12px'
            }
          });
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
              borderRadius: '12px'
            }
          });
        }
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
        
        // Tracking: скачали рекомендации для психолога (PDF #3)
        if (authData?.sessionId) {
          await trackEvent('pdf_download', authData.sessionId, { pdf_type: 'psychologist_pdf', pdf_number: 3 });
        }
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

  const loadChatHistory = async () => {
    if (!authData?.sessionId) return;
    
    setLoadingChatHistory(true);
    try {
      const response = await apiRequest(`api/ai/session-feedback/history/${authData.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          const formattedMessages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
          setChatMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  const checkFeedbackLimit = async () => {
    if (!authData?.sessionId) return;
    
    try {
      const response = await apiRequest(`api/ai/session-feedback/limit/${authData.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFeedbackLimit(data);
        }
      }
    } catch (error) {
      console.error('Error checking feedback limit:', error);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      message.warning('Пожалуйста, введите текст обратной связи');
      return;
    }

    if (!feedbackLimit.canSend) {
      message.warning(`Достигнут лимит запросов (${feedbackLimit.limit} запросов всего).`);
      return;
    }

    const userMessage = feedbackText.trim();
    setLoadingFeedback(true);
    
    // Добавляем сообщение пользователя в чат
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setFeedbackText('');

    try {
      // Формируем историю для отправки
      const history = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await apiRequest('api/ai/session-feedback', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: authData?.sessionId,
          message: userMessage,
          history: history
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Добавляем ответ AI в чат
          setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
          // Обновляем лимит
          await checkFeedbackLimit();
          message.success('Ответ получен!');
        } else {
          message.error(data.error || 'Ошибка при анализе обратной связи');
          // Удаляем сообщение пользователя при ошибке
          setChatMessages(prev => prev.slice(0, -1));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          message.error(errorData.error || 'Достигнут лимит запросов (5 запросов всего).');
          setFeedbackLimit(prev => ({ ...prev, canSend: false, remaining: 0 }));
        } else {
          message.error(errorData.error || 'Ошибка при отправке обратной связи');
        }
        // Удаляем сообщение пользователя при ошибке
        setChatMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      message.error('Произошла ошибка при отправке обратной связи');
      // Удаляем сообщение пользователя при ошибке
      setChatMessages(prev => prev.slice(0, -1));
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
              backgroundColor: '#4F958B',
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
            backgroundColor: '#4F958B',
            borderColor: '#4F958B',
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
              backgroundColor: '#E8F5F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <DownloadOutlined style={{ fontSize: '24px', color: '#4F958B' }} />
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
                backgroundColor: documentsStatus.personal_plan ? '#4F958B' : '#D9D9D9',
                borderColor: documentsStatus.personal_plan ? '#4F958B' : '#D9D9D9',
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
                backgroundColor: '#E8F5F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}>
                <UserOutlined style={{ fontSize: '24px', color: '#4F958B' }} />
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
                  backgroundColor: psychologistRequestSent ? '#52c41a' : '#4F958B',
                  borderColor: psychologistRequestSent ? '#52c41a' : '#4F958B',
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
              backgroundColor: '#E8F5F3',
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
                backgroundColor: documentsStatus.session_preparation ? '#4F958B' : '#D9D9D9',
                borderColor: documentsStatus.session_preparation ? '#4F958B' : '#D9D9D9',
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
              backgroundColor: '#E8F5F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <UserOutlined style={{ fontSize: '24px', color: '#4F958B' }} />
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
                backgroundColor: documentsStatus.psychologist_pdf ? '#4F958B' : '#D9D9D9',
                borderColor: documentsStatus.psychologist_pdf ? '#4F958B' : '#D9D9D9',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              {loadingPsychologistRecommendations ? 'Генерируем...' : 
               documentsStatus.psychologist_pdf ? 'Скачать рекомендации' : 'Рекомендации готовятся...'}
            </Button>
          </div>

          {/* Feedback Chat Card */}
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
              backgroundColor: '#E8F5F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <MessageOutlined style={{ fontSize: '24px', color: '#4F958B' }} />
            </div>
            <Title level={4} style={{ 
              color: '#2C3E50', 
              marginBottom: '15px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Обратная связь
            </Title>
            <Text style={{ 
              color: '#7B8794', 
              fontSize: '14px',
              display: 'block',
              marginBottom: '25px',
              lineHeight: '1.5'
            }}>
              Получите персональную обратную связь от AI о вашем опыте на сеансе у психолога
            </Text>
            <Text style={{ 
              color: '#7B8794', 
              fontSize: '12px',
              display: 'block',
              marginBottom: '25px'
            }}>
              Осталось запросов: {feedbackLimit.remaining} из {feedbackLimit.limit}
            </Text>
            <Button 
              type="primary"
              onClick={() => navigate('/feedback-chat')}
              style={{
                width: '100%',
                height: '45px',
                borderRadius: '22px',
                backgroundColor: '#4F958B',
                borderColor: '#4F958B',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Открыть чат
            </Button>
          </div>
        </div>
        
        {/* Кнопки Telegram */}
        <TelegramButton 
          variant="solid" 
          style={{ marginTop: '40px', marginBottom: '20px' }} 
          text="Написать в telegram"
          url="https://t.me/idenself"
          topText="Напишите, пожалуйста, обратную связь, идеи и пожелания нам в telegram"
        />
        
        <TelegramButton 
          variant="solid" 
          style={{ marginTop: '0', marginBottom: '20px' }} 
          text="Дневник развития нашего проекта"
          url="https://t.me/idenself_channel"
          bottomText="Вы можете поддержать проект, отправив любую сумму на АльфаБанк по номеру телефона +79251988962 (Иван)"
        />
        
        {/* Футер со ссылками */}
        <Footer />
      </div>
    </div>
  );
};

export default PersonalPlanPage;

