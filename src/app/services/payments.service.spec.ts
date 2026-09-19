import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { BookingPaymentResult, Debt, PaymentsService } from './payments.service';

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

  afterEach(() => {
    httpMock.verify();
  });

  it('lista las deudas pendientes', () => {
    const mockDebts: Debt[] = [
      {
        bookingId: 'b1',
        customerName: 'Juan Perez',
        date: '2026-09-19',
        startHour: 18,
        amountDue: 5000,
      },
    ];

    service.getDebts().subscribe((debts) => {
      expect(debts).toEqual(mockDebts);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/payments/debts`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDebts);
  });

  it('registra un pago de una reserva (camino feliz)', () => {
    const bookingId = 'b1';
    const body = { amount: 5000, paymentMethod: 'efectivo' as const };
    const result: BookingPaymentResult = {
      id: bookingId,
      paidAmount: 5000,
      paymentStatus: 'paid',
      totalAmount: 5000,
    };

    service.payBooking(bookingId, body).subscribe((res) => {
      expect(res).toEqual(result);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings/${bookingId}/payments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(result, { status: 200, statusText: 'OK' });
  });

  it('propaga el error de validacion al registrar un pago', () => {
    const bookingId = 'b1';
    const body = { amount: -100, paymentMethod: 'efectivo' as const };
    const errorBody = { error: 'El monto debe ser mayor a cero' };

    service.payBooking(bookingId, body).subscribe({
      next: () => fail('no deberia resolver con exito'),
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.error).toEqual(errorBody);
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings/${bookingId}/payments`);
    expect(req.request.method).toBe('POST');
    req.flush(errorBody, { status: 400, statusText: 'Bad Request' });
  });
});
