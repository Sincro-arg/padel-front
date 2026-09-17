import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/** Roles de sistema. Nunca agregar strings sueltos — usar solo estos dos. */
export type UserRole = 'admin' | 'empleado';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'padel_token';
const USER_KEY = 'padel_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly currentUser = signal<AuthUser | null>(AuthService.loadUser());

  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  private static loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }),
      );
  }

  hasRole(...roles: UserRole[]): boolean {
    const r = this.currentUser()?.role;
    return !!r && roles.includes(r);
  }

  /** Ruta a la que se manda a cada rol tras loguearse. Ambos aterrizan en el
   *  mismo lugar por ahora — se ajusta cuando existan las pantallas de reservas. */
  landingRoute(): string {
    return '/';
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }
}
