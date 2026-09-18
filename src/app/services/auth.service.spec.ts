import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService, AuthUser } from './auth.service';
import { environment } from '../../environments/environment';

const USER: AuthUser = { id: '1', name: 'Ana', role: 'admin' };

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('se crea sin usuario cuando no hay nada guardado', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('login guarda token y usuario, y actualiza el signal', () => {
    service.login('ana', '1234').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'ana', password: '1234' });
    req.flush({ token: 't123', user: USER });

    expect(service.currentUser()).toEqual(USER);
    expect(service.token()).toBe('t123');
    expect(localStorage.getItem('padel_user')).toBe(JSON.stringify(USER));
  });

  it('isAdmin refleja el rol del usuario logueado', () => {
    service.currentUser.set(USER);
    expect(service.isAdmin()).toBeTrue();

    service.currentUser.set({ ...USER, role: 'empleado' });
    expect(service.isAdmin()).toBeFalse();
  });

  it('hasRole compara contra los roles pedidos', () => {
    service.currentUser.set(USER);
    expect(service.hasRole('admin')).toBeTrue();
    expect(service.hasRole('empleado')).toBeFalse();
    expect(service.hasRole('admin', 'empleado')).toBeTrue();
  });

  it('hasRole es false sin usuario logueado', () => {
    expect(service.hasRole('admin', 'empleado')).toBeFalse();
  });

  it('clearSession borra token, usuario y el signal', () => {
    service.currentUser.set(USER);
    localStorage.setItem('padel_token', 't123');
    localStorage.setItem('padel_user', JSON.stringify(USER));

    service.clearSession();

    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('padel_user')).toBeNull();
  });

  it('logout limpia la sesión y navega a /login', () => {
    spyOn(router, 'navigate');
    service.currentUser.set(USER);

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('landingRoute devuelve la misma ruta para cualquier rol', () => {
    expect(service.landingRoute()).toBe('/');
  });
});
