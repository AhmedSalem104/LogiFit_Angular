import { Routes } from '@angular/router';

/** Legacy auth paths are compatibility redirects only; identity-first owns authentication. */
export const authRoutes: Routes = [
  { path: 'login', redirectTo: '/identity/login', pathMatch: 'full' },
  { path: 'register', redirectTo: '/identity/register', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: '/identity/reset-password', pathMatch: 'full' },
  { path: 'reset-password', redirectTo: '/identity/reset-password', pathMatch: 'full' },
  { path: 'register-gym', loadComponent: () => import('./pages/register-gym/register-gym.component').then(m => m.RegisterGymComponent) },
  { path: 'register-freelance', loadComponent: () => import('./pages/register-freelance/register-freelance.component').then(m => m.RegisterFreelanceComponent) },
  { path: '', redirectTo: '/identity/login', pathMatch: 'full' },
];
