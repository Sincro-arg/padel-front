import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DayType, PriceRule, PriceRulesService } from '../../services/price-rules.service';

const DAY_TYPE_LABEL: Record<DayType, string> = {
  weekday: 'Día de semana',
  weekend: 'Fin de semana',
};

/**
 * Precios: alta, edición y baja de reglas de precio por franja horaria
 * y tipo de día. Ruta admin-only (roleGuard('admin') en app.routes.ts):
 * el empleado no ve precios, solo el dueño los administra.
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

  readonly dayTypeLabel = DAY_TYPE_LABEL;

  readonly rules = signal<PriceRule[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

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
    const startHour = Number(this.fStartHour());
    const endHour = Number(this.fEndHour());
    const pricePerHour = Number(this.fPricePerHour());

    if (startHour < 8 || startHour > 24 || endHour < 8 || endHour > 24) {
      this.fError.set('Las horas deben estar entre 8 y 24.');
      return;
    }
    if (startHour >= endHour) {
      this.fError.set('La hora de inicio debe ser menor a la de fin.');
      return;
    }
    if (pricePerHour <= 0) {
      this.fError.set('El precio por hora debe ser mayor a 0.');
      return;
    }

    const body = { dayType: this.fDayType(), startHour, endHour, pricePerHour };
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
