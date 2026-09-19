import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { DashboardService, DashboardToday } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/dashboard/today`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtiene el resumen del dia (camino feliz)', () => {
    const mockDashboard: DashboardToday = {
      courts: [{ courtId: '1', courtName: 'Cancha 1', status: 'free', currentBooking: null }],
      todayBookings: [],
      incomeToday: 0,
      debtTotal: 0,
      membersLate: [],
    };

    service.getToday().subscribe((dashboard) => {
      expect(dashboard).toEqual(mockDashboard);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mockDashboard);
  });

  it('propaga el error al obtener el resumen del dia', () => {
    const errorBody = { error: 'No se pudo cargar el resumen' };

    service.getToday().subscribe({
      next: () => fail('no deberia resolver con exito'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(err.error).toEqual(errorBody);
      },
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(errorBody, { status: 500, statusText: 'Internal Server Error' });
  });
});
