import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BackendStatusService } from './backend-status.service';
import { backendStatusInterceptor } from '../interceptors/backend-status.interceptor';
import { environment } from '../../environments/environment';

describe('BackendStatusService', () => {
  let service: BackendStatusService;
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([backendStatusInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BackendStatusService);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('arranca sin marcar el back como caído', () => {
    expect(service.isDown()).toBeFalse();
  });

  it('un login exitoso mantiene el back como arriba', () => {
    service.markDown();

    http.post(`${environment.apiUrl}/auth/login`, { username: 'ana', password: '1234' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ token: 't123', user: { id: '1', name: 'Ana', role: 'admin' } });

    expect(service.isDown()).toBeFalse();
  });

  it('un login con credenciales inválidas (401) también confirma que el back responde', () => {
    service.markDown();

    http.post(`${environment.apiUrl}/auth/login`, { username: 'ana', password: 'mala' }).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ error: 'Usuario o contraseña inválidos' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.isDown()).toBeFalse();
  });

  it('markDown y markUp cambian el signal directamente', () => {
    service.markDown();
    expect(service.isDown()).toBeTrue();

    service.markUp();
    expect(service.isDown()).toBeFalse();
  });
});
