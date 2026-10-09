import type { Role } from '../types/domain';

export function homeFor(role: Role) {
  return role === 'trainer' ? '/app/entrenador' : '/app/cliente';
}
