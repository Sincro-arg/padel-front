import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PaymentMethod } from './payments.service';

export interface Tournament {
  id: string;
  name: string;
  date: string;
  registrationFee: number;
}

export interface Pair {
  id: string;
  tournamentId: string;
  player1: string;
  player2: string;
  paid: boolean;
  paymentMethod?: PaymentMethod;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: string;
  pair1Id: string;
  pair2Id: string;
  score: string | null;
  winnerPairId: string | null;
}

@Injectable({ providedIn: 'root' })
export class TournamentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tournaments`;

  getTournaments() {
    return this.http.get<Tournament[]>(this.base);
  }

  createTournament(body: { name: string; date: string; registrationFee: number }) {
    return this.http.post<Tournament>(this.base, body);
  }

  updateTournament(id: string, body: { name: string; date: string; registrationFee: number }) {
    return this.http.put<Tournament>(`${this.base}/${id}`, body);
  }

  deleteTournament(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getPairs(tournamentId: string) {
    return this.http.get<Pair[]>(`${this.base}/${tournamentId}/pairs`);
  }

  createPair(
    tournamentId: string,
    body: { player1: string; player2: string; paid: boolean; paymentMethod?: PaymentMethod },
  ) {
    return this.http.post<Pair>(`${this.base}/${tournamentId}/pairs`, body);
  }

  deletePair(pairId: string) {
    return this.http.delete<void>(`${environment.apiUrl}/tournaments/pairs/${pairId}`);
  }

  getMatches(tournamentId: string) {
    return this.http.get<Match[]>(`${this.base}/${tournamentId}/matches`);
  }

  createMatch(tournamentId: string, body: { round: string; pair1Id: string; pair2Id: string }) {
    return this.http.post<Match>(`${this.base}/${tournamentId}/matches`, body);
  }

  updateMatchResult(matchId: string, body: { score: string; winnerPairId: string }) {
    return this.http.put<Match>(`${environment.apiUrl}/tournaments/matches/${matchId}/result`, body);
  }
}
