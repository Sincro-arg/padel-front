import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BackendStatusService } from '../services/backend-status.service';

/**
 * status === 0 es el caso de "no hay respuesta del servidor" (back caído,
 * sin red, CORS bloqueado): ahí se prende el aviso global. Cualquier otra
 * respuesta —incluso un 401 o 500— confirma que el back SÍ está atendiendo.
 */
export const backendStatusInterceptor: HttpInterceptorFn = (req, next) => {
  const status = inject(BackendStatusService);
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  return next(req).pipe(
    tap({
      next: () => status.markUp(),
      error: err => {
        if (err.status === 0) status.markDown();
        else status.markUp();
      },
    }),
  );
};
