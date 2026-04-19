import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceService } from '../services/finance.service';
import { TaxSetting, CreateTaxRequest } from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, InputSwitchModule, ButtonModule, TooltipModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="إعدادات الضرائب" subtitle="إدارة نسب الضرائب"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الضرائب'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>ضريبة جديدة</span></button>
      </app-page-header>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()">
          <ng-template pTemplate="header">
            <tr><th>الاسم</th><th>النسبة</th><th>افتراضية</th><th>الحالة</th><th>الوصف</th><th style="width:120px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-t>
            <tr>
              <td><strong>{{ t.name }}</strong></td>
              <td>{{ t.rate }}%</td>
              <td><span *ngIf="t.isDefault" class="badge blue">افتراضية</span></td>
              <td><span class="badge" [class.green]="t.isActive" [class.gray]="!t.isActive">{{ t.isActive ? 'نشطة':'متوقفة' }}</span></td>
              <td>{{ t.description || '-' }}</td>
              <td>
                <button class="action-btn" (click)="openEdit(t)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" (click)="remove(t)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6"><div class="empty-state"><i class="pi pi-percentage"></i><p>لا توجد ضرائب</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'440px'}"
              [header]="isEdit ? 'تعديل':'ضريبة جديدة'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الاسم *</label><input class="form-input" [(ngModel)]="form.name"/></div>
        <div><label class="form-label">النسبة (%)</label>
          <p-inputNumber [(ngModel)]="form.rate" [min]="0" [max]="100" mode="decimal" [maxFractionDigits]="2" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">الوصف</label><input class="form-input" [(ngModel)]="form.description"/></div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.isDefault"></p-inputSwitch><span>افتراضية</span>
          </label>
          <label style="display:flex; gap:.5rem; align-items:center; margin-top:.5rem;">
            <p-inputSwitch [(ngModel)]="form.isActive"></p-inputSwitch><span>نشطة</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class TaxSettingsComponent implements OnInit {
  private svc = inject(FinanceService);
  private toast = inject(NotificationService);
  items = signal<TaxSetting[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialog = false;
  isEdit = false;
  editingId: string | null = null;
  form: CreateTaxRequest = { name: '', rate: 15, isActive: true, isDefault: false };

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.svc.listTaxes().subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  openAdd() { this.isEdit=false; this.editingId=null; this.form = { name:'', rate:15, isActive:true, isDefault:false }; this.dialog=true; }
  openEdit(t: TaxSetting) {
    this.isEdit=true; this.editingId=t.id;
    this.form = { name:t.name, rate:t.rate, isDefault:t.isDefault, isActive:t.isActive, description:t.description };
    this.dialog=true;
  }
  save() {
    if (!this.form.name) { this.toast.error('الاسم مطلوب'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateTax(this.editingId, this.form)
      : this.svc.createTax(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  remove(t: TaxSetting) {
    Swal.fire({ title:'حذف الضريبة؟', icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteTax(t.id).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }
}
