import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'تسجيل الدخول - LogicFit'
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent),
    title: 'إنشاء حساب - LogicFit'
  },
  {
    path: 'register-gym',
    loadComponent: () =>
      import('./pages/register-gym/register-gym.component').then(m => m.RegisterGymComponent),
    title: 'تسجيل صالة جديدة - LogicFit'
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'نسيت كلمة المرور - LogicFit'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
