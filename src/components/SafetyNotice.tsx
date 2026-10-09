import { Notice } from './ui';

/** Mensaje de seguridad: la app no diagnostica. Se refuerza ante dolor o niveles altos. */
export function SafetyNotice({ level, type, audience }: { level?: number; type?: string; audience: 'client' | 'trainer' }) {
  const severe = (level ?? 0) >= 7 || type === 'dolor';
  if (audience === 'client') {
    return (
      <Notice kind={severe ? 'danger' : 'warn'} icon="!">
        <strong>No entrenes con dolor.</strong> Si notas dolor intenso o agudo, que empeora, o síntomas como hormigueo, pérdida de
        fuerza, mareo o dolor en el pecho, <strong>detén el ejercicio</strong> y busca valoración de un profesional sanitario. Este
        reporte sirve para que tu entrenador ajuste el plan; no es un diagnóstico.
      </Notice>
    );
  }
  return (
    <Notice kind={severe ? 'danger' : 'warn'} icon="!">
      {severe ? (
        <>
          <strong>Nivel alto o dolor.</strong> Recomienda detener el ejercicio implicado y buscar valoración sanitaria antes de
          continuar. No se debe diagnosticar ni animar a entrenar con dolor.
        </>
      ) : (
        <>Revisa y ajusta si procede. Ante empeoramiento o síntomas preocupantes, recomienda valoración sanitaria.</>
      )}
    </Notice>
  );
}
