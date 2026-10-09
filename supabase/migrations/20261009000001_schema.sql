-- AF Team — esquema base
-- Ejecutar con `supabase db push` o pegando en el SQL Editor en orden (0001 → 0003).

-- gen_random_uuid() es nativo desde Postgres 13 (no requiere pgcrypto).

-- =========================================================================
-- Perfiles y roles
-- =========================================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  role        text not null default 'client' check (role in ('trainer', 'client')),
  created_at  timestamptz not null default now()
);
comment on column public.profiles.role is
  'Solo modificable por un administrador (service_role / SQL). Ver public.promote_to_trainer().';

-- Crea el perfil al registrarse. SIEMPRE como cliente: el rol nunca se toma de los metadatos del navegador.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), ''), 'client')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Alta de entrenadores: mecanismo administrativo. Solo ejecutable desde el SQL Editor / service_role.
create or replace function public.promote_to_trainer(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(p_email);
  if v_id is null then raise exception 'Usuario % no encontrado', p_email; end if;
  update public.profiles set role = 'trainer' where id = v_id;
end $$;
revoke all on function public.promote_to_trainer(text) from public, anon, authenticated;

-- =========================================================================
-- Clientes (asociación entrenador ↔ cliente)
-- =========================================================================
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  trainer_id      uuid not null references public.profiles (id) on delete restrict,
  user_id         uuid unique references public.profiles (id) on delete set null,
  full_name       text not null check (char_length(full_name) between 1 and 120),
  email           text not null default '' check (char_length(email) <= 200),
  phone           text not null default '' check (char_length(phone) <= 30),
  status          text not null default 'activo' check (status in ('activo', 'pausado', 'inactivo')),
  start_date      date not null default current_date,
  active_plan_id  uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index clients_trainer_idx on public.clients (trainer_id);

-- Notas administrativas en tabla aparte: el cliente puede leer su fila de clients, pero NO estas notas.
create table public.client_private_notes (
  client_id   uuid primary key references public.clients (id) on delete cascade,
  notes       text not null default '' check (char_length(notes) <= 4000),
  updated_at  timestamptz not null default now()
);

-- Vista de compatibilidad con el modelo orientativo (trainer_clients).
create view public.trainer_clients with (security_invoker = true) as
  select trainer_id, id as client_id, user_id, status from public.clients;

-- =========================================================================
-- Biblioteca de ejercicios
-- =========================================================================
create table public.muscle_groups (
  id     text primary key,
  label  text not null,
  sort   int not null default 0
);
insert into public.muscle_groups (id, label, sort) values
  ('pecho', 'Pecho', 1), ('espalda', 'Espalda', 2), ('hombros', 'Hombros', 3), ('biceps', 'Bíceps', 4),
  ('triceps', 'Tríceps', 5), ('antebrazos', 'Antebrazos', 6), ('core', 'Abdomen / core', 7),
  ('gluteos', 'Glúteos', 8), ('cuadriceps', 'Cuádriceps', 9), ('isquiotibiales', 'Isquiotibiales', 10),
  ('gemelos', 'Gemelos', 11), ('trapecio', 'Trapecio', 12), ('lumbares', 'Lumbares', 13),
  ('cuerpo_completo', 'Cuerpo completo', 14);

create table public.exercise_library (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  title              text not null check (char_length(title) between 1 and 120),
  primary_muscle     text not null references public.muscle_groups (id),
  secondary_muscles  text[] not null default '{}',
  procedure          text not null default '' check (char_length(procedure) <= 4000),
  technical_cues     text not null default '' check (char_length(technical_cues) <= 2000),
  common_mistakes    text not null default '' check (char_length(common_mistakes) <= 2000),
  equipment          text not null default '' check (char_length(equipment) <= 80),
  difficulty         text check (difficulty in ('basico', 'intermedio', 'avanzado')),
  movement_pattern   text not null default '' check (char_length(movement_pattern) <= 80),
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index exercise_library_owner_title_uq on public.exercise_library (owner_id, lower(title));
create index exercise_library_muscle_idx on public.exercise_library (owner_id, primary_muscle);

-- Original + parámetros de presentación. El archivo nunca se recodifica.
create table public.exercise_media (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null unique references public.exercise_library (id) on delete cascade,
  storage_path  text check (storage_path is null or storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(gif|mp4|webm)$'),
  -- Recurso estático incluido en el frontend (p. ej. GIF de ejemplo en /media/exercises/...).
  public_path   text check (public_path is null or public_path ~ '^/media/exercises/[a-z0-9-]+\.(gif|mp4|webm)$'),
  mime_type     text not null check (mime_type in ('image/gif', 'video/mp4', 'video/webm')),
  size_bytes    bigint not null default 0 check (size_bytes >= 0),
  width         int,
  height        int,
  fit           text not null default 'contain' check (fit in ('contain', 'cover')),
  pos_x         numeric(5, 2) not null default 50 check (pos_x between 0 and 100),
  pos_y         numeric(5, 2) not null default 50 check (pos_y between 0 and 100),
  scale         numeric(4, 2) not null default 1 check (scale between 1 and 3),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check ((storage_path is null) <> (public_path is null))
);

-- =========================================================================
-- Planificación: plan → mesociclo → fase → semana → sesión → ejercicio prescrito
-- =========================================================================
create table public.training_plans (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles (id) on delete cascade,
  client_id        uuid references public.clients (id) on delete cascade, -- null = plantilla
  template_id      uuid references public.training_plans (id) on delete set null,
  name             text not null check (char_length(name) between 1 and 160),
  description      text not null default '' check (char_length(description) <= 2000),
  status           text not null default 'borrador' check (status in ('borrador', 'activo', 'archivado')),
  source           text,
  current_week_id  uuid,
  import_notes     text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index training_plans_owner_idx on public.training_plans (owner_id);
create index training_plans_client_idx on public.training_plans (client_id);

alter table public.clients
  add constraint clients_active_plan_fk foreign key (active_plan_id) references public.training_plans (id) on delete set null;

create table public.mesocycles (
  id         uuid primary key default gen_random_uuid(),
  plan_id    uuid not null references public.training_plans (id) on delete cascade,
  sort       int not null default 1,
  name       text not null default '',
  objective  text
);
create index mesocycles_plan_idx on public.mesocycles (plan_id);

create table public.training_phases (
  id            uuid primary key default gen_random_uuid(),
  mesocycle_id  uuid not null references public.mesocycles (id) on delete cascade,
  sort          int not null default 1,
  name          text not null,
  objective     text
);
create index training_phases_meso_idx on public.training_phases (mesocycle_id);

create table public.training_weeks (
  id            uuid primary key default gen_random_uuid(),
  phase_id      uuid not null references public.training_phases (id) on delete cascade,
  number        int not null check (number > 0),
  status        text not null default 'pendiente' check (status in ('pendiente', 'en_curso', 'completado')),
  scheme        text,
  notes         text,
  source_sheet  text
);
create index training_weeks_phase_idx on public.training_weeks (phase_id);

alter table public.training_plans
  add constraint training_plans_current_week_fk foreign key (current_week_id) references public.training_weeks (id) on delete set null;

create table public.training_sessions (
  id            uuid primary key default gen_random_uuid(),
  week_id       uuid not null references public.training_weeks (id) on delete cascade,
  sort          int not null default 1,
  title         text not null check (char_length(title) between 1 and 160),
  review_flags  text[] not null default '{}'
);
create index training_sessions_week_idx on public.training_sessions (week_id);

create table public.prescribed_exercises (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.training_sessions (id) on delete cascade,
  sort                int not null default 1,
  stage               text not null default 'otro' check (stage in ('calentamiento', 'basico', 'accesorio', 'finalizador', 'otro')),
  exercise_id         uuid references public.exercise_library (id) on delete restrict,
  name                text not null check (char_length(name) between 1 and 200),
  sets                text,
  reps                text,
  load                text,   -- carga PRESCRITA
  rir_rpe             text,
  suggested_load      text,
  suggested_load_alt  text,
  tempo               text,
  rest                text,
  notes               text,
  raw                 jsonb,  -- valores originales del Excel
  review_flags        text[] not null default '{}',
  removed_at          timestamptz -- retirado: se conserva para el historial
);
create index prescribed_exercises_session_idx on public.prescribed_exercises (session_id);
create index prescribed_exercises_exercise_idx on public.prescribed_exercises (exercise_id);

create table public.plan_changes (
  id                      uuid primary key default gen_random_uuid(),
  plan_id                 uuid not null references public.training_plans (id) on delete cascade,
  client_id               uuid references public.clients (id) on delete cascade,
  session_id              uuid references public.training_sessions (id) on delete set null,
  prescribed_exercise_id  uuid references public.prescribed_exercises (id) on delete set null,
  kind                    text not null check (kind in ('editado', 'sustituido', 'retirado', 'anadido', 'reordenado', 'asignado')),
  summary                 text not null check (char_length(summary) <= 500),
  before                  jsonb,
  after                   jsonb,
  related_report_id       uuid,
  created_by              uuid not null default auth.uid() references public.profiles (id),
  created_at              timestamptz not null default now()
);
create index plan_changes_plan_idx on public.plan_changes (plan_id, created_at desc);

-- =========================================================================
-- Registro de entrenamientos (lo EJECUTADO; nunca sobrescribe la prescripción)
-- =========================================================================
create table public.workout_logs (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  plan_id        uuid references public.training_plans (id) on delete set null,
  session_id     uuid references public.training_sessions (id) on delete set null,
  session_title  text not null default '',
  week_number    int,
  status         text not null default 'en_progreso' check (status in ('en_progreso', 'completada')),
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  notes          text not null default '' check (char_length(notes) <= 2000)
);
create index workout_logs_client_idx on public.workout_logs (client_id, started_at desc);

create table public.workout_exercise_logs (
  id                      uuid primary key default gen_random_uuid(),
  workout_log_id          uuid not null references public.workout_logs (id) on delete cascade,
  prescribed_exercise_id  uuid references public.prescribed_exercises (id) on delete set null,
  completed               boolean not null default false,
  notes                   text not null default '' check (char_length(notes) <= 1000),
  unique (workout_log_id, prescribed_exercise_id)
);

create table public.set_logs (
  id               uuid primary key default gen_random_uuid(),
  exercise_log_id  uuid not null references public.workout_exercise_logs (id) on delete cascade,
  set_number       int not null check (set_number between 1 and 30),
  weight           text not null default '' check (char_length(weight) <= 20),
  reps             text not null default '' check (char_length(reps) <= 20),
  effort           text not null default '' check (char_length(effort) <= 20),
  done             boolean not null default false,
  unique (exercise_log_id, set_number)
);

-- =========================================================================
-- Reportes de bienestar (seguimiento del entrenamiento, NO diagnóstico)
-- =========================================================================
create table public.wellbeing_reports (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid not null references public.clients (id) on delete cascade,
  type                    text not null check (type in ('molestia', 'dolor', 'fatiga', 'limitacion', 'dificultad', 'otro')),
  body_area               text not null default '' check (char_length(body_area) <= 60),
  level                   int not null check (level between 0 and 10),
  description             text not null check (char_length(description) between 1 and 2000),
  session_id              uuid references public.training_sessions (id) on delete set null,
  prescribed_exercise_id  uuid references public.prescribed_exercises (id) on delete set null,
  exercise_name           text,
  workout_log_id          uuid references public.workout_logs (id) on delete set null,
  status                  text not null default 'pendiente' check (status in ('pendiente', 'revisado', 'respondido')),
  created_at              timestamptz not null default now(),
  reviewed_at             timestamptz
);
create index wellbeing_reports_client_idx on public.wellbeing_reports (client_id, created_at desc);
create index wellbeing_reports_status_idx on public.wellbeing_reports (status);

alter table public.plan_changes
  add constraint plan_changes_report_fk foreign key (related_report_id) references public.wellbeing_reports (id) on delete set null;

create table public.trainer_responses (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.wellbeing_reports (id) on delete cascade,
  trainer_id  uuid not null default auth.uid() references public.profiles (id),
  message     text not null check (char_length(message) between 1 and 2000),
  adjustment  text not null default '' check (char_length(adjustment) <= 2000),
  created_at  timestamptz not null default now()
);
create index trainer_responses_report_idx on public.trainer_responses (report_id);

-- =========================================================================
-- Notificaciones in-app (las crean triggers; los usuarios solo leen/marcan leídas)
-- =========================================================================
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  type          text not null check (type in ('reporte', 'sesion_completada', 'respuesta', 'rutina')),
  title         text not null,
  body          text not null default '',
  link          text not null default '' check (link = '' or link like '/app/%'),
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger clients_touch before update on public.clients for each row execute function public.touch_updated_at();
create trigger exercise_library_touch before update on public.exercise_library for each row execute function public.touch_updated_at();
create trigger exercise_media_touch before update on public.exercise_media for each row execute function public.touch_updated_at();
create trigger training_plans_touch before update on public.training_plans for each row execute function public.touch_updated_at();
