import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { MonthlyReport, ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/reports/monthly`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtiene el reporte mensual (camino feliz)', () => {
    const mockReport: MonthlyReport = {
      totalRevenue: 150000,
      byHour: [{ hour: 18, occupancyRate: 0.8 }],
      topCustomers: [{ name: 'Juan Perez', totalSpent: 20000, bookingsCount: 4 }],
    };

    service.getMonthly(2026, 9).subscribe((report) => {
      expect(report).toEqual(mockReport);
    });

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('09');
    req.flush(mockReport);
  });

  it('propaga el error al obtener el reporte mensual', () => {
    const errorBody = { error: 'No autorizado' };

    service.getMonthly(2026, 9).subscribe({
      next: () => fail('no deberia resolver con exito'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.error).toEqual(errorBody);
      },
    });

    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    req.flush(errorBody, { status: 403, statusText: 'Forbidden' });
  });
});
