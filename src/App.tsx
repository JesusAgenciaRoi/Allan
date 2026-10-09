import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DataProvider } from './state/DataContext';
import { ToastProvider } from './state/ToastContext';
import { AppIndexRedirect, RequireRole } from './layouts/AppShell';
import LandingPage from './pages/public/LandingPage';
import { LoadingBlock } from './components/ui';

// Zonas privadas en chunks separados: la landing pública carga lo mínimo.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TrainerDashboard = lazy(() => import('./pages/trainer/TrainerDashboard'));
const ClientsPage = lazy(() => import('./pages/trainer/ClientsPage'));
const ClientDetailPage = lazy(() => import('./pages/trainer/ClientDetailPage'));
const ReportsPage = lazy(() => import('./pages/trainer/ReportsPage'));
const ExercisesPage = lazy(() => import('./pages/trainer/ExercisesPage'));
const ExerciseEditorPage = lazy(() => import('./pages/trainer/ExerciseEditorPage'));
const PlansPage = lazy(() => import('./pages/trainer/PlansPage'));
const PlanEditorPage = lazy(() => import('./pages/trainer/PlanEditorPage'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage'));
const ClientHome = lazy(() => import('./pages/client/ClientHome'));
const ClientRoutine = lazy(() => import('./pages/client/ClientRoutine'));
const SessionPage = lazy(() => import('./pages/client/SessionPage'));
const HistoryPage = lazy(() => import('./pages/client/HistoryPage'));
const ClientReportsPage = lazy(() => import('./pages/client/ClientReportsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

const fallback = (
  <div className="container" style={{ paddingTop: 24 }}>
    <LoadingBlock rows={3} />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <ToastProvider>
          <Suspense fallback={fallback}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/app" element={<AppIndexRedirect />} />
              <Route path="/app/entrenador" element={<RequireRole role="trainer" />}>
                <Route index element={<TrainerDashboard />} />
                <Route path="clientes" element={<ClientsPage />} />
                <Route path="clientes/:id" element={<ClientDetailPage />} />
                <Route path="reportes" element={<ReportsPage />} />
                <Route path="ejercicios" element={<ExercisesPage />} />
                <Route path="ejercicios/nuevo" element={<ExerciseEditorPage />} />
                <Route path="ejercicios/:id" element={<ExerciseEditorPage />} />
                <Route path="planes" element={<PlansPage />} />
                <Route path="planes/:id" element={<PlanEditorPage />} />
                <Route path="notificaciones" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/app/entrenador" replace />} />
              </Route>
              <Route path="/app/cliente" element={<RequireRole role="client" />}>
                <Route index element={<ClientHome />} />
                <Route path="rutina" element={<ClientRoutine />} />
                <Route path="sesion/:sessionId" element={<SessionPage />} />
                <Route path="historial" element={<HistoryPage />} />
                <Route path="reportes" element={<ClientReportsPage />} />
                <Route path="notificaciones" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/app/cliente" replace />} />
              </Route>
              <Route path="/:section" element={<LandingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </DataProvider>
    </BrowserRouter>
  );
}
