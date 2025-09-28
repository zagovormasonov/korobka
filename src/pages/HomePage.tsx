import { useNavigate, Link } from 'react-router-dom';
import { Typography, Button, Card, Row, Col, Space, List } from 'antd';
import { 
  FileTextOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  FilePdfOutlined, 
  MessageOutlined 
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/bpd_test');
  };

  const handleLogin = () => {
    navigate('/lk/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FFE4B5 0%, #FFB6C1 100%)',
      padding: '40px 20px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        {/* Заголовок */}
        <div style={{ marginBottom: '60px' }}>
          <Title level={1} style={{ 
            color: '#000', 
            marginBottom: '16px',
            fontSize: '48px',
            fontWeight: 'bold'
          }}>
            Если у тебя ПРЛ
          </Title>
          <Title level={3} style={{ 
            color: '#333', 
            fontWeight: 'normal', 
            marginBottom: '0',
            fontSize: '20px'
          }}>
            Пройди тест или войди в личный кабинет
          </Title>
        </div>

        {/* Кнопки */}
        <div style={{ marginBottom: '40px' }}>
          <Space direction="vertical" size="large">
            <Button 
              type="primary" 
              size="large"
              onClick={handleStart}
              style={{ 
                height: '70px', 
                fontSize: '20px', 
                fontWeight: 'bold',
                padding: '0 60px',
                minWidth: '350px',
                background: '#00695C',
                borderColor: '#00695C',
                borderRadius: '35px',
                boxShadow: '0 6px 20px rgba(0,105,92,0.3)'
              }}
            >
              Пройти тест
            </Button>
            
            <Button 
              type="default" 
              size="large"
              onClick={handleLogin}
              style={{ 
                height: '70px', 
                fontSize: '20px', 
                fontWeight: 'bold',
                padding: '0 60px',
                minWidth: '350px',
                background: 'white',
                borderColor: '#00695C',
                color: '#00695C',
                borderRadius: '35px',
                boxShadow: '0 6px 20px rgba(0,105,92,0.15)'
              }}
            >
              Войти в личный кабинет
            </Button>
          </Space>
        </div>
      </div>

      {/* Ссылки внизу */}
      <div style={{ 
        textAlign: 'center', 
        paddingTop: '20px',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        marginTop: 'auto'
      }}>
        <Space size="large" wrap>
          <Link 
            to="/offer" 
            style={{ 
              color: '#666', 
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            Публичная оферта
          </Link>
          <Link 
            to="/privacy-policy" 
            style={{ 
              color: '#666', 
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            Политика конфиденциальности
          </Link>
          <Link 
            to="/consent" 
            style={{ 
              color: '#666', 
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            Согласие на обработку персональных данных
          </Link>
        </Space>
      </div>
    </div>
  );
};

export default HomePage;