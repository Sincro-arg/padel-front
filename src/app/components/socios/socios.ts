import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PaymentMethod } from '../../services/payments.service';
import {
  Member,
  MemberPayment,
  MembersService,
} from '../../services/members.service';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Socios: listado con aviso visual de atrasados, alta/edición/baja (solo
 * admin) y registro de pago de cuota (ambos roles, igual que cobran una
 * reserva en Caja). Al seleccionar un socio se ve su historial de pagos.
 */
@Component({
  selector: 'app-socios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './socios.html',
  styleUrl: './socios.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Socios implements OnInit {
  private readonly service = inject(MembersService);
  private readonly auth = inject(AuthService);

  readonly isAdmin = computed(() => this.auth.isAdmin());
  readonly methods = PAYMENT_METHODS;
  readonly monthNames = MONTH_NAMES;

  readonly members = signal<Member[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  readonly selectedId = signal<string | null>(null);
  readonly selectedMember = computed(() => this.members().find(m => m.id === this.selectedId()) ?? null);

  readonly payments = signal<MemberPayment[]>([]);
  readonly loadingPayments = signal(false);
  readonly errorPayments = signal('');

  // Alta/edición de socio
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly fName = signal('');
  readonly fPhone = signal('');
  readonly fFee = signal(0);
  readonly fDiscount = signal(0);
  readonly fSubmitting = signal(false);
  readonly fError = signal('');

  readonly deleteId = signal<string | null>(null);
  readonly deleting = signal(false);

  // Registro de pago de cuota
  readonly showPaymentForm = signal(false);
  readonly pMonth = signal(new Date().getMonth() + 1);
  readonly pYear = signal(new Date().getFullYear());
  readonly pAmount = signal(0);
  readonly pMethod = signal<PaymentMethod>('efectivo');
  readonly pSubmitting = signal(false);
  readonly pError = signal('');

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
    this.service.getMembers().subscribe({
      next: list => {
        this.members.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los socios. Probá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  // ── Detalle / historial de pagos ─────────────────────────────────────
  selectMember(m: Member): void {
    this.selectedId.set(m.id);
    this.loadPayments();
  }

  closeDetail(): void {
    this.selectedId.set(null);
    this.payments.set([]);
  }

  loadPayments(): void {
    const id = this.selectedId();
    if (!id) return;
    this.loadingPayments.set(true);
    this.errorPayments.set('');
    this.service.getPayments(id).subscribe({
      next: list => {
        this.payments.set(list);
        this.loadingPayments.set(false);
      },
      error: () => {
        this.errorPayments.set('No se pudo cargar el historial de pagos. Probá de nuevo.');
        this.loadingPayments.set(false);
      },
    });
  }

  monthLabel(month: number): string {
    return this.monthNames[month - 1] ?? String(month);
  }

  // ── Alta / edición ────────────────────────────────────────────────
  openNew(): void {
    this.editingId.set(null);
    this.fName.set('');
    this.fPhone.set('');
    this.fFee.set(0);
    this.fDiscount.set(0);
    this.fError.set('');
    this.showForm.set(true);
  }

  openEdit(m: Member): void {
    this.editingId.set(m.id);
    this.fName.set(m.name);
    this.fPhone.set(m.phone);
    this.fFee.set(m.membershipFee);
    this.fDiscount.set(m.discountPercent);
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
    if (this.fFee() < 0) {
      this.fError.set('La cuota no puede ser negativa.');
      return;
    }
    if (this.fDiscount() < 0 || this.fDiscount() > 100) {
      this.fError.set('El descuento tiene que estar entre 0 y 100.');
      return;
    }

    const body = {
      name: this.fName().trim(),
      phone: this.fPhone().trim(),
      membershipFee: this.fFee(),
      discountPercent: this.fDiscount(),
    };
    const editId = this.editingId();

    this.fSubmitting.set(true);
    this.fError.set('');

    const req = editId ? this.service.updateMember(editId, body) : this.service.createMember(body);
    req.subscribe({
      next: () => {
        this.fSubmitting.set(false);
        this.showForm.set(false);
        this.flash(editId ? 'Socio actualizado.' : 'Socio creado.');
        this.load();
      },
      error: err => {
        this.fSubmitting.set(false);
        this.fError.set(err?.error?.error ?? 'No se pudo guardar el socio. Probá de nuevo.');
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
    this.service.deleteMember(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
        if (this.selectedId() === id) this.closeDetail();
        this.flash('Socio eliminado.');
        this.load();
      },
      error: () => {
        this.deleting.set(false);
        this.deleteId.set(null);
      },
    });
  }

  // ── Registro de pago de cuota ────────────────────────────────────────
  openPaymentForm(m: Member): void {
    this.selectedId.set(m.id);
    if (this.payments().length === 0) this.loadPayments();
    this.pMonth.set(new Date().getMonth() + 1);
    this.pYear.set(new Date().getFullYear());
    this.pAmount.set(Math.round(m.membershipFee * (1 - m.discountPercent / 100) * 100) / 100);
    this.pMethod.set('efectivo');
    this.pError.set('');
    this.showPaymentForm.set(true);
  }

  closePaymentForm(): void {
    if (this.pSubmitting()) return;
    this.showPaymentForm.set(false);
  }

  submitPayment(): void {
    const id = this.selectedId();
    if (!id) return;
    if (this.pMonth() < 1 || this.pMonth() > 12) {
      this.pError.set('El mes tiene que estar entre 1 y 12.');
      return;
    }
    if (this.pAmount() <= 0) {
      this.pError.set('El monto tiene que ser mayor a 0.');
      return;
    }

    this.pSubmitting.set(true);
    this.pError.set('');
    this.service
      .createPayment(id, {
        month: this.pMonth(),
        year: this.pYear(),
        amount: this.pAmount(),
        paymentMethod: this.pMethod(),
      })
      .subscribe({
        next: () => {
          this.pSubmitting.set(false);
          this.showPaymentForm.set(false);
          this.flash('Cuota cobrada.');
          this.load();
          this.loadPayments();
        },
        error: err => {
          this.pSubmitting.set(false);
          this.pError.set(err?.error?.error ?? 'No se pudo registrar el pago. Probá de nuevo.');
        },
      });
  }
}
