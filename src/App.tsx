import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import BpdTestPage from './pages/BpdTestPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import DashboardPage from './pages/DashboardPage';
import DashboardTokenPage from './pages/DashboardTokenPage';
import DashboardLoginPage from './pages/DashboardLoginPage';
import OfferPage from './pages/OfferPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ConsentPage from './pages/ConsentPage';

const customTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#00695C',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#00695C',
    borderRadius: 6,
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 6,
      // Кастомный размер для кнопок "Да" и "Нет"
      paddingInlineLG: 55,
      paddingBlockLG: 30,
    },
    Card: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 6,
    },
    Select: {
      borderRadius: 6,
    },
    Slider: {
      trackBg: '#00695C',
      handleColor: '#00695C',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={customTheme} locale={ruRU}>
      <Router>
        <div style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/bpd_test" element={<BpdTestPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lk/login" element={<DashboardLoginPage />} />
            <Route path="/lk/:token" element={<DashboardTokenPage />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/consent" element={<ConsentPage />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
