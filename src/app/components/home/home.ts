import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardToday } from '../../services/dashboard.service';

/**
 * Dashboard de inicio: canchas ocupadas/libres ahora, turnos de hoy, plata
 * entrada y deuda total (estos dos solo admin) y socios atrasados.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);

  readonly user = computed(() => this.auth.currentUser());
  readonly isAdmin = computed(() => this.auth.isAdmin());

  readonly data = signal<DashboardToday | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.dashboard.getToday().subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el inicio. Probá de nuevo.');
        this.loading.set(false);
      },
    });
  }
}
