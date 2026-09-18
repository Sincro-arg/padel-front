import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpErrorResponse, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable, of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

describe('authInterceptor', () => {
  let router: Router;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  function run(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    return TestBed.runInInjectionContext(() => authInterceptor(req, next));
  }

  it('agrega el header Authorization en requests a la propia API si hay token', done => {
    localStorage.setItem('padel_token', 'tok123');
    const req = new HttpRequest('GET', `${environment.apiUrl}/courts`);
    const next: HttpHandlerFn = r => {
      expect(r.headers.get('Authorization')).toBe('Bearer tok123');
      return of({} as HttpEvent<unknown>);
    };

    run(req, next).subscribe(() => done());
  });

  it('no agrega el header si no hay token guardado', done => {
    const req = new HttpRequest('GET', `${environment.apiUrl}/courts`);
    const next: HttpHandlerFn = r => {
      expect(r.headers.has('Authorization')).toBeFalse();
      return of({} as HttpEvent<unknown>);
    };

    run(req, next).subscribe(() => done());
  });

  it('no agrega el header en requests a un tercero, aunque haya token', done => {
    localStorage.setItem('padel_token', 'tok123');
    const req = new HttpRequest('GET', 'https://otro-dominio.com/algo');
    const next: HttpHandlerFn = r => {
      expect(r.headers.has('Authorization')).toBeFalse();
      return of({} as HttpEvent<unknown>);
    };

    run(req, next).subscribe(() => done());
  });

  it('un 401 en un request normal limpia la sesión y manda a /login', done => {
    spyOn(router, 'navigate');
    spyOn(auth, 'clearSession');
    const req = new HttpRequest('GET', `${environment.apiUrl}/courts`);
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 401 }));

    run(req, next).subscribe({
      error: () => {
        expect(auth.clearSession).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });
  });

  it('un 401 en el login NO limpia la sesión ni redirige', done => {
    spyOn(router, 'navigate');
    spyOn(auth, 'clearSession');
    const req = new HttpRequest('POST', `${environment.apiUrl}/auth/login`, {});
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 401 }));

    run(req, next).subscribe({
      error: () => {
        expect(auth.clearSession).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
