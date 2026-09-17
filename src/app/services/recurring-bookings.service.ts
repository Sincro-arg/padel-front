import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** weekday: 0=domingo … 6=sábado */
export interface RecurringBooking {
  id: string;
  courtId: string;
  customerName: string;
  customerPhone: string;
  weekday: number;
  startHour: number;
  endHour: number;
  memberId: string | null;
}

export interface RecurringBookingInput {
  courtId: string;
  customerName: string;
  customerPhone: string;
  weekday: number;
  startHour: number;
  endHour: number;
  memberId?: string;
}

@Injectable({ providedIn: 'root' })
export class RecurringBookingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/recurring-bookings`;

  getRecurringBookings() {
    return this.http.get<RecurringBooking[]>(this.base);
  }

  createRecurringBooking(body: RecurringBookingInput) {
    return this.http.post<RecurringBooking>(this.base, body);
  }

  deleteRecurringBooking(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
