// Edge Function: invita a un cliente por correo y vincula su cuenta a la ficha.
// Se ejecuta en Supabase (Deno) con la SERVICE_ROLE_KEY, que nunca llega al navegador.
//   supabase functions deploy invite-client
// Llamada desde el frontend (entrenador autenticado):
//   supabase.functions.invoke('invite-client', { body: { clientId } })
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const auth = req.headers.get('Authorization') ?? '';

  // 1) Identificar al llamante con SU token (RLS aplica): debe ser entrenador y dueño del cliente.
  const asCaller = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: userData } = await asCaller.auth.getUser();
  if (!userData.user) return json(401, { error: 'Sesión no válida' });

  let clientId: string | undefined;
  try {
    clientId = (await req.json())?.clientId;
  } catch {
    /* cuerpo inválido */
  }
  if (!clientId || !/^[0-9a-f-]{36}$/.test(clientId)) return json(400, { error: 'clientId no válido' });

  const { data: client, error } = await asCaller.from('clients').select('id, email, full_name, user_id, trainer_id').eq('id', clientId).maybeSingle();
  if (error || !client || client.trainer_id !== userData.user.id) return json(403, { error: 'No autorizado' });
  if (client.user_id) return json(409, { error: 'El cliente ya tiene cuenta' });
  if (!client.email) return json(400, { error: 'El cliente no tiene correo' });

  // 2) Acciones privilegiadas con service role.
  const admin = createClient(url, service);
  const redirectTo = Deno.env.get('APP_URL') ? `${Deno.env.get('APP_URL')}/login` : undefined;
  const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(client.email, {
    data: { full_name: client.full_name },
    redirectTo,
  });
  if (invErr || !invited.user) return json(400, { error: 'No se pudo enviar la invitación' });

  // El trigger handle_new_user ya creó el perfil con rol "client". Solo vinculamos.
  const { error: linkErr } = await admin.from('clients').update({ user_id: invited.user.id }).eq('id', clientId);
  if (linkErr) return json(500, { error: 'Invitación enviada, pero no se pudo vincular la cuenta' });

  return json(200, { ok: true });
});
