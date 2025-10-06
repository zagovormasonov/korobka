import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Upload, message as antMessage, Spin, Card, Typography, Space, Tag } from 'antd';
import { SendOutlined, PaperClipOutlined, FileImageOutlined, FilePdfOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { API_BASE_URL } from '../config/api';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: Array<{ name: string; type: string }>;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('🔄 Messages обновлены:', messages.length, 'сообщений');
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && fileList.length === 0) {
      antMessage.warning('Введите сообщение или прикрепите файл');
      return;
    }

    // Защита от двойной отправки
    if (loading) {
      console.log('⚠️ Запрос уже обрабатывается, пропускаем');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      files: fileList.map(file => ({
        name: file.name,
        type: file.type || 'unknown'
      }))
    };

    // Сохраняем текст сообщения до очистки
    const messageText = inputValue;
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    
    console.log('🚀 Отправка запроса к серверу...', {
      messageLength: messageText.length,
      filesCount: fileList.length
    });

    try {
      const formData = new FormData();
      formData.append('message', messageText);
      
      // Добавляем историю для контекста
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      formData.append('history', JSON.stringify(history));

      // Добавляем файлы
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('files', file.originFileObj);
        }
      });

      // Добавляем таймаут для больших файлов (5 минут для PDF до 20MB)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 минут

      const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Сначала получаем текст ответа
      const responseText = await response.text();
      console.log('📥 Получен ответ от сервера, размер:', responseText.length, 'символов');
      
      // Проверяем, что ответ успешен
      if (!response.ok) {
        console.error('❌ Ошибка ответа сервера:', response.status, responseText.substring(0, 200));
        throw new Error(`Ошибка сервера: ${response.status} - ${responseText.substring(0, 100)}`);
      }

      // Парсим JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ Ошибка парсинга JSON:', responseText.substring(0, 200));
        throw new Error('Сервер вернул некорректный ответ');
      }

      if (!data.success) {
        throw new Error(data.error || 'Ошибка при получении ответа');
      }

      console.log('✅ Успешно получен ответ от сервера:', {
        responseLength: data.response?.length || 0,
        model: data.model
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
      };

      console.log('📝 Добавляю сообщение в чат:', {
        role: assistantMessage.role,
        contentLength: assistantMessage.content.length
      });

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        console.log('📝 Новое состояние сообщений:', newMessages.length, 'сообщений');
        return newMessages;
      });
      
      setFileList([]);
      console.log('✅ Сообщение успешно добавлено в историю чата');
    } catch (error: any) {
      console.error('Ошибка отправки сообщения:', error);
      
      // Обрабатываем разные типы ошибок
      if (error.name === 'AbortError') {
        antMessage.error('Время ожидания ответа истекло. Попробуйте файл меньшего размера или упростите вопрос.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        antMessage.error('Ошибка сети. Проверьте подключение к интернету.');
      } else {
        antMessage.error(error.message || 'Не удалось отправить сообщение');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const beforeUpload = (file: File) => {
    const isValidType = 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf';
    
    if (!isValidType) {
      antMessage.error('Можно загружать только изображения и PDF файлы');
      return false;
    }

    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      antMessage.error('Файл должен быть меньше 20MB');
      return false;
    }

    return false; // Предотвращаем автоматическую загрузку
  };

  const clearChat = () => {
    setMessages([]);
    setFileList([]);
    setInputValue('');
    antMessage.success('Чат очищен');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        height: 'calc(100vh - 40px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Заголовок */}
        <Card
          style={{
            marginBottom: '20px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, color: '#667eea' }}>
                💬 Чат с Gemini 2.5 Pro
              </Title>
              <Text type="secondary">
                Задавайте вопросы и загружайте изображения или PDF для анализа
              </Text>
            </div>
            {messages.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={clearChat}
              >
                Очистить чат
              </Button>
            )}
          </div>
        </Card>

        {/* Область сообщений */}
        <Card
          style={{
            flex: 1,
            marginBottom: '20px',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
          bodyStyle={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {messages.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#999'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>💭</div>
              <Title level={4} type="secondary">
                Начните диалог с Gemini
              </Title>
              <Text type="secondary">
                Отправьте сообщение или загрузите файл для анализа
              </Text>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : '#f0f2f5',
                      color: msg.role === 'user' ? '#fff' : '#000'
                    }}
                  >
                    {msg.files && msg.files.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        {msg.files.map((file, idx) => (
                          <Tag
                            key={idx}
                            icon={file.type === 'application/pdf' ? <FilePdfOutlined /> : <FileImageOutlined />}
                            color={msg.role === 'user' ? 'purple' : 'default'}
                            style={{ marginBottom: '4px' }}
                          >
                            {file.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <Paragraph
                      style={{
                        margin: 0,
                        color: msg.role === 'user' ? '#fff' : '#000',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.content}
                    </Paragraph>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: '#f0f2f5'
                    }}
                  >
                    <Space>
                      <Spin size="small" />
                      <Text type="secondary">Gemini думает...</Text>
                    </Space>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </Card>

        {/* Область ввода */}
        <Card
          style={{
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          {fileList.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <Space wrap>
                {fileList.map(file => (
                  <Tag
                    key={file.uid}
                    closable
                    onClose={() => setFileList(fileList.filter(f => f.uid !== file.uid))}
                    icon={file.type === 'application/pdf' ? <FilePdfOutlined /> : <FileImageOutlined />}
                    color="blue"
                  >
                    {file.name}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          <Space.Compact style={{ width: '100%' }}>
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={beforeUpload}
              showUploadList={false}
              multiple
              accept="image/*,.pdf"
            >
              <Button
                icon={<PaperClipOutlined />}
                size="large"
                style={{ height: '50px' }}
              />
            </Upload>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение... (Enter для отправки, Shift+Enter для новой строки)"
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ height: '50px', resize: 'none' }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="large"
              onClick={handleSend}
              loading={loading}
              style={{ height: '50px' }}
            >
              Отправить
            </Button>
          </Space.Compact>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;

