import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Court {
  id: string;
  name: string;
}

export interface CourtInput {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CourtsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/courts`;

  getCourts() {
    return this.http.get<Court[]>(this.base);
  }

  createCourt(body: CourtInput) {
    return this.http.post<Court>(this.base, body);
  }

  updateCourt(id: string, body: CourtInput) {
    return this.http.put<Court>(`${this.base}/${id}`, body);
  }

  deleteCourt(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
