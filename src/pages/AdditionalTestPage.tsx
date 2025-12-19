import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Card, 
  Radio, 
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
  HomeOutlined 
} from '@ant-design/icons';
import { getTestConfig, TestConfig } from '../config/tests';
import { apiRequest } from '../config/api';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const AdditionalTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const navigate = useNavigate();
  
  const [config, setConfig] = useState<TestConfig | undefined>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsGenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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
  }, [testId, navigate]);

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

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (answers[currentQuestion.id] === undefined) {
      message.warning('Пожалуйста, выберите ответ');
      return;
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
    return Object.values(answers).reduce((sum, val) => sum + val, 0);
  };

  const handleSubmit = async () => {
    if (!sessionId) {
      message.error('Сессия не найдена. Пожалуйста, начните с главного теста.');
      return;
    }

    setIsGenerating(true);
    const score = calculateScore();
    
    try {
      const response = await apiRequest('api/tests/additional/save', {
          method: 'POST',
          body: JSON.stringify({
          sessionId,
          testName: config.name,
          testUrl: config.source?.url || '',
          testResult: score, // Для обратной совместимости
          answers: answers // Полные ответы в JSONB
          })
        });

      if (response.ok) {
        localStorage.removeItem(`test_progress_${testId}`);
        setIsCompleted(true);
        message.success('Результаты сохранены!');
      } else {
        throw new Error('Failed to save results');
      }
    } catch (e) {
      message.error('Ошибка при сохранении результатов');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isCompleted) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Card style={{ maxWidth: 600, width: '100%', borderRadius: 20, textAlign: 'center' }}>
            <Result
              status="success"
              title="Тест завершен!"
              subTitle={`Вы успешно прошли ${config.title}. Результаты уже доступны в вашем личном кабинете.`}
              extra={[
                <Button 
                  type="primary" 
                  key="dashboard" 
                  size="large" 
                  icon={<HomeOutlined />}
                  onClick={() => navigate(`/dashboard?sessionId=${sessionId}`)}
                  style={{ borderRadius: 12, height: 45, background: '#4F958B', borderColor: '#4F958B' }}
                >
                  Вернуться в кабинет
            </Button>
              ]}
            />
        </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '20px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            type="text"
          >
            Вернуться назад
          </Button>

          <Card style={{ borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: 30 }}>
              <Text type="secondary" style={{ fontSize: 14 }}>{config.name}</Text>
              <Title level={2} style={{ marginTop: 5, marginBottom: 20 }}>{config.title}</Title>
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
              {currentQuestion.text}
              </Paragraph>

              <Radio.Group
                onChange={(e) => handleAnswer(e.target.value)} 
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
                      {option.label}
                    </Radio.Button>
                  ))}
                </Space>
              </Radio.Group>
              </div>

            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                size="large"
                style={{ borderRadius: 12, height: 45 }}
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
                  minWidth: 150,
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
