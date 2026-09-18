import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Booking, BookingsService } from '../../services/bookings.service';
import {
  BookingPayment,
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
  private readonly bookingsApi = inject(BookingsService);
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

  // Corregir pagos de una reserva: buscador por fecha + modal de pagos
  readonly bookingsDate = signal(todayIso());
  readonly bookingsOfDay = signal<Booking[]>([]);
  readonly loadingBookings = signal(false);
  readonly errorBookings = signal('');

  readonly selectedBooking = signal<Booking | null>(null);
  readonly bookingPayments = signal<BookingPayment[]>([]);
  readonly loadingPayments = signal(false);
  readonly errorPayments = signal('');

  readonly editingPaymentId = signal<string | null>(null);
  readonly editAmount = signal(0);
  readonly editMethod = signal<PaymentMethod>('efectivo');
  readonly savingPayment = signal(false);
  readonly confirmDeleteId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDebts();
    if (this.isAdmin()) {
      this.loadSummary();
    }
    this.loadBookingsOfDay();
  }

  onBookingsDateChange(date: string): void {
    this.bookingsDate.set(date);
    this.loadBookingsOfDay();
  }

  loadBookingsOfDay(): void {
    this.loadingBookings.set(true);
    this.errorBookings.set('');
    this.bookingsApi.getBookings(this.bookingsDate()).subscribe({
      next: bookings => {
        this.bookingsOfDay.set(bookings);
        this.loadingBookings.set(false);
      },
      error: () => {
        this.errorBookings.set('No se pudieron cargar las reservas de esa fecha.');
        this.loadingBookings.set(false);
      },
    });
  }

  openBookingPayments(booking: Booking): void {
    this.selectedBooking.set(booking);
    this.editingPaymentId.set(null);
    this.confirmDeleteId.set(null);
    this.errorPayments.set('');
    this.loadingPayments.set(true);
    this.payments.getPayments(booking.id).subscribe({
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

  closeBookingPayments(): void {
    if (this.savingPayment()) return;
    this.selectedBooking.set(null);
    this.bookingPayments.set([]);
    this.editingPaymentId.set(null);
    this.confirmDeleteId.set(null);
  }

  startEditPayment(payment: BookingPayment): void {
    this.editingPaymentId.set(payment.id);
    this.editAmount.set(payment.amount);
    this.editMethod.set(payment.paymentMethod);
    this.errorPayments.set('');
  }

  cancelEditPayment(): void {
    this.editingPaymentId.set(null);
  }

  saveEditPayment(): void {
    const booking = this.selectedBooking();
    const paymentId = this.editingPaymentId();
    if (!booking || !paymentId || this.savingPayment()) return;

    if (!this.editAmount() || this.editAmount() <= 0) {
      this.errorPayments.set('El monto tiene que ser mayor a cero.');
      return;
    }

    this.savingPayment.set(true);
    this.errorPayments.set('');

    this.payments
      .editPayment(booking.id, paymentId, { amount: this.editAmount(), paymentMethod: this.editMethod() })
      .subscribe({
        next: () => {
          this.savingPayment.set(false);
          this.editingPaymentId.set(null);
          this.successMessage.set('Pago corregido.');
          this.openBookingPayments(booking);
          this.loadDebts();
          this.loadBookingsOfDay();
          if (this.isAdmin()) this.loadSummary();
          setTimeout(() => this.successMessage.set(''), 4000);
        },
        error: err => {
          this.savingPayment.set(false);
          this.errorPayments.set(err?.error?.error ?? 'No se pudo corregir el pago. Probá de nuevo.');
        },
      });
  }

  askDeletePayment(paymentId: string): void {
    this.confirmDeleteId.set(paymentId);
  }

  cancelDeletePayment(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDeletePayment(): void {
    const booking = this.selectedBooking();
    const paymentId = this.confirmDeleteId();
    if (!booking || !paymentId || this.savingPayment()) return;

    this.savingPayment.set(true);
    this.errorPayments.set('');

    this.payments.deletePayment(booking.id, paymentId).subscribe({
      next: () => {
        this.savingPayment.set(false);
        this.confirmDeleteId.set(null);
        this.successMessage.set('Pago borrado.');
        this.openBookingPayments(booking);
        this.loadDebts();
        this.loadBookingsOfDay();
        if (this.isAdmin()) this.loadSummary();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: err => {
        this.savingPayment.set(false);
        this.confirmDeleteId.set(null);
        this.errorPayments.set(err?.error?.error ?? 'No se pudo borrar el pago. Probá de nuevo.');
      },
    });
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
