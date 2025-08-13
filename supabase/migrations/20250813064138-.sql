-- Create table for student cheat sheets
create table if not exists public.student_cheatsheets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null,
  student_id uuid not null,
  title text,
  description text,
  file_path text not null,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.student_cheatsheets enable row level security;

-- Policies: students can read their own
create policy if not exists "Cheatsheets: student can read own"
  on public.student_cheatsheets
  for select
  using (auth.uid() = student_id);

-- Policies: teacher can manage own
create policy if not exists "Cheatsheets: teacher manage own"
  on public.student_cheatsheets
  for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Optional: ensure teacher role on insert/update
create policy if not exists "Cheatsheets: only teachers can insert"
  on public.student_cheatsheets
  for insert
  with check (
    auth.uid() = teacher_id and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'
    )
  );

-- Indexes for performance
create index if not exists idx_cheatsheets_student on public.student_cheatsheets (student_id);
create index if not exists idx_cheatsheets_teacher on public.student_cheatsheets (teacher_id);
create index if not exists idx_cheatsheets_created_at on public.student_cheatsheets (created_at desc);

-- Create Storage bucket for learning resources
insert into storage.buckets (id, name, public)
values ('learning_resources', 'learning_resources', false)
on conflict (id) do nothing;

-- Storage RLS Policies
-- Allow read if there is a related cheatsheet for current user (student or teacher)
create policy if not exists "Learning resources: read assigned"
  on storage.objects
  for select
  using (
    bucket_id = 'learning_resources' and exists (
      select 1 from public.student_cheatsheets sc
      where sc.file_path = storage.objects.name
        and (sc.student_id = auth.uid() or sc.teacher_id = auth.uid())
    )
  );

-- Allow teachers to upload to the bucket
create policy if not exists "Learning resources: teachers can upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'learning_resources' and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'
    )
  );

-- Allow teachers to update/delete their own objects (based on cheatsheets relation)
create policy if not exists "Learning resources: teachers can update"
  on storage.objects
  for update
  using (
    bucket_id = 'learning_resources' and exists (
      select 1 from public.student_cheatsheets sc
      where sc.file_path = storage.objects.name and sc.teacher_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'learning_resources' and exists (
      select 1 from public.student_cheatsheets sc
      where sc.file_path = storage.objects.name and sc.teacher_id = auth.uid()
    )
  );

create policy if not exists "Learning resources: teachers can delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'learning_resources' and exists (
      select 1 from public.student_cheatsheets sc
      where sc.file_path = storage.objects.name and sc.teacher_id = auth.uid()
    )
  );