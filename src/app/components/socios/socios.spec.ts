import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Socios } from './socios';
import { AuthService, AuthUser } from '../../services/auth.service';
import { Member, MemberPayment } from '../../services/members.service';
import { environment } from '../../../environments/environment';

const ADMIN: AuthUser = { id: '1', name: 'Ana', role: 'admin' };

const MEMBER: Member = {
  id: 'm1',
  name: 'Juan Pérez',
  phone: '1122334455',
  membershipFee: 1000,
  discountPercent: 10,
  monthsOwed: 0,
  isBlocked: false,
};

const PAYMENT: MemberPayment = {
  id: 'p1',
  memberId: 'm1',
  month: 9,
  year: 2026,
  amount: 900,
  paymentMethod: 'efectivo',
  paidAt: '2026-09-01',
};

describe('Socios', () => {
  let component: Socios;
  let fixture: ComponentFixture<Socios>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Socios],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Socios);
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

  it('al iniciar carga los socios', () => {
    component.ngOnInit();
    httpMock.expectOne(`${environment.apiUrl}/members`).flush([MEMBER]);
    expect(component.members()).toEqual([MEMBER]);
  });

  it('isAdmin refleja el rol del usuario logueado', () => {
    expect(component.isAdmin()).toBeFalse();
    auth.currentUser.set(ADMIN);
    expect(component.isAdmin()).toBeTrue();
  });

  it('selectMember carga el historial y closeDetail lo limpia', () => {
    component.members.set([MEMBER]);
    component.selectMember(MEMBER);

    httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`).flush([PAYMENT]);
    expect(component.selectedMember()).toEqual(MEMBER);
    expect(component.payments()).toEqual([PAYMENT]);

    component.closeDetail();
    expect(component.selectedId()).toBeNull();
    expect(component.payments()).toEqual([]);
  });

  it('monthLabel traduce el número de mes', () => {
    expect(component.monthLabel(9)).toBe('Septiembre');
    expect(component.monthLabel(13)).toBe('13');
  });

  it('submitForm exige nombre', () => {
    component.openNew();
    component.fName.set('   ');
    component.submitForm();

    expect(component.fError()).toBe('Completá el nombre.');
    httpMock.expectNone(`${environment.apiUrl}/members`);
  });

  it('submitForm rechaza una cuota negativa', () => {
    component.openNew();
    component.fName.set('Juan');
    component.fFee.set(-100);
    component.submitForm();

    expect(component.fError()).toBe('La cuota no puede ser negativa.');
  });

  it('submitForm rechaza un descuento fuera de 0-100', () => {
    component.openNew();
    component.fName.set('Juan');
    component.fFee.set(1000);
    component.fDiscount.set(150);
    component.submitForm();

    expect(component.fError()).toBe('El descuento tiene que estar entre 0 y 100.');
  });

  it('submitForm crea un socio y recarga la lista', () => {
    component.openNew();
    component.fName.set('Juan Pérez');
    component.fPhone.set('1122334455');
    component.fFee.set(1000);
    component.fDiscount.set(10);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Juan Pérez',
      phone: '1122334455',
      membershipFee: 1000,
      discountPercent: 10,
    });
    req.flush(MEMBER);

    httpMock.expectOne(`${environment.apiUrl}/members`).flush([MEMBER]);

    expect(component.showForm()).toBeFalse();
    expect(component.successMessage()).toBe('Socio creado.');
  });

  it('submitForm edita un socio existente con PUT', () => {
    component.openEdit(MEMBER);
    component.fFee.set(1200);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/members/m1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.membershipFee).toBe(1200);
    req.flush({ ...MEMBER, membershipFee: 1200 });

    httpMock.expectOne(`${environment.apiUrl}/members`).flush([]);
    expect(component.successMessage()).toBe('Socio actualizado.');
  });

  it('confirmDelete borra el socio, cierra el detalle si estaba abierto y recarga', () => {
    component.members.set([MEMBER]);
    component.selectMember(MEMBER);
    httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`).flush([]);

    component.askDelete('m1');
    component.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/members/m1`).flush(null);
    httpMock.expectOne(`${environment.apiUrl}/members`).flush([]);

    expect(component.selectedId()).toBeNull();
    expect(component.successMessage()).toBe('Socio eliminado.');
  });

  it('openPaymentForm precarga el monto con el descuento aplicado', () => {
    component.openPaymentForm(MEMBER);
    httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`).flush([]);

    expect(component.pAmount()).toBe(900);
    expect(component.pMethod()).toBe('efectivo');
    expect(component.showPaymentForm()).toBeTrue();
  });

  it('submitPayment rechaza un mes fuera de 1-12', () => {
    component.openPaymentForm(MEMBER);
    httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`).flush([]);
    component.pMonth.set(13);
    component.submitPayment();

    expect(component.pError()).toBe('El mes tiene que estar entre 1 y 12.');
  });

  it('submitPayment rechaza un monto en cero', () => {
    component.openPaymentForm(MEMBER);
    httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`).flush([]);
    component.pAmount.set(0);
    component.submitPayment();

    expect(component.pError()).toBe('El monto tiene que ser mayor a 0.');
  });

  it('submitPayment registra el pago y recarga socios e historial', () => {
    component.openPaymentForm(MEMBER);
    httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`).flush([]);

    component.pMonth.set(9);
    component.pYear.set(2026);
    component.pAmount.set(900);
    component.pMethod.set('transferencia');
    component.submitPayment();

    const req = httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ month: 9, year: 2026, amount: 900, paymentMethod: 'transferencia' });
    req.flush(PAYMENT);

    httpMock.expectOne(`${environment.apiUrl}/members`).flush([MEMBER]);
    httpMock.expectOne(`${environment.apiUrl}/members/m1/payments`).flush([PAYMENT]);

    expect(component.showPaymentForm()).toBeFalse();
    expect(component.successMessage()).toBe('Cuota cobrada.');
  });
});
