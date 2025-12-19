import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Card, Space, Layout, message } from 'antd';
import { 
  CheckOutlined, 
  ArrowLeftOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { additionalTests, getTestConfig, TestConfig } from '../config/tests';
import TestResultsModal from '../components/TestResultsModal';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

// Тестовый sessionId для демонстрации
const TEST_SESSION_ID = 'test-demo-session-12345';

const TestOfTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<{[key: string]: number}>({});
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [currentTestConfig, setCurrentTestConfig] = useState<TestConfig | null>(null);
  const [currentTestScore, setCurrentTestScore] = useState<number>(0);

  // Показать результаты теста
  const showResults = (test: TestConfig) => {
    const score = testResults[test.id];
    if (score !== undefined) {
      setCurrentTestConfig(test);
      setCurrentTestScore(score);
      setResultsModalVisible(true);
    } else {
      message.info('Сначала пройдите тест');
    }
  };

  // Генерация случайного результата для демо
  const generateRandomResult = (test: TestConfig) => {
    const maxScore = test.questions.reduce((sum, q) => {
      const maxOption = Math.max(...q.options.map(o => o.value));
      return sum + maxOption;
    }, 0);
    const randomScore = Math.floor(Math.random() * (maxScore + 1));
    setTestResults(prev => ({ ...prev, [test.id]: randomScore }));
    message.success(`Результат для "${test.name}": ${randomScore} баллов`);
  };

  // Сброс результата
  const resetResult = (testId: string) => {
    setTestResults(prev => {
      const newResults = { ...prev };
      delete newResults[testId];
      return newResults;
    });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Content style={{ padding: '20px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
              type="text"
            >
              Назад
            </Button>
            <Title level={2} style={{ margin: 0, color: '#2C3E50' }}>
              🧪 Тест всех тестов
            </Title>
          </div>

          {/* Info card */}
          <Card style={{ borderRadius: 16, background: '#E8F4FD', border: 'none' }}>
            <Paragraph style={{ margin: 0 }}>
              <strong>Это демо-страница</strong> для просмотра всех {additionalTests.length} доступных тестов.
              <br />
              Вы можете: начать тест, сгенерировать случайный результат (для просмотра модалки результатов), 
              или сбросить результат.
              <br /><br />
              <Text type="secondary">Session ID для тестов: <code>{TEST_SESSION_ID}</code></Text>
            </Paragraph>
          </Card>

          {/* Stats */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <Card style={{ borderRadius: 12, minWidth: 150, textAlign: 'center' }}>
              <Text type="secondary">Всего тестов</Text>
              <Title level={2} style={{ margin: '5px 0', color: '#4F958B' }}>{additionalTests.length}</Title>
            </Card>
            <Card style={{ borderRadius: 12, minWidth: 150, textAlign: 'center' }}>
              <Text type="secondary">Пройдено</Text>
              <Title level={2} style={{ margin: '5px 0', color: '#52c41a' }}>{Object.keys(testResults).length}</Title>
            </Card>
            <Card style={{ borderRadius: 12, minWidth: 150, textAlign: 'center' }}>
              <Text type="secondary">Вопросов всего</Text>
              <Title level={2} style={{ margin: '5px 0', color: '#1890ff' }}>
                {additionalTests.reduce((sum, t) => sum + t.questions.length, 0)}
              </Title>
            </Card>
          </div>

          {/* Tests list */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px'
          }}>
            {additionalTests.map((test, index) => (
              <Card 
                key={test.id}
                style={{
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  border: testResults[test.id] !== undefined ? '2px solid #4F958B' : '1px solid #f0f0f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  {/* Number & Status */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: testResults[test.id] !== undefined ? '#4F958B' : '#E8E8E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: testResults[test.id] !== undefined ? 'white' : '#666'
                  }}>
                    {testResults[test.id] !== undefined ? (
                      <CheckOutlined style={{ fontSize: '18px' }} />
                    ) : (
                      <span style={{ fontWeight: 'bold' }}>{index + 1}</span>
                    )}
                  </div>

                  {/* Test info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <Text strong style={{ fontSize: '16px', color: '#2C3E50' }}>
                        {test.name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({test.questions.length} вопросов)
                      </Text>
                    </div>
                    
                    <Text style={{ color: '#5D6D7E', display: 'block', marginBottom: '10px' }}>
                      {test.title}
                    </Text>
                    
                    <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '15px' }}>
                      {test.description}
                    </Text>

                    {/* Result display */}
                    {testResults[test.id] !== undefined && (
                      <div style={{ 
                        padding: '12px 16px', 
                        backgroundColor: '#F0FFF4', 
                        borderRadius: '12px',
                        marginBottom: '15px',
                        border: '1px solid #B7EB8F'
                      }}>
                        <Text strong style={{ color: '#52c41a' }}>
                          ✓ Результат: {testResults[test.id]} баллов
                        </Text>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => navigate(`/test/${test.id}?sessionId=${TEST_SESSION_ID}`)}
                        style={{
                          borderRadius: '20px',
                          backgroundColor: '#4F958B',
                          borderColor: '#4F958B'
                        }}
                      >
                        Начать тест
                      </Button>

                      <Button
                        icon={<CheckOutlined />}
                        onClick={() => generateRandomResult(test)}
                        style={{ borderRadius: '20px' }}
                      >
                        Случайный результат
                      </Button>

                      {testResults[test.id] !== undefined && (
                        <>
                          <Button
                            icon={<EyeOutlined />}
                            onClick={() => showResults(test)}
                            style={{ borderRadius: '20px', borderColor: '#1890ff', color: '#1890ff' }}
                          >
                            Смотреть результаты
                          </Button>
                          <Button
                            icon={<ReloadOutlined />}
                            onClick={() => resetResult(test.id)}
                            danger
                            style={{ borderRadius: '20px' }}
                          >
                            Сбросить
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary table */}
          <Card style={{ borderRadius: 16 }}>
            <Title level={4}>📋 Сводка по всем тестам</Title>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>#</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>ID</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>Название</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e8e8e8' }}>Вопросов</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e8e8e8' }}>Интерпретаций</th>
                  </tr>
                </thead>
                <tbody>
                  {additionalTests.map((test, index) => (
                    <tr key={test.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e8e8e8' }}>{index + 1}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e8e8e8' }}>
                        <code>{test.id}</code>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e8e8e8' }}>
                        <strong>{test.name}</strong>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>{test.title}</Text>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e8e8e8' }}>
                        {test.questions.length}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e8e8e8' }}>
                        {test.interpretations.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Space>
      </Content>

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
    </Layout>
  );
};

export default TestOfTestsPage;

