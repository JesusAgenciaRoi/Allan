import type { TrainingPlan, WorkoutLog } from '../types/domain';
import { findPrescription, formatDate } from '../lib/plan';

/** Compara lo PROGRAMADO con lo EJECUTADO, sin mezclar ambos datos. */
export function LogDetail({ log, plans }: { log: WorkoutLog; plans: TrainingPlan[] }) {
  const plan = plans.find((p) => p.id === log.planId);
  return (
    <div className="stack" style={{ ['--stack' as string]: '10px' }}>
      <p className="small muted">
        {log.status === 'completada' ? `Completada el ${formatDate(log.completedAt, true)}` : `En progreso desde ${formatDate(log.startedAt, true)}`}
      </p>
      {log.notes && (
        <p className="small">
          <strong className="gold">Notas del cliente:</strong> {log.notes}
        </p>
      )}
      {log.exercises.map((ex) => {
        const pe = plan ? findPrescription(plan, ex.prescribedExerciseId)?.pe : undefined;
        const doneSets = ex.sets.filter((s) => s.done || s.weight || s.reps);
        return (
          <div key={ex.prescribedExerciseId} className="pe">
            <div className="row row--between">
              <strong>{pe?.name ?? 'Ejercicio (ya no está en el plan)'}</strong>
              <span className={`badge ${ex.completed ? 'badge--ok' : ''}`}>{ex.completed ? 'Completado' : 'No marcado'}</span>
            </div>
            <div className="compare">
              <div className="compare__col">
                <span className="kv__k">Programado</span>
                {pe ? (
                  <span>
                    {pe.sets ?? '—'} × {pe.reps ?? '—'} · {pe.load ?? 'sin peso'} · {pe.rirRpe ?? '—'}
                  </span>
                ) : (
                  '—'
                )}
              </div>
              <div className="compare__col">
                <span className="kv__k">Realizado</span>
                {doneSets.length ? (
                  <span>
                    {doneSets.map((s) => `${s.weight || '—'}×${s.reps || '—'}${s.effort ? ` @${s.effort}` : ''}`).join(' · ')}
                  </span>
                ) : (
                  <span className="muted">Sin series registradas</span>
                )}
              </div>
            </div>
            {ex.notes && <p className="small muted">Nota: {ex.notes}</p>}
          </div>
        );
      })}
    </div>
  );
}
