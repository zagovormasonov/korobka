// Тестовый запрос для проверки сохранения дополнительных тестов
const fetch = require('node-fetch');

async function testAdditionalSave() {
  console.log('🧪 Тестируем сохранение дополнительного теста...');
  
  try {
    const testData = {
      sessionId: 'test-session-123',
      testName: 'Тест ADHD',
      testUrl: 'https://example.com/adhd-test',
      testResult: 'Высокая вероятность СДВГ'
    };
    
    console.log('📤 Отправляем данные:', testData);
    
    const response = await fetch('https://idenself.com/api/tests/additional/save-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Тест прошел успешно');
    } else {
      console.log('❌ Ошибка в тесте');
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

testAdditionalSave();
