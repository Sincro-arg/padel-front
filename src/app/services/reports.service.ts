import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface HourOccupancy {
  hour: number;
  occupancyRate: number;
}

export interface TopCustomer {
  name: string;
  totalSpent: number;
  bookingsCount: number;
}

export interface MonthlyReport {
  totalRevenue: number;
  byHour: HourOccupancy[];
  topCustomers: TopCustomer[];
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);

  getMonthly(year: number, month: number) {
    return this.http.get<MonthlyReport>(`${environment.apiUrl}/reports/monthly`, {
      params: { year: String(year), month: String(month).padStart(2, '0') },
    });
  }
}
