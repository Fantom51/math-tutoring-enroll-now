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

// Исправленная функция для создания профилей с корректными политиками
const fixProfilesTable = async () => {
  try {
    console.log("Исправление таблицы profiles и политик доступа...");
    
    // Проверяем существование таблицы и если есть, пробуем исправить политики
    const { data: existingTable, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    if (checkError && checkError.code === '42P01') {
      // Таблица не существует, создаем новую
      await supabase.rpc('execute_sql', { 
        sql: `
          DROP TABLE IF EXISTS profiles CASCADE;
          
          CREATE TABLE profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            first_name TEXT,
            last_name TEXT,
            email TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
            bio TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );
          
          -- Включаем Row Level Security и сбрасываем все политики
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Пользователи могут видеть все профили" ON profiles;
          DROP POLICY IF EXISTS "Пользователи могут редактировать только свой профиль" ON profiles;
          DROP POLICY IF EXISTS "Пользователи могут создавать только свой профиль" ON profiles;
          
          -- Создаем простые и работающие политики
          CREATE POLICY "allow_read_all_profiles" 
            ON profiles FOR SELECT 
            USING (true);
          
          CREATE POLICY "allow_update_own_profile" 
            ON profiles FOR UPDATE 
            USING (auth.uid() = id);
          
          CREATE POLICY "allow_insert_own_profile" 
            ON profiles FOR INSERT 
            WITH CHECK (auth.uid() = id);
        `
      });
      console.log("Таблица profiles создана с новыми политиками");
    } else if (existingTable) {
      // Таблица существует, исправляем политики
      await supabase.rpc('execute_sql', { 
        sql: `
          -- Сбрасываем все существующие политики для таблицы profiles
          DROP POLICY IF EXISTS "Пользователи могут видеть все профили" ON profiles;
          DROP POLICY IF EXISTS "Пользователи могут редактировать только свой профиль" ON profiles;
          DROP POLICY IF EXISTS "Пользователи могут создавать только свой профиль" ON profiles;
          
          -- Создаем новые, более простые политики
          CREATE POLICY IF NOT EXISTS "allow_read_all_profiles" 
            ON profiles FOR SELECT 
            USING (true);
          
          CREATE POLICY IF NOT EXISTS "allow_update_own_profile" 
            ON profiles FOR UPDATE 
            USING (auth.uid() = id);
          
          CREATE POLICY IF NOT EXISTS "allow_insert_own_profile" 
            ON profiles FOR INSERT 
            WITH CHECK (auth.uid() = id);
        `
      });
      console.log("Политики для таблицы profiles обновлены");
    }
  } catch (error) {
    console.error("Ошибка при исправлении таблицы profiles:", error);
  }
};

// Исправляем таблицу profiles при загрузке
fixProfilesTable()
  .then(() => console.log("Таблица profiles проверена и исправлена"))
  .catch(err => console.error("Ошибка при исправлении таблицы profiles:", err));

// Инициализация таблиц при подключении, если их нет
export const initializeTables = async () => {
  try {
    console.log("Starting table initialization check...");
    
    // Создаем общую функцию для выполнения произвольного SQL, если она еще не существует
    try {
      await supabase.rpc('execute_sql', { 
        sql: `
          CREATE OR REPLACE FUNCTION execute_sql(sql text) RETURNS void AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      console.log("SQL execute function created successfully");
    } catch (error) {
      console.log("SQL execute function might already exist, continuing:", error);
    }
    
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
        
        // Попробуем создать SQL функцию и затем создать таблицу
        await createSqlFunctions();
        const retryResult = await supabase.rpc('create_profiles_table');
        if (retryResult.error) {
          console.error('Повторная попытка создания таблицы profiles не удалась:', retryResult.error);
        } else {
          console.log('Таблица profiles успешно создана при повторной попытке!');
        }
      } else {
        console.log('Таблица profiles успешно создана!');
      }
    } else {
      console.log('Таблица profiles уже существует');
    }

    // Проверяем наличие таблицы homeworks
    const { error: homeworksError } = await supabase
      .from('homeworks')
      .select('count')
      .limit(1);
    
    if (homeworksError && homeworksError.code === '42P01') {
      console.log('Создаем таблицу homeworks...');
      const { error } = await supabase.rpc('create_homeworks_table');
      if (error) {
        console.error('Ошибка при создании таблицы homeworks:', error);
        
        // Создадим SQL функцию для таблицы homeworks если не существует
        await supabase.rpc('execute_sql', { 
          sql: `
            CREATE OR REPLACE FUNCTION create_homeworks_table() RETURNS void AS $$
            BEGIN
              CREATE TABLE IF NOT EXISTS homeworks (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                file_url TEXT,
                teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
              );

              CREATE TABLE IF NOT EXISTS student_homeworks (
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
                homework_id UUID NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
                status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
                submission_url TEXT,
                submission_date TIMESTAMPTZ,
                grade NUMERIC,
                feedback TEXT,
                created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
                UNIQUE(student_id, homework_id)
              );

              -- Политики для таблицы homeworks
              CREATE POLICY "Учителя могут создавать домашние задания" 
                ON homeworks FOR INSERT 
                WITH CHECK (auth.uid() = teacher_id AND 
                          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
              
              CREATE POLICY "Учителя могут редактировать свои домашние задания" 
                ON homeworks FOR UPDATE 
                USING (auth.uid() = teacher_id AND 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
              
              CREATE POLICY "Учителя могут видеть свои домашние задания" 
                ON homeworks FOR SELECT 
                USING (auth.uid() = teacher_id AND 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
              
              -- Политики для таблицы student_homeworks
              CREATE POLICY "Учителя могут назначать задания студентам" 
                ON student_homeworks FOR INSERT 
                WITH CHECK (EXISTS (
                  SELECT 1 FROM homeworks 
                  WHERE id = homework_id AND teacher_id = auth.uid() AND
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
                ));
              
              CREATE POLICY "Учителя могут видеть назначенные задания" 
                ON student_homeworks FOR SELECT 
                USING (EXISTS (
                  SELECT 1 FROM homeworks 
                  WHERE id = homework_id AND teacher_id = auth.uid() AND
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
                ));
              
              CREATE POLICY "Студенты могут видеть свои задания" 
                ON student_homeworks FOR SELECT 
                USING (auth.uid() = student_id AND 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'));
              
              CREATE POLICY "Студенты могут обновлять свои задания" 
                ON student_homeworks FOR UPDATE 
                USING (auth.uid() = student_id AND 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'));
            END;
            $$ LANGUAGE plpgsql;
          `
        });
        
        // Пробуем создать таблицу еще раз
        const retryResult = await supabase.rpc('create_homeworks_table');
        if (retryResult.error) {
          console.error('Повторная попытка создания таблицы homeworks не удалась:', retryResult.error);
        } else {
          console.log('Таблицы homeworks и student_homeworks успешно созданы при повторной попытке!');
        }
      } else {
        console.log('Таблицы homeworks и student_homeworks успешно созданы!');
      }
    } else {
      console.log('Таблица homeworks уже существует');
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
        
        // Пробуем создать таблицу еще раз
        const retryResult = await supabase.rpc('create_teacher_availability_table');
        if (retryResult.error) {
          console.error('Повторная попытка создания таблицы teacher_availability не удалась:', retryResult.error);
        } else {
          console.log('Таблица teacher_availability успешно создана при повторной попытке!');
        }
      } else {
        console.log('Таблица teacher_availability успешно создана!');
      }
    } else {
      console.log('Таблица teacher_availability уже существует');
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
        
        // Пробуем создать таблицу еще раз
        const retryResult = await supabase.rpc('create_bookings_table');
        if (retryResult.error) {
          console.error('Повторная попытка создания таблицы bookings не удалась:', retryResult.error);
        } else {
          console.log('Таблица bookings успешно создана при повторной попытке!');
        }
      } else {
        console.log('Таблица bookings успешно создана!');
      }
    } else {
      console.log('Таблица bookings уже существует');
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

// Создание SQL-функций для инициализации таблиц в Supabase
export const createSqlFunctions = async () => {
  try {
    console.log("Creating SQL functions...");
    
    // Создаем SQL-функцию для создания таблицы profiles
    await supabase.rpc('execute_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION create_profiles_table() RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            first_name TEXT,
            last_name TEXT,
            email TEXT NOT NULL,
            phone TEXT,
            role TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
            bio TEXT,
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );
          
          -- Включаем Row Level Security и сбрасываем все политики
          ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Пользователи могут видеть все профили" ON profiles;
          DROP POLICY IF EXISTS "Пользователи могут редактировать только свой профиль" ON profiles;
          DROP POLICY IF EXISTS "Пользователи могут создавать только свой профиль" ON profiles;
          
          -- Создаем простые и работающие политики
          CREATE POLICY "allow_read_all_profiles" 
            ON profiles FOR SELECT 
            USING (true);
          
          CREATE POLICY "allow_update_own_profile" 
            ON profiles FOR UPDATE 
            USING (auth.uid() = id);
          
          CREATE POLICY "allow_insert_own_profile" 
            ON profiles FOR INSERT 
            WITH CHECK (auth.uid() = id);
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    // Создаем остальные функции
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
          
          CREATE POLICY "Все могут просматривать своб��дные слоты учителей" 
            ON teacher_availability FOR SELECT USING (true);
        END;
        $$ LANGUAGE plpgsql;
      `
    });

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

    await supabase.rpc('execute_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION create_homeworks_table() RETURNS void AS $$
        BEGIN
          CREATE TABLE IF NOT EXISTS homeworks (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            file_url TEXT,
            teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
          );

          CREATE TABLE IF NOT EXISTS student_homeworks (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            homework_id UUID NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
            submission_url TEXT,
            submission_date TIMESTAMPTZ,
            grade NUMERIC,
            feedback TEXT,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            UNIQUE(student_id, homework_id)
          );

          -- Политики для таблицы homeworks
          CREATE POLICY "Учителя могут создавать домашние задания" 
            ON homeworks FOR INSERT 
            WITH CHECK (auth.uid() = teacher_id AND 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
          
          CREATE POLICY "Учителя могут редактировать свои домашние задания" 
            ON homeworks FOR UPDATE 
            USING (auth.uid() = teacher_id AND 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
          
          CREATE POLICY "Учителя могут видеть свои домашние задания" 
            ON homeworks FOR SELECT 
            USING (auth.uid() = teacher_id AND 
                      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
          
          -- Политики для таблицы student_homeworks
          CREATE POLICY "Учителя могут назначать задания студентам" 
            ON student_homeworks FOR INSERT 
            WITH CHECK (EXISTS (
              SELECT 1 FROM homeworks 
              WHERE id = homework_id AND teacher_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
            ));
          
          CREATE POLICY "Учителя могут видеть назначенные задания" 
            ON student_homeworks FOR SELECT 
            USING (EXISTS (
              SELECT 1 FROM homeworks 
              WHERE id = homework_id AND teacher_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
            ));
          
          CREATE POLICY "Студенты могут видеть свои задания" 
            ON student_homeworks FOR SELECT 
            USING (auth.uid() = student_id AND 
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'));
          
          CREATE POLICY "Студенты могут обновлять свои задания" 
            ON student_homeworks FOR UPDATE 
            USING (auth.uid() = student_id AND 
                  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'));
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
  try {
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
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
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
  try {
    console.log(`Creating profile for user ${userId} with data:`, profileData);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, ...profileData }]);
    
    if (error) {
      console.error('Error creating user profile:', error);
      return { data: null, error };
    }
    
    console.log('Profile created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in createUserProfile:', error);
    return { data: null, error: { message: 'Unexpected error creating profile' } };
  }
};
