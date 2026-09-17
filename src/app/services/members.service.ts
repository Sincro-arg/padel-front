import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PaymentMethod } from './payments.service';

export interface Member {
  id: string;
  name: string;
  phone: string;
  membershipFee: number;
  discountPercent: number;
  monthsOwed: number;
  isBlocked: boolean;
}

export interface MemberInput {
  name: string;
  phone: string;
  membershipFee: number;
  discountPercent: number;
}

export interface MemberPayment {
  id: string;
  memberId: string;
  month: number;
  year: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
}

export interface MemberPaymentInput {
  month: number;
  year: number;
  amount: number;
  paymentMethod: PaymentMethod;
}

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/members`;

  getMembers() {
    return this.http.get<Member[]>(this.base);
  }

  createMember(body: MemberInput) {
    return this.http.post<Member>(this.base, body);
  }

  updateMember(id: string, body: MemberInput) {
    return this.http.put<Member>(`${this.base}/${id}`, body);
  }

  deleteMember(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getPayments(memberId: string) {
    return this.http.get<MemberPayment[]>(`${this.base}/${memberId}/payments`);
  }

  createPayment(memberId: string, body: MemberPaymentInput) {
    return this.http.post<MemberPayment>(`${this.base}/${memberId}/payments`, body);
  }
}
