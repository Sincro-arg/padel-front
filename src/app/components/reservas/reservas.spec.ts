import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Reservas } from './reservas';
import { Booking } from '../../services/bookings.service';
import { Court } from '../../services/courts.service';

describe('Reservas', () => {
  let fixture: ComponentFixture<Reservas>;
  let component: Reservas;
  let httpMock: HttpTestingController;
  let today: string;

  const courts: Court[] = [{ id: 'c1', name: 'Cancha 1' }];

  const baseBooking: Omit<Booking, 'id' | 'startHour' | 'endHour' | 'customerName'> = {
    courtId: 'c1',
    courtName: 'Cancha 1',
    customerPhone: '',
    date: '',
    memberId: null,
    status: 'confirmed',
    totalAmount: 0,
    paidAmount: 0,
    paymentStatus: 'pending',
    cancellationFee: 0,
    isRecurring: false,
    recurringBookingId: null,
  };

  /** Responde las 4 llamadas que dispara ngOnInit (courts, members, recurring, bookings del día). */
  function flushInitial(bookings: Booking[] = []): void {
    httpMock.expectOne(`${environment.apiUrl}/courts`).flush(courts);
    httpMock.expectOne(`${environment.apiUrl}/members`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/recurring-bookings`).flush([]);
    httpMock
      .expectOne(req => req.method === 'GET' && req.url === `${environment.apiUrl}/bookings`)
      .flush(bookings);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reservas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Reservas);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    today = component.date();

    fixture.detectChanges(); // dispara ngOnInit
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista las reservas del día en la celda de la cancha y el horario correspondiente', () => {
    const booking: Booking = {
      ...baseBooking,
      id: 'b1',
      date: today,
      startHour: 10,
      endHour: 11,
      customerName: 'Juan Pérez',
    };
    flushInitial([booking]);

    const cell = fixture.nativeElement.querySelector('.rsv__cell--busy');
    expect(cell?.textContent).toContain('Juan Pérez');
    expect(cell?.textContent).toContain('10-11hs');
    expect(cell?.textContent).toContain('Pendiente');
  });

  it('muestra la grilla vacía (celdas libres) cuando no hay reservas ese día', () => {
    flushInitial([]);

    expect(fixture.nativeElement.querySelector('.rsv__cell--busy')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.rsv__cell--free').length).toBeGreaterThan(0);
  });

  it('alta camino feliz: crea la reserva, cierra el modal y recarga el listado', () => {
    flushInitial([]);

    component.openNew('c1', 10);
    component.fCustomerName.set('Ana López');
    fixture.detectChanges();

    component.submitForm();

    const postReq = httpMock.expectOne(
      req => req.method === 'POST' && req.url === `${environment.apiUrl}/bookings`,
    );
    expect(postReq.request.body).toEqual({
      courtId: 'c1',
      customerName: 'Ana López',
      customerPhone: '',
      date: today,
      startHour: 10,
      endHour: 11,
    });

    const created: Booking = {
      ...baseBooking,
      id: 'b2',
      date: today,
      startHour: 10,
      endHour: 11,
      customerName: 'Ana López',
    };
    postReq.flush(created);

    httpMock
      .expectOne(req => req.method === 'GET' && req.url === `${environment.apiUrl}/bookings`)
      .flush([created]);
    fixture.detectChanges();

    expect(component.showForm()).toBeFalse();
    expect(component.fError()).toBe('');
    expect(component.successMessage()).toContain('creada');
  });

  it('alta con conflicto de horario (409): muestra el error del back y deja el modal abierto', () => {
    flushInitial([]);

    component.openNew('c1', 10);
    component.fCustomerName.set('Ana López');
    fixture.detectChanges();

    component.submitForm();

    const postReq = httpMock.expectOne(
      req => req.method === 'POST' && req.url === `${environment.apiUrl}/bookings`,
    );
    postReq.flush(
      { error: 'La cancha ya tiene una reserva en ese horario' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.showForm()).toBeTrue();
    expect(component.fSubmitting()).toBeFalse();
    expect(component.fError()).toBe('La cancha ya tiene una reserva en ese horario');

    const banner = fixture.nativeElement.querySelector('.rsv__modal .banner-danger');
    expect(banner?.textContent).toContain('La cancha ya tiene una reserva en ese horario');
  });
});
