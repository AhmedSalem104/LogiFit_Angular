import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-gym-settings',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div class="gym-settings-page">
      <app-page-header
        title="إعدادات الصالة"
        subtitle="إدارة معلومات وإعدادات الصالة"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'إعدادات الصالة'}]"
      ></app-page-header>

      <div class="placeholder-content">
        <i class="pi pi-cog"></i>
        <h3>إعدادات الصالة</h3>
        <p>سيتم عرض إعدادات الصالة هنا</p>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-content {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      color: var(--text-secondary);

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      h3 {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class GymSettingsComponent {}
