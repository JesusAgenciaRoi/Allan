import { useQuery } from '../../state/DataContext';

/** Datos del cliente autenticado: su ficha, su plan activo, la biblioteca, sus registros y cambios recientes. */
export function useClientData() {
  return useQuery(async (s) => {
    const client = await s.getMyClient();
    if (!client) return null;
    const [plans, exercises, logs, reports] = await Promise.all([s.listPlans(), s.listExercises(), s.listWorkoutLogs(), s.listReports()]);
    const plan = plans.find((p) => p.id === client.activePlanId) ?? null;
    const changes = plan ? await s.listPlanChanges(plan.id) : [];
    return { client, plans, plan, exercises, logs, reports, changes };
  });
}
