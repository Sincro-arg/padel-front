import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startHour: number;
  endHour: number;
  memberId: string | null;
  status: 'confirmed' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  cancellationFee: number;
  isRecurring: boolean;
  recurringBookingId: string | null;
}

export interface BookingInput {
  courtId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startHour: number;
  endHour: number;
  memberId?: string;
}

export type BookingEditInput = Omit<BookingInput, 'memberId'>;

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookings`;

  getBookings(date: string) {
    return this.http.get<Booking[]>(this.base, { params: { date } });
  }

  createBooking(body: BookingInput) {
    return this.http.post<Booking>(this.base, body);
  }

  updateBooking(id: string, body: BookingEditInput) {
    return this.http.put<Booking>(`${this.base}/${id}`, body);
  }

  cancelBooking(id: string) {
    return this.http.post<Booking>(`${this.base}/${id}/cancel`, {});
  }

  deleteBooking(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
