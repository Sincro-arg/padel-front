import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TournamentsService, Tournament, Pair, Match } from './tournaments.service';
import { environment } from '../../environments/environment';

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

  afterEach(() => httpMock.verify());

  it('getTournaments pide GET /tournaments', () => {
    const tournaments: Tournament[] = [{ id: 't1', name: 'Apertura', date: '2026-10-01', registrationFee: 1000 }];

    let result: Tournament[] | undefined;
    service.getTournaments().subscribe(r => (result = r));

    httpMock.expectOne({ url: base, method: 'GET' }).flush(tournaments);
    expect(result).toEqual(tournaments);
  });

  it('createTournament hace POST con el body', () => {
    const body = { name: 'Apertura', date: '2026-10-01', registrationFee: 1000 };
    service.createTournament(body).subscribe();

    const req = httpMock.expectOne({ url: base, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 't1', ...body });
  });

  it('updateTournament hace PUT a /tournaments/{id}', () => {
    const body = { name: 'Apertura 2', date: '2026-10-02', registrationFee: 1200 };
    service.updateTournament('t1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/t1`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 't1', ...body });
  });

  it('deleteTournament hace DELETE a /tournaments/{id}', () => {
    service.deleteTournament('t1').subscribe();
    httpMock.expectOne({ url: `${base}/t1`, method: 'DELETE' }).flush(null);
  });

  it('getPairs pide GET /tournaments/{id}/pairs', () => {
    const pairs: Pair[] = [{ id: 'p1', tournamentId: 't1', player1: 'A', player2: 'B', paid: true, paymentMethod: 'efectivo' }];

    let result: Pair[] | undefined;
    service.getPairs('t1').subscribe(r => (result = r));

    httpMock.expectOne({ url: `${base}/t1/pairs`, method: 'GET' }).flush(pairs);
    expect(result).toEqual(pairs);
  });

  it('createPair hace POST a /tournaments/{id}/pairs', () => {
    const body = { player1: 'A', player2: 'B', paid: false };
    service.createPair('t1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/t1/pairs`, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'p1', tournamentId: 't1', ...body });
  });

  it('deletePair hace DELETE a /tournaments/pairs/{pairId}', () => {
    service.deletePair('p1').subscribe();
    httpMock.expectOne({ url: `${environment.apiUrl}/tournaments/pairs/p1`, method: 'DELETE' }).flush(null);
  });

  it('getMatches pide GET /tournaments/{id}/matches', () => {
    const matches: Match[] = [{ id: 'm1', tournamentId: 't1', round: 'Final', pair1Id: 'p1', pair2Id: 'p2', score: null, winnerPairId: null }];

    let result: Match[] | undefined;
    service.getMatches('t1').subscribe(r => (result = r));

    httpMock.expectOne({ url: `${base}/t1/matches`, method: 'GET' }).flush(matches);
    expect(result).toEqual(matches);
  });

  it('createMatch hace POST a /tournaments/{id}/matches', () => {
    const body = { round: 'Final', pair1Id: 'p1', pair2Id: 'p2' };
    service.createMatch('t1', body).subscribe();

    const req = httpMock.expectOne({ url: `${base}/t1/matches`, method: 'POST' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'm1', tournamentId: 't1', ...body, score: null, winnerPairId: null });
  });

  it('updateMatchResult hace PUT a /tournaments/matches/{matchId}/result', () => {
    const body = { score: '6-3 6-4', winnerPairId: 'p1' };
    service.updateMatchResult('m1', body).subscribe();

    const req = httpMock.expectOne({ url: `${environment.apiUrl}/tournaments/matches/m1/result`, method: 'PUT' });
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'm1', tournamentId: 't1', round: 'Final', pair1Id: 'p1', pair2Id: 'p2', ...body });
  });
});
