import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;
  let component: Footer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el año actual y el horario de la cancha', () => {
    const el = fixture.nativeElement;
    expect(el.querySelector('.ft__copy')?.textContent).toContain(String(new Date().getFullYear()));
    expect(el.querySelector('.ft__tip')?.textContent).toContain('8 a 24hs');
  });
});
