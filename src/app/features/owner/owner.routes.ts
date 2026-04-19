import { Routes } from '@angular/router';

export const ownerRoutes: Routes = [
  // Main
  { path: 'dashboard', loadComponent: () => import('./dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent), title: 'لوحة التحكم - LogicFit' },
  { path: 'operations', loadComponent: () => import('./operations-dashboard/operations-dashboard.component').then(m => m.OperationsDashboardComponent), title: 'لوحة التشغيل - LogicFit' },

  // Members
  { path: 'clients', loadComponent: () => import('./clients/clients-list.component').then(m => m.ClientsListComponent), title: 'العملاء - LogicFit' },
  { path: 'coaches', loadComponent: () => import('./coaches/coaches-list.component').then(m => m.CoachesListComponent), title: 'المدربين - LogicFit' },
  { path: 'membership-cards', loadComponent: () => import('./membership-cards/membership-cards.component').then(m => m.MembershipCardsComponent), title: 'بطاقات العضوية' },
  { path: 'gate-access', loadComponent: () => import('./gate-access/gate-access.component').then(m => m.GateAccessComponent), title: 'البوابة' },

  // Subscriptions
  { path: 'subscription-plans', loadComponent: () => import('./subscription-plans/plans-list.component').then(m => m.PlansListComponent), title: 'خطط الاشتراك' },
  { path: 'subscriptions', loadComponent: () => import('./subscriptions/subscriptions-list.component').then(m => m.SubscriptionsListComponent), title: 'الاشتراكات' },
  { path: 'attendance', loadComponent: () => import('./attendance/attendance.component').then(m => m.AttendanceComponent), title: 'الحضور' },

  // Facilities
  { path: 'branches', loadComponent: () => import('./branches/branches-list.component').then(m => m.BranchesListComponent), title: 'الفروع' },
  { path: 'rooms', loadComponent: () => import('./rooms/rooms-list.component').then(m => m.RoomsListComponent), title: 'القاعات' },
  { path: 'equipment', loadComponent: () => import('./equipment/equipment-list.component').then(m => m.EquipmentListComponent), title: 'الأجهزة' },
  { path: 'maintenance', loadComponent: () => import('./maintenance/maintenance-list.component').then(m => m.MaintenanceListComponent), title: 'الصيانة' },

  // Classes
  { path: 'group-classes', loadComponent: () => import('./group-classes/group-classes.component').then(m => m.GroupClassesComponent), title: 'الحصص الجماعية' },
  { path: 'class-schedules', loadComponent: () => import('./class-schedules/class-schedules.component').then(m => m.ClassSchedulesComponent), title: 'جدولة الحصص' },

  // Finance
  { path: 'invoices', loadComponent: () => import('./invoices/invoices-list.component').then(m => m.InvoicesListComponent), title: 'الفواتير' },
  { path: 'payments', loadComponent: () => import('./payments/payments-list.component').then(m => m.PaymentsListComponent), title: 'المدفوعات' },
  { path: 'expenses', loadComponent: () => import('./expenses/expenses-list.component').then(m => m.ExpensesListComponent), title: 'المصروفات' },
  { path: 'expense-categories', loadComponent: () => import('./expense-categories/expense-categories.component').then(m => m.ExpenseCategoriesComponent), title: 'فئات المصروفات' },
  { path: 'coupons', loadComponent: () => import('./coupons/coupons-list.component').then(m => m.CouponsListComponent), title: 'الكوبونات' },
  { path: 'tax-settings', loadComponent: () => import('./tax-settings/tax-settings.component').then(m => m.TaxSettingsComponent), title: 'الضرائب' },

  // Inventory & POS
  { path: 'pos-sales', loadComponent: () => import('./pos-sales/pos-sales.component').then(m => m.PosSalesComponent), title: 'نقطة البيع' },
  { path: 'products', loadComponent: () => import('./products/products-list.component').then(m => m.ProductsListComponent), title: 'المنتجات' },
  { path: 'product-categories', loadComponent: () => import('./product-categories/product-categories.component').then(m => m.ProductCategoriesComponent), title: 'فئات المنتجات' },
  { path: 'stock', loadComponent: () => import('./stock/stock.component').then(m => m.StockComponent), title: 'المخزون' },
  { path: 'suppliers', loadComponent: () => import('./suppliers/suppliers-list.component').then(m => m.SuppliersListComponent), title: 'الموردين' },

  // HR / Payroll
  { path: 'employees', loadComponent: () => import('./employees/employees-list.component').then(m => m.EmployeesListComponent), title: 'الموظفين' },
  { path: 'shifts', loadComponent: () => import('./shifts/shifts.component').then(m => m.ShiftsComponent), title: 'الورديات' },
  { path: 'leaves', loadComponent: () => import('./leaves/leaves-list.component').then(m => m.LeavesListComponent), title: 'الإجازات' },
  { path: 'commissions', loadComponent: () => import('./commissions/commissions.component').then(m => m.CommissionsComponent), title: 'العمولات' },
  { path: 'payroll', loadComponent: () => import('./payroll/payroll.component').then(m => m.PayrollComponent), title: 'الرواتب' },

  // Reports
  { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent), title: 'التقارير' },
  { path: 'operations-reports', loadComponent: () => import('./operations-dashboard/operations-reports.component').then(m => m.OperationsReportsComponent), title: 'التقارير التشغيلية' },

  // Settings
  { path: 'gym-settings', loadComponent: () => import('./gym-settings/gym-settings.component').then(m => m.GymSettingsComponent), title: 'إعدادات الصالة' },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
