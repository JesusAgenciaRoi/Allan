# Decisiones técnicas

## Stack
- **React + TypeScript + Vite**: el repositorio estaba vacío y es la opción recomendada por la especificación. Build estático compatible con Cloudflare Pages.
- **CSS global por capas** (`tokens → base → components → landing → app`) con nombres tipo BEM. Una sola estrategia, sin frameworks, para no añadir peso.
- **Sin librerías de UI ni de animación**: IntersectionObserver para las entradas, CSS para las transiciones y `requestAnimationFrame` para el parallax.
- **Rutas con `react-router-dom`**, con las zonas privadas cargadas de forma diferida (*code splitting*).
- **Fuentes**: Bebas Neue (titulares), Barlow Condensed (menú y botones) y Barlow (lectura), desde Google Fonts con `display=swap` y *fallbacks* condensados del sistema.

## Datos: una interfaz y dos implementaciones
`DataService` define todas las operaciones. `DemoService` (en memoria) y `SupabaseService` la implementan. La UI no sabe en qué modo está, salvo para mostrar avisos honestos (banner demo, «vista previa local», «no se envió»).

- **Demo**: imita las reglas de permisos para que los flujos se comporten igual, pero **no es seguridad** (todo ocurre en el navegador). Guarda una copia en `sessionStorage` solo para sobrevivir a recargas de la misma pestaña; los `blob:` se descartan al serializar.
- **Conectado**: la seguridad la imponen RLS, los privilegios por columna y los triggers. El frontend solo traduce filas.

## Seguridad (modo conectado)
- Los perfiles se crean siempre como `client` mediante un trigger que ignora los metadatos del registro. El rol no es actualizable por los usuarios (privilegio por columna). Los entrenadores se dan de alta con `promote_to_trainer()`, que solo puede ejecutarse con permisos de administración.
- `client_private_notes` está separada de `clients` para que el cliente pueda leer su ficha sin ver las notas administrativas.
- Notificaciones: los usuarios no pueden insertarlas. Las generan triggers `security definer` (reporte nuevo, sesión completada, respuesta, cambio de rutina). Solo se puede actualizar `read_at`.
- Las sesiones completadas ya no se pueden editar. Los reportes solo se crean en estado `pendiente`, y el cliente no puede cambiar su estado.
- Storage: bucket **privado** con límite de tamaño y MIME en servidor. Ruta `<entrenador>/<ejercicio>/<uuid>.<ext>`: nombres únicos, sin datos personales y sin sobrescribir (`x-upsert: false`). El entrenador solo escribe en su carpeta y sus clientes la leen mediante URLs firmadas.
- La `service_role` solo se usa en la Edge Function `invite-client`, que antes verifica con el token del llamante que es entrenador y dueño del cliente.
- Corrección detectada al probar: la política de lectura de `training_plans` debe ser una condición directa. Con una función que vuelve a consultar la tabla, `INSERT … RETURNING` falla porque la fila nueva aún no es visible.

## Encuadre de GIF
- Se guardan solo `{ fit, posX, posY, scale }`. El archivo original nunca se recodifica.
- La presentación es 100 % CSS: `object-fit`, `object-position` y `transform: scale()` con `transform-origin` en el punto focal. **No se usa canvas**, así que la animación del GIF se conserva siempre.
- La caja de referencia es 4:3 (ficha y rutina) y 1:1 (miniaturas). El editor muestra ambas.
- En modo *contener* sin zoom no hay nada que desplazar, por eso los controles de posición se desactivan con una explicación. Los márgenes sobrantes se rellenan con un fondo rayado coherente con la marca.
- Formatos: GIF (recomendado), MP4 y WebM. Los vídeos se reproducen en bucle, silenciados y en línea, con el mismo encuadre.

## Planificación
- Jerarquía: plan → mesociclo → fase → semana → sesión → ejercicio prescrito. Las plantillas tienen `clientId = null`. Asignar crea una **copia profunda** para el cliente con `templateId`, de modo que editarla no toca la plantilla.
- Lo prescrito (`load`, `suggestedLoad`…) y lo ejecutado (`set_logs`) están en tablas distintas.
- Sustituir o retirar no borra nada: marca `removed_at`, crea la nueva prescripción con los mismos parámetros y registra un `plan_change` (vinculable a un reporte) que el cliente ve como «cambio reciente».
- «Entrenamiento de hoy» es la primera sesión de la semana actual sin registro completado, porque el Excel no asigna sesiones a días concretos.

## Ambigüedades del Excel (resumen)
| Hallazgo | Tratamiento |
|---|---|
| `S1S2` no indica explícitamente qué semanas cubre | Se deduce del nombre (semanas 1 y 2), se avisa y ambas reciben la misma prescripción |
| La Sesión 1 no tiene fila de título | Se llama «Sesión 1» y se marca |
| Tempo guardado como hora (`1:02:01`) | Se convierte a `1-2-1` y se marca para confirmar |
| Columnas G y H bajo «Carga sugerida» con valores distintos (`75/80` · `80/85`) | Se guardan por separado (`suggestedLoad`, `suggestedLoadAlt`). Su significado está por confirmar: ¿progresión? ¿otro atleta? |
| Cargas con varios valores o con texto (`24/26/28/30`, `2*45/50/55`, `D16/ W 30`, `105/maquina`, `33-12 kev 33/18`) | Se conservan tal cual, sin interpretar. «kev» sugiere que la hoja la comparten dos atletas |
| `SIN DESCANSO` combinado en E–J | Va a notas, no a carga |
| Series y repeticiones no numéricas (`4 VUELTAS`, `ELECCION`, `BAJADAS`, `maximo en 5 Minutos`) | Se conservan como texto; el registro ofrece 1 bloque libre |
| Fila C44:C46 sin ejercicio | Se añade a las notas del EMOM anterior |
| E9 / E10 («Cierre del bloque hipertrofia», «VOLUMEN COMIENZO») | Van a notas de la semana, no a esquema |
| Peaking sin objetivo; fórmula `H22 = $B$3` vacía | Se marca y se ignora |
| Semanas 5–21 sin sesiones | No se inventan. El entrenador puede copiar las de otra semana y ajustarlas |
| Diferencias s3 ↔ S4: `H16` (115 → 120) y `E18` (115 → 105/máquina) | Se conservan por semana |
| Erratas («Extrension», «Truhst», «FARMROLLING») | El nombre se conserva y se vincula a la ficha correcta de la biblioteca |
