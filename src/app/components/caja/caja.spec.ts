import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Caja } from './caja';
import { AuthService, AuthUser } from '../../services/auth.service';
import { Booking } from '../../services/bookings.service';
import { BookingPaymentRecord, Debt, PaymentsSummary } from '../../services/payments.service';
import { environment } from '../../../environments/environment';

const ADMIN: AuthUser = { id: '1', name: 'Ana', role: 'admin' };
const EMPLEADO: AuthUser = { id: '2', name: 'Beto', role: 'empleado' };

const DEBT: Debt = { bookingId: 'b1', customerName: 'Juan', date: '2026-09-18', startHour: 10, amountDue: 500 };
const SUMMARY: PaymentsSummary = { date: '2026-09-18', total: 1000, cash: 500, transfer: 300, card: 200, debtTotal: 500 };

const PAID_BOOKING: Booking = {
  id: 'b2',
  courtId: 'c1',
  courtName: 'Cancha 1',
  customerName: 'María',
  customerPhone: '111',
  date: '2026-09-18',
  startHour: 12,
  endHour: 13,
  memberId: null,
  status: 'confirmed',
  totalAmount: 1000,
  paidAmount: 1000,
  paymentStatus: 'paid',
  cancellationFee: 0,
  isRecurring: false,
  recurringBookingId: null,
};

const PAYMENT: BookingPaymentRecord = {
  id: 'p1',
  bookingId: 'b2',
  amount: 1000,
  paymentMethod: 'efectivo',
  createdAt: '2026-09-18T12:00:00Z',
};

describe('Caja', () => {
  let component: Caja;
  let fixture: ComponentFixture<Caja>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Caja],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Caja);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    auth.currentUser.set(null);
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('un empleado solo carga las deudas, no el resumen del día', () => {
    auth.currentUser.set(EMPLEADO);
    component.ngOnInit();

    httpMock.expectOne(`${environment.apiUrl}/payments/debts`).flush([DEBT]);
    httpMock.expectOne(r => r.url.includes('/bookings')).flush([]);
    httpMock.expectNone(r => r.url.includes('/payments/summary'));

    expect(component.debts()).toEqual([DEBT]);
  });

  it('un admin carga deudas y el resumen del día', () => {
    auth.currentUser.set(ADMIN);
    component.ngOnInit();

    httpMock.expectOne(`${environment.apiUrl}/payments/debts`).flush([DEBT]);
    httpMock.expectOne(r => r.url.includes('/bookings')).flush([]);
    const req = httpMock.expectOne(r => r.url.includes('/payments/summary'));
    req.flush(SUMMARY);

    expect(component.summary()).toEqual(SUMMARY);
  });

  it('carga las reservas de hoy y muestra las que ya tienen algún pago', () => {
    auth.currentUser.set(EMPLEADO);
    component.ngOnInit();

    httpMock.expectOne(`${environment.apiUrl}/payments/debts`).flush([]);
    httpMock.expectOne(r => r.url.includes('/bookings')).flush([PAID_BOOKING]);

    expect(component.bookingsWithPayments()).toEqual([PAID_BOOKING]);
  });

  it('openPay precarga el monto de la deuda', () => {
    component.openPay(DEBT);
    expect(component.selectedDebt()).toEqual(DEBT);
    expect(component.payAmount()).toBe(500);
    expect(component.payMethod()).toBe('efectivo');
  });

  it('askConfirm rechaza un monto en cero', () => {
    component.openPay(DEBT);
    component.payAmount.set(0);
    component.askConfirm();

    expect(component.payError()).toBe('El monto tiene que ser mayor a cero.');
    expect(component.confirming()).toBeFalse();
  });

  it('confirmPay cobra la deuda y recarga la lista', () => {
    auth.currentUser.set(EMPLEADO);
    component.openPay(DEBT);
    component.confirmPay();

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings/${DEBT.bookingId}/payments`);
    expect(req.request.body).toEqual({ amount: 500, paymentMethod: 'efectivo' });
    req.flush({ id: 'b1', paidAmount: 500, paymentStatus: 'paid', totalAmount: 500 });

    httpMock.expectOne(`${environment.apiUrl}/payments/debts`).flush([]);
    httpMock.expectOne(r => r.url.includes('/bookings')).flush([]);

    expect(component.successMessage()).toContain('Juan');
    expect(component.selectedDebt()).toBeNull();
  });

  it('confirmPay muestra el error que manda el back y no cierra el modal', () => {
    component.openPay(DEBT);
    component.confirmPay();

    expect(component.paySubmitting()).toBeTrue();

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings/${DEBT.bookingId}/payments`);
    req.flush({ error: 'El monto supera la deuda.' }, { status: 400, statusText: 'Bad Request' });

    expect(component.payError()).toBe('El monto supera la deuda.');
    expect(component.paySubmitting()).toBeFalse();
    expect(component.confirming()).toBeFalse();
    expect(component.selectedDebt()).toEqual(DEBT);
  });

  it('togglePayments carga los pagos de la reserva y togglePayments de nuevo los oculta', () => {
    component.togglePayments(PAID_BOOKING);
    httpMock.expectOne(`${environment.apiUrl}/bookings/${PAID_BOOKING.id}/payments`).flush([PAYMENT]);

    expect(component.expandedBookingId()).toBe(PAID_BOOKING.id);
    expect(component.bookingPayments()).toEqual([PAYMENT]);

    component.togglePayments(PAID_BOOKING);

    expect(component.expandedBookingId()).toBeNull();
    expect(component.bookingPayments()).toEqual([]);
  });

  it('openEditPayment precarga el monto y el medio de pago', () => {
    component.openEditPayment(PAYMENT);

    expect(component.editingPayment()).toEqual(PAYMENT);
    expect(component.editAmount()).toBe(1000);
    expect(component.editMethod()).toBe('efectivo');
  });

  it('confirmEditPayment corrige el pago y recarga deudas, reservas y el resumen', () => {
    auth.currentUser.set(ADMIN);
    component.openEditPayment(PAYMENT);
    component.editAmount.set(800);
    component.editMethod.set('tarjeta');
    component.confirmEditPayment();

    const req = httpMock.expectOne(
      `${environment.apiUrl}/bookings/${PAYMENT.bookingId}/payments/${PAYMENT.id}`,
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ amount: 800, paymentMethod: 'tarjeta' });
    req.flush({ id: PAYMENT.bookingId, paidAmount: 800, paymentStatus: 'partial', totalAmount: 1000 });

    httpMock.expectOne(`${environment.apiUrl}/payments/debts`).flush([]);
    httpMock.expectOne(r => r.url.includes('/bookings')).flush([]);
    httpMock.expectOne(r => r.url.includes('/payments/summary')).flush(SUMMARY);

    expect(component.editingPayment()).toBeNull();
    expect(component.successMessage()).toBe('Pago corregido.');
  });

  it('confirmDeletePayment borra el pago y recarga deudas y reservas', () => {
    auth.currentUser.set(EMPLEADO);
    component.askDeletePayment(PAYMENT);
    component.confirmDeletePayment(PAYMENT);

    const req = httpMock.expectOne(
      `${environment.apiUrl}/bookings/${PAYMENT.bookingId}/payments/${PAYMENT.id}`,
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: PAYMENT.bookingId, paidAmount: 0, paymentStatus: 'pending', totalAmount: 1000 });

    httpMock.expectOne(`${environment.apiUrl}/payments/debts`).flush([]);
    httpMock.expectOne(r => r.url.includes('/bookings')).flush([]);

    expect(component.deletingPaymentId()).toBeNull();
    expect(component.successMessage()).toBe('Pago borrado.');
  });
});
