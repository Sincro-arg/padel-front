import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpErrorResponse, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { backendStatusInterceptor } from './backend-status.interceptor';
import { BackendStatusService } from '../services/backend-status.service';
import { environment } from '../../environments/environment';

describe('backendStatusInterceptor', () => {
  let status: BackendStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    status = TestBed.inject(BackendStatusService);
  });

  function run(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    return TestBed.runInInjectionContext(() => backendStatusInterceptor(req, next));
  }

  it('marca el back como arriba cuando el request a la propia API responde bien', done => {
    status.markDown();
    const req = new HttpRequest('GET', `${environment.apiUrl}/courts`);
    const next: HttpHandlerFn = () => of({} as HttpEvent<unknown>);

    run(req, next).subscribe(() => {
      expect(status.isDown()).toBeFalse();
      done();
    });
  });

  it('marca el back como caído si la respuesta es status 0', done => {
    const req = new HttpRequest('GET', `${environment.apiUrl}/courts`);
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 0 }));

    run(req, next).subscribe({
      error: () => {
        expect(status.isDown()).toBeTrue();
        done();
      },
    });
  });

  it('un error distinto de 0 (401, 500) confirma que el back respondió', done => {
    status.markDown();
    const req = new HttpRequest('GET', `${environment.apiUrl}/courts`);
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 500 }));

    run(req, next).subscribe({
      error: () => {
        expect(status.isDown()).toBeFalse();
        done();
      },
    });
  });

  it('no toca el estado si el request no es contra la propia API', done => {
    status.markDown();
    const req = new HttpRequest('GET', 'https://otro-dominio.com/algo');
    const next: HttpHandlerFn = () => of({} as HttpEvent<unknown>);

    run(req, next).subscribe(() => {
      expect(status.isDown()).toBeTrue();
      done();
    });
  });
});
