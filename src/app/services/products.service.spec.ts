import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { Product, ProductSale, ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los productos', () => {
    const mockProducts: Product[] = [
      { id: 'p1', name: 'Paleta', type: 'alquiler', stock: 5, minStock: 2, price: 1000, lowStock: false },
    ];

    service.getProducts().subscribe(products => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/products`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('vende un producto suelto, sin reserva asociada (camino feliz)', () => {
    const body = { productId: 'p1', quantity: 2, paymentMethod: 'efectivo' as const };
    const result: ProductSale = {
      id: 's1',
      productId: 'p1',
      productName: 'Paleta',
      quantity: 2,
      amount: 2000,
      bookingId: null,
      paymentMethod: 'efectivo',
      createdAt: '2026-09-19T12:00:00Z',
    };

    service.sellProduct(body).subscribe(res => {
      expect(res).toEqual(result);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/product-sales`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(result, { status: 201, statusText: 'Created' });
  });

  it('vende un producto asociado a una reserva', () => {
    const body = { productId: 'p2', quantity: 1, paymentMethod: 'tarjeta' as const, bookingId: 'b1' };
    const result: ProductSale = {
      id: 's2',
      productId: 'p2',
      productName: 'Pelotas',
      quantity: 1,
      amount: 500,
      bookingId: 'b1',
      paymentMethod: 'tarjeta',
      createdAt: '2026-09-19T12:05:00Z',
    };

    service.sellProduct(body).subscribe(res => {
      expect(res).toEqual(result);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/product-sales`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(result, { status: 201, statusText: 'Created' });
  });

  it('propaga el error de stock insuficiente', () => {
    const body = { productId: 'p1', quantity: 100, paymentMethod: 'efectivo' as const };
    const errorBody = { error: 'No hay stock suficiente para esta venta' };

    service.sellProduct(body).subscribe({
      next: () => fail('no deberia resolver con exito'),
      error: err => {
        expect(err.status).toBe(400);
        expect(err.error).toEqual(errorBody);
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/product-sales`);
    req.flush(errorBody, { status: 400, statusText: 'Bad Request' });
  });
});
