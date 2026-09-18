import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Tournaments } from './tournaments';
import { Pair, Tournament } from '../../services/tournaments.service';
import { environment } from '../../../environments/environment';

const TOURNAMENT: Tournament = { id: 't1', name: 'Apertura', date: '2026-10-01', registrationFee: 1000 };
const PAIR: Pair = { id: 'p1', tournamentId: 't1', player1: 'Juan', player2: 'Pedro', paid: true, paymentMethod: 'efectivo' };

describe('Tournaments', () => {
  let component: Tournaments;
  let fixture: ComponentFixture<Tournaments>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tournaments],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Tournaments);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al iniciar carga los torneos', () => {
    component.ngOnInit();
    httpMock.expectOne(`${environment.apiUrl}/tournaments`).flush([TOURNAMENT]);
    expect(component.tournaments()).toEqual([TOURNAMENT]);
  });

  it('seleccionar un torneo carga sus parejas y su fixture', () => {
    component.selectTournament(TOURNAMENT);
    httpMock.expectOne(`${environment.apiUrl}/tournaments/t1/pairs`).flush([PAIR]);
    httpMock.expectOne(`${environment.apiUrl}/tournaments/t1/matches`).flush([]);
    expect(component.pairs()).toEqual([PAIR]);
  });

  it('pairName arma "jugador1 / jugador2" o un guion si no existe', () => {
    component.pairs.set([PAIR]);
    expect(component.pairName('p1')).toBe('Juan / Pedro');
    expect(component.pairName('inexistente')).toBe('—');
  });

  it('submitTournament exige nombre y fecha', () => {
    component.tName.set('');
    component.tDate.set('');
    component.submitTournament();

    expect(component.tError()).toBe('Completá el nombre y la fecha.');
    httpMock.expectNone(`${environment.apiUrl}/tournaments`);
  });

  it('submitTournament rechaza una inscripción negativa', () => {
    component.tName.set('Apertura');
    component.tDate.set('2026-10-01');
    component.tFee.set(-100);
    component.submitTournament();

    expect(component.tError()).toBe('La inscripción no puede ser negativa.');
  });

  it('submitTournament crea el torneo y recarga la lista', () => {
    component.tName.set('Apertura');
    component.tDate.set('2026-10-01');
    component.tFee.set(1000);
    component.submitTournament();

    const req = httpMock.expectOne(`${environment.apiUrl}/tournaments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Apertura', date: '2026-10-01', registrationFee: 1000 });
    req.flush(TOURNAMENT);

    httpMock.expectOne(`${environment.apiUrl}/tournaments`).flush([TOURNAMENT]);

    expect(component.showTournamentForm()).toBeFalse();
    expect(component.successMessage()).toBe('Torneo creado.');
  });

  it('submitMatch exige dos parejas distintas', () => {
    component.selectedId.set('t1');
    component.mRound.set('Ronda 1');
    component.mPair1Id.set('p1');
    component.mPair2Id.set('p1');
    component.submitMatch();

    expect(component.mError()).toBe('Las dos parejas del partido tienen que ser distintas.');
    httpMock.expectNone(`${environment.apiUrl}/tournaments/t1/matches`);
  });
});
