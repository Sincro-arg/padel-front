import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Precios } from './precios';
import { PriceRule } from '../../services/price-rules.service';
import { environment } from '../../../environments/environment';

const WEEKDAY_18: PriceRule = { id: 'r1', dayType: 'weekday', startHour: 18, endHour: 20, pricePerHour: 3000 };
const WEEKDAY_8: PriceRule = { id: 'r2', dayType: 'weekday', startHour: 8, endHour: 12, pricePerHour: 2000 };
const WEEKEND: PriceRule = { id: 'r3', dayType: 'weekend', startHour: 10, endHour: 14, pricePerHour: 3500 };

describe('Precios', () => {
  let component: Precios;
  let fixture: ComponentFixture<Precios>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Precios],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Precios);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al iniciar carga las reglas de precio', () => {
    component.ngOnInit();
    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([WEEKDAY_18, WEEKDAY_8, WEEKEND]);
    expect(component.rules().length).toBe(3);
  });

  it('dayTypeLabel traduce el tipo de día', () => {
    expect(component.dayTypeLabel['weekday']).toBe('Día de semana');
    expect(component.dayTypeLabel['weekend']).toBe('Fin de semana');
  });

  it('openNew arranca en 8-9hs y openEdit precarga la regla', () => {
    component.openNew();
    expect(component.fStartHour()).toBe(8);
    expect(component.fEndHour()).toBe(9);

    component.openEdit(WEEKDAY_18);
    expect(component.editingId()).toBe('r1');
    expect(component.fDayType()).toBe('weekday');
    expect(component.fStartHour()).toBe(18);
    expect(component.fPricePerHour()).toBe(3000);
  });

  it('submitForm rechaza un rango horario invertido', () => {
    component.openNew();
    component.fStartHour.set(20);
    component.fEndHour.set(18);
    component.fPricePerHour.set(3000);
    component.submitForm();

    expect(component.fError()).toBe('La hora de inicio debe ser menor a la de fin.');
    httpMock.expectNone(`${environment.apiUrl}/price-rules`);
  });

  it('submitForm rechaza un precio menor o igual a cero', () => {
    component.openNew();
    component.fPricePerHour.set(0);
    component.submitForm();

    expect(component.fError()).toBe('El precio por hora debe ser mayor a 0.');
  });

  it('submitForm crea una regla y recarga la lista', () => {
    component.openNew();
    component.fDayType.set('weekend');
    component.fStartHour.set(10);
    component.fEndHour.set(14);
    component.fPricePerHour.set(3500);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/price-rules`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ dayType: 'weekend', startHour: 10, endHour: 14, pricePerHour: 3500 });
    req.flush(WEEKEND);

    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([WEEKEND]);

    expect(component.showForm()).toBeFalse();
    expect(component.successMessage()).toBe('Precio creado.');
  });

  it('submitForm edita una regla existente con PUT', () => {
    component.openEdit(WEEKDAY_18);
    component.fPricePerHour.set(3200);
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/price-rules/r1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.pricePerHour).toBe(3200);
    req.flush({ ...WEEKDAY_18, pricePerHour: 3200 });

    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([]);
    expect(component.successMessage()).toBe('Precio actualizado.');
  });

  it('el listado se muestra correctamente en pantalla', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([WEEKDAY_18, WEEKEND]);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.pr__item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('18:00');
    expect(items[0].textContent).toContain('3000');
    expect(items[1].textContent).toContain('Fin de semana');
  });

  it('alta camino feliz: el modal se cierra y se ve el mensaje de éxito', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.pr__list-header .btn-primary').click();
    fixture.detectChanges();

    const price = fixture.nativeElement.querySelector('#pr-price');
    price.value = '3500';
    price.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.pr__modal-actions .btn-primary').click();

    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush({ ...WEEKDAY_8, pricePerHour: 3500 });
    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([{ ...WEEKDAY_8, pricePerHour: 3500 }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pr__overlay')).toBeNull();
    expect(fixture.nativeElement.querySelector('.banner-success').textContent).toContain('Precio creado.');
  });

  it('alta con error de validación: el error se ve dentro del modal', () => {
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([]);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.pr__list-header .btn-primary').click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.pr__modal-actions .btn-primary').click();
    fixture.detectChanges();

    const errorBanner = fixture.nativeElement.querySelector('.pr__modal .banner-danger');
    expect(errorBanner.textContent).toContain('El precio por hora debe ser mayor a 0.');
    httpMock.expectNone(`${environment.apiUrl}/price-rules`);
  });

  it('confirmDelete borra la regla y recarga la lista', () => {
    component.askDelete('r1');
    component.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/price-rules/r1`).flush(null);
    httpMock.expectOne(`${environment.apiUrl}/price-rules`).flush([]);

    expect(component.deleteId()).toBeNull();
    expect(component.successMessage()).toBe('Precio eliminado.');
  });
});
