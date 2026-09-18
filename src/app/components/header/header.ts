import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  empleado: 'Empleado',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = computed(() => this.auth.currentUser());
  readonly roleLabel = computed(() => ROLE_LABEL[this.user()?.role ?? ''] ?? '');
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  readonly menuOpen = signal(false);

  readonly now = signal(new Date());

  readonly date = computed(() =>
    this.now().toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
  );
  readonly time = computed(() =>
    this.now().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  );

  ngOnInit(): void {
    const id = setInterval(() => this.now.set(new Date()), 1000 * 15);
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  logout(): void {
    this.auth.logout();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
