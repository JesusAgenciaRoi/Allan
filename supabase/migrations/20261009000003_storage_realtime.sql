-- AF Team — Storage (GIF/vídeos de ejercicios) y Realtime.

-- Bucket PRIVADO: los archivos se sirven con URLs firmadas de corta duración.
-- Límite de tamaño y tipos MIME impuestos en servidor (además de la validación del frontend).
-- Si cambias VITE_MAX_UPLOAD_MB, actualiza también file_size_limit.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-media', 'exercise-media', false, 15728640, array['image/gif', 'video/mp4', 'video/webm'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Estructura de rutas: <trainer_uid>/<exercise_id>/<uuid>.<ext>
-- Solo el entrenador dueño escribe en su carpeta; sus clientes pueden leer.
create policy "media: trainer uploads to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'exercise-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.is_trainer()
    and exists (
      select 1 from public.exercise_library e
      where e.id::text = (storage.foldername(name))[2] and e.owner_id = auth.uid()
    )
  );

create policy "media: trainer updates own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_trainer());

create policy "media: trainer deletes own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_trainer());

create policy "media: trainer and own clients read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'exercise-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = public.my_trainer_id()::text
    )
  );

-- Realtime: postgres_changes respeta RLS, así que cada usuario solo recibe sus filas.
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.wellbeing_reports;

-- =========================================================================
-- Consultas del formulario público de contacto
-- anon puede INSERTAR (no leer). Solo los entrenadores leen.
-- =========================================================================
create table public.contact_requests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null check (char_length(email) between 3 and 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text not null default '' check (char_length(phone) <= 30),
  goal        text not null default '' check (char_length(goal) <= 60),
  message     text not null default '' check (char_length(message) <= 1000),
  created_at  timestamptz not null default now()
);
alter table public.contact_requests enable row level security;
revoke all on public.contact_requests from anon;
grant insert on public.contact_requests to anon, authenticated;
create policy contact_insert on public.contact_requests for insert to anon, authenticated with check (true);
create policy contact_trainer_read on public.contact_requests for select to authenticated using (public.is_trainer());
