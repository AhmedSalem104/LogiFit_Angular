import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';
import { ownerGuard, coachGuard, clientGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  { path: 'identity', loadComponent: () => import('./core/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent), children: [
    { path: 'login', loadComponent: () => import('./features/auth/pages/identity-login/identity-login.component').then(m => m.IdentityLoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/pages/identity-register/identity-register.component').then(m => m.IdentityRegisterComponent) },
    { path: 'verify-email', loadComponent: () => import('./features/auth/pages/identity-email-verification/identity-email-verification.component').then(m => m.IdentityEmailVerificationComponent) },
    { path: 'reset-password', loadComponent: () => import('./features/auth/pages/identity-password-reset/identity-password-reset.component').then(m => m.IdentityPasswordResetComponent) },
    { path: 'application-status', loadComponent: () => import('./features/auth/pages/application-status/application-status.component').then(m => m.ApplicationStatusComponent) },
    { path: 'accept-invite', loadComponent: () => import('./features/auth/pages/identity-join/identity-join.component').then(m => m.IdentityJoinComponent), data: { mode: 'invite' } },
    { path: 'join-client', loadComponent: () => import('./features/auth/pages/identity-join/identity-join.component').then(m => m.IdentityJoinComponent), data: { mode: 'client' } },
  ] },
  { path: 'auth', canActivate: [guestGuard], loadComponent: () => import('./core/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent), loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes) },
  { path: 'owner', canActivate: [authGuard, ownerGuard], loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent), loadChildren: () => import('./features/owner/owner.routes').then(m => m.ownerRoutes) },
  { path: 'coach', canActivate: [authGuard, coachGuard], loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent), loadChildren: () => import('./features/coach/coach.routes').then(m => m.COACH_ROUTES) },
  { path: 'client', canActivate: [authGuard, clientGuard], loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent), loadChildren: () => import('./features/client/client.routes').then(m => m.clientRoutes) },
  { path: 'gym-unavailable', loadComponent: () => import('./features/tenant/gym-unavailable/gym-unavailable.component').then(m => m.GymUnavailableComponent) },
  { path: '', redirectTo: 'identity/login', pathMatch: 'full' },
  { path: '**', redirectTo: 'identity/login' },
];
