
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

// Инициализация таблиц при подключении, если их нет
export const initializeTables = async () => {
  try {
    // Проверяем наличие таблицы profiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError && profilesError.code === '42P01') {
      console.log('Создаем таблицу profiles...');
      const { error } = await supabase.rpc('create_profiles_table');
      if (error) {
        console.error('Ошибка при создании таблицы profiles:', error);
      } else {
        console.log('Таблица profiles успешно создана!');
      }
    }

    // Проверяем наличие таблицы teacher_availability
    const { error: availabilityError } = await supabase
      .from('teacher_availability')
      .select('count')
      .limit(1);
    
    if (availabilityError && availabilityError.code === '42P01') {
      console.log('Создаем таблицу teacher_availability...');
      const { error } = await supabase.rpc('create_teacher_availability_table');
      if (error) {
        console.error('Ошибка при создании таблицы teacher_availability:', error);
      } else {
        console.log('Таблица teacher_availability успешно создана!');
      }
    }

    // Проверяем наличие таблицы bookings
    const { error: bookingsError } = await supabase
      .from('bookings')
      .select('count')
      .limit(1);
    
    if (bookingsError && bookingsError.code === '42P01') {
      console.log('Создаем таблицу bookings...');
      const { error } = await supabase.rpc('create_bookings_table');
      if (error) {
        console.error('Ошибка при создании таблицы bookings:', error);
      } else {
        console.log('Таблица bookings успешно создана!');
      }
    }

    console.log('Проверка таблиц завершена');
  } catch (error) {
    console.error('Ошибка при инициализации таблиц:', error);
  }
};

// Проверка подключения и инициализация таблиц
supabase
  .from('profiles')
  .select('count')
  .limit(1)
  .then(response => {
    if (response.error) {
      console.error('Supabase connection error:', response.error);
      // Если ошибка связана с отсутствием таблицы, пробуем создать таблицы
      if (response.error.code === '42P01') {
        initializeTables();
      }
    } else {
      console.log('Successfully connected to Supabase');
      // Всё равно проверяем остальные таблицы
      initializeTables();
    }
  });

// Функции для создания SQL-функций в Supabase для инициализации таблиц
export const createSqlFunctions = async () => {
  try {
    // Создаем SQL-функцию для создания таблицы profiles
    await supabase.rpc('execute_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION create_profiles_table() RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            first_name TEXT,
            last_name TEXT,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
            bio TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );

          -- Создаем политику для доступа к собственному профилю
          CREATE POLICY "Пользователи могут видеть все профили" 
            ON profiles FOR SELECT USING (true);
          
          CREATE POLICY "Пользователи могут редактировать только свой профиль" 
            ON profiles FOR UPDATE USING (auth.uid() = id);
          
          CREATE POLICY "Пользователи могут создавать только свой профиль" 
            ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    // Создаем SQL-функцию для создания таблицы teacher_availability
    await supabase.rpc('execute_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION create_teacher_availability_table() RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS teacher_availability (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            time_from TIME NOT NULL,
            time_to TIME NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            UNIQUE(teacher_id, date, time_from, time_to)
          );

          -- Создаем политики для таблицы teacher_availability
          CREATE POLICY "Учителя могут добавлять свои свободные слоты" 
            ON teacher_availability FOR INSERT 
            WITH CHECK (auth.uid() = teacher_id AND 
                       EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
          
          CREATE POLICY "Учителя могут изменять свои свободные слоты" 
            ON teacher_availability FOR UPDATE 
            USING (auth.uid() = teacher_id AND 
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
          
          CREATE POLICY "Учителя могут удалять свои свободные слоты" 
            ON teacher_availability FOR DELETE 
            USING (auth.uid() = teacher_id AND 
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
          
          CREATE POLICY "Все могут просматривать свободные слоты учителей" 
            ON teacher_availability FOR SELECT USING (true);
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    // Создаем SQL-функцию для создания таблицы bookings
    await supabase.rpc('execute_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION create_bookings_table() RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS bookings (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            time_from TIME NOT NULL,
            time_to TIME NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
            subject TEXT,
            comments TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            UNIQUE(teacher_id, date, time_from, time_to)
          );

          -- Создаем политики для таблицы bookings
          CREATE POLICY "Студенты могут создавать бронирования" 
            ON bookings FOR INSERT 
            WITH CHECK (auth.uid() = student_id AND 
                       EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'));
          
          CREATE POLICY "Студенты могут видеть свои бронирования" 
            ON bookings FOR SELECT 
            USING (auth.uid() = student_id);
          
          CREATE POLICY "Учителя могут видеть бронирования на свое время" 
            ON bookings FOR SELECT 
            USING (auth.uid() = teacher_id AND 
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
          
          CREATE POLICY "Студенты могут отменять свои бронирования" 
            ON bookings FOR UPDATE 
            USING (auth.uid() = student_id AND status != 'cancelled');
          
          CREATE POLICY "Учителя могут подтверждать или отменять бронирования" 
            ON bookings FOR UPDATE 
            USING (auth.uid() = teacher_id AND 
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    // Создаем общую функцию для выполнения произвольного SQL
    await supabase.rpc('execute_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION execute_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    console.log('SQL-функции успешно созданы');
  } catch (error) {
    console.error('Ошибка при создании SQL-функций:', error);
  }
};

// Экспортируем основные функции для работы с пользователями
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

export const updateUserProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId);
  
  if (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
  
  return { data, error: null };
};

export const createUserProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, ...profileData }]);
  
  if (error) {
    console.error('Error creating user profile:', error);
    return { data: null, error };
  }
  
  return { data, error: null };
};
