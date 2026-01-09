import { Routes } from '@angular/router';

export const COACH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/coach-dashboard.component').then(m => m.CoachDashboardComponent),
    title: 'لوحة تحكم المدرب'
  },
  {
    path: 'trainees',
    loadComponent: () => import('./trainees/trainees-list.component').then(m => m.TraineesListComponent),
    title: 'المتدربين'
  },
  {
    path: 'trainees/:id',
    loadComponent: () => import('./trainees/trainee-details.component').then(m => m.TraineeDetailsComponent),
    title: 'تفاصيل المتدرب'
  },
  {
    path: 'workout-programs',
    loadComponent: () => import('./workout-programs/programs-list.component').then(m => m.ProgramsListComponent),
    title: 'برامج التمرين'
  },
  {
    path: 'workout-programs/create',
    loadComponent: () => import('./workout-programs/program-builder.component').then(m => m.ProgramBuilderComponent),
    title: 'إنشاء برنامج تمرين'
  },
  {
    path: 'workout-programs/:id/edit',
    loadComponent: () => import('./workout-programs/program-builder.component').then(m => m.ProgramBuilderComponent),
    title: 'تعديل برنامج التمرين'
  },
  {
    path: 'diet-plans',
    loadComponent: () => import('./diet-plans/diet-plans-list.component').then(m => m.DietPlansListComponent),
    title: 'خطط التغذية'
  },
  {
    path: 'diet-plans/create',
    loadComponent: () => import('./diet-plans/diet-plan-builder.component').then(m => m.DietPlanBuilderComponent),
    title: 'إنشاء خطة تغذية'
  },
  {
    path: 'diet-plans/:id/edit',
    loadComponent: () => import('./diet-plans/diet-plan-builder.component').then(m => m.DietPlanBuilderComponent),
    title: 'تعديل خطة التغذية'
  },
  {
    path: 'exercises',
    loadComponent: () => import('./exercises/exercises-library.component').then(m => m.ExercisesLibraryComponent),
    title: 'مكتبة التمارين'
  },
  {
    path: 'foods',
    loadComponent: () => import('./foods/foods-database.component').then(m => m.FoodsDatabaseComponent),
    title: 'قاعدة بيانات الأطعمة'
  },
  {
    path: 'muscles',
    loadComponent: () => import('./muscles/muscles-list.component').then(m => m.MusclesListComponent),
    title: 'العضلات'
  },
  {
    path: 'measurements',
    loadComponent: () => import('./measurements/measurements-list.component').then(m => m.MeasurementsListComponent),
    title: 'قياسات الجسم'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/coach-profile.component').then(m => m.CoachProfileComponent),
    title: 'الملف الشخصي'
  }
];
