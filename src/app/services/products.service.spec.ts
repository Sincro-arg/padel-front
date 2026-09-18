import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductsService, Product, ProductSale } from './products.service';
import { environment } from '../../environments/environment';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/products`;

  const product: Product = {
    id: 'p1',
    name: 'Pelota',
    type: 'venta',
    stock: 20,
    minStock: 5,
    price: 1000,
    lowStock: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getProducts pide GET /products', () => {
    let result: Product[] | undefined;
    service.getProducts().subscribe(r => (result = r));

    httpMock.expectOne({ url: base, method: 'GET' }).flush([product]);
    expect(result).toEqual([product]);
  });

  it('createProduct hace POST con el body', () => {
    const body = { name: 'Pelota', type: 'venta' as const, stock: 20, minStock: 5, price: 1000 };
    service.createProduct(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(product);
  });

  it('updateProduct hace PUT a /products/{id}', () => {
    const body = { name: 'Pelota', type: 'venta' as const, stock: 15, minStock: 5, price: 1200 };
    service.updateProduct('p1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/p1`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush({ ...product, ...body });
  });

  it('deleteProduct hace DELETE a /products/{id}', () => {
    service.deleteProduct('p1').subscribe();
    httpMock.expectOne({ url: `${base}/p1`, method: 'DELETE' }).flush(null);
  });

  it('sell hace POST a /product-sales con el body', () => {
    const body = { productId: 'p1', quantity: 2, paymentMethod: 'efectivo' as const };
    const sale: ProductSale = {
      id: 's1',
      productId: 'p1',
      productName: 'Pelotas',
      quantity: 2,
      amount: 2000,
      bookingId: null,
      paymentMethod: 'efectivo',
      createdAt: '2026-09-18',
    };

    let result: ProductSale | undefined;
    service.sell(body).subscribe(r => (result = r));

    const req = httpMock.expectOne({ url: `${environment.apiUrl}/product-sales`, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(sale);

    expect(result).toEqual(sale);
  });
});
