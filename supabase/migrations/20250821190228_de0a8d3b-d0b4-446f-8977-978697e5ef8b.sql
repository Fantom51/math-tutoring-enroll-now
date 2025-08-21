-- Allow teachers to remove student assignments for their own homeworks
DROP POLICY IF EXISTS "StudentHW: teacher can delete own students" ON public.student_homeworks;

CREATE POLICY "StudentHW: teacher can delete own students"
ON public.student_homeworks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.homeworks h
    WHERE h.id = student_homeworks.homework_id
      AND h.teacher_id = auth.uid()
  )
);