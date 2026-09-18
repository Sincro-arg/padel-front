import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Canchas } from './canchas';
import { Court } from '../../services/courts.service';
import { environment } from '../../../environments/environment';

const COURT: Court = { id: 'c1', name: 'Cancha 1' };

describe('Canchas', () => {
  let component: Canchas;
  let fixture: ComponentFixture<Canchas>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Canchas],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Canchas);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('al iniciar carga las canchas', () => {
    component.ngOnInit();
    httpMock.expectOne(`${environment.apiUrl}/courts`).flush([COURT]);
    expect(component.courts()).toEqual([COURT]);
  });

  it('load informa un error si falla la carga', () => {
    component.load();
    httpMock.expectOne(`${environment.apiUrl}/courts`).error(new ProgressEvent('error'));
    expect(component.error()).toBe('No se pudieron cargar las canchas. Probá de nuevo.');
    expect(component.loading()).toBeFalse();
  });

  it('openNew limpia el formulario y openEdit lo precarga', () => {
    component.openNew();
    expect(component.editingId()).toBeNull();
    expect(component.fName()).toBe('');
    expect(component.showForm()).toBeTrue();

    component.openEdit(COURT);
    expect(component.editingId()).toBe('c1');
    expect(component.fName()).toBe('Cancha 1');
  });

  it('submitForm exige un nombre', () => {
    component.openNew();
    component.fName.set('   ');
    component.submitForm();

    expect(component.fError()).toBe('Completá el nombre.');
    httpMock.expectNone(`${environment.apiUrl}/courts`);
  });

  it('submitForm crea una cancha y recarga la lista', () => {
    component.openNew();
    component.fName.set('Cancha 2');
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/courts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Cancha 2' });
    req.flush({ id: 'c2', name: 'Cancha 2' });

    httpMock.expectOne(`${environment.apiUrl}/courts`).flush([COURT]);

    expect(component.showForm()).toBeFalse();
    expect(component.successMessage()).toBe('Cancha creada.');
  });

  it('submitForm edita una cancha existente con PUT', () => {
    component.openEdit(COURT);
    component.fName.set('Cancha 1 remodelada');
    component.submitForm();

    const req = httpMock.expectOne(`${environment.apiUrl}/courts/c1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Cancha 1 remodelada' });
    req.flush({ id: 'c1', name: 'Cancha 1 remodelada' });

    httpMock.expectOne(`${environment.apiUrl}/courts`).flush([]);
    expect(component.successMessage()).toBe('Cancha actualizada.');
  });

  it('un error del back se muestra en el formulario', () => {
    component.openNew();
    component.fName.set('Cancha 2');
    component.submitForm();

    httpMock
      .expectOne(`${environment.apiUrl}/courts`)
      .flush({ error: 'Ya existe una cancha con ese nombre' }, { status: 400, statusText: 'Bad Request' });

    expect(component.fError()).toBe('Ya existe una cancha con ese nombre');
    expect(component.fSubmitting()).toBeFalse();
  });

  it('askDelete / cancelDelete manejan la confirmación', () => {
    component.askDelete('c1');
    expect(component.deleteId()).toBe('c1');
    component.cancelDelete();
    expect(component.deleteId()).toBeNull();
  });

  it('confirmDelete borra la cancha y recarga la lista', () => {
    component.askDelete('c1');
    component.confirmDelete();

    httpMock.expectOne(`${environment.apiUrl}/courts/c1`).flush(null);
    httpMock.expectOne(`${environment.apiUrl}/courts`).flush([]);

    expect(component.deleteId()).toBeNull();
    expect(component.successMessage()).toBe('Cancha eliminada.');
  });
});
