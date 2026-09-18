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

  it('createCourt hace POST con el body', () => {
    const body = { name: 'Cancha 1' };
    service.createCourt(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush(court);
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
