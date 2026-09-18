import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardService, DashboardToday } from './dashboard.service';
import { environment } from '../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getToday pide GET /dashboard/today', () => {
    const today: DashboardToday = {
      courts: [],
      todayBookings: [],
      incomeToday: 0,
      debtTotal: 0,
      membersLate: [],
    };

    let result: DashboardToday | undefined;
    service.getToday().subscribe(r => (result = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/today`);
    expect(req.request.method).toBe('GET');
    req.flush(today);

    expect(result).toEqual(today);
  });
});
