import { supabase } from '../index.js';

async function addLumiMessageColumn() {
  try {
    console.log('🔧 [MIGRATION] Adding lumi_dashboard_message column...');
    
    // Supabase не поддерживает DDL напрямую через клиент
    // Поэтому используем SQL через их REST API или выполняем вручную
    
    console.log('');
    console.log('📋 [MIGRATION] Выполните следующий SQL в Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE primary_test_results');
    console.log('ADD COLUMN IF NOT EXISTS lumi_dashboard_message TEXT;');
    console.log('');
    console.log('COMMENT ON COLUMN primary_test_results.lumi_dashboard_message IS \'Cached AI-generated welcome message from Lumi mascot for dashboard\';');
    console.log('');
    
    console.log('✅ [MIGRATION] Instructions printed. Please run the SQL manually in Supabase.');
    
  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    process.exit(1);
  }
}

addLumiMessageColumn();

