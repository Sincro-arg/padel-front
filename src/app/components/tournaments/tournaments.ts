import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaymentMethod } from '../../services/payments.service';
import { Match, Pair, Tournament, TournamentsService } from '../../services/tournaments.service';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
];

/**
 * Torneos: alta de torneo, inscripción de parejas, armado de fixture (alta
 * de partidos por ronda) y carga de resultados. Pantalla admin-only.
 */
@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tournaments.html',
  styleUrl: './tournaments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tournaments implements OnInit {
  private readonly service = inject(TournamentsService);

  readonly methods = PAYMENT_METHODS;

  readonly tournaments = signal<Tournament[]>([]);
  readonly loadingTournaments = signal(false);
  readonly errorTournaments = signal('');

  readonly selectedId = signal<string | null>(null);
  readonly selectedTournament = computed(
    () => this.tournaments().find(t => t.id === this.selectedId()) ?? null,
  );

  readonly pairs = signal<Pair[]>([]);
  readonly loadingPairs = signal(false);
  readonly errorPairs = signal('');

  readonly matches = signal<Match[]>([]);
  readonly loadingMatches = signal(false);
  readonly errorMatches = signal('');

  readonly successMessage = signal('');

  // Alta/edición de torneo
  readonly showTournamentForm = signal(false);
  readonly editingTournamentId = signal<string | null>(null);
  readonly tName = signal('');
  readonly tDate = signal('');
  readonly tFee = signal(0);
  readonly tSubmitting = signal(false);
  readonly tError = signal('');

  readonly deleteTournamentId = signal<string | null>(null);
  readonly deletingTournament = signal(false);

  // Inscripción de pareja
  readonly showPairForm = signal(false);
  readonly pPlayer1 = signal('');
  readonly pPlayer2 = signal('');
  readonly pPaid = signal(false);
  readonly pMethod = signal<PaymentMethod>('efectivo');
  readonly pSubmitting = signal(false);
  readonly pError = signal('');

  readonly deletePairId = signal<string | null>(null);
  readonly deletingPair = signal(false);

  // Alta de partido (fixture)
  readonly showMatchForm = signal(false);
  readonly mRound = signal('');
  readonly mPair1Id = signal('');
  readonly mPair2Id = signal('');
  readonly mSubmitting = signal(false);
  readonly mError = signal('');

  // Carga de resultado
  readonly resultMatchId = signal<string | null>(null);
  readonly resultMatch = computed(() => this.matches().find(m => m.id === this.resultMatchId()) ?? null);
  readonly rScore = signal('');
  readonly rWinnerPairId = signal('');
  readonly rSubmitting = signal(false);
  readonly rError = signal('');

  ngOnInit(): void {
    this.loadTournaments();
  }

  private flash(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  pairName(pairId: string): string {
    const p = this.pairs().find(x => x.id === pairId);
    return p ? `${p.player1} / ${p.player2}` : '—';
  }

  // ── Torneos ─────────────────────────────────────────────────────────
  loadTournaments(): void {
    this.loadingTournaments.set(true);
    this.errorTournaments.set('');
    this.service.getTournaments().subscribe({
      next: list => {
        this.tournaments.set(list);
        this.loadingTournaments.set(false);
      },
      error: () => {
        this.errorTournaments.set('No se pudieron cargar los torneos. Probá de nuevo.');
        this.loadingTournaments.set(false);
      },
    });
  }

  selectTournament(t: Tournament): void {
    this.selectedId.set(t.id);
    this.loadPairs();
    this.loadMatches();
  }

  closeDetail(): void {
    this.selectedId.set(null);
    this.pairs.set([]);
    this.matches.set([]);
  }

  loadPairs(): void {
    const id = this.selectedId();
    if (!id) return;
    this.loadingPairs.set(true);
    this.errorPairs.set('');
    this.service.getPairs(id).subscribe({
      next: list => {
        this.pairs.set(list);
        this.loadingPairs.set(false);
      },
      error: () => {
        this.errorPairs.set('No se pudieron cargar las parejas. Probá de nuevo.');
        this.loadingPairs.set(false);
      },
    });
  }

  loadMatches(): void {
    const id = this.selectedId();
    if (!id) return;
    this.loadingMatches.set(true);
    this.errorMatches.set('');
    this.service.getMatches(id).subscribe({
      next: list => {
        this.matches.set(list);
        this.loadingMatches.set(false);
      },
      error: () => {
        this.errorMatches.set('No se pudo cargar el fixture. Probá de nuevo.');
        this.loadingMatches.set(false);
      },
    });
  }

  openNewTournament(): void {
    this.editingTournamentId.set(null);
    this.tName.set('');
    this.tDate.set('');
    this.tFee.set(0);
    this.tError.set('');
    this.showTournamentForm.set(true);
  }

  openEditTournament(t: Tournament): void {
    this.editingTournamentId.set(t.id);
    this.tName.set(t.name);
    this.tDate.set(t.date);
    this.tFee.set(t.registrationFee);
    this.tError.set('');
    this.showTournamentForm.set(true);
  }

  closeTournamentForm(): void {
    if (this.tSubmitting()) return;
    this.showTournamentForm.set(false);
  }

  submitTournament(): void {
    if (!this.tName().trim() || !this.tDate()) {
      this.tError.set('Completá el nombre y la fecha.');
      return;
    }
    if (this.tFee() < 0) {
      this.tError.set('La inscripción no puede ser negativa.');
      return;
    }

    const body = { name: this.tName().trim(), date: this.tDate(), registrationFee: this.tFee() };
    const editId = this.editingTournamentId();

    this.tSubmitting.set(true);
    this.tError.set('');

    const req = editId ? this.service.updateTournament(editId, body) : this.service.createTournament(body);
    req.subscribe({
      next: () => {
        this.tSubmitting.set(false);
        this.showTournamentForm.set(false);
        this.flash(editId ? 'Torneo actualizado.' : 'Torneo creado.');
        this.loadTournaments();
      },
      error: err => {
        this.tSubmitting.set(false);
        this.tError.set(err?.error?.error ?? 'No se pudo guardar el torneo. Probá de nuevo.');
      },
    });
  }

  askDeleteTournament(id: string): void {
    this.deleteTournamentId.set(id);
  }

  cancelDeleteTournament(): void {
    this.deleteTournamentId.set(null);
  }

  confirmDeleteTournament(): void {
    const id = this.deleteTournamentId();
    if (!id || this.deletingTournament()) return;
    this.deletingTournament.set(true);
    this.service.deleteTournament(id).subscribe({
      next: () => {
        this.deletingTournament.set(false);
        this.deleteTournamentId.set(null);
        if (this.selectedId() === id) this.closeDetail();
        this.flash('Torneo eliminado.');
        this.loadTournaments();
      },
      error: () => {
        this.deletingTournament.set(false);
        this.deleteTournamentId.set(null);
      },
    });
  }

  // ── Parejas ─────────────────────────────────────────────────────────
  openPairForm(): void {
    this.pPlayer1.set('');
    this.pPlayer2.set('');
    this.pPaid.set(false);
    this.pMethod.set('efectivo');
    this.pError.set('');
    this.showPairForm.set(true);
  }

  closePairForm(): void {
    if (this.pSubmitting()) return;
    this.showPairForm.set(false);
  }

  submitPair(): void {
    const id = this.selectedId();
    if (!id) return;
    if (!this.pPlayer1().trim() || !this.pPlayer2().trim()) {
      this.pError.set('Completá los dos jugadores.');
      return;
    }

    const body = {
      player1: this.pPlayer1().trim(),
      player2: this.pPlayer2().trim(),
      paid: this.pPaid(),
      ...(this.pPaid() ? { paymentMethod: this.pMethod() } : {}),
    };

    this.pSubmitting.set(true);
    this.pError.set('');
    this.service.createPair(id, body).subscribe({
      next: () => {
        this.pSubmitting.set(false);
        this.showPairForm.set(false);
        this.flash('Pareja inscripta.');
        this.loadPairs();
      },
      error: err => {
        this.pSubmitting.set(false);
        this.pError.set(err?.error?.error ?? 'No se pudo inscribir la pareja. Probá de nuevo.');
      },
    });
  }

  askDeletePair(id: string): void {
    this.deletePairId.set(id);
  }

  cancelDeletePair(): void {
    this.deletePairId.set(null);
  }

  confirmDeletePair(): void {
    const id = this.deletePairId();
    if (!id || this.deletingPair()) return;
    this.deletingPair.set(true);
    this.service.deletePair(id).subscribe({
      next: () => {
        this.deletingPair.set(false);
        this.deletePairId.set(null);
        this.flash('Pareja eliminada.');
        this.loadPairs();
      },
      error: () => {
        this.deletingPair.set(false);
        this.deletePairId.set(null);
      },
    });
  }

  // ── Fixture / partidos ──────────────────────────────────────────────
  openMatchForm(): void {
    this.mRound.set('');
    this.mPair1Id.set('');
    this.mPair2Id.set('');
    this.mError.set('');
    this.showMatchForm.set(true);
  }

  closeMatchForm(): void {
    if (this.mSubmitting()) return;
    this.showMatchForm.set(false);
  }

  submitMatch(): void {
    const id = this.selectedId();
    if (!id) return;
    if (!this.mRound().trim() || !this.mPair1Id() || !this.mPair2Id()) {
      this.mError.set('Completá la ronda y las dos parejas.');
      return;
    }
    if (this.mPair1Id() === this.mPair2Id()) {
      this.mError.set('Las dos parejas del partido tienen que ser distintas.');
      return;
    }

    this.mSubmitting.set(true);
    this.mError.set('');
    this.service
      .createMatch(id, { round: this.mRound().trim(), pair1Id: this.mPair1Id(), pair2Id: this.mPair2Id() })
      .subscribe({
        next: () => {
          this.mSubmitting.set(false);
          this.showMatchForm.set(false);
          this.flash('Partido agregado al fixture.');
          this.loadMatches();
        },
        error: err => {
          this.mSubmitting.set(false);
          this.mError.set(err?.error?.error ?? 'No se pudo agregar el partido. Probá de nuevo.');
        },
      });
  }

  openResult(match: Match): void {
    this.resultMatchId.set(match.id);
    this.rScore.set(match.score ?? '');
    this.rWinnerPairId.set(match.winnerPairId ?? '');
    this.rError.set('');
  }

  closeResult(): void {
    if (this.rSubmitting()) return;
    this.resultMatchId.set(null);
  }

  submitResult(): void {
    const match = this.resultMatch();
    if (!match) return;
    if (!this.rScore().trim() || !this.rWinnerPairId()) {
      this.rError.set('Completá el resultado y el ganador.');
      return;
    }

    this.rSubmitting.set(true);
    this.rError.set('');
    this.service
      .updateMatchResult(match.id, { score: this.rScore().trim(), winnerPairId: this.rWinnerPairId() })
      .subscribe({
        next: () => {
          this.rSubmitting.set(false);
          this.resultMatchId.set(null);
          this.flash('Resultado cargado.');
          this.loadMatches();
        },
        error: err => {
          this.rSubmitting.set(false);
          this.rError.set(err?.error?.error ?? 'No se pudo cargar el resultado. Probá de nuevo.');
        },
      });
  }
}
