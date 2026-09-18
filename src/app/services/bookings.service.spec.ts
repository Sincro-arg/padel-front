import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookingsService, Booking } from './bookings.service';
import { environment } from '../../environments/environment';

describe('BookingsService', () => {
  let service: BookingsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/bookings`;

  const booking: Booking = {
    id: 'b1',
    courtId: 'c1',
    courtName: 'Cancha 1',
    customerName: 'Juan',
    customerPhone: '111',
    date: '2026-09-18',
    startHour: 10,
    endHour: 11,
    memberId: null,
    status: 'confirmed',
    totalAmount: 1000,
    paidAmount: 0,
    paymentStatus: 'pending',
    cancellationFee: 0,
    isRecurring: false,
    recurringBookingId: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getBookings manda la fecha como query param', () => {
    let result: Booking[] | undefined;
    service.getBookings('2026-09-18').subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('date')).toBe('2026-09-18');
    req.flush([booking]);

    expect(result).toEqual([booking]);
  });

  it('createBooking hace POST con el body', () => {
    const body = {
      courtId: 'c1',
      customerName: 'Juan',
      customerPhone: '111',
      date: '2026-09-18',
      startHour: 10,
      endHour: 11,
    };
    service.createBooking(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(booking);
  });

  it('updateBooking hace PUT a /bookings/{id}', () => {
    const body = {
      courtId: 'c1',
      customerName: 'Juan',
      customerPhone: '111',
      date: '2026-09-18',
      startHour: 10,
      endHour: 12,
    };
    service.updateBooking('b1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/b1`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush(booking);
  });

  it('cancelBooking hace POST a /bookings/{id}/cancel con body vacio', () => {
    service.cancelBooking('b1').subscribe();

    const req = httpMock.expectOne({ url: `${base}/b1/cancel`, method: 'POST' });
    expect(req.request.body).toEqual({});
    req.flush({ ...booking, status: 'cancelled', cancellationFee: 500 });
  });

  it('deleteBooking hace DELETE a /bookings/{id}', () => {
    service.deleteBooking('b1').subscribe();
    httpMock.expectOne({ url: `${base}/b1`, method: 'DELETE' }).flush(null);
  });
});
