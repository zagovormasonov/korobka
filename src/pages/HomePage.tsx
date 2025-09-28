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
      background: 'linear-gradient(180deg, #FFFAC0 0%, #FFA4B3 100%)',
      padding: '40px 20px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Логотип вверху */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '60px',
        paddingTop: '20px'
      }}>
        <Title level={2} style={{ 
          color: '#000', 
          margin: '0',
          fontSize: '32px',
          fontFamily: 'Comfortaa, sans-serif',
          fontWeight: 'normal'
        }}>
          idenself
        </Title>
      </div>

      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        textAlign: 'left'
      }}>
        {/* Заголовок */}
        <div style={{ marginBottom: '60px' }}>
          <Title level={1} style={{ 
            color: '#000', 
            marginBottom: '16px',
            fontSize: '48px',
            fontFamily: 'Comfortaa, sans-serif',
            fontWeight: 'normal',
            textAlign: 'left',
            lineHeight: '1.2'
          }}>
            Если<br />у тебя ПРЛ
          </Title>
          <div style={{ 
            color: 'rgba(0, 0, 0, 0.5)', 
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 'normal',
            textAlign: 'left',
            lineHeight: '1.4'
          }}>
            Пройди тест или войди<br />в личный кабинет
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ marginBottom: '40px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              size="large"
              onClick={handleStart}
              style={{ 
                height: '60px', 
                fontSize: '20px', 
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                padding: '0 40px',
                width: '100%',
                maxWidth: '300px',
                background: '#00695C',
                borderColor: '#00695C',
                borderRadius: '30px',
                boxShadow: 'none',
                border: 'none'
              }}
            >
              Пройти тест
            </Button>
            
            <Button 
              type="default" 
              size="large"
              onClick={handleLogin}
              style={{ 
                height: '60px', 
                fontSize: '20px', 
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                padding: '0 40px',
                width: '100%',
                maxWidth: '300px',
                background: 'white',
                borderColor: 'transparent',
                color: '#00695C',
                borderRadius: '30px',
                boxShadow: 'none',
                border: 'none'
              }}
            >
              Войти в ЛК
            </Button>
          </Space>
        </div>
      </div>

      {/* Ссылки внизу */}
      <div style={{ 
        textAlign: 'center', 
        paddingTop: '20px',
        marginTop: 'auto'
      }}>
        <Space size="large" wrap>
          <Link 
            to="/offer" 
            style={{ 
              color: 'rgba(0, 0, 0, 0.5)', 
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              textDecoration: 'none'
            }}
          >
            Публичная оферта
          </Link>
          <Link 
            to="/privacy-policy" 
            style={{ 
              color: 'rgba(0, 0, 0, 0.5)', 
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              textDecoration: 'none'
            }}
          >
            Политика конфиденциальности
          </Link>
          <Link 
            to="/consent" 
            style={{ 
              color: 'rgba(0, 0, 0, 0.5)', 
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
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