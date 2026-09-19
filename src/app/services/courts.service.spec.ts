import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CourtsService, Court } from './courts.service';
import { environment } from '../../environments/environment';

describe('CourtsService', () => {
  let service: CourtsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/courts`;

  const court: Court = { id: 'c1', name: 'Cancha 1' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CourtsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getCourts pide GET /courts', () => {
    let result: Court[] | undefined;
    service.getCourts().subscribe(r => (result = r));

    httpMock.expectOne({ url: base, method: 'GET' }).flush([court]);
    expect(result).toEqual([court]);
  });

  it('getCourts propaga el error si el back falla', () => {
    let capturedStatus: number | undefined;
    service.getCourts().subscribe({
      next: () => fail('no debería resolver'),
      error: err => (capturedStatus = err.status),
    });

    httpMock
      .expectOne({ url: base, method: 'GET' })
      .flush({ error: 'Error al listar canchas' }, { status: 500, statusText: 'Internal Server Error' });

    expect(capturedStatus).toBe(500);
  });

  it('createCourt hace POST con el body', () => {
    const body = { name: 'Cancha 1' };
    service.createCourt(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(court);
  });

  it('createCourt propaga el error de validación del back', () => {
    const body = { name: '' };
    let capturedError: { error: string } | undefined;

    service.createCourt(body).subscribe({
      next: () => fail('no debería resolver con datos inválidos'),
      error: err => (capturedError = err.error),
    });

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    req.flush({ error: 'El nombre de la cancha es obligatorio' }, { status: 400, statusText: 'Bad Request' });

    expect(capturedError?.error).toBe('El nombre de la cancha es obligatorio');
  });

  it('updateCourt hace PUT a /courts/{id}', () => {
    const body = { name: 'Cancha 1 techada' };
    service.updateCourt('c1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/c1`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'c1', ...body });
  });

  it('deleteCourt hace DELETE a /courts/{id}', () => {
    service.deleteCourt('c1').subscribe();
    httpMock.expectOne({ url: `${base}/c1`, method: 'DELETE' }).flush(null);
  });
});
