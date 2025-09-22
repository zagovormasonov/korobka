#!/usr/bin/env node

/**
 * Скрипт для проверки готовности к деплою на Render.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Проверка готовности к деплою на Render.com...\n');

// Проверяем наличие необходимых файлов
const requiredFiles = [
  'render.yaml',
  'env.render.example',
  'RENDER_DEPLOYMENT.md',
  'package.json',
  'server/index.js'
];

console.log('📁 Проверка файлов:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Проверяем package.json
console.log('\n📦 Проверка package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Проверяем скрипты
  const requiredScripts = ['build', 'start'];
  requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} script: ${script}`);
    if (!exists) allFilesExist = false;
  });
  
  // Проверяем main
  const main = packageJson.main;
  console.log(`  ${main === 'server/index.js' ? '✅' : '❌'} main: ${main}`);
  if (main !== 'server/index.js') allFilesExist = false;
  
} catch (error) {
  console.log('  ❌ Ошибка чтения package.json:', error.message);
  allFilesExist = false;
}

// Проверяем server/index.js
console.log('\n🖥️ Проверка server/index.js:');
try {
  const serverContent = fs.readFileSync('server/index.js', 'utf8');
  
  const checks = [
    { name: 'Статическая раздача фронтенда', pattern: /express\.static.*dist/ },
    { name: 'SPA fallback', pattern: /app\.get\('\*'/ },
    { name: 'CORS для render.com', pattern: /render\.com/ },
    { name: 'NODE_ENV проверка', pattern: /NODE_ENV.*production/ }
  ];
  
  checks.forEach(check => {
    const found = check.pattern.test(serverContent);
    console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
    if (!found) allFilesExist = false;
  });
  
} catch (error) {
  console.log('  ❌ Ошибка чтения server/index.js:', error.message);
  allFilesExist = false;
}

// Проверяем render.yaml
console.log('\n⚙️ Проверка render.yaml:');
try {
  const renderYaml = fs.readFileSync('render.yaml', 'utf8');
  
  const checks = [
    { name: 'Тип сервиса', pattern: /type:\s*web/ },
    { name: 'Build команда', pattern: /buildCommand/ },
    { name: 'Start команда', pattern: /startCommand/ },
    { name: 'DISABLE_PROXY', pattern: /DISABLE_PROXY/ }
  ];
  
  checks.forEach(check => {
    const found = check.pattern.test(renderYaml);
    console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
    if (!found) allFilesExist = false;
  });
  
} catch (error) {
  console.log('  ❌ Ошибка чтения render.yaml:', error.message);
  allFilesExist = false;
}

// Итоговый результат
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 Все проверки пройдены! Приложение готово к деплою на Render.com');
  console.log('\n📋 Следующие шаги:');
  console.log('1. Создайте PostgreSQL сервис в Render.com');
  console.log('2. Создайте Web Service и подключите репозиторий');
  console.log('3. Настройте переменные окружения');
  console.log('4. Запустите деплой');
  console.log('5. Выполните инициализацию БД: npm run init-db');
} else {
  console.log('❌ Обнаружены проблемы. Исправьте их перед деплоем.');
}
console.log('='.repeat(50));
