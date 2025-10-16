import React, { useState, useEffect, useRef } from 'react';
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
import { useThemeColor } from '../hooks/useThemeColor';
import { useAuth } from '../hooks/useAuth';
import GenerationAnimation from '../components/GenerationAnimation';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Этот список будет заменен на тесты из API
const fallbackTests = [
  {
    id: 1,
    name: 'Тест на пограничное расстройство личности (ПРЛ)',
    url: 'https://testometrika.com/diagnosis-of-abnormalities/do-you-have-a-border-disorder-of-personality/',
    description: 'Онлайн-скрининг симптомов ПРЛ по критериям DSM-5 (эмоциональная нестабильность, импульсивность и пр.)'
  },
  {
    id: 2,
    name: 'Тест на биполярное аффективное расстройство (БАР)',
    url: 'https://psytests.org/diag/hcl32.html',
    description: 'Опросник гипомании HCL-32 для выявления гипоманиакальных состояний и признаков биполярного расстройства'
  },
  {
    id: 3,
    name: 'Тест на синдром дефицита внимания и гиперактивности (СДВГ)',
    url: 'https://psytests.org/diag/asrs.html',
    description: 'Шкала ASRS v1.1 для взрослых, разработанная ВОЗ для оценки симптомов невнимательности и гиперактивности'
  },
  {
    id: 4,
    name: 'Тест на посттравматическое стрессовое расстройство (ПТСР)',
    url: 'https://psytests.org/trauma/pcl5.html',
    description: 'Опросник PCL-5 (PTSD Checklist for DSM-5) для скрининга симптомов ПТСР (навязчивые воспоминания, избегание и др.)'
  },
  {
    id: 5,
    name: 'Тест на комплексное посттравматическое стрессовое расстройство (кПТСР)',
    url: 'https://psytests.org/trauma/itq.html',
    description: 'Международный опросник травмы (ITQ) для оценки симптомов комплексной травмы и диссоциации'
  },
  {
    id: 6,
    name: 'Тест на депрессию',
    url: 'https://psytests.org/depression/bdi.html',
    description: 'Шкала депрессии Бека (BDI) для измерения тяжести депрессивных симптомов (21 вопрос)'
  },
  {
    id: 7,
    name: 'Тест на генерализованное тревожное расстройство',
    url: 'https://psytests.org/anxiety/gad7.html',
    description: 'Опросник GAD-7 для скрининга уровня общей тревоги и беспокойства'
  },
  {
    id: 8,
    name: 'Тест на обсессивно-компульсивное расстройство (ОКР)',
    url: 'https://psytests.org/psyclinical/ybocs.html',
    description: 'Обсессивно-компульсивная шкала Йеля–Брауна (Y-BOCS) для оценки выраженности навязчивостей и компульсий'
  },
  {
    id: 9,
    name: 'Тест на расстройства пищевого поведения',
    url: 'https://psytests.org/food/eat26.html',
    description: 'Опросник пищевого отношения EAT-26 для выявления склонности к анорексии, булимии или перееданию'
  },
  {
    id: 10,
    name: 'Тест на зависимость от психоактивных веществ',
    url: 'https://www.samopomo.ch/proversja/test-po-vyjavleniju-rasstroistv-svjazannykh-s-upotrebleniem-narkotikov-dudit',
    description: 'Опросник DUDIT (Drug Use Disorders Identification Test) для выявления проблемного употребления наркотиков'
  },
  {
    id: 11,
    name: 'Тест на диссоциативное расстройство',
    url: 'https://psytests.org/diag/des.html',
    description: 'Шкала диссоциативного опыта DES для оценки степени выраженности диссоциации'
  },
  {
    id: 12,
    name: 'Тест на расстройство аутистического спектра (РАС)',
    url: 'https://psytests.org/arc/aq.html',
    description: 'Опросник AQ (Autism Spectrum Quotient) для выявления аутичных черт у взрослых'
  },
  {
    id: 13,
    name: 'Тест на социальное тревожное расстройство',
    url: 'https://psytests.org/anxiety/lsas.html',
    description: 'Шкала социальной тревожности Либовича (LSAS) для оценки уровня социофобии (страх и избегание в социальных ситуациях)'
  },
  {
    id: 14,
    name: 'Тест на паническое расстройство',
    url: 'https://psytests.org/psyclinical/pdss.html',
    description: 'Шкала тяжести панического расстройства PDSS для измерения выраженности панических атак и связанной тревоги'
  },
  {
    id: 15,
    name: 'Тест на дисморфофобию (телесное дисморфическое расстройство)',
    url: 'https://psytests.org/beauty/bddq.html',
    description: 'Опросник дисморфофобии BDDQ (Dermatology Version) для скрининга беспокойства о внешности'
  },
  {
    id: 16,
    name: 'Тест на суицидальные тенденции',
    url: 'https://psytests.org/psyclinical/osr.html',
    description: 'Опросник суицидального риска (ОСР) для выявления уровня суицидальных мыслей и намерений'
  },
  {
    id: 17,
    name: 'Тест на детскую травму',
    url: 'https://psytests.org/trauma/ctq.html',
    description: 'Опросник детских травм CTQ-SF (краткая форма) для выявления неблагоприятного опыта детства'
  },
  {
    id: 18,
    name: 'Тест на шизотипическое расстройство личности',
    url: 'https://psytests.org/diag/spq.html',
    description: 'Опросник шизотипических черт личности SPQ для диагностики признаков шизотипического расстройства'
  }
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, authData, logout } = useAuth();
  const [mascotMessage, setMascotMessage] = useState('');
  const [recommendedTests, setRecommendedTests] = useState<any[]>([]);
  const [showTests, setShowTests] = useState(false);
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [testResults, setTestResults] = useState<{[key: number]: string}>({});
  const [savingResults, setSavingResults] = useState<{[key: number]: boolean}>({});
  const completionButtonRef = useRef<HTMLDivElement>(null);
  
  // Функции для фоновой генерации
  const startBackgroundGeneration = async () => {
    try {
      console.log('🚀 [DASHBOARD] Запуск фоновой генерации документов');
      
      // Проверяем валидность sessionId
      if (!authData?.sessionId || authData?.sessionId === true || authData?.sessionId.trim() === '') {
        console.error('❌ [DASHBOARD] SessionId невалидный для фоновой генерации:', authData?.sessionId);
        message.error('Ошибка: невалидный идентификатор сессии');
        return;
      }
      
      // Дополнительная проверка на валидность UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(authData.sessionId)) {
        console.error('❌ [DASHBOARD] SessionId не является валидным UUID:', authData.sessionId);
        message.error('Ошибка: невалидный формат идентификатора сессии');
        return;
      }
      
      setIsGenerating(true);
      setGenerationStep(0);
      setGenerationStatus('in_progress');
      
      const response = await apiRequest('api/background-generation/start', {
        method: 'POST',
        body: JSON.stringify({ sessionId: authData?.sessionId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [DASHBOARD] Фоновая генерация запущена:', data);
        message.success('Генерация документов запущена!');
        
        // Запускаем мониторинг статуса
        monitorGenerationStatus();
      } else {
        throw new Error('Failed to start background generation');
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Ошибка запуска фоновой генерации:', error);
      message.error('Ошибка при запуске генерации документов');
      setIsGenerating(false);
      setGenerationStatus('not_started');
    }
  };
  
  const monitorGenerationStatus = async () => {
    const checkStatus = async () => {
      try {
        // Проверяем валидность sessionId перед запросом
        if (!authData?.sessionId || authData?.sessionId === true || authData?.sessionId.trim() === '') {
          console.error('❌ [DASHBOARD] SessionId невалидный для мониторинга:', authData?.sessionId);
          return;
        }
        
        // Дополнительная проверка на валидность UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(authData.sessionId)) {
          console.error('❌ [DASHBOARD] SessionId не является валидным UUID для мониторинга:', authData.sessionId);
          return;
        }
        
        const response = await apiRequest(`api/background-generation/status/${authData?.sessionId}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 [DASHBOARD] Статус генерации:', data);
          
          setGenerationStatus(data.status);
          
          // Обновляем текущий шаг на основе готовых документов
          let currentStep = 0;
          if (data.documents.personal_plan) currentStep = 1;
          if (data.documents.session_preparation) currentStep = 2;
          if (data.documents.psychologist_pdf) currentStep = 3;
          
          setGenerationStep(currentStep);
          
          if (data.status === 'completed') {
            setIsGenerating(false);
            message.success('Все документы готовы!');
            // Перенаправляем на страницу персонального плана
            navigate('/personal-plan');
          }
        }
      } catch (error) {
        console.error('❌ [DASHBOARD] Ошибка проверки статуса:', error);
      }
    };
    
    // Проверяем статус каждые 3 секунды
    const interval = setInterval(checkStatus, 3000);
    
    // Очищаем интервал через 5 минут (на случай зависания)
    setTimeout(() => {
      clearInterval(interval);
      if (isGenerating) {
        setIsGenerating(false);
        message.warning('Генерация документов занимает больше времени, чем ожидалось. Проверьте статус позже.');
      }
    }, 300000); // 5 минут
  };
  const [psychologistForm] = Form.useForm();
  const [feedbackText, setFeedbackText] = useState('');
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#c3cfe2');
  
  // Состояния загрузки для AI операций
  const [loadingMascotMessage, setLoadingMascotMessage] = useState(false);
  const [loadingPersonalPlan, setLoadingPersonalPlan] = useState(false);
  const [loadingSessionPreparation, setLoadingSessionPreparation] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [loadingPsychologistPdf, setLoadingPsychologistPdf] = useState(false);
  const [loadingTestResults, setLoadingTestResults] = useState(true); // Загрузка результатов тестов
  
  // Состояния для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<number | null>(null);
  const [modalText, setModalText] = useState('');
  
  // Состояния для фоновой генерации
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

  // Проверяем авторизацию и редиректим если не авторизован
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('❌ [DASHBOARD] Пользователь не авторизован, редирект на логин');
      message.error('Необходимо войти в личный кабинет');
      navigate('/lk/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Загрузка данных после успешной верификации
  useEffect(() => {
    if (!isAuthenticated || !authData) return;
    
    console.log('🔄 [DASHBOARD] useEffect загрузки данных:', {
      sessionId: authData?.sessionId,
      sessionIdType: typeof authData?.sessionId,
      personalPlanUnlocked: authData?.personalPlanUnlocked,
      shouldLoadTests: authData?.sessionId && authData?.personalPlanUnlocked === false
    });
    
    // Проверяем валидность sessionId
    const isValidSessionId = authData?.sessionId && 
      authData.sessionId !== true && 
      typeof authData.sessionId === 'string' && 
      authData.sessionId.trim() !== '';
    
    if (!isValidSessionId) {
      console.error('❌ [DASHBOARD] Невалидный sessionId:', authData?.sessionId);
      console.error('❌ [DASHBOARD] Перенаправляем на логин');
      message.error('Ошибка авторизации. Пожалуйста, войдите заново.');
      navigate('/lk/login', { replace: true });
      return;
    }
    
    // Загружаем тесты только если:
    // 1. sessionId валидный
    // 2. personalPlanUnlocked ЯВНО равен false (не undefined)
    if (isValidSessionId && authData?.personalPlanUnlocked === false) {
      console.log('📥 [DASHBOARD] Загружаем данные тестов');
      generateMascotMessage();
      // fetchAdditionalTestResults вызовется автоматически после загрузки recommendedTests
    } else {
      console.log('⏭️ [DASHBOARD] Пропускаем загрузку тестов. authData?.personalPlanUnlocked:', authData?.personalPlanUnlocked);
    }
  }, [authData]);

  // Загружаем результаты тестов после того, как загрузились рекомендованные тесты
  useEffect(() => {
    if (recommendedTests.length > 0 && authData?.sessionId && authData?.personalPlanUnlocked === false) {
      console.log('📋 Рекомендованные тесты загружены, загружаем результаты...');
      fetchAdditionalTestResults();
    }
  }, [recommendedTests.length, authData]);

  // Проверяем завершенность тестов когда загружены тесты или результаты
  useEffect(() => {
    if (recommendedTests.length > 0 && authData?.personalPlanUnlocked === false) {
      const completedCount = Object.keys(testResults).length;
      const isCompleted = completedCount >= recommendedTests.length;
      console.log(`📊 Прогресс тестов: ${completedCount}/${recommendedTests.length}, завершено: ${isCompleted}`);
      setAllTestsCompleted(isCompleted);
    }
  }, [recommendedTests, testResults, authData]);

  // Автоматический скролл к кнопке завершения после прохождения всех тестов
  useEffect(() => {
    if (allTestsCompleted && completionButtonRef.current && authData?.personalPlanUnlocked === false) {
      // Показываем салют
      showConfetti();
      
      // Скроллим к кнопке
      setTimeout(() => {
        completionButtonRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [allTestsCompleted, authData]);

  const showConfetti = () => {
    // Создаем эмодзи конфетти
    const emojis = ['🎉', '✨', '🎊', '⭐', '💫'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const emoji = document.createElement('div');
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.position = 'absolute';
        emoji.style.fontSize = '30px';
        emoji.style.left = Math.random() * 100 + '%';
        emoji.style.top = '-50px';
        emoji.style.animation = `fall ${2 + Math.random() * 2}s linear`;
        emoji.style.opacity = '0';
        container.appendChild(emoji);

        setTimeout(() => emoji.remove(), 4000);
      }, i * 100);
    }

    setTimeout(() => container.remove(), 4500);
  };

  const generateMascotMessage = async () => {
    try {
      // Проверяем, что authData?.sessionId существует
      if (!authData?.sessionId || authData?.sessionId.trim() === '') {
        console.log('❌ SessionId пустой, пропускаем генерацию сообщения маскота');
        setMascotMessage('Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.');
        setRecommendedTests(fallbackTests.slice(0, 5));
        setShowTests(true);
        return;
      }

      setLoadingMascotMessage(true);
      console.log('🤖 Запрос на генерацию сообщения маскота для dashboard:', { sessionId: authData?.sessionId });
      
      // Таймер для показа тестов через 30 секунд
      const testsTimer = setTimeout(() => {
        console.log('⏱️ 30 секунд прошло, показываем тесты');
        setShowTests(true);
      }, 30000);
      
      const response = await apiRequest('api/ai/mascot-message/dashboard', {
        method: 'POST',
        body: JSON.stringify({ sessionId: authData?.sessionId }),
      });

      clearTimeout(testsTimer);
      console.log('📥 Ответ от API:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Данные ответа:', data);
        
        if (data.cached) {
          console.log('💾 Получено сохраненное сообщение Луми (не генерировалось заново)');
        } else {
          console.log('✨ Получено новое сгенерированное сообщение Луми');
        }
        
        setMascotMessage(data.message);
        
        // Используем рекомендованные тесты из API или fallback
        const testsToUse = data.recommendedTests && data.recommendedTests.length > 0 
          ? data.recommendedTests 
          : fallbackTests.slice(0, 5);
        setRecommendedTests(testsToUse);
        console.log('📋 Установлены тесты:', testsToUse.length);
      } else {
        console.error('❌ Ошибка API:', response.status);
        const errorText = await response.text();
        console.error('❌ Ответ сервера:', errorText);
        setMascotMessage('Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.');
        setRecommendedTests(fallbackTests.slice(0, 5));
      }
      
      // Показываем тесты после завершения генерации
      setShowTests(true);
    } catch (error) {
      console.error('❌ Ошибка при генерации сообщения маскота:', error);
      setMascotMessage('Привет! На основе твоего теста я рекомендую пройти дополнительные тесты для более точной диагностики.');
      setRecommendedTests(fallbackTests.slice(0, 5));
      setShowTests(true);
    } finally {
      setLoadingMascotMessage(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 [LOGOUT] Выход из ЛК');
    // Используем функцию logout из хука useAuth
    logout();
    navigate('/', { replace: true });
  };

  const handlePsychologistRequest = async (values: any) => {
    try {
      const response = await apiRequest('api/telegram/psychologist-request', {
        method: 'POST',
          body: JSON.stringify({
            sessionId: authData?.sessionId,
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
            sessionId: authData?.sessionId,
            feedbackText: feedbackText.trim()
          }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Анализ готов! Проверьте результаты ниже.');
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

  const fetchAdditionalTestResults = async () => {
    try {
      console.log('🔄 [FETCH RESULTS] Начинаем загрузку результатов дополнительных тестов');
      console.log('🔄 [FETCH RESULTS] Текущее состояние testResults:', testResults);
      
      setLoadingTestResults(true);
      
      // Проверяем, что authData?.sessionId существует и является валидным UUID
      if (!authData?.sessionId || authData?.sessionId === true || authData?.sessionId.trim() === '') {
        console.log('❌ SessionId пустой или невалидный, пропускаем загрузку результатов');
        console.log('❌ SessionId значение:', authData?.sessionId);
        console.log('❌ SessionId тип:', typeof authData?.sessionId);
        setLoadingTestResults(false);
        return;
      }
      
      // Дополнительная проверка на валидность UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(authData.sessionId)) {
        console.log('❌ SessionId не является валидным UUID:', authData.sessionId);
        setLoadingTestResults(false);
        return;
      }

      // Проверяем существование primary test results (email больше не обязателен)
      const primaryResponse = await apiRequest(`api/tests/primary/${authData?.sessionId}`);
      const primaryData = await primaryResponse.json();
      
      if (!primaryData.success) {
        console.error('❌ Не удалось получить данные пользователя');
        setLoadingTestResults(false);
        return;
      }
      
      const userEmail = primaryData.data?.email;
      const nickname = primaryData.data?.nickname;
      console.log('📧 Email пользователя для загрузки результатов:', userEmail || 'не указан');
      console.log('👤 Никнейм пользователя:', nickname || 'не указан');
      
      // Устанавливаем никнейм
      if (nickname) {
        setUserNickname(nickname);
      }
      
      // Загружаем результаты дополнительных тестов по authData?.sessionId
      const response = await apiRequest(`api/tests/additional/results/${authData?.sessionId}`);
      
      if (!response.ok) {
        console.error('❌ Ошибка HTTP:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Ответ сервера:', errorText);
        setLoadingTestResults(false);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
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
        
        // Проверка завершенности тестов перенесена в useEffect
        // который срабатывает после загрузки recommendedTests
        console.log('📊 [FETCH RESULTS] Данные из API:', data.results);
      }
    } catch (error) {
      console.error('Error fetching additional test results:', error);
    } finally {
      setLoadingTestResults(false);
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

    // Проверяем, что authData?.sessionId существует
    if (!authData?.sessionId || authData?.sessionId.trim() === '') {
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
            sessionId: authData?.sessionId,
            testName: test.name,
            testUrl: test.url,
          testResult: result.trim()
        }),
      });

      if (response.ok) {
        message.success('Результат теста сохранен!');
        // Обновляем локальное состояние немедленно
        setTestResults(prev => ({ ...prev, [testId]: result.trim() }));
        // Больше не нужно перезагружать с сервера, так как мы уже обновили состояние
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

  const downloadPersonalPlan = async () => {
    setLoadingPersonalPlan(true);
    try {
      const response = await apiRequest('api/pdf-html/personal-plan', {
        method: 'POST',
        body: JSON.stringify({ sessionId: authData?.sessionId }),
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'personal-plan.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('Персональный план скачан в PDF!');
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
        body: JSON.stringify({ sessionId: authData?.sessionId, specialistType }),
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

  const downloadPsychologistPdf = async () => {
    setLoadingPsychologistPdf(true);
    try {
      const response = await apiRequest('api/pdf/psychologist-pdf', {
        method: 'POST',
        body: JSON.stringify({ sessionId: authData?.sessionId }),
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'psychologist-pdf.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('PDF для психолога скачан!');
      } else {
        message.error('Ошибка при генерации PDF для психолога');
      }
    } catch (error) {
      console.error('Error downloading psychologist PDF:', error);
      message.error('Произошла ошибка при скачивании PDF для психолога');
    } finally {
      setLoadingPsychologistPdf(false);
    }
  };

  // Показываем загрузку во время проверки авторизации
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: '20px', fontSize: '16px', color: '#666' }}>
            Проверяем авторизацию...
          </Text>
        </div>
      </div>
    );
  }

  // Логирование перед рендером
  console.log('🎨 [DASHBOARD] Рендер компонента:', {
    personalPlanUnlocked: authData?.personalPlanUnlocked,
    sessionId: !!authData?.sessionId,
    isLoading,
    showTests,
    allTestsCompleted,
    recommendedTestsCount: recommendedTests.length
  });

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      {/* Header with Nickname and Exit button */}
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
              backgroundColor: 'rgb(243, 186, 111)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif'
            }}>
              {authData?.nickname.charAt(0).toUpperCase()}
            </div>
            <Text style={{ 
              fontSize: '18px',
              fontWeight: '500',
              color: '#333',
              fontFamily: 'Inter, sans-serif'
            }}>
              {authData?.nickname}
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
        margin: '0 auto',
        textAlign: 'center'
      }}>
        
        {/* Персональный план (показывается после завершения всех тестов) */}
        {authData?.personalPlanUnlocked ? (
          <div>
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
                  Руководство для эффективной подготовки к сеансу
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

              {/* Psychologist PDF Card */}
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
                  backgroundColor: '#F0F9FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto'
                }}>
                  <FileTextOutlined style={{ fontSize: '24px', color: '#3B82F6' }} />
                </div>
                <Title level={4} style={{ 
                  color: '#2C3E50', 
                  marginBottom: '15px',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  PDF для психолога
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
                  onClick={downloadPsychologistPdf}
                  loading={loadingPsychologistPdf}
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
                  {loadingPsychologistPdf ? 'Генерируем...' : 'Скачать PDF'}
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
        ) : (
          <div>
        {/* Header and subtitle */}
        <div style={{ marginBottom: '40px', textAlign: 'left' }}>
          <Title level={1} style={{ 
            color: '#2C3E50',
            fontSize: '32px',
            fontWeight: '600',
            marginBottom: '16px',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            Ваш персональный план почти готов
          </Title>
          <Text style={{ 
            color: '#7B8794',
            fontSize: '16px',
            lineHeight: '1.6',
            display: 'block'
          }}>
            Чтобы сделать его максимально точным и полезным именно для вас, нам нужно уточнить несколько деталей. Пожалуйста, пройдите ещё несколько коротких тестов.
          </Text>
        </div>
        
        {/* Mascot section */}
        <div style={{ marginBottom: '60px' }}>
          {/* Mascot header with icon and text */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <img 
              src="/mascot.png"  
              alt="Луми" 
              style={{ 
                width: '60px', 
                height: '60px', 
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1 }}>
              <Title level={2} style={{ 
                color: '#2C3E50',
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '4px',
                margin: '0 0 4px 0'
              }}>
                Луми
              </Title>
              <Text style={{ 
                color: '#7B8794',
                fontSize: '16px',
                display: 'block'
              }}>
                Ваш AI компаньон
              </Text>
            </div>
          </div>

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
              <div 
                ref={completionButtonRef}
                style={{ 
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
                    color: '#4F958B', 
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
                  onClick={async () => {
                    console.log('🔘 [DASHBOARD] Нажата кнопка "Перейти к персональному плану"');
                    console.log('🔘 [DASHBOARD] Текущий authData?.sessionId:', authData?.sessionId);
                    try {
                      const response = await apiRequest('api/dashboard/unlock-personal-plan', {
                        method: 'POST',
                        body: JSON.stringify({ sessionId: authData?.sessionId }),
                      });
                      
                      console.log('📥 [DASHBOARD] Ответ от unlock API:', response.status);
                      
                      if (response.ok) {
                        const data = await response.json();
                        console.log('✅ [DASHBOARD] Персональный план разблокирован успешно');
                        console.log('📊 [DASHBOARD] Данные ответа:', data);
                        setPersonalPlanUnlocked(true);
                        console.log('🔓 [DASHBOARD] Установлен флаг authData?.personalPlanUnlocked = true');
                        
                        // Запускаем фоновую генерацию документов
                        await startBackgroundGeneration();
                      } else {
                        const errorText = await response.text();
                        console.error('❌ [DASHBOARD] Ошибка при разблокировке:', errorText);
                        message.error('Ошибка при переходе к персональному плану');
                      }
                    } catch (error) {
                      console.error('❌ [DASHBOARD] Исключение при разблокировке:', error);
                      message.error('Произошла ошибка');
                    }
                  }}
                  style={{
                    height: '50px',
                    fontSize: '16px',
                    fontWeight: '600',
                    padding: '0 30px',
                    marginTop: '20px',
                    borderRadius: '25px',
                    backgroundColor: 'rgb(243, 186, 111)',
                    borderColor: 'rgb(243, 186, 111)',
                    color: '#ffffff'
                  }}
                >
                  Перейти к персональному плану
                </Button>
              </div>
            )}
            
            {/* Индикатор загрузки результатов тестов */}
            {showTests && loadingTestResults && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '15px',
                marginBottom: '30px'
              }}>
                <Spin size="large" />
                <div style={{ marginTop: '20px' }}>
                  <Text style={{ color: '#7B8794', fontSize: '16px' }}>
                    Загружаем результаты тестов...
                  </Text>
                </div>
              </div>
            )}

            {/* Tests grid */}
            {!allTestsCompleted && showTests && !loadingTestResults && (
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
                    Перейди по ссылке каждого теста, пройди тест на сайте партнёра, вернись сюда в личный кабинет и впиши результаты теста в поле ввода результатов. Когда результаты всех тестов будут занесены, мы составим для тебя персональный план
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
                        cursor: 'pointer',
                        textAlign: 'left'
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
                            backgroundColor: testResults[test.id] ? 'rgb(243, 186, 111)' : '#E8E8E8',
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
                            backgroundColor: 'rgb(243, 186, 111)',
                            borderColor: 'rgb(243, 186, 111)',
                            color: '#ffffff',
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
                backgroundColor: 'rgb(243, 186, 111)',
                borderColor: 'rgb(243, 186, 111)',
                color: '#ffffff',
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
          <div style={{ marginTop: '20px' }}>
            <Text style={{ 
              color: '#7B8794',
              fontSize: '14px',
              lineHeight: '1.5',
              display: 'block',
              marginBottom: '15px'
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
                resize: 'none',
                marginBottom: '20px'
              }}
            />
          </div>
        </Modal>
        </div>
        )}
        
        {/* Анимация генерации документов */}
        <GenerationAnimation 
          isGenerating={isGenerating}
          currentStep={generationStep}
          totalSteps={3}
          stepNames={['Персональный план', 'Подготовка к сеансу', 'PDF для психолога']}
        />
      </div>
    </div>
  );
};

export default DashboardPage;