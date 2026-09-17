import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Court, CourtsService } from '../../services/courts.service';

/**
 * Canchas: alta, edición y baja. Ruta admin-only (roleGuard('admin') en
 * app.routes.ts) porque son los datos que arma el dueño antes de operar;
 * el GET que usa el resto de la app (reservas, caja) sigue siendo público
 * para cualquier rol logueado vía CourtsService.getCourts().
 */
@Component({
  selector: 'app-canchas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './canchas.html',
  styleUrl: './canchas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Canchas implements OnInit {
  private readonly service = inject(CourtsService);

  readonly courts = signal<Court[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly fName = signal('');
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
    this.service.getCourts().subscribe({
      next: list => {
        this.courts.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las canchas. Probá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  openNew(): void {
    this.editingId.set(null);
    this.fName.set('');
    this.fError.set('');
    this.showForm.set(true);
  }

  openEdit(c: Court): void {
    this.editingId.set(c.id);
    this.fName.set(c.name);
    this.fError.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    if (this.fSubmitting()) return;
    this.showForm.set(false);
  }

  submitForm(): void {
    if (!this.fName().trim()) {
      this.fError.set('Completá el nombre.');
      return;
    }

    const body = { name: this.fName().trim() };
    const editId = this.editingId();

    this.fSubmitting.set(true);
    this.fError.set('');

    const req = editId ? this.service.updateCourt(editId, body) : this.service.createCourt(body);
    req.subscribe({
      next: () => {
        this.fSubmitting.set(false);
        this.showForm.set(false);
        this.flash(editId ? 'Cancha actualizada.' : 'Cancha creada.');
        this.load();
      },
      error: err => {
        this.fSubmitting.set(false);
        this.fError.set(err?.error?.error ?? 'No se pudo guardar la cancha. Probá de nuevo.');
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
    this.service.deleteCourt(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
        this.flash('Cancha eliminada.');
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
      },
    });
  }
}
