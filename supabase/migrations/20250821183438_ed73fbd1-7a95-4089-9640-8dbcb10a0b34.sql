-- RLS: allow participants to mark received messages as read
CREATE POLICY "Messages: participants can mark received as read"
ON public.messages
FOR UPDATE
USING (
  ((auth.uid() = teacher_id) AND (sender_id <> auth.uid()))
  OR
  ((auth.uid() = student_id) AND (sender_id <> auth.uid()))
)
WITH CHECK (
  ((auth.uid() = teacher_id) AND (sender_id <> auth.uid()))
  OR
  ((auth.uid() = student_id) AND (sender_id <> auth.uid()))
);

-- Trigger to restrict updates to only is_read (and allow updated_at to change)
CREATE OR REPLACE FUNCTION public.restrict_message_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.id <> OLD.id
     OR NEW.teacher_id <> OLD.teacher_id
     OR NEW.student_id <> OLD.student_id
     OR NEW.sender_id <> OLD.sender_id
     OR NEW.content <> OLD.content
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Only is_read (and updated_at) can be updated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_message_updates ON public.messages;
CREATE TRIGGER trg_restrict_message_updates
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.restrict_message_updates();

-- Ensure updated_at is kept fresh on update
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();