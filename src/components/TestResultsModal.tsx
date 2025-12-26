import React from 'react';
import { Modal, Typography, Progress, Tag, Space, Divider, Button, Card } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { TestConfig, TestInterpretation, getText } from '../config/tests/types';

const { Title, Text, Paragraph } = Typography;

interface TestResultsModalProps {
  visible: boolean;
  onCancel: () => void;
  config: TestConfig;
  score: number;
  onRetry: () => void;
}

const TestResultsModal: React.FC<TestResultsModalProps> = ({ 
  visible, 
  onCancel, 
  config, 
  score,
  onRetry
}) => {
  const getInterpretation = (score: number): TestInterpretation | undefined => {
    return config.interpretations.find(range => score >= range.min && score <= range.max);
  };

  const interpretation = getInterpretation(score);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#52c41a';
      case 'moderate': return '#faad14';
      case 'high': return '#ff7a45';
      case 'critical': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'moderate': return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'high': return <WarningOutlined style={{ color: '#ff7a45' }} />;
      case 'critical': return <WarningOutlined style={{ color: '#f5222d' }} />;
      default: return null;
    }
  };

  // Максимально возможный балл для шкалы
  const maxPossibleScore = config.questions.reduce((sum, q) => {
    if (q.type === 'slider') {
      // Для слайдера используем max значение
      return sum + (q.max ?? 0);
    }
    if (!q.options || q.options.length === 0) {
      return sum;
    }
    const maxOption = Math.max(...q.options.map(o => o.value));
    return sum + (isNaN(maxOption) ? 0 : maxOption);
      }, 0);

  const percentage = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;

  // Определяем, мобильное ли устройство
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Обработчики для iOS - улучшенная поддержка touch событий
  const handleClose = React.useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleRetry = React.useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      maskClosable={true}
      keyboard={true}
      footer={[
        <Button 
          key="retry" 
          icon={<ReloadOutlined />} 
          onClick={handleRetry}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ 
            fontSize: isMobile ? '14px' : '16px',
            height: isMobile ? '40px' : 'auto',
            padding: isMobile ? '0 12px' : undefined,
            touchAction: 'manipulation'
          }}
        >
          Пройти заново
        </Button>,
        <Button 
          key="close" 
          type="primary" 
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ 
            background: '#4F958B', 
            borderColor: '#4F958B',
            fontSize: isMobile ? '14px' : '16px',
            height: isMobile ? '40px' : 'auto',
            padding: isMobile ? '0 12px' : undefined,
            touchAction: 'manipulation'
          }}
        >
          Понятно
        </Button>
      ]}
      width={isMobile ? '95%' : 600}
      title={null}
      centered
      styles={{
        content: {
          borderRadius: 20,
          padding: isMobile ? '20px' : '24px'
        },
        body: {
          padding: isMobile ? '10px' : '20px'
        }
      }}
    >
      <div style={{ textAlign: 'center', paddingTop: isMobile ? 10 : 20 }}>
        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>{config.name}</Text>
        <Title level={3} style={{ marginTop: 5, marginBottom: isMobile ? 20 : 30, fontSize: isMobile ? '20px' : undefined }}>{config.title}</Title>
        
        <div style={{ marginBottom: isMobile ? 25 : 40 }}>
          <Progress
            type="dashboard"
            percent={percentage}
            strokeColor={getSeverityColor(interpretation?.severity || 'low')}
            format={() => (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: isMobile ? 24 : 32, fontWeight: 'bold' }}>{score}</span>
                <span style={{ fontSize: isMobile ? 10 : 12, opacity: 0.5 }}>баллов</span>
              </div>
            )}
            width={isMobile ? 120 : 160}
          />
        </div>

        {interpretation && (
          <Card 
            style={{ 
              background: `${getSeverityColor(interpretation.severity)}10`, 
              border: `1px solid ${getSeverityColor(interpretation.severity)}30`,
              borderRadius: 16,
              textAlign: 'left',
              marginBottom: isMobile ? 15 : 0
            }}
          >
            <Space align="start" size={isMobile ? 'small' : 'middle'}>
              {getSeverityIcon(interpretation.severity)}
              <div>
                <Title level={5} style={{ margin: 0, fontSize: isMobile ? '16px' : undefined }}>{getText(interpretation.label, 'unknown')}</Title>
                <Paragraph style={{ marginTop: 10, marginBottom: 0, fontSize: isMobile ? '14px' : undefined }}>
                  {getText(interpretation.description, 'unknown')}
                </Paragraph>
          </div>
            </Space>
          </Card>
        )}

        <Divider style={{ margin: isMobile ? '15px 0' : '20px 0' }} />
        
        <div style={{ textAlign: 'left' }}>
          <Title level={5} style={{ fontSize: isMobile ? '16px' : undefined }}>О тесте</Title>
          <Paragraph type="secondary" style={{ fontSize: isMobile ? '13px' : undefined }}>
            {getText(config.description, 'unknown')}
          </Paragraph>
          {config.source && (
            <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }}>
              Источник: <a href={config.source.url} target="_blank" rel="noopener noreferrer">{config.source.name}</a>
                          </Text>
                    )}
                  </div>
      </div>
    </Modal>
  );
};

export default TestResultsModal;
