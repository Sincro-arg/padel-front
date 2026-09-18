import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DayType, PriceRule, PriceRulesService } from '../../services/price-rules.service';

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'weekday', label: 'Días de semana' },
  { value: 'weekend', label: 'Fin de semana' },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 8); // 8..24

/**
 * Precios: alta, edición y baja de las franjas horarias con su tarifa
 * (price-rules). Ruta admin-only (roleGuard('admin') en app.routes.ts)
 * porque son los precios del negocio; el resto de la app no los consulta
 * directamente, es el dueño el único que los necesita cambiar.
 */
@Component({
  selector: 'app-precios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './precios.html',
  styleUrl: './precios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Precios implements OnInit {
  private readonly service = inject(PriceRulesService);

  readonly dayTypes = DAY_TYPES;
  readonly hours = HOURS;

  readonly rules = signal<PriceRule[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  readonly weekdayRules = computed(() =>
    this.rules()
      .filter(r => r.dayType === 'weekday')
      .sort((a, b) => a.startHour - b.startHour),
  );
  readonly weekendRules = computed(() =>
    this.rules()
      .filter(r => r.dayType === 'weekend')
      .sort((a, b) => a.startHour - b.startHour),
  );

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly fDayType = signal<DayType>('weekday');
  readonly fStartHour = signal(8);
  readonly fEndHour = signal(9);
  readonly fPricePerHour = signal(0);
  readonly fSubmitting = signal(false);
  readonly fError = signal('');

  readonly deleteId = signal<string | null>(null);
  readonly deleting = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  dayTypeLabel(dayType: DayType): string {
    return this.dayTypes.find(d => d.value === dayType)?.label ?? dayType;
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.getPriceRules().subscribe({
      next: list => {
        this.rules.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los precios. Probá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  openNew(): void {
    this.editingId.set(null);
    this.fDayType.set('weekday');
    this.fStartHour.set(8);
    this.fEndHour.set(9);
    this.fPricePerHour.set(0);
    this.fError.set('');
    this.showForm.set(true);
  }

  openEdit(r: PriceRule): void {
    this.editingId.set(r.id);
    this.fDayType.set(r.dayType);
    this.fStartHour.set(r.startHour);
    this.fEndHour.set(r.endHour);
    this.fPricePerHour.set(r.pricePerHour);
    this.fError.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    if (this.fSubmitting()) return;
    this.showForm.set(false);
  }

  submitForm(): void {
    if (this.fEndHour() <= this.fStartHour()) {
      this.fError.set('La hora de fin tiene que ser mayor a la de inicio.');
      return;
    }
    if (this.fPricePerHour() <= 0) {
      this.fError.set('El precio tiene que ser mayor a 0.');
      return;
    }

    const body = {
      dayType: this.fDayType(),
      startHour: this.fStartHour(),
      endHour: this.fEndHour(),
      pricePerHour: this.fPricePerHour(),
    };
    const editId = this.editingId();

    this.fSubmitting.set(true);
    this.fError.set('');

    const req = editId ? this.service.updatePriceRule(editId, body) : this.service.createPriceRule(body);
    req.subscribe({
      next: () => {
        this.fSubmitting.set(false);
        this.showForm.set(false);
        this.flash(editId ? 'Precio actualizado.' : 'Precio creado.');
        this.load();
      },
      error: err => {
        this.fSubmitting.set(false);
        this.fError.set(err?.error?.error ?? 'No se pudo guardar el precio. Probá de nuevo.');
      },
    });
  }

  askDelete(id: string): void {
    this.deleteId.set(id);
  }

  cancelDelete(): void {
    this.deleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.deleteId();
    if (!id || this.deleting()) return;
    this.deleting.set(true);
    this.service.deletePriceRule(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
        this.flash('Precio eliminado.');
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
      },
    });
  }
}
