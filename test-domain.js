#!/usr/bin/env node

/**
 * Скрипт для тестирования нового домена idenself.com
 */

import https from 'https';
import http from 'http';

const DOMAIN = 'idenself.com';
const ENDPOINTS = [
  '/',
  '/api/health',
  '/api/health/database',
  '/api/tests/primary/questions'
];

function testEndpoint(protocol, hostname, path) {
  return new Promise((resolve) => {
    const client = protocol === 'https:' ? https : http;
    const options = {
      hostname,
      path,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Domain-Test-Script/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        path,
        status: 0,
        error: error.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        status: 0,
        error: 'Timeout',
        success: false
      });
    });

    req.end();
  });
}

async function testDomain() {
  console.log(`🌐 Тестирование домена: ${DOMAIN}\n`);
  
  const protocols = ['https:', 'http:'];
  
  for (const protocol of protocols) {
    console.log(`📡 Тестирование ${protocol}//${DOMAIN}`);
    console.log('='.repeat(50));
    
    for (const endpoint of ENDPOINTS) {
      const result = await testEndpoint(protocol, DOMAIN, endpoint);
      
      const status = result.success ? '✅' : '❌';
      const statusCode = result.status || 'ERR';
      
      console.log(`${status} ${endpoint} - ${statusCode}`);
      
      if (result.error) {
        console.log(`   Ошибка: ${result.error}`);
      } else if (result.data) {
        const preview = result.data.replace(/\n/g, ' ').trim();
        console.log(`   Ответ: ${preview}`);
      }
      
      if (result.headers && result.headers['content-type']) {
        console.log(`   Тип: ${result.headers['content-type']}`);
      }
      
      console.log('');
    }
    
    console.log('');
  }
  
  // Дополнительная проверка DNS
  console.log('🔍 DNS информация:');
  console.log('Выполните в терминале:');
  console.log(`nslookup ${DOMAIN}`);
  console.log(`dig ${DOMAIN}`);
}

testDomain().catch(console.error);
