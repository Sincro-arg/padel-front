import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
  { path: '**', redirectTo: '' },
];
