import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, AuthUser } from '../../services/auth.service';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService);
  });

  it('se crea', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sin usuario logueado no muestra la navegación ni el bloque de usuario', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.hd__nav')).toBeNull();
    expect(fixture.nativeElement.querySelector('.hd__user')).toBeNull();
  });

  it('con un empleado logueado muestra su nombre y rol, pero no los links de admin', () => {
    const user: AuthUser = { id: 'u1', name: 'Juan', role: 'empleado' };
    auth.currentUser.set(user);
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.querySelector('.hd__user-name')?.textContent).toContain('Juan');
    expect(el.querySelector('.hd__user-role')?.textContent).toContain('Empleado');
    expect(el.textContent).not.toContain('Torneos');
    expect(el.textContent).not.toContain('Reportes');
  });

  it('con un admin logueado muestra los links de torneos y reportes', () => {
    const user: AuthUser = { id: 'u2', name: 'Ana', role: 'admin' };
    auth.currentUser.set(user);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Torneos');
    expect(fixture.nativeElement.textContent).toContain('Reportes');
  });

  it('logout delega en el servicio de auth', () => {
    spyOn(auth, 'logout');
    const user: AuthUser = { id: 'u1', name: 'Juan', role: 'empleado' };
    auth.currentUser.set(user);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.hd__logout').click();

    expect(auth.logout).toHaveBeenCalled();
  });
});
