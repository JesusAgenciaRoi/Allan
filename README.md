# AF Team — Web + app de entrenamiento

Landing pública premium y aplicación privada mobile-first para **AF Team** con dos roles: **entrenador** y **cliente**.

- **Frontend:** React 19 + TypeScript (estricto) + Vite 8 → build estático para **Cloudflare Pages**.
- **Backend (opcional):** **Supabase** para Auth, Postgres con **RLS**, Storage y Realtime.
- **Modo demo:** sin credenciales la app funciona con datos ficticios claramente etiquetados y **sin persistencia real**.

## Índice
1. [Inicio rápido](#inicio-rápido)
2. [Probar los dos roles (modo demo)](#probar-los-dos-roles-modo-demo)
3. [Funcionalidades](#funcionalidades)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [Variables de entorno](#variables-de-entorno)
6. [Conectar Supabase](#conectar-supabase)
7. [Despliegue en Cloudflare Pages](#despliegue-en-cloudflare-pages)
8. [Importación del Excel](#importación-del-excel)
9. [Pruebas](#pruebas)
10. [Decisiones técnicas](#decisiones-técnicas)
11. [Limitaciones conocidas y pendientes antes de producción](#limitaciones-conocidas-y-pendientes-antes-de-producción)

---

## Inicio rápido

Requisitos: Node 20.19+ (probado con Node 24).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # genera dist/
npm run preview      # sirve dist/ en local
npm test             # pruebas unitarias (Vitest)
npm run verify:sql   # aplica las migraciones en Postgres (PGlite) y prueba las políticas RLS
```

## Probar los dos roles (modo demo)

1. Abre `/login` → **Entrar como entrenador (demo)** o **Entrar como cliente (demo)**.
2. En la franja superior «MODO DEMO» puedes **cambiar de rol** al instante y **restablecer** los datos.
3. Recorrido sugerido (flujo completo):
   1. **Cliente** → «Empezar sesión» → registra peso/reps/RIR por serie → «Finalizar sesión».
   2. **Cliente** → «Molestia aquí» en un ejercicio (o *Reportes → Nuevo*) → elige tipo, zona, nivel, descripción → enviar.
   3. **Ver como entrenador** → el dashboard muestra la molestia arriba, en rojo, con contador en «Reportes».
   4. Abre el reporte → *Marcar revisado* → *Ver ejercicio en la rutina y ajustar* → **Sustituir / Editar / Retirar** el ejercicio (queda vinculado al reporte).
   5. Escribe la respuesta y el ajuste → *Enviar respuesta*.
   6. **Ver como cliente** → en «Hoy» aparecen la respuesta y el cambio de rutina; la campana muestra los avisos.

> El modo demo guarda el estado en `sessionStorage` (solo esa pestaña) para sobrevivir a una recarga. No es persistencia real: se pierde al cerrar la pestaña. Los GIF que subas en demo son vistas previas locales (`blob:`) que desaparecen al recargar; la interfaz lo indica.

## Funcionalidades

**Landing** (`/`, `/sobre`, `/servicios`, `/planes`, `/testimonios`, `/contacto`): hero fiel a la referencia (barra negra, logo, menú con subrayado dorado, CTA delineado, titular «AF TEAM» con textura, lema dorado, atleta de espaldas), animaciones de entrada, parallax sutil (solo puntero fino y sin *reduced motion*), menú móvil accesible, formulario con validación, WhatsApp configurable, footer con aviso de privacidad. Todo el copy está en `src/content/site.ts` y está marcado como demo/editable (precios «Consultar», testimonios ficticios señalados).

**Entrenador** (`/app/entrenador/...`)
- Dashboard orientado a la acción: molestias nuevas primero, clientes activos, sesiones de los últimos 7 días, reportes pendientes, actividad reciente y accesos rápidos.
- Clientes: búsqueda, filtros (estado, reportes pendientes, actividad reciente), ficha con pestañas *Resumen · Rutina · Sesiones · Reportes · Cambios*, notas administrativas privadas, progresión de cargas, asignación de plan.
- Planes: plantillas → revisar/editar → **asignar** (crea una copia independiente para el cliente). Fases → semanas → sesiones → ejercicios prescritos. Editar parámetros por asignación, sustituir, reordenar, retirar (se conserva el historial), añadir desde la biblioteca, copiar sesiones de otra semana, marcar semana actual.
- Reportes: filtros por cliente, estado, tipo y fechas; marcar revisado, responder con ajuste, enlace directo al ejercicio en la rutina. Mensaje de seguridad: ante dolor intenso → detener y valoración sanitaria (sin diagnósticos).
- Biblioteca: buscador, filtros por grupo muscular (principal + secundarios), equipamiento y dificultad, vista cuadrícula/lista, editar/eliminar con confirmación, activos/inactivos.
- **Editor de GIF con encuadre**: subida GIF/MP4/WebM con validación de tipo/extensión/tamaño y progreso, reemplazo, eliminación con confirmación, modos *contener / rellenar*, zoom 1–3×, mover con ratón, táctil, teclado (flechas, +/−, 0) y botones, centrar, restablecer, deshacer, guías, previsualización 4:3 (ficha y rutina) y 1:1 (miniatura).
- Notificaciones: reporte nuevo, sesión completada; marcar leídas.

**Cliente** (`/app/cliente/...`)
- *Hoy*: entrenamiento de hoy, siguiente ejercicio con GIF, progreso de la semana, acceso destacado a «Informar molestia», cambios recientes y respuestas del entrenador.
- *Rutina*: semanas por fase y sesiones; las tablas se convierten en tarjetas en móvil sin perder series, reps, peso, RIR/RPE, carga sugerida, tempo ni descanso.
- *Sesión*: GIF con su encuadre, procedimiento, prescripción, registro por serie (peso, reps, esfuerzo), notas, completar, autoguardado y animación al finalizar. **Lo ejecutado nunca sobrescribe lo prescrito.**
- *Historial*, *Reportes* (con respuestas) y *Avisos*.

## Estructura del proyecto

```
src/
  config.ts                 Variables de entorno → modo demo / conectado
  content/                  Copy de la landing y catálogos (grupos musculares, etapas, tipos de reporte)
  types/domain.ts           Modelo de dominio compartido
  services/
    types.ts                Interfaz DataService (contrato común)
    demoService.ts          Implementación demo (en memoria + sessionStorage)
    supabaseService.ts      Implementación Supabase (Auth, PostgREST, Storage, Realtime)
  lib/                      Lógica pura: plan, encuadre, validación, importador del Excel
  state/                    Contexto de datos/sesión y toasts
  components/               UI reutilizable, FramingEditor, ExerciseMediaView, PlanView…
  pages/public|trainer|client|shared
  layouts/AppShell.tsx      Shell privado + guardas de ruta por rol
  styles/                   tokens → base → components → landing → app
  data/generated/           Plan normalizado generado desde el Excel
supabase/
  migrations/               SQL versionado (esquema, RLS, storage, realtime)
  functions/invite-client/  Edge Function para invitar clientes (service role solo en servidor)
  seed/excel-plan.json      Plan importado (para sembrar el modo conectado)
scripts/
  import-excel.ts           Excel → JSON + informe de ambigüedades
  verify-sql.ts             Prueba migraciones + RLS en PGlite
  generate-assets.py        Logo, imagen del hero, textura y GIF de demostración
docs/                       Informe de importación, decisiones y créditos de recursos
public/_redirects, _headers Configuración de Cloudflare Pages (SPA + cabeceras)
```

## Variables de entorno

Copia `.env.example` a `.env.local` (local) o defínelas en Cloudflare Pages → *Settings → Environment variables*.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | Para modo conectado | URL del proyecto (`https://<ref>.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | Para modo conectado | Clave pública *anon/publishable*. Es pública por diseño; la seguridad la da RLS. **Nunca** pongas la `service_role`. |
| `VITE_EXERCISE_MEDIA_BUCKET` | No | Bucket de Storage (por defecto `exercise-media`). |
| `VITE_MAX_UPLOAD_MB` | No | Límite de subida en el frontend (por defecto 15). Mantener igual que `file_size_limit` del bucket. |
| `VITE_WHATSAPP_NUMBER` | No | Número en formato internacional sin `+`. Vacío = se oculta el botón. |
| `VITE_INSTAGRAM_URL`, `VITE_TIKTOK_URL`, `VITE_YOUTUBE_URL` | No | Redes del footer. |
| `VITE_FORCE_DEMO` | No | `true` fuerza el modo demo aunque haya credenciales. |

Sin `VITE_SUPABASE_URL` **y** `VITE_SUPABASE_ANON_KEY` la app compila y arranca en modo demo.

## Conectar Supabase

Proyecto indicado por el cliente: `https://fzefutovpdtzvbuxtrfw.supabase.co` (ya está en `.env.local`, falta la clave anon).

1. **Migraciones** (en orden). Opción A, CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref fzefutovpdtzvbuxtrfw
   npx supabase db push
   ```
   Opción B: *Dashboard → SQL Editor* → pega y ejecuta `supabase/migrations/20261009000001_schema.sql`, luego `…0002_rls.sql` y `…0003_storage_realtime.sql`.
2. **Clave pública:** *Project Settings → API* → copia la `anon`/`publishable` key a `VITE_SUPABASE_ANON_KEY`.
3. **Auth:** *Authentication → URL Configuration* → `Site URL` = dominio de Cloudflare Pages y añade `https://<tu-dominio>/login` a *Redirect URLs*. Recomendado: desactivar «Allow new users to sign up» (las cuentas se crean por invitación).
4. **Alta del entrenador** (mecanismo administrativo; nadie puede auto-promoverse desde el navegador):
   - *Authentication → Users → Add user* con el correo del entrenador.
   - En el SQL Editor: `select public.promote_to_trainer('correo@entrenador.com');`
5. **Edge Function de invitación de clientes:**
   ```bash
   npx supabase functions deploy invite-client
   npx supabase secrets set APP_URL=https://<tu-dominio> ALLOWED_ORIGIN=https://<tu-dominio>
   ```
   El entrenador crea la ficha del cliente y pulsa «Invitar a la app por correo»; el cliente recibe el enlace, define su contraseña y queda vinculado.
6. **Datos de ejemplo (opcional):** entra como entrenador → *Planes* → «Importar plan de ejemplo (Excel)». Crea la biblioteca de ejemplo (con los GIF incluidos en `/media/exercises`) y la plantilla del mesociclo en **tu** cuenta.

Comprobado localmente con `npm run verify:sql`: 39 comprobaciones de permisos (aislamiento entre clientes y entrenadores, que nadie pueda convertirse en entrenador, notas privadas, sesiones cerradas no editables, notificaciones solo por triggers, storage por carpeta, formulario anónimo solo de escritura…).

**Realtime:** `notifications` y `wellbeing_reports` están en la publicación `supabase_realtime`; Postgres Changes respeta RLS, así que cada usuario solo recibe sus filas. La app refresca la bandeja y muestra un aviso al llegar una notificación nueva. No hay notificaciones push del sistema operativo.

## Despliegue en Cloudflare Pages

Cloudflare Pages solo sirve el frontend estático; la base de datos, la autenticación y los archivos viven en Supabase.

1. *Workers & Pages → Create → Pages → Connect to Git* → repositorio `JesusAgenciaRoi/Allan`, rama `main`.
2. Configuración de build:
   - **Framework preset:** Vite (o «None»)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Variable `NODE_VERSION`:** `22` (o superior)
3. Variables de entorno (Production y Preview): las de la tabla anterior. Sin ellas se despliega en modo demo.
4. Guardar y desplegar. El fallback SPA lo hace Cloudflare automáticamente (en Pages, al no existir `404.html`; en Workers, con `not_found_handling` de `wrangler.jsonc`). **No añadas un `_redirects` con `/* /index.html 200`**: Cloudflare lo rechaza por bucle infinito. `public/_headers` añade cabeceras de seguridad y caché.

**Si el proyecto se creó como Worker** (deploy command `npx wrangler deploy`, como el proyecto `allan`): el repo ya incluye `wrangler.jsonc`, que ejecuta `npm run build` y publica `dist/` como assets estáticos. Las variables `VITE_*` deben definirse como **variables de build** (*Settings → Build → Variables and secrets*), porque Vite las incrusta al compilar; las variables de runtime del Worker no llegan al frontend.
5. **Dominio propio:** *Custom domains → Set up a domain* y añade el CNAME que indica Cloudflare. Después actualiza `Site URL`/`Redirect URLs` en Supabase y `APP_URL` en la Edge Function.

No se necesita ninguna Pages Function: la única lógica privilegiada (invitar usuarios) vive en la Edge Function de Supabase.

## Importación del Excel

```bash
npm run import:excel
```

Lee **todas** las hojas de `Kevin y Rasta plani.xlsx` (`MESOCICLO`, `S1S2`, `s3`, `S4`) y genera:
- `src/data/generated/excel-plan.json`: plan normalizado (plan → mesociclo → fases → semanas → sesiones → ejercicios) con los **valores originales** de cada fila (`raw`) y avisos de revisión (`reviewFlags`).
- `docs/EXCEL_IMPORT_REPORT.md`: estructura detectada y lista de ambigüedades (202 avisos).

Reglas: las celdas vacías **no** se convierten en 0. Las cargas con varios valores (`24/26/28/30`, `2*45/50/55`, `33-12 kev 33/18`) se conservan como texto. La carga prescrita (*Peso*) y la sugerida (*G/H*) se guardan por separado y nunca se mezclan con lo ejecutado. Los tempos que Excel guardó como hora (`1:02:01`) se convierten a `1-2-1` y se marcan. Las semanas 5–21 no tienen sesiones en el Excel y no se inventan. El plan se usa como **plantilla de ejemplo**, no como rutina por defecto. Detalle en [docs/DECISIONES.md](docs/DECISIONES.md).

## Pruebas

- `npm test`: 19 pruebas (importador con un Excel sintético y con el real, encuadre, validación de archivos y formularios, permisos del servicio demo, flujo completo cliente → reporte → entrenador → respuesta/ajuste, independencia plantilla/copia).
- `npm run verify:sql`: migraciones y RLS en Postgres (PGlite).
- `npm run build`: typecheck estricto + build de producción.
- Verificación manual realizada en navegador a 320 px, 375 px y escritorio: landing, menú móvil, formulario, flujos de ambos roles, editor de encuadre con GIF vertical, guardas de ruta, 404 y ausencia de scroll horizontal en todas las rutas.

## Decisiones técnicas

Ver [docs/DECISIONES.md](docs/DECISIONES.md) y [docs/CREDITOS.md](docs/CREDITOS.md).

## Limitaciones conocidas y pendientes antes de producción

- **No se ha probado contra el proyecto Supabase real**: las migraciones y las políticas se validaron en Postgres local (PGlite) con stubs de `auth`/`storage`. Tras aplicarlas, ejecuta los *Advisors* de seguridad del dashboard.
- La copia de un plan (asignar o duplicar) en modo conectado se hace con varias inserciones desde el cliente; si falla a mitad, queda un plan parcial en borrador que se puede borrar. Si se necesita atomicidad, conviene moverla a una función SQL.
- Las URLs firmadas de los GIF caducan en 1 hora; si una vista queda abierta más tiempo, al refrescar se renuevan.
- **Privacidad/legal:** el aviso de privacidad es un borrador. Los reportes de molestias son datos de salud: revisa la base legal, el consentimiento, la retención y el encargo de tratamiento con Supabase/Cloudflare antes de producción. La app no es un producto sanitario ni diagnostica.
- **Contenido:** servicios, planes, precios y testimonios son de demostración. La foto del hero sale de la imagen de referencia proporcionada: confirma sus derechos de uso (ver `docs/CREDITOS.md`). Los GIF incluidos son esquemáticos y generados; sustitúyelos por demostraciones reales.
