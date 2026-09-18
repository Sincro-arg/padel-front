import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Caja } from './caja';
import { AuthService, AuthUser } from '../../services/auth.service';
import { Debt, PaymentsSummary } from '../../services/payments.service';
import { environment } from '../../../environments/environment';

const ADMIN: AuthUser = { id: '1', name: 'Ana', role: 'admin' };
const EMPLEADO: AuthUser = { id: '2', name: 'Beto', role: 'empleado' };

const DEBT: Debt = { bookingId: 'b1', customerName: 'Juan', date: '2026-09-18', startHour: 10, amountDue: 500 };
const SUMMARY: PaymentsSummary = { date: '2026-09-18', total: 1000, cash: 500, transfer: 300, card: 200, debtTotal: 500 };

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
    httpMock.expectNone(r => r.url.includes('/payments/summary'));

    expect(component.debts()).toEqual([DEBT]);
  });

  it('un admin carga deudas y el resumen del día', () => {
    auth.currentUser.set(ADMIN);
    component.ngOnInit();

    httpMock.expectOne(`${environment.apiUrl}/payments/debts`).flush([DEBT]);
    const req = httpMock.expectOne(r => r.url.includes('/payments/summary'));
    req.flush(SUMMARY);

    expect(component.summary()).toEqual(SUMMARY);
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

    expect(component.successMessage()).toContain('Juan');
    expect(component.selectedDebt()).toBeNull();
  });
});
