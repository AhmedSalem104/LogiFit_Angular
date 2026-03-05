import { Routes } from '@angular/router';

export const clientRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/client-dashboard.component').then(m => m.ClientDashboardComponent),
    title: 'لوحة التحكم'
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
    path: 'chat',
    loadComponent: () => import('./chat/client-chat.component').then(m => m.ClientChatComponent),
    title: 'المحادثات'
  },
  {
    path: 'challenges',
    loadComponent: () => import('./challenges/my-challenges.component').then(m => m.MyChallengesComponent),
    title: 'تحدياتي'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/my-profile.component').then(m => m.MyProfileComponent),
    title: 'ملفي الشخصي'
  }
];
