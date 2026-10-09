// Verifica las migraciones de supabase/migrations en Postgres real (PGlite/WASM) con stubs mínimos
// de Supabase (roles, auth.uid(), storage, publicación realtime) y prueba las políticas RLS clave.
//   npm run verify:sql
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const STUBS = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to authenticated; grant all on storage.objects to authenticated;
create publication supabase_realtime;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

const T = '00000000-0000-0000-0000-00000000000a'; // entrenador
const T2 = '00000000-0000-0000-0000-00000000000b'; // otro entrenador
const C1 = '00000000-0000-0000-0000-0000000000c1'; // cliente 1
const C2 = '00000000-0000-0000-0000-0000000000c2'; // cliente 2

async function main() {
  const db = new PGlite();
  await db.exec(STUBS);
  const dir = 'supabase/migrations';
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    try {
      await db.exec(readFileSync(join(dir, f), 'utf8'));
      console.log('✓ migración', f);
    } catch (e) {
      console.error('✗ migración', f, (e as Error).message);
      process.exit(1);
    }
  }

  // Datos base como superusuario
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${T}', 't@x.com', '{"full_name":"Entrenador","role":"trainer"}'),
      ('${T2}', 't2@x.com', '{}'), ('${C1}', 'c1@x.com', '{}'), ('${C2}', 'c2@x.com', '{}');
    select public.promote_to_trainer('t@x.com'); select public.promote_to_trainer('t2@x.com');
  `);

  let failures = 0;
  const check = (name: string, ok: boolean) => {
    console.log(`${ok ? '✓' : '✗'} ${name}`);
    if (!ok) failures++;
  };
  const as = async <R>(uid: string | null, sql: string, params: unknown[] = []) => {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
    try {
      return { rows: (await db.query<R>(sql, params)).rows, error: null as string | null };
    } catch (e) {
      if (process.env.DEBUG) console.log('   ·', (e as Error).message);
      return { rows: [] as R[], error: (e as Error).message };
    } finally {
      await db.exec('reset role;');
    }
  };

  const roleOf = await db.query<{ role: string }>(`select role from public.profiles where id = '${C1}'`);
  check('el registro crea perfiles como cliente aunque los metadatos digan otra cosa', roleOf.rows[0].role === 'client');

  const esc = await as(C1, `update public.profiles set role = 'trainer' where id = '${C1}'`);
  check('un cliente NO puede hacerse entrenador', !!esc.error);

  const ins = await as(T, `insert into public.clients (trainer_id, full_name, email) values ('${T}', 'Cliente 1', 'c1@x.com'), ('${T}', 'Cliente 2', 'c2@x.com') returning id`);
  check('el entrenador crea clientes', ins.rows.length === 2 && !ins.error);
  await db.exec(`update public.clients set user_id = '${C1}' where email = 'c1@x.com'; update public.clients set user_id = '${C2}' where email = 'c2@x.com';`);

  const badIns = await as(C1, `insert into public.clients (trainer_id, full_name) values ('${C1}', 'yo')`);
  check('un cliente NO puede crear clientes', !!badIns.error);

  const otherTrainer = await as(T2, `select * from public.clients`);
  check('otro entrenador NO ve clientes ajenos', otherTrainer.rows.length === 0);

  const selfSee = await as(C1, `select full_name from public.clients`);
  check('el cliente solo ve su propia ficha', selfSee.rows.length === 1);

  await as(T, `insert into public.client_private_notes (client_id, notes) select id, 'secreto' from public.clients`);
  const notes = await as(C1, `select * from public.client_private_notes`);
  check('el cliente NO ve notas administrativas', notes.rows.length === 0);

  // Plan asignado al cliente 1
  const plan = await as<{ id: string }>(
    T,
    `with c as (select id from public.clients where email = 'c1@x.com')
     insert into public.training_plans (owner_id, client_id, name, status) select '${T}', id, 'Plan', 'activo' from c returning id`,
  );
  const planId = plan.rows[0]?.id;
  await as(T, `insert into public.mesocycles (id, plan_id, name) values ('10000000-0000-0000-0000-000000000001', '${planId}', 'M')`);
  await as(T, `insert into public.training_phases (id, mesocycle_id, name) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'F')`);
  await as(T, `insert into public.training_weeks (id, phase_id, number) values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1)`);
  await as(T, `insert into public.training_sessions (id, week_id, title) values ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'S1')`);
  const pe = await as(T, `insert into public.prescribed_exercises (id, session_id, name, load) values ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Sentadilla', '100') returning id`);
  check('el entrenador crea la jerarquía del plan', !pe.error && pe.rows.length === 1);

  check('el cliente 1 ve su prescripción', (await as(C1, `select * from public.prescribed_exercises`)).rows.length === 1);
  check('el cliente 2 NO ve la prescripción ajena', (await as(C2, `select * from public.prescribed_exercises`)).rows.length === 0);
  const edit = await as(C1, `update public.prescribed_exercises set load = '1' returning id`);
  check('el cliente NO puede modificar la prescripción', edit.rows.length === 0);

  // Registro y reporte del cliente
  const log = await as<{ id: string }>(
    C1,
    `insert into public.workout_logs (client_id, plan_id, session_id, session_title) select id, '${planId}', '40000000-0000-0000-0000-000000000001', 'S1' from public.clients where user_id = '${C1}' returning id`,
  );
  check('el cliente registra su sesión', log.rows.length === 1);
  const ex = await as<{ id: string }>(C1, `insert into public.workout_exercise_logs (workout_log_id, prescribed_exercise_id, completed) values ('${log.rows[0]?.id}', '50000000-0000-0000-0000-000000000001', true) returning id`);
  const set = await as(C1, `insert into public.set_logs (exercise_log_id, set_number, weight, reps, done) values ('${ex.rows[0]?.id}', 1, '102.5', '10', true)`);
  check('el cliente registra series reales', !set.error);
  const c1id = (await db.query<{ id: string }>(`select id from public.clients where user_id = '${C1}'`)).rows[0].id;
  const forged = await as(C2, `insert into public.workout_logs (client_id, session_title) values ('${c1id}', 'x')`);
  check('el cliente 2 NO puede registrar por el cliente 1', !!forged.error);
  await as(C1, `update public.workout_logs set status = 'completada', completed_at = now() where id = '${log.rows[0]?.id}'`);
  const reopen = await as(C1, `update public.workout_logs set notes = 'cambio' where id = '${log.rows[0]?.id}' returning id`);
  check('una sesión finalizada ya no se puede editar', reopen.rows.length === 0);

  const rep = await as<{ id: string }>(
    C1,
    `insert into public.wellbeing_reports (client_id, type, level, description, prescribed_exercise_id) select id, 'dolor', 7, 'pinchazo', '50000000-0000-0000-0000-000000000001' from public.clients where user_id = '${C1}' returning id`,
  );
  check('el cliente envía un reporte', rep.rows.length === 1);
  const repForged = await as(C1, `insert into public.wellbeing_reports (client_id, type, level, description, status) select id, 'dolor', 7, 'x', 'respondido' from public.clients where user_id = '${C1}'`);
  check('el cliente NO puede crear reportes ya "respondidos"', !!repForged.error);

  const tn = await as<{ type: string }>(T, `select type from public.notifications order by created_at`);
  check('el entrenador recibe avisos de sesión completada y reporte', tn.rows.map((r) => r.type).sort().join() === 'reporte,sesion_completada');
  check('el cliente 2 no ve reportes ajenos', (await as(C2, `select * from public.wellbeing_reports`)).rows.length === 0);
  check('otro entrenador no ve el reporte', (await as(T2, `select * from public.wellbeing_reports`)).rows.length === 0);

  const resp = await as(T, `insert into public.trainer_responses (report_id, message) values ('${rep.rows[0]?.id}', 'Para y consulta')`);
  check('el entrenador responde', !resp.error);
  const st = await as<{ status: string }>(C1, `select status from public.wellbeing_reports`);
  check('la respuesta marca el reporte como respondido', st.rows[0]?.status === 'respondido');
  const cn = await as<{ type: string }>(C1, `select type from public.notifications`);
  check('el cliente recibe la notificación de respuesta', cn.rows.some((r) => r.type === 'respuesta'));
  const readOther = await as(C1, `update public.notifications set read_at = now() where recipient_id = '${T}' returning id`);
  check('el cliente NO puede tocar notificaciones ajenas', readOther.rows.length === 0);
  const forgeNtf = await as(C1, `insert into public.notifications (recipient_id, type, title) values ('${T}', 'reporte', 'spam')`);
  check('los usuarios NO pueden crear notificaciones directamente', !!forgeNtf.error);

  const chg = await as(T, `insert into public.plan_changes (plan_id, client_id, kind, summary) select '${planId}', client_id, 'editado', 'Peso 100 → 95' from public.training_plans where id = '${planId}'`);
  check('el entrenador registra cambios de rutina', !chg.error);
  check('el cliente recibe aviso de cambio de rutina', (await as<{ type: string }>(C1, `select type from public.notifications where type = 'rutina'`)).rows.length === 1);

  // Biblioteca y storage
  const exl = await as<{ id: string }>(T, `insert into public.exercise_library (owner_id, title, primary_muscle) values ('${T}', 'Sentadilla', 'cuadriceps') returning id`);
  check('el entrenador crea ejercicios', exl.rows.length === 1);
  check('el cliente ve la biblioteca de su entrenador', (await as(C1, `select * from public.exercise_library`)).rows.length === 1);
  check('otro entrenador no ve la biblioteca ajena', (await as(T2, `select * from public.exercise_library`)).rows.length === 0);
  const clientEx = await as(C1, `insert into public.exercise_library (owner_id, title, primary_muscle) values ('${C1}', 'x', 'pecho')`);
  check('el cliente NO puede crear ejercicios globales', !!clientEx.error);
  const media = await as(T, `insert into public.exercise_media (exercise_id, storage_path, mime_type, fit, pos_x, pos_y, scale) values ('${exl.rows[0]?.id}', '${T}/${exl.rows[0]?.id}/${'60000000-0000-0000-0000-000000000001'}.gif', 'image/gif', 'cover', 40, 60, 1.4)`);
  check('se guarda el encuadre del GIF', !media.error);
  const badScale = await as(T, `update public.exercise_media set scale = 5`);
  check('el encuadre se valida en servidor (zoom ≤ 3)', !!badScale.error);
  const up = await as(T, `insert into storage.objects (bucket_id, name) values ('exercise-media', '${T}/${exl.rows[0]?.id}/a.gif')`);
  check('el entrenador sube a su carpeta', !up.error);
  const upBad = await as(C1, `insert into storage.objects (bucket_id, name) values ('exercise-media', '${T}/${exl.rows[0]?.id}/b.gif')`);
  check('el cliente NO puede subir archivos', !!upBad.error);
  check('el cliente puede ver los GIF de su entrenador', (await as(C1, `select * from storage.objects`)).rows.length === 1);
  check('otro entrenador no ve archivos ajenos', (await as(T2, `select * from storage.objects`)).rows.length === 0);

  const contact = await as(null, `insert into public.contact_requests (name, email) values ('Ana', 'ana@x.com')`);
  check('anon puede enviar el formulario de contacto', !contact.error);
  const anonRead = await as(null, `select * from public.contact_requests`);
  check('anon NO puede leer consultas', !!anonRead.error || anonRead.rows.length === 0);

  console.log(failures ? `\n${failures} comprobación(es) fallida(s)` : '\nTodas las comprobaciones RLS superadas.');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
