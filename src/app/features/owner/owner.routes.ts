import { Routes } from '@angular/router';
import { featureGuard } from '../../core/auth/guards/feature.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { Permissions } from '../../core/auth/models/auth.models';
import { freelanceWorkspaceGuard } from '../../core/auth/guards/freelance-workspace.guard';
import { FeatureHubComponent, GYM_FINANCE_HUB, GYM_MANAGEMENT_HUB } from '../../shared/components/feature-hub/feature-hub.component';

export const ownerRoutes: Routes = [
  // Main
  { path: 'dashboard', canActivate: [permissionGuard(Permissions.ViewReports)], loadComponent: () => import('./dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent), title: 'لوحة التحكم - LogicFit' },
  { path: 'profile', loadComponent: () => import('./profile/owner-profile.component').then(m => m.OwnerProfileComponent), title: 'الملف الشخصي - LogicFit' },
  // TOP-GYM has one dashboard tab. Keep the legacy URL recoverable without
  // exposing a second dashboard screen in the product navigation.
  { path: 'operations', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'management', canActivate: [permissionGuard(Permissions.ViewMembers)], component: FeatureHubComponent, data: { hub: GYM_MANAGEMENT_HUB }, title: 'إدارة الجيم - LogicFit' },
  { path: 'finance', canActivate: [permissionGuard(Permissions.ManageFinance)], component: FeatureHubComponent, data: { hub: GYM_FINANCE_HUB }, title: 'المالية والاشتراكات - LogicFit' },

  // Members
  { path: 'clients/:id', canActivate: [permissionGuard(Permissions.ViewMembers)], loadComponent: () => import('./clients/client-details.component').then(m => m.ClientDetailsComponent), title: 'Client details' },
  { path: 'coaches/:id', canActivate: [permissionGuard(Permissions.ManageCoaches)], loadComponent: () => import('./coaches/coach-details.component').then(m => m.CoachDetailsComponent), title: 'Coach details' },
  { path: 'clients', canActivate: [permissionGuard(Permissions.ViewMembers)], loadComponent: () => import('./clients/clients-list.component').then(m => m.ClientsListComponent), title: 'العملاء - LogicFit' },
  { path: 'coaches', canActivate: [permissionGuard(Permissions.ManageCoaches)], loadComponent: () => import('./coaches/coaches-list.component').then(m => m.CoachesListComponent), title: 'المدربين - LogicFit' },
  { path: 'freelance-team', canActivate: [freelanceWorkspaceGuard, permissionGuard(Permissions.ManageCoaches)], loadComponent: () => import('./freelance-team/freelance-team.component').then(m => m.FreelanceTeamComponent), title: 'فريق المدرب الحر - LogicFit' },
  { path: 'membership-cards', canActivate: [permissionGuard(Permissions.ManageMembers)], loadComponent: () => import('./membership-cards/membership-cards.component').then(m => m.MembershipCardsComponent), title: 'بطاقات العضوية' },
  { path: 'gate-access', canActivate: [permissionGuard(Permissions.ManageAttendance)], loadComponent: () => import('./gate-access/gate-access.component').then(m => m.GateAccessComponent), title: 'البوابة' },

  // Subscriptions
  { path: 'subscription-plans', canActivate: [permissionGuard(Permissions.ManageClientSubscriptions)], loadComponent: () => import('./subscription-plans/plans-list.component').then(m => m.PlansListComponent), title: 'خطط الاشتراك' },
  { path: 'subscriptions', canActivate: [permissionGuard(Permissions.ManageClientSubscriptions)], loadComponent: () => import('./subscriptions/subscriptions-list.component').then(m => m.SubscriptionsListComponent), title: 'الاشتراكات' },
  { path: 'attendance', canActivate: [permissionGuard(Permissions.ManageAttendance)], loadComponent: () => import('./attendance/attendance.component').then(m => m.AttendanceComponent), title: 'الحضور' },

  // Facilities
  { path: 'branches', canActivate: [permissionGuard(Permissions.ManageBranches)], loadComponent: () => import('./branches/branches-list.component').then(m => m.BranchesListComponent), title: 'الفروع' },
  { path: 'rooms', canActivate: [permissionGuard(Permissions.ManageBranches)], loadComponent: () => import('./rooms/rooms-list.component').then(m => m.RoomsListComponent), title: 'القاعات' },
  { path: 'equipment', canActivate: [permissionGuard(Permissions.ManageBranches)], loadComponent: () => import('./equipment/equipment-list.component').then(m => m.EquipmentListComponent), title: 'الأجهزة' },
  { path: 'maintenance', canActivate: [permissionGuard(Permissions.ManageBranches)], loadComponent: () => import('./maintenance/maintenance-list.component').then(m => m.MaintenanceListComponent), title: 'الصيانة' },

  // Classes
  { path: 'group-classes', canActivate: [permissionGuard(Permissions.ManageBranches)], loadComponent: () => import('./group-classes/group-classes.component').then(m => m.GroupClassesComponent), title: 'الحصص الجماعية' },
  { path: 'class-schedules', canActivate: [permissionGuard(Permissions.ManageBranches)], loadComponent: () => import('./class-schedules/class-schedules.component').then(m => m.ClassSchedulesComponent), title: 'جدولة الحصص' },

  // Finance
  { path: 'invoices', canActivate: [permissionGuard(Permissions.ManageFinance)], loadComponent: () => import('./invoices/invoices-list.component').then(m => m.InvoicesListComponent), title: 'الفواتير' },
  { path: 'payments', canActivate: [permissionGuard(Permissions.ManageFinance)], loadComponent: () => import('./payments/payments-list.component').then(m => m.PaymentsListComponent), title: 'المدفوعات' },
  { path: 'expenses', canActivate: [permissionGuard(Permissions.ManageFinance)], loadComponent: () => import('./expenses/expenses-list.component').then(m => m.ExpensesListComponent), title: 'المصروفات' },
  { path: 'expense-categories', canActivate: [permissionGuard(Permissions.ManageFinance)], loadComponent: () => import('./expense-categories/expense-categories.component').then(m => m.ExpenseCategoriesComponent), title: 'فئات المصروفات' },
  { path: 'coupons', canActivate: [permissionGuard(Permissions.ManageFinance)], loadComponent: () => import('./coupons/coupons-list.component').then(m => m.CouponsListComponent), title: 'الكوبونات' },
  { path: 'tax-settings', canActivate: [permissionGuard(Permissions.ManageSettings)], loadComponent: () => import('./tax-settings/tax-settings.component').then(m => m.TaxSettingsComponent), title: 'الضرائب' },

  // Inventory & POS
  { path: 'pos-sales', canActivate: [permissionGuard(Permissions.ManagePOS)], loadComponent: () => import('./pos-sales/pos-sales.component').then(m => m.PosSalesComponent), title: 'نقطة البيع' },
  { path: 'products', canActivate: [permissionGuard(Permissions.ManageInventory)], loadComponent: () => import('./products/products-list.component').then(m => m.ProductsListComponent), title: 'المنتجات' },
  { path: 'product-categories', canActivate: [permissionGuard(Permissions.ManageInventory)], loadComponent: () => import('./product-categories/product-categories.component').then(m => m.ProductCategoriesComponent), title: 'فئات المنتجات' },
  { path: 'stock', canActivate: [permissionGuard(Permissions.ManageInventory)], loadComponent: () => import('./stock/stock.component').then(m => m.StockComponent), title: 'المخزون' },
  { path: 'suppliers', canActivate: [permissionGuard(Permissions.ManageInventory)], loadComponent: () => import('./suppliers/suppliers-list.component').then(m => m.SuppliersListComponent), title: 'الموردين' },

  // HR / Payroll
  { path: 'workspace-access', canActivate: [permissionGuard(Permissions.ManageEmployees)], loadComponent: () => import('./workspace-access/workspace-access.component').then(m => m.WorkspaceAccessComponent), title: 'حسابات الفريق - LogicFit' },
  { path: 'employees', canActivate: [permissionGuard(Permissions.ManageEmployees)], loadComponent: () => import('./employees/employees-list.component').then(m => m.EmployeesListComponent), title: 'الموظفين' },
  { path: 'shifts', canActivate: [permissionGuard(Permissions.ManageEmployees)], loadComponent: () => import('./shifts/shifts.component').then(m => m.ShiftsComponent), title: 'الورديات' },
  { path: 'leaves', canActivate: [permissionGuard(Permissions.ManageEmployees)], loadComponent: () => import('./leaves/leaves-list.component').then(m => m.LeavesListComponent), title: 'الإجازات' },
  { path: 'commissions', canActivate: [permissionGuard(Permissions.ManageFinance)], loadComponent: () => import('./commissions/commissions.component').then(m => m.CommissionsComponent), title: 'العمولات' },
  { path: 'payroll', canActivate: [permissionGuard(Permissions.ManageEmployees)], loadComponent: () => import('./payroll/payroll.component').then(m => m.PayrollComponent), title: 'الرواتب' },

  // Reports
  { path: 'reports', canActivate: [permissionGuard(Permissions.ViewReports)], loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent), title: 'Reports access' },
  // Reports are one canonical area; the former operations-only report URL is
  // retained as a safe redirect for bookmarks.
  { path: 'operations-reports', redirectTo: 'reports', pathMatch: 'full' },

  // Platform Subscription & Billing (اشتراك الصالة في المنصة)
  { path: 'subscription', canActivate: [permissionGuard(Permissions.ManageTenantBilling)], loadComponent: () => import('./subscription/my-subscription.component').then(m => m.MySubscriptionComponent), title: 'اشتراك الصالة' },
  { path: 'subscription/invoices', canActivate: [permissionGuard(Permissions.ManageTenantBilling)], loadComponent: () => import('./subscription/subscription-invoices.component').then(m => m.SubscriptionInvoicesComponent), title: 'فواتير المنصة' },

  // Settings
  { path: 'gym-settings', canActivate: [featureGuard('settings.branding', Permissions.ManageSettings)], loadComponent: () => import('./gym-settings/gym-settings.component').then(m => m.GymSettingsComponent), title: 'Gym settings access' },

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
