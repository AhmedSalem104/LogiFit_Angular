import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { InventoryService } from '../services/inventory.service';
import { ProductCategory, CreateProductCategoryRequest } from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputSwitchModule, DropdownModule, ButtonModule, TooltipModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="فئات المنتجات" subtitle="تصنيف منتجات المتجر"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'فئات المنتجات'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>فئة جديدة</span></button>
      </app-page-header>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()">
          <ng-template pTemplate="header"><tr><th>الاسم</th><th>الوصف</th><th>الحالة</th><th style="width:120px">إجراءات</th></tr></ng-template>
          <ng-template pTemplate="body" let-c>
            <tr>
              <td><img *ngIf="c.imageUrl" [src]="c.imageUrl" class="cat-img"/> <strong>{{ c.name }}</strong></td>
              <td>{{ c.description || '-' }}</td>
              <td><span class="badge" [class.green]="c.isActive" [class.gray]="!c.isActive">{{ c.isActive ? 'نشط':'متوقف' }}</span></td>
              <td>
                <button class="action-btn" (click)="openEdit(c)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" (click)="remove(c)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="4"><div class="empty-state"><i class="pi pi-tag"></i><p>لا توجد فئات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'480px'}"
              [header]="isEdit ? 'تعديل':'فئة جديدة'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الاسم *</label><input class="form-input" [(ngModel)]="form.name"/></div>
        <div class="full"><label class="form-label">الفئة الأب</label>
          <p-dropdown [options]="parentOptions()" [(ngModel)]="form.parentCategoryId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">الوصف</label><input class="form-input" [(ngModel)]="form.description"/></div>
        <div class="full"><label class="form-label">رابط الصورة</label><input class="form-input" [(ngModel)]="form.imageUrl"/></div>
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
  styles: [GYM_PAGE_STYLES + `
    .cat-img { width:30px; height:30px; border-radius:8px; vertical-align: middle; margin-left:.5rem; }
  `]
})
export class ProductCategoriesComponent implements OnInit {
  private svc = inject(InventoryService);
  private toast = inject(NotificationService);
  items = signal<ProductCategory[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialog = false; isEdit = false; editingId: string | null = null;
  form: CreateProductCategoryRequest = { name: '', isActive: true };
  parentOptions = computed(() => this.items().filter(c => c.id !== this.editingId).map(c => ({ label: c.name, value: c.id })));

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.svc.listProductCategories().subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  openAdd() { this.isEdit=false; this.editingId=null; this.form={name:'', isActive:true}; this.dialog=true; }
  openEdit(c: ProductCategory) {
    this.isEdit=true; this.editingId=c.id;
    this.form = { name:c.name, description:c.description, parentCategoryId:c.parentCategoryId, imageUrl:c.imageUrl, isActive:c.isActive };
    this.dialog=true;
  }
  save() {
    if (!this.form.name) { this.toast.error('الاسم مطلوب'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateProductCategory(this.editingId, this.form)
      : this.svc.createProductCategory(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  remove(c: ProductCategory) {
    Swal.fire({ title:'حذف؟', text:c.name, icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteProductCategory(c.id).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }
}
