// Contenido de marketing de la landing. TODO es texto de demostración editable:
// el entrenador debe revisar y confirmar servicios, precios y testimonios antes de publicar.

export const SITE = {
  brand: 'AF Team',
  tagline: 'FUERZA. DISCIPLINA. PROPÓSITO.',
  heroText: 'AF Team no es solo entrenamiento. Es un estilo de vida para quienes decidieron dejar de ser promedio.',
  ctaPrimary: 'ÚNETE AL TEAM',

  about: {
    eyebrow: 'Sobre AF Team',
    title: 'Entrenar con un plan. Progresar con un propósito.',
    paragraphs: [
      'En AF Team cada entrenamiento responde a un objetivo. Trabajamos por bloques —hipertrofia, volumen y fuerza— con una progresión medida semana a semana y ajustada a tu punto de partida.',
      'La técnica va primero: aprender a moverte bien es lo que te permite cargar más, durante más tiempo y con menos riesgo. El seguimiento es cercano: registras lo que haces, cuentas cómo te sientes y el plan se adapta.',
    ],
    pillars: [
      { title: 'Disciplina', text: 'Constancia por encima de la motivación. El plan se cumple, se registra y se revisa.' },
      { title: 'Técnica', text: 'Cada ejercicio con su procedimiento, tempo y descanso definidos, y correcciones cuando hace falta.' },
      { title: 'Acompañamiento', text: 'Comunicación directa con tu entrenador: dudas, molestias y ajustes en un mismo lugar.' },
      { title: 'Progreso individual', text: 'Tu plan, tus cargas y tu ritmo. Comparamos lo programado con lo realizado.' },
    ],
    note: 'Texto de demostración — pendiente de revisión por el entrenador.',
  },

  services: [
    {
      title: 'Entrenamiento personalizado',
      text: 'Sesiones diseñadas para tu nivel, tu objetivo y el material del que dispones.',
      icon: 'dumbbell',
    },
    {
      title: 'Planificación individual',
      text: 'Mesociclos por fases con series, repeticiones, RIR/RPE, tempo y descanso definidos para cada semana.',
      icon: 'calendar',
    },
    {
      title: 'Seguimiento y revisión',
      text: 'Registro de cada sesión desde el móvil y revisión de técnica y progreso por parte del entrenador.',
      icon: 'chart',
    },
    {
      title: 'Comunicación de molestias',
      text: 'Informa molestias o dificultades al momento para que el entrenador revise y ajuste tu rutina.',
      icon: 'chat',
    },
  ],

  plans: [
    {
      name: 'Online',
      description: 'Planificación y seguimiento a distancia desde la app.',
      includes: ['Plan por fases y semanas', 'Biblioteca de ejercicios con GIF', 'Registro de sesiones', 'Revisión semanal'],
      price: 'Consultar',
      featured: false,
    },
    {
      name: 'Team',
      description: 'El plan completo con seguimiento cercano y ajustes continuos.',
      includes: [
        'Todo lo del plan Online',
        'Ajustes según tus reportes',
        'Revisión de técnica por vídeo',
        'Contacto directo con el entrenador',
      ],
      price: 'Consultar',
      featured: true,
    },
    {
      name: 'Presencial',
      description: 'Sesiones presenciales con el entrenador más la app de seguimiento.',
      includes: ['Sesiones guiadas', 'Corrección técnica en directo', 'Plan individual', 'App de seguimiento'],
      price: 'Consultar',
      featured: false,
    },
  ],
  plansNote: 'Planes y precios de demostración: se configuran en src/content/site.ts y deben confirmarse con el entrenador.',

  testimonials: [
    {
      quote: 'Por primera vez sé exactamente qué tengo que hacer cada día y por qué.',
      author: 'Cliente de ejemplo',
      detail: 'Testimonio de demostración',
    },
    {
      quote: 'Poder avisar de una molestia y que el plan se ajuste me da mucha tranquilidad.',
      author: 'Cliente de ejemplo',
      detail: 'Testimonio de demostración',
    },
    {
      quote: 'Ver lo programado frente a lo que hice me motiva a seguir subiendo cargas.',
      author: 'Cliente de ejemplo',
      detail: 'Testimonio de demostración',
    },
  ],
  testimonialsNote:
    'Estos testimonios son ejemplos ficticios para la demo. Sustitúyelos solo por testimonios reales con consentimiento.',

  contact: {
    title: '¿Listo para dejar de ser promedio?',
    text: 'Cuéntanos tu objetivo y tu punto de partida. Te responderemos para valorar el plan que mejor encaja contigo.',
    whatsappMessage: 'Hola AF Team, quiero información para unirme al team.',
  },

  privacy:
    'Los datos del formulario se usan solo para responder a tu consulta. Aviso de privacidad de demostración: debe redactarse y revisarse legalmente antes de producción.',
};
