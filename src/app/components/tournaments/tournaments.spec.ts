import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Tournament } from '../../services/tournaments.service';
import { Tournaments } from './tournaments';

describe('Tournaments', () => {
  let fixture: ComponentFixture<Tournaments>;
  let component: Tournaments;
  let httpMock: HttpTestingController;

  const tournaments: Tournament[] = [{ id: 't1', name: 'Apertura', date: '2026-10-01', registrationFee: 5000 }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tournaments],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Tournaments);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('se crea y pide el listado de torneos al iniciar', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/tournaments`).flush([]);
    expect(component).toBeTruthy();
  });

  it('lista los torneos en la pantalla', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/tournaments`).flush(tournaments);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.tn__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Apertura');
    expect(items[0].textContent).toContain('Inscripción $5000');
  });

  it('muestra el mensaje de lista vacía cuando no hay torneos', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/tournaments`).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Todavía no hay torneos cargados.');
  });

  it('si falla la carga muestra el error con reintentar', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(`${environment.apiUrl}/tournaments`)
      .flush({ error: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.banner-danger')).toBeTruthy();
  });
});
