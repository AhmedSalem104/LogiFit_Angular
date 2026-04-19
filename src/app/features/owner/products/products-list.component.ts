import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { InventoryService } from '../services/inventory.service';
import { Product, CreateProductRequest, ProductCategory } from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, InputSwitchModule, DropdownModule, ButtonModule, TooltipModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="المنتجات" subtitle="إدارة منتجات المتجر"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'المنتجات'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>منتج جديد</span></button>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-box"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ items().length }}</span>
            <span class="mini-stat__label">إجمالي المنتجات</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ lowStockCount() }}</span>
            <span class="mini-stat__label">منخفضة المخزون</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ activeCount() }}</span>
            <span class="mini-stat__label">نشطة</span></div></div>
      </div>

      <div class="toolbar">
        <div class="search-input flex-fill">
          <input type="text" class="form-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="بحث بالاسم / SKU..."/>
          <i class="pi pi-search"></i>
        </div>
        <p-dropdown [options]="categoryOptions()" [(ngModel)]="categoryFilter"
          placeholder="كل الفئات" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="lowStockOptions" [(ngModel)]="lowStockFilter"
          placeholder="الكل" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="items()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>الاسم</th><th>SKU</th><th>الفئة</th><th>سعر التكلفة</th><th>سعر البيع</th>
                <th>المخزون</th><th>الحالة</th><th style="width:120px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-p>
            <tr>
              <td><img *ngIf="p.imageUrl" [src]="p.imageUrl" class="prod-img"/> <strong>{{ p.name }}</strong></td>
              <td><code>{{ p.sku }}</code></td>
              <td>{{ p.categoryName || '-' }}</td>
              <td>{{ p.costPrice | number:'1.0-2' }}</td>
              <td><strong>{{ p.sellingPrice | number:'1.0-2' }}</strong></td>
              <td>
                <span *ngIf="p.trackStock">{{ p.totalStock || 0 }} <span *ngIf="p.unit">{{ p.unit }}</span></span>
                <span *ngIf="!p.trackStock" class="text-muted-color">غير متابع</span>
                <span *ngIf="p.isLowStock" class="badge orange" style="margin-right:.25rem">منخفض</span>
              </td>
              <td><span class="badge" [class.green]="p.isActive" [class.gray]="!p.isActive">{{ p.isActive ? 'نشط':'متوقف' }}</span></td>
              <td>
                <button class="action-btn" (click)="openEdit(p)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
                <button class="action-btn danger" (click)="remove(p)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="8"><div class="empty-state"><i class="pi pi-box"></i><p>لا توجد منتجات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'760px', maxWidth:'95vw'}"
              [header]="isEdit ? 'تعديل':'منتج جديد'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الاسم *</label><input class="form-input" [(ngModel)]="form.name"/></div>
        <div><label class="form-label">الفئة</label>
          <p-dropdown [options]="categoryOptions()" [(ngModel)]="form.categoryId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">SKU *</label><input class="form-input" [(ngModel)]="form.sku"/></div>
        <div><label class="form-label">باركود</label><input class="form-input" [(ngModel)]="form.barcode"/></div>
        <div><label class="form-label">الوحدة</label><input class="form-input" [(ngModel)]="form.unit" placeholder="kg / piece / pack"/></div>
        <div><label class="form-label">سعر التكلفة</label>
          <p-inputNumber [(ngModel)]="form.costPrice" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">سعر البيع *</label>
          <p-inputNumber [(ngModel)]="form.sellingPrice" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">نسبة الضريبة (%)</label>
          <p-inputNumber [(ngModel)]="form.taxRate" [min]="0" [max]="100" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">حد أدنى للمخزون</label>
          <p-inputNumber [(ngModel)]="form.minStockLevel" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div class="full"><label class="form-label">رابط الصورة</label><input class="form-input" [(ngModel)]="form.imageUrl"/></div>
        <div class="full"><label class="form-label">الوصف</label><input class="form-input" [(ngModel)]="form.description"/></div>
        <div class="full" style="display:flex; gap:2rem; align-items:center;">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.trackStock"></p-inputSwitch><span>متابعة المخزون</span>
          </label>
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
    .prod-img { width:32px; height:32px; border-radius:8px; vertical-align:middle; margin-left:.5rem; }
  `]
})
export class ProductsListComponent implements OnInit {
  private svc = inject(InventoryService);
  private toast = inject(NotificationService);
  items = signal<Product[]>([]);
  categories = signal<ProductCategory[]>([]);
  loading = signal(false);
  saving = signal(false);
  search = '';
  categoryFilter: string | null = null;
  lowStockFilter: boolean | null = null;
  lowStockOptions = [{ label:'مخزون منخفض', value:true },{ label:'مخزون كافٍ', value:false }];
  dialog = false; isEdit = false; editingId: string | null = null;
  form: CreateProductRequest = this.emptyForm();

  categoryOptions = computed(() => this.categories().map(c => ({ label: c.name, value: c.id })));
  lowStockCount = computed(() => this.items().filter(p => p.isLowStock).length);
  activeCount = computed(() => this.items().filter(p => p.isActive).length);

  ngOnInit() {
    this.svc.listProductCategories().subscribe(c => this.categories.set(c || []));
    this.load();
  }
  load() {
    this.loading.set(true);
    this.svc.listProducts({
      categoryId: this.categoryFilter ?? undefined,
      searchTerm: this.search || undefined,
      lowStockOnly: this.lowStockFilter ?? undefined
    }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  emptyForm(): CreateProductRequest {
    return {
      name:'', sku:'', costPrice:0, sellingPrice:0, taxRate:0,
      isActive:true, trackStock:true, minStockLevel:0
    };
  }
  openAdd() { this.isEdit=false; this.editingId=null; this.form = this.emptyForm(); this.dialog=true; }
  openEdit(p: Product) {
    this.isEdit=true; this.editingId=p.id;
    this.form = {
      categoryId:p.categoryId, name:p.name, description:p.description, sku:p.sku, barcode:p.barcode,
      costPrice:p.costPrice, sellingPrice:p.sellingPrice, taxRate:p.taxRate, unit:p.unit,
      imageUrl:p.imageUrl, isActive:p.isActive, minStockLevel:p.minStockLevel, trackStock:p.trackStock
    };
    this.dialog=true;
  }
  save() {
    if (!this.form.name || !this.form.sku) { this.toast.error('الاسم والـ SKU مطلوبان'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateProduct(this.editingId, this.form)
      : this.svc.createProduct(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  remove(p: Product) {
    Swal.fire({ title:'حذف؟', text:p.name, icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteProduct(p.id).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }
}
