import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { InventoryService } from '../services/inventory.service';
import { Supplier, CreateSupplierRequest } from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputSwitchModule, DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الموردين" subtitle="قاعدة بيانات الموردين"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الموردين'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>مورد جديد</span></button>
      </app-page-header>

      <div class="toolbar">
        <div class="search-input flex-fill">
          <input type="text" class="form-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="بحث..."/>
          <i class="pi pi-search"></i>
        </div>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>الاسم</th><th>جهة الاتصال</th><th>الهاتف</th><th>البريد</th><th>الرقم الضريبي</th><th>الحالة</th>
                <th style="width:120px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-s>
            <tr>
              <td><strong>{{ s.name }}</strong></td>
              <td>{{ s.contactPerson || '-' }}</td>
              <td>{{ s.phone || '-' }}</td>
              <td>{{ s.email || '-' }}</td>
              <td>{{ s.taxNumber || '-' }}</td>
              <td><span class="badge" [class.green]="s.isActive" [class.gray]="!s.isActive">{{ s.isActive ? 'نشط':'متوقف' }}</span></td>
              <td>
                <button class="action-btn" (click)="openEdit(s)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" (click)="remove(s)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="7"><div class="empty-state"><i class="pi pi-truck"></i><p>لا يوجد موردين</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'640px'}"
              [header]="isEdit ? 'تعديل':'مورد جديد'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الاسم *</label><input class="form-input" [(ngModel)]="form.name"/></div>
        <div><label class="form-label">جهة الاتصال</label><input class="form-input" [(ngModel)]="form.contactPerson"/></div>
        <div><label class="form-label">الهاتف</label><input class="form-input" [(ngModel)]="form.phone"/></div>
        <div><label class="form-label">البريد</label><input class="form-input" type="email" [(ngModel)]="form.email"/></div>
        <div><label class="form-label">الرقم الضريبي</label><input class="form-input" [(ngModel)]="form.taxNumber"/></div>
        <div class="full"><label class="form-label">العنوان</label><input class="form-input" [(ngModel)]="form.address"/></div>
        <div class="full"><label class="form-label">ملاحظات</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.notes"></textarea></div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.isActive"></p-inputSwitch><span>نشط</span>
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
export class SuppliersListComponent implements OnInit {
  private svc = inject(InventoryService);
  private toast = inject(NotificationService);
  items = signal<Supplier[]>([]);
  loading = signal(false);
  saving = signal(false);
  search = '';
  dialog = false; isEdit = false; editingId: string | null = null;
  form: CreateSupplierRequest = { name:'', isActive: true };

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.svc.listSuppliers({ searchTerm: this.search || undefined }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  openAdd() { this.isEdit=false; this.editingId=null; this.form = { name:'', isActive:true }; this.dialog=true; }
  openEdit(s: Supplier) {
    this.isEdit=true; this.editingId=s.id;
    this.form = { name:s.name, contactPerson:s.contactPerson, phone:s.phone, email:s.email, address:s.address,
      taxNumber:s.taxNumber, notes:s.notes, isActive:s.isActive };
    this.dialog=true;
  }
  save() {
    if (!this.form.name) { this.toast.error('الاسم مطلوب'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateSupplier(this.editingId, this.form)
      : this.svc.createSupplier(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  remove(s: Supplier) {
    Swal.fire({ title:'حذف؟', text:s.name, icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteSupplier(s.id).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }
}
