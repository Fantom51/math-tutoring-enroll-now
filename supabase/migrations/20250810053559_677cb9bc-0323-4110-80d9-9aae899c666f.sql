-- Apply storage and homeworks policies to restore teacher uploads and student access
-- HOMEWORKS: students can read assigned
DROP POLICY IF EXISTS "Homeworks: students can read assigned" ON public.homeworks;
CREATE POLICY "Homeworks: students can read assigned"
ON public.homeworks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.student_homeworks sh
    WHERE sh.homework_id = homeworks.id
      AND sh.student_id = auth.uid()
  )
);

-- STORAGE: homework_files bucket policies
-- Allow teachers to upload into their own folder: homework_files/homeworks/<teacher_id>/...
DROP POLICY IF EXISTS "Homework files: teacher can upload to own folder" ON storage.objects;
CREATE POLICY "Homework files: teacher can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework_files'
  AND (storage.foldername(name))[1] = 'homeworks'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow teachers to read any file in their own folder immediately after upload
DROP POLICY IF EXISTS "Homework files: teacher can read folder" ON storage.objects;
CREATE POLICY "Homework files: teacher can read folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'homework_files'
  AND (storage.foldername(name))[1] = 'homeworks'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow teachers to read files of homeworks they own (by DB linkage)
DROP POLICY IF EXISTS "Homework files: teacher can read own" ON storage.objects;
CREATE POLICY "Homework files: teacher can read own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'homework_files'
  AND EXISTS (
    SELECT 1 FROM public.homeworks h
    WHERE h.file_url = name AND h.teacher_id = auth.uid()
  )
);

-- Allow students to read files for homeworks assigned to them
DROP POLICY IF EXISTS "Homework files: students can read assigned" ON storage.objects;
CREATE POLICY "Homework files: students can read assigned"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'homework_files'
  AND EXISTS (
    SELECT 1
    FROM public.homeworks h
    JOIN public.student_homeworks sh ON sh.homework_id = h.id
    WHERE h.file_url = name
      AND sh.student_id = auth.uid()
  )
);
