import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

/**
 * Placeholder de aterrizaje tras el login. Las pantallas reales (agenda del
 * día, caja, etc.) se cuelgan de esta misma ruta '' en tareas siguientes.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly auth = inject(AuthService);
  readonly user = computed(() => this.auth.currentUser());
}
