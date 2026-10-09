# AF Team — Prompt maestro para Claude Code

> **Objetivo:** construir una demo web responsive, mobile-first y visualmente muy fiel a la referencia adjunta para AF Team, un entrenador personal. La demo debe combinar una landing pública premium con una aplicación privada para dos roles: entrenador/administrador y cliente. Debe quedar preparada para desplegar el frontend en Cloudflare Pages.

## Instrucciones de uso

1. Coloca este archivo, la imagen de referencia `WhatsApp Image 2026-10-06 at 5.44.16 PM.jpeg` y el Excel `Kevin y Rasta plani.xlsx` en el repositorio o en una carpeta accesible para Claude Code.
2. Abre Claude Code en la raíz del proyecto.
3. Pega el contenido de la sección **Prompt para ejecutar** o dile que lea este archivo completo y lo siga como especificación.
4. Pide que inspeccione el repositorio antes de modificarlo. Debe reutilizar lo que esté bien y no destruir código o configuración existente sin motivo.

---

# Prompt para ejecutar

Actúa como un equipo senior formado por un diseñador UX/UI especializado en marcas fitness premium, un desarrollador frontend, un desarrollador full-stack, un arquitecto de software y un especialista en accesibilidad y seguridad.

Construye una demo funcional y visualmente pulida para **AF Team**, marca de entrenamiento personal. No quiero solamente una propuesta, un mockup estático ni una descripción: quiero que implementes el proyecto en el repositorio, lo ejecutes, compruebes los flujos y lo dejes preparado para desplegarlo en **Cloudflare Pages**.

Debes respetar toda esta especificación. Antes de programar, inspecciona los archivos existentes, identifica el stack, lee el Excel y analiza la imagen de referencia. Si el repositorio ya contiene una aplicación, conserva las partes útiles y evita reescribirla innecesariamente. Si algo esencial es ambiguo, toma una decisión razonable, documenta la decisión y continúa sin bloquear todo el trabajo.

## 1. Referencia visual y dirección de arte

La imagen adjunta es la referencia principal. Reprodúcela lo más fielmente posible en la sección hero y en la estructura general, adaptando el diseño de forma inteligente a pantallas pequeñas.

### Identidad visual
- Marca: **AF Team**.
- Mensaje principal: **FUERZA. DISCIPLINA. PROPÓSITO.**
- Texto secundario de referencia: “AF Team no es solo entrenamiento. Es un estilo de vida para quienes decidieron dejar de ser promedio.”
- Personalidad: masculina, deportiva, intensa, disciplinada, sobria, premium y orientada a resultados.
- No uses una estética genérica de SaaS, colores neón ni degradados multicolor.
- Paleta: negro profundo, carbón, blanco, grises metálicos y dorado/bronce cálido para acentos y llamadas a la acción.
- Tipografía: titulares condensados, pesados y de gran impacto; textos de lectura cómoda. Utiliza fuentes web adecuadas y con fallback.
- La composición desktop debe aproximarse a la referencia: barra superior negra, logotipo AF Team a la izquierda, navegación centrada/derecha y CTA dorado delineado. Debajo, hero de alto impacto con el gran título “AF TEAM” a la izquierda, lema dorado, descripción y botón principal; a la derecha, un atleta musculoso visto desde atrás en un gimnasio oscuro industrial.
- Usa la imagen de referencia como guía de composición. No intentes copiar logotipos de terceros. Si la imagen no puede utilizarse directamente como recurso final, selecciona o genera un recurso visual equivalente legalmente utilizable, de aspecto cinematográfico, oscuro y de gimnasio real. No dejes imágenes rotas ni dependas de URLs temporales.
- Si no hay assets adecuados en el repositorio, incorpora una imagen local optimizada y documenta su procedencia/licencia.
- Añade overlays oscuros y gradientes de contraste donde ayuden a mantener la legibilidad.
- Botones con hover, foco visible, transiciones sutiles y estados pressed. El dorado debe reservarse para acciones y acentos importantes.

### Landing pública
Construye estas secciones:
1. **Inicio/Hero:** imita la referencia; CTA “ÚNETE AL TEAM”.
2. **Sobre AF Team:** filosofía del entrenador, disciplina, técnica, acompañamiento y progreso individual. Usa copy de demostración claramente editable, sin inventar credenciales profesionales reales.
3. **Servicios:** entrenamiento personalizado, planificación individual, seguimiento y revisión de técnica/progreso, solo como contenido editable sujeto a confirmación del entrenador.
4. **Planes:** tarjetas comparables con nombre, descripción, qué incluyen y precio configurable. No inventes precios definitivos; usa valores de demo señalados como editables o “Consultar”.
5. **Testimonios:** ejemplos claramente marcados como contenido de demostración, nunca testimonios falsos presentados como reales.
6. **Contacto:** formulario visual con validación, WhatsApp como enlace configurable y CTA.
7. **Footer:** enlaces, redes configurables, aviso de privacidad y navegación.

Los enlaces del menú deben navegar a sus secciones y funcionar en móvil. El CTA principal debe llevar al contacto/consulta o al flujo de acceso, según el contexto.

## 2. Mobile-first como requisito central

Es probable que los usuarios utilicen más el celular que la computadora. No diseñes primero para desktop y lo comprimas después.

- Empieza por pantallas de 320–375 px de ancho y escala a tablet y desktop.
- Evita scroll horizontal, texto recortado, botones pequeños y modales que no quepan en pantalla.
- Menú móvil desplegable accesible, con cierre tras navegar.
- Botones y áreas táctiles cómodas, con estados de foco y contraste adecuados.
- Formularios fáciles de usar desde el teléfono, con teclado adecuado para cada campo.
- El panel del cliente debe priorizar la rutina de hoy, el siguiente ejercicio, el registro de entrenamiento y el reporte de molestias.
- El panel del entrenador debe adaptarse a móvil, con navegación clara y listas convertidas en tarjetas cuando corresponda.
- En escritorio puede haber sidebar y paneles de varias columnas; en móvil, navegación compacta y contenido en una columna.
- Las tablas de rutinas deben convertirse en tarjetas o bloques legibles en pantallas pequeñas, sin perder series, repeticiones, peso, RIR/RPE, tempo ni descanso.

## 3. Movimiento, dinamismo y rendimiento

Quiero una experiencia visual con movimiento, pero profesional y fluida, no una web sobrecargada.

Implementa:
- Animaciones de entrada al hacer scroll para títulos, tarjetas y bloques.
- Parallax muy sutil o movimiento de profundidad en el hero, solo cuando el dispositivo lo soporte bien.
- Transiciones suaves en navegación, tarjetas, botones, tabs, filtros y apertura de paneles.
- Microinteracciones en el progreso de una rutina, selección de ejercicios y confirmación de una sesión.
- Indicadores de carga y skeletons cuando proceda.
- Animación de progreso al completar una sesión, sin bloquear la interacción.
- Respeto por `prefers-reduced-motion`: reduce o elimina movimiento si el usuario lo solicita.
- Evita animaciones continuas pesadas, librerías innecesarias y efectos que reduzcan la legibilidad.
- Optimiza imágenes, carga diferida para contenido no visible y evita CLS.

No sacrifiques el rendimiento móvil por los efectos visuales.

## 4. Arquitectura y stack

Primero inspecciona el proyecto. Si está vacío, usa una solución moderna compatible con Cloudflare Pages, preferentemente:
- React + TypeScript + Vite.
- CSS modular, CSS Modules o una estrategia consistente; evita mezclar múltiples sistemas de estilos.
- Componentes reutilizables y separación entre páginas, componentes, servicios y tipos.
- Supabase para autenticación, base de datos y almacenamiento de archivos, salvo que el repositorio ya tenga un backend válido y seguro.
- Cliente Supabase configurado mediante variables de entorno.
- Compatible con build estático de Vite y despliegue en Cloudflare Pages.

No introduzcas secretos en el código, repositorio, bundle del frontend ni archivos de ejemplo con credenciales reales. Añade `.env.example` con nombres de variables, nunca valores secretos reales. La clave pública/anon de Supabase puede exponerse en el frontend si se configura correctamente RLS; la service-role key nunca debe estar en el cliente.

Si la conexión real a Supabase no está configurada, la demo debe seguir siendo navegable en modo demo con datos de ejemplo, claramente etiquetados. Separa el modo demo de producción. No simules que se guardaron datos de forma persistente si no fue así. Indica qué funciones requieren credenciales.

## 5. Dos roles y permisos

Hay dos roles principales:

### Entrenador / administrador
- Accede a su panel privado.
- Consulta clientes y sus estados.
- Crea y edita perfiles de clientes.
- Asigna rutinas y ejercicios.
- Revisa registros de sesiones, pesos, repeticiones y comentarios.
- Recibe avisos cuando un cliente envía un reporte, informa una molestia o completa una sesión.
- Gestiona biblioteca de ejercicios, incluyendo subida y edición de GIF.
- Puede marcar reportes como revisados, dejar una respuesta y actualizar el plan de entrenamiento.
- Puede consultar historial por cliente, fecha y tipo de reporte.

### Cliente
- Solo puede acceder a su propia información.
- Consulta la rutina que le fue asignada.
- Registra lo realizado en cada sesión.
- Informa molestias, dolor, fatiga, limitaciones o dificultades.
- Puede añadir observaciones de texto y enviar un reporte al entrenador.
- Ve las respuestas y ajustes que el entrenador le asigne.
- No puede modificar ejercicios globales, roles, clientes ajenos ni datos administrativos.

### Seguridad
- Implementa autenticación real si las variables de entorno están configuradas.
- Los permisos se aplican en el servidor/base de datos mediante Row Level Security (RLS), no solamente ocultando botones en el frontend.
- Cada cliente solo puede leer/escribir sus propios registros autorizados.
- El entrenador solo puede acceder a los clientes asociados a su cuenta.
- No permitas que alguien se convierta en entrenador modificando el frontend o el perfil enviado desde el navegador. El alta de entrenadores debe ser controlada por un mecanismo administrativo seguro.
- Valida datos tanto en cliente como en backend cuando corresponda.
- Protege las subidas de archivos: tipo MIME/extensión, tamaño máximo configurable y nombres únicos.
- No expongas datos personales en URLs, logs innecesarios o mensajes de error.
- No prometas cumplimiento legal automático; documenta los aspectos de privacidad que deben revisarse antes de producción.

## 6. Panel del entrenador: dashboard y gestión

El dashboard debe priorizar la acción, no ser solamente decorativo.

### Inicio del panel
Muestra:
- Número de clientes activos.
- Sesiones completadas recientemente.
- Reportes pendientes de revisar.
- Alertas de molestias nuevas.
- Actividad reciente, ordenada por fecha.
- Accesos rápidos para crear cliente, asignar rutina y subir ejercicio.
- Estados vacíos útiles cuando todavía no haya datos.

### Gestión de clientes
Cada cliente debe tener una ficha con:
- Nombre, datos de contacto mínimos y estado.
- Fecha de alta y notas administrativas pertinentes.
- Rutina asignada y fase/semana actual.
- Historial de sesiones, progresión de cargas y reportes.
- Lista cronológica de molestias/dificultades informadas.
- Respuestas y ajustes realizados por el entrenador.
- Búsqueda y filtros por nombre, estado, reportes pendientes y actividad reciente.

No solicites ni muestres datos sensibles innecesarios. La información de salud/de molestias requiere especial cuidado y acceso restringido.

### Reportes y alertas
- Los reportes nuevos deben destacarse visualmente en el dashboard.
- Con backend conectado, la llegada de reportes debe actualizarse en tiempo real mediante Supabase Realtime o una alternativa compatible.
- Si Realtime no está configurado, usa una estrategia de actualización razonable y explícita; no presentes una actualización simulada como tiempo real.
- Cada reporte contiene fecha, cliente, tipo de reporte, zona corporal opcional, descripción, nivel de molestia configurable, ejercicio relacionado si aplica y estado: pendiente, revisado o respondido.
- No diagnostiques lesiones ni recomiendes que el cliente entrene con dolor. La interfaz debe permitir al entrenador revisar y ajustar; ante dolor intenso, agudo, empeoramiento o síntomas preocupantes, debe sugerir detener el ejercicio y buscar valoración sanitaria apropiada.
- Las molestias deben ser un flujo prioritario y fácil de encontrar, sin quedar escondidas entre métricas.

## 7. Biblioteca de ejercicios y editor de GIF

Este módulo es una prioridad del proyecto.

### Crear/editar ejercicio
Campos:
- Título del ejercicio.
- Grupo muscular principal.
- Grupos musculares secundarios opcionales.
- Descripción del procedimiento paso a paso.
- Indicaciones técnicas y errores comunes opcionales.
- GIF o vídeo corto de demostración, según lo que admita la implementación.
- Estado activo/inactivo.
- Etiquetas opcionales: equipamiento, dificultad, patrón de movimiento.
- Fecha de creación/actualización.

### Filtros y búsqueda
Incluye:
- Buscador por título.
- Filtro por grupo muscular.
- Filtro por equipamiento o dificultad, si se implementan esas etiquetas.
- Vista en cuadrícula y/o lista.
- Miniaturas consistentes, nombres legibles y acciones de editar/eliminar con confirmación.

Los grupos musculares deben ser configurables y cubrir como mínimo categorías útiles: pecho, espalda, hombros, bíceps, tríceps, antebrazos, abdomen/core, glúteos, cuádriceps, isquiotibiales, gemelos y cuerpo completo. Permite que un ejercicio pertenezca a un grupo principal y varios secundarios.

### Requisito fundamental: encuadre de GIF vertical u horizontal
El entrenador puede subir GIF vertical u horizontal. El reproductor/preview debe adaptarse al contenedor sin deformar el contenido.

Implementa una interfaz de encuadre que permita:
- Previsualizar el GIF con el tamaño real disponible en el diseño.
- Elegir el modo de visualización: contener todo (`contain`) o rellenar recortando (`cover`).
- Ajustar zoom de manera controlada.
- Mover/centrar la imagen horizontal y verticalmente cuando el modo lo permita.
- Restablecer encuadre.
- Guardar los valores de encuadre para que se mantengan al mostrar el ejercicio a los clientes.
- Mostrar una vista previa de cómo se verá en la ficha del ejercicio y en la rutina del cliente.
- Mantener relación de aspecto, evitar deformaciones y gestionar fondos/espacios sobrantes con una solución visual coherente.
- No recodificar ni destruir el archivo original solo para ajustar el encuadre. Guarda el original y los parámetros de presentación.
- Asegúrate de que el encuadre funcione con GIF animados y no dependa de convertirlos a un canvas que pierda la animación.
- Si la implementación técnica de pan/zoom tiene limitaciones con GIF, documenta la decisión y construye una solución real con CSS (`object-fit`, `object-position` y escala/transformación) conservando la animación.
- El control debe ser utilizable con mouse, táctil y teclado cuando sea viable.

### Subida y almacenamiento
- Usa almacenamiento persistente si Supabase está configurado.
- Incluye progreso, errores claros, opción de reemplazar archivo y confirmación antes de borrar.
- Valida formato y tamaño máximo; haz el límite configurable y documéntalo.
- Acepta al menos GIF; si también aceptas MP4/WebM, especifica el comportamiento y no rompas el requisito de GIF.
- Usa nombres únicos, evita sobrescribir archivos de otros ejercicios y configura correctamente los permisos.
- No dejes los GIF como blobs temporales que desaparecen al refrescar si el modo está conectado a un backend.
- Para demo sin backend, permite una vista previa local y deja claro que la subida no es persistente.

## 8. Planes de entrenamiento y registro de sesiones

El sistema debe representar un programa real de entrenamiento, no solo una colección de GIF.

### Estructura conceptual
- Cliente.
- Plan o programa.
- Mesociclo.
- Fase/bloque.
- Semana/microciclo.
- Sesión/día.
- Ejercicio asignado.
- Series objetivo y repeticiones objetivo.
- Peso/carga sugerida o asignada.
- RIR/RPE.
- Tempo.
- Descanso.
- Notas e indicaciones.
- Registro real de lo ejecutado por el cliente.

Debe poder adaptarse a otros clientes, planes, ejercicios y duraciones; no codifiques la planificación del Excel como una rutina universal fija.

### Experiencia del cliente
- Vista de la semana y lista de sesiones.
- Una vista de “Entrenamiento de hoy” destacada.
- Al abrir una sesión, cada ejercicio muestra GIF, título, procedimiento, series, repeticiones, carga, RIR/RPE, tempo y descanso.
- El cliente puede registrar por serie, cuando sea viable: peso utilizado, repeticiones reales y esfuerzo/RIR/RPE.
- Puede marcar ejercicios como completados, añadir notas y finalizar la sesión.
- Confirmación clara al completar una sesión.
- Historial de sesiones y progreso básico, con datos reales o datos demo etiquetados.
- No reemplaces los objetivos programados con resultados ejecutados: conserva ambos para comparar.

### Lectura del Excel adjunto
Lee y analiza **`Kevin y Rasta plani.xlsx`** completo, incluyendo todas las hojas: `MESOCICLO`, `S1S2`, `s3` y `S4`. No te bases únicamente en una vista previa.

Preserva, cuando estén presentes:
- Fases: hipertrofia, volumen y fuerza.
- Objetivo del mesociclo.
- Semanas, estado y progresión.
- Sesiones y ejercicios.
- Etapas como calentamiento, trabajo básico, trabajo accesorio y finalizador.
- Series, repeticiones, peso, carga sugerida, RIR/RPE, tempo, descanso y notas.
- Variaciones o progresiones que cambian entre semanas.

En la hoja `MESOCICLO` se ve una progresión que incluye un bloque de hipertrofia, una transición de volumen y un bloque de fuerza. Las otras hojas contienen sesiones y prescripciones de ejercicios. Debes verificar los datos reales y sus diferencias hoja por hoja antes de transformarlos.

No interpretes automáticamente celdas vacías como cero. No confundas cargas sugeridas con cargas realmente ejecutadas. Si una celda contiene varias cargas separadas por barras, o una fórmula/estructura que no se pueda interpretar con seguridad, conserva el texto original y señala el dato para revisión en lugar de inventar una interpretación.

Implementa una estrategia de importación o seed para convertir el Excel a un formato estructurado editable. Como mínimo:
1. Crea una capa de datos normalizada para planes, fases, semanas, sesiones y ejercicios asignados.
2. Incluye los valores originales necesarios para poder comparar o corregir la importación.
3. Documenta cualquier ambigüedad detectada.
4. Incluye la planificación como **ejemplo/datos demo**, no como rutina por defecto para todos los usuarios.
5. Permite que el entrenador edite la rutina importada antes de asignarla.
6. No inventes las semanas o sesiones que no estén claramente definidas en el Excel.

## 9. Asignación de ejercicios y cambios por molestias

- El entrenador puede seleccionar ejercicios de la biblioteca y asignarlos a una sesión de un cliente.
- Puede configurar series, repeticiones, peso, carga sugerida, RIR/RPE, tempo, descanso y notas individualmente para esa asignación.
- El mismo ejercicio global puede tener parámetros distintos según cliente o sesión; los datos asignados no deben modificar accidentalmente la ficha global.
- El entrenador puede sustituir, reordenar o retirar ejercicios.
- El sistema debe conservar el historial de sesiones y prescripciones anteriores.
- Si el cliente informa una molestia asociada a un ejercicio, destaca el reporte al entrenador y facilita encontrar la sesión/ejercicio relacionado.
- No automatices diagnósticos ni sustituciones clínicas. Cualquier cambio debe ser decidido por el entrenador y comunicado al cliente.
- Las actualizaciones de la rutina deben mostrarse como cambios recientes para el cliente.

## 10. Notificaciones

Implementa una bandeja de notificaciones dentro de la aplicación:
- Nuevo reporte de molestia/dificultad.
- Sesión completada.
- Mensaje/respuesta del entrenador.
- Rutina asignada o modificada.

Con backend conectado, persiste las notificaciones y vincúlalas al usuario correcto. Si se usa tiempo real, valida permisos y suscripciones por usuario. No prometas notificaciones push del sistema operativo salvo que realmente se implementen y configuren. En modo demo, usa eventos de demostración claramente identificados.

## 11. Modelo de datos orientativo

Diseña el esquema definitivo a partir de la implementación, pero contempla como mínimo entidades equivalentes a:

- `profiles`: usuario, nombre visible y rol.
- `trainer_clients`: asociación entre entrenador y cliente.
- `exercise_library`: título, descripción, grupo muscular principal/secundarios, etiquetas y estado.
- `exercise_media`: ruta del archivo, tipo, tamaño, encuadre (`fit`, posición X/Y, escala) y metadatos.
- `training_plans`: nombre, descripción, propietario y estado.
- `mesocycles`: objetivo, orden y duración.
- `training_phases`: nombre, objetivo y orden.
- `training_weeks`: número, estado y relación con fase.
- `training_sessions`: semana, cliente/plan y orden.
- `prescribed_exercises`: ejercicio de biblioteca, orden, series, reps, carga, RIR/RPE, tempo, descanso y notas.
- `workout_logs`: ejecución real de una sesión.
- `set_logs`: valores reales por serie.
- `wellbeing_reports`: molestias/dificultades, fecha, nivel, descripción, ejercicio/sesión relacionado y estado.
- `trainer_responses`: respuesta y ajuste realizado.
- `notifications`: destinatario, tipo, referencia, fecha y estado de lectura.

Evita duplicar innecesariamente datos personales. Añade claves foráneas, restricciones, índices y políticas RLS. Usa migraciones SQL versionadas dentro del repositorio. No dependas exclusivamente de crear tablas manualmente en un dashboard.

## 12. Navegación y rutas

Diseña rutas claras y protegidas, por ejemplo:
- `/` landing pública.
- `/servicios`, `/planes`, `/testimonios`, `/contacto` o anclas equivalentes.
- `/login`.
- `/app` redirige según rol.
- `/app/entrenador` dashboard.
- `/app/entrenador/clientes`.
- `/app/entrenador/clientes/:id`.
- `/app/entrenador/ejercicios`.
- `/app/entrenador/ejercicios/nuevo`.
- `/app/entrenador/planes`.
- `/app/cliente` dashboard.
- `/app/cliente/rutina`.
- `/app/cliente/historial`.
- `/app/cliente/reportes`.
- `/app/cliente/notificaciones`.

Puedes ajustar las rutas si mejora la arquitectura, pero separa de manera clara la landing pública y las zonas privadas. Las rutas protegidas deben verificar sesión y rol; no basta con ocultar enlaces.

## 13. Accesibilidad, contenido y UX

- HTML semántico, etiquetas de formulario, navegación por teclado y foco visible.
- Contraste suficiente, incluso con texto dorado sobre negro.
- `alt` útil para imágenes; GIF de ejercicios con título accesible.
- Mensajes de error y éxito específicos, no solamente color.
- Estados vacíos, de carga, error y confirmación.
- Confirmación para operaciones destructivas.
- Manejo de sesión expirada.
- Textos en español natural, con terminología consistente.
- No uses lorem ipsum.
- No inventes datos reales del entrenador, certificaciones, clientes, precios ni testimonios. Usa datos de demo señalados como tales y deja los contenidos de marketing fácilmente editables.
- La app no debe tratarse como un sistema médico. La comunicación de molestias es para seguimiento del entrenamiento, no diagnóstico.

## 14. Datos demo y credenciales

La aplicación debe poder mostrarse a un entrenador sin tener que completar todos los datos a mano.

- Crea un modo demo con clientes, ejercicios, planes, sesiones y reportes ficticios realistas.
- Identifica claramente los datos demo para que no se confundan con datos reales.
- Incluye un recorrido para probar ambos roles. Si no se dispone de credenciales reales, crea una opción demo segura y controlada que no finja autenticación de producción.
- Nunca pongas una contraseña administrativa universal en producción.
- Si creas cuentas de prueba locales, documenta cómo funcionan y asegúrate de que se deshabiliten fuera de demo.
- La interfaz debe permitir explorar tanto el panel del entrenador como el del cliente.
- Los datos demo deben mostrar el flujo completo: cliente registra sesión, informa molestia, el entrenador recibe el reporte, lo revisa y responde/actualiza la rutina.

## 15. Cloudflare Pages y configuración

Deja el proyecto preparado para Cloudflare Pages:
- Build command apropiado, por ejemplo `npm run build`.
- Output directory apropiado para Vite, normalmente `dist`.
- Configuración de fallback SPA si corresponde, sin interferir con endpoints ni assets.
- Variables de entorno documentadas en `.env.example` y README.
- Migraciones SQL y configuración de Supabase documentadas.
- No asumas que Cloudflare Pages por sí solo ejecuta una base de datos o almacena archivos de forma persistente.
- Si hace falta una función de servidor, explica si se implementa con Cloudflare Pages Functions/Workers o Supabase.
- No subas secretos al repositorio.
- Documenta pasos de despliegue local y Cloudflare Pages, configuración de dominios y variables de entorno.
- La demo en modo frontend debe poder compilar aunque no haya credenciales de Supabase; las funciones dependientes del backend deben indicar claramente que requieren configuración.

## 16. Calidad del código

- TypeScript estricto donde sea razonable; evita `any` indiscriminado.
- Componentes pequeños y reutilizables.
- Separación entre UI, lógica de negocio, tipos y acceso a datos.
- No construyas un único archivo gigante.
- No dejes botones que no hagan nada: cada acción debe funcionar, mostrar un estado deshabilitado explicativo o estar claramente marcada como futura.
- Validación de formularios.
- Manejo de errores y cargas.
- No almacenes datos sensibles únicamente en `localStorage`.
- Añade pruebas para flujos y funciones importantes si el proyecto lo permite.
- Revisa consola, warnings, rutas, assets y errores de compilación.
- No uses dependencias pesadas sin necesidad.

## 17. Entregables obligatorios

Al finalizar, deja:
1. Aplicación implementada en el repositorio.
2. Landing pública visualmente fiel a la referencia.
3. Panel de entrenador y panel de cliente navegables.
4. Biblioteca de ejercicios con subida/preview de GIF y controles de encuadre.
5. Flujos de rutinas, registro de sesión y reportes de molestias.
6. Modo demo utilizable sin credenciales, claramente identificado.
7. Esquema y migraciones SQL/RLS para el modo conectado.
8. `.env.example`.
9. `README.md` con instalación, ejecución, configuración, pruebas y despliegue en Cloudflare Pages.
10. Datos de demo y/o script de importación del Excel con notas sobre ambigüedades.
11. Resumen final: archivos creados/modificados, decisiones técnicas, cómo probar ambos roles, limitaciones reales y pasos para desplegar.

## 18. Orden de trabajo

Trabaja en fases y verifica cada una:

**Fase A — Inspección**
- Revisa repositorio, dependencias y scripts.
- Inspecciona visualmente la imagen de referencia.
- Lee todas las hojas del Excel y resume la estructura detectada.
- Identifica las restricciones del hosting.

**Fase B — Base visual**
- Configura rutas, layout, sistema visual y responsive.
- Construye la landing pública y comprueba la similitud con la referencia.
- Añade las primeras animaciones y respeta reduced-motion.

**Fase C — Aplicación demo**
- Crea navegación privada, roles de demo, datos y estados.
- Construye paneles de entrenador y cliente.

**Fase D — Flujos de negocio**
- Biblioteca y editor de GIF con encuadre.
- Planes, fases, semanas, sesiones y ejercicios prescritos.
- Registro de entrenamientos.
- Reportes de molestias, bandeja y respuesta del entrenador.

**Fase E — Backend**
- Integra Supabase si hay configuración disponible.
- Crea migraciones, políticas RLS, almacenamiento y suscripciones.
- Mantén el modo demo si no hay credenciales.

**Fase F — Verificación**
- Ejecuta build y pruebas disponibles.
- Recorre los flujos desde móvil y desktop.
- Comprueba rutas, permisos, estados vacíos, formularios y errores.
- Revisa GIF vertical y horizontal, zoom, centrado, restablecer y persistencia del encuadre.
- Comprueba el flujo cliente → reporte → entrenador → respuesta/cambio de rutina.
- Corrige fallos reales antes de terminar.

No te limites a terminar la primera fase. Continúa hasta tener una demo coherente y comprobada dentro de las limitaciones del entorno.

## 19. Criterios de aceptación

La demo se considera lista cuando:
- La landing recuerda claramente a la referencia: negro, blanco, dorado, atleta, titulares grandes y CTA.
- Funciona bien a 320 px, 375 px, tablet y desktop.
- No hay scroll horizontal ni elementos cortados.
- La navegación pública y privada funciona.
- Se pueden probar los dos roles.
- El cliente puede consultar una rutina, registrar una sesión e informar una molestia.
- El entrenador puede ver el reporte, marcarlo revisado, responder y modificar/asignar ejercicios.
- Se puede crear y filtrar un ejercicio.
- El GIF puede ser vertical u horizontal y su encuadre se puede ajustar, previsualizar, restablecer y guardar de acuerdo con el modo de persistencia disponible.
- La planificación respeta la estructura del Excel y no confunde cargas prescritas con resultados reales.
- La compilación de producción termina sin errores.
- Existe documentación concreta para ejecutar y desplegar.
- Cualquier función no disponible por falta de credenciales se identifica como tal; no se simula persistencia real.

## 20. Comienza ahora

Primero inspecciona el repositorio y los dos archivos adjuntos. Antes de implementar, presenta un resumen breve de:
1. stack y estructura actual;
2. hojas, columnas y organización que detectaste en el Excel;
3. plan técnico y posibles riesgos;
4. orden de implementación.

Después continúa con la implementación. No te detengas en el plan: construye, ejecuta, comprueba y corrige la demo.
