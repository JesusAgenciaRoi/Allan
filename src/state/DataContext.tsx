import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DataService } from '../services/types';
import { getDataService } from '../services';
import type { Profile } from '../types/domain';

interface DataCtx {
  service: DataService | null;
  profile: Profile | null;
  /** true mientras se resuelve la sesión inicial. */
  booting: boolean;
  /** Se incrementa con cada cambio de datos; los hooks de consulta lo usan para refrescar. */
  version: number;
  /** true si el último cambio vino de Supabase Realtime. */
  lastChangeRealtime: boolean;
  sessionExpired: boolean;
  setProfile: (p: Profile | null) => void;
  bump: () => void;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [service, setService] = useState<DataService | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [booting, setBooting] = useState(true);
  const [version, setVersion] = useState(0);
  const [lastChangeRealtime, setLastChangeRealtime] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const hadProfile = useRef(false);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let unsubData: (() => void) | undefined;
    let cancelled = false;
    void (async () => {
      const s = await getDataService();
      if (cancelled) return;
      setService(s);
      try {
        const p = await s.getCurrentProfile();
        if (!cancelled) {
          setProfileState(p);
          hadProfile.current = !!p;
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
      unsubAuth = s.onAuthChange((p) => {
        // Si había sesión y desaparece sin logout explícito → sesión caducada.
        if (!p && hadProfile.current) setSessionExpired(true);
        hadProfile.current = !!p;
        setProfileState(p);
      });
      unsubData = s.subscribe((e) => {
        setLastChangeRealtime(e.source === 'realtime');
        setVersion((v) => v + 1);
      });
    })();
    return () => {
      cancelled = true;
      unsubAuth?.();
      unsubData?.();
    };
  }, []);

  const setProfile = useCallback((p: Profile | null) => {
    hadProfile.current = !!p;
    setSessionExpired(false);
    setProfileState(p);
  }, []);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(
    () => ({ service, profile, booting, version, lastChangeRealtime, sessionExpired, setProfile, bump }),
    [service, profile, booting, version, lastChangeRealtime, sessionExpired, setProfile, bump],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useData fuera de DataProvider');
  return c;
}

/** Servicio garantizado (las rutas privadas solo se montan cuando ya existe). */
export function useService(): DataService {
  const { service } = useData();
  if (!service) throw new Error('Servicio no inicializado');
  return service;
}

export interface QueryState<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  reload: () => void;
}

/** Consulta asíncrona que se refresca automáticamente cuando cambian los datos. */
export function useQuery<T>(fn: (s: DataService) => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const { service, version } = useData();
  const [state, setState] = useState<{ data: T | undefined; error: Error | null; loading: boolean }>({
    data: undefined,
    error: null,
    loading: true,
  });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!service) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fnRef
      .current(service)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error: Error) => alive && setState((s) => ({ data: s.data, error, loading: false })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, version, nonce, ...deps]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
