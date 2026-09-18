import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentsService, Debt, PaymentsSummary, BookingPaymentResult } from './payments.service';
import { environment } from '../../environments/environment';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getDebts pide GET /payments/debts', () => {
    const debts: Debt[] = [{ bookingId: 'b1', customerName: 'Juan', date: '2026-09-18', startHour: 10, amountDue: 500 }];

    let result: Debt[] | undefined;
    service.getDebts().subscribe(r => (result = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/payments/debts`);
    expect(req.request.method).toBe('GET');
    req.flush(debts);

    expect(result).toEqual(debts);
  });

  it('getSummary manda la fecha como query param', () => {
    const summary: PaymentsSummary = { date: '2026-09-18', total: 1000, cash: 500, transfer: 300, card: 200, debtTotal: 0 };

    let result: PaymentsSummary | undefined;
    service.getSummary('2026-09-18').subscribe(r => (result = r));

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/payments/summary`);
    expect(req.request.params.get('date')).toBe('2026-09-18');
    req.flush(summary);

    expect(result).toEqual(summary);
  });

  it('payBooking hace POST al booking con el body recibido', () => {
    const result: BookingPaymentResult = { id: 'b1', paidAmount: 500, paymentStatus: 'paid', totalAmount: 500 };

    let response: BookingPaymentResult | undefined;
    service.payBooking('b1', { amount: 500, paymentMethod: 'efectivo' }).subscribe(r => (response = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings/b1/payments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 500, paymentMethod: 'efectivo' });
    req.flush(result);

    expect(response).toEqual(result);
  });
});
