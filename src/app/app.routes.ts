import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';
import { ownerGuard, coachGuard, clientGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  // Identity-first routes stay available even to a user who already has a
  // tenant session, so a pending request never blocks an active workspace.
  {
    path: 'identity',
    loadComponent: () =>
      import('./core/layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/identity-login/identity-login.component').then(m => m.IdentityLoginComponent),
        title: 'الدخول بالهوية - LogicFit'
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/identity-register/identity-register.component').then(m => m.IdentityRegisterComponent),
        title: 'إنشاء هوية - LogicFit'
      },
      {
        path: 'application-status',
        loadComponent: () =>
          import('./features/auth/pages/application-status/application-status.component').then(m => m.ApplicationStatusComponent),
        title: 'متابعة الطلب - LogicFit'
      }
    ]
  },

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

  // Tenant blocked (suspended / expired / archived) — no guard: a logged-out
  // blocked user must still be able to see the status screen.
  {
    path: 'gym-unavailable',
    loadComponent: () =>
      import('./features/tenant/gym-unavailable/gym-unavailable.component')
        .then(m => m.GymUnavailableComponent)
  },

  // Default redirect
  {
    path: '',
    redirectTo: 'identity/login',
    pathMatch: 'full'
  },

  // 404 - Redirect to login
  {
    path: '**',
    redirectTo: 'identity/login'
  }
];
