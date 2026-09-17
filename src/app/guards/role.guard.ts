import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

/**
 * Guard de rol. Uso:
 *   canActivate: [authGuard, roleGuard('admin')]
 * Precios, reportes y torneos son admin-only; el resto lo puede tocar
 * cualquier 'empleado' logueado (ya cubierto por authGuard solo).
 */
export function roleGuard(...allowed: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.hasRole(...allowed)) return true;
    router.navigateByUrl(auth.landingRoute());
    return false;
  };
}
