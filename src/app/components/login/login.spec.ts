import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { Login } from './login';
import { environment } from '../../../environments/environment';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no envía nada si falta usuario o contraseña', () => {
    component.username = '';
    component.password = '';
    component.submit();

    expect(component.error()).toBe('Ingresá usuario y contraseña.');
    httpMock.expectNone(`${environment.apiUrl}/auth/login`);
  });

  it('login correcto navega a la landingRoute', () => {
    spyOn(router, 'navigateByUrl');
    component.username = 'ana';
    component.password = '1234';
    component.submit();

    expect(component.loading()).toBeTrue();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'ana', password: '1234' });
    req.flush({ token: 't', user: { id: '1', name: 'Ana', role: 'admin' } });

    expect(component.loading()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/', { replaceUrl: true });
  });

  it('sin conexión al backend muestra el aviso de conexión', () => {
    component.username = 'ana';
    component.password = '1234';
    component.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown' });

    expect(component.error()).toBe('No se pudo conectar con el servidor. Probá de nuevo en un momento.');
    expect(component.loading()).toBeFalse();
  });

  it('credenciales inválidas muestra el error que manda el back', () => {
    component.username = 'ana';
    component.password = 'mala';
    component.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ error: 'Clave incorrecta.' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.error()).toBe('Clave incorrecta.');
    expect(component.loading()).toBeFalse();
  });
});
