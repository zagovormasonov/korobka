import React from 'react';
import { Spin, Typography } from 'antd';
import { FileTextOutlined, UserOutlined, DownloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface GenerationAnimationProps {
  isGenerating: boolean;
  currentStep?: number;
  totalSteps?: number;
  stepNames?: string[];
}

const GenerationAnimation: React.FC<GenerationAnimationProps> = ({
  isGenerating,
  currentStep = 0,
  totalSteps = 3,
  stepNames = ['Персональный план', 'Подготовка к сеансу', 'PDF для психолога']
}) => {
  if (!isGenerating) return null;

  const getStepIcon = (step: number) => {
    switch (step) {
      case 0:
        return <FileTextOutlined style={{ fontSize: '24px', color: '#1890FF' }} />;
      case 1:
        return <UserOutlined style={{ fontSize: '24px', color: '#52C41A' }} />;
      case 2:
        return <DownloadOutlined style={{ fontSize: '24px', color: '#FA8C16' }} />;
      default:
        return <FileTextOutlined style={{ fontSize: '24px', color: '#D9D9D9' }} />;
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Заголовок */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#E6F7FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <Spin size="large" />
          </div>
          <Typography.Title level={3} style={{ 
            color: '#2C3E50',
            marginBottom: '10px',
            fontFamily: 'Comfortaa, sans-serif'
          }}>
            Генерируем документы
          </Typography.Title>
          <Text style={{ color: '#7B8794', fontSize: '16px' }}>
            Это может занять несколько минут...
          </Text>
        </div>

        {/* Прогресс-бар */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#F0F0F0',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{
              width: `${(currentStep / totalSteps) * 100}%`,
              height: '100%',
              backgroundColor: '#1890FF',
              borderRadius: '3px',
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>
          <Text style={{ color: '#7B8794', fontSize: '14px' }}>
            Шаг {currentStep + 1} из {totalSteps}
          </Text>
        </div>

        {/* Список шагов */}
        <div style={{ textAlign: 'left' }}>
          {stepNames.map((stepName, index) => {
            const status = getStepStatus(index);
            return (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: status === 'active' ? '#E6F7FF' : 
                              status === 'completed' ? '#F6FFED' : '#FAFAFA'
              }}>
                <div style={{ marginRight: '15px' }}>
                  {status === 'completed' ? (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#52C41A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  ) : status === 'active' ? (
                    <Spin size="small" />
                  ) : (
                    getStepIcon(index)
                  )}
                </div>
                <div>
                  <Text style={{
                    color: status === 'completed' ? '#52C41A' : 
                           status === 'active' ? '#1890FF' : '#7B8794',
                    fontWeight: status === 'active' ? '500' : 'normal',
                    fontSize: '14px'
                  }}>
                    {stepName}
                  </Text>
                  {status === 'active' && (
                    <div style={{ marginTop: '4px' }}>
                      <Text style={{ color: '#7B8794', fontSize: '12px' }}>
                        Генерируем...
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Информация о времени */}
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#E6F7FF',
          borderRadius: '8px',
          border: '1px solid #91D5FF'
        }}>
          <Text style={{ color: '#1890FF', fontSize: '14px', fontWeight: '500' }}>
            ⏱️ Генерация может занять до 7 минут
          </Text>
          <div style={{ marginTop: '8px' }}>
            <Text style={{ color: '#1890FF', fontSize: '12px' }}>
              Каждый документ создается на основе предыдущего для максимальной персонализации
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerationAnimation;
