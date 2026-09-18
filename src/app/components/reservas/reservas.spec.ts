import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Reservas } from './reservas';
import { Booking } from '../../services/bookings.service';
import { Court } from '../../services/courts.service';
import { Member } from '../../services/members.service';
import { environment } from '../../../environments/environment';

const COURT_1: Court = { id: 'c1', name: 'Cancha 1' };
const COURT_2: Court = { id: 'c2', name: 'Cancha 2' };

const MEMBER_OK: Member = {
  id: 'm1',
  name: 'Juan',
  phone: '111',
  membershipFee: 1000,
  discountPercent: 0,
  monthsOwed: 0,
  isBlocked: false,
};
const MEMBER_BLOCKED: Member = {
  id: 'm2',
  name: 'Pedro',
  phone: '222',
  membershipFee: 1000,
  discountPercent: 0,
  monthsOwed: 3,
  isBlocked: true,
};

const BOOKING: Booking = {
  id: 'b1',
  courtId: 'c1',
  courtName: 'Cancha 1',
  customerName: 'Ana',
  customerPhone: '333',
  date: '2026-09-18',
  startHour: 10,
  endHour: 12,
  memberId: null,
  status: 'confirmed',
  totalAmount: 6000,
  paidAmount: 0,
  paymentStatus: 'pending',
  cancellationFee: 0,
  isRecurring: false,
  recurringBookingId: null,
};

describe('Reservas', () => {
  let component: Reservas;
  let fixture: ComponentFixture<Reservas>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reservas],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Reservas);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al iniciar carga canchas, socios y las reservas del día', () => {
    component.ngOnInit();

    httpMock.expectOne(`${environment.apiUrl}/courts`).flush([COURT_1, COURT_2]);
    httpMock.expectOne(`${environment.apiUrl}/members`).flush([MEMBER_OK]);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush([BOOKING]);

    expect(component.courts()).toEqual([COURT_1, COURT_2]);
    expect(component.members()).toEqual([MEMBER_OK]);
    expect(component.bookings()).toEqual([BOOKING]);
  });

  it('grid solo ubica las reservas confirmadas, en cada hora que ocupan', () => {
    const cancelled: Booking = { ...BOOKING, id: 'b2', courtId: 'c2', status: 'cancelled' };
    component.courts.set([COURT_1, COURT_2]);
    component.bookings.set([BOOKING, cancelled]);

    expect(component.cellBooking('c1', 10)).toEqual(BOOKING);
    expect(component.cellBooking('c1', 11)).toEqual(BOOKING);
    expect(component.cellBooking('c1', 12)).toBeNull();
    expect(component.cellBooking('c2', 10)).toBeNull();
  });

  it('isCellStart marca solo la hora de inicio de la reserva', () => {
    expect(component.isCellStart(BOOKING, 10)).toBeTrue();
    expect(component.isCellStart(BOOKING, 11)).toBeFalse();
  });

  it('changeDate actualiza la fecha y recarga', () => {
    component.changeDate('2026-09-20');
    expect(component.date()).toBe('2026-09-20');
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.params.get('date') === '2026-09-20').flush([]);
  });

  it('memberLabel avisa cuántas cuotas debe un socio bloqueado', () => {
    expect(component.memberLabel(MEMBER_OK)).toBe('Juan');
    expect(component.memberLabel(MEMBER_BLOCKED)).toBe('Pedro (debe 3 cuotas)');
  });

  it('openNew precarga la primera cancha y la hora clickeada', () => {
    component.courts.set([COURT_1, COURT_2]);
    component.openNew(undefined, 15);

    expect(component.editingId()).toBeNull();
    expect(component.fCourtId()).toBe('c1');
    expect(component.fStartHour()).toBe(15);
    expect(component.fEndHour()).toBe(16);
    expect(component.showForm()).toBeTrue();
  });

  it('openEdit precarga los datos de la reserva', () => {
    component.openEdit(BOOKING);

    expect(component.editingId()).toBe('b1');
    expect(component.fCourtId()).toBe('c1');
    expect(component.fCustomerName()).toBe('Ana');
    expect(component.fStartHour()).toBe(10);
    expect(component.fEndHour()).toBe(12);
  });

  it('submitForm exige cancha, nombre y fecha', () => {
    component.openNew();
    component.fCourtId.set('');
    component.submitForm();
    expect(component.fError()).toBe('Elegí una cancha.');

    component.fCourtId.set('c1');
    component.fCustomerName.set('');
    component.submitForm();
    expect(component.fError()).toBe('Completá el nombre.');

    component.fCustomerName.set('Ana');
    component.fDate.set('');
    component.submitForm();
    expect(component.fError()).toBe('Elegí la fecha.');

    httpMock.expectNone(r => r.url === `${environment.apiUrl}/bookings`);
  });

  it('submitForm rechaza que la hora de fin no sea posterior al inicio', () => {
    component.openNew();
    component.fCourtId.set('c1');
    component.fCustomerName.set('Ana');
    component.fDate.set('2026-09-18');
    component.fStartHour.set(10);
    component.fEndHour.set(10);
    component.submitForm();

    expect(component.fError()).toBe('La hora de fin tiene que ser posterior a la de inicio.');
  });

  it('submitForm rechaza un socio con 2 o más cuotas adeudadas', () => {
    component.members.set([MEMBER_BLOCKED]);
    component.openNew();
    component.fCourtId.set('c1');
    component.fCustomerName.set('Pedro');
    component.fDate.set('2026-09-18');
    component.fMemberId.set('m2');
    component.submitForm();

    expect(component.fError()).toBe('El socio debe 2 o más cuotas y no puede reservar hasta ponerse al día.');
    httpMock.expectNone(r => r.url === `${environment.apiUrl}/bookings`);
  });

  it('submitForm crea una reserva simple y recarga la grilla', () => {
    component.date.set('2026-09-18');
    component.openNew();
    component.fCourtId.set('c1');
    component.fCustomerName.set('Ana');
    component.fCustomerPhone.set('333');
    component.fDate.set('2026-09-18');
    component.fStartHour.set(10);
    component.fEndHour.set(12);
    component.submitForm();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.method === 'POST');
    expect(req.request.body).toEqual({
      courtId: 'c1',
      customerName: 'Ana',
      customerPhone: '333',
      date: '2026-09-18',
      startHour: 10,
      endHour: 12,
    });
    req.flush(BOOKING);

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.method === 'GET').flush([BOOKING]);

    expect(component.showForm()).toBeFalse();
    expect(component.successMessage()).toBe('Reserva creada.');
  });

  it('submitForm con turno fijo crea un recurring-booking con el weekday de la fecha', () => {
    const expectedWeekday = new Date(2026, 8, 18).getDay();
    component.date.set('2026-09-18');
    component.openNew();
    component.fCourtId.set('c1');
    component.fCustomerName.set('Ana');
    component.fCustomerPhone.set('333');
    component.fDate.set('2026-09-18');
    component.fStartHour.set(10);
    component.fEndHour.set(12);
    component.fRecurring.set(true);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/recurring-bookings`);
    expect(req.request.body).toEqual({
      courtId: 'c1',
      customerName: 'Ana',
      customerPhone: '333',
      weekday: expectedWeekday,
      startHour: 10,
      endHour: 12,
    });
    req.flush({ id: 'r1', ...req.request.body });

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.method === 'GET').flush([]);

    expect(component.successMessage()).toBe('Turno fijo creado: se generaron las próximas 8 semanas.');
  });

  it('submitForm edita una reserva existente con PUT', () => {
    component.date.set('2026-09-18');
    component.openEdit(BOOKING);
    component.fEndHour.set(13);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings/b1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.endHour).toBe(13);
    req.flush({ ...BOOKING, endHour: 13 });

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.method === 'GET').flush([]);

    expect(component.successMessage()).toBe('Reserva actualizada.');
  });

  it('un 409 del back al crear se muestra en el formulario', () => {
    component.date.set('2026-09-18');
    component.openNew();
    component.fCourtId.set('c1');
    component.fCustomerName.set('Ana');
    component.fDate.set('2026-09-18');
    component.fStartHour.set(10);
    component.fEndHour.set(11);
    component.submitForm();

    httpMock
      .expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.method === 'POST')
      .flush({ error: 'La cancha ya tiene una reserva en ese horario' }, { status: 409, statusText: 'Conflict' });

    expect(component.fError()).toBe('La cancha ya tiene una reserva en ese horario');
    expect(component.fSubmitting()).toBeFalse();
  });

  it('openDetail / closeDetail abren y cierran el detalle', () => {
    component.openDetail(BOOKING);
    expect(component.detailBooking()).toEqual(BOOKING);

    component.closeDetail();
    expect(component.detailBooking()).toBeNull();
  });

  it('confirmCancel cancela la reserva y recarga la grilla', () => {
    component.date.set('2026-09-18');
    component.openDetail(BOOKING);
    component.askCancel();
    component.confirmCancel();

    const req = httpMock.expectOne(`${environment.apiUrl}/bookings/b1/cancel`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...BOOKING, status: 'cancelled', cancellationFee: 3000 });

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.method === 'GET').flush([]);

    expect(component.detailBooking()).toBeNull();
    expect(component.successMessage()).toBe('Reserva cancelada.');
  });

  it('confirmDelete elimina la reserva y recarga la grilla', () => {
    component.date.set('2026-09-18');
    component.openDetail(BOOKING);
    component.askDelete();
    component.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/bookings/b1`).flush(null);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings` && r.method === 'GET').flush([]);

    expect(component.detailBooking()).toBeNull();
    expect(component.successMessage()).toBe('Reserva eliminada.');
  });
});
