import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { Tournament, TournamentsService } from './tournaments.service';

describe('TournamentsService', () => {
  let service: TournamentsService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/tournaments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TournamentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los torneos', () => {
    const mockTournaments: Tournament[] = [
      { id: '1', name: 'Apertura', date: '2026-10-01', registrationFee: 3000 },
    ];

    service.getTournaments().subscribe((tournaments) => {
      expect(tournaments).toEqual(mockTournaments);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mockTournaments);
  });

  it('crea un torneo (camino feliz)', () => {
    const input = { name: 'Clausura', date: '2026-12-01', registrationFee: 4000 };
    const created: Tournament = { id: '2', ...input };

    service.createTournament(input).subscribe((tournament) => {
      expect(tournament).toEqual(created);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(created, { status: 201, statusText: 'Created' });
  });

  it('propaga el error de validacion al crear un torneo', () => {
    const input = { name: '', date: '2026-12-01', registrationFee: -1 };
    const errorBody = { error: 'El nombre es obligatorio' };

    service.createTournament(input).subscribe({
      next: () => fail('no deberia resolver con exito'),
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.error).toEqual(errorBody);
      },
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush(errorBody, { status: 400, statusText: 'Bad Request' });
  });
});
