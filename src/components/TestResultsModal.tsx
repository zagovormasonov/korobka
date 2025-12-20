import React from 'react';
import { Modal, Typography, Progress, Tag, Space, Divider, Button, Card } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { TestConfig, TestInterpretation } from '../config/tests/types';

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
    const maxOption = Math.max(...q.options.map(o => o.value));
    return sum + (isNaN(maxOption) ? 0 : maxOption);
      }, 0);

  const percentage = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="retry" icon={<ReloadOutlined />} onClick={onRetry}>
          Пройти заново
        </Button>,
        <Button key="close" type="primary" onClick={onCancel} style={{ background: '#4F958B', borderColor: '#4F958B' }}>
          Понятно
        </Button>
      ]}
      width={600}
      title={null}
      centered
      styles={{
        content: {
          borderRadius: 20
        }
      }}
    >
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <Text type="secondary" style={{ fontSize: 14 }}>{config.name}</Text>
        <Title level={3} style={{ marginTop: 5, marginBottom: 30 }}>{config.title}</Title>
        
        <div style={{ marginBottom: 40 }}>
          <Progress
            type="dashboard"
            percent={percentage}
            strokeColor={getSeverityColor(interpretation?.severity || 'low')}
            format={() => (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 32, fontWeight: 'bold' }}>{score}</span>
                <span style={{ fontSize: 12, opacity: 0.5 }}>баллов</span>
              </div>
            )}
            width={160}
          />
        </div>

        {interpretation && (
          <Card 
            style={{ 
              background: `${getSeverityColor(interpretation.severity)}10`, 
              border: `1px solid ${getSeverityColor(interpretation.severity)}30`,
              borderRadius: 16,
              textAlign: 'left'
            }}
          >
            <Space align="start">
              {getSeverityIcon(interpretation.severity)}
              <div>
                <Title level={5} style={{ margin: 0 }}>{interpretation.label}</Title>
                <Paragraph style={{ marginTop: 10, marginBottom: 0 }}>
                  {interpretation.description}
                </Paragraph>
          </div>
            </Space>
          </Card>
        )}

        <Divider />
        
        <div style={{ textAlign: 'left' }}>
          <Title level={5}>О тесте</Title>
          <Paragraph type="secondary">
            {config.description}
          </Paragraph>
          {config.source && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Источник: <a href={config.source.url} target="_blank" rel="noopener noreferrer">{config.source.name}</a>
                          </Text>
                    )}
                  </div>
      </div>
    </Modal>
  );
};

export default TestResultsModal;
