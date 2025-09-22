import { useNavigate } from 'react-router-dom';
import { Typography, Button } from 'antd';
import { PlayCircleOutlined, UserOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/test');
  };

  const handleNotNow = () => {
    // Можно добавить логику для "Не в этот раз"
    console.log('Пользователь выбрал "Не в этот раз"');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FFE4B5 0%, #FFB6C1 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Логотип */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '40px',
        background: 'white',
        borderRadius: '8px',
        padding: '8px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <PlayCircleOutlined style={{ fontSize: '24px', color: '#000', marginRight: '8px' }} />
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
      <Title level={1} style={{
        color: '#000',
        textAlign: 'center',
        marginBottom: '16px',
        fontSize: '32px',
        fontWeight: 'bold'
      }}>
        Premium для всей семьи
      </Title>

      {/* Описание */}
      <Paragraph style={{
        color: '#000',
        textAlign: 'center',
        fontSize: '18px',
        marginBottom: '60px',
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        Одной музыки недостаточно? Видео и музыка без рекламы в шести профилях.
      </Paragraph>

      {/* Кнопки */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
        maxWidth: '300px'
      }}>
        <Button
          type="primary"
          size="large"
          onClick={handleStart}
          style={{
            height: '50px',
            fontSize: '18px',
            fontWeight: 'bold',
            width: '100%',
            background: '#333',
            borderColor: '#333',
            borderRadius: '25px'
          }}
        >
          Продлить
        </Button>

        <Button
          type="text"
          onClick={handleNotNow}
          style={{
            color: '#000',
            fontSize: '16px',
            fontWeight: 'normal'
          }}
        >
          Не в этот раз
        </Button>
      </div>

      {/* Условия */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#666',
        maxWidth: '300px'
      }}>
        Есть условия. Отменить подписку можно в любое время.
      </div>
    </div>
  );
};

export default HomePage;