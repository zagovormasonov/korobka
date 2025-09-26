#!/usr/bin/env node

/**
 * Тестирование CORS для домена idenself.com
 */

import https from 'https';
import http from 'http';

const TEST_ORIGINS = [
  'https://idenself.com',
  'http://idenself.com',
  'https://www.idenself.com',
  'https://app.idenself.com',
  'https://test.idenself.com',
  'https://some-random-domain.com'
];

const SERVER_URL = 'https://idenself.com'; // или ваш Render URL

function testCORS(origin) {
  return new Promise((resolve) => {
    const url = new URL(`${SERVER_URL}/api/health`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 10000
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      const allowOrigin = res.headers['access-control-allow-origin'];
      const allowMethods = res.headers['access-control-allow-methods'];
      
      resolve({
        origin,
        status: res.statusCode,
        allowed: allowOrigin === origin || allowOrigin === '*',
        allowOrigin,
        allowMethods,
        success: res.statusCode === 200 || res.statusCode === 204
      });
    });

    req.on('error', (error) => {
      resolve({
        origin,
        status: 0,
        error: error.message,
        allowed: false,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        origin,
        status: 0,
        error: 'Timeout',
        allowed: false,
        success: false
      });
    });

    req.end();
  });
}

async function testAllOrigins() {
  console.log('🔍 Тестирование CORS для различных origins...\n');
  console.log(`🎯 Сервер: ${SERVER_URL}\n`);
  
  for (const origin of TEST_ORIGINS) {
    const result = await testCORS(origin);
    
    const status = result.allowed ? '✅' : '❌';
    const statusText = result.success ? `${result.status}` : `ERR (${result.error || result.status})`;
    
    console.log(`${status} ${origin}`);
    console.log(`   Статус: ${statusText}`);
    
    if (result.allowOrigin) {
      console.log(`   Allow-Origin: ${result.allowOrigin}`);
    }
    
    if (result.allowMethods) {
      console.log(`   Allow-Methods: ${result.allowMethods}`);
    }
    
    if (result.error) {
      console.log(`   Ошибка: ${result.error}`);
    }
    
    console.log('');
  }
  
  console.log('💡 Ожидаемые результаты:');
  console.log('   ✅ Все домены *idenself.com должны быть разрешены');
  console.log('   ❌ Случайные домены должны быть заблокированы');
}

testAllOrigins().catch(console.error);
