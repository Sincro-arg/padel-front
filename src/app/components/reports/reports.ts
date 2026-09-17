import { ChangeDetectionStrategy, Component, OnInit, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonthlyReport, ReportsService } from '../../services/reports.service';

/**
 * Reportes mensuales (solo admin): facturación del mes, ocupación por
 * horario (barras, para decidir si bajar el precio de la mañana) y mejores
 * clientes.
 */
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports implements OnInit {
  private readonly reports = inject(ReportsService);

  readonly year = signal(new Date().getFullYear());
  readonly month = signal(new Date().getMonth() + 1);

  readonly data = signal<MonthlyReport | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly maxOccupancy = computed(() => {
    const rates = this.data()?.byHour.map(h => h.occupancyRate) ?? [];
    return Math.max(1, ...rates);
  });

  ngOnInit(): void {
    this.load();
  }

  barHeight(rate: number): string {
    const max = this.maxOccupancy();
    return `${Math.round((rate / max) * 100)}%`;
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.reports.getMonthly(this.year(), this.month()).subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte. Probá de nuevo.');
        this.loading.set(false);
      },
    });
  }
}
