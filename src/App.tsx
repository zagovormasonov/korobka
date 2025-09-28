import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import DashboardPage from './pages/DashboardPage';
import DashboardTokenPage from './pages/DashboardTokenPage';
import DashboardLoginPage from './pages/DashboardLoginPage';
import OfferPage from './pages/OfferPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ConsentPage from './pages/ConsentPage';
import BpdTestPage from './pages/BpdTestPage';

const customTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#F7B98F',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#A7D7C4',
    borderRadius: 8,
    wireframe: false,
    fontFamily: 'Comfortaa, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 8,
      fontFamily: 'Comfortaa, sans-serif',
      // Кастомный размер для кнопок "Да" и "Нет"
      paddingInlineLG: 55,
      paddingBlockLG: 30,
    },
    Card: {
      borderRadius: 12,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Slider: {
      trackBg: '#F7B98F',
      handleColor: '#F7B98F',
    },
    Typography: {
      fontFamily: 'Comfortaa, sans-serif',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={customTheme} locale={ruRU}>
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lk/login" element={<DashboardLoginPage />} />
            <Route path="/lk/:token" element={<DashboardTokenPage />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/consent" element={<ConsentPage />} />
            <Route path="/bpd_test" element={<BpdTestPage />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
