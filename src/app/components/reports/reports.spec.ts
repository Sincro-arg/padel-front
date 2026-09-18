import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Reports } from './reports';
import { MonthlyReport } from '../../services/reports.service';
import { environment } from '../../../environments/environment';

const REPORT: MonthlyReport = {
  totalRevenue: 50000,
  byHour: [
    { hour: 8, occupancyRate: 40 },
    { hour: 20, occupancyRate: 80 },
  ],
  topCustomers: [{ name: 'Juan', totalSpent: 5000, bookingsCount: 10 }],
};

describe('Reports', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al iniciar carga el reporte del mes actual', () => {
    const now = new Date();
    component.ngOnInit();

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/reports/monthly` &&
        r.params.get('year') === String(now.getFullYear()) &&
        r.params.get('month') === String(now.getMonth() + 1).padStart(2, '0'),
    );
    req.flush(REPORT);

    expect(component.data()).toEqual(REPORT);
    expect(component.loading()).toBeFalse();
  });

  it('barHeight calcula el porcentaje relativo al pico de ocupación', () => {
    component.data.set(REPORT);
    expect(component.barHeight(80)).toBe('100%');
    expect(component.barHeight(40)).toBe('50%');
  });

  it('si falla la carga muestra un error', () => {
    component.load();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/reports/monthly`);
    req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });

    expect(component.error()).toBe('No se pudo cargar el reporte. Probá de nuevo.');
    expect(component.loading()).toBeFalse();
  });
});
