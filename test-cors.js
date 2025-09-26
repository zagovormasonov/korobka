// Простой тест CORS с локальной машины
const fetch = require('node-fetch');

async function testCORS() {
  console.log('🧪 Тестируем CORS...');
  
  try {
    // Тест 1: Health check
    console.log('\n1️⃣ Тестируем health endpoint...');
    const healthResponse = await fetch('https://korobka-1.onrender.com/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Тест 2: CORS test endpoint
    console.log('\n2️⃣ Тестируем CORS endpoint...');
    const corsResponse = await fetch('https://korobka-1.onrender.com/api/test-cors', {
      method: 'GET',
      headers: {
        'Origin': 'https://idenself.com',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', corsResponse.status);
    console.log('📊 Response headers:', Object.fromEntries(corsResponse.headers));
    
    const corsData = await corsResponse.json();
    console.log('✅ CORS test:', corsData);
    
    // Тест 3: Questions endpoint
    console.log('\n3️⃣ Тестируем questions endpoint...');
    const questionsResponse = await fetch('https://korobka-1.onrender.com/api/tests/primary/questions', {
      method: 'GET',
      headers: {
        'Origin': 'https://idenself.com',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Questions status:', questionsResponse.status);
    console.log('📊 Questions headers:', Object.fromEntries(questionsResponse.headers));
    
    if (questionsResponse.ok) {
      const questionsData = await questionsResponse.json();
      console.log('✅ Questions count:', questionsData.length);
    } else {
      const error = await questionsResponse.text();
      console.log('❌ Questions error:', error);
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

testCORS();