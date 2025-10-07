import React, { useState, useEffect } from 'react';
import { Button, Typography, Progress, Card, Input, Slider, Space, Checkbox, InputNumber, message } from 'antd';
import { apiRequest } from '../config/api';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Question {
  id: number;
  text: string;
  type: string;
  scale?: {
    min: number;
    max: number;
    labels: {
      min: string;
      max: string;
    };
  };
  placeholder?: string;
  options?: string[] | { value: string; label: string }[];
}

interface Answer {
  questionId: number;
  answer: string | number;
  additionalText?: string;
}

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  
  // Восстанавливаем sessionId из localStorage или создаём новый
  const [sessionId] = useState(() => {
    const savedData = localStorage.getItem('testProgress');
    if (savedData) {
      try {
        const testData = JSON.parse(savedData);
        if (testData.sessionId) {
          console.log('🔄 Восстановлен sessionId из localStorage:', testData.sessionId);
          return testData.sessionId;
        }
      } catch (error) {
        console.error('Ошибка восстановления sessionId:', error);
      }
    }
    const newSessionId = searchParams.get('sessionId') || uuidv4();
    console.log('🆕 Создан новый sessionId:', newSessionId);
    return newSessionId;
  });
  
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [additionalText, setAdditionalText] = useState<string>('');
  const [sliderValue, setSliderValue] = useState<number>(5);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Функции для работы с localStorage
  const saveToLocalStorage = () => {
    const testData = {
      sessionId,
      currentQuestionIndex,
      answers,
      currentAnswer,
      additionalText,
      sliderValue,
      selectedOptions
    };
    localStorage.setItem('testProgress', JSON.stringify(testData));
  };

  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('testProgress');
    if (savedData) {
      try {
        const testData = JSON.parse(savedData);
        // Не проверяем sessionId, так как он уже восстановлен из того же хранилища
        setCurrentQuestionIndex(testData.currentQuestionIndex || 0);
        setAnswers(testData.answers || []);
        setCurrentAnswer(testData.currentAnswer || '');
        setAdditionalText(testData.additionalText || '');
        setSliderValue(testData.sliderValue || 5);
        setSelectedOptions(testData.selectedOptions || []);
        
        // Показываем уведомление о восстановлении
        if (testData.currentQuestionIndex > 0 || testData.answers.length > 0) {
          console.log('📱 Восстановлен прогресс теста из localStorage');
          message.success({
            content: `Восстановлен прогресс теста! Вопрос ${testData.currentQuestionIndex + 1}, сохранённых ответов: ${testData.answers.length}`,
            duration: 3,
          });
        }
        return true;
      } catch (error) {
        console.error('Ошибка при загрузке данных из localStorage:', error);
      }
    }
    return false;
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('testProgress');
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Автоматическое сохранение при изменении состояния
  useEffect(() => {
    if (questions.length > 0) {
      saveToLocalStorage();
    }
  }, [currentQuestionIndex, answers, currentAnswer, additionalText, sliderValue, selectedOptions]);

  const fetchQuestions = async () => {
    try {
       const response = await apiRequest('api/tests/primary/questions');
      const data = await response.json();
      console.log('📋 Загружено вопросов:', data.length);
      console.log('📋 Последний вопрос:', data[data.length - 1]);
      setQuestions(data);
      
      // Загружаем сохраненные данные после получения вопросов
      setTimeout(() => {
        loadFromLocalStorage();
      }, 100);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleAnswer = (answer: string) => {
    setCurrentAnswer(answer);
    // Если это вопрос с шкалой и выбран "Да", устанавливаем значение шкалы
    if (answer === 'yes' && questions[currentQuestionIndex]?.type === 'yes_no_scale') {
      setSliderValue(5);
      // Для yes_no_scale при выборе "Да" не меняем currentAnswer, 
      // значение шкалы будет установлено при движении ползунка
    }
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    setCurrentAnswer(value.toString());
  };

  const handleMultiSelect = (checkedValues: string[]) => {
    setSelectedOptions(checkedValues);
    setCurrentAnswer(checkedValues.join(', '));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      saveCurrentAnswer();
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetCurrentState();
    } else {
      // Сохраняем текущий ответ перед завершением
      saveCurrentAnswer();
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      saveCurrentAnswer();
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      resetCurrentState();
    }
  };

  const saveCurrentAnswer = () => {
    if (currentAnswer) {
      const currentQuestion = questions[currentQuestionIndex];
      let answerToSave = currentAnswer;
      
      // Для вопросов с шкалой, если значение числовое, это значение шкалы
      if (currentQuestion.type === 'yes_no_scale' && !isNaN(Number(currentAnswer))) {
        answerToSave = currentAnswer; // Уже числовое значение шкалы
      }
      
      // Для email вопроса сохраняем ответ как есть
      if (currentQuestion.type === 'email') {
        answerToSave = currentAnswer;
      }
      
      const newAnswer: Answer = {
        questionId: currentQuestion.id,
        answer: answerToSave,
        additionalText: additionalText || undefined
      };
      
      const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQuestion.id);
      if (existingAnswerIndex >= 0) {
        const updatedAnswers = [...answers];
        updatedAnswers[existingAnswerIndex] = newAnswer;
        setAnswers(updatedAnswers);
      } else {
        setAnswers([...answers, newAnswer]);
      }
    }
  };

  const resetCurrentState = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const existingAnswer = answers.find(a => a.questionId === currentQuestion.id);
    
    if (existingAnswer) {
      // Для вопросов с шкалой, если ответ - число, это значение шкалы
      if (currentQuestion.type === 'yes_no_scale' && !isNaN(Number(existingAnswer.answer))) {
        setCurrentAnswer(existingAnswer.answer.toString()); // Сохраняем числовое значение
        setSliderValue(Number(existingAnswer.answer));
      } else if (currentQuestion.type === 'yes_no_scale' && existingAnswer.answer === 'no') {
        setCurrentAnswer('no');
        setSliderValue(5);
      } else {
        setCurrentAnswer(existingAnswer.answer.toString());
        if (currentQuestion.type === 'scale') {
          setSliderValue(Number(existingAnswer.answer));
        }
      }
      
      setAdditionalText(existingAnswer.additionalText || '');
      
      if (currentQuestion.type === 'multi_select') {
        setSelectedOptions(existingAnswer.answer.toString().split(', '));
      }
    } else {
      setCurrentAnswer('');
      setAdditionalText('');
      // Устанавливаем начальное значение шкалы в зависимости от типа вопроса
      if (currentQuestion.type === 'scale' && currentQuestion.scale) {
        setSliderValue(Math.floor((currentQuestion.scale.min + currentQuestion.scale.max) / 2));
      } else if (currentQuestion.type === 'yes_no_scale') {
        setSliderValue(5);
      } else {
        setSliderValue(5);
      }
      setSelectedOptions([]);
    }
  };

  useEffect(() => {
    if (questions.length > 0) {
      resetCurrentState();
    }
  }, [currentQuestionIndex, questions]);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Сначала сохраняем текущий ответ (включая email)
      let finalAnswers = [...answers];
      if (currentAnswer) {
        const currentQuestion = questions[currentQuestionIndex];
        const newAnswer = {
          questionId: currentQuestion.id,
          answer: currentAnswer,
          additionalText: additionalText || undefined
        };
        
        const existingAnswerIndex = finalAnswers.findIndex(a => a.questionId === currentQuestion.id);
        if (existingAnswerIndex >= 0) {
          finalAnswers[existingAnswerIndex] = newAnswer;
        } else {
          finalAnswers.push(newAnswer);
        }
      }
      
      console.log('📤 Отправляем результаты теста:', { sessionId, answersCount: finalAnswers.length });
      console.log('📊 Все ответы (включая последний):', finalAnswers);
      
      // Email больше не нужен, так как удален из теста
      console.log('📧 Email больше не используется');
      
      // Логируем статистику ответов
      console.log('📊 Статистика ответов:', { 
        answered: finalAnswers.length, 
        total: questions.length
      });

      const response = await apiRequest('api/tests/primary/submit', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          answers: finalAnswers
        }),
      });

      console.log('📥 Ответ сервера:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Тест успешно отправлен, переходим к оплате');
        clearLocalStorage(); // Очищаем сохраненные данные после успешной отправки
        navigate(`/payment?sessionId=${sessionId}`);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка сервера:', response.status, errorText);
        navigate(`/payment?sessionId=${sessionId}`);
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error);
      navigate(`/payment?sessionId=${sessionId}`);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = () => {
    if (!questions[currentQuestionIndex]) return null;

    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '30px' }}>
          <Progress 
            percent={Math.round(progress)} 
            strokeColor="#00695C"
            showInfo={false}
            style={{ marginBottom: '20px' }}
          />
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </Text>
        </div>

        <Card style={{ marginBottom: '30px' }}>
          <Title level={4} style={{ marginBottom: '30px', color: '#00695C' }}>
            {question.text}
          </Title>

          {question.type === 'yes_no' && (
            <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button 
                type={currentAnswer === 'yes' ? 'primary' : 'default'}
                onClick={() => handleAnswer('yes')}
                size="large"
                style={{ flex: 1, marginRight: '8px' }}
              >
                Да
              </Button>
              <Button 
                type={currentAnswer === 'no' ? 'primary' : 'default'}
                onClick={() => handleAnswer('no')}
                size="large"
                style={{ flex: 1, marginLeft: '8px' }}
              >
                Нет
              </Button>
            </Space>
          )}

          {question.type === 'yes_no_text' && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  type={currentAnswer === 'yes' ? 'primary' : 'default'}
                  onClick={() => handleAnswer('yes')}
                  size="large"
                  style={{ flex: 1, marginRight: '8px' }}
                >
                  Да
                </Button>
                <Button 
                  type={currentAnswer === 'no' ? 'primary' : 'default'}
                  onClick={() => handleAnswer('no')}
                  size="large"
                  style={{ flex: 1, marginLeft: '8px' }}
                >
                  Нет
                </Button>
              </Space>
              
              {currentAnswer === 'yes' && (
                <TextArea
                  placeholder={question.placeholder || 'Пожалуйста, уточните...'}
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  autoSize={{ minRows: 4, maxRows: 16 }}
                  style={{ marginTop: '16px' }}
                />
              )}
            </Space>
          )}

          {question.type === 'no_text' && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  type={currentAnswer === 'yes' ? 'primary' : 'default'}
                  onClick={() => handleAnswer('yes')}
                  size="large"
                  style={{ flex: 1, marginRight: '8px' }}
                >
                  Да
                </Button>
                <Button 
                  type={currentAnswer === 'no' ? 'primary' : 'default'}
                  onClick={() => handleAnswer('no')}
                  size="large"
                  style={{ flex: 1, marginLeft: '8px' }}
                >
                  Нет
                </Button>
              </Space>
              
              {currentAnswer === 'no' && (
                <TextArea
                  placeholder={question.placeholder || 'Пожалуйста, уточните...'}
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  autoSize={{ minRows: 4, maxRows: 16 }}
                  style={{ marginTop: '16px' }}
                />
              )}
            </Space>
          )}

          {question.type === 'yes_no_scale' && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  type={currentAnswer === 'no' || currentAnswer === '' ? 'default' : 'primary'}
                  onClick={() => handleAnswer('yes')}
                  size="large"
                  style={{ flex: 1, marginRight: '8px' }}
                >
                  Да
                </Button>
                <Button 
                  type={currentAnswer === 'no' ? 'primary' : 'default'}
                  onClick={() => handleAnswer('no')}
                  size="large"
                  style={{ flex: 1, marginLeft: '8px' }}
                >
                  Нет
                </Button>
              </Space>
              
              {currentAnswer !== 'no' && currentAnswer !== '' && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Text style={{ color: '#666', fontSize: '14px' }}>{question.scale?.labels?.min || 'Редко'}</Text>
                    <Text style={{ color: '#666', fontSize: '14px' }}>{question.scale?.labels?.max || 'Очень часто'}</Text>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    style={{ marginBottom: '16px' }}
                    tooltip={{ formatter: null }}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#00695C' }}>
                      {sliderValue}
                    </Text>
                  </div>
                </div>
              )}
            </Space>
          )}

          {question.type === 'yes_no_examples' && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button 
                  type={currentAnswer === 'yes' ? 'primary' : 'default'}
                  onClick={() => handleAnswer('yes')}
                  size="large"
                  style={{ flex: 1, marginRight: '8px' }}
                >
                  Да
                </Button>
                <Button 
                  type={currentAnswer === 'no' ? 'primary' : 'default'}
                  onClick={() => handleAnswer('no')}
                  size="large"
                  style={{ flex: 1, marginLeft: '8px' }}
                >
                  Нет
                </Button>
              </Space>
              
              {currentAnswer === 'yes' && (
                <TextArea
                  placeholder="Пожалуйста, приведите примеры..."
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  autoSize={{ minRows: 4, maxRows: 16 }}
                  style={{ marginTop: '16px' }}
                />
              )}
            </Space>
          )}

          {question.type === 'open_text' && (
            <TextArea
              placeholder={question.placeholder || 'Введите ваш ответ...'}
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              autoSize={{ minRows: 6, maxRows: 20 }}
            />
          )}

          {question.type === 'scale' && question.scale && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Text style={{ color: '#666', fontSize: '14px' }}>{question.scale.labels.min}</Text>
                <Text style={{ color: '#666', fontSize: '14px' }}>{question.scale.labels.max}</Text>
              </div>
              <Slider
                min={question.scale.min}
                max={question.scale.max}
                value={sliderValue}
                onChange={handleSliderChange}
                style={{ marginBottom: '16px' }}
                tooltip={{ formatter: null }}
              />
              <div style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#00695C' }}>
                  {sliderValue}
                </Text>
              </div>
            </div>
          )}

          {question.type === 'multi_select' && question.options && (
            <Checkbox.Group
              options={question.options}
              value={selectedOptions}
              onChange={handleMultiSelect}
              style={{ width: '100%' }}
            />
          )}

          {question.type === 'budget' && (
            <InputNumber
              placeholder="Введите сумму в рублях"
              value={currentAnswer ? Number(currentAnswer) : undefined}
              onChange={(value) => handleAnswer(value ? value.toString() : '')}
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              parser={(value) => Number(value!.replace(/\s?/g, ''))}
              addonAfter="₽"
            />
          )}

          {question.type === 'email' && (
            <Input
              type="email"
              placeholder="Введите ваш email"
              value={currentAnswer}
              onChange={(e) => handleAnswer(e.target.value)}
              style={{ width: '100%' }}
            />
          )}

          {question.type === 'gender_choice' && question.options && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {question.options.map((option: any) => (
                <Button 
                  key={option.value}
                  type={currentAnswer === option.value ? 'primary' : 'default'}
                  onClick={() => handleAnswer(option.value)}
                  size="large"
                  style={{ width: '100%' }}
                >
                  {option.label}
                </Button>
              ))}
            </Space>
          )}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            size="large"
          >
            Назад
          </Button>
          
          <Button 
            type="primary" 
            icon={<ArrowRightOutlined />} 
            onClick={handleNext}
            disabled={!currentAnswer}
            loading={loading}
            size="large"
            className={currentQuestionIndex === questions.length - 1 ? 'finish-button' : ''}
          >
            {currentQuestionIndex === questions.length - 1 ? 'Завершить' : 'Далее'}
          </Button>
        </div>
      </div>
    );
  };

  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Text>Загрузка вопросов...</Text>
      </div>
    );
  }

  return renderQuestion();
};

export default TestPage;