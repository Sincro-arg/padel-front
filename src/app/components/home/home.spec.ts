import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { DashboardToday } from '../../services/dashboard.service';
import { environment } from '../../../environments/environment';

const DASHBOARD: DashboardToday = {
  courts: [],
  todayBookings: [],
  incomeToday: 1000,
  debtTotal: 200,
  membersLate: [],
};

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al iniciar carga el dashboard de hoy', () => {
    component.ngOnInit();
    expect(component.loading()).toBeTrue();

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/today`);
    expect(req.request.method).toBe('GET');
    req.flush(DASHBOARD);

    expect(component.data()).toEqual(DASHBOARD);
    expect(component.loading()).toBeFalse();
  });

  it('si falla la carga muestra un error', () => {
    component.load();
    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/today`);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    expect(component.error()).toBe('No se pudo cargar el inicio. Probá de nuevo.');
    expect(component.loading()).toBeFalse();
  });
});
