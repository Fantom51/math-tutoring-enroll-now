-- Add EGE support to homeworks table
ALTER TABLE public.homeworks 
ADD COLUMN is_ege BOOLEAN DEFAULT FALSE,
ADD COLUMN ege_answers TEXT[] DEFAULT NULL;

-- Add EGE answers tracking for students
ALTER TABLE public.student_homeworks
ADD COLUMN ege_student_answers TEXT[] DEFAULT NULL,
ADD COLUMN ege_score INTEGER DEFAULT NULL;