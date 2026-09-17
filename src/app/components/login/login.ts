import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BackendStatusService } from '../../services/backend-status.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly backendStatus = inject(BackendStatusService);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.loading()) return;

    const u = this.username.trim();
    const p = this.password;
    if (!u || !p) {
      this.error.set('Ingresá usuario y contraseña.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(u, p).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.auth.landingRoute(), { replaceUrl: true });
      },
      error: err => {
        this.loading.set(false);
        if (err.status === 0) {
          this.error.set('No se pudo conectar con el servidor. Probá de nuevo en un momento.');
          return;
        }
        this.error.set(err?.error?.error ?? 'Usuario o contraseña incorrectos.');
      },
    });
  }
}
