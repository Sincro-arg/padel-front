import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(m => m.Home),
    canActivate: [authGuard],
  },
  {
    path: 'reservas',
    loadComponent: () => import('./components/reservas/reservas').then(m => m.Reservas),
    canActivate: [authGuard],
  },
  {
    path: 'caja',
    loadComponent: () => import('./components/caja/caja').then(m => m.Caja),
    canActivate: [authGuard],
  },
  {
    path: 'socios',
    loadComponent: () => import('./components/socios/socios').then(m => m.Socios),
    canActivate: [authGuard],
  },
  {
    path: 'canchas',
    loadComponent: () => import('./components/canchas/canchas').then(m => m.Canchas),
    canActivate: [authGuard, roleGuard('admin')],
  },
  {
    path: 'torneos',
    loadComponent: () => import('./components/tournaments/tournaments').then(m => m.Tournaments),
    canActivate: [authGuard, roleGuard('admin')],
  },
  {
    path: 'reportes',
    loadComponent: () => import('./components/reports/reports').then(m => m.Reports),
    canActivate: [authGuard, roleGuard('admin')],
  },
  { path: '**', redirectTo: '' },
];
