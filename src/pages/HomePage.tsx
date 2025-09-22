import { useNavigate } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Space, List } from 'antd';
import { 
  FileTextOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  FilePdfOutlined, 
  MessageOutlined 
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const benefits = [
  {
    title: 'Персональный план, что делать именно в твоём случае',
    subtitle: 'Индивидуальный подход к твоей ситуации',
    icon: <FileTextOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: [
      'Конкретные действия',
      'Какие тесты ещё пройти в твоём случае',
      'Какой метод терапии использовать',
      'Какой нужен психолог'
    ]
  },
  {
    title: 'Подберём психолога под твой случай',
    subtitle: 'Найдём специалиста, который понимает твои особенности',
    icon: <UserOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: []
  },
  {
    title: 'Подготовим к сеансу',
    subtitle: 'Поможем максимально эффективно использовать время с психологом',
    icon: <CalendarOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: [
      'Что сказать специалисту в твоём случае',
      'Как на первом сеансе определить, что он, скорее всего, тебе подходит'
    ]
  },
  {
    title: 'Подготовим PDF для психолога',
    subtitle: 'Документ, который поможет специалисту лучше понять тебя',
    icon: <FilePdfOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: [
      'Даёшь его психологу, и он понимает, что делать в твоём случае'
    ]
  },
  {
    title: 'Ты сможешь поделиться с нами, что было на сеансе у психолога, и мы дадим обратную связь',
    subtitle: 'Поддержим тебя на каждом этапе',
    icon: <MessageOutlined style={{ color: '#00695C', fontSize: '32px' }} />,
    items: []
  }
];

const HomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/test');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FFE4B5 0%, #FFB6C1 100%)',
      padding: '40px 20px',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Логотип в стиле Premium */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          background: 'white',
          borderRadius: '8px',
          padding: '8px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: 'fit-content',
          margin: '0 auto 40px auto'
        }}>
          <UserOutlined style={{ fontSize: '24px', color: '#000', marginRight: '8px' }} />
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#000' }}>Premium</span>
        </div>

        {/* Графическое представление профилей */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '40px'
        }}>
          {/* Главный профиль */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: '#D2691E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <UserOutlined style={{ fontSize: '60px', color: 'white' }} />
          </div>

          {/* Профили семьи */}
          <div style={{
            display: 'flex',
            gap: '12px',
            background: '#D2691E',
            borderRadius: '20px',
            padding: '12px 20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div key={index} style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserOutlined style={{ fontSize: '20px', color: 'white' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title level={1} style={{ 
            color: '#000', 
            marginBottom: '16px',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            Если у тебя ПРЛ
          </Title>
          <Title level={3} style={{ 
            color: '#000', 
            fontWeight: 'normal', 
            marginBottom: '40px',
            fontSize: '18px'
          }}>
            Пройди тест и получи:
          </Title>
        </div>

        {/* Карточки с преимуществами */}
        <Row gutter={[24, 24]} style={{ marginBottom: '60px' }}>
          {benefits.map((benefit, index) => (
            <Col xs={24} md={12} lg={8} key={index}>
              <Card 
                hoverable
                style={{ 
                  height: '100%',
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div style={{ textAlign: 'left' }}>
                    {benefit.icon}
                  </div>
                  
                  <div>
                    <Title level={4} style={{ margin: '0 0 8px 0', color: '#00695C', textAlign: 'left' }}>
                      {benefit.title}
                    </Title>
                    <Paragraph style={{ margin: '0 0 16px 0', color: '#666', textAlign: 'left', fontSize: '16px' }}>
                      {benefit.subtitle}
                    </Paragraph>
                    
                    {benefit.items.length > 0 && (
                      <List
                        size="small"
                        dataSource={benefit.items}
                        renderItem={(item) => (
                          <List.Item style={{ padding: '4px 0', border: 'none' }}>
                            <span style={{ color: '#333', fontSize: '14px' }}>• {item}</span>
                          </List.Item>
                        )}
                        style={{ marginTop: '16px' }}
                      />
                    )}
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Кнопка */}
        <div style={{ textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={handleStart}
            style={{ 
              height: '60px', 
              fontSize: '18px', 
              fontWeight: 'bold',
              padding: '0 80px',
              minWidth: '200px',
              background: '#333',
              borderColor: '#333',
              borderRadius: '30px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            Начать
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;