import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Debt, PaymentMethod, PaymentsService, PaymentsSummary } from '../../services/payments.service';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Caja: lista de deudas para cobrar (ambos roles) + resumen del día por
 * medio de pago (solo admin — el empleado no ve el total facturado).
 */
@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './caja.html',
  styleUrl: './caja.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Caja implements OnInit {
  private readonly payments = inject(PaymentsService);
  private readonly auth = inject(AuthService);

  readonly isAdmin = computed(() => this.auth.isAdmin());
  readonly methods = PAYMENT_METHODS;

  readonly debts = signal<Debt[]>([]);
  readonly loadingDebts = signal(false);
  readonly errorDebts = signal('');

  readonly summary = signal<PaymentsSummary | null>(null);
  readonly loadingSummary = signal(false);
  readonly errorSummary = signal('');

  readonly successMessage = signal('');

  // Modal de cobro
  readonly selectedDebt = signal<Debt | null>(null);
  readonly payAmount = signal(0);
  readonly payMethod = signal<PaymentMethod>('efectivo');
  readonly confirming = signal(false);
  readonly paySubmitting = signal(false);
  readonly payError = signal('');

  ngOnInit(): void {
    this.loadDebts();
    if (this.isAdmin()) {
      this.loadSummary();
    }
  }

  loadDebts(): void {
    this.loadingDebts.set(true);
    this.errorDebts.set('');
    this.payments.getDebts().subscribe({
      next: debts => {
        this.debts.set(debts);
        this.loadingDebts.set(false);
      },
      error: () => {
        this.errorDebts.set('No se pudieron cargar las deudas. Probá de nuevo.');
        this.loadingDebts.set(false);
      },
    });
  }

  loadSummary(): void {
    this.loadingSummary.set(true);
    this.errorSummary.set('');
    this.payments.getSummary(todayIso()).subscribe({
      next: summary => {
        this.summary.set(summary);
        this.loadingSummary.set(false);
      },
      error: () => {
        this.errorSummary.set('No se pudo cargar el resumen del día.');
        this.loadingSummary.set(false);
      },
    });
  }

  openPay(debt: Debt): void {
    this.selectedDebt.set(debt);
    this.payAmount.set(debt.amountDue);
    this.payMethod.set('efectivo');
    this.confirming.set(false);
    this.payError.set('');
  }

  closeModal(): void {
    if (this.paySubmitting()) return;
    this.selectedDebt.set(null);
    this.confirming.set(false);
    this.payError.set('');
  }

  askConfirm(): void {
    if (!this.payAmount() || this.payAmount() <= 0) {
      this.payError.set('El monto tiene que ser mayor a cero.');
      return;
    }
    this.payError.set('');
    this.confirming.set(true);
  }

  backToEdit(): void {
    this.confirming.set(false);
  }

  confirmPay(): void {
    const debt = this.selectedDebt();
    if (!debt || this.paySubmitting()) return;

    this.paySubmitting.set(true);
    this.payError.set('');

    this.payments
      .payBooking(debt.bookingId, { amount: this.payAmount(), paymentMethod: this.payMethod() })
      .subscribe({
        next: () => {
          const amount = this.payAmount();
          const name = debt.customerName;
          this.paySubmitting.set(false);
          this.selectedDebt.set(null);
          this.confirming.set(false);
          this.successMessage.set(`Pago de $${amount} registrado para ${name}.`);
          this.loadDebts();
          if (this.isAdmin()) this.loadSummary();
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: err => {
          this.paySubmitting.set(false);
          this.confirming.set(false);
          this.payError.set(err?.error?.error ?? 'No se pudo registrar el pago. Probá de nuevo.');
        },
      });
  }
}
