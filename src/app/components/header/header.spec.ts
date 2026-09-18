import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';
import { AuthService, AuthUser } from '../../services/auth.service';

const ADMIN: AuthUser = { id: '1', name: 'Ana', role: 'admin' };
const EMPLEADO: AuthUser = { id: '2', name: 'Beto', role: 'empleado' };

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    auth.currentUser.set(null);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sin usuario logueado no muestra rol ni marca admin', () => {
    auth.currentUser.set(null);
    expect(component.user()).toBeNull();
    expect(component.roleLabel()).toBe('');
    expect(component.isAdmin()).toBeFalse();
  });

  it('con un admin logueado muestra el rol y marca isAdmin', () => {
    auth.currentUser.set(ADMIN);
    expect(component.roleLabel()).toBe('Administrador');
    expect(component.isAdmin()).toBeTrue();
  });

  it('con un empleado logueado muestra el rol y no marca isAdmin', () => {
    auth.currentUser.set(EMPLEADO);
    expect(component.roleLabel()).toBe('Empleado');
    expect(component.isAdmin()).toBeFalse();
  });

  it('logout delega en AuthService', () => {
    spyOn(auth, 'logout');
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });
});
