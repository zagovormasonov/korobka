import { useNavigate, Link } from 'react-router-dom';
import { Typography, Button, Space } from 'antd';
import Silk from '../components/Silk';

const { Title } = Typography;

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
      minHeight: 'calc(100vh + 100px)',
      padding: '40px 20px 140px 20px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        position: 'fixed',
        top: -50,
        left: 0,
        width: '100%',
        height: 'calc(100vh + 150px)',
        zIndex: -1
      }}>
        <Silk
          speed={8.7}
          scale={0.5}
          color="#ffe59e"
          darkColor="#e8722a"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      {/* Логотип вверху */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '60px',
        paddingTop: '20px'
      }}>
        <div 
          className="gradient-text-logo"
          style={{
            fontSize: '32px',
            fontFamily: 'Comfortaa, sans-serif',
            fontWeight: 'normal',
            margin: '0'
          }}
        >
          idenself
        </div>
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
        <div style={{ marginBottom: '30px' }}>
          <Title level={1} style={{ 
            color: 'black', 
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
            color: 'rgba(0, 0, 0, 0.8)', 
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
                background: 'white',
                color: 'black',
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
                background: 'transparent',
                color: 'white',
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
              color: 'rgb(0, 0, 0)', 
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
              color: 'rgb(0, 0, 0)', 
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
              color: 'rgb(0, 0, 0)', 
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