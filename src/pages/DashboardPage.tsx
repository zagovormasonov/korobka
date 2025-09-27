import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Space, 
  Input, 
  Form, 
  message, 
  Modal,
  Spin
} from 'antd'; 
import { apiRequest } from '../config/api'; 
import { 
  DownloadOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const recommendedTests = [
  {
    id: 1,
    name: 'Тест на пограничное расстройство личности (ПРЛ)',
    url: 'https://yasno.live/tests/pogranichnoye-rasstroystvo-lichnosti',
    description: 'Скрининг симптомов ПРЛ на основе DSM-5'
  },
  {
    id: 2,
    name: 'Тест на биполярное аффективное расстройство (БАР)',
    url: 'https://iyaroslav.ru/test/test-na-gipomaniu-bipolarnoe-rasstroystvo/',
    description: 'Опросник HCL-32 для выявления гипоманиакальных состояний'
  },
  {
    id: 3,
    name: 'Тест на синдром дефицита внимания и гиперактивности (СДВГ)',
    url: 'https://yasno.live/tests/sdvg',
    description: 'Шкала ASRS для взрослых'
  },
  {
    id: 4,
    name: 'Тест на посттравматическое стрессовое расстройство (ПТСР)',
    url: 'https://yasno.live/tests/ptsr',
    description: 'PCL-5 для скрининга симптомов ПТСР'
  },
  {
    id: 5,
    name: 'Тест на депрессию',
    url: 'https://psi-praktika.ru/testyi/test-beka-na-depressiyu.html',
    description: 'Шкала Бека (BDI) для измерения тяжести депрессивных симптомов'
  },
  {
    id: 6,
    name: 'Тест на генерализованное тревожное расстройство',
    url: 'https://psytests.org/anxiety/gad7.html',
    description: 'GAD-7 для скрининга общей тревоги и беспокойства'
  }
];

const DashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionId] = useState(() => searchParams.get('sessionId') || '');
  const [mascotMessage, setMascotMessage] = useState('');
  const [psychologistForm] = Form.useForm();
  const [feedbackText, setFeedbackText] = useState('');
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [testResults, setTestResults] = useState<{[key: number]: string}>({});
  const [savingResults, setSavingResults] = useState<{[key: number]: boolean}>({});
  
  // Состояния загрузки для AI операций
  const [loadingMascotMessage, setLoadingMascotMessage] = useState(false);
  const [loadingPersonalPlan, setLoadingPersonalPlan] = useState(false);
  const [loadingSessionPreparation, setLoadingSessionPreparation] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  
  // Состояния для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<number | null>(null);
  const [modalText, setModalText] = useState('');
  
  // Состояние режима персонального плана
  const [personalPlanMode, setPersonalPlanMode] = useState(false);

  useEffect(() => {
    if (sessionId) {
      generateMascotMessage();
      fetchAdditionalTestResults();
      
      // Проверяем, пришел ли пользователь после успешной оплаты
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        message.success('🎉 Оплата прошла успешно! Добро пожаловать в личный кабинет!');
        // Убираем параметр из URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // Если sessionId отсутствует, показываем предупреждение
      message.warning('⚠️ Для доступа к личному кабинету необходимо пройти тест. Перейдите на главную страницу.');
    }
  }, [sessionId]);

  const generateMascotMessage = async () => {
    try {
      // Проверяем, что sessionId существует
      if (!sessionId || sessionId.trim() === '') {
        console.log('❌ SessionId пустой, пропускаем генерацию сообщения маскота');
        setMascotMessage('Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.');
        return;
      }

      setLoadingMascotMessage(true);
      console.log('🤖 Запрос на генерацию сообщения маскота для dashboard:', { sessionId });
      
      const response = await apiRequest('api/ai/mascot-message/dashboard', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      console.log('📥 Ответ от API:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Данные ответа:', data);
        setMascotMessage(data.message);
      } else {
        console.error('❌ Ошибка API:', response.status);
        const errorText = await response.text();
        console.error('❌ Ответ сервера:', errorText);
        setMascotMessage('Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.');
      }
    } catch (error) {
      console.error('❌ Ошибка при генерации сообщения маскота:', error);
      setMascotMessage('Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.');
    } finally {
      setLoadingMascotMessage(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 [LOGOUT] Выход из ЛК');
    message.success('Вы вышли из личного кабинета');
    navigate('/', { replace: true });
  };

  const fetchAdditionalTestResults = async () => {
    try {
      console.log('🔄 [FETCH RESULTS] Начинаем загрузку результатов дополнительных тестов');
      console.log('🔄 [FETCH RESULTS] Текущее состояние testResults:', testResults);
      
      // Проверяем, что sessionId существует
      if (!sessionId || sessionId.trim() === '') {
        console.log('❌ SessionId пустой, пропускаем загрузку результатов');
        return;
      }

      // Сначала получаем email пользователя из primary test results
      const primaryResponse = await apiRequest(`api/tests/primary/${sessionId}`);
      const primaryData = await primaryResponse.json();
      
      if (!primaryData.success || !primaryData.data?.email) {
        console.error('❌ Не удалось получить email пользователя');
        return;
      }
      
      const userEmail = primaryData.data.email;
      console.log('📧 Email пользователя для загрузки результатов:', userEmail);
      
      // Загружаем результаты дополнительных тестов по sessionId
      const response = await apiRequest(`api/tests/additional/results/${sessionId}`);
      
      if (!response.ok) {
        console.error('❌ Ошибка HTTP:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Ответ сервера:', errorText);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setAllTestsCompleted(data.results.length >= recommendedTests.length);
        // Загружаем существующие результаты
        const resultsMap: {[key: number]: string} = {};
        data.results.forEach((result: any) => {
          const test = recommendedTests.find(t => t.name === result.test_type);
          if (test) {
            resultsMap[test.id] = result.answers;
          }
        });
        setTestResults(resultsMap);
        console.log('📊 [FETCH RESULTS] Загружено результатов дополнительных тестов:', data.results.length);
        console.log('📊 [FETCH RESULTS] Новое состояние testResults:', resultsMap);
        console.log('📊 [FETCH RESULTS] Данные из API:', data.results);
      }
    } catch (error) {
      console.error('Error fetching additional test results:', error);
    }
  };

  // Функции для модального окна
  const openModal = (testId: number) => {
    setCurrentTestId(testId);
    setModalText(testResults[testId] || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentTestId(null);
    setModalText('');
  };

  const saveModalResult = async () => {
    if (!currentTestId || !modalText.trim()) {
      message.warning('Пожалуйста, введите результат теста');
      return;
    }

    // Обновляем локальное состояние
    setTestResults(prev => ({
      ...prev,
      [currentTestId]: modalText.trim()
    }));

    // Сохраняем в БД
    await saveTestResult(currentTestId, modalText.trim());
    
    // Закрываем модальное окно
    closeModal();
  };

  // Функция для обрезки текста
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const saveTestResult = async (testId: number, result: string) => {
    if (!result.trim()) {
      message.warning('Пожалуйста, введите результат теста');
      return;
    }

    // Проверяем, что sessionId существует
    if (!sessionId || sessionId.trim() === '') {
      message.error('Ошибка: не найден идентификатор сессии. Пожалуйста, пройдите тест заново.');
      return;
    }

    setSavingResults(prev => ({ ...prev, [testId]: true }));
    try {
      const test = recommendedTests.find(t => t.id === testId);
      if (!test) return;

      const response = await apiRequest('api/tests/additional/save-result', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          testName: test.name,
          testUrl: test.url,
          testResult: result.trim()
        }),
      });

      if (response.ok) {
        message.success('Результат теста сохранен!');
        // Сначала обновляем локальное состояние немедленно
        setTestResults(prev => ({ ...prev, [testId]: result.trim() }));
        
        // Затем через небольшую задержку загружаем данные с сервера для синхронизации
        setTimeout(() => {
        fetchAdditionalTestResults();
        }, 1000);
      } else {
        message.error('Ошибка при сохранении результата');
      }
    } catch (error) {
      console.error('Error saving test result:', error);
      message.error('Произошла ошибка при сохранении результата');
    } finally {
      setSavingResults(prev => ({ ...prev, [testId]: false }));
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
          feedbackText: feedbackText
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Показываем результат анализа в новом окне
        const analysisHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Анализ обратной связи</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 40px;
                color: #333;
                max-width: 800px;
                margin: 40px auto;
              }
              h1 {
                color: #00695c;
                border-bottom: 2px solid #00695c;
                padding-bottom: 10px;
              }
              h2 {
                color: #52c41a;
                margin-top: 30px;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
              }
              .content {
                max-width: 800px;
                margin: 0 auto;
              }
              .print-button {
                background: #00695c;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="content">
              <div class="header">
                <h1>Анализ вашей обратной связи</h1>
                <p>Персонализированный анализ сеанса</p>
                <button class="print-button" onclick="window.print()">Печать</button>
              </div>
              
              <div class="analysis-content">
                ${data.analysis.replace(/\n/g, '<br>')}
              </div>
            </div>
          </body>
          </html>
        `;
        
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(analysisHtml);
          newWindow.document.close();
        }
        
        message.success('Анализ обратной связи готов!');
        setFeedbackText('');
      } else {
        message.error('Ошибка при обработке обратной связи');
      }
    } catch (error) {
      console.error('Error processing feedback:', error);
      message.error('Произошла ошибка при обработке обратной связи');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const downloadPersonalPlan = async () => {
    setLoadingPersonalPlan(true);
    try {
      const response = await apiRequest('api/pdf/personal-plan', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        // Получаем HTML как текст
        const html = await response.text();
        
        // Создаем Blob из HTML
        const blob = new Blob([html], { type: 'text/html' });
        
        // Создаем временную ссылку для скачивания
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'personal-plan.html'; // Указываем имя файла и расширение
        
        // Симулируем клик для начала скачивания
        document.body.appendChild(link);
        link.click();
        
        // Очищаем
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        message.success('Персональный план скачан! Откройте файл personal-plan.html в вашем браузере.');
        
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
        message.success(`Подготовка к сеансу скачана! Откройте файл ${link.download} в вашем браузере.`);
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

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      {/* Header with Exit button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginBottom: '20px',
        maxWidth: '800px',
        margin: '0 auto 20px auto'
      }}>
        <Button 
          type="text" 
          onClick={handleLogout}
          style={{ 
            color: '#8B5A3C',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Выйти
        </Button>
      </div>

      {/* Main container */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        
        {/* Mascot section */}
        <div style={{ marginBottom: '60px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5A3C 0%, #D4A574 100%)',
            margin: '0 auto 30px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(139, 90, 60, 0.3)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src="/mascot.png"  
                alt="Луми" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'contain',
                  filter: 'brightness(1.2)'
                }}
              />
            </div>
          </div>
          
          <Title level={2} style={{ 
            color: '#2C3E50',
            fontSize: '32px',
            fontWeight: '600',
            marginBottom: '10px',
            margin: '0 0 10px 0'
          }}>
            Луми
          </Title>
          
          <Text style={{ 
            color: '#7B8794',
            fontSize: '18px',
            display: 'block',
            marginBottom: '30px'
          }}>
            Ваш AI компаньон
          </Text>

          {/* Mascot message */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '25px 30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            {loadingMascotMessage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                <Spin size="small" />
                <Text style={{ color: '#7B8794', fontSize: '16px' }}>
                  Луми анализирует твой тест...
                </Text>
              </div>
            ) : (
              <Text style={{ 
                color: '#2C3E50', 
                fontSize: '16px', 
                lineHeight: '1.6',
                display: 'block'
              }}>
                {mascotMessage || 'Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.'}
              </Text>
            )}
          </div>
        </div>

        {!personalPlanMode ? (
          <div>
            {/* Section title */}
            <Title level={3} style={{ 
              color: '#2C3E50',
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '40px',
              textAlign: 'center'
            }}>
              Рекомендуемые тесты
            </Title>

            {allTestsCompleted && (
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '40px', 
                padding: '40px 30px',
                backgroundColor: 'white',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
              }}>
                <CheckOutlined 
                  style={{ 
                    fontSize: '60px', 
                    color: '#52C41A', 
                    marginBottom: '20px',
                    display: 'block'
                  }} 
                />
                <Title level={2} style={{ 
                  color: '#2C3E50', 
                  marginBottom: '20px', 
                  margin: '0 0 20px 0',
                  fontSize: '24px'
                }}>
                  Все тесты пройдены!
                </Title>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => setPersonalPlanMode(true)}
                  style={{
                    height: '50px',
                    fontSize: '16px',
                    fontWeight: '600',
                    padding: '0 30px',
                    marginTop: '20px',
                    borderRadius: '25px',
                    backgroundColor: '#8B5A3C',
                    borderColor: '#8B5A3C'
                  }}
                >
                  Перейти к персональному плану
                </Button>
              </div>
            )}
            
            {/* Tests grid */}
            {!allTestsCompleted && (
              <>
                <div style={{ 
                  marginBottom: '30px', 
                  padding: '20px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                  borderRadius: '15px',
                  textAlign: 'center'
                }}>
                  <Text style={{ 
                    color: '#7B8794', 
                    fontSize: '16px', 
                    fontWeight: '500',
                    lineHeight: '1.5'
                  }}>
                    Перейди по ссылке каждого теста, пройди тест и впиши результаты в поле ввода результатов
                  </Text>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                  gap: '20px',
                  marginBottom: '40px'
                }}>
                  {recommendedTests.map((test) => (
                    <div 
                      key={test.id}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        padding: '25px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '20px' }}>
                        {/* Status indicator */}
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: testResults[test.id] ? '#52C41A' : '#E8E8E8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {testResults[test.id] && (
                            <CheckOutlined 
                              style={{ 
                                fontSize: '10px',
                                color: 'white'
                              }} 
                            />
                          )}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <Title level={5} style={{ 
                            color: '#2C3E50', 
                            marginBottom: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            lineHeight: '1.4'
                          }}>
                            {test.name.replace('Тест на ', '')}
                          </Title>
                          <Text style={{ 
                            color: '#7B8794', 
                            fontSize: '14px', 
                            display: 'block',
                            lineHeight: '1.4'
                          }}>
                            {test.description}
                          </Text>
                        </div>
                      </div>
                      
                      {/* Test result display */}
                      {testResults[test.id] && (
                        <div style={{ 
                          padding: '12px 16px', 
                          backgroundColor: '#F8F9FA', 
                          borderRadius: '12px',
                          marginBottom: '15px'
                        }}>
                          <Text style={{ 
                            fontSize: '14px', 
                            color: '#2C3E50',
                            lineHeight: '1.4'
                          }}>
                            {truncateText(testResults[test.id])}
                          </Text>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                          href={test.url}
                          target="_blank"
                          style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '20px',
                            backgroundColor: '#E8F4FD',
                            borderColor: '#E8F4FD',
                            color: '#1890FF',
                            fontWeight: '500'
                          }}
                        >
                          Пройти тест
                        </Button>
                        <Button
                          type="primary"
                          onClick={() => openModal(test.id)}
                          style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '20px',
                            backgroundColor: '#8B5A3C',
                            borderColor: '#8B5A3C',
                            fontWeight: '500'
                          }}
                        >
                          {testResults[test.id] ? 'Изменить' : 'Ввести результат'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <Title level={3} style={{ 
                color: '#2C3E50', 
                marginBottom: '20px',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                Персональный план
              </Title>
              <Button 
                type="text" 
                onClick={() => setPersonalPlanMode(false)}
                style={{ 
                  color: '#8B5A3C',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                ← Вернуться к тестам
              </Button>
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
                    backgroundColor: '#8B5A3C',
                    borderColor: '#8B5A3C',
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
                      backgroundColor: '#8B5A3C',
                      borderColor: '#8B5A3C',
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
                  <FileTextOutlined style={{ fontSize: '24px', color: '#52C41A' }} />
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
                    backgroundColor: '#8B5A3C',
                    borderColor: '#8B5A3C',
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
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackText(e.target.value)}
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
                      backgroundColor: '#8B5A3C',
                      borderColor: '#8B5A3C',
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
        )}


        {/* Модальное окно для ввода результата теста */}
        <Modal
          title={
            <span style={{ 
              color: '#2C3E50', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              Ввести результат теста
            </span>
          }
          open={modalVisible}
          onCancel={closeModal}
          footer={[
            <Button 
              key="cancel" 
              onClick={closeModal}
              style={{
                borderRadius: '20px',
                height: '40px',
                fontWeight: '500'
              }}
            >
              Отмена
            </Button>,
            <Button 
              key="save" 
              type="primary" 
              onClick={saveModalResult}
              loading={currentTestId ? savingResults[currentTestId] : false}
              disabled={!modalText.trim()}
              style={{
                borderRadius: '20px',
                height: '40px',
                backgroundColor: '#8B5A3C',
                borderColor: '#8B5A3C',
                fontWeight: '500'
              }}
            >
              Сохранить
            </Button>
          ]}
          width={600}
          centered
          styles={{
            content: {
              borderRadius: '20px',
              padding: '30px'
            }
          }}
        >
          <Space direction="vertical" style={{ width: '100%', marginTop: '20px' }}>
            <Text style={{ 
              color: '#7B8794',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Введите результат теста (например: "46 баллов по Беку, выраженная депрессия")
            </Text>
            <Input.TextArea
              placeholder="Введите результат теста..."
              value={modalText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setModalText(e.target.value)}
              rows={6}
              maxLength={500}
              showCount
              style={{
                borderRadius: '12px',
                resize: 'none'
              }}
            />
          </Space>
        </Modal>
      </div>
    </div>
  );
};

export default DashboardPage;