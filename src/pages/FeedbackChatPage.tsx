import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Input, message, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined, MessageOutlined } from '@ant-design/icons';
import { apiRequest } from '../config/api';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;
const { TextArea } = Input;

const FeedbackChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { authData, isAuthenticated, isLoading } = useAuth();
  const [feedbackText, setFeedbackText] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [feedbackLimit, setFeedbackLimit] = useState({ requestsToday: 0, limit: 5, remaining: 5, canSend: true });
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Проверка авторизации
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      message.error('Необходимо войти в личный кабинет');
      navigate('/lk/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Загрузка истории чата
  useEffect(() => {
    if (authData?.sessionId) {
      console.log('📥 [FEEDBACK CHAT] Загружаем историю чата для sessionId:', authData.sessionId);
      loadChatHistory();
      checkFeedbackLimit();
    }
  }, [authData?.sessionId]);

  // Добавляем приветственное сообщение для новых чатов
  useEffect(() => {
    if (!loadingChatHistory && chatMessages.length === 0) {
      const welcomeMessage = {
        role: 'assistant' as const,
        content: 'Здравствуйте! Данный чат посвящён обратной связи в ответ на то, как прошёл сеанс со специалистом. Вы можете отправить 5 запросов (1 запрос = описание 1 сеанса) и получить обратную связь'
      };
      setChatMessages([welcomeMessage]);
    }
  }, [loadingChatHistory, chatMessages.length]);

  const loadChatHistory = async () => {
    if (!authData?.sessionId) {
      console.log('⚠️ [FEEDBACK CHAT] Нет sessionId для загрузки истории');
      return;
    }
    
    console.log('📥 [FEEDBACK CHAT] Загружаем историю чата...');
    setLoadingChatHistory(true);
    try {
      const response = await apiRequest(`api/ai/session-feedback/history/${authData.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [FEEDBACK CHAT] История чата загружена:', data);
        if (data.success && data.messages) {
          const formattedMessages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
          setChatMessages(formattedMessages);
          console.log('💬 [FEEDBACK CHAT] Установлено сообщений:', formattedMessages.length);
        }
      } else {
        console.error('❌ [FEEDBACK CHAT] Ошибка загрузки истории:', response.status);
      }
    } catch (error) {
      console.error('❌ [FEEDBACK CHAT] Ошибка при загрузке истории чата:', error);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  const checkFeedbackLimit = async () => {
    if (!authData?.sessionId) {
      console.log('⚠️ [FEEDBACK CHAT] Нет sessionId для проверки лимита');
      return;
    }
    
    console.log('🔢 [FEEDBACK CHAT] Проверяем лимит запросов...');
    try {
      const response = await apiRequest(`api/ai/session-feedback/limit/${authData.sessionId}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [FEEDBACK CHAT] Лимит загружен:', data);
        if (data.success) {
          setFeedbackLimit(data);
        }
      } else {
        console.error('❌ [FEEDBACK CHAT] Ошибка проверки лимита:', response.status);
      }
    } catch (error) {
      console.error('❌ [FEEDBACK CHAT] Ошибка при проверке лимита:', error);
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
        console.error('❌ [FEEDBACK CHAT] Ошибка ответа сервера:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        if (response.status === 429) {
          message.error(errorData.error || 'Достигнут лимит запросов (5 запросов всего).');
          setFeedbackLimit(prev => ({ ...prev, canSend: false, remaining: 0 }));
        } else if (response.status === 404) {
          message.error('Данные сессии не найдены. Пожалуйста, пройдите тест заново.');
        } else if (response.status === 500) {
          message.error(errorData.error || 'Ошибка сервера. Попробуйте позже.');
        } else {
          message.error(errorData.error || `Ошибка ${response.status}: ${response.statusText}`);
        }
        // Удаляем сообщение пользователя при ошибке
        setChatMessages(prev => prev.slice(0, -1));
      }
    } catch (error: any) {
      console.error('❌ [FEEDBACK CHAT] Критическая ошибка:', error);
      console.error('❌ [FEEDBACK CHAT] Stack:', error.stack);
      
      let errorMessage = 'Произошла ошибка при отправке обратной связи';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      message.error(errorMessage);
      
      // Удаляем сообщение пользователя при ошибке
      setChatMessages(prev => prev.slice(0, -1));
    } finally {
      setLoadingFeedback(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      overflow: 'hidden'
    }}>
      {/* Шапка - фиксированная */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        zIndex: 10
      }}>
        <ArrowLeftOutlined 
          style={{ 
            fontSize: '20px', 
            cursor: 'pointer',
            color: '#2C3E50'
          }}
          onClick={() => navigate(-1)}
        />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ 
            margin: 0,
            color: '#2C3E50',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            Обратная связь
          </Title>
          <Text style={{ 
            color: '#7B8794', 
            fontSize: '12px'
          }}>
            Осталось запросов: {feedbackLimit.remaining} из {feedbackLimit.limit}
          </Text>
        </div>
      </div>

      {/* Область сообщений - прокручивается */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: 0,
        right: 0,
        bottom: '100px',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {loadingChatHistory ? (
          <div style={{ 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7B8794'
          }}>
            <Spin size="large" />
          </div>
        ) : chatMessages.length === 0 ? (
          <div style={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7B8794'
          }}>
            <MessageOutlined style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.3 }} />
            <Text style={{ fontSize: '16px', color: '#7B8794' }}>
              Начните диалог о вашем опыте на сеансе
            </Text>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    backgroundColor: msg.role === 'user' ? '#4F958B' : '#ffffff',
                    color: msg.role === 'user' ? '#ffffff' : '#2C3E50',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '15px',
                    lineHeight: '1.6'
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loadingFeedback && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  color: '#7B8794',
                  fontSize: '15px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <Spin size="small" style={{ marginRight: '8px' }} />
                  Анализирую...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Поле ввода - фиксированное внизу */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: '16px 20px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <TextArea
            placeholder="Расскажите о вашем опыте на сеансе у психолога..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            onPressEnter={(e) => {
              if (e.shiftKey) return;
              e.preventDefault();
              if (!loadingFeedback && feedbackLimit.canSend && feedbackText.trim()) {
                handleFeedbackSubmit();
              }
            }}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={!feedbackLimit.canSend || loadingFeedback}
            style={{ 
              borderRadius: '20px',
              resize: 'none',
              fontSize: '15px',
              padding: '12px 16px'
            }}
          />
          <div
            onClick={() => {
              if (!loadingFeedback && feedbackLimit.canSend && feedbackText.trim()) {
                handleFeedbackSubmit();
              }
            }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: (!feedbackLimit.canSend || !feedbackText.trim()) ? '#D9D9D9' : '#4F958B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (!feedbackLimit.canSend || !feedbackText.trim() || loadingFeedback) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
          >
            <SendOutlined style={{ 
              fontSize: '20px', 
              color: 'white'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackChatPage;

