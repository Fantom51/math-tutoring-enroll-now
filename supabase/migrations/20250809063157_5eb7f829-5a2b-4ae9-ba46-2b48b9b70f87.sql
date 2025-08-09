-- Allow students to see assigned homeworks
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

-- Storage policies for homework files in private bucket
-- Teachers can upload to their own folder: homework_files/homeworks/<teacher_id>/...
CREATE POLICY "Homework files: teacher can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework_files'
  AND (storage.foldername(name))[1] = 'homeworks'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Teachers can read their own homework files
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

-- Students can read files of homeworks assigned to them
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