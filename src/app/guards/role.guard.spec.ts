import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { roleGuard } from './role.guard';
import { AuthService, AuthUser } from '../services/auth.service';

const ADMIN: AuthUser = { id: '1', name: 'Ana', role: 'admin' };
const EMPLEADO: AuthUser = { id: '2', name: 'Beto', role: 'empleado' };

describe('roleGuard', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    auth.currentUser.set(null);
  });

  it('permite pasar si el rol está entre los permitidos', () => {
    auth.currentUser.set(ADMIN);
    const guard = roleGuard('admin');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeTrue();
  });

  it('bloquea y manda a la landingRoute si el rol no está permitido', () => {
    spyOn(router, 'navigateByUrl');
    auth.currentUser.set(EMPLEADO);
    const guard = roleGuard('admin');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('bloquea si no hay usuario logueado', () => {
    spyOn(router, 'navigateByUrl');
    const guard = roleGuard('admin', 'empleado');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalled();
  });

  it('acepta varios roles permitidos', () => {
    auth.currentUser.set(EMPLEADO);
    const guard = roleGuard('admin', 'empleado');
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBeTrue();
  });
});
