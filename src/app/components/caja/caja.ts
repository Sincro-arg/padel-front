import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Booking, BookingsService } from '../../services/bookings.service';
import {
  BookingPaymentRecord,
  Debt,
  PaymentMethod,
  PaymentsService,
  PaymentsSummary,
} from '../../services/payments.service';

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
  private readonly bookings = inject(BookingsService);
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

  // Reservas cobradas hoy, para poder corregir un pago ya registrado
  readonly todayBookings = signal<Booking[]>([]);
  readonly loadingBookings = signal(false);
  readonly errorBookings = signal('');
  readonly bookingsWithPayments = computed(() => this.todayBookings().filter(b => b.paidAmount > 0));

  readonly expandedBookingId = signal<string | null>(null);
  readonly bookingPayments = signal<BookingPaymentRecord[]>([]);
  readonly loadingPayments = signal(false);
  readonly errorPayments = signal('');

  // Edición de un pago ya registrado
  readonly editingPayment = signal<BookingPaymentRecord | null>(null);
  readonly editAmount = signal(0);
  readonly editMethod = signal<PaymentMethod>('efectivo');
  readonly editSubmitting = signal(false);
  readonly editError = signal('');

  // Borrado de un pago ya registrado
  readonly deletingPaymentId = signal<string | null>(null);
  readonly deleteSubmitting = signal(false);
  readonly deleteError = signal('');

  ngOnInit(): void {
    this.loadDebts();
    this.loadTodayBookings();
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
          this.refreshAfterPaymentChange(debt.bookingId);
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: err => {
          this.paySubmitting.set(false);
          this.confirming.set(false);
          this.payError.set(err?.error?.error ?? 'No se pudo registrar el pago. Probá de nuevo.');
        },
      });
  }

  loadTodayBookings(): void {
    this.loadingBookings.set(true);
    this.errorBookings.set('');
    this.bookings.getBookings(todayIso()).subscribe({
      next: list => {
        this.todayBookings.set(list);
        this.loadingBookings.set(false);
      },
      error: () => {
        this.errorBookings.set('No se pudieron cargar las reservas de hoy.');
        this.loadingBookings.set(false);
      },
    });
  }

  togglePayments(booking: Booking): void {
    if (this.expandedBookingId() === booking.id) {
      this.expandedBookingId.set(null);
      this.bookingPayments.set([]);
      return;
    }

    this.expandedBookingId.set(booking.id);
    this.bookingPayments.set([]);
    this.loadingPayments.set(true);
    this.errorPayments.set('');

    this.payments.getBookingPayments(booking.id).subscribe({
      next: list => {
        this.bookingPayments.set(list);
        this.loadingPayments.set(false);
      },
      error: () => {
        this.errorPayments.set('No se pudieron cargar los pagos de esta reserva.');
        this.loadingPayments.set(false);
      },
    });
  }

  private refreshAfterPaymentChange(bookingId: string): void {
    this.loadTodayBookings();
    this.loadDebts();
    if (this.isAdmin()) this.loadSummary();
    if (this.expandedBookingId() === bookingId) {
      this.payments.getBookingPayments(bookingId).subscribe(list => this.bookingPayments.set(list));
    }
  }

  openEditPayment(payment: BookingPaymentRecord): void {
    this.editingPayment.set(payment);
    this.editAmount.set(payment.amount);
    this.editMethod.set(payment.paymentMethod);
    this.editError.set('');
  }

  closeEditPayment(): void {
    if (this.editSubmitting()) return;
    this.editingPayment.set(null);
    this.editError.set('');
  }

  confirmEditPayment(): void {
    const payment = this.editingPayment();
    if (!payment || this.editSubmitting()) return;

    if (!this.editAmount() || this.editAmount() <= 0) {
      this.editError.set('El monto tiene que ser mayor a cero.');
      return;
    }

    this.editSubmitting.set(true);
    this.editError.set('');

    this.payments
      .editBookingPayment(payment.bookingId, payment.id, {
        amount: this.editAmount(),
        paymentMethod: this.editMethod(),
      })
      .subscribe({
        next: () => {
          this.editSubmitting.set(false);
          this.editingPayment.set(null);
          this.successMessage.set('Pago corregido.');
          this.refreshAfterPaymentChange(payment.bookingId);
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: err => {
          this.editSubmitting.set(false);
          this.editError.set(err?.error?.error ?? 'No se pudo corregir el pago. Probá de nuevo.');
        },
      });
  }

  askDeletePayment(payment: BookingPaymentRecord): void {
    this.deletingPaymentId.set(payment.id);
    this.deleteError.set('');
  }

  cancelDeletePayment(): void {
    this.deletingPaymentId.set(null);
    this.deleteError.set('');
  }

  confirmDeletePayment(payment: BookingPaymentRecord): void {
    if (this.deleteSubmitting()) return;

    this.deleteSubmitting.set(true);
    this.deleteError.set('');

    this.payments.deleteBookingPayment(payment.bookingId, payment.id).subscribe({
      next: () => {
        this.deleteSubmitting.set(false);
        this.deletingPaymentId.set(null);
        this.successMessage.set('Pago borrado.');
        this.refreshAfterPaymentChange(payment.bookingId);
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: err => {
        this.deleteSubmitting.set(false);
        this.deleteError.set(err?.error?.error ?? 'No se pudo borrar el pago. Probá de nuevo.');
      },
    });
  }
}
