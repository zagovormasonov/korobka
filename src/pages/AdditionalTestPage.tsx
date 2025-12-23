import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Card, 
  Radio, 
  Checkbox,
  Slider,
  Space, 
  Progress, 
  message, 
  Layout,
  Result
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  CheckOutlined,
  HomeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { getTestConfig, TestConfig } from '../config/tests';
import { Gender, getText } from '../config/tests/types';
import { apiRequest } from '../config/api';
import TestResultsModal from '../components/TestResultsModal';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const AdditionalTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<TestConfig | undefined>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [gender, setGender] = useState<Gender>('male');

  // Загрузка конфигурации и прогресса
  useEffect(() => {
    if (!testId) return;
    
    const testConfig = getTestConfig(testId);
    if (!testConfig) {
      message.error('Тест не найден');
      navigate('/dashboard');
      return;
    }
    
    setConfig(testConfig);
    
    // Восстановление прогресса
    const savedProgress = localStorage.getItem(`test_progress_${testId}`);
    if (savedProgress) {
      try {
        const { answers: savedAnswers, currentIndex } = JSON.parse(savedProgress);
        setAnswers(savedAnswers || {});
        setCurrentQuestionIndex(currentIndex || 0);
      } catch (e) {
        console.error('Failed to restore progress', e);
      }
    }
    
    // Загрузка пола пользователя
    if (sessionId && !sessionId.startsWith('test-demo-')) {
      apiRequest(`api/tests/gender/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.gender) {
            setGender(data.gender);
            console.log('👤 Пол загружен:', data.gender);
          }
        })
        .catch(err => console.error('Ошибка загрузки пола:', err));
    }
  }, [testId, navigate, sessionId]);

  // Сохранение прогресса
  useEffect(() => {
    if (!testId || Object.keys(answers).length === 0) return;
    
    localStorage.setItem(`test_progress_${testId}`, JSON.stringify({
      answers,
      currentIndex: currentQuestionIndex
    }));
  }, [answers, currentQuestionIndex, testId]);

  if (!config) return null;

  const currentQuestion = config.questions[currentQuestionIndex];
  const progress = Math.round(((currentQuestionIndex) / config.questions.length) * 100);
  const isLastQuestion = currentQuestionIndex === config.questions.length - 1;

  const handleSingleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleMultipleAnswer = (values: number[]) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: values }));
  };

  const handleSliderAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    const answer = answers[currentQuestion.id];
    
    // Проверка ответа в зависимости от типа вопроса
    if (currentQuestion.type === 'multiple') {
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        message.warning('Пожалуйста, выберите хотя бы один вариант');
        return;
      }
    } else if (currentQuestion.type === 'slider') {
      // Для слайдера ответ может быть 0, это допустимо
      if (answer === undefined) {
        message.warning('Пожалуйста, выберите значение');
        return;
      }
    } else {
      if (answer === undefined) {
        message.warning('Пожалуйста, выберите ответ');
        return;
      }
    }
    
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const calculateScore = () => {
    if (!config || !config.questions) {
      console.error('❌ [CALCULATE-SCORE] Config или questions отсутствуют');
      return 0;
    }
    
    let total = 0;
    
    for (const question of config.questions) {
      const answer = answers[question.id];
      
      if (question.type === 'multiple' && Array.isArray(answer)) {
        // Для множественного выбора суммируем все выбранные значения
        total += answer.reduce((sum, val) => sum + val, 0);
      } else if (question.type === 'slider' && typeof answer === 'number') {
        // Для слайдера используем значение напрямую
        total += answer;
      } else if (typeof answer === 'number') {
        total += answer;
      }
    }
    
    return total;
  };

  const handleSubmit = async () => {
    if (!sessionId) {
      message.error('Сессия не найдена. Пожалуйста, начните с главного теста.');
      return;
    }

    if (!config) {
      console.error('❌ [HANDLE-SUBMIT] Config отсутствует');
      message.error('Ошибка: конфигурация теста не загружена');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const score = calculateScore();
      console.log('📊 [HANDLE-SUBMIT] Рассчитанный балл:', score);
      setFinalScore(score);
    
      // Проверяем, является ли это демо-сессией (тестовая страница)
      const isDemoSession = sessionId.startsWith('test-demo-');
      
      if (isDemoSession) {
        // Для демо-сессии не отправляем на сервер, показываем результаты
        console.log('🧪 [DEMO] Демо-режим, пропускаем сохранение в БД. Результат:', score);
        localStorage.removeItem(`test_progress_${testId}`);
        
        // Сохраняем результат в localStorage для отображения на test-of-the-tests
        localStorage.setItem(`demo_test_result_${testId}`, JSON.stringify({
          testId,
          testName: config.name,
          score,
          timestamp: new Date().toISOString()
        }));
        
        setIsCompleted(true);
        setShowResultsModal(true); // Сразу показываем модалку с результатами
        setIsSubmitting(false);
        return;
      }
      
      const response = await apiRequest('api/tests/additional/save', {
          method: 'POST',
          body: JSON.stringify({
          sessionId,
          testName: config.id, // Используем config.id вместо config.name для правильного сопоставления
          testUrl: config.source?.url || '',
          testResult: score,
          answers: answers
          })
        });

      if (response.ok) {
        localStorage.removeItem(`test_progress_${testId}`);
        setIsCompleted(true);
        setShowResultsModal(true); // Показываем модалку с результатами
        
        // Сохраняем флаг обновления результатов для синхронизации с dashboard
        localStorage.setItem('test_results_updated', Date.now().toString());
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [HANDLE-SUBMIT] Ошибка ответа сервера:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to save results');
      }
    } catch (e) {
      console.error('❌ [HANDLE-SUBMIT] Ошибка при сохранении результатов:', e);
      message.error('Ошибка при сохранении результатов');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Рендер вопроса в зависимости от типа
  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'slider':
        const sliderMin = currentQuestion.min ?? 0;
        const sliderMax = currentQuestion.max ?? 10;
        const sliderStep = currentQuestion.step ?? 1;
        const sliderValue = typeof answers[currentQuestion.id] === 'number' 
          ? answers[currentQuestion.id] as number 
          : sliderMin;
        
        // Создаем marks из опций если они есть
        const marks: Record<number, string> = {};
        if (currentQuestion.options.length > 0) {
          currentQuestion.options.forEach(opt => {
            marks[opt.value] = getText(opt.label, gender);
          });
        } else {
          marks[sliderMin] = String(sliderMin);
          marks[sliderMax] = String(sliderMax);
        }
        
    return (
          <div style={{ padding: '20px 10px' }}>
            <Slider
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={sliderValue}
              onChange={handleSliderAnswer}
              marks={marks}
              tooltip={{ formatter: (val) => marks[val as number] || String(val) }}
            />
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Text strong style={{ fontSize: 18 }}>
                {marks[sliderValue] || sliderValue}
              </Text>
          </div>
      </div>
    );

      case 'multiple':
        const selectedValues = Array.isArray(answers[currentQuestion.id]) 
          ? answers[currentQuestion.id] as number[] 
          : [];

  return (
          <Checkbox.Group
            value={selectedValues}
            onChange={(values) => handleMultipleAnswer(values as number[])}
            style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
              {currentQuestion.options.map(option => (
                <Checkbox
                  key={option.value}
                  value={option.value}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 12,
                    marginBottom: 10,
                    background: selectedValues.includes(option.value) ? '#f0f9f7' : 'white'
                  }}
                >
                  {getText(option.label, gender)}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
        );
        
      case 'single':
      default:
        return (
          <Radio.Group
            onChange={(e) => handleSingleAnswer(e.target.value)} 
            value={answers[currentQuestion.id]}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {currentQuestion.options.map(option => (
                <Radio.Button 
                  key={option.value} 
                  value={option.value}
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    padding: '12px 20px', 
                    borderRadius: 12,
                    marginBottom: 10,
                    textAlign: 'left',
                    whiteSpace: 'normal'
                  }}
                >
                  {getText(option.label, gender)}
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        );
    }
  };

  if (isCompleted) {
    if (!config) {
      console.error('❌ [RENDER] Config отсутствует при isCompleted=true');
      return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
          <Content style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Card style={{ maxWidth: 600, width: '100%', borderRadius: 20, textAlign: 'center' }}>
              <Result
                status="error"
                title="Ошибка"
                subTitle="Конфигурация теста не загружена. Пожалуйста, попробуйте перезагрузить страницу."
                extra={
                  <Button type="primary" onClick={() => window.location.reload()}>
                    Перезагрузить страницу
                  </Button>
                }
              />
            </Card>
          </Content>
        </Layout>
      );
    }
    
    const isDemoSession = sessionId?.startsWith('test-demo-');
    
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ maxWidth: 600, width: '100%', borderRadius: 20, textAlign: 'center' }}>
            <Result
              status="success"
              title="Тест завершён!"
              subTitle={
                isDemoSession 
                  ? `Результат: ${finalScore} баллов. Это демо-режим.`
                  : `Результаты сохранены в вашем личном кабинете.`
              }
              extra={
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    size="large" 
                    onClick={() => setShowResultsModal(true)}
                    style={{ 
                      borderRadius: 12, 
                      height: 50, 
                      width: '100%',
                      background: '#4F958B', 
                      borderColor: '#4F958B',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    📊 Результаты
                  </Button>
                  <Button 
                    size="large" 
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      setAnswers({});
                      setCurrentQuestionIndex(0);
                      setIsCompleted(false);
                      setShowResultsModal(false);
                    }}
                    style={{ borderRadius: 12, height: 45, width: '100%' }}
                  >
                    Пройти заново
                  </Button>
                  <Button 
                    size="large" 
                    icon={<HomeOutlined />}
                    onClick={() => {
                      // Устанавливаем флаг обновления перед навигацией
                      if (!isDemoSession) {
                        localStorage.setItem('test_results_updated', Date.now().toString());
                        console.log('🔄 [TEST-PAGE] Установлен флаг test_results_updated перед переходом в кабинет');
                        // Добавляем параметр refresh для принудительной перезагрузки
                        navigate(`/dashboard?sessionId=${sessionId}&refresh=true`);
                      } else {
                        navigate('/test-of-the-tests');
                      }
                    }}
                    style={{ borderRadius: 12, height: 45, width: '100%' }}
                  >
                    {isDemoSession ? 'К списку тестов' : 'В кабинет'}
                  </Button>
                </Space>
              }
            />
          </Card>
        </Content>
        
        {/* Модалка с результатами */}
        {config && (
          <TestResultsModal
            visible={showResultsModal}
            onCancel={() => setShowResultsModal(false)}
            config={config}
            score={finalScore}
            onRetry={() => {
              setShowResultsModal(false);
              setAnswers({});
              setCurrentQuestionIndex(0);
              setIsCompleted(false);
            }}
          />
        )}
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '20px', maxWidth: 800, margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            type="text"
          >
            Вернуться назад
          </Button>

          <Card style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: 30 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>{config.name}</Text>
              <Title level={2} style={{ marginTop: 5, marginBottom: 20 }}>{config.title}</Title>
              
              {/* Показываем описание теста только на первом вопросе */}
              {currentQuestionIndex === 0 && config.description && (
                <div style={{ 
                  marginBottom: 20, 
                  padding: '15px', 
                  backgroundColor: '#f0f9f7', 
                  borderRadius: 12,
                  border: '1px solid #4F958B30'
                }}>
                  <Paragraph style={{ margin: 0, fontSize: 14, color: '#2C3E50', lineHeight: 1.6 }}>
                    {getText(config.description, gender)}
                  </Paragraph>
                </div>
              )}
              
              <Progress 
                percent={progress} 
                strokeColor="#4F958B" 
                showInfo={false} 
                style={{ marginBottom: 10 }}
              />
              <Text type="secondary">Вопрос {currentQuestionIndex + 1} из {config.questions.length}</Text>
                </div>

            <div style={{ minHeight: 200 }}>
              <Paragraph style={{ fontSize: 18, fontWeight: 500, marginBottom: 30 }}>
                {getText(currentQuestion.text, gender)}
              </Paragraph>

              {renderQuestion()}
              </div>

            <div style={{ marginTop: 40, display: 'flex', gap: '15px', width: '100%', boxSizing: 'border-box' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                size="large"
                style={{ borderRadius: 12, height: 45, flex: 1, minWidth: 0 }}
              >
                Назад
              </Button>
              <Button
                type="primary"
                onClick={handleNext}
                loading={isSubmitting}
                size="large"
                style={{ 
                  borderRadius: 12, 
                  height: 45, 
                  flex: 1,
                  minWidth: 0,
                  background: '#4F958B', 
                  borderColor: '#4F958B' 
                }}
                icon={isLastQuestion ? <CheckOutlined /> : <ArrowRightOutlined />}
              >
                {isLastQuestion ? 'Завершить' : 'Далее'}
              </Button>
            </div>
      </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default AdditionalTestPage;
