import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportsService, MonthlyReport } from './reports.service';
import { environment } from '../../environments/environment';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getMonthly manda year y month (con cero a la izquierda) como query params', () => {
    const report: MonthlyReport = { totalRevenue: 10000, byHour: [], topCustomers: [] };

    let result: MonthlyReport | undefined;
    service.getMonthly(2026, 3).subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/reports/monthly`);
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('month')).toBe('03');
    req.flush(report);

    expect(result).toEqual(report);
  });

  it('getMonthly no agrega cero de más si el mes ya tiene dos dígitos', () => {
    service.getMonthly(2026, 11).subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/reports/monthly`);
    expect(req.request.params.get('month')).toBe('11');
    req.flush({ totalRevenue: 0, byHour: [], topCustomers: [] });
  });
});
