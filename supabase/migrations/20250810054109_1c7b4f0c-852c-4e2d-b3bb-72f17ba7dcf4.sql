-- Fix infinite recursion in RLS for homeworks using a SECURITY DEFINER helper

-- 1) Helper function: checks if current user is assigned to a homework without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_homework_assigned_to_current_user(hw_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_homeworks sh
    WHERE sh.homework_id = hw_id
      AND sh.student_id = auth.uid()
  );
$$;

-- 2) Recreate the SELECT policy for students using the helper function (no joins that cause recursion)
DROP POLICY IF EXISTS "Homeworks: students can read assigned" ON public.homeworks;
CREATE POLICY "Homeworks: students can read assigned"
ON public.homeworks
FOR SELECT
USING (
  public.is_homework_assigned_to_current_user(id)
);
