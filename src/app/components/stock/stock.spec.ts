import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Stock } from './stock';
import { AuthService, AuthUser } from '../../services/auth.service';
import { Product } from '../../services/products.service';
import { Booking } from '../../services/bookings.service';
import { environment } from '../../../environments/environment';

const ADMIN: AuthUser = { id: '1', name: 'Ana', role: 'admin' };

const PADDLE: Product = { id: 'p1', name: 'Paleta', type: 'alquiler', stock: 5, minStock: 2, price: 500, lowStock: false };
const BALLS: Product = { id: 'p2', name: 'Pelotas', type: 'venta', stock: 1, minStock: 3, price: 300, lowStock: true };

const BOOKING: Booking = {
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
  totalAmount: 3000,
  paidAmount: 0,
  paymentStatus: 'pending',
  cancellationFee: 0,
  isRecurring: false,
  recurringBookingId: null,
};

describe('Stock', () => {
  let component: Stock;
  let fixture: ComponentFixture<Stock>;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Stock],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Stock);
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

  it('al iniciar carga los productos', () => {
    component.ngOnInit();
    httpMock.expectOne(`${environment.apiUrl}/products`).flush([PADDLE, BALLS]);
    expect(component.products()).toEqual([PADDLE, BALLS]);
  });

  it('lowStockProducts filtra solo los que tienen lowStock', () => {
    component.products.set([PADDLE, BALLS]);
    expect(component.lowStockProducts()).toEqual([BALLS]);
  });

  it('isAdmin refleja el rol del usuario logueado', () => {
    expect(component.isAdmin()).toBeFalse();
    auth.currentUser.set(ADMIN);
    expect(component.isAdmin()).toBeTrue();
  });

  it('typeLabel traduce el tipo de producto', () => {
    expect(component.typeLabel('venta')).toContain('Venta');
    expect(component.typeLabel('alquiler')).toContain('Alquiler');
  });

  it('submitForm exige nombre', () => {
    component.openNew();
    component.fName.set('  ');
    component.submitForm();

    expect(component.fError()).toBe('Completá el nombre.');
    httpMock.expectNone(`${environment.apiUrl}/products`);
  });

  it('submitForm rechaza stock negativo', () => {
    component.openNew();
    component.fName.set('Paleta');
    component.fStock.set(-1);
    component.fPrice.set(500);
    component.submitForm();

    expect(component.fError()).toBe('El stock no puede ser negativo.');
  });

  it('submitForm rechaza un precio menor o igual a cero', () => {
    component.openNew();
    component.fName.set('Paleta');
    component.fPrice.set(0);
    component.submitForm();

    expect(component.fError()).toBe('El precio tiene que ser mayor a 0.');
  });

  it('submitForm crea un producto y recarga la lista', () => {
    component.openNew();
    component.fName.set('Paleta');
    component.fType.set('alquiler');
    component.fStock.set(5);
    component.fMinStock.set(2);
    component.fPrice.set(500);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/products`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Paleta', type: 'alquiler', stock: 5, minStock: 2, price: 500 });
    req.flush(PADDLE);

    httpMock.expectOne(`${environment.apiUrl}/products`).flush([PADDLE]);

    expect(component.showForm()).toBeFalse();
    expect(component.successMessage()).toBe('Producto creado.');
  });

  it('submitForm edita un producto existente con PUT', () => {
    component.openEdit(PADDLE);
    component.fStock.set(8);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/products/p1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.stock).toBe(8);
    req.flush({ ...PADDLE, stock: 8 });

    httpMock.expectOne(`${environment.apiUrl}/products`).flush([]);
    expect(component.successMessage()).toBe('Producto actualizado.');
  });

  it('confirmDelete borra el producto y recarga la lista', () => {
    component.askDelete('p1');
    component.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/products/p1`).flush(null);
    httpMock.expectOne(`${environment.apiUrl}/products`).flush([]);

    expect(component.successMessage()).toBe('Producto eliminado.');
  });

  it('openSell trae las reservas de hoy y deja solo las confirmadas', () => {
    const cancelled = { ...BOOKING, id: 'b2', status: 'cancelled' as const };
    component.openSell(PADDLE);

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush([BOOKING, cancelled]);

    expect(component.sellProduct()).toEqual(PADDLE);
    expect(component.sQuantity()).toBe(1);
    expect(component.todayBookings()).toEqual([BOOKING]);
  });

  it('bookingLabel arma el texto de la reserva', () => {
    expect(component.bookingLabel(BOOKING)).toBe('Juan · Cancha 1 · 10-11hs');
  });

  it('submitSell rechaza una cantidad en cero', () => {
    component.openSell(PADDLE);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush([]);
    component.sQuantity.set(0);
    component.submitSell();

    expect(component.sError()).toBe('La cantidad tiene que ser mayor a 0.');
  });

  it('submitSell rechaza vender más de lo que hay en stock', () => {
    component.openSell(PADDLE);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush([]);
    component.sQuantity.set(10);
    component.submitSell();

    expect(component.sError()).toBe('No hay stock suficiente para esta venta.');
  });

  it('submitSell registra la venta y recarga los productos', () => {
    component.openSell(PADDLE);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/bookings`).flush([BOOKING]);

    component.sQuantity.set(2);
    component.sMethod.set('tarjeta');
    component.sBookingId.set('b1');
    component.submitSell();

    const req = httpMock.expectOne(`${environment.apiUrl}/product-sales`);
    expect(req.request.body).toEqual({ productId: 'p1', quantity: 2, paymentMethod: 'tarjeta', bookingId: 'b1' });
    req.flush({ id: 's1', productId: 'p1', quantity: 2, amount: 1000, bookingId: 'b1', paymentMethod: 'tarjeta', createdAt: '2026-09-18' });

    httpMock.expectOne(`${environment.apiUrl}/products`).flush([]);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/product-sales`).flush([]);

    expect(component.sellProduct()).toBeNull();
    expect(component.successMessage()).toBe('Venta registrada.');
  });
});
