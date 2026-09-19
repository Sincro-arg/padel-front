import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PriceRulesService, PriceRule } from './price-rules.service';
import { environment } from '../../environments/environment';

describe('PriceRulesService', () => {
  let service: PriceRulesService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/price-rules`;

  const rule: PriceRule = {
    id: 'r1',
    dayType: 'weekday',
    startHour: 8,
    endHour: 20,
    pricePerHour: 1000,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PriceRulesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getPriceRules pide GET /price-rules', () => {
    let result: PriceRule[] | undefined;
    service.getPriceRules().subscribe(r => (result = r));

    httpMock.expectOne({ url: base, method: 'GET' }).flush([rule]);
    expect(result).toEqual([rule]);
  });

  it('getPriceRules propaga el error si el back falla', () => {
    let capturedStatus: number | undefined;
    service.getPriceRules().subscribe({
      next: () => fail('no debería resolver'),
      error: err => (capturedStatus = err.status),
    });

    httpMock
      .expectOne({ url: base, method: 'GET' })
      .flush({ error: 'Error al listar precios' }, { status: 500, statusText: 'Internal Server Error' });

    expect(capturedStatus).toBe(500);
  });

  it('createPriceRule hace POST con el body', () => {
    const body = { dayType: 'weekday' as const, startHour: 8, endHour: 20, pricePerHour: 1000 };
    service.createPriceRule(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(rule);
  });

  it('createPriceRule propaga el error de validación del back', () => {
    const body = { dayType: 'weekday' as const, startHour: 20, endHour: 8, pricePerHour: 1000 };
    let capturedError: { error: string } | undefined;

    service.createPriceRule(body).subscribe({
      next: () => fail('no debería resolver con datos inválidos'),
      error: err => (capturedError = err.error),
    });

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    req.flush({ error: 'startHour debe ser menor que endHour' }, { status: 400, statusText: 'Bad Request' });

    expect(capturedError?.error).toBe('startHour debe ser menor que endHour');
  });

  it('updatePriceRule hace PUT a /price-rules/{id}', () => {
    const body = { dayType: 'weekend' as const, startHour: 8, endHour: 24, pricePerHour: 1500 };
    service.updatePriceRule('r1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/r1`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'r1', ...body });
  });

  it('deletePriceRule hace DELETE a /price-rules/{id}', () => {
    service.deletePriceRule('r1').subscribe();
    httpMock.expectOne({ url: `${base}/r1`, method: 'DELETE' }).flush(null);
  });
});
