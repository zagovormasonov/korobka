import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ [ERROR-BOUNDARY] Поймана ошибка:', error);
    console.error('❌ [ERROR-BOUNDARY] Error Info:', errorInfo);
    console.error('❌ [ERROR-BOUNDARY] Stack:', error.stack);
    
    // Логируем информацию о браузере
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    
    console.error('❌ [ERROR-BOUNDARY] User Agent:', userAgent);
    console.error('❌ [ERROR-BOUNDARY] Is Safari:', isSafari);
    console.error('❌ [ERROR-BOUNDARY] Is iOS:', isIOS);
    
    // Отправляем ошибку на сервер для логирования (не async, используем .then())
    fetch('/api/errors/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        userAgent,
        isSafari,
        isIOS,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Игнорируем ошибки отправки, чтобы не сломать UI
    });
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <Result
            status="error"
            title="Произошла ошибка"
            subTitle={
              <div>
                <p>К сожалению, произошла непредвиденная ошибка.</p>
                {this.state.error && (
                  <details style={{ marginTop: '20px', textAlign: 'left' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                      Детали ошибки
                    </summary>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px'
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack && (
                        <>
                          {'\n\n'}
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </details>
                )}
              </div>
            }
            extra={[
              <Button
                type="primary"
                key="home"
                icon={<HomeOutlined />}
                onClick={() => window.location.href = '/'}
                style={{
                  backgroundColor: '#4F958B',
                  borderColor: '#4F958B'
                }}
              >
                На главную
              </Button>,
              <Button
                key="reload"
                onClick={this.handleReset}
              >
                Перезагрузить страницу
              </Button>
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

