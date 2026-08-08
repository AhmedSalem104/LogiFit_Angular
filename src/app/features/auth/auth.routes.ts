import { Routes } from '@angular/router';

/** Legacy auth paths are compatibility redirects only; identity-first owns authentication. */
export const authRoutes: Routes = [
  { path: 'login', redirectTo: '/identity/login', pathMatch: 'full' },
  { path: 'register', redirectTo: '/identity/register', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: '/identity/reset-password', pathMatch: 'full' },
  { path: 'reset-password', redirectTo: '/identity/reset-password', pathMatch: 'full' },
  { path: 'register-workspace', data: { workspaceType: 2 }, loadComponent: () => import('./pages/register-workspace/register-workspace.component').then(m => m.RegisterWorkspaceComponent) },
  { path: 'register-gym', data: { workspaceType: 1 }, loadComponent: () => import('./pages/register-workspace/register-workspace.component').then(m => m.RegisterWorkspaceComponent) },
  { path: 'register-freelance', data: { workspaceType: 2 }, loadComponent: () => import('./pages/register-workspace/register-workspace.component').then(m => m.RegisterWorkspaceComponent) },
  { path: '', redirectTo: '/identity/login', pathMatch: 'full' },
];
