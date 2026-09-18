import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type DayType = 'weekday' | 'weekend';

export interface PriceRule {
  id: string;
  dayType: DayType;
  startHour: number;
  endHour: number;
  pricePerHour: number;
}

export interface PriceRuleInput {
  dayType: DayType;
  startHour: number;
  endHour: number;
  pricePerHour: number;
}

@Injectable({ providedIn: 'root' })
export class PriceRulesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/price-rules`;

  getPriceRules() {
    return this.http.get<PriceRule[]>(this.base);
  }

  createPriceRule(body: PriceRuleInput) {
    return this.http.post<PriceRule>(this.base, body);
  }

  updatePriceRule(id: string, body: PriceRuleInput) {
    return this.http.put<PriceRule>(`${this.base}/${id}`, body);
  }

  deletePriceRule(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
