import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Card, 
  Button, 
  Space, 
  Input, 
  Form, 
  message, 
  Row, 
  Col,
  Divider,
  Modal,
  Spin
} from 'antd'; 
import { apiRequest } from '../config/api'; 
import { 
  DownloadOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  CheckOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
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
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px' 
      }}>
        <div style={{ flex: 1 }}></div>
        <Title level={1} style={{ color: '#00695C', margin: 0, flex: 1, textAlign: 'center' }}>
          Личный кабинет
        </Title>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="default" 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ 
              borderColor: '#ff4d4f',
              color: '#ff4d4f'
            }}
          >
            Выйти
          </Button>
        </div>
      </div>

      <Card 
        style={{ 
          marginBottom: '40px', 
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <img 
            src="/mascot.png"  
            alt="Луми" 
            style={{ width: '60px', height: '60px', flexShrink: 0, objectFit: 'contain' }}
          />
          <div style={{ flex: 1 }}>
            {loadingMascotMessage ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Spin size="small" />
                <Text style={{ color: '#00695C', fontSize: '16px' }}>
                  Луми анализирует твой тест...
                </Text>
              </div>
            ) : (
              <Paragraph style={{ margin: 0, fontSize: '16px', lineHeight: '1.6' }}>
                {mascotMessage || 'Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.'}
              </Paragraph>
            )}
          </div>
        </div>
      </Card>

      {!personalPlanMode ? (
      <Card title="Рекомендуемые тесты" style={{ marginBottom: '40px' }}>
          {allTestsCompleted && (
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '30px', 
              padding: '30px 16px',
              backgroundColor: '#f6ffed',
              borderRadius: '8px',
              border: '2px solid #00695c'
            }}>
              <CheckOutlined 
                style={{ 
                  fontSize: '80px', 
                  color: '#00695c', 
                  marginBottom: '20px',
                  display: 'block'
                }} 
              />
              <Title level={2} style={{ color: '#00695c', marginBottom: '20px', margin: 0 }}>
                Все тесты пройдены!
              </Title>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setPersonalPlanMode(true)}
                style={{
                  height: '50px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '25px',
                  marginTop: '20px'
                }}
              >
                Перейти к персональному плану
              </Button>
            </div>
          )}
          
          {/* Показываем блоки тестов только если не все тесты пройдены */}
          {!allTestsCompleted && (
            <>
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
          <Text style={{ color: '#00695C', fontSize: '16px', fontWeight: '500' }}>
            Перейди по ссылке каждого теста, пройди тест и впиши результаты в поле ввода результатов
          </Text>
        </div>
        
        <Row gutter={[16, 16]}>
          {recommendedTests.map((test) => (
            <Col xs={24} md={12} key={test.id}>
              <Card 
                size="small" 
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Button 
                    type="link" 
                    href={test.url} 
                    target="_blank"
                    style={{ color: '#00695C' }}
                  >
                    Пройти тест
                  </Button>
                ]}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Кружочек со статусом теста */}
                  <div 
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                            border: `2px solid ${testResults[test.id] ? '#00695c' : '#d9d9d9'}`,
                            backgroundColor: testResults[test.id] ? '#00695c' : 'transparent',
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
                          fontSize: '12px',
                          color: 'white'
                        }} 
                      />
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <Title level={5} style={{ color: '#00695C', marginBottom: '8px' }}>
                      {test.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '14px', marginBottom: '16px', display: 'block' }}>
                      {test.description}
                    </Text>
                    
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {/* Отображение результата (обрезанный текст) */}
                      {testResults[test.id] && (
                        <div style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f6ffed', 
                          border: '1px solid #b7eb8f', 
                          borderRadius: '6px',
                          marginBottom: '8px'
                        }}>
                          <Text style={{ fontSize: '14px', color: '#00695C' }}>
                            {truncateText(testResults[test.id])}
                          </Text>
                        </div>
                      )}
                      
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => openModal(test.id)}
                        style={{ width: '100%', padding: '30px 16px' }}
                      >
                        {testResults[test.id] ? 'Изменить результат' : 'Ввести результат'}
                      </Button>
                    </Space>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
            </>
          )}
      </Card>
      ) : (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Title level={2} style={{ color: '#00695c', marginBottom: '10px' }}>
              Персональный план
            </Title>
            <Button 
              type="default" 
              onClick={() => setPersonalPlanMode(false)}
              style={{ marginBottom: '20px', padding: '30px 20px' }}
            >
              ← Вернуться к тестам
            </Button>
          </div>
          
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card 
                title="Скачать персональный план"
                extra={<DownloadOutlined style={{ color: '#00695C' }} />}
                hoverable
                style={{ height: '100%' }}
              >
                <Paragraph>
                  Скачай персональный план, созданный на основе всех твоих тестов
                </Paragraph>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={downloadPersonalPlan}
                  loading={loadingPersonalPlan}
                  style={{ width: '100%', padding: '30px 16px' }}
                >
                  {loadingPersonalPlan ? 'Генерируем план...' : 'Скачать персональный план'}
                </Button>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card 
                title="Подбор психолога"
                extra={<UserOutlined style={{ color: '#00695C' }} />}
                hoverable
                style={{ height: '100%' }}
              >
                <Form
                  form={psychologistForm}
                  onFinish={handlePsychologistRequest}
                  layout="vertical"
                >
                  <Form.Item
                    name="name"
                    label="Имя"
                    rules={[{ required: true, message: 'Введите ваше имя' }]}
                  >
                    <Input placeholder="Ваше имя" />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    label="Телефон"
                    rules={[{ required: true, message: 'Введите номер телефона' }]}
                  >
                    <Input placeholder="+7 (999) 123-45-67" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Введите email' },
                      { type: 'email', message: 'Введите корректный email' }
                    ]}
                  >
                    <Input placeholder="example@email.com" />
                  </Form.Item>
                  <Form.Item
                    name="telegramUsername"
                    label="Telegram (необязательно)"
                  >
                    <Input placeholder="username или @username" />
                  </Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    style={{ width: '100%', padding: '30px 16px' }}
                  >
                    Оставить заявку
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card 
                title="Подготовка к сеансу"
                extra={<FileTextOutlined style={{ color: '#00695C' }} />}
                hoverable
                style={{ height: '100%' }}
              >
                <Paragraph>
                  PDF с рекомендациями для психолога и психиатра
                </Paragraph>
                 <Button 
                   type="primary" 
                   icon={<DownloadOutlined />}
                   onClick={() => downloadSessionPreparation('psychologist')}
                   loading={loadingSessionPreparation}
                   style={{ width: '100%', padding: '30px 16px' }}
                 >
                   {loadingSessionPreparation ? 'Генерируем подготовку...' : 'Скачать подготовку к сеансу'}
                 </Button>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card 
                title="Обратная связь"
                extra={<MessageOutlined style={{ color: '#00695C' }} />}
                hoverable
                style={{ height: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <TextArea
                    placeholder="Расскажите о вашем опыте на сеансе у психолога..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleFeedbackSubmit}
                    loading={loadingFeedback}
                    style={{ width: '100%', padding: '30px 16px' }}
                  >
                    {loadingFeedback ? 'Анализируем обратную связь...' : 'Получить обратную связь'}
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      )}


      {/* Модальное окно для ввода результата теста */}
      <Modal
        title="Ввести результат теста"
        open={modalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Отмена
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={saveModalResult}
            loading={currentTestId ? savingResults[currentTestId] : false}
            disabled={!modalText.trim()}
          >
            Сохранить
          </Button>
        ]}
        width={600}
        style={{ marginTop: '20px', marginBottom: '20px' }}
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: '16px', marginBottom: '16px' }}>
          <Text type="secondary">
            Введите результат теста (например: "46 баллов по Беку, выраженная депрессия")
          </Text>
          <Input.TextArea
            placeholder="Введите результат теста..."
            value={modalText}
            onChange={(e) => setModalText(e.target.value)}
            rows={6}
            maxLength={500}
            showCount
          />
        </Space>
      </Modal>
    </div>
  );
};

export default DashboardPage;