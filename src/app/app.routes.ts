import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';
import { ownerGuard, coachGuard, clientGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  // Auth Routes (Guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./core/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.authRoutes)
  },

  // Owner Routes
  {
    path: 'owner',
    canActivate: [authGuard, ownerGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    loadChildren: () =>
      import('./features/owner/owner.routes').then(m => m.ownerRoutes)
  },

  // Coach Routes
  {
    path: 'coach',
    canActivate: [authGuard, coachGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    loadChildren: () =>
      import('./features/coach/coach.routes').then(m => m.COACH_ROUTES)
  },

  // Client Routes
  {
    path: 'client',
    canActivate: [authGuard, clientGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    loadChildren: () =>
      import('./features/client/client.routes').then(m => m.clientRoutes)
  },

  // Default redirect
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },

  // 404 - Redirect to login
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
