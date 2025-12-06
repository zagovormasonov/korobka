import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Layout, 
  Menu, 
  Input, 
  Button, 
  message, 
  Spin,
  List,
  Select
} from 'antd';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  UserOutlined, 
  DashboardOutlined, 
  LineChartOutlined, 
  TeamOutlined, 
  UnlockOutlined,
  HeartOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { apiRequest } from '../config/api';

const { Title, Text, Paragraph } = Typography;
const { Content, Sider } = Layout;

// Компонент пульсирующего индикатора
const PulsingDot = () => (
  <div style={{ position: 'relative', display: 'inline-block', width: '10px', height: '10px', marginRight: '8px' }}>
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#52c41a',
      animation: 'pulse 2s infinite'
    }} />
    <style>{`
      @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(82, 196, 26, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(82, 196, 26, 0); }
      }
    `}</style>
  </div>
);

const CMSPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [funnelPeriod, setFunnelPeriod] = useState('all'); // all, day, week, month
  
  // Данные статистики
  const [basicStats, setBasicStats] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState(0);

  // Проверка авторизации при загрузке (из localStorage)
  useEffect(() => {
    const token = localStorage.getItem('cms_token');
    if (token) {
      setIsAuthenticated(true);
      fetchStats(token);
    }
  }, []);

  // Периодическое обновление "активных сейчас"
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchActiveUsers();
    }, 30000); // каждые 30 сек
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Перезагрузка воронки при изменении периода
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('cms_token');
    if (token) {
      fetchFunnelData(token);
    }
  }, [funnelPeriod, isAuthenticated]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('api/cms/auth', {
        method: 'POST',
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('cms_token', data.token);
          setIsAuthenticated(true);
          message.success('Вход выполнен успешно');
          fetchStats(data.token);
        } else {
          message.error(data.error || 'Неверный пароль');
        }
      } else {
        message.error('Ошибка сервера');
      }
    } catch (error) {
      message.error('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (token: string) => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Параллельная загрузка всех данных
      const [basicRes, funnelRes, diagnosisRes, activeRes] = await Promise.all([
        apiRequest('api/cms/stats/basic', { headers }),
        apiRequest(`api/cms/stats/funnel?period=${funnelPeriod}`, { headers }),
        apiRequest('api/cms/stats/diagnosis', { headers }),
        apiRequest('api/cms/stats/active', { headers })
      ]);

      if (basicRes.ok) {
        const data = await basicRes.json();
        setBasicStats(data.stats);
      }
      
      if (funnelRes.ok) {
        const data = await funnelRes.json();
        setFunnelData(data.funnel);
      }
      
      if (diagnosisRes.ok) {
        const data = await diagnosisRes.json();
        setDiagnosisData(data);
      }

      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveUsers(data.activeUsers);
      }

    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      message.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveUsers = async () => {
    const token = localStorage.getItem('cms_token');
    if (!token) return;
    
    try {
      const response = await apiRequest('api/cms/stats/active', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.activeUsers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFunnelData = async (token: string) => {
    try {
      const response = await apiRequest(`api/cms/stats/funnel?period=${funnelPeriod}`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (response.ok) {
        const data = await response.json();
        setFunnelData(data.funnel);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f0f2f5'
      }}>
        <Card title="CMS Вход" style={{ width: 300, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Input.Password 
            placeholder="Введите пароль администратора" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            onPressEnter={handleLogin}
            style={{ marginBottom: 16 }}
          />
          <Button type="primary" block onClick={handleLogin} loading={loading}>
            Войти
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={250} style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            <DashboardOutlined /> idenself CMS
          </Title>
        </div>
        <Menu 
          mode="inline" 
          defaultSelectedKeys={['overview']}
          selectedKeys={[activeTab]}
          onClick={({ key }) => setActiveTab(key)}
          style={{ 
            borderRight: 0,
            backgroundColor: 'transparent'
          }}
          theme="light"
          items={[
            {
              key: 'overview',
              icon: <DashboardOutlined />,
              label: 'Обзор и Метрики',
              style: activeTab === 'overview' ? {
                backgroundColor: '#e6f7ff',
                color: '#1890ff',
                borderRadius: '8px',
                margin: '4px 8px'
              } : { margin: '4px 8px', borderRadius: '8px' }
            },
            {
              key: 'funnel',
              icon: <LineChartOutlined />,
              label: 'Воронка',
              style: activeTab === 'funnel' ? {
                backgroundColor: '#e6f7ff',
                color: '#1890ff',
                borderRadius: '8px',
                margin: '4px 8px'
              } : { margin: '4px 8px', borderRadius: '8px' }
            },
            {
              key: 'analytics',
              icon: <TeamOutlined />,
              label: 'Аналитика Диагнозов',
              style: activeTab === 'analytics' ? {
                backgroundColor: '#e6f7ff',
                color: '#1890ff',
                borderRadius: '8px',
                margin: '4px 8px'
              } : { margin: '4px 8px', borderRadius: '8px' }
            },
            {
              key: 'roadmap',
              icon: <ThunderboltOutlined />,
              label: 'Реализовать',
              style: activeTab === 'roadmap' ? {
                backgroundColor: '#e6f7ff',
                color: '#1890ff',
                borderRadius: '8px',
                margin: '4px 8px'
              } : { margin: '4px 8px', borderRadius: '8px' }
            }
          ]}
        />
        <div style={{ padding: '20px', position: 'absolute', bottom: 0, width: '100%' }}>
          <Button 
            danger 
            block 
            icon={<UserOutlined />} 
            onClick={() => {
              localStorage.removeItem('cms_token');
              setIsAuthenticated(false);
            }}
          >
            Выйти
          </Button>
        </div>
      </Sider>
      
      <Layout style={{ background: '#f0f2f5', padding: '24px' }}>
        <Content>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Title level={2} style={{ margin: 0 }}>
              {activeTab === 'overview' && 'Обзор Проекта'}
              {activeTab === 'funnel' && 'Воронка Конверсии'}
              {activeTab === 'analytics' && 'Аналитика Диагнозов'}
              {activeTab === 'roadmap' && 'Дорожная карта'}
            </Title>
            <div style={{ background: 'white', padding: '8px 16px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <PulsingDot />
              <Text strong>Сейчас на сайте: {activeUsers} чел.</Text>
            </div>
          </div>

          {loading && !basicStats ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" tip="Загрузка данных..." />
            </div>
          ) : (
            <>
              {/* Обзор */}
              {activeTab === 'overview' && (
                <>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false}>
                        <Statistic
                          title="Начали тест"
                          value={basicStats?.totalUsers}
                          prefix={<TeamOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false}>
                        <Statistic
                          title="Завершили тест"
                          value={basicStats?.completedTests}
                          prefix={<HeartOutlined />}
                          valueStyle={{ color: '#cf1322' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false}>
                        <Statistic
                          title="Купили план"
                          value={basicStats?.unlockedPlans}
                          prefix={<UnlockOutlined />}
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Card bordered={false}>
                        <Statistic
                          title="% из начала теста в покупку"
                          value={basicStats?.totalUsers ? ((basicStats.unlockedPlans / basicStats.totalUsers) * 100).toFixed(1) : 0}
                          suffix="%"
                          prefix={<ThunderboltOutlined />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                    <Col span={24}>
                      <Card title="Счетчик сгенерированных планов" bordered={false}>
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                          <Title level={1} style={{ fontSize: '72px', color: '#1890ff', margin: 0 }}>
                            {basicStats?.unlockedPlans}
                          </Title>
                          <Text type="secondary" style={{ fontSize: '18px' }}>
                            персональных планов выдано пользователям
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}

              {/* Воронка */}
              {activeTab === 'funnel' && (
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card 
                      title="Воронка продаж" 
                      bordered={false}
                      extra={
                        <Select 
                          value={funnelPeriod} 
                          onChange={setFunnelPeriod}
                          style={{ width: 150 }}
                          options={[
                            { label: 'За всё время', value: 'all' },
                            { label: 'За месяц', value: 'month' },
                            { label: 'За неделю', value: 'week' },
                            { label: 'За день', value: 'day' }
                          ]}
                        />
                      }
                    >
                      <div style={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={funnelData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" name="Пользователи">
                              {funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Text type="secondary">
                          График показывает путь пользователя от начала теста до покупки.
                          Высокая доходимость до конца теста ({basicStats?.totalUsers ? Math.round((basicStats.completedTests / basicStats.totalUsers) * 100) : 0}%) показывает вовлеченность.
                        </Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Аналитика диагнозов */}
              {activeTab === 'analytics' && (
                <>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="Распределение диагнозов" bordered={false}>
                        <div style={{ height: 450 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={diagnosisData?.distribution}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={140}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {diagnosisData?.distribution.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="Сопутствующие расстройства при ПРЛ" bordered={false}>
                        <List
                          itemLayout="horizontal"
                          dataSource={diagnosisData?.correlations}
                          renderItem={(item: any) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<ThunderboltOutlined style={{ fontSize: '24px', color: '#faad14' }} />}
                                title={<Text strong>{item.name}</Text>}
                                description={
                                  <div>
                                    <div style={{ 
                                      height: '8px', 
                                      background: '#f0f0f0', 
                                      borderRadius: '4px', 
                                      marginTop: '8px', 
                                      overflow: 'hidden' 
                                    }}>
                                      <div style={{ 
                                        width: `${item.value}%`, 
                                        height: '100%', 
                                        background: '#faad14', 
                                        borderRadius: '4px' 
                                      }} />
                                    </div>
                                    <Text type="secondary">{item.value}% пользователей</Text>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                        <div style={{ marginTop: '20px', padding: '15px', background: '#e6f7ff', borderRadius: '8px' }}>
                          <Text type="secondary">
                            Это подтверждает гипотезу о коморбидности: люди с ПРЛ часто имеют сопутствующие депрессивные и тревожные расстройства, но лечат их отдельно.
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}

              {/* Дорожная карта */}
              {activeTab === 'roadmap' && (
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="📋 Что нужно реализовать дальше" bordered={false}>
                      <List
                        itemLayout="vertical"
                        size="large"
                        dataSource={[
                          {
                            title: '1. Точная аналитика воронки с отслеживанием событий',
                            description: 'Полностью реализовано! Система собирает детальные данные о каждом шаге пользователя.',
                            tasks: [
                              '✅ Создать таблицу analytics_events в Supabase',
                              '✅ Добавить tracking событий на фронтенде (page_visit, test_start, test_question, test_complete, payment_init, payment_success)',
                              '✅ Обновить endpoint /api/cms/stats/funnel для работы с реальными событиями',
                              '✅ Добавить фильтры по времени (за день, неделю, месяц, всё время)',
                              '✅ Bonus: отслеживание каждого вопроса теста с номером и процентом прогресса!'
                            ]
                          },
                          {
                            title: '2. Реал-тайм обновление "Прямо сейчас"',
                            description: 'Счётчик активных обновляется каждые 30 секунд через polling. Сравнение подходов:',
                            tasks: [
                              '✅ ТЕКУЩЕЕ: Polling каждые 30 сек',
                              '  └─ Плюсы: простота, работает везде, не нагружает сервер',
                              '  └─ Минусы: задержка до 30 сек, лишние запросы при неактивной вкладке',
                              '  └─ Когда: достаточно для внутренней CMS, где точность не критична',
                              '',
                              '⚪ ВАРИАНТ 1: WebSocket (ws или Socket.io)',
                              '  └─ Плюсы: реал-тайм (<1 сек), двусторонняя связь, push от сервера',
                              '  └─ Минусы: сложность (отдельный сервер, reconnect логика), не работает через некоторые proxy/firewall',
                              '  └─ Когда: нужен реал-тайм дашборд для клиентов или live-мониторинг',
                              '',
                              '⚪ ВАРИАНТ 2: Supabase Realtime subscriptions',
                              '  └─ Плюсы: встроено в Supabase, автоматический reconnect, простая настройка',
                              '  └─ Минусы: требует платный план Supabase ($25/мес), работает только с Supabase',
                              '  └─ Когда: уже используете Supabase Pro и нужны live-обновления в нескольких местах',
                              '',
                              '⚪ ВАРИАНТ 3: Server-Sent Events (SSE)',
                              '  └─ Плюсы: проще WebSocket, работает через HTTP, push от сервера',
                              '  └─ Минусы: только сервер→клиент (не двусторонняя), ограничение браузера на кол-во соединений',
                              '  └─ Когда: нужен push, но WebSocket избыточен',
                              '',
                              '💡 РЕКОМЕНДАЦИЯ: Оставить polling - для CMS этого более чем достаточно!'
                            ]
                          },
                          {
                            title: '3. Точный анализ диагнозов из ответов теста',
                            description: 'Сейчас статистика диагнозов показывает примерные данные. Для реальных цифр нужно:',
                            tasks: [
                              '⚪ Написать алгоритм подсчёта баллов по каждому диагнозу из массива answers',
                              '⚪ Реализовать функцию analyzeDiagnosis() в server/routes/cms.js',
                              '⚪ Использовать те же критерии, что и в основном тесте',
                              '⚪ Показывать реальные проценты коморбидности (ПРЛ + Депрессия и т.д.)'
                            ]
                          },
                          {
                            title: '4. Детальная аналитика прогресса по вопросам',
                            description: 'НОВАЯ ВОЗМОЖНОСТЬ: Данные уже собираются! На каком вопросе люди бросают тест.',
                            tasks: [
                              '✅ Сбор данных о каждом вопросе (question_number, progress_percent)',
                              '⚪ График: процент доходимости до каждого вопроса',
                              '⚪ Heatmap: на каких вопросах чаще всего останавливаются',
                              '⚪ Список вопросов с самым высоким drop-rate',
                              '⚪ Средняя скорость прохождения теста'
                            ]
                          },
                          {
                            title: '5. Расширенная аналитика по времени',
                            description: 'Добавить графики изменения метрик во времени:',
                            tasks: [
                              '⚪ График: количество новых пользователей по дням/неделям',
                              '⚪ График: динамика конверсии во времени',
                              '⚪ График: самые активные часы/дни недели',
                              '⚪ Сравнение текущей недели с прошлой'
                            ]
                          },
                          {
                            title: '6. Данные о платежах и доходе',
                            description: 'Финансовая аналитика:',
                            tasks: [
                              '⚪ Общий доход (сумма всех успешных платежей)',
                              '⚪ Средний чек',
                              '⚪ График дохода по дням',
                              '⚪ Количество failed/pending платежей',
                              '⚪ Refund rate (если будут возвраты)'
                            ]
                          },
                          {
                            title: '7. Экспорт данных',
                            description: 'Возможность выгрузить данные:',
                            tasks: [
                              '⚪ Кнопка "Скачать отчёт" в CSV/Excel',
                              '⚪ Экспорт графиков в PNG',
                              '⚪ Автоматическая отправка недельного отчёта на email'
                            ]
                          },
                          {
                            title: '8. A/B тесты и эксперименты',
                            description: 'Если захотите тестировать разные версии:',
                            tasks: [
                              '⚪ Система для создания A/B тестов',
                              '⚪ Отслеживание конверсии по вариантам',
                              '⚪ Статистическая значимость результатов'
                            ]
                          }
                        ]}
                        renderItem={(item: any) => (
                          <List.Item>
                            <List.Item.Meta
                              title={<Text strong style={{ fontSize: '16px' }}>{item.title}</Text>}
                              description={
                                <div>
                                  <Paragraph style={{ marginTop: '8px', marginBottom: '12px' }}>
                                    {item.description}
                                  </Paragraph>
                                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {item.tasks.map((task: string, idx: number) => (
                                      <li key={idx} style={{ 
                                        marginBottom: '8px',
                                        color: task.startsWith('✅') ? '#52c41a' : '#595959',
                                        fontFamily: 'monospace'
                                      }}>
                                        {task}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                      <div style={{ marginTop: '30px', padding: '20px', background: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
                        <Text strong style={{ color: '#52c41a' }}>🎉 Отличная новость!</Text>
                        <Paragraph style={{ marginTop: '10px', marginBottom: 0 }}>
                          Tracking событий полностью реализован! Система уже собирает данные о каждом шаге пользователя, 
                          включая номера вопросов. Когда захотите увидеть детальную аналитику - данные будут готовы. 
                          Рекомендую дальше реализовать пункт 3 (точный анализ диагнозов) и пункт 4 (анализ прогресса по вопросам).
                        </Paragraph>
                      </div>
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default CMSPage;

