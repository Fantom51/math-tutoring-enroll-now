
import { createClient } from '@supabase/supabase-js';

// Прямое указание credentials (только для разработки!)
const supabaseUrl = 'https://vkmhatknkasytrwqbpoj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbWhhdGtua2FzeXRyd3FicG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjMxMDYsImV4cCI6MjA2MjczOTEwNn0.wDy6cZKvCE6CLFJEutPwXkCqFXoDAq7uYyUgWP8KsLk';

// Создание клиента с дополнительными настройками
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Сохранять сессию в localStorage
    autoRefreshToken: true // Автоматически обновлять токен
  },
  db: {
    schema: 'public' // Используемая схема
  }
});

// Проверка подключения к другой таблице для отладки
supabase
  .from('profiles')
  .select('count')
  .limit(1)
  .then(response => {
    if (response.error) {
      console.error('Supabase connection error:', response.error);
    } else {
      console.log('Successfully connected to Supabase');
    }

  });
