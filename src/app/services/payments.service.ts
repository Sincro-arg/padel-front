import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

export interface Debt {
  bookingId: string;
  customerName: string;
  date: string;
  startHour: number;
  amountDue: number;
}

export interface PaymentsSummary {
  date: string;
  total: number;
  cash: number;
  transfer: number;
  card: number;
  debtTotal: number;
}

export interface BookingPaymentResult {
  id: string;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  totalAmount: number;
}

export interface BookingPaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);

  getDebts() {
    return this.http.get<Debt[]>(`${environment.apiUrl}/payments/debts`);
  }

  getSummary(date: string) {
    return this.http.get<PaymentsSummary>(`${environment.apiUrl}/payments/summary`, {
      params: { date },
    });
  }

  payBooking(bookingId: string, body: { amount: number; paymentMethod: PaymentMethod }) {
    return this.http.post<BookingPaymentResult>(
      `${environment.apiUrl}/bookings/${bookingId}/payments`,
      body,
    );
  }

  getBookingPayments(bookingId: string) {
    return this.http.get<BookingPaymentRecord[]>(
      `${environment.apiUrl}/bookings/${bookingId}/payments`,
    );
  }

  editBookingPayment(
    bookingId: string,
    paymentId: string,
    body: { amount: number; paymentMethod: PaymentMethod },
  ) {
    return this.http.put<BookingPaymentResult>(
      `${environment.apiUrl}/bookings/${bookingId}/payments/${paymentId}`,
      body,
    );
  }

  deleteBookingPayment(bookingId: string, paymentId: string) {
    return this.http.delete<BookingPaymentResult>(
      `${environment.apiUrl}/bookings/${bookingId}/payments/${paymentId}`,
    );
  }
}
