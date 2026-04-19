import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TabViewModule } from 'primeng/tabview';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { InventoryService } from '../services/inventory.service';
import { BranchesService } from '../services/branches.service';
import { OwnerService, Client } from '../services/owner.service';
import {
  Sale, SaleItem, CheckoutRequest, Product, Branch,
  PaymentMethodEnum, PaymentMethodGymLabels
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-pos-sales',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, DropdownModule, ButtonModule, TooltipModule, InputTextareaModule, TabViewModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="نقطة البيع (POS)" subtitle="بيع المنتجات ومراجعة السجل"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'المبيعات'}]"></app-page-header>

      <p-tabView>
        <!-- Checkout Tab -->
        <p-tabPanel header="بيع جديد">
          <div class="pos-layout">
            <!-- Product Grid -->
            <div class="pos-products">
              <div class="search-input">
                <input type="text" class="form-input" [(ngModel)]="productSearch" placeholder="بحث عن منتج / SKU..."/>
                <i class="pi pi-search"></i>
              </div>
              <div class="product-grid">
                @for (p of filteredProducts(); track p.id) {
                  <div class="product-card" (click)="addToCart(p)" [class.disabled]="p.trackStock && !(p.totalStock || 0)">
                    <img *ngIf="p.imageUrl" [src]="p.imageUrl"/>
                    <div *ngIf="!p.imageUrl" class="img-placeholder"><i class="pi pi-box"></i></div>
                    <div class="p-name">{{ p.name }}</div>
                    <div class="p-price">{{ p.sellingPrice | number }} ج.م</div>
                    <small *ngIf="p.trackStock" class="p-stock">{{ p.totalStock || 0 }} متاح</small>
                  </div>
                }
                <div *ngIf="!filteredProducts().length" class="empty-state" style="grid-column:1/-1;">
                  <i class="pi pi-box"></i><p>لا توجد منتجات</p>
                </div>
              </div>
            </div>

            <!-- Cart -->
            <div class="pos-cart">
              <h3 class="cart-title"><i class="pi pi-shopping-cart"></i> سلة البيع</h3>
              <div class="cart-meta">
                <p-dropdown [options]="branchOptions()" [(ngModel)]="cart.branchId"
                  placeholder="الفرع *" appendTo="body" styleClass="w-full"></p-dropdown>
                <p-dropdown [options]="clientOptions()" [(ngModel)]="cart.clientId"
                  placeholder="العميل (اختياري)" [filter]="true" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown>
                <p-dropdown [options]="paymentOptions" [(ngModel)]="cart.paymentMethod"
                  appendTo="body" styleClass="w-full"></p-dropdown>
                <input class="form-input" [(ngModel)]="couponCode" placeholder="كود خصم (اختياري)" style="text-transform:uppercase"/>
              </div>

              <div class="cart-items">
                <div *ngIf="!cart.items.length" class="empty-state"><i class="pi pi-shopping-cart"></i><p>السلة فارغة</p></div>
                <div class="cart-row" *ngFor="let it of cart.items; let i = index">
                  <div class="cart-row__info">
                    <strong>{{ it.productName }}</strong>
                    <span>{{ (it.unitPriceOverride ?? it.unitPrice) | number }} × </span>
                  </div>
                  <p-inputNumber [(ngModel)]="it.quantity" [min]="1" [style]="{width:'70px'}"></p-inputNumber>
                  <span class="cart-row__total">{{ (it.quantity || 0) * (it.unitPriceOverride ?? it.unitPrice ?? 0) | number }}</span>
                  <button class="action-btn danger" (click)="removeCartItem(i)"><i class="pi pi-trash"></i></button>
                </div>
              </div>

              <div class="cart-totals">
                <div><span>الإجمالي الفرعي:</span><strong>{{ subtotal() | number:'1.0-2' }}</strong></div>
                <div>
                  <span>خصم إضافي:</span>
                  <p-inputNumber [(ngModel)]="cart.extraDiscount" [min]="0" [style]="{width:'110px'}"></p-inputNumber>
                </div>
                <div class="grand"><span>الإجمالي الكلي:</span><strong>{{ grandTotal() | number:'1.0-2' }}</strong></div>
              </div>

              <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="cart.notes" placeholder="ملاحظات..."></textarea>

              <div class="cart-actions">
                <button class="btn btn-ghost" (click)="clearCart()">مسح</button>
                <button class="btn btn-primary" (click)="checkout()" [disabled]="saving() || !cart.items.length">
                  <i class="pi pi-check"></i><span>{{ saving() ? 'جارٍ...' : 'إتمام البيع' }}</span>
                </button>
              </div>
            </div>
          </div>
        </p-tabPanel>

        <!-- Sales History -->
        <p-tabPanel header="سجل المبيعات">
          <div class="toolbar">
            <p-dropdown [options]="branchOptions()" [(ngModel)]="histBranch"
              placeholder="كل الفروع" [showClear]="true" (onChange)="loadHistory()" appendTo="body"></p-dropdown>
            <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="loadHistory()"/>
            <input type="date" class="form-input" [(ngModel)]="toDate" (change)="loadHistory()"/>
          </div>
          <div class="data-card">
            <p-table [value]="sales()" [paginator]="true" [rows]="10">
              <ng-template pTemplate="header">
                <tr><th>الرقم</th><th>التاريخ</th><th>العميل</th><th>الفرع</th>
                    <th>الكاشير</th><th>طريقة الدفع</th><th>الإجمالي</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-s>
                <tr>
                  <td><strong>{{ s.saleNumber }}</strong></td>
                  <td>{{ s.createdAt | date:'yyyy-MM-dd HH:mm' }}</td>
                  <td>{{ s.clientName || '-' }}</td>
                  <td>{{ s.branchName }}</td>
                  <td>{{ s.cashierName || '-' }}</td>
                  <td><span class="badge blue">{{ payLabels[s.paymentMethod] }}</span></td>
                  <td><strong>{{ s.total | number:'1.0-2' }}</strong></td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr><td colspan="7"><div class="empty-state"><i class="pi pi-receipt"></i><p>لا توجد مبيعات</p></div></td></tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [GYM_PAGE_STYLES + `
    .pos-layout { display: grid; grid-template-columns: 1fr 400px; gap: 1rem; }
    @media (max-width: 980px) { .pos-layout { grid-template-columns: 1fr; } }
    .pos-products .search-input { margin-bottom: 1rem; }
    .product-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: .75rem; max-height: 620px; overflow-y: auto; }
    .product-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 12px; padding: .75rem; cursor: pointer;
      display:flex; flex-direction: column; gap:.35rem; transition: all .2s ease;
    }
    .product-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--primary-500); }
    .product-card.disabled { opacity:.5; cursor: not-allowed; }
    .product-card img, .product-card .img-placeholder { width: 100%; aspect-ratio: 1; border-radius: 8px; object-fit: cover; background: var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:2rem; color: var(--text-muted); }
    .p-name { font-weight: 600; font-size: .85rem; }
    .p-price { color: var(--primary-500); font-weight: 700; font-size: .95rem; }
    .p-stock { font-size:.7rem; color: var(--text-secondary); }

    .pos-cart { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 1rem; display:flex; flex-direction: column; gap: .75rem; }
    .cart-title { margin:0 0 .25rem; font-size: 1.1rem; display:flex; gap:.5rem; align-items:center; }
    .cart-meta { display:flex; flex-direction: column; gap: .5rem; }
    .cart-items { max-height: 260px; overflow-y: auto; border-top: 1px dashed var(--border-color); border-bottom: 1px dashed var(--border-color); padding: .5rem 0; }
    .cart-row { display:grid; grid-template-columns: 1fr 70px 80px 34px; gap:.5rem; align-items:center; padding:.4rem 0; border-bottom: 1px dashed var(--border-color); }
    .cart-row__info { display:flex; flex-direction: column; }
    .cart-row__info span { font-size: .75rem; color: var(--text-secondary); }
    .cart-row__total { font-weight: 600; text-align:left; }
    .cart-totals { display: flex; flex-direction: column; gap: .35rem; padding: .5rem; background: var(--bg-secondary); border-radius: 10px; }
    .cart-totals > div { display: flex; justify-content: space-between; align-items: center; }
    .cart-totals > div.grand { font-size: 1.1rem; padding-top: .5rem; border-top: 1px dashed var(--border-color); color: var(--primary-500); }
    .cart-actions { display: flex; gap: .5rem; justify-content: flex-end; }
  `]
})
export class PosSalesComponent implements OnInit {
  private svc = inject(InventoryService);
  private branchesSvc = inject(BranchesService);
  private ownerSvc = inject(OwnerService);
  private toast = inject(NotificationService);

  products = signal<Product[]>([]);
  branches = signal<Branch[]>([]);
  clients = signal<Client[]>([]);
  sales = signal<Sale[]>([]);
  saving = signal(false);

  productSearch = '';
  cart: CheckoutRequest = this.emptyCart();
  couponCode = '';
  histBranch: string | null = null;
  fromDate = ''; toDate = '';

  payLabels = PaymentMethodGymLabels;
  paymentOptions = Object.entries(PaymentMethodGymLabels).map(([v,l]) => ({ label: l, value: Number(v) as PaymentMethodEnum }));
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));
  clientOptions = computed(() => this.clients().map(c => ({ label: c.fullName || c.email || c.id, value: c.id })));
  filteredProducts = computed(() => {
    const q = this.productSearch.trim().toLowerCase();
    return this.products().filter(p => p.isActive && (!q ||
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q)));
  });

  subtotal = computed(() => this.cart.items.reduce((s, it) =>
    s + (Number(it.quantity || 0) * Number(it.unitPriceOverride ?? it.unitPrice ?? 0)), 0));
  grandTotal = computed(() => Math.max(0, this.subtotal() - Number(this.cart.extraDiscount || 0)));

  ngOnInit() {
    this.svc.listProducts({ isActive: true }).subscribe(p => this.products.set(p || []));
    this.branchesSvc.list().subscribe(b => {
      this.branches.set(b || []);
      const def = (b || []).find(x => x.isDefault) || (b || [])[0];
      if (def && !this.cart.branchId) this.cart.branchId = def.id;
    });
    this.ownerSvc.getClients().subscribe(c => this.clients.set(c || []));
    this.loadHistory();
  }

  emptyCart(): CheckoutRequest {
    return { branchId:'', paymentMethod: PaymentMethodEnum.Cash, items: [], extraDiscount: 0 };
  }

  addToCart(p: Product) {
    if (p.trackStock && !(p.totalStock || 0)) return;
    const existing = this.cart.items.find(i => i.productId === p.id);
    if (existing) existing.quantity = (existing.quantity || 0) + 1;
    else this.cart.items.push({
      productId: p.id, productName: p.name, quantity: 1,
      unitPrice: p.sellingPrice, discountAmount: 0
    });
    this.cart.items = [...this.cart.items];
  }

  removeCartItem(i: number) {
    this.cart.items.splice(i, 1);
    this.cart.items = [...this.cart.items];
  }

  clearCart() { this.cart = this.emptyCart(); this.couponCode = ''; }

  checkout() {
    if (!this.cart.branchId) { this.toast.error('اختر الفرع'); return; }
    if (!this.cart.items.length) { this.toast.error('السلة فارغة'); return; }
    this.saving.set(true);
    this.svc.checkout(this.cart).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('تم البيع بنجاح');
        this.clearCart();
        this.loadHistory();
      },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل البيع'); }
    });
  }

  loadHistory() {
    this.svc.listSales({
      branchId: this.histBranch ?? undefined,
      fromDate: this.fromDate || undefined, toDate: this.toDate || undefined
    }).subscribe({
      next: d => this.sales.set(d || []),
      error: () => this.toast.error('فشل التحميل')
    });
  }
}
