import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { AuthService, AuthUser } from '../../services/auth.service';
import { DashboardToday } from '../../services/dashboard.service';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const dashboardData: DashboardToday = {
    courts: [{ courtId: 'c1', courtName: 'Cancha 1', status: 'free', currentBooking: null }],
    todayBookings: [],
    incomeToday: 0,
    debtTotal: 0,
    membersLate: [{ id: 'm1', name: 'Pedro', monthsOwed: 3 }],
  };

  function flushDashboard(data: DashboardToday = dashboardData): void {
    httpMock.expectOne(`${environment.apiUrl}/dashboard/today`).flush(data);
  }

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);

    const user: AuthUser = { id: 'u1', name: 'Juan', role: 'empleado' };
    auth.currentUser.set(user);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('se crea y pide el dashboard de hoy al iniciar', () => {
    fixture.detectChanges();
    flushDashboard();
    expect(component).toBeTruthy();
  });

  it('muestra el saludo con el nombre del usuario logueado', () => {
    fixture.detectChanges();
    flushDashboard();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Juan');
  });

  it('lista las canchas y los socios atrasados, y no muestra la caja si el usuario no es admin', () => {
    fixture.detectChanges();
    flushDashboard();
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.querySelector('.db__court-name')?.textContent).toContain('Cancha 1');
    expect(el.textContent).toContain('Pedro');
    expect(el.textContent).toContain('Debe 3 meses');
    expect(el.textContent).not.toContain('Caja de hoy');
  });

  it('si el usuario es admin muestra el bloque de caja con lo ingresado y la deuda', () => {
    auth.currentUser.set({ id: 'u2', name: 'Ana', role: 'admin' });
    fixture.detectChanges();
    flushDashboard({ ...dashboardData, incomeToday: 1500, debtTotal: 200 });
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.textContent).toContain('Caja de hoy');
    expect(el.textContent).toContain('$1500');
    expect(el.textContent).toContain('$200');
  });

  it('si falla la carga muestra el error con reintentar', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(`${environment.apiUrl}/dashboard/today`)
      .flush({ error: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.banner-danger')).toBeTruthy();
  });
});
