import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type CourtStatus = 'occupied' | 'free';

export interface DashboardBooking {
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

export interface CourtToday {
  courtId: string;
  courtName: string;
  status: CourtStatus;
  currentBooking: DashboardBooking | null;
}

export interface MemberLate {
  id: string;
  name: string;
  monthsOwed: number;
}

export interface DashboardToday {
  courts: CourtToday[];
  todayBookings: DashboardBooking[];
  incomeToday: number;
  debtTotal: number;
  membersLate: MemberLate[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getToday() {
    return this.http.get<DashboardToday>(`${environment.apiUrl}/dashboard/today`);
  }
}
