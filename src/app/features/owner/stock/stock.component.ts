import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { InventoryService } from '../services/inventory.service';
import { BranchesService } from '../services/branches.service';
import {
  StockItem, StockMovement, AdjustStockRequest, TransferStockRequest,
  StockMovementType, StockMovementTypeLabels, Product, Branch
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, DropdownModule, ButtonModule, TabViewModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="المخزون" subtitle="إدارة مخزون المنتجات والحركات"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'المخزون'}]">
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openAdjust()"><i class="pi pi-refresh"></i><span>تعديل</span></button>
          <button class="btn btn-primary" (click)="openTransfer()"><i class="pi pi-arrow-right-arrow-left"></i><span>نقل بين فرعين</span></button>
        </div>
      </app-page-header>
      <div class="state-card warning-state" *ngIf="referenceError()" role="status">
        <i class="pi pi-info-circle"></i><div><strong>بعض البيانات المساعدة غير متاحة</strong><p>{{ referenceError() }}</p><button class="btn btn-secondary" type="button" (click)="loadReferences()">إعادة المحاولة</button></div>
      </div>

      <p-tabView>
        <p-tabPanel header="الرصيد الحالي">
          <div class="toolbar">
            <p-dropdown [options]="branchOptions()" [(ngModel)]="stockBranchFilter"
              placeholder="كل الفروع" [showClear]="true" (onChange)="loadStock()" appendTo="body"></p-dropdown>
            <p-dropdown [options]="lowStockOptions" [(ngModel)]="lowStockFilter"
              placeholder="الكل" [showClear]="true" (onChange)="loadStock()" appendTo="body"></p-dropdown>
          </div>
          <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
          <div class="state-card error-state" *ngIf="!loading() && stockError()" role="alert">
            <i class="pi pi-exclamation-triangle"></i><div><strong>تعذر تحميل الرصيد الحالي</strong><p>{{ stockError() }}</p><button class="btn btn-secondary" type="button" (click)="loadStock()">إعادة المحاولة</button></div>
          </div>
          <div class="data-card" *ngIf="!loading() && !stockError()">
            <p-table [value]="stock()" [paginator]="true" [rows]="10">
              <ng-template pTemplate="header">
                <tr><th>المنتج</th><th>SKU</th><th>الفرع</th><th>الكمية</th><th>الحد الأدنى</th><th>آخر حركة</th><th>الحالة</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-s>
                <tr>
                  <td>{{ s.productName }}</td>
                  <td><code>{{ s.sku }}</code></td>
                  <td>{{ s.branchName }}</td>
                  <td><strong>{{ s.quantity }}</strong></td>
                  <td>{{ s.minStockLevel || '-' }}</td>
                  <td>{{ s.lastMovementAt ? (s.lastMovementAt | date:'yyyy-MM-dd HH:mm') : '-' }}</td>
                  <td><span *ngIf="s.isLowStock" class="badge orange">منخفض</span>
                      <span *ngIf="!s.isLowStock" class="badge green">كافٍ</span></td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="7"><div class="empty-state"><i class="pi pi-box"></i><p>لا يوجد مخزون</p></div></td></tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <p-tabPanel header="حركات المخزون">
          <div class="toolbar">
            <p-dropdown [options]="branchOptions()" [(ngModel)]="movBranchFilter"
              placeholder="كل الفروع" [showClear]="true" (onChange)="loadMovements()" appendTo="body"></p-dropdown>
            <p-dropdown [options]="typeOptions" [(ngModel)]="movTypeFilter"
              placeholder="كل الأنواع" [showClear]="true" (onChange)="loadMovements()" appendTo="body"></p-dropdown>
            <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="loadMovements()"/>
            <input type="date" class="form-input" [(ngModel)]="toDate" (change)="loadMovements()"/>
          </div>
          <app-loading-skeleton *ngIf="movementsLoading()" type="table"></app-loading-skeleton>
          <div class="state-card error-state" *ngIf="!movementsLoading() && movementsError()" role="alert">
            <i class="pi pi-exclamation-triangle"></i><div><strong>تعذر تحميل حركات المخزون</strong><p>{{ movementsError() }}</p><button class="btn btn-secondary" type="button" (click)="loadMovements()">إعادة المحاولة</button></div>
          </div>
          <div class="data-card" *ngIf="!movementsLoading() && !movementsError()">
            <p-table [value]="movements()" [paginator]="true" [rows]="15">
              <ng-template pTemplate="header">
                <tr><th>التاريخ</th><th>المنتج</th><th>الفرع</th><th>النوع</th><th>الكمية</th><th>السبب</th><th>المنشئ</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-m>
                <tr>
                  <td>{{ m.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                  <td>{{ m.productName }}</td>
                  <td>{{ m.branchName }}</td>
                  <td><span class="badge" [ngClass]="{green: m.type===1, red: m.type===2, blue: m.type===3, purple: m.type===4}">
                    {{ typeLabels[m.type] }}</span></td>
                  <td><strong>{{ m.quantity }}</strong></td>
                  <td>{{ m.reason || '-' }}</td>
                  <td>{{ m.createdByName || '-' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="7"><div class="empty-state"><i class="pi pi-history"></i><p>لا توجد حركات</p></div></td></tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>

    <p-dialog [(visible)]="adjustDialog" [modal]="true" [style]="{width:'500px'}" header="تعديل مخزون" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">المنتج *</label>
          <p-dropdown [options]="productOptions()" [(ngModel)]="adjustForm.productId" [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">الفرع *</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="adjustForm.branchId" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">النوع</label>
          <p-dropdown [options]="adjustTypeOptions" [(ngModel)]="adjustForm.type" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">الكمية *</label>
          <p-inputNumber [(ngModel)]="adjustForm.quantity" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div class="full"><label class="form-label">السبب</label>
          <input class="form-input" [(ngModel)]="adjustForm.reason"/></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="adjustDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveAdjust()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="transferDialog" [modal]="true" [style]="{width:'520px'}" header="نقل مخزون بين فرعين" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">المنتج *</label>
          <p-dropdown [options]="productOptions()" [(ngModel)]="transferForm.productId" [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">من فرع *</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="transferForm.fromBranchId" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">إلى فرع *</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="transferForm.toBranchId" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">الكمية *</label>
          <p-inputNumber [(ngModel)]="transferForm.quantity" [min]="1" styleClass="w-full"></p-inputNumber></div>
        <div class="full"><label class="form-label">السبب</label>
          <input class="form-input" [(ngModel)]="transferForm.reason"/></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="transferDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveTransfer()" [disabled]="saving()">نقل</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES]
})
export class StockComponent implements OnInit {
  private svc = inject(InventoryService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);

  stock = signal<StockItem[]>([]);
  movements = signal<StockMovement[]>([]);
  products = signal<Product[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  movementsLoading = signal(false);
  saving = signal(false);
  stockError = signal<string | null>(null);
  movementsError = signal<string | null>(null);
  referenceError = signal<string | null>(null);

  stockBranchFilter: string | null = null;
  lowStockFilter: boolean | null = null;
  lowStockOptions = [{ label:'منخفض', value:true },{ label:'كافٍ', value:false }];
  movBranchFilter: string | null = null;
  movTypeFilter: StockMovementType | null = null;
  fromDate = ''; toDate = '';

  adjustDialog = false;
  transferDialog = false;
  adjustForm: AdjustStockRequest = { productId:'', branchId:'', type: StockMovementType.In, quantity: 0 };
  transferForm: TransferStockRequest = { productId:'', fromBranchId:'', toBranchId:'', quantity: 0 };

  typeLabels = StockMovementTypeLabels;
  typeOptions = Object.entries(StockMovementTypeLabels).map(([v,l]) => ({ label: l, value: Number(v) as StockMovementType }));
  adjustTypeOptions = [
    { label: 'وارد (إضافة)', value: StockMovementType.In },
    { label: 'صادر (طرح)', value: StockMovementType.Out },
    { label: 'تعديل (قيمة مطلقة)', value: StockMovementType.Adjustment }
  ];
  productOptions = computed(() => this.products().map(p => ({ label: `${p.name} — ${p.sku}`, value: p.id })));
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  ngOnInit() {
    this.loadReferences();
    this.loadStock();
    this.loadMovements();
  }

  loadReferences() {
    this.referenceError.set(null);
    this.svc.listProducts().subscribe({ next: p => this.products.set(p || []), error: () => this.referenceError.set('تعذر تحميل المنتجات.') });
    this.branchesSvc.list().subscribe({ next: b => this.branches.set(b || []), error: () => this.referenceError.set('تعذر تحميل الفروع.') });
  }

  loadStock() {
    this.loading.set(true);
    this.stockError.set(null);
    this.svc.listStock({
      branchId: this.stockBranchFilter ?? undefined,
      lowStockOnly: this.lowStockFilter ?? undefined
    }).subscribe({
      next: d => { this.stock.set(d || []); this.loading.set(false); },
      error: () => { this.stockError.set('تعذر الاتصال بخدمة المخزون. تحقق من اتصال الخادم ثم أعد المحاولة.'); this.loading.set(false); }
    });
  }

  loadMovements() {
    this.movementsLoading.set(true);
    this.movementsError.set(null);
    this.svc.listMovements({
      branchId: this.movBranchFilter ?? undefined,
      type: this.movTypeFilter ?? undefined,
      fromDate: this.fromDate || undefined, toDate: this.toDate || undefined
    }).subscribe({
      next: d => { this.movements.set(d || []); this.movementsLoading.set(false); },
      error: () => { this.movementsError.set('تعذر الاتصال بخدمة حركات المخزون. تحقق من اتصال الخادم ثم أعد المحاولة.'); this.movementsLoading.set(false); }
    });
  }

  openAdjust() {
    this.adjustForm = { productId:'', branchId:'', type: StockMovementType.In, quantity: 0 };
    this.adjustDialog = true;
  }

  saveAdjust() {
    if (!this.adjustForm.productId || !this.adjustForm.branchId) { this.toast.error('اختر المنتج والفرع'); return; }
    if (!this.adjustForm.quantity || this.adjustForm.quantity <= 0) { this.toast.error('أدخل كمية أكبر من صفر'); return; }
    this.saving.set(true);
    this.svc.adjustStock(this.adjustForm).subscribe({
      next: () => { this.saving.set(false); this.adjustDialog=false; this.toast.success('تم'); this.loadStock(); this.loadMovements(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }

  openTransfer() {
    this.transferForm = { productId:'', fromBranchId:'', toBranchId:'', quantity: 0 };
    this.transferDialog = true;
  }

  saveTransfer() {
    if (!this.transferForm.productId || !this.transferForm.fromBranchId || !this.transferForm.toBranchId) {
      this.toast.error('اختر المنتج والفرعين'); return;
    }
    if (this.transferForm.fromBranchId === this.transferForm.toBranchId) { this.toast.error('اختر فرعين مختلفين'); return; }
    if (!this.transferForm.quantity || this.transferForm.quantity <= 0) { this.toast.error('أدخل كمية أكبر من صفر'); return; }
    this.saving.set(true);
    this.svc.transferStock(this.transferForm).subscribe({
      next: () => { this.saving.set(false); this.transferDialog=false; this.toast.success('تم النقل'); this.loadStock(); this.loadMovements(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
}
