-- Add is_read field to messages table to track read status
ALTER TABLE public.messages 
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Add index for better performance when querying unread messages
CREATE INDEX idx_messages_unread ON public.messages(teacher_id, student_id, is_read) 
WHERE is_read = false;