import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Spin, Modal, Input, message } from 'antd';
import { 
  CheckOutlined, 
  BulbOutlined,
  ArrowRightOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { additionalTests, getTestConfig, TestConfig } from '../config/tests';
import TestResultsModal from '../components/TestResultsModal';
import TelegramButton from '../components/TelegramButton';
import Footer from '../components/Footer';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Тестовый sessionId для демонстрации
const TEST_SESSION_ID = 'test-demo-session-12345';

// Функция для обрезки текста
const truncateText = (text: string | undefined, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const TestOfTestsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Преобразуем additionalTests в формат, совместимый с DashboardPage
  const allTests = additionalTests.map((test, index) => ({
    id: index + 1,
    name: test.name,
    description: test.description,
    url: test.source?.url || '',
    configId: test.id
  }));

  const [testResults, setTestResults] = useState<{[key: number]: string}>({});
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [currentTestConfig, setCurrentTestConfig] = useState<TestConfig | null>(null);
  const [currentTestScore, setCurrentTestScore] = useState<number>(0);
  
  // Модалка для ввода результата (как в оригинале)
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<number | null>(null);
  const [modalText, setModalText] = useState('');

  const allTestsCompleted = Object.keys(testResults).length >= allTests.length;

  // Открыть модалку для ввода результата
  const openModal = (testId: number) => {
    setCurrentTestId(testId);
    setModalText(testResults[testId] || '');
    setModalVisible(true);
  };

  // Закрыть модалку
  const closeModal = () => {
    setModalVisible(false);
    setCurrentTestId(null);
    setModalText('');
  };

  // Сохранить результат из модалки
  const saveModalResult = () => {
    if (currentTestId && modalText.trim()) {
      setTestResults(prev => ({ ...prev, [currentTestId]: modalText.trim() }));
      message.success('Результат сохранён');
      closeModal();
    }
  };

  // Показать результаты теста
  const showResults = (test: any) => {
    const config = getTestConfig(test.name);
    if (config) {
      const result = testResults[test.id];
      const score = typeof result === 'string' ? parseInt(result.replace(/[^0-9]/g, '')) : Number(result);
      
      if (!isNaN(score)) {
        setCurrentTestConfig(config);
        setCurrentTestScore(score);
        setResultsModalVisible(true);
      } else {
        message.info('Результаты доступны в текстовом виде: ' + result);
      }
    } else {
      message.info('Результаты доступны в текстовом виде: ' + testResults[test.id]);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      {/* Header with Nickname */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        maxWidth: '1200px',
        margin: '0 auto 30px auto',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Text strong style={{ 
            fontSize: '18px', 
            color: '#2C3E50' 
          }}>
            🧪 Тест-страница (демо)
          </Text>
        </div>
        <Button 
          type="link" 
          onClick={() => navigate(-1)}
          style={{ 
            color: '#7B8794',
            fontSize: '14px'
          }}
        >
          ← Назад
        </Button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Mascot message */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img 
            src="/lumi.png" 
            alt="Луми" 
            style={{ 
              width: '80px', 
              height: '80px', 
              marginBottom: '15px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0'
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '25px 30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <Text style={{ 
              color: '#2C3E50', 
              fontSize: '16px', 
              lineHeight: '1.6',
              display: 'block'
            }}>
              Привет! Это демо-страница со всеми {allTests.length} тестами. Здесь ты можешь протестировать любой тест без необходимости регистрации. Пройди тесты и посмотри, как работают результаты!
            </Text>
          </div>
        </div>

        <div>
          {/* Section title */}
          <Title level={3} style={{ 
            color: '#2C3E50',
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Все доступные тесты
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

          {/* Completion block */}
          {allTestsCompleted && (
            <div 
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
                disabled
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  padding: '0 30px',
                  marginTop: '20px',
                  borderRadius: '25px',
                  backgroundColor: '#4F958B',
                  borderColor: '#4F958B',
                  color: '#ffffff',
                  opacity: 0.6
                }}
              >
                Перейти к персональному плану (отключено в демо)
              </Button>
            </div>
          )}

          {/* Инструкция */}
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
              Нажми "Начать" чтобы пройти тест, или "Ввести вручную" чтобы указать результат самостоятельно
            </Text>
          </div>
          
          {/* Tests grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '20px',
            marginBottom: '40px'
          }}>
            {allTests.map((test) => (
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
                      {test.name}
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
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {!testResults[test.id] ? (
                    <>
                      <Button
                        type="primary"
                        onClick={() => navigate(`/test/${test.configId}?sessionId=${TEST_SESSION_ID}`)}
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
                      <Button
                        onClick={() => openModal(test.id)}
                        style={{
                          flex: 1,
                          height: '40px',
                          borderRadius: '20px',
                          backgroundColor: '#F0F2F5',
                          borderColor: '#F0F2F5',
                          color: '#595959',
                          fontWeight: '500'
                        }}
                      >
                        Ввести вручную
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => showResults(test)}
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
                        onClick={() => navigate(`/test/${test.configId}?sessionId=${TEST_SESSION_ID}`)}
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
            ))}
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
              padding: '30px'
            }
          }}
        >
          <div style={{ marginTop: '20px' }}>
            <Text style={{ 
              display: 'block', 
              marginBottom: '15px',
              color: '#7B8794',
              fontSize: '14px'
            }}>
              Введите результат теста (например: "46 баллов" или "Умеренная тревожность")
            </Text>
            <TextArea
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder="Например: 46 баллов"
              rows={4}
              style={{
                borderRadius: '12px',
                fontSize: '16px',
                padding: '15px'
              }}
            />
          </div>
        </Modal>

        {/* Results Modal */}
        {currentTestConfig && (
          <TestResultsModal
            visible={resultsModalVisible}
            onCancel={() => setResultsModalVisible(false)}
            config={currentTestConfig}
            score={currentTestScore}
            onRetry={() => {
              setResultsModalVisible(false);
              navigate(`/test/${currentTestConfig.id}?sessionId=${TEST_SESSION_ID}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TestOfTestsPage;
