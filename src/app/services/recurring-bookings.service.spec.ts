import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecurringBookingsService, RecurringBooking } from './recurring-bookings.service';
import { environment } from '../../environments/environment';

describe('RecurringBookingsService', () => {
  let service: RecurringBookingsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/recurring-bookings`;

  const recurring: RecurringBooking = {
    id: 'r1',
    courtId: 'c1',
    customerName: 'Juan',
    customerPhone: '111',
    weekday: 3,
    startHour: 10,
    endHour: 11,
    memberId: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecurringBookingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getRecurringBookings pide GET /recurring-bookings', () => {
    let result: RecurringBooking[] | undefined;
    service.getRecurringBookings().subscribe(r => (result = r));

    httpMock.expectOne({ url: base, method: 'GET' }).flush([recurring]);
    expect(result).toEqual([recurring]);
  });

  it('createRecurringBooking hace POST con el body', () => {
    const body = {
      courtId: 'c1',
      customerName: 'Juan',
      customerPhone: '111',
      weekday: 3,
      startHour: 10,
      endHour: 11,
    };
    service.createRecurringBooking(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(recurring);
  });

  it('deleteRecurringBooking hace DELETE a /recurring-bookings/{id}', () => {
    service.deleteRecurringBooking('r1').subscribe();
    httpMock.expectOne({ url: `${base}/r1`, method: 'DELETE' }).flush(null);
  });
});
