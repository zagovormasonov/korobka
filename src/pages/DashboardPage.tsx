import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Button, 
  Space, 
  Input, 
  Form, 
  message, 
  Modal,
  Spin,
  Progress,
  Divider,
  Result
} from 'antd'; 
import { apiRequest } from '../config/api'; 
import { 
  DownloadOutlined, 
  UserOutlined, 
  FileTextOutlined, 
  MessageOutlined,
  CheckOutlined,
  BulbOutlined,
  EyeOutlined,
  ReloadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { getTestConfig, additionalTests } from '../config/tests';
import TestResultsModal from '../components/TestResultsModal';
import { useThemeColor } from '../hooks/useThemeColor';
import { useAuth } from '../hooks/useAuth';
import GenerationAnimation from '../components/GenerationAnimation';
import TelegramButton from '../components/TelegramButton';
import Footer from '../components/Footer';
import { openPdf, downloadPdf } from '../utils/pdfUtils';

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
  },
  {
    id: 19,
    name: 'Тест на выгорание',
    url: 'https://psytests.org/stress/maslach.html',
    description: 'Опросник выгорания Маслач (MBI) для оценки эмоционального истощения и профессионального выгорания'
  }
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, authData, logout, updatePersonalPlanUnlocked } = useAuth();
  const [mascotMessage, setMascotMessage] = useState('');
  const [recommendedTests, setRecommendedTests] = useState<any[]>([]);
  const [showTests, setShowTests] = useState(false);
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [testResults, setTestResults] = useState<{[key: number]: Record<number, number | number[]> | string}>({});
  const [savingResults, setSavingResults] = useState<{[key: number]: boolean}>({});
  const completionButtonRef = useRef<HTMLDivElement>(null);
  
  // Функции для фоновой генерации
  const startBackgroundGeneration = async () => {
    try {
      console.log('🚀 [DASHBOARD] Запуск фоновой генерации документов');
      
      // Проверяем валидность sessionId
      if (!authData?.sessionId || authData?.sessionId === 'true' || authData?.sessionId.trim() === '') {
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
      
      // Сначала проверяем статус генерации
      const statusResponse = await apiRequest(`api/background-generation/status/${authData?.sessionId}`, {
        method: 'GET',
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('📊 [DASHBOARD] Текущий статус генерации:', statusData);
        
        if (statusData.status === 'completed') {
          console.log('✅ [DASHBOARD] Документы уже сгенерированы, перенаправляем на персональный план');
          message.success('Документы уже готовы!');
          // Не перенаправляем сразу, даем пользователю увидеть результат
          // navigate('/personal-plan');
          // return;
        }
        
        if (statusData.status === 'in_progress') {
          console.log('⏳ [DASHBOARD] Генерация уже запущена, показываем анимацию');
          setIsGenerating(true);
          setGenerationStep(0);
          // setGenerationStatus('in_progress');
          
          // Обновляем текущий шаг на основе готовых документов
          let currentStep = 0;
          if (statusData.documents.personal_plan) currentStep = 1;
          if (statusData.documents.session_preparation) currentStep = 2;
          if (statusData.documents.psychologist_pdf) currentStep = 3;
          setGenerationStep(currentStep);
          
          // Запускаем мониторинг статуса
          monitorGenerationStatus();
          return;
        }
      }
      
      // Запускаем генерацию, если она еще не запущена
      console.log('🚀 [DASHBOARD] Запускаем генерацию документов...');
      console.log('🚀 [DASHBOARD] SessionId для запуска:', authData?.sessionId);
      
      // Сначала показываем анимацию
      setIsGenerating(true);
      setGenerationStep(0);
      
      try {
        const startResponse = await apiRequest('api/background-generation/start', {
          method: 'POST',
          body: JSON.stringify({ sessionId: authData?.sessionId }),
        });
        
        console.log('📥 [DASHBOARD] Ответ от start API:', startResponse.status);
        
        if (startResponse.ok) {
          const startData = await startResponse.json();
          console.log('✅ [DASHBOARD] Генерация запущена, данные:', startData);
          
          // Обновляем шаг генерации на основе готовых документов
          if (startData.status === 'in_progress' && startData.documents) {
            let currentStep = 0;
            if (startData.documents.personal_plan) currentStep = 1;
            if (startData.documents.session_preparation) currentStep = 2;
            if (startData.documents.psychologist_pdf) currentStep = 3;
            setGenerationStep(currentStep);
            console.log('📊 [DASHBOARD] Обновлен шаг генерации на основе готовых документов:', currentStep);
          }
          
          // Если генерация уже завершена, перенаправляем на персональный план
          if (startData.status === 'completed') {
            console.log('✅ [DASHBOARD] Генерация уже завершена, перенаправляем на персональный план');
            setIsGenerating(false);
            message.success('Документы уже готовы!');
            navigate('/personal-plan');
            return;
          }
          
          // Запускаем мониторинг статуса
          monitorGenerationStatus();
        } else {
          const errorText = await startResponse.text();
          console.error('❌ [DASHBOARD] Ошибка запуска генерации:', startResponse.status, errorText);
          setIsGenerating(false);
          message.error('Ошибка при запуске генерации документов');
        }
      } catch (startError) {
        console.error('❌ [DASHBOARD] Исключение при запуске генерации:', startError);
        setIsGenerating(false);
        message.error('Ошибка при запуске генерации документов');
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Ошибка запуска фоновой генерации:', error);
      message.error('Ошибка при запуске генерации документов');
      setIsGenerating(false);
      // setGenerationStatus('not_started');
    }
  };

  // Проверка статуса генерации при загрузке страницы
  const checkGenerationStatusOnLoad = async () => {
    try {
      console.log('🔍 [DASHBOARD] Проверяем статус генерации при загрузке страницы');
      
      const response = await apiRequest(`api/background-generation/status/${authData?.sessionId}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 [DASHBOARD] Статус генерации при загрузке:', data);
        
        if (data.status === 'completed') {
          console.log('✅ [DASHBOARD] Документы уже готовы, перенаправляем на персональный план');
          navigate('/personal-plan');
        } else if (data.status === 'in_progress') {
          console.log('⏳ [DASHBOARD] Генерация в процессе, показываем анимацию');
          setIsGenerating(true);
          setGenerationStep(0);
          // setGenerationStatus('in_progress');
          
          // Обновляем текущий шаг на основе готовых документов
          let currentStep = 0;
          if (data.documents.personal_plan) currentStep = 1;
          if (data.documents.session_preparation) currentStep = 2;
          if (data.documents.psychologist_pdf) currentStep = 3;
          setGenerationStep(currentStep);
          
          // Запускаем мониторинг статуса
          monitorGenerationStatus();
        } else {
          console.log('🚀 [DASHBOARD] Генерация не запущена, запускаем её');
          await startBackgroundGeneration();
        }
      }
    } catch (error) {
      console.error('❌ [DASHBOARD] Ошибка проверки статуса при загрузке:', error);
    }
  };
  
  const monitorGenerationStatus = async () => {
    const checkStatus = async () => {
      try {
        // Проверяем валидность sessionId перед запросом
        if (!authData?.sessionId || authData?.sessionId === 'true' || authData?.sessionId.trim() === '') {
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
          
          // setGenerationStatus(data.status);
          
          // Обновляем текущий шаг на основе готовых документов
          let currentStep = 0;
          if (data.documents.personal_plan) currentStep = 1;
          if (data.documents.session_preparation) currentStep = 2;
          if (data.documents.psychologist_pdf) currentStep = 3;
          
          setGenerationStep(currentStep);
          
          console.log('📊 [DASHBOARD] Обновлен шаг генерации:', {
            currentStep,
            personal_plan: data.documents.personal_plan,
            session_preparation: data.documents.session_preparation,
            psychologist_pdf: data.documents.psychologist_pdf
          });
          
          if (data.status === 'completed') {
            setIsGenerating(false);
            clearInterval(interval); // Останавливаем мониторинг
            message.success('Все документы готовы!');
            // Перенаправляем на страницу персонального плана
            navigate('/personal-plan');
            return; // Выходим из функции
          }
        }
      } catch (error) {
        console.error('❌ [DASHBOARD] Ошибка проверки статуса:', error);
      }
    };
    
    // Проверяем статус каждые 3 секунды
    const interval = setInterval(checkStatus, 3000);
    
    // Очищаем интервал через 10 минут (на случай зависания)
    setTimeout(() => {
      clearInterval(interval);
      if (isGenerating) {
        setIsGenerating(false);
        message.warning('Генерация документов занимает больше времени, чем ожидалось. Проверьте статус позже.');
      }
    }, 600000); // 10 минут
  };
  const [psychologistForm] = Form.useForm();
  const [feedbackText, setFeedbackText] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [feedbackLimit, setFeedbackLimit] = useState({ requestsToday: 0, limit: 5, remaining: 5, canSend: true });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Устанавливаем цвет статус-бара для градиентного фона
  useThemeColor('#c3cfe2');
  
  // Состояния загрузки для AI операций
  const [loadingMascotMessage, setLoadingMascotMessage] = useState(false);
  const [loadingPersonalPlan, setLoadingPersonalPlan] = useState(false);
  const [loadingSessionPreparation, setLoadingSessionPreparation] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [loadingPsychologistPdf, setLoadingPsychologistPdf] = useState(false);
  const [loadingTestResults, setLoadingTestResults] = useState(true); // Загрузка результатов тестов
  const [psychologistRequestSent, setPsychologistRequestSent] = useState(false); // Анимация отправки заявки
  
  // Состояния для модального окна
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<number | null>(null);
  const [modalText, setModalText] = useState('');
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [currentTestConfig, setCurrentTestConfig] = useState<any>(null);
  const [currentTestScore, setCurrentTestScore] = useState<number>(0);
  
  // Состояния для фоновой генерации
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  // const [generationStatus, // setGenerationStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  

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
      authData.sessionId !== 'true' && 
      typeof authData.sessionId === 'string' && 
      authData.sessionId.trim() !== '';
    
    if (!isValidSessionId) {
      console.error('❌ [DASHBOARD] Невалидный sessionId:', authData?.sessionId);
      console.error('❌ [DASHBOARD] Перенаправляем на логин');
      message.error('Ошибка авторизации. Пожалуйста, войдите заново.');
      navigate('/lk/login', { replace: true });
      return;
    }
    
    // Загружаем историю чата и проверяем лимит
    loadChatHistory();
    checkFeedbackLimit();
    
    // Загружаем тесты только если:
    // 1. sessionId валидный
    // 2. personalPlanUnlocked ЯВНО равен false (не undefined)
    if (isValidSessionId && authData?.personalPlanUnlocked === false) {
      console.log('📥 [DASHBOARD] Загружаем данные тестов');
      generateMascotMessage();
      // fetchAdditionalTestResults вызовется автоматически после загрузки recommendedTests
      
      // Проверяем, были ли обновлены результаты тестов перед загрузкой страницы
      const checkInitialUpdate = () => {
        const lastUpdate = localStorage.getItem('test_results_updated');
        if (lastUpdate) {
          const updateTime = parseInt(lastUpdate);
          const now = Date.now();
          // Если обновление было менее 30 секунд назад, перезагружаем результаты
          if (now - updateTime < 30000) {
            console.log('🔄 [DASHBOARD] Обнаружено недавнее обновление результатов при загрузке страницы, перезагружаем...');
            setTimeout(() => {
              fetchAdditionalTestResults();
              localStorage.removeItem('test_results_updated');
            }, 1000); // Небольшая задержка, чтобы recommendedTests успели загрузиться
          }
        }
      };
      
      // Проверяем сразу при монтировании
      checkInitialUpdate();
      
      // Добавляем слушатель для обновления результатов при возврате на страницу
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isAuthenticated && authData?.sessionId) {
          console.log('🔄 [DASHBOARD] Страница стала видимой, обновляем результаты тестов');
          fetchAdditionalTestResults();
        }
      };
      
      const handleFocus = () => {
        if (isAuthenticated && authData?.sessionId) {
          console.log('🔄 [DASHBOARD] Окно получило фокус, обновляем результаты тестов');
          fetchAdditionalTestResults();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      // Очистка слушателей при размонтировании
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    } else if (isValidSessionId && authData?.personalPlanUnlocked === true) {
      console.log('🔓 [DASHBOARD] Персональный план разблокирован, проверяем статус генерации документов');
      // Проверяем статус генерации документов
      checkGenerationStatusOnLoad();
    } else {
      console.log('⏭️ [DASHBOARD] Пропускаем загрузку тестов. authData?.personalPlanUnlocked:', authData?.personalPlanUnlocked);
    }
  }, [authData]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Загружаем результаты тестов после того, как загрузились рекомендованные тесты
  useEffect(() => {
    // Детектируем Safari для специальной обработки
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isSafari || isIOS) {
      console.log('🍎 [SAFARI-DETECT] Обнаружен Safari/iOS, используем специальную обработку ошибок');
    }
    
    // Функция для загрузки результатов
    const loadResults = () => {
      if (recommendedTests.length > 0 && authData?.sessionId && authData?.personalPlanUnlocked === false) {
        console.log('📋 Рекомендованные тесты загружены, загружаем результаты...');
        
        // Для Safari используем более надежную обработку промисов
        const fetchPromise = fetchAdditionalTestResults();
        
        if (fetchPromise && typeof fetchPromise.then === 'function') {
          fetchPromise.catch((error) => {
            console.error('❌ [USE-EFFECT] Критическая ошибка в fetchAdditionalTestResults:', error);
            console.error('❌ [USE-EFFECT] Error stack:', error?.stack);
            console.error('❌ [USE-EFFECT] Error message:', error?.message);
            console.error('❌ [USE-EFFECT] Error name:', error?.name);
            
            // Не позволяем ошибке сломать компонент
            try {
              setLoadingTestResults(false);
            } catch (setError) {
              console.error('❌ [USE-EFFECT] Ошибка при установке loading в false:', setError);
            }
          });
        }
      }
    };
    
    try {
      loadResults();
      
      // Проверяем, были ли обновлены результаты тестов (из другой вкладки/страницы)
      const checkForUpdates = () => {
        const lastUpdate = localStorage.getItem('test_results_updated');
        if (lastUpdate) {
          const updateTime = parseInt(lastUpdate);
          const now = Date.now();
          // Если обновление было менее 30 секунд назад, перезагружаем результаты
          if (now - updateTime < 30000) {
            console.log('🔄 [DASHBOARD] Обнаружено обновление результатов, перезагружаем...');
            loadResults();
            localStorage.removeItem('test_results_updated');
          } else {
            // Если флаг старый, удаляем его
            localStorage.removeItem('test_results_updated');
          }
        }
      };
      
      // Проверяем сразу при монтировании
      checkForUpdates();
      
      // Проверяем периодически (каждые 2 секунды)
      const updateInterval = setInterval(checkForUpdates, 2000);
      
      // Слушаем события видимости страницы и фокуса окна
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && authData?.sessionId && authData?.personalPlanUnlocked === false) {
          console.log('🔄 [DASHBOARD] Страница стала видимой, обновляем результаты тестов');
          loadResults();
        }
      };
      
      const handleFocus = () => {
        if (authData?.sessionId && authData?.personalPlanUnlocked === false) {
          console.log('🔄 [DASHBOARD] Окно получило фокус, обновляем результаты тестов');
          loadResults();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      // Очистка при размонтировании
      return () => {
        clearInterval(updateInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    } catch (error) {
      console.error('❌ [USE-EFFECT] Критическая ошибка в useEffect:', error);
      console.error('❌ [USE-EFFECT] Error stack:', (error as Error)?.stack);
      console.error('❌ [USE-EFFECT] Error message:', (error as Error)?.message);
      // Не позволяем ошибке сломать компонент
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
      // Получаем UTM-метки из URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utmSource: urlParams.get('utm_source'),
        utmMedium: urlParams.get('utm_medium'),
        utmCampaign: urlParams.get('utm_campaign'),
        utmTerm: urlParams.get('utm_term'),
        utmContent: urlParams.get('utm_content')
      };

      const response = await apiRequest('api/telegram/psychologist-request', {
        method: 'POST',
          body: JSON.stringify({
            sessionId: authData?.sessionId,
          ...values,
          ...utmData
          }),
      });

      if (response.ok) {
        // Запускаем анимацию успешной отправки
        console.log('🎉 [DASHBOARD] Запускаем анимацию отправки заявки');
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
        
        // Сбрасываем анимацию через 3 секунды
        setTimeout(() => {
          console.log('🔄 [DASHBOARD] Сбрасываем анимацию отправки заявки');
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
      console.error('Error sending psychologist request:', error);
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

  const fetchAdditionalTestResults = async () => {
    // Детектируем Safari для специальной обработки
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    try {
      console.log('🔄 [FETCH RESULTS] Начинаем загрузку результатов дополнительных тестов');
      if (isSafari || isIOS) {
        console.log('🍎 [SAFARI-DETECT] Safari/iOS обнаружен, используем специальную обработку');
      }
      console.log('🔄 [FETCH RESULTS] Текущее состояние testResults:', testResults);
      
      setLoadingTestResults(true);
      
      // Проверяем, что authData?.sessionId существует и является валидным UUID
      if (!authData?.sessionId || authData?.sessionId === 'true' || authData?.sessionId.trim() === '') {
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
      
      // Никнейм уже сохранен в authData через useAuth
      console.log('👤 Никнейм сохранен в authData:', nickname);
      
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
        const resultsMap: {[key: number]: Record<number, number | number[]> | string} = {};
        
        // Проверяем, что recommendedTests загружены
        if (!recommendedTests || recommendedTests.length === 0) {
          console.warn('⚠️ [FETCH RESULTS] recommendedTests ещё не загружены, пропускаем сопоставление результатов');
          setTestResults(resultsMap);
          return;
        }
        
        try {
          data.results.forEach((result: any) => {
            // Проверяем наличие обязательных полей
            if (!result || !result.test_type) {
              console.warn('⚠️ [FETCH RESULTS] Результат не содержит test_type, пропускаем:', result);
              return;
            }
            
            // Ищем тест по test_type (это config.id, например 'bipolar' для HCL-32)
            let testConfig;
            try {
              testConfig = getTestConfig(result.test_type);
            } catch (error) {
              console.error('❌ [FETCH RESULTS] Ошибка при вызове getTestConfig:', error);
              testConfig = null;
            }
            
            if (testConfig) {
              // Находим тест в recommendedTests по URL из конфига
              // recommendedTests содержит объекты с полями id, name, url
              // testConfig содержит source.url, который должен совпадать с t.url
              let test;
              try {
                test = recommendedTests.find(t => {
                  if (!t) return false;
                  
                  // Сначала проверяем по URL (самый надежный способ)
                  if (testConfig.source?.url && t.url && testConfig.source.url === t.url) {
                    return true;
                  }
                  // Fallback: проверяем по name через getTestConfig
                  try {
                    const tConfig = getTestConfig(t.name);
                    if (tConfig && tConfig.id === result.test_type) {
                      return true;
                    }
                  } catch (e) {
                    // Игнорируем ошибки при вызове getTestConfig для t.name
                  }
                  // Еще один fallback: проверяем, содержит ли name теста название из конфига
                  if (t.name && testConfig.name && t.name.toLowerCase().includes(testConfig.name.toLowerCase())) {
                    return true;
                  }
                  return false;
                });
              } catch (error) {
                console.error('❌ [FETCH RESULTS] Ошибка при поиске теста в recommendedTests:', error);
                test = null;
              }
              
              if (test && test.id) {
                // Сохраняем answers как объект (не преобразуем в строку)
                let answersObj: Record<number, number | number[]>;
                if (typeof result.answers === 'string') {
                  try {
                    answersObj = JSON.parse(result.answers);
                  } catch (e) {
                    console.warn('⚠️ [FETCH RESULTS] Не удалось распарсить answers как JSON:', result.answers);
                    // Если не JSON, пропускаем этот результат
                    return;
                  }
                } else if (typeof result.answers === 'object' && result.answers !== null) {
                  answersObj = result.answers;
                } else {
                  console.warn('⚠️ [FETCH RESULTS] Неверный формат answers:', result.answers);
                  return;
                }
                
                // Сохраняем объект answers (не строку)
                resultsMap[test.id] = answersObj;
                console.log(`✅ [FETCH RESULTS] Найден результат для теста ${test.name} (test_type: ${result.test_type}, config.id: ${testConfig.id}, config.name: ${testConfig.name})`);
              } else {
                console.warn(`⚠️ [FETCH RESULTS] Тест с test_type "${result.test_type}" (config.id: ${testConfig.id}, config.name: ${testConfig.name}, config.url: ${testConfig.source?.url}) найден в конфиге, но не найден в recommendedTests`);
                if (recommendedTests && recommendedTests.length > 0) {
                  console.warn(`⚠️ [FETCH RESULTS] Доступные тесты в recommendedTests:`, recommendedTests.map(t => t ? { id: t.id, name: t.name, url: t.url } : null).filter(Boolean));
                }
              }
            } else {
              // Fallback: пытаемся найти по старому способу (по name)
              try {
                const test = recommendedTests.find(t => t && t.name === result.test_type);
                if (test && test.id) {
                  // Сохраняем answers как объект (не преобразуем в строку)
                  let answersObj: Record<number, number | number[]>;
                  if (typeof result.answers === 'string') {
                    try {
                      answersObj = JSON.parse(result.answers);
                    } catch (e) {
                      console.warn('⚠️ [FETCH RESULTS] Не удалось распарсить answers как JSON (fallback):', result.answers);
                      return;
                    }
                  } else if (typeof result.answers === 'object' && result.answers !== null) {
                    answersObj = result.answers;
                  } else {
                    console.warn('⚠️ [FETCH RESULTS] Неверный формат answers (fallback):', result.answers);
                    return;
                  }
                  
                  // Сохраняем объект answers (не строку)
                  resultsMap[test.id] = answersObj;
                  console.log(`✅ [FETCH RESULTS] Найден результат для теста ${test.name} (старый формат)`);
                } else {
                  console.warn(`⚠️ [FETCH RESULTS] Не найден тест с test_type "${result.test_type}"`);
                  if (recommendedTests && recommendedTests.length > 0) {
                    console.warn(`⚠️ [FETCH RESULTS] Доступные тесты в recommendedTests:`, recommendedTests.map(t => t ? { id: t.id, name: t.name, url: t.url } : null).filter(Boolean));
                  }
                }
              } catch (error) {
                console.error('❌ [FETCH RESULTS] Ошибка при fallback поиске:', error);
              }
            }
          });
        } catch (error) {
          console.error('❌ [FETCH RESULTS] Критическая ошибка при обработке результатов:', error);
          // Не прерываем выполнение, просто логируем ошибку
          // resultsMap уже инициализирован как пустой объект выше
        }
        
        // Всегда устанавливаем результаты, даже если они пустые
        try {
          // Очищаем старые результаты перед установкой новых, чтобы гарантировать обновление
          setTestResults({});
          // Небольшая задержка для гарантии обновления состояния
          setTimeout(() => {
            setTestResults(resultsMap);
            console.log('📊 [FETCH RESULTS] Загружено результатов дополнительных тестов:', data.results?.length || 0);
            console.log('📊 [FETCH RESULTS] Новое состояние testResults:', resultsMap);
          }, 50);
        } catch (error) {
          console.error('❌ [FETCH RESULTS] Ошибка при установке testResults:', error);
        }
        
        // Проверка завершенности тестов перенесена в useEffect
        // который срабатывает после загрузки recommendedTests
        console.log('📊 [FETCH RESULTS] Данные из API:', data.results);
      } else {
        console.warn('⚠️ [FETCH RESULTS] API вернул data.success = false');
        setTestResults({});
      }
    } catch (error) {
      console.error('❌ [FETCH RESULTS] Критическая ошибка в fetchAdditionalTestResults:', error);
      // Устанавливаем пустые результаты, чтобы не сломать компонент
      try {
        setTestResults({});
      } catch (setError) {
        console.error('❌ [FETCH RESULTS] Ошибка при установке пустых результатов:', setError);
      }
    } finally {
      try {
        setLoadingTestResults(false);
      } catch (error) {
        console.error('❌ [FETCH RESULTS] Ошибка при установке loading в false:', error);
      }
    }
  };

  // Функции для модального окна
  const openModal = (testId: number) => {
    setCurrentTestId(testId);
    setModalText(testResults[testId] || '');
    setModalVisible(true);
  };

  // Функция для вычисления score из answers
  const calculateTestScore = (config: any, answers: any): number => {
    if (!config || !config.questions || !answers) return 0;
    
    let total = 0;
    
    for (const question of config.questions) {
      const answer = answers[question.id];
      
      if (question.type === 'multiple' && Array.isArray(answer)) {
        // Для множественного выбора суммируем все выбранные значения
        total += answer.reduce((sum: number, val: number) => sum + val, 0);
      } else if (question.type === 'slider' && typeof answer === 'number') {
        // Для слайдера используем значение напрямую
        total += answer;
      } else if (typeof answer === 'number') {
        total += answer;
      }
    }
    
    // Если scoringStrategy = 'average', делим на количество вопросов
    if (config.scoringStrategy === 'average') {
      const answeredQuestions = config.questions.filter((q: any) => answers[q.id] !== undefined).length;
      return answeredQuestions > 0 ? total / answeredQuestions : 0;
    }
    
    return total;
  };

  // Функция для получения интерпретации по score
  const getTestInterpretation = (config: any, score: number): string => {
    if (!config || !config.interpretations) return '';
    
    const interpretation = config.interpretations.find((range: any) => 
      score >= range.min && score <= range.max
    );
    
    if (!interpretation) return '';
    
    // Вычисляем максимальный возможный score
    const maxScore = config.questions.reduce((sum: number, q: any) => {
      if (q.type === 'slider') {
        return sum + (q.max ?? 0);
      }
      if (!q.options || q.options.length === 0) {
        return sum;
      }
      const maxOption = Math.max(...q.options.map((o: any) => o.value));
      return sum + (isNaN(maxOption) ? 0 : maxOption);
    }, 0);
    
    return `Балл: ${score}/${maxScore}, ${interpretation.label}`;
  };

  const showResults = (test: any) => {
    console.log('🔍 [SHOW-RESULTS] Поиск конфига для теста:', {
      name: test.name,
      url: test.url,
      testConfigId: test.testConfigId,
      id: test.id
    });
    
    // Пытаемся найти конфиг разными способами
    let config;
    
    // Сначала пробуем по testConfigId (если передан)
    if (test.testConfigId) {
      config = getTestConfig(test.testConfigId);
      console.log('🔍 [SHOW-RESULTS] Поиск по testConfigId:', test.testConfigId, 'результат:', config ? 'найден' : 'не найден');
    }
    
    // Если не нашли, пробуем по name
    if (!config) {
      config = getTestConfig(test.name);
      console.log('🔍 [SHOW-RESULTS] Поиск по name:', test.name, 'результат:', config ? 'найден' : 'не найден');
    }
    
    // Если не нашли по name, пробуем найти по URL
    if (!config && test.url) {
      config = additionalTests.find((t: any) => t.source?.url === test.url);
      console.log('🔍 [SHOW-RESULTS] Поиск по URL:', test.url, 'результат:', config ? 'найден' : 'не найден');
    }
    
    if (!config) {
      console.error('❌ [SHOW-RESULTS] Конфиг не найден для теста:', {
        name: test.name,
        url: test.url,
        testConfigId: test.testConfigId,
        id: test.id
      });
      // Показываем более информативное сообщение
      message.error(`Конфигурация теста не найдена. Название: ${test.name || 'не указано'}, URL: ${test.url || 'не указан'}`);
      return;
    }
    
    console.log('✅ [SHOW-RESULTS] Конфиг найден:', config.id, config.name);
    
    // Получаем answers из testResults
    const resultData = testResults[test.id];
    if (!resultData) {
      message.info('Результаты теста не найдены');
      return;
    }
    
    // Парсим answers (может быть строкой JSON или объектом)
    let answers: Record<number, number | number[]>;
    try {
      if (typeof resultData === 'string') {
        // Пытаемся распарсить как JSON
        try {
          const parsed = JSON.parse(resultData);
          if (typeof parsed === 'object' && parsed !== null) {
            answers = parsed;
          } else {
            // Если это не объект, возможно это старый формат (просто число)
            const score = parseInt(resultData.replace(/[^0-9]/g, ''));
            if (!isNaN(score)) {
              // Если есть только score, используем его напрямую
              setCurrentTestConfig(config);
              setCurrentTestScore(score);
              setResultsModalVisible(true);
              return;
            }
            message.info('Не удалось распарсить результаты теста');
            return;
          }
        } catch (e) {
          // Если не JSON, возможно это просто число
          const score = parseInt(resultData.replace(/[^0-9]/g, ''));
          if (!isNaN(score)) {
            setCurrentTestConfig(config);
            setCurrentTestScore(score);
            setResultsModalVisible(true);
            return;
          }
          message.info('Не удалось распарсить результаты теста');
          return;
        }
      } else if (typeof resultData === 'object' && resultData !== null) {
        answers = resultData;
      } else {
        message.info('Неверный формат результатов теста');
        return;
      }
    } catch (e) {
      console.error('❌ [SHOW-RESULTS] Ошибка парсинга результатов:', e);
      message.info('Ошибка при обработке результатов теста');
      return;
    }
    
    // Вычисляем score из answers
    const score = calculateTestScore(config, answers);
    
    if (isNaN(score)) {
      message.info('Не удалось вычислить балл теста');
      return;
    }
    
    setCurrentTestConfig(config);
    setCurrentTestScore(score);
    setResultsModalVisible(true);
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
  const truncateText = (text: string | undefined | any, maxLength: number = 100) => {
    if (!text) return '';
    
    // Преобразуем в строку, если это не строка
    let textStr: string;
    if (typeof text === 'string') {
      textStr = text;
    } else if (typeof text === 'number') {
      textStr = String(text);
    } else if (typeof text === 'object') {
      // Если это объект (например, JSONB из БД), преобразуем в строку
      try {
        textStr = JSON.stringify(text);
      } catch (e) {
        textStr = String(text);
      }
    } else {
      textStr = String(text);
    }
    
    if (textStr.length <= maxLength) return textStr;
    return textStr.substring(0, maxLength) + '...';
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
                  Результат теста сохранен!
                </div>
                <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                  Персональный план обновлен с учетом новых данных
                </div>
              </div>
            </div>
          ),
          duration: 4,
          style: {
            marginTop: '20px',
            borderRadius: '12px',
          }
        });
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
      // Создаем прямую ссылку на PDF endpoint
      const pdfUrl = `${window.location.origin}/api/pdf-html/personal-plan`;
      
      // Открываем PDF напрямую по ссылке
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      message.success('Персональный план открыт в новой вкладке!');
    } catch (error) {
      console.error('Error downloading personal plan:', error);
      message.error('Произошла ошибка при скачивании персонального плана');
    } finally {
      setLoadingPersonalPlan(false);
    }
  };

  const downloadPersonalPlanDirect = async () => {
    setLoadingPersonalPlan(true);
    try {
      const response = await apiRequest('api/pdf-html/personal-plan', {
        method: 'POST',
        body: JSON.stringify({ sessionId: authData?.sessionId }),
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        
        downloadPdf(url, 'personal-plan.pdf', 'Персональный план', message.success);
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
      // Создаем прямую ссылку на PDF endpoint
      const pdfUrl = `${window.location.origin}/api/pdf/session-preparation?sessionId=${authData?.sessionId}&specialistType=${specialistType}`;
      
      // Открываем PDF напрямую по ссылке
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      message.success('Подготовка к сеансу открыта в новой вкладке!');
    } catch (error) {
      console.error('Error downloading session preparation:', error);
      message.error('Произошла ошибка при скачивании подготовки к сеансу');
    } finally {
      setLoadingSessionPreparation(false);
    }
  };

  const downloadSessionPreparationDirect = async (specialistType: 'psychologist' | 'psychiatrist') => {
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
        
        downloadPdf(url, `session-preparation-${specialistType}.html`, 'Подготовка к сеансу', message.success);
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
      // Создаем прямую ссылку на PDF endpoint
      const pdfUrl = `${window.location.origin}/api/pdf/psychologist-pdf?sessionId=${authData?.sessionId}`;
      
      // Открываем PDF напрямую по ссылке
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      message.success('PDF для психолога открыт в новой вкладке!');
    } catch (error) {
      console.error('Error downloading psychologist PDF:', error);
      message.error('Произошла ошибка при скачивании PDF для психолога');
    } finally {
      setLoadingPsychologistPdf(false);
    }
  };

  const downloadPsychologistPdfDirect = async () => {
    setLoadingPsychologistPdf(true);
    try {
      const response = await apiRequest('api/pdf/psychologist-pdf', {
        method: 'POST',
        body: JSON.stringify({ sessionId: authData?.sessionId }),
      });

      if (response.ok) {
        const pdfBlob = await response.blob();
        const url = window.URL.createObjectURL(pdfBlob);
        
        downloadPdf(url, 'psychologist-pdf.pdf', 'PDF для психолога', message.success);
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
              backgroundColor: '#4F958B',
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
                    backgroundColor: '#4F958B',
                    borderColor: '#4F958B',
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
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
              }}>
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
                  marginBottom: '15px',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    Подбор психолога
                  </Title>
                <Text style={{ 
                  color: '#7B8794', 
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '25px',
                  lineHeight: '1.5'
                }}>
                  Оставь заявку, и мы подберём психологов под твою ситуацию и бюджет
                </Text>
                  <Button 
                    type="primary" 
                  onClick={() => window.open('https://forms.yandex.ru/u/693b277feb614619417efad0', '_blank')}
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
                  Оставить заявку
                  </Button>
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
                  <FileTextOutlined style={{ fontSize: '24px', color: '#4F958B' }} />
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
                    backgroundColor: '#4F958B',
                    borderColor: '#4F958B',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  {loadingPsychologistPdf ? 'Генерируем...' : 'Скачать PDF'}
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
            
            {/* Кнопки Telegram для разблокированного плана */}
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
            {/* Section title - показываем только после загрузки тестов */}
            {showTests && recommendedTests.length > 0 && (
              <>
            <Title level={3} style={{ 
              color: '#2C3E50',
              fontSize: '24px',
              fontWeight: '600',
                  marginBottom: '20px',
              textAlign: 'center'
            }}>
              Рекомендуемые тесты
            </Title>
                
                {/* Плашка с предупреждением */}
                <div style={{
                  backgroundColor: '#FFF7E6',
                  border: '1px solid #FFE58F',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '40px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <BulbOutlined style={{ 
                    fontSize: '20px', 
                    color: '#FAAD14',
                    marginTop: '2px',
                    flexShrink: 0
                  }} />
                  <Text style={{ 
                    color: '#8C6E00',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    Результаты тестов носят ознакомительный характер и не являются диагнозом. Окончательное заключение может сделать только специалист.
                  </Text>
                </div>
              </>
            )}

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
                        updatePersonalPlanUnlocked(true);
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
                    backgroundColor: '#4F958B',
                    borderColor: '#4F958B',
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
                    Уточняем, какие тесты нужны...
                  </Text>
                </div>
              </div>
            )}

            {/* Tests grid */}
            {showTests && !loadingTestResults && (
              <>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                  gap: '20px',
                  marginBottom: '40px'
                }}>
                  {Array.isArray(recommendedTests) && recommendedTests.filter(t => t && t.id).map((test) => {
                    if (!test || !test.id) return null;
                    
                    let testConfigId;
                    let testConfig;
                    try {
                      // Сначала пробуем найти по name
                      testConfig = getTestConfig(test.name);
                      
                      // Если не нашли, пробуем найти по URL
                      if (!testConfig && test.url) {
                        testConfig = additionalTests.find((t: any) => t.source?.url === test.url);
                      }
                      
                      testConfigId = testConfig?.id || test.id;
                    } catch (error) {
                      console.error('❌ [RENDER] Ошибка при вызове getTestConfig для теста:', test.name, error);
                      testConfigId = test.id;
                    }
                    
                    return (
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
                              backgroundColor: testResults[test.id] ? '#4F958B' : '#E8E8E8',
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
                      
                      {/* Test result display - показываем интерпретацию вместо JSON */}
                      {testResults[test.id] && (() => {
                        const resultData = testResults[test.id];
                        let interpretationText = '';
                        
                        try {
                          // Используем кэшированный testConfig (если был найден выше) или ищем заново
                          let config = testConfig;
                          
                          if (!config) {
                            // Пробуем найти по testConfigId
                            config = getTestConfig(testConfigId || test.name);
                          }
                          
                          // Если не нашли, пробуем найти по URL
                          if (!config && test.url) {
                            config = additionalTests.find((t: any) => t.source?.url === test.url);
                          }
                          
                          if (!config) {
                            console.warn('⚠️ [RENDER] Конфиг не найден для testConfigId:', testConfigId, 'test.name:', test.name, 'test.url:', test.url);
                            return null;
                          }
                          
                          // Парсим answers если это строка
                          let answers: Record<number, number | number[]>;
                          if (typeof resultData === 'string') {
                            try {
                              answers = JSON.parse(resultData);
                            } catch (e) {
                              // Если не JSON, возможно это старый формат - пропускаем
                              return null;
                            }
                          } else if (typeof resultData === 'object' && resultData !== null) {
                            answers = resultData;
                          } else {
                            return null;
                          }
                          
                          // Вычисляем score и интерпретацию
                          const score = calculateTestScore(config, answers);
                          interpretationText = getTestInterpretation(config, score);
                        } catch (e) {
                          console.error('❌ [RENDER] Ошибка при вычислении интерпретации:', e);
                          return null;
                        }
                        
                        if (!interpretationText) return null;
                        
                        return (
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
                              {interpretationText}
                            </Text>
                          </div>
                        );
                      })()}
                      
                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {!testResults[test.id] ? (
                        <Button
                            type="primary"
                            onClick={() => navigate(`/test/${testConfigId}?sessionId=${authData?.sessionId || ''}`)}
                            style={{
                              flex: 1,
                              height: '40px',
                              borderRadius: '20px',
                              backgroundColor: '#4F958B',
                              borderColor: '#4F958B',
                              color: '#ffffff',
                              fontWeight: '500'
                            }}
                            icon={<ArrowRightOutlined />}
                          >
                            Начать
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                try {
                                  // Передаем testConfigId для более точного поиска конфига
                                  showResults({ ...test, testConfigId });
                                } catch (error) {
                                  console.error('❌ [RENDER] Ошибка при показе результатов:', error);
                                  message.error('Ошибка при открытии результатов');
                                }
                              }}
                          style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '20px',
                            backgroundColor: '#E8F4FD',
                            borderColor: '#E8F4FD',
                            color: '#1890FF',
                            fontWeight: '500'
                          }}
                              icon={<EyeOutlined />}
                        >
                              Результаты
                        </Button>
                        <Button
                              onClick={() => navigate(`/test/${testConfigId}?sessionId=${authData?.sessionId || ''}`)}
                          style={{
                            flex: 1,
                            height: '40px',
                            borderRadius: '20px',
                                backgroundColor: '#F0F2F5',
                                borderColor: '#F0F2F5',
                                color: '#595959',
                            fontWeight: '500'
                          }}
                              icon={<ReloadOutlined />}
                        >
                              Заново
                        </Button>
                          </>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>


        {/* Кнопки Telegram для заблокированного плана */}
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
                backgroundColor: '#4F958B',
                borderColor: '#4F958B',
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
              padding: '30px',
              maxHeight: '90vh',
              overflow: 'auto'
            },
            body: {
              maxHeight: 'calc(90vh - 120px)',
              overflow: 'auto'
            }
          }}
          style={{
            top: '20px'
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

        {currentTestConfig && (
          <TestResultsModal
            visible={resultsModalVisible}
            onCancel={() => setResultsModalVisible(false)}
            config={currentTestConfig}
            score={currentTestScore}
            onRetry={() => {
              setResultsModalVisible(false);
              navigate(`/test/${currentTestConfig.id}?sessionId=${authData?.sessionId}`);
            }}
          />
        )}
        </div>
        )}
        
        {/* Анимация генерации документов */}
        <GenerationAnimation 
          isGenerating={isGenerating}
          currentStep={generationStep}
          totalSteps={3}
          stepNames={['Персональный план', 'Подготовка к сеансам с психологом и психиатром', 'PDF для психолога']}
        />
      </div>
    </div>
  );
};

export default DashboardPage;