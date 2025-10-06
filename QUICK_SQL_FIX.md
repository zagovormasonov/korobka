# ⚡ БЫСТРОЕ ИСПРАВЛЕНИЕ (1 минута)

## 🎯 Проблема
```
column primary_test_results.personal_plan does not exist
```

## ✅ Решение

### 1. Откройте Supabase Dashboard
https://supabase.com/dashboard → Ваш проект → SQL Editor

### 2. Скопируйте и выполните этот SQL:

```sql
ALTER TABLE primary_test_results 
ADD COLUMN IF NOT EXISTS personal_plan TEXT;
```

### 3. Нажмите **Run** (или Ctrl+Enter)

### 4. Попробуйте снова сгенерировать план!

---

## ✅ Готово!

Больше ничего делать не нужно. Попробуйте снова нажать "Скачать персональный план".

---

**Подробная инструкция:** `FIX_PERSONAL_PLAN_COLUMN.md`

