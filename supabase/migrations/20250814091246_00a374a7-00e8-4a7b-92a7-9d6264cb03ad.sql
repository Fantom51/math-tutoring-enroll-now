-- Create cheat sheet topics table
CREATE TABLE public.cheat_sheet_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on topics table
ALTER TABLE public.cheat_sheet_topics ENABLE ROW LEVEL SECURITY;

-- Create policies for topics
CREATE POLICY "Topics: teacher can manage own" 
ON public.cheat_sheet_topics 
FOR ALL 
USING (auth.uid() = teacher_id AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'teacher'
))
WITH CHECK (auth.uid() = teacher_id AND EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() AND p.role = 'teacher'
));

CREATE POLICY "Topics: students can read from their teachers" 
ON public.cheat_sheet_topics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM student_cheatsheets sc 
  WHERE sc.teacher_id = cheat_sheet_topics.teacher_id 
  AND sc.student_id = auth.uid()
));

-- Add topic_id to student_cheatsheets table
ALTER TABLE public.student_cheatsheets 
ADD COLUMN topic_id UUID REFERENCES public.cheat_sheet_topics(id);

-- Create trigger for automatic timestamp updates on topics
CREATE TRIGGER update_cheat_sheet_topics_updated_at
BEFORE UPDATE ON public.cheat_sheet_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();