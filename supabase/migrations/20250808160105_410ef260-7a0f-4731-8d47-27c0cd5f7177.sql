-- Create utility function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles table for user info and roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  role text NOT NULL CHECK (role IN ('student','teacher')),
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
DROP POLICY IF EXISTS "Profiles: anyone authenticated can read" ON public.profiles;
CREATE POLICY "Profiles: anyone authenticated can read"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Profiles: users can insert their own" ON public.profiles;
CREATE POLICY "Profiles: users can insert their own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: users can update their own" ON public.profiles;
CREATE POLICY "Profiles: users can update their own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create signup trigger to auto-create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (NEW.id, NEW.email, coalesce(NEW.raw_user_meta_data->>'role','student'), '', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Teacher availability (date + time_slot)
CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_slot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, date, time_slot)
);

ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Availability: teachers can manage their own" ON public.teacher_availability;
CREATE POLICY "Availability: teachers can manage their own"
ON public.teacher_availability
FOR ALL
TO authenticated
USING (auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'teacher'))
WITH CHECK (auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'teacher'));

DROP POLICY IF EXISTS "Availability: anyone authenticated can read" ON public.teacher_availability;
CREATE POLICY "Availability: anyone authenticated can read"
ON public.teacher_availability
FOR SELECT
TO authenticated
USING (true);

-- Bookings table (student books teacher at a time_slot)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  time_slot text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, date, time_slot)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Trigger for bookings.updated_at
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation: ensure booking matches a teacher availability and not double-booked
CREATE OR REPLACE FUNCTION public.validate_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the time slot exists in teacher availability
  IF NOT EXISTS (
    SELECT 1 FROM public.teacher_availability ta
    WHERE ta.teacher_id = NEW.teacher_id
      AND ta.date = NEW.date
      AND ta.time_slot = NEW.time_slot
  ) THEN
    RAISE EXCEPTION 'Selected time slot is not available for this teacher';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_booking ON public.bookings;
CREATE TRIGGER trg_validate_booking
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking();

-- RLS policies for bookings
DROP POLICY IF EXISTS "Bookings: student can create own" ON public.bookings;
CREATE POLICY "Bookings: student can create own"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'student')
);

DROP POLICY IF EXISTS "Bookings: student can read own" ON public.bookings;
CREATE POLICY "Bookings: student can read own"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Bookings: teacher can read own" ON public.bookings;
CREATE POLICY "Bookings: teacher can read own"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Bookings: student can update own" ON public.bookings;
CREATE POLICY "Bookings: student can update own"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Bookings: teacher can update own" ON public.bookings;
CREATE POLICY "Bookings: teacher can update own"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

-- Homeworks and submissions
CREATE TABLE IF NOT EXISTS public.homeworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Homeworks: teacher manage own" ON public.homeworks;
CREATE POLICY "Homeworks: teacher manage own"
ON public.homeworks
FOR ALL
TO authenticated
USING (auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'teacher'))
WITH CHECK (auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'teacher'));

CREATE TABLE IF NOT EXISTS public.student_homeworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  homework_id uuid NOT NULL REFERENCES public.homeworks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  solution_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, homework_id)
);

ALTER TABLE public.student_homeworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "StudentHW: teacher can assign" ON public.student_homeworks;
CREATE POLICY "StudentHW: teacher can assign"
ON public.student_homeworks
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.homeworks h WHERE h.id = homework_id AND h.teacher_id = auth.uid()
));

DROP POLICY IF EXISTS "StudentHW: student can read own" ON public.student_homeworks;
CREATE POLICY "StudentHW: student can read own"
ON public.student_homeworks
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "StudentHW: teacher can read own students" ON public.student_homeworks;
CREATE POLICY "StudentHW: teacher can read own students"
ON public.student_homeworks
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.homeworks h WHERE h.id = homework_id AND h.teacher_id = auth.uid()
));

DROP POLICY IF EXISTS "StudentHW: student can update own" ON public.student_homeworks;
CREATE POLICY "StudentHW: student can update own"
ON public.student_homeworks
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);

-- Storage buckets for homework files and solutions
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework_files','homework_files', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('homework_solutions','homework_solutions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
-- Allow teachers to upload to homework_files under homeworks/{teacherId}/...
DROP POLICY IF EXISTS "Storage: teachers upload homework files" ON storage.objects;
CREATE POLICY "Storage: teachers upload homework files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework_files' AND
  (storage.foldername(name))[1] = 'homeworks' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to read homework files
DROP POLICY IF EXISTS "Storage: read homework files" ON storage.objects;
CREATE POLICY "Storage: read homework files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'homework_files');

-- Allow students to upload solutions under solutions/{studentId}/...
DROP POLICY IF EXISTS "Storage: students upload solutions" ON storage.objects;
CREATE POLICY "Storage: students upload solutions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework_solutions' AND
  (storage.foldername(name))[1] = 'solutions' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow teachers and students to read solutions (broad for MVP)
DROP POLICY IF EXISTS "Storage: read solutions (auth)" ON storage.objects;
CREATE POLICY "Storage: read solutions (auth)"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'homework_solutions');