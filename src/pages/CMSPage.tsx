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
  Select,
  Table,
  Tag,
  Space,
  Tooltip,
  Switch,
  Checkbox,
  DatePicker,
  Modal
} from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  UserOutlined,
  DashboardOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LeftOutlined,
  RightOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import { apiRequest } from '../config/api';
import { io, Socket } from 'socket.io-client';

// Настройка dayjs
dayjs.locale('ru');
dayjs.extend(weekday);
dayjs.extend(isoWeek);

const { Title, Text, Paragraph } = Typography;
const { Content, Sider } = Layout;

// Типы данных
interface BasicStats {
  totalUsers: number;
  completedTests: number;
  unlockedPlans: number;
}

interface FunnelDataItem {
  step: string;
  users: number;
  stage: string;
}

interface DiagnosisDistributionItem {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Индексная сигнатура для совместимости с recharts
}

interface DiagnosisData {
  distribution: DiagnosisDistributionItem[];
  correlations?: Array<{ name: string; value: number }>;
}

interface User {
  sessionId: string;
  nickname: string;
  hasPassword: boolean;
  password: string | null;
  createdAt: string;
  updatedAt: string;
  lastVisit: string | null;
  isOnline: boolean;
  personalPlanUnlocked: boolean;
  funnel: {
    started: boolean;
    questionsAnswered: number;
    totalQuestions: number;
    completed: boolean;
    paid: boolean;
  };
}

interface ActivityDataItem {
  index: number;
  label: string;
  users: number;
}

interface HeatmapDataItem {
  day: string;
  hour: number;
  users: number;
}

interface PeakHoursPrediction {
  peakHours: string[];
  bestMaintenanceTime: string[];
  avgUsersPerHour: number;
}

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
  const [activeTab, setActiveTab] = useState(() => {
    // Восстанавливаем последнюю открытую вкладку из localStorage
    return localStorage.getItem('cms_active_tab') || 'overview';
  });
  const [answersModalTab, setAnswersModalTab] = useState<'primary' | 'additional' | 'plan' | 'preparation' | 'specialist'>('primary');
  const [funnelPeriod, setFunnelPeriod] = useState('all'); // all, day, week, month

  // Данные статистики
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelDataItem[]>([]);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [activeUsers, setActiveUsers] = useState(0);

  // Данные пользователей
  const [users, setUsers] = useState<User[]>([]);
  const [onlineSessionIds, setOnlineSessionIds] = useState<string[]>([]); // Список онлайн sessionId из WebSocket
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Состояние для удаления пользователя
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Состояние для попапа с ответами пользователя
  const [answersModalVisible, setAnswersModalVisible] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);

  // Данные графика активности
  const [activityData, setActivityData] = useState<ActivityDataItem[]>([]);
  const [activityMetricType, setActivityMetricType] = useState<'active_users' | 'new_users' | 'conversion_rate'>('active_users');
  const [activityPeriod, setActivityPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [activityDate, setActivityDate] = useState<Dayjs>(dayjs()); // Выбранная дата
  const [activityFilters, setActivityFilters] = useState({
    homepage: true,
    test: true,
    dashboard: true,
    other: true
  });

  // Данные тепловой карты и прогнозирования
  const [heatmapData, setHeatmapData] = useState<HeatmapDataItem[]>([]);
  const [peakHoursPrediction, setPeakHoursPrediction] = useState<PeakHoursPrediction | null>(null);

  // Проверка авторизации при загрузке (из localStorage)
  useEffect(() => {
    const token = localStorage.getItem('cms_token');
    if (token) {
      setIsAuthenticated(true);
      fetchStats(token);
    }
  }, []);

  // Сохранение активной вкладки при изменении
  useEffect(() => {
    localStorage.setItem('cms_active_tab', activeTab);
  }, [activeTab]);

  // WebSocket для реал-тайм обновления "активных сейчас"
  useEffect(() => {
    if (!isAuthenticated) return;

    // Первоначальная загрузка
    fetchActiveUsers();

    // @ts-ignore - для совместимости с разными типами import.meta
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL ||
      ((import.meta as any).env?.DEV ? 'http://localhost:5000' : 'https://idenself.ru');

    console.log('🔌 [CMS] Подключаемся к WebSocket для реал-тайм обновлений');

    const socket: Socket = io(apiBaseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('✅ [CMS] WebSocket подключен');
      // Запрашиваем актуальный список онлайн пользователей при подключении
      fetchActiveUsers();
    });

    // Слушаем обновления счётчика онлайн пользователей
    socket.on('online_count', (count: number) => {
      console.log('📊 [CMS] Обновление онлайн счётчика:', count);
      setActiveUsers(count);
    });

    // Слушаем обновления списка онлайн пользователей
    socket.on('online_users_update', (sessionIds: string[]) => {
      console.log('📊 [CMS] Обновление списка онлайн пользователей:', sessionIds);
      setOnlineSessionIds(sessionIds);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, activeTab]);

  // Перезагрузка воронки при изменении периода
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('cms_token');
    if (token) {
      fetchFunnelData(token);
    }
  }, [funnelPeriod, isAuthenticated]);

  // Перезагрузка графика активности при изменении периода, даты, фильтров или типа метрики
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('cms_token');
    if (token) {
      fetchActivityData(token);
    }
  }, [activityPeriod, activityDate, activityFilters, activityMetricType, isAuthenticated]);

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
      const [basicRes, funnelRes, diagnosisRes, activeRes, usersRes] = await Promise.all([
        apiRequest('api/cms/stats/basic', { headers }),
        apiRequest(`api/cms/stats/funnel?period=${funnelPeriod}`, { headers }),
        apiRequest('api/cms/stats/diagnosis', { headers }),
        apiRequest('api/cms/stats/active', { headers }),
        apiRequest('api/cms/users', { headers })
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

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      // Загружаем тепловую карту и прогнозирование
      await fetchHeatmapData(token);

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
        // Устанавливаем список онлайн sessionId для обновления статуса в таблице
        if (data.onlineSessionIds) {
          console.log('📊 [CMS] Установлен начальный список онлайн пользователей:', data.onlineSessionIds.length);
          setOnlineSessionIds(data.onlineSessionIds);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFunnelData = async (token: string) => {
    try {
      const response = await apiRequest(`api/cms/stats/detailed-funnel?period=${funnelPeriod}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFunnelData(data.funnel || []);
        console.log('📊 [CMS] Детальная воронка загружена:', data.funnel?.length, 'этапов');
      }
    } catch (e) {
      console.error('❌ [CMS] Ошибка загрузки воронки:', e);
    }
  };

  const fetchActivityData = async (token: string) => {
    try {
      // Формируем список активных фильтров
      const activeFilters = Object.entries(activityFilters)
        .filter(([_, enabled]) => enabled)
        .map(([key, _]) => key);

      const pagesParam = activeFilters.length > 0 ? activeFilters.join(',') : 'all';
      const dateParam = activityDate.format('YYYY-MM-DD');

      const response = await apiRequest(`api/cms/stats/activity-by-hour?period=${activityPeriod}&pages=${pagesParam}&date=${dateParam}&metricType=${activityMetricType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivityData(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHeatmapData = async (token: string) => {
    try {
      const response = await apiRequest('api/cms/stats/heatmap', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHeatmapData(data.heatmap || []);
        setPeakHoursPrediction(data.prediction || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (nickname: string, password: string) => {
    const textToCopy = `Данные для входа idenself.ru
Логин: ${nickname}
Пароль: ${password}

#тесты #план #прл #психолог`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => message.success('Данные для входа скопированы в буфер обмена'))
      .catch(err => message.error('Не удалось скопировать данные: ' + err));
  };

  const togglePasswordVisibility = (sessionId: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(sessionId)) {
      newSet.delete(sessionId);
    } else {
      newSet.add(sessionId);
    }
    setVisiblePasswords(newSet);
  };

  // Функции для удаления пользователя
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    setDeleteModalVisible(false);
    setDeleteConfirmModalVisible(true);
    setDeleteConfirmationText('');
  };

  const handleDeleteFinal = async () => {
    if (!userToDelete) return;

    const requiredText = 'Да, я действительно хочу удалить этого пользователя';
    if (deleteConfirmationText !== requiredText) {
      message.error('Пожалуйста, введите точную фразу подтверждения');
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem('cms_token');
      if (!token) {
        message.error('Ошибка авторизации');
        return;
      }

      const response = await apiRequest(`api/cms/users/${userToDelete.sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success('Пользователь успешно удален');
        setUsers(users.filter(u => u.sessionId !== userToDelete.sessionId));
        setDeleteConfirmModalVisible(false);
        setUserToDelete(null);
        setDeleteConfirmationText('');
      } else {
        const data = await response.json();
        message.error(data.error || 'Ошибка при удалении пользователя');
      }
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      message.error('Ошибка сети при удалении пользователя');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setDeleteConfirmModalVisible(false);
    setUserToDelete(null);
    setDeleteConfirmationText('');
  };

  // Функция для открытия попапа с ответами пользователя
  const handleViewAnswers = async (user: User) => {
    setAnswersModalVisible(true);
    setLoadingUserData(true);
    setSelectedUserData(null);
    setAnswersModalTab('primary');

    try {
      const token = localStorage.getItem('cms_token');
      if (!token) {
        message.error('Ошибка авторизации');
        return;
      }

      console.log('📋 [CMS-FRONT] Загружаем данные для пользователя:', user.sessionId);

      const response = await apiRequest(`api/cms/users/${user.sessionId}/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [CMS-FRONT] Данные получены:', data);
        setSelectedUserData(data.data);
      } else {
        const errorData = await response.json();
        console.error('❌ [CMS-FRONT] Ошибка ответа:', errorData);
        message.error(errorData.error || 'Ошибка загрузки данных');
        setSelectedUserData(null);
      }
    } catch (error) {
      console.error('❌ [CMS-FRONT] Ошибка загрузки данных пользователя:', error);
      message.error('Ошибка сети при загрузке данных');
      setSelectedUserData(null);
    } finally {
      setLoadingUserData(false);
    }
  };

  // Обновляем онлайн статус пользователей на основе данных из WebSocket
  const usersWithUpdatedOnlineStatus = users.map(user => {
    const isOnline = onlineSessionIds.includes(user.sessionId);

    // Логирование для отладки
    if (isOnline && !user.isOnline) {
      console.log(`🟢 [CMS] Пользователь ${user.nickname} (${user.sessionId}) стал онлайн`);
    } else if (!isOnline && user.isOnline) {
      console.log(`🔴 [CMS] Пользователь ${user.nickname} (${user.sessionId}) стал офлайн`);
    }

    return {
      ...user,
      isOnline
    };
  });

  const filteredUsers = showOnlineOnly
    ? usersWithUpdatedOnlineStatus.filter(u => u.isOnline)
    : usersWithUpdatedOnlineStatus;

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
      <Sider
        theme="light"
        width={250}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
          borderRight: '1px solid #f0f0f0',
          zIndex: 10
        }}
      >
        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <img
            src="/logo_cms.png"
            alt="idenself"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <Title level={4} style={{ margin: 0, color: '#151D3F' }}>
            idenself CMS
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
              key: 'users',
              icon: <UserOutlined />,
              label: 'Пользователи',
              style: activeTab === 'users' ? {
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

      <Layout style={{ background: '#f0f2f5', padding: '24px', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
        <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
            <Title level={2} style={{ margin: 0 }}>
              {activeTab === 'overview' && 'Обзор Проекта'}
              {activeTab === 'funnel' && 'Воронка Конверсии'}
              {activeTab === 'users' && 'Пользователи'}
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
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
                  {/* Счётчик планов и мини-воронка */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card bordered={false} style={{ height: '100%' }}>
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <Title level={1} style={{ fontSize: '72px', color: '#1890ff', margin: 0 }}>
                            {basicStats?.unlockedPlans || 0}
                          </Title>
                          <Text type="secondary" style={{ fontSize: '18px' }}>
                            персональных планов выдано
                          </Text>
                          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                            <Statistic
                              title="% из начала теста в покупку"
                              value={basicStats?.totalUsers ? ((basicStats.unlockedPlans / basicStats.totalUsers) * 100).toFixed(1) : 0}
                              suffix="%"
                              prefix={<ThunderboltOutlined />}
                              valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                            />
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card bordered={false} style={{ height: '100%' }}>
                        <div style={{ padding: '20px' }}>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart
                              data={[
                                { name: 'Начали тест', value: basicStats?.totalUsers || 0, fill: '#8884d8' },
                                { name: 'Завершили тест', value: basicStats?.completedTests || 0, fill: '#83a6ed' },
                                { name: 'Получили план', value: basicStats?.unlockedPlans || 0, fill: '#82ca9d' }
                              ]}
                              layout="vertical"
                              margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                tick={{ fontSize: 12 }}
                              />
                              <ChartTooltip />
                              <Bar dataKey="value" name="Пользователи">
                                {[0, 1, 2].map((index) => (
                                  <Cell key={`cell-${index}`} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  {/* График Активности */}
                  <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                    <Col span={24}>
                      <Card
                        title={
                          <Select
                            value={activityMetricType}
                            onChange={(value) => setActivityMetricType(value)}
                            style={{ width: 400 }}
                            dropdownMatchSelectWidth={false}
                          >
                            <Select.Option value="active_users">📈 Активность пользователей</Select.Option>
                            <Select.Option value="new_users">🆕 Новые пользователи</Select.Option>
                            <Select.Option value="conversion_rate">📊 Динамика конверсии из начала теста в покупку</Select.Option>
                          </Select>
                        }
                        bordered={false}
                        extra={
                          <Space>
                            <Select
                              value={activityPeriod}
                              onChange={(value) => {
                                setActivityPeriod(value);
                                // При смене периода сбрасываем на текущую дату
                                setActivityDate(dayjs());
                              }}
                              style={{ width: 180 }}
                            >
                              <Select.Option value="day">За сутки (часы)</Select.Option>
                              <Select.Option value="week">За неделю (дни)</Select.Option>
                              <Select.Option value="month">За месяц (даты)</Select.Option>
                            </Select>
                          </Space>
                        }
                      >
                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary">
                            {activityPeriod === 'day' && `График по часам за ${activityDate.format('DD.MM.YYYY')}`}
                            {activityPeriod === 'week' && `График по дням недели с ${activityDate.startOf('week').add(1, 'day').format('DD.MM')} по ${activityDate.endOf('week').add(1, 'day').format('DD.MM.YYYY')}`}
                            {activityPeriod === 'month' && `График за ${activityDate.format('MMMM YYYY')}`}
                          </Text>

                          <Space>
                            <Button
                              icon={<LeftOutlined />}
                              onClick={() => {
                                if (activityPeriod === 'day') {
                                  setActivityDate(activityDate.subtract(1, 'day'));
                                } else if (activityPeriod === 'week') {
                                  setActivityDate(activityDate.subtract(1, 'week'));
                                } else {
                                  setActivityDate(activityDate.subtract(1, 'month'));
                                }
                              }}
                            />
                            <DatePicker
                              value={activityDate}
                              onChange={(date) => date && setActivityDate(date)}
                              picker={activityPeriod === 'month' ? 'month' : 'date'}
                              format={activityPeriod === 'month' ? 'MMMM YYYY' : 'DD.MM.YYYY'}
                              placeholder="Выберите дату"
                              allowClear={false}
                              style={{ width: 180 }}
                            />
                            <Button
                              icon={<RightOutlined />}
                              onClick={() => {
                                if (activityPeriod === 'day') {
                                  setActivityDate(activityDate.add(1, 'day'));
                                } else if (activityPeriod === 'week') {
                                  setActivityDate(activityDate.add(1, 'week'));
                                } else {
                                  setActivityDate(activityDate.add(1, 'month'));
                                }
                              }}
                              disabled={
                                activityPeriod === 'day' ? activityDate.isAfter(dayjs(), 'day') :
                                  activityPeriod === 'week' ? activityDate.isAfter(dayjs(), 'week') :
                                    activityDate.isAfter(dayjs(), 'month')
                              }
                            />
                            <Button
                              onClick={() => setActivityDate(dayjs())}
                              disabled={
                                activityPeriod === 'day' ? activityDate.isSame(dayjs(), 'day') :
                                  activityPeriod === 'week' ? activityDate.isSame(dayjs(), 'week') :
                                    activityDate.isSame(dayjs(), 'month')
                              }
                            >
                              Сегодня
                            </Button>
                          </Space>
                        </div>

                        {activityMetricType === 'active_users' && (
                          <div style={{ marginBottom: '16px' }}>
                            <Space wrap>
                              <Checkbox
                                checked={activityFilters.homepage}
                                onChange={(e) => setActivityFilters({ ...activityFilters, homepage: e.target.checked })}
                              >
                                Главная страница
                              </Checkbox>
                              <Checkbox
                                checked={activityFilters.test}
                                onChange={(e) => setActivityFilters({ ...activityFilters, test: e.target.checked })}
                              >
                                Тест
                              </Checkbox>
                              <Checkbox
                                checked={activityFilters.dashboard}
                                onChange={(e) => setActivityFilters({ ...activityFilters, dashboard: e.target.checked })}
                              >
                                Личный кабинет
                              </Checkbox>
                              <Checkbox
                                checked={activityFilters.other}
                                onChange={(e) => setActivityFilters({ ...activityFilters, other: e.target.checked })}
                              >
                                Остальные страницы
                              </Checkbox>
                            </Space>
                          </div>
                        )}

                        {activityData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={activityData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="label"
                                label={{
                                  value: activityPeriod === 'day' ? 'Часы' : activityPeriod === 'week' ? 'Дни недели' : 'Дата месяца',
                                  position: 'insideBottom',
                                  offset: -5
                                }}
                              />
                              <YAxis
                                label={{
                                  value: activityMetricType === 'conversion_rate' ? 'Конверсия (%)' :
                                    activityMetricType === 'new_users' ? 'Новые пользователи' :
                                      'Уникальных пользователей',
                                  angle: -90,
                                  position: 'insideLeft'
                                }}
                              />
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div style={{
                                        background: 'white',
                                        padding: '10px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                      }}>
                                        <p style={{ margin: 0 }}>
                                          <strong>{payload[0].payload.label}</strong>
                                        </p>
                                        <p style={{ margin: '4px 0 0 0', color: '#1890ff' }}>
                                          {activityMetricType === 'conversion_rate' ? '📊 Конверсия: ' : '👥 Пользователей: '}
                                          {payload[0].value}
                                          {activityMetricType === 'conversion_rate' ? '%' : ''}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="users"
                                name={
                                  activityMetricType === 'conversion_rate' ? 'Конверсия (%)' :
                                    activityMetricType === 'new_users' ? 'Новые пользователи' :
                                      'Активные пользователи'
                                }
                                stroke="#1890ff"
                                strokeWidth={2}
                                dot={{ fill: '#1890ff', r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <Text type="secondary">Нет данных для выбранного периода или фильтров</Text>
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>

                  {/* Тепловая карта активности */}
                  <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                    <Col span={24}>
                      <Card
                        title="🔥 Тепловая карта активности (день недели × час дня)"
                        bordered={false}
                      >
                        <div style={{ marginBottom: '16px' }}>
                          <Text type="secondary">
                            Показывает когда пользователи наиболее активны. Данные за последние 30 дней (московское время).
                          </Text>
                        </div>

                        {heatmapData.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '12px',
                              minWidth: '800px'
                            }}>
                              <thead>
                                <tr>
                                  <th style={{
                                    padding: '8px',
                                    border: '1px solid #f0f0f0',
                                    backgroundColor: '#fafafa',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 1
                                  }}>День / Час</th>
                                  {Array.from({ length: 24 }, (_, i) => (
                                    <th key={i} style={{
                                      padding: '8px',
                                      border: '1px solid #f0f0f0',
                                      backgroundColor: '#fafafa',
                                      minWidth: '35px'
                                    }}>{i}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => {
                                  const dayData = heatmapData.filter(d => d.day === day);
                                  const maxUsers = Math.max(...dayData.map(d => d.users), 1);

                                  return (
                                    <tr key={day}>
                                      <td style={{
                                        padding: '8px',
                                        border: '1px solid #f0f0f0',
                                        fontWeight: 'bold',
                                        backgroundColor: '#fafafa',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 1
                                      }}>{day}</td>
                                      {Array.from({ length: 24 }, (_, hour) => {
                                        const cell = dayData.find(d => d.hour === hour);
                                        const users = cell?.users || 0;
                                        const intensity = users / maxUsers;

                                        // Градация от светло-голубого до темно-синего
                                        const backgroundColor = users === 0
                                          ? '#f5f5f5'
                                          : `rgba(24, 144, 255, ${0.2 + intensity * 0.8})`;

                                        const textColor = intensity > 0.5 ? 'white' : '#000';

                                        return (
                                          <td key={hour} style={{
                                            padding: '8px',
                                            border: '1px solid #f0f0f0',
                                            backgroundColor: backgroundColor,
                                            color: textColor,
                                            textAlign: 'center',
                                            fontWeight: users > 0 ? 'bold' : 'normal',
                                            cursor: users > 0 ? 'help' : 'default'
                                          }}
                                            title={users > 0 ? `${users} польз.` : '0'}
                                          >
                                            {users > 0 ? users : '·'}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <Text type="secondary">Нет данных для тепловой карты</Text>
                          </div>
                        )}
                      </Card>
                    </Col>
                  </Row>

                  {/* Прогнозирование пиковых часов */}
                  {peakHoursPrediction && (
                    <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                      <Col xs={24} md={12}>
                        <Card
                          title="📈 Пиковые часы активности"
                          bordered={false}
                        >
                          <div style={{ marginBottom: '16px' }}>
                            <Text type="secondary">
                              Время наибольшей активности пользователей (на основе истории за 30 дней):
                            </Text>
                          </div>
                          <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {peakHoursPrediction.peakHours?.map((hour: string, index: number) => (
                              <div key={hour} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                backgroundColor: '#e6f7ff',
                                borderRadius: '8px'
                              }}>
                                <div style={{
                                  fontSize: '24px',
                                  fontWeight: 'bold',
                                  color: '#1890ff',
                                  minWidth: '30px'
                                }}>
                                  {index + 1}
                                </div>
                                <div>
                                  <Text strong style={{ fontSize: '18px' }}>{hour}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Пик активности
                                  </Text>
                                </div>
                              </div>
                            ))}
                          </Space>
                          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fffbe6', borderRadius: '8px' }}>
                            <Text type="secondary">
                              💡 <strong>Рекомендация:</strong> Публикуйте важные обновления и объявления в эти часы для максимального охвата
                            </Text>
                          </div>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card
                          title="🔧 Лучшее время для техработ"
                          bordered={false}
                        >
                          <div style={{ marginBottom: '16px' }}>
                            <Text type="secondary">
                              Время минимальной нагрузки (на основе истории за 30 дней):
                            </Text>
                          </div>
                          <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            {peakHoursPrediction.bestMaintenanceTime?.map((hour: string, index: number) => (
                              <div key={hour} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                backgroundColor: '#f6ffed',
                                borderRadius: '8px'
                              }}>
                                <div style={{
                                  fontSize: '24px',
                                  fontWeight: 'bold',
                                  color: '#52c41a',
                                  minWidth: '30px'
                                }}>
                                  {index + 1}
                                </div>
                                <div>
                                  <Text strong style={{ fontSize: '18px' }}>{hour}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Минимальная нагрузка
                                  </Text>
                                </div>
                              </div>
                            ))}
                          </Space>
                          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e6fffb', borderRadius: '8px' }}>
                            <Text type="secondary">
                              💡 <strong>Рекомендация:</strong> Проводите техническое обслуживание и деплой в эти часы для минимального влияния на пользователей
                            </Text>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  )}

                  {/* Распределение предполагаемых диагнозов */}
                  <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                    <Col xs={24}>
                      <Card title="Распределение предполагаемых диагнозов на основе первичного опросника" bordered={false}>
                        <div style={{ height: 500 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={diagnosisData?.distribution}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={(entry: any) => {
                                  const name = entry.name || '';
                                  const percent = entry.percent || 0;
                                  return `${name} ${(percent * 100).toFixed(0)}%`;
                                }}
                                outerRadius={180}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {diagnosisData?.distribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Пользователи */}
              {activeTab === 'users' && (
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card
                        title={
                          <Space>
                            <span>Список пользователей</span>
                            <Tag color="blue">{filteredUsers.length} из {users.length}</Tag>
                          </Space>
                        }
                        bordered={false}
                        extra={
                          <Space>
                            <Text>Только онлайн:</Text>
                            <Switch
                              checked={showOnlineOnly}
                              onChange={setShowOnlineOnly}
                            />
                          </Space>
                        }
                      >
                        <Table
                          dataSource={filteredUsers}
                          rowKey="sessionId"
                          pagination={{ pageSize: 20 }}
                          scroll={{ x: 1200 }}
                          columns={[
                            {
                              title: 'Дата регистрации',
                              dataIndex: 'createdAt',
                              key: 'createdAt',
                              width: 150,
                              render: (date: string) => new Date(date).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }),
                              sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                            },
                            {
                              title: 'Последний визит',
                              dataIndex: 'lastVisit',
                              key: 'lastVisit',
                              width: 150,
                              render: (date: string | null) => {
                                if (!date) {
                                  return <Text type="secondary">Неизвестно</Text>;
                                }
                                return new Date(date).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              },
                              sorter: (a, b) => {
                                const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
                                const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
                                return dateB - dateA;
                              }
                            },
                            {
                              title: 'Никнейм',
                              key: 'nickname',
                              width: 150,
                              render: (record: any) => (
                                <Space>
                                  {record.isOnline && (
                                    <span style={{
                                      display: 'inline-block',
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: '#52c41a',
                                      marginRight: '4px'
                                    }} />
                                  )}
                                  <Text strong>{record.nickname}</Text>
                                </Space>
                              ),
                              sorter: (a, b) => Number(b.isOnline) - Number(a.isOnline)
                            },
                            {
                              title: 'Пароль',
                              dataIndex: 'password',
                              key: 'password',
                              width: 150,
                              render: (password: string, record: any) => (
                                <Space>
                                  {visiblePasswords.has(record.sessionId) ? (
                                    <Text code>{password || 'Нет'}</Text>
                                  ) : (
                                    <Text type="secondary">••••••••</Text>
                                  )}
                                  <Button
                                    size="small"
                                    icon={visiblePasswords.has(record.sessionId) ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                    onClick={() => togglePasswordVisibility(record.sessionId)}
                                  />
                                </Space>
                              )
                            },
                            {
                              title: 'Воронка',
                              key: 'funnel',
                              width: 200,
                              render: (record: any) => (
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                  <Space size="small">
                                    {record.funnel.started ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#d9d9d9' }} />}
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Начал тест</Text>
                                  </Space>
                                  <Space size="small">
                                    {record.funnel.completed ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#d9d9d9' }} />}
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Завершил тест</Text>
                                  </Space>
                                  <Space size="small">
                                    {record.funnel.paid ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#d9d9d9' }} />}
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Оплатил</Text>
                                  </Space>
                                </Space>
                              )
                            },
                            {
                              title: 'Вопросов отвечено',
                              key: 'questionsAnswered',
                              width: 140,
                              render: (record: any) => {
                                const answered = record.funnel.questionsAnswered;
                                const total = record.funnel.totalQuestions;
                                const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

                                return (
                                  <Tooltip title={`${percent}% теста пройдено`}>
                                    <Tag color={answered >= total ? 'success' : answered > total * 0.5 ? 'warning' : answered > 0 ? 'orange' : 'default'}>
                                      {answered} / {total}
                                    </Tag>
                                  </Tooltip>
                                );
                              },
                              sorter: (a, b) => a.funnel.questionsAnswered - b.funnel.questionsAnswered
                            },
                            {
                              title: 'Действия',
                              key: 'actions',
                              width: 150,
                              fixed: 'right' as const,
                              render: (record: any) => (
                                <Space>
                                  <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    onClick={() => handleViewAnswers(record)}
                                    size="small"
                                  >
                                    Ответы
                                  </Button>
                                  <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteUser(record)}
                                    size="small"
                                  />
                                </Space>
                              )
                            }
                          ]}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Детальная воронка */}
              {activeTab === 'funnel' && (
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Card
                        title="Детальная воронка конверсии"
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
                        <div style={{ marginBottom: '16px' }}>
                          <Text type="secondary">
                            Детальный путь пользователя от первого клика до завершения всех действий.
                            Этапы идут сверху вниз по мере прохождения воронки.
                          </Text>
                        </div>

                        <div style={{ height: Math.max(1200, funnelData.length * 20) }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={funnelData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" label={{ value: 'Количество пользователей', position: 'insideBottom', offset: -5 }} />
                              <YAxis
                                dataKey="step"
                                type="category"
                                width={250}
                                tick={{ fontSize: 11 }}
                              />
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div style={{
                                        background: 'white',
                                        padding: '10px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                      }}>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{data.step}</p>
                                        <p style={{ margin: '4px 0 0 0', color: '#1890ff' }}>
                                          👥 Пользователей: {data.users}
                                        </p>
                                        {data.users > 0 && funnelData[0]?.users > 0 && (
                                          <p style={{ margin: '4px 0 0 0', color: '#52c41a' }}>
                                            📊 От начала: {((data.users / funnelData[0].users) * 100).toFixed(1)}%
                                          </p>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="users" fill="#1890ff" name="Пользователи">
                                {funnelData.map((_, index) => {
                                  // Градация цвета: от синего к зеленому
                                  const progress = index / funnelData.length;
                                  const color = `hsl(${200 + progress * 100}, 70%, 50%)`;
                                  return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div style={{ marginTop: '20px', padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Statistic
                                title="Конверсия из начала теста в завершение"
                                value={funnelData[0]?.users > 0 ? ((funnelData[46]?.users / funnelData[0]?.users) * 100).toFixed(1) : 0}
                                suffix="%"
                                valueStyle={{ color: '#1890ff' }}
                              />
                            </Col>
                            <Col span={8}>
                              <Statistic
                                title="Конверсия из начала теста в покупку"
                                value={funnelData[0]?.users > 0 ? ((funnelData[48]?.users / funnelData[0]?.users) * 100).toFixed(1) : 0}
                                suffix="%"
                                valueStyle={{ color: '#52c41a' }}
                              />
                            </Col>
                            <Col span={8}>
                              <Statistic
                                title="Конверсия из начала теста в полный опыт"
                                value={funnelData[0]?.users > 0 ? ((funnelData[funnelData.length - 1]?.users / funnelData[0]?.users) * 100).toFixed(1) : 0}
                                suffix="%"
                                valueStyle={{ color: '#722ed1' }}
                              />
                            </Col>
                          </Row>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Дорожная карта */}
              {activeTab === 'roadmap' && (
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
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
                              title: '2. Реал-тайм счётчик "Прямо сейчас" + График активности',
                              description: '✅ ПОЛНОСТЬЮ РЕАЛИЗОВАНО! WebSocket система с мгновенными обновлениями и график активности по часам.',
                              tasks: [
                                '✅ Heartbeat события каждые 30 сек с каждой страницы (кроме /chat и /cms)',
                                '✅ Подсчёт онлайн: heartbeat за последние 60 секунд = реально на сайте',
                                '✅ Умная остановка: не шлёт при свёрнутой вкладке, останавливается при неактивности >2 мин',
                                '✅ WebSocket (socket.io) для МГНОВЕННОГО обновления счётчика онлайн (<1 сек!)',
                                '✅ Реал-тайм обновление зелёных точек у онлайн пользователей в таблице',
                                '✅ График активности по времени суток (0-23 часа)',
                                '✅ Фильтры периода для графика: за сутки / неделю / месяц',
                                '',
                                '📊 ТЕКУЩАЯ АРХИТЕКТУРА:',
                                '  └─ WebSocket: socket.io для двусторонней связи клиент ↔ сервер',
                                '  └─ Точность онлайн: мгновенная (при disconnect сразу офлайн)',
                                '  └─ График: группировка heartbeat событий по часам с уникальными users',
                                '  └─ Нагрузка: минимальная, данные хранятся в памяти WebSocket сервера',
                                '',
                                '💡 Что можно ещё:',
                                '✅ График по дням недели - реализовано! (Пн-Вс)',
                                '✅ Тепловая карта активности (день × час) - реализовано!',
                                '✅ Прогнозирование пиковых часов - реализовано!',
                                '✅ Прогнозирование времени для техработ - реализовано!'
                              ]
                            },
                            {
                              title: '3. Точный анализ предполагаемых диагнозов на основе первичного опросника',
                              description: '✅ ПОЛНОСТЬЮ РЕАЛИЗОВАНО! Реальный подсчет баллов из ответов теста.',
                              tasks: [
                                '✅ Написан алгоритм подсчёта баллов по 10 диагнозам из массива answers',
                                '✅ Реализована функция analyzeDiagnosis() в server/routes/cms.js',
                                '✅ Используются пороговые значения для определения наличия признаков',
                                '✅ Реальные проценты коморбидности (ПРЛ + Депрессия, ПРЛ + Тревожность, ПРЛ + РПП)',
                                '✅ Диаграмма на весь экран с читаемыми надписями',
                                '✅ Корректная терминология: "предполагаемые диагнозы на основе первичного опросника"',
                                '',
                                '📊 ОХВАТЫВАЕМЫЕ ДИАГНОЗЫ:',
                                '  ✅ ПРЛ (Пограничное расстройство личности)',
                                '  ✅ Депрессия',
                                '  ✅ Тревожное расстройство',
                                '  ✅ БАР (Биполярное расстройство)',
                                '  ✅ СДВГ',
                                '  ✅ ПТСР',
                                '  ✅ ОКР',
                                '  ✅ Расстройства пищевого поведения (РПП)',
                                '  ✅ Зависимость от веществ',
                                '  ✅ Диссоциативное расстройство'
                              ]
                            },
                            {
                              title: '4. Детальная воронка с прогрессом по вопросам',
                              description: '✅ ПОЛНОСТЬЮ РЕАЛИЗОВАНО! Детальная вертикальная воронка с каждым этапом и полным tracking.',
                              tasks: [
                                '✅ Сбор данных о каждом вопросе (question_number, progress_percent)',
                                '✅ График вертикальный: 51+ этапов (начало → 45 вопросов → оплата → план → PDFs → психолог → обратная связь)',
                                '✅ Переключенные оси: этапы вниз (Y), количество вправо (X)',
                                '✅ Отступ 20px от левой границы блока, читаемые названия этапов',
                                '✅ Конверсия по каждому этапу в tooltip',
                                '✅ Цветовая градация от синего к зеленому',
                                '✅ Статистика: конверсия из начала теста в завершение, покупку, полный опыт',
                                '',
                                '📊 ОТСЛЕЖИВАЕМЫЕ СОБЫТИЯ (ВСЕ РЕАЛИЗОВАНЫ):',
                                '  ✅ test_start, test_question (×45), test_complete',
                                '  ✅ payment_init, payment_success, plan_unlocked',
                                '  ✅ pdf_download с metadata (pdf_type, pdf_number) - 3 типа PDFs',
                                '  ✅ psychologist_request - заявка на подбор психолога',
                                '  ✅ feedback_sent - обратная связь на сеансы',
                                '',
                                '🎨 UX УЛУЧШЕНИЯ:',
                                '  ✅ Фиксированное левое меню (не скроллится)',
                                '  ✅ Независимый скролл каждого раздела (без влияния друг на друга)',
                                '  ✅ Корректное позиционирование графика воронки'
                              ]
                            },
                            {
                              title: '5. Расширенная аналитика по времени + UX',
                              description: '✅ ПОЛНОСТЬЮ РЕАЛИЗОВАНО! Многофункциональный блок с 3 типами метрик и идеальным UX.',
                              tasks: [
                                '✅ График активности пользователей (heartbeat события)',
                                '✅ График новых пользователей (первое событие test_start для каждого session_id)',
                                '✅ График динамики конверсии из начала теста в покупку (% payment_success от test_start)',
                                '✅ Выпадающий список ВМ title (компактный UI) с эмодзи для переключения метрик',
                                '✅ Динамическое изменение всех элементов графика в зависимости от режима:',
                                '  └─ Название оси Y (Уникальных пользователей / Новые пользователи / Конверсия %)',
                                '  └─ Название линии в легенде',
                                '  └─ Формат данных в tooltip (кол-во или %)',
                                '  └─ Отображение фильтров страниц (только для "Активность пользователей")',
                                '✅ Поддержка всех периодов: за сутки (часы), за неделю (дни), за месяц (даты)',
                                '✅ Навигация по датам с DatePicker',
                                '✅ Адаптивные фильтры по типам страниц (скрываются для new_users и conversion_rate)',
                                '',
                                '🎨 UX УЛУЧШЕНИЯ CMS:',
                                '  ✅ Исправлен отступ воронки (убран paddingLeft, width YAxis 200px, margin left 5px)',
                                '  ✅ Счётчик планов поднят вверх в разделе "Обзор"',
                                '  ✅ Мини-воронка справа от счётчика (3 этапа: начало, завершение, план)',
                                '  ✅ Независимый скролл разделов - РЕАЛЬНО ИСПРАВЛЕН! Каждый раздел имеет свой div с overflow',
                                '  ✅ Названия статистики: "Конверсия из начала теста в..."',
                                '',
                                '⚪ Что можно добавить:',
                                '  ⚪ Сравнение текущей недели с прошлой',
                                '  ⚪ Прогноз трендов на основе истории'
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
                </div>
              )}
            </>
          )}
        </Content>
      </Layout>

      {/* Модальное окно первого подтверждения удаления */}
      <Modal
        title="Подтверждение удаления"
        open={deleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="Продолжить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <p>Вы уверены, что хотите удалить пользователя <strong>{userToDelete?.nickname}</strong>?</p>
        <p style={{ color: '#ff4d4f', marginTop: '10px' }}>
          ⚠️ Это действие удалит все данные пользователя, включая:
        </p>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Результаты первичного теста</li>
          <li>Результаты дополнительных тестов</li>
          <li>Аналитику и статистику</li>
          <li>Все связанные записи в базе данных</li>
        </ul>
        <p style={{ color: '#ff4d4f', marginTop: '10px', fontWeight: 'bold' }}>
          Это действие необратимо!
        </p>
      </Modal>

      {/* Модальное окно второго подтверждения с обязательным вводом фразы */}
      <Modal
        title="Финальное подтверждение удаления"
        open={deleteConfirmModalVisible}
        onOk={handleDeleteFinal}
        onCancel={handleDeleteCancel}
        okText="Удалить пользователя"
        cancelText="Отмена"
        okButtonProps={{
          danger: true,
          disabled: deleteConfirmationText !== 'Да, я действительно хочу удалить этого пользователя',
          loading: deleting
        }}
      >
        <p style={{ marginBottom: '20px' }}>
          Для подтверждения удаления пользователя <strong>{userToDelete?.nickname}</strong> введите следующую фразу:
        </p>
        <div style={{
          background: '#f5f5f5',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '15px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          Да, я действительно хочу удалить этого пользователя
        </div>
        <Input
          placeholder="Введите фразу подтверждения"
          value={deleteConfirmationText}
          onChange={(e) => setDeleteConfirmationText(e.target.value)}
          status={deleteConfirmationText && deleteConfirmationText !== 'Да, я действительно хочу удалить этого пользователя' ? 'error' : ''}
        />
        {deleteConfirmationText && deleteConfirmationText !== 'Да, я действительно хочу удалить этого пользователя' && (
          <p style={{ color: '#ff4d4f', marginTop: '10px', fontSize: '12px' }}>
            Фраза не совпадает. Пожалуйста, введите точную фразу.
          </p>
        )}
      </Modal>

      {/* Модальное окно с ответами пользователя */}
      <Modal
        title="Ответы пользователя"
        open={answersModalVisible}
        onCancel={() => {
          setAnswersModalVisible(false);
          setSelectedUserData(null);
        }}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {loadingUserData ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Загрузка данных..." />
          </div>
        ) : selectedUserData ? (
          <div>
            {/* Топ-бар с разделами */}
            <div style={{
              borderBottom: '2px solid #f0f0f0',
              marginBottom: '20px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <Button
                type={answersModalTab === 'primary' ? 'primary' : 'default'}
                onClick={() => setAnswersModalTab('primary')}
                style={{ marginBottom: '8px' }}
              >
                Ответы на первичный тест
              </Button>
              <Button
                type={answersModalTab === 'additional' ? 'primary' : 'default'}
                onClick={() => setAnswersModalTab('additional')}
                style={{ marginBottom: '8px' }}
              >
                Результаты доп. тестов
              </Button>
              <Button
                type={answersModalTab === 'plan' ? 'primary' : 'default'}
                onClick={() => setAnswersModalTab('plan')}
                style={{ marginBottom: '8px' }}
              >
                Персональный план
              </Button>
              <Button
                type={answersModalTab === 'preparation' ? 'primary' : 'default'}
                onClick={() => setAnswersModalTab('preparation')}
                style={{ marginBottom: '8px' }}
              >
                Подготовка к сеансу
              </Button>
              <Button
                type={answersModalTab === 'specialist' ? 'primary' : 'default'}
                onClick={() => setAnswersModalTab('specialist')}
                style={{ marginBottom: '8px' }}
              >
                Для специалиста
              </Button>
            </div>

            {/* Контент разделов */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px' }}>
              {answersModalTab === 'primary' && (
                <div>
                  <Title level={4}>Ответы на первичный тест</Title>
                  {selectedUserData.primaryTestAnswers && selectedUserData.primaryTestAnswers.length > 0 ? (
                    <List
                      dataSource={selectedUserData.primaryTestAnswers}
                      renderItem={(item: any, index: number) => (
                        <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ width: '100%' }}>
                            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                              {index + 1}. {item.questionText}
                            </Text>
                            <div style={{ marginLeft: '20px' }}>
                              <Text style={{ display: 'block', marginBottom: '4px' }}>
                                <strong>Ответ:</strong> {item.answer}
                              </Text>
                              {item.additionalText && (
                                <Text style={{ display: 'block', color: '#595959', fontStyle: 'italic' }}>
                                  <strong>Комментарий:</strong> {item.additionalText}
                                </Text>
                              )}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">Ответы на первичный тест отсутствуют</Text>
                  )}
                </div>
              )}

              {answersModalTab === 'additional' && (
                <div>
                  <Title level={4}>Результаты дополнительных тестов</Title>
                  {selectedUserData.additionalTestsResults && selectedUserData.additionalTestsResults.length > 0 ? (
                    <List
                      dataSource={selectedUserData.additionalTestsResults}
                      renderItem={(item: any) => (
                        <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ width: '100%' }}>
                            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                              {item.testName}
                            </Text>
                            <div style={{ marginLeft: '20px' }}>
                              <Text style={{ whiteSpace: 'pre-wrap' }}>{item.result}</Text>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">Дополнительные тесты не пройдены</Text>
                  )}
                </div>
              )}

              {answersModalTab === 'plan' && (
                <div>
                  <Title level={4}>Персональный план</Title>
                  {selectedUserData.personalPlan ? (
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.8',
                      padding: '16px',
                      background: '#f9f9f9',
                      borderRadius: '4px'
                    }}>
                      {selectedUserData.personalPlan}
                    </div>
                  ) : (
                    <Text type="secondary">Персональный план не сгенерирован</Text>
                  )}
                </div>
              )}

              {answersModalTab === 'preparation' && (
                <div>
                  <Title level={4}>Подготовка к сеансу с психологом и психиатром</Title>
                  {selectedUserData.sessionPreparation ? (
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.8',
                      padding: '16px',
                      background: '#f9f9f9',
                      borderRadius: '4px'
                    }}>
                      {selectedUserData.sessionPreparation}
                    </div>
                  ) : (
                    <Text type="secondary">Подготовка к сеансу не сгенерирована</Text>
                  )}
                </div>
              )}

              {answersModalTab === 'specialist' && (
                <div>
                  <Title level={4}>Документ для психолога/психиатра</Title>
                  {selectedUserData.psychologistDocument ? (
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.8',
                      padding: '16px',
                      background: '#f9f9f9',
                      borderRadius: '4px'
                    }}>
                      {selectedUserData.psychologistDocument}
                    </div>
                  ) : (
                    <Text type="secondary">Документ для специалиста не сгенерирован</Text>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Text type="secondary">Данные не загружены</Text>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default CMSPage;

