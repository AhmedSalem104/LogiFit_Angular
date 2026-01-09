import { Routes } from '@angular/router';

export const ownerRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent),
    title: 'لوحة التحكم - LogicFit'
  },
  {
    path: 'clients',
    loadComponent: () =>
      import('./clients/clients-list.component').then(m => m.ClientsListComponent),
    title: 'العملاء - LogicFit'
  },
  {
    path: 'coaches',
    loadComponent: () =>
      import('./coaches/coaches-list.component').then(m => m.CoachesListComponent),
    title: 'المدربين - LogicFit'
  },
  {
    path: 'subscription-plans',
    loadComponent: () =>
      import('./subscription-plans/plans-list.component').then(m => m.PlansListComponent),
    title: 'خطط الاشتراك - LogicFit'
  },
  {
    path: 'subscriptions',
    loadComponent: () =>
      import('./subscriptions/subscriptions-list.component').then(m => m.SubscriptionsListComponent),
    title: 'الاشتراكات - LogicFit'
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports.component').then(m => m.ReportsComponent),
    title: 'التقارير - LogicFit'
  },
  {
    path: 'gym-settings',
    loadComponent: () =>
      import('./gym-settings/gym-settings.component').then(m => m.GymSettingsComponent),
    title: 'إعدادات الصالة - LogicFit'
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
