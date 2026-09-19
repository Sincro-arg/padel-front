import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { MonthlyReport } from '../../services/reports.service';
import { Reports } from './reports';

describe('Reports', () => {
  let fixture: ComponentFixture<Reports>;
  let component: Reports;
  let httpMock: HttpTestingController;

  const report: MonthlyReport = {
    totalRevenue: 120000,
    byHour: [{ hour: 10, occupancyRate: 0.5 }],
    topCustomers: [{ name: 'Juan Pérez', totalSpent: 30000, bookingsCount: 4 }],
  };

  function flushReport(data: MonthlyReport = report): void {
    httpMock
      .expectOne(req => req.method === 'GET' && req.url === `${environment.apiUrl}/reports/monthly`)
      .flush(data);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('se crea y pide el reporte del mes actual al iniciar', () => {
    fixture.detectChanges();
    flushReport();
    expect(component).toBeTruthy();
  });

  it('muestra la facturación total y los mejores clientes', () => {
    fixture.detectChanges();
    flushReport();
    fixture.detectChanges();

    const el = fixture.nativeElement;
    expect(el.querySelector('.rp__revenue')?.textContent).toContain('120000');

    const rows = el.querySelectorAll('.rp__row');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Juan Pérez');
    expect(rows[0].textContent).toContain('4 reservas');
  });

  it('si falla la carga muestra el error con reintentar', () => {
    fixture.detectChanges();
    httpMock
      .expectOne(req => req.method === 'GET' && req.url === `${environment.apiUrl}/reports/monthly`)
      .flush({ error: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.banner-danger')).toBeTruthy();
  });
});
