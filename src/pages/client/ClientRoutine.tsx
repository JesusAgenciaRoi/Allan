import { useEffect, useMemo } from 'react';
import { useClientData } from './useClientData';
import { EmptyState, ErrorBlock, LoadingBlock } from '../../components/ui';
import { PlanView } from '../../components/plan/PlanView';

export default function ClientRoutine() {
  const data = useClientData();
  useEffect(() => {
    document.title = 'Mi rutina — AF Team';
  }, []);
  const done = useMemo(
    () => new Set((data.data?.logs ?? []).filter((l) => l.status === 'completada').map((l) => l.sessionId)),
    [data.data?.logs],
  );
  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (data.data === undefined) return <LoadingBlock rows={4} />;
  if (!data.data?.plan) return <EmptyState title="Sin plan asignado">Tu entrenador todavía no te ha asignado un plan.</EmptyState>;
  const { plan, exercises } = data.data;
  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Mi rutina</span>
          <h1 className="page-title">{plan.name}</h1>
          <p className="page-sub">Elige una semana para ver sus sesiones. La semana actual está marcada en dorado.</p>
        </div>
      </div>
      <PlanView plan={plan} exercises={exercises} mode="client" completedSessionIds={done} />
    </div>
  );
}
