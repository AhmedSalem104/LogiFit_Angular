import { Routes } from '@angular/router';

export const clientRoutes: Routes = [
  {
    path: '',
    redirectTo: 'my-program',
    pathMatch: 'full'
  },
  {
    path: 'my-program',
    loadComponent: () => import('./workout/my-program.component').then(m => m.MyProgramComponent),
    title: 'برنامجي التدريبي'
  },
  {
    path: 'workout-session',
    loadComponent: () => import('./workout/workout-session.component').then(m => m.WorkoutSessionComponent),
    title: 'جلسة التمرين'
  },
  {
    path: 'my-diet',
    loadComponent: () => import('./diet/my-diet.component').then(m => m.MyDietComponent),
    title: 'خطتي الغذائية'
  },
  {
    path: 'meal-log',
    loadComponent: () => import('./diet/meal-log.component').then(m => m.MealLogComponent),
    title: 'سجل الوجبات'
  },
  {
    path: 'my-measurements',
    loadComponent: () => import('./measurements/my-measurements.component').then(m => m.MyMeasurementsComponent),
    title: 'قياساتي'
  },
  {
    path: 'my-progress',
    loadComponent: () => import('./progress/my-progress.component').then(m => m.MyProgressComponent),
    title: 'تقدمي'
  },
  {
    path: 'my-subscriptions',
    loadComponent: () => import('./subscriptions/my-subscriptions.component').then(m => m.MySubscriptionsComponent),
    title: 'اشتراكاتي'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/my-profile.component').then(m => m.MyProfileComponent),
    title: 'ملفي الشخصي'
  }
];
