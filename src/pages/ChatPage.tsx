import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Upload, message as antMessage, Spin, Space, Tag, Tooltip, Checkbox } from 'antd';
import { SendOutlined, PaperClipOutlined, FileImageOutlined, FilePdfOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { API_BASE_URL } from '../config/api';

const { TextArea } = Input;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: Array<{ name: string; type: string }>;
  image?: { mimeType: string; dataUrl: string; fileName?: string };
  model?: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [nanoBananaMode, setNanoBananaMode] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Мобильная адаптация
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Загружаем историю чата из localStorage при инициализации
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        console.log('📚 История чата восстановлена из localStorage:', parsedMessages.length, 'сообщений');
      } catch (error) {
        console.error('❌ Ошибка при восстановлении истории чата:', error);
        localStorage.removeItem('chatHistory');
      }
    }
  }, []);

  // Сохраняем историю чата в localStorage при каждом изменении
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
      console.log('💾 История чата сохранена в localStorage:', messages.length, 'сообщений');
    }
  }, [messages]);

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
        content: data.response,
        model: data.model
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
      if (nanoBananaMode) {
        handleSendNanoBanana();
      } else {
        handleSend();
      }
    }
  };

  const beforeUpload = (file: File) => {
    if (nanoBananaMode) {
      if (!file.type.startsWith('image/')) {
        antMessage.error('В режиме nano banana pro можно загружать только изображения');
        return false;
      }
      const isLt20M = file.size / 1024 / 1024 < 20;
      if (!isLt20M) {
        antMessage.error('Файл должен быть меньше 20MB');
        return false;
      }
      return false;
    }

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

  const handleSendNanoBanana = async () => {
    if (loading) return;
    if (!inputValue.trim()) {
      antMessage.warning('Введите промпт для генерации изображения');
      return;
    }
    const imageFile = fileList.find(f => (f.type || '').startsWith('image/'))?.originFileObj;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      files: fileList.map(file => ({ name: file.name, type: file.type || 'unknown' }))
    };

    const promptText = inputValue;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('prompt', promptText);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/image`, {
        method: 'POST',
        body: formData
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status} - ${responseText.substring(0, 200)}`);
      }

      let data: any;
      try { data = JSON.parse(responseText); } catch {
        throw new Error('Сервер вернул некорректный ответ');
      }
      if (!data.success) {
        throw new Error(data.error || 'Не удалось сгенерировать изображение');
      }

      const mimeType = data.image?.mimeType || 'image/png';
      const base64 = data.image?.data;
      if (!base64) throw new Error('Сервер не вернул изображение');

      const dataUrl = `data:${mimeType};base64,${base64}`;
      const assistantMessage: Message = {
        role: 'assistant',
        content: 'Готово. Сгенерировал изображение:',
        model: data.model,
        image: {
          mimeType,
          dataUrl,
          fileName: `nano-banana.${mimeType.split('/')[1] || 'png'}`
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setFileList([]);
    } catch (error: any) {
      console.error('Ошибка генерации изображения:', error);
      antMessage.error(error.message || 'Не удалось сгенерировать изображение');
    } finally {
      setLoading(false);
    }
  };

  const downloadDataUrl = (dataUrl: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const clearChat = () => {
    setMessages([]);
    setFileList([]);
    setInputValue('');
    localStorage.removeItem('chatHistory');
    console.log('🗑️ История чата очищена из localStorage');
    antMessage.success('Чат очищен');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: isMobile ? '12px' : '16px'
        }}
      >
        {/* Сообщения (единственная зона скролла) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isMobile ? '8px' : '12px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                minHeight: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                padding: '24px 12px'
              }}
            >
              <div style={{ fontSize: '56px', marginBottom: '8px' }}>💭</div>
              <div style={{ fontSize: '16px', opacity: 0.9 }}>Напиши сообщение или прикрепи файл</div>
              <div style={{ fontSize: '13px', opacity: 0.75, marginTop: '6px' }}>
                Enter — отправить, Shift+Enter — новая строка
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      maxWidth: isMobile ? '85%' : '70%',
                      padding: isMobile ? '10px 12px' : '12px 16px',
                      borderRadius: '16px',
                      background:
                        msg.role === 'user'
                          ? 'rgba(255,255,255,0.18)'
                          : 'rgba(255,255,255,0.85)',
                      color: msg.role === 'user' ? '#ffffff' : '#1f1f1f',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.10)'
                    }}
                  >
                    {msg.role === 'assistant' && msg.model && (
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>
                        Модель: {msg.model}
                      </div>
                    )}
                    {msg.files && msg.files.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        {msg.files.map((file, idx) => (
                          <Tag
                            key={idx}
                            icon={file.type === 'application/pdf' ? <FilePdfOutlined /> : <FileImageOutlined />}
                            color={msg.role === 'user' ? 'default' : 'default'}
                            style={{ marginBottom: '4px' }}
                          >
                            {file.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '14px',
                        lineHeight: '1.55'
                      }}
                    >
                      {msg.content}
                    </div>

                    {msg.image?.dataUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <img
                          src={msg.image.dataUrl}
                          alt="Сгенерированное изображение"
                          style={{
                            width: '100%',
                            maxWidth: '420px',
                            borderRadius: '12px',
                            display: 'block'
                          }}
                        />
                        <div style={{ marginTop: '8px' }}>
                          <Button
                            size="small"
                            onClick={() => downloadDataUrl(msg.image!.dataUrl, msg.image!.fileName || 'image.png')}
                          >
                            Скачать
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.85)',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.10)'
                    }}
                  >
                    <Space size={8}>
                      <Spin size="small" />
                      <span style={{ color: '#333' }}>Думаю…</span>
                    </Space>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Ввод (фиксирован снизу внутри fixed-экрана) */}
        <div
          style={{
            marginTop: '12px',
            padding: '10px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Checkbox
              checked={nanoBananaMode}
              onChange={(e) => {
                setNanoBananaMode(e.target.checked);
                setFileList([]); // чтобы не мешать PDF/мультифайлы режимам
              }}
            >
              nano banana pro (генерация изображения)
            </Checkbox>
          </div>

          {fileList.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
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

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={beforeUpload}
              showUploadList={false}
              multiple
              accept="image/*,.pdf"
            >
              <Tooltip title="Прикрепить файл">
                <Button icon={<PaperClipOutlined />} size="large" style={{ height: '44px' }} />
              </Tooltip>
            </Upload>

            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Сообщение…"
              autoSize={{ minRows: 1, maxRows: isMobile ? 4 : 5 }}
              style={{ resize: 'none' }}
              disabled={loading}
            />

            <Tooltip title="Отправить">
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="large"
                onClick={nanoBananaMode ? handleSendNanoBanana : handleSend}
                loading={loading}
                style={{ height: '44px', minWidth: '44px' }}
                aria-label="Отправить"
              />
            </Tooltip>

            {messages.length > 0 && (
              <Tooltip title="Очистить чат">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="large"
                  onClick={clearChat}
                  style={{ height: '44px', minWidth: '44px' }}
                  aria-label="Очистить чат"
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

