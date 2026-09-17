import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Member {
  id: string;
  name: string;
  phone: string;
  membershipFee: number;
  discountPercent: number;
  monthsOwed: number;
  isBlocked: boolean;
}

@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/members`;

  getMembers() {
    return this.http.get<Member[]>(this.base);
  }
}
