import emailjs from '@emailjs/browser';

// Настройки EmailJS (в production эти значения будут из .env)
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'your_public_key';
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'your_service_id';
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'your_template_id';

interface DashboardAccessData {
  userEmail: string;
  dashboardPassword: string;
  dashboardUrl: string;
}

export const sendDashboardAccessEmail = async (data: DashboardAccessData): Promise<boolean> => {
  try {
    console.log('📧 Отправляем email с данными доступа...');
    console.log('📧 Данные:', { 
      email: data.userEmail, 
      password: data.dashboardPassword,
      url: data.dashboardUrl 
    });

    // Инициализируем EmailJS
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Параметры для шаблона
    const templateParams = {
      to_email: data.userEmail,
      user_email: data.userEmail,
      dashboard_password: data.dashboardPassword,
      dashboard_url: data.dashboardUrl,
      to_name: data.userEmail.split('@')[0], // Используем часть email до @ как имя
    };

    console.log('📧 Параметры шаблона:', templateParams);

    // Отправляем email
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email успешно отправлен:', response);
    return true;
  } catch (error) {
    console.error('❌ Ошибка при отправке email:', error);
    return false;
  }
};

export const checkEmailJSConfig = () => {
  const isConfigured = EMAILJS_PUBLIC_KEY !== 'your_public_key' && 
                      EMAILJS_SERVICE_ID !== 'your_service_id' && 
                      EMAILJS_TEMPLATE_ID !== 'your_template_id';
  
  console.log('📧 EmailJS настроен:', isConfigured);
  return isConfigured;
};
