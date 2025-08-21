-- Create messages table for teacher-student communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Set replica identity for realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Create policies for messages access
CREATE POLICY "Users can view messages they are part of" 
ON public.messages 
FOR SELECT 
USING (
  auth.uid() = teacher_id OR 
  auth.uid() = student_id
);

CREATE POLICY "Teachers can send messages to their students" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'teacher'
  ) AND
  auth.uid() = teacher_id
);

CREATE POLICY "Students can send messages to teachers" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'student'
  ) AND
  auth.uid() = student_id
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();