import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Court {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CourtsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/courts`;

  getCourts() {
    return this.http.get<Court[]>(this.base);
  }
}
