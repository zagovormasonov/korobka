import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import BpdTestPage from './pages/BpdTestPage';
import TestInfoPage from './pages/TestInfoPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import DashboardPage from './pages/DashboardPage';
import DashboardTokenPage from './pages/DashboardTokenPage';
import DashboardLoginPage from './pages/DashboardLoginPage';
import PersonalPlanPage from './pages/PersonalPlanPage';
import OfferPage from './pages/OfferPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ConsentPage from './pages/ConsentPage';
import ChatPage from './pages/ChatPage';

const customTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: 'rgb(243, 186, 111)',
    colorPrimaryHover: 'rgb(253, 196, 131)',
    colorPrimaryActive: 'rgb(233, 176, 101)',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: 'rgb(243, 186, 111)',
    borderRadius: 6,
    wireframe: false,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  components: {
    Typography: {
      titleFontFamily: 'Comfortaa, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    },
    Button: {
      borderRadius: 24,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      // Кастомный размер для кнопок "Да" и "Нет"
      paddingInlineLG: 55,
      paddingBlockLG: 30,
      primaryColor: 'rgb(243, 186, 111)',
      colorPrimary: 'rgb(243, 186, 111)',
      colorPrimaryHover: 'rgb(253, 196, 131)',
      colorPrimaryActive: 'rgb(233, 176, 101)',
      colorTextLightSolid: '#ffffff',
      colorPrimaryText: '#ffffff',
      colorPrimaryTextHover: '#ffffff',
      colorPrimaryTextActive: '#ffffff',
    },
    Card: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 6,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    },
    Select: {
      borderRadius: 6,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    },
    Slider: {
      trackBg: 'rgb(243, 186, 111)',
      trackHoverBg: 'rgb(243, 186, 111)',
      handleColor: 'rgb(243, 186, 111)',
      handleActiveColor: 'rgb(243, 186, 111)',
      colorPrimaryBorderHover: 'rgb(243, 186, 111)',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={customTheme} locale={ruRU}>
      <Router>
        <div style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/test-info" element={<TestInfoPage />} />
            <Route path="/bpd_test" element={<BpdTestPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/personal-plan" element={<PersonalPlanPage />} />
            <Route path="/lk/login" element={<DashboardLoginPage />} />
            <Route path="/lk/:token" element={<DashboardTokenPage />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/consent" element={<ConsentPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;
