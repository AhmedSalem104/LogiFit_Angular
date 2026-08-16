import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Permission, WorkspaceCapability } from '../../../core/auth/models/auth.models';

export interface FeatureHubItem {
  title: string;
  description: string;
  icon: string;
  route: string;
  group?: string;
  permission?: Permission | Permission[];
  capability?: WorkspaceCapability;
}

export interface FeatureHubConfig {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: FeatureHubItem[];
}

/**
 * A small canonical area screen. TOP-GYM exposes product areas as tabs and
 * opens detailed operations from the area; this component keeps the sidebar
 * short without deleting the existing feature routes.
 */
@Component({
  selector: 'app-feature-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent],
  template: `
    <div class="hub-page">
      <app-page-header
        [title]="config.title"
        [subtitle]="config.subtitle"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: homeRoute}, {label: config.title}]"
      ></app-page-header>

      <section class="hub-intro" aria-label="منطقة العمل">
        <span class="eyebrow">{{ config.eyebrow }}</span>
        <h1>{{ config.title }}</h1>
        <p>اختر العملية المطلوبة من هذه المنطقة. لا توجد شاشات مكررة في القائمة؛ كل بطاقة تقود إلى الوظيفة الأصلية وصلاحياتها.</p>
      </section>

      @for (section of visibleSections(); track section.title) {
        <section class="hub-section" [attr.aria-label]="section.title">
          @if (section.title) { <h2>{{ section.title }}</h2> }
          <div class="hub-grid">
            @for (item of section.items; track item.route) {
              <a class="hub-card" [routerLink]="item.route">
                <span class="hub-icon"><i [class]="'pi ' + item.icon"></i></span>
                <span class="hub-copy"><strong>{{ item.title }}</strong><small>{{ item.description }}</small></span>
                <i class="pi pi-arrow-left hub-arrow" aria-hidden="true"></i>
              </a>
            }
          </div>
        </section>
      } @empty {
        <div class="empty-state"><i class="pi pi-lock"></i><strong>لا توجد وظيفة متاحة</strong><span>تحقق من دورك وصلاحيات مساحة العمل.</span></div>
      }
    </div>
  `,
  styles: [`
    .hub-page { max-width:1200px; }
    .hub-intro { margin:0 0 1.25rem; padding:1.25rem 1.4rem; border:1px solid #bfdbfe; border-radius:1rem; background:linear-gradient(135deg,#eff6ff,#f8fafc); }
    .eyebrow { color:#2563eb; font-size:.76rem; font-weight:800; }
    h1 { margin:.35rem 0 .35rem; font-size:1.25rem; color:var(--text-primary,#0f172a); }
    .hub-intro p { margin:0; color:var(--text-secondary,#64748b); line-height:1.7; font-size:.88rem; }
    .hub-section { display:grid; gap:.7rem; margin-bottom:1.25rem; }
    .hub-section h2 { margin:0; color:var(--text-primary,#0f172a); font-size:1rem; }
    .hub-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1rem; }
    .hub-card { display:flex; align-items:center; gap:.8rem; min-height:100px; padding:1rem; border:1px solid var(--border-color,#e2e8f0); border-radius:1rem; background:var(--surface-card,#fff); color:inherit; text-decoration:none; box-shadow:0 6px 20px rgba(15,23,42,.05); transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease; }
    .hub-card:hover { transform:translateY(-2px); border-color:#93c5fd; box-shadow:0 12px 28px rgba(37,99,235,.12); }
    .hub-icon { display:grid; place-items:center; flex:0 0 44px; width:44px; height:44px; border-radius:.8rem; background:#eff6ff; color:#2563eb; font-size:1.1rem; }
    .hub-copy { display:grid; gap:.25rem; min-width:0; flex:1; }
    .hub-copy strong { color:var(--text-primary,#0f172a); }
    .hub-copy small { color:var(--text-secondary,#64748b); line-height:1.5; }
    .hub-arrow { color:#94a3b8; }
    .empty-state { grid-column:1 / -1; display:grid; justify-items:center; gap:.4rem; padding:3rem 1rem; color:#64748b; border:1px dashed #cbd5e1; border-radius:1rem; }
    .empty-state i { font-size:1.8rem; }
    @media (max-width:600px) { .hub-grid { grid-template-columns:1fr; } }
  `]
})
export class FeatureHubComponent {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  config: FeatureHubConfig = this.route.snapshot.data['hub'];
  homeRoute = this.config?.items.some(item => item.route.startsWith('/coach/')) ? '/coach/dashboard' : '/owner/dashboard';

  visibleItems(): FeatureHubItem[] {
    return (this.config?.items || []).filter(item => {
      const permissions = item.permission ? (Array.isArray(item.permission) ? item.permission : [item.permission]) : [];
      const permissionOk = !permissions.length || this.auth.hasAnyPermission(...permissions);
      return permissionOk && (!item.capability || this.auth.hasCapability(item.capability));
    });
  }

  visibleSections(): Array<{ title: string; items: FeatureHubItem[] }> {
    const sections = new Map<string, FeatureHubItem[]>();
    for (const item of this.visibleItems()) {
      const title = item.group || '';
      const current = sections.get(title) || [];
      current.push(item);
      sections.set(title, current);
    }
    return Array.from(sections, ([title, items]) => ({ title, items }));
  }
}

export const GYM_MANAGEMENT_HUB: FeatureHubConfig = {
  eyebrow: 'إدارة الجيم',
  title: 'إدارة الجيم',
  subtitle: 'الفروع والفريق والحضور والمخزون والحسابات في منطقة واحدة.',
  items: [
    { group: 'الفروع والمرافق', title: 'الفروع', description: 'إنشاء وتعديل فروع الجيم.', icon: 'pi-building', route: '/owner/branches', permission: 'ManageBranches', capability: 'GymFacilities' },
    { group: 'الفروع والمرافق', title: 'القاعات والأجهزة والصيانة', description: 'إدارة القاعات والأجهزة وسجل الصيانة.', icon: 'pi-cog', route: '/owner/rooms', permission: 'ManageBranches', capability: 'GymFacilities' },
    { group: 'الفروع والمرافق', title: 'فتح إدارة الأجهزة والصيانة', description: 'الوصول إلى قوائم الأجهزة والصيانة التفصيلية.', icon: 'pi-wrench', route: '/owner/equipment', permission: 'ManageBranches', capability: 'GymFacilities' },
    { group: 'الفروع والمرافق', title: 'الصيانة', description: 'متابعة طلبات الصيانة وحالتها.', icon: 'pi-wrench', route: '/owner/maintenance', permission: 'ManageBranches', capability: 'GymFacilities' },
    { group: 'الفريق والحسابات', title: 'المدربون', description: 'ملفات المدربين وتعيينهم للمشتركين.', icon: 'pi-id-card', route: '/owner/coaches', permission: 'ManageCoaches', capability: 'GymStaff' },
    { group: 'الفريق والحسابات', title: 'الموظفون', description: 'بيانات الموظفين وحساباتهم داخل الجيم.', icon: 'pi-users', route: '/owner/employees', permission: 'ManageEmployees', capability: 'GymStaff' },
    { group: 'الفريق والحسابات', title: 'الحسابات والصلاحيات', description: 'الأدوار، الوصول، الورديات والإجازات.', icon: 'pi-key', route: '/owner/workspace-access', permission: 'ManageEmployees', capability: 'GymStaff' },
    { group: 'الفريق والحسابات', title: 'الرواتب والعمولات', description: 'إدارة الرواتب والعمولات للفريق.', icon: 'pi-wallet', route: '/owner/payroll', permission: ['ManageEmployees', 'ManageFinance'], capability: 'GymStaff' },
    { group: 'الحضور والدخول', title: 'الحضور والانصراف', description: 'تسجيل ومراجعة حضور الأعضاء والفريق.', icon: 'pi-clock', route: '/owner/attendance', permission: 'ManageAttendance', capability: 'GymAttendance' },
    { group: 'الحضور والدخول', title: 'البوابة وبطاقات العضوية', description: 'الدخول والبطاقات والتحقق السريع.', icon: 'pi-qrcode', route: '/owner/gate-access', permission: 'ManageAttendance', capability: 'GymGateAccess' },
    { group: 'الحصص الجماعية', title: 'الحصص والجدولة', description: 'أنواع الحصص ومواعيدها ومدربيها.', icon: 'pi-calendar', route: '/owner/group-classes', permission: 'ManageBranches', capability: 'GymFacilities' },
    { group: 'الحصص الجماعية', title: 'جدول الحصص', description: 'عرض وتعديل مواعيد الحصص الجماعية.', icon: 'pi-calendar-plus', route: '/owner/class-schedules', permission: 'ManageBranches', capability: 'GymFacilities' },
    { group: 'المنتجات والمخزون', title: 'المنتجات', description: 'إضافة وتعديل المنتجات وأسعارها.', icon: 'pi-box', route: '/owner/products', permission: 'ManageInventory', capability: 'GymInventory' },
    { group: 'المنتجات والمخزون', title: 'المخزون', description: 'الكميات والحركات والتنبيهات.', icon: 'pi-database', route: '/owner/stock', permission: 'ManageInventory', capability: 'GymInventory' },
    { group: 'المنتجات والمخزون', title: 'نقطة البيع', description: 'تنفيذ المبيعات وإصدار الإيصالات.', icon: 'pi-shopping-cart', route: '/owner/pos-sales', permission: 'ManagePOS', capability: 'GymPOS' },
    { group: 'المنتجات والمخزون', title: 'فئات المنتجات', description: 'تنظيم المنتجات داخل فئات واضحة.', icon: 'pi-tags', route: '/owner/product-categories', permission: 'ManageInventory', capability: 'GymInventory' },
    { group: 'المنتجات والمخزون', title: 'الموردون', description: 'بيانات الموردين وحركة التوريد.', icon: 'pi-truck', route: '/owner/suppliers', permission: 'ManageInventory', capability: 'GymInventory' }
  ]
};

export const GYM_FINANCE_HUB: FeatureHubConfig = {
  eyebrow: 'العضويات والمالية',
  title: 'العضويات والتحصيل',
  subtitle: 'الاشتراكات والباقات والمدفوعات والفواتير في منطقة واضحة.',
  items: [
    { group: 'الاشتراكات', title: 'العضويات والمدفوعات', description: 'مراجعة العضويات والتحصيل والتجميد والتجديد.', icon: 'pi-credit-card', route: '/owner/subscriptions', permission: 'ManageClientSubscriptions', capability: 'GymExperience' },
    { group: 'الاشتراكات', title: 'باقات العضوية', description: 'إنشاء وتعديل الباقات المتاحة للمشتركين.', icon: 'pi-wallet', route: '/owner/subscription-plans', permission: 'ManageClientSubscriptions', capability: 'GymMembershipPlans' },
    { group: 'التحصيل والفواتير', title: 'سجل المدفوعات', description: 'كل التحصيلات والإيصالات في سجل واحد.', icon: 'pi-dollar', route: '/owner/payments', permission: 'ManageFinance', capability: 'GymExperience' },
    { group: 'التحصيل والفواتير', title: 'الفواتير والمديونيات', description: 'الفواتير والمديونيات وحالات السداد.', icon: 'pi-file', route: '/owner/invoices', permission: 'ManageFinance', capability: 'GymExperience' },
    { group: 'التحصيل والفواتير', title: 'فئات المصروفات والكوبونات', description: 'إدارة التصنيفات والكوبونات والضرائب.', icon: 'pi-tags', route: '/owner/expense-categories', permission: 'ManageFinance', capability: 'GymExperience' }
  ]
};

export const COACH_LIBRARY_HUB: FeatureHubConfig = {
  eyebrow: 'المكتبة المشتركة',
  title: 'المكتبة',
  subtitle: 'مصادر التمارين والأطعمة والعضلات المستخدمة داخل البنّاء.',
  items: [
    { title: 'مكتبة التمارين', description: 'البحث في التمارين وإضافتها للبرامج.', icon: 'pi-bolt', route: '/coach/exercises', capability: 'CoachingPrograms' },
    { title: 'قاعدة الأطعمة', description: 'الأطعمة والمقادير والماكروز للخطط الغذائية.', icon: 'pi-apple', route: '/coach/foods', capability: 'CoachingNutrition' },
    { title: 'العضلات', description: 'توزيع العضلات ومراجع التمرين.', icon: 'pi-heart', route: '/coach/muscles', capability: 'CoachingPrograms' }
  ]
};
