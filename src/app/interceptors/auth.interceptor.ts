import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // El JWT solo viaja hacia nuestro propio back, nunca a un tercero.
  const isOwnApi = req.url.startsWith(environment.apiUrl);

  if (isOwnApi) {
    const token = localStorage.getItem('padel_token');
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      const isLoginRequest = req.url.includes('/auth/login');
      if (err.status === 401 && !isLoginRequest) {
        auth.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
