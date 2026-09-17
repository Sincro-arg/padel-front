import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Booking, BookingInput, BookingsService } from '../../services/bookings.service';
import { RecurringBookingsService } from '../../services/recurring-bookings.service';
import { Court, CourtsService } from '../../services/courts.service';
import { Member, MembersService } from '../../services/members.service';

/** Cancha abre a las 8 y cierra a las 24 → bloques de 1hs, último arranca a las 23. */
const HOURS: number[] = Array.from({ length: 16 }, (_, i) => i + 8);

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Parseo manual para evitar el desfasaje de huso horario de `new Date('YYYY-MM-DD')`. */
function weekdayOf(dateIso: string): number {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * Agenda de reservas: grilla de horarios por cancha para un día, alta de
 * turno (simple o fijo semanal), edición y cancelación/eliminación con
 * confirmación. Pantalla principal para cargar un turno desde el celular.
 */
@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reservas.html',
  styleUrl: './reservas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reservas implements OnInit {
  private readonly bookingsSvc = inject(BookingsService);
  private readonly recurringSvc = inject(RecurringBookingsService);
  private readonly courtsSvc = inject(CourtsService);
  private readonly membersSvc = inject(MembersService);

  readonly hours = HOURS;

  readonly date = signal(todayIso());
  readonly courts = signal<Court[]>([]);
  readonly bookings = signal<Booking[]>([]);
  readonly members = signal<Member[]>([]);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');

  /** courtId -> hora -> reserva confirmada que ocupa esa hora. */
  readonly grid = computed(() => {
    const map = new Map<string, Map<number, Booking>>();
    for (const c of this.courts()) map.set(c.id, new Map());
    for (const b of this.bookings()) {
      if (b.status !== 'confirmed') continue;
      const col = map.get(b.courtId);
      if (!col) continue;
      for (let h = b.startHour; h < b.endHour; h++) col.set(h, b);
    }
    return map;
  });

  cellBooking(courtId: string, hour: number): Booking | null {
    return this.grid().get(courtId)?.get(hour) ?? null;
  }

  isCellStart(booking: Booking, hour: number): boolean {
    return booking.startHour === hour;
  }

  // ── Form (alta/edición) ─────────────────────────────────────────────
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly fCourtId = signal('');
  readonly fCustomerName = signal('');
  readonly fCustomerPhone = signal('');
  readonly fDate = signal('');
  readonly fStartHour = signal(8);
  readonly fEndHour = signal(9);
  readonly fMemberId = signal('');
  readonly fRecurring = signal(false);
  readonly fSubmitting = signal(false);
  readonly fError = signal('');

  readonly selectedMember = computed(() => this.members().find(m => m.id === this.fMemberId()) ?? null);

  // ── Detalle / cancelación / borrado ──────────────────────────────────
  readonly detailBooking = signal<Booking | null>(null);
  readonly cancelConfirming = signal(false);
  readonly cancelSubmitting = signal(false);
  readonly deleteConfirming = signal(false);
  readonly deleteSubmitting = signal(false);
  readonly detailError = signal('');

  ngOnInit(): void {
    this.courtsSvc.getCourts().subscribe({ next: c => this.courts.set(c) });
    this.membersSvc.getMembers().subscribe({ next: m => this.members.set(m) });
    this.load();
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.bookingsSvc.getBookings(this.date()).subscribe({
      next: list => {
        this.bookings.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las reservas. Probá de nuevo.');
        this.loading.set(false);
      },
    });
  }

  changeDate(value: string): void {
    this.date.set(value);
    this.load();
  }

  memberLabel(m: Member): string {
    return m.isBlocked ? `${m.name} (debe ${m.monthsOwed} cuotas)` : m.name;
  }

  // ── Alta ──────────────────────────────────────────────────────────
  openNew(courtId?: string, hour?: number): void {
    this.editingId.set(null);
    this.fCourtId.set(courtId ?? this.courts()[0]?.id ?? '');
    this.fCustomerName.set('');
    this.fCustomerPhone.set('');
    this.fDate.set(this.date());
    this.fStartHour.set(hour ?? 8);
    this.fEndHour.set((hour ?? 8) + 1);
    this.fMemberId.set('');
    this.fRecurring.set(false);
    this.fError.set('');
    this.showForm.set(true);
  }

  openEdit(booking: Booking): void {
    this.editingId.set(booking.id);
    this.fCourtId.set(booking.courtId);
    this.fCustomerName.set(booking.customerName);
    this.fCustomerPhone.set(booking.customerPhone);
    this.fDate.set(booking.date);
    this.fStartHour.set(booking.startHour);
    this.fEndHour.set(booking.endHour);
    this.fMemberId.set(booking.memberId ?? '');
    this.fRecurring.set(false);
    this.fError.set('');
    this.showForm.set(true);
    this.detailBooking.set(null);
  }

  closeForm(): void {
    if (this.fSubmitting()) return;
    this.showForm.set(false);
  }

  submitForm(): void {
    if (!this.fCourtId()) {
      this.fError.set('Elegí una cancha.');
      return;
    }
    if (!this.fCustomerName().trim()) {
      this.fError.set('Completá el nombre.');
      return;
    }
    if (!this.fDate()) {
      this.fError.set('Elegí la fecha.');
      return;
    }
    if (this.fEndHour() <= this.fStartHour()) {
      this.fError.set('La hora de fin tiene que ser posterior a la de inicio.');
      return;
    }
    if (this.selectedMember()?.isBlocked) {
      this.fError.set('El socio debe 2 o más cuotas y no puede reservar hasta ponerse al día.');
      return;
    }

    const editId = this.editingId();

    if (editId) {
      this.fSubmitting.set(true);
      this.fError.set('');
      this.bookingsSvc
        .updateBooking(editId, {
          courtId: this.fCourtId(),
          customerName: this.fCustomerName().trim(),
          customerPhone: this.fCustomerPhone().trim(),
          date: this.fDate(),
          startHour: this.fStartHour(),
          endHour: this.fEndHour(),
        })
        .subscribe({
          next: () => {
            this.fSubmitting.set(false);
            this.showForm.set(false);
            this.flash('Reserva actualizada.');
            this.load();
          },
          error: err => {
            this.fSubmitting.set(false);
            this.fError.set(err?.error?.error ?? 'No se pudo guardar la reserva. Probá de nuevo.');
          },
        });
      return;
    }

    const body: BookingInput = {
      courtId: this.fCourtId(),
      customerName: this.fCustomerName().trim(),
      customerPhone: this.fCustomerPhone().trim(),
      date: this.fDate(),
      startHour: this.fStartHour(),
      endHour: this.fEndHour(),
      ...(this.fMemberId() ? { memberId: this.fMemberId() } : {}),
    };

    this.fSubmitting.set(true);
    this.fError.set('');

    if (this.fRecurring()) {
      this.recurringSvc
        .createRecurringBooking({
          courtId: body.courtId,
          customerName: body.customerName,
          customerPhone: body.customerPhone,
          weekday: weekdayOf(body.date),
          startHour: body.startHour,
          endHour: body.endHour,
          ...(body.memberId ? { memberId: body.memberId } : {}),
        })
        .subscribe({
          next: () => {
            this.fSubmitting.set(false);
            this.showForm.set(false);
            this.flash('Turno fijo creado: se generaron las próximas 8 semanas.');
            this.load();
          },
          error: err => {
            this.fSubmitting.set(false);
            this.fError.set(err?.error?.error ?? 'No se pudo crear el turno fijo. Probá de nuevo.');
          },
        });
      return;
    }

    this.bookingsSvc.createBooking(body).subscribe({
      next: () => {
        this.fSubmitting.set(false);
        this.showForm.set(false);
        this.flash('Reserva creada.');
        this.load();
      },
      error: err => {
        this.fSubmitting.set(false);
        this.fError.set(err?.error?.error ?? 'No se pudo crear la reserva. Probá de nuevo.');
      },
    });
  }

  // ── Detalle / cancelación / borrado ──────────────────────────────────
  openDetail(booking: Booking): void {
    this.detailBooking.set(booking);
    this.cancelConfirming.set(false);
    this.deleteConfirming.set(false);
    this.detailError.set('');
  }

  closeDetail(): void {
    if (this.cancelSubmitting() || this.deleteSubmitting()) return;
    this.detailBooking.set(null);
    this.cancelConfirming.set(false);
    this.deleteConfirming.set(false);
  }

  askCancel(): void {
    this.cancelConfirming.set(true);
  }

  cancelCancelConfirm(): void {
    this.cancelConfirming.set(false);
  }

  confirmCancel(): void {
    const b = this.detailBooking();
    if (!b || this.cancelSubmitting()) return;
    this.cancelSubmitting.set(true);
    this.detailError.set('');
    this.bookingsSvc.cancelBooking(b.id).subscribe({
      next: () => {
        this.cancelSubmitting.set(false);
        this.detailBooking.set(null);
        this.flash('Reserva cancelada.');
        this.load();
      },
      error: err => {
        this.cancelSubmitting.set(false);
        this.detailError.set(err?.error?.error ?? 'No se pudo cancelar la reserva.');
      },
    });
  }

  askDelete(): void {
    this.deleteConfirming.set(true);
  }

  cancelDeleteConfirm(): void {
    this.deleteConfirming.set(false);
  }

  confirmDelete(): void {
    const b = this.detailBooking();
    if (!b || this.deleteSubmitting()) return;
    this.deleteSubmitting.set(true);
    this.detailError.set('');
    this.bookingsSvc.deleteBooking(b.id).subscribe({
      next: () => {
        this.deleteSubmitting.set(false);
        this.detailBooking.set(null);
        this.flash('Reserva eliminada.');
        this.load();
      },
      error: err => {
        this.deleteSubmitting.set(false);
        this.detailError.set(err?.error?.error ?? 'No se pudo eliminar la reserva.');
      },
    });
  }
}
