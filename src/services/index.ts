import { config } from '../config';
import type { DataService } from './types';

let instance: DataService | null = null;

/** Devuelve el servicio de datos según la configuración (Supabase si hay credenciales; demo si no). */
export async function getDataService(): Promise<DataService> {
  if (instance) return instance;
  if (config.isConnected) {
    // Carga diferida: el bundle demo no descarga supabase-js hasta que hace falta.
    const { SupabaseService } = await import('./supabaseService');
    instance = new SupabaseService();
  } else {
    const { DemoService } = await import('./demoService');
    instance = new DemoService();
  }
  return instance;
}
