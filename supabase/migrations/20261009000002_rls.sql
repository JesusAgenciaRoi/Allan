-- AF Team — Row Level Security, privilegios por columna y triggers de notificación.
-- Principio: el frontend no decide permisos. Todo acceso pasa por estas políticas.

-- =========================================================================
-- Funciones auxiliares (security definer para evitar recursión de políticas)
-- =========================================================================
create or replace function public.is_trainer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer');
$$;

create or replace function public.my_client_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.clients where user_id = auth.uid();
$$;

create or replace function public.my_trainer_id()
returns uuid language sql stable security definer set search_path = public as $$
  select trainer_id from public.clients where user_id = auth.uid();
$$;

create or replace function public.trains_client(p_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.clients where id = p_client and trainer_id = auth.uid())
     and public.is_trainer();
$$;

create or replace function public.plan_owner(p_plan uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.training_plans where id = p_plan and owner_id = auth.uid())
     and public.is_trainer();
$$;

create or replace function public.plan_readable(p_plan uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.training_plans p
    where p.id = p_plan
      and (p.owner_id = auth.uid() or (p.client_id is not null and p.client_id = public.my_client_id()))
  );
$$;

create or replace function public.plan_of_mesocycle(p_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select plan_id from public.mesocycles where id = p_id;
$$;
create or replace function public.plan_of_phase(p_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select m.plan_id from public.training_phases f join public.mesocycles m on m.id = f.mesocycle_id where f.id = p_id;
$$;
create or replace function public.plan_of_week(p_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select public.plan_of_phase(phase_id) from public.training_weeks where id = p_id;
$$;
create or replace function public.plan_of_session(p_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select public.plan_of_week(week_id) from public.training_sessions where id = p_id;
$$;

create or replace function public.client_of_log(p_log uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select client_id from public.workout_logs where id = p_log;
$$;
create or replace function public.client_of_exercise_log(p_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select l.client_id from public.workout_exercise_logs e join public.workout_logs l on l.id = e.workout_log_id where e.id = p_id;
$$;
create or replace function public.log_is_open(p_log uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workout_logs where id = p_log and status = 'en_progreso');
$$;
create or replace function public.exercise_log_open(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.log_is_open(workout_log_id) from public.workout_exercise_logs where id = p_id;
$$;

-- =========================================================================
-- Activar RLS en todas las tablas
-- =========================================================================
alter table public.profiles               enable row level security;
alter table public.clients                enable row level security;
alter table public.client_private_notes   enable row level security;
alter table public.muscle_groups          enable row level security;
alter table public.exercise_library       enable row level security;
alter table public.exercise_media         enable row level security;
alter table public.training_plans         enable row level security;
alter table public.mesocycles             enable row level security;
alter table public.training_phases        enable row level security;
alter table public.training_weeks         enable row level security;
alter table public.training_sessions      enable row level security;
alter table public.prescribed_exercises   enable row level security;
alter table public.plan_changes           enable row level security;
alter table public.workout_logs           enable row level security;
alter table public.workout_exercise_logs  enable row level security;
alter table public.set_logs               enable row level security;
alter table public.wellbeing_reports      enable row level security;
alter table public.trainer_responses      enable row level security;
alter table public.notifications          enable row level security;

-- anon no accede a nada de la app.
revoke all on all tables in schema public from anon;

-- =========================================================================
-- profiles: cada uno ve el suyo; el entrenador ve los de sus clientes.
-- El rol NO es actualizable por los usuarios (privilegio por columna).
-- =========================================================================
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or exists (select 1 from public.clients c where c.user_id = profiles.id and c.trainer_id = auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- =========================================================================
-- clients
-- =========================================================================
create policy clients_trainer_all on public.clients for all to authenticated
  using (trainer_id = auth.uid() and public.is_trainer())
  with check (trainer_id = auth.uid() and public.is_trainer());
create policy clients_self_select on public.clients for select to authenticated
  using (user_id = auth.uid());
-- user_id solo lo vincula la Edge Function invite-client (service_role).
revoke update on public.clients from authenticated;
grant update (full_name, email, phone, status, start_date, active_plan_id) on public.clients to authenticated;

create policy private_notes_trainer on public.client_private_notes for all to authenticated
  using (public.trains_client(client_id)) with check (public.trains_client(client_id));

-- =========================================================================
-- Biblioteca
-- =========================================================================
create policy muscle_groups_read on public.muscle_groups for select to authenticated using (true);

create policy exercises_read on public.exercise_library for select to authenticated
  using (owner_id = auth.uid() or owner_id = public.my_trainer_id());
create policy exercises_write on public.exercise_library for insert to authenticated
  with check (owner_id = auth.uid() and public.is_trainer());
create policy exercises_update on public.exercise_library for update to authenticated
  using (owner_id = auth.uid() and public.is_trainer()) with check (owner_id = auth.uid());
create policy exercises_delete on public.exercise_library for delete to authenticated
  using (owner_id = auth.uid() and public.is_trainer());

create policy media_read on public.exercise_media for select to authenticated
  using (exists (select 1 from public.exercise_library e where e.id = exercise_id
                 and (e.owner_id = auth.uid() or e.owner_id = public.my_trainer_id())));
create policy media_write on public.exercise_media for all to authenticated
  using (exists (select 1 from public.exercise_library e where e.id = exercise_id and e.owner_id = auth.uid()) and public.is_trainer())
  with check (exists (select 1 from public.exercise_library e where e.id = exercise_id and e.owner_id = auth.uid()) and public.is_trainer());

-- =========================================================================
-- Planes y jerarquía: lectura para el dueño y el cliente asignado; escritura solo el entrenador dueño.
-- =========================================================================
-- Condición directa (no plan_readable(id)): la fila recién insertada debe ser visible para INSERT ... RETURNING.
create policy plans_read on public.training_plans for select to authenticated
  using (owner_id = auth.uid() or (client_id is not null and client_id = public.my_client_id()));
create policy plans_insert on public.training_plans for insert to authenticated
  with check (owner_id = auth.uid() and public.is_trainer() and (client_id is null or public.trains_client(client_id)));
create policy plans_update on public.training_plans for update to authenticated
  using (public.plan_owner(id)) with check (owner_id = auth.uid() and (client_id is null or public.trains_client(client_id)));
create policy plans_delete on public.training_plans for delete to authenticated using (public.plan_owner(id));

create policy meso_read on public.mesocycles for select to authenticated using (public.plan_readable(plan_id));
create policy meso_write on public.mesocycles for all to authenticated
  using (public.plan_owner(plan_id)) with check (public.plan_owner(plan_id));

create policy phases_read on public.training_phases for select to authenticated
  using (public.plan_readable(public.plan_of_mesocycle(mesocycle_id)));
create policy phases_write on public.training_phases for all to authenticated
  using (public.plan_owner(public.plan_of_mesocycle(mesocycle_id)))
  with check (public.plan_owner(public.plan_of_mesocycle(mesocycle_id)));

create policy weeks_read on public.training_weeks for select to authenticated
  using (public.plan_readable(public.plan_of_phase(phase_id)));
create policy weeks_write on public.training_weeks for all to authenticated
  using (public.plan_owner(public.plan_of_phase(phase_id)))
  with check (public.plan_owner(public.plan_of_phase(phase_id)));

create policy sessions_read on public.training_sessions for select to authenticated
  using (public.plan_readable(public.plan_of_week(week_id)));
create policy sessions_write on public.training_sessions for all to authenticated
  using (public.plan_owner(public.plan_of_week(week_id)))
  with check (public.plan_owner(public.plan_of_week(week_id)));

create policy pe_read on public.prescribed_exercises for select to authenticated
  using (public.plan_readable(public.plan_of_session(session_id)));
create policy pe_write on public.prescribed_exercises for all to authenticated
  using (public.plan_owner(public.plan_of_session(session_id)))
  with check (public.plan_owner(public.plan_of_session(session_id)));

create policy changes_read on public.plan_changes for select to authenticated using (public.plan_readable(plan_id));
create policy changes_insert on public.plan_changes for insert to authenticated
  with check (public.plan_owner(plan_id) and created_by = auth.uid());

-- =========================================================================
-- Registros de entrenamiento: el cliente escribe los suyos mientras están abiertos; el entrenador lee.
-- =========================================================================
create policy logs_client_select on public.workout_logs for select to authenticated
  using (client_id = public.my_client_id() or public.trains_client(client_id));
create policy logs_client_insert on public.workout_logs for insert to authenticated
  with check (client_id = public.my_client_id());
create policy logs_client_update on public.workout_logs for update to authenticated
  using (client_id = public.my_client_id() and status = 'en_progreso')
  with check (client_id = public.my_client_id());

create policy exlogs_select on public.workout_exercise_logs for select to authenticated
  using (public.client_of_log(workout_log_id) = public.my_client_id() or public.trains_client(public.client_of_log(workout_log_id)));
create policy exlogs_write on public.workout_exercise_logs for insert to authenticated
  with check (public.client_of_log(workout_log_id) = public.my_client_id() and public.log_is_open(workout_log_id));
create policy exlogs_update on public.workout_exercise_logs for update to authenticated
  using (public.client_of_log(workout_log_id) = public.my_client_id() and public.log_is_open(workout_log_id));

create policy sets_select on public.set_logs for select to authenticated
  using (public.client_of_exercise_log(exercise_log_id) = public.my_client_id()
         or public.trains_client(public.client_of_exercise_log(exercise_log_id)));
create policy sets_insert on public.set_logs for insert to authenticated
  with check (public.client_of_exercise_log(exercise_log_id) = public.my_client_id() and public.exercise_log_open(exercise_log_id));
create policy sets_update on public.set_logs for update to authenticated
  using (public.client_of_exercise_log(exercise_log_id) = public.my_client_id() and public.exercise_log_open(exercise_log_id));

-- =========================================================================
-- Reportes y respuestas
-- =========================================================================
create policy reports_select on public.wellbeing_reports for select to authenticated
  using (client_id = public.my_client_id() or public.trains_client(client_id));
create policy reports_insert on public.wellbeing_reports for insert to authenticated
  with check (client_id = public.my_client_id() and status = 'pendiente' and reviewed_at is null);
create policy reports_trainer_update on public.wellbeing_reports for update to authenticated
  using (public.trains_client(client_id)) with check (public.trains_client(client_id));
revoke update on public.wellbeing_reports from authenticated;
grant update (status, reviewed_at) on public.wellbeing_reports to authenticated;

create policy responses_select on public.trainer_responses for select to authenticated
  using (exists (select 1 from public.wellbeing_reports r where r.id = report_id
                 and (r.client_id = public.my_client_id() or public.trains_client(r.client_id))));
create policy responses_insert on public.trainer_responses for insert to authenticated
  with check (trainer_id = auth.uid()
              and exists (select 1 from public.wellbeing_reports r where r.id = report_id and public.trains_client(r.client_id)));

-- =========================================================================
-- Notificaciones: solo el destinatario las lee y marca como leídas.
-- =========================================================================
create policy notifications_select on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
revoke insert, update, delete on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- =========================================================================
-- Triggers que generan notificaciones (security definer: escriben en el buzón de otro usuario)
-- =========================================================================
create or replace function public.notify_new_report()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select trainer_id, full_name into c from public.clients where id = new.client_id;
  insert into public.notifications (recipient_id, type, title, body, link)
  values (c.trainer_id, 'reporte', 'Nuevo reporte: ' || c.full_name,
          new.type || ' · ' || coalesce(nullif(new.body_area, ''), 'sin zona') || ' · nivel ' || new.level || '/10'
            || coalesce(' · ' || new.exercise_name, ''),
          '/app/entrenador/reportes?id=' || new.id);
  return new;
end $$;
create trigger wellbeing_reports_notify after insert on public.wellbeing_reports
  for each row execute function public.notify_new_report();

create or replace function public.notify_session_completed()
returns trigger language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if new.status = 'completada' and (tg_op = 'INSERT' or old.status is distinct from 'completada') then
    select trainer_id, full_name into c from public.clients where id = new.client_id;
    insert into public.notifications (recipient_id, type, title, body, link)
    values (c.trainer_id, 'sesion_completada', 'Sesión completada: ' || c.full_name,
            'Semana ' || coalesce(new.week_number::text, '—') || ' · ' || new.session_title,
            '/app/entrenador/clientes/' || new.client_id || '?tab=sesiones');
  end if;
  return new;
end $$;
create trigger workout_logs_notify after insert or update on public.workout_logs
  for each row execute function public.notify_session_completed();

create or replace function public.on_trainer_response()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  update public.wellbeing_reports
     set status = 'respondido', reviewed_at = coalesce(reviewed_at, now())
   where id = new.report_id;
  select c.user_id into v_user from public.wellbeing_reports r join public.clients c on c.id = r.client_id where r.id = new.report_id;
  if v_user is not null then
    insert into public.notifications (recipient_id, type, title, body, link)
    values (v_user, 'respuesta', 'Tu entrenador respondió a tu reporte', left(new.message, 120), '/app/cliente/reportes');
  end if;
  return new;
end $$;
create trigger trainer_responses_notify after insert on public.trainer_responses
  for each row execute function public.on_trainer_response();

create or replace function public.notify_plan_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if new.client_id is null then return new; end if;
  select user_id into v_user from public.clients where id = new.client_id;
  if v_user is not null then
    insert into public.notifications (recipient_id, type, title, body, link)
    values (v_user, 'rutina', 'Tu rutina ha cambiado', left(new.summary, 200),
            case when new.session_id is null then '/app/cliente/rutina' else '/app/cliente/sesion/' || new.session_id end);
  end if;
  return new;
end $$;
create trigger plan_changes_notify after insert on public.plan_changes
  for each row execute function public.notify_plan_change();

-- Las funciones auxiliares no deben ser invocables por anon.
revoke execute on function public.notify_new_report(), public.notify_session_completed(),
  public.on_trainer_response(), public.notify_plan_change(), public.handle_new_user() from public, anon, authenticated;
