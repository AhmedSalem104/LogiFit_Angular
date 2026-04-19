import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { OperationsReportsService } from '../services/operations-reports.service';
import { BranchesService } from '../services/branches.service';
import {
  ExpensesReport, PosSalesReport, StockValuationReport,
  PayrollSummaryReport, ClassAttendanceReport, EquipmentUtilizationReport,
  BranchComparisonReport, CommissionsReport, Branch
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-operations-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TabViewModule, TableModule, DropdownModule, ButtonModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="التقارير التشغيلية" subtitle="9 تقارير شاملة لكل جوانب الجيم"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'التقارير'}]"></app-page-header>

      <div class="toolbar">
        <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="refreshAll()"/>
        <input type="date" class="form-input" [(ngModel)]="toDate" (change)="refreshAll()"/>
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchId"
          placeholder="كل الفروع" [showClear]="true" (onChange)="refreshAll()" appendTo="body"></p-dropdown>
        <button class="btn btn-secondary" (click)="refreshAll()"><i class="pi pi-refresh"></i><span>تحديث</span></button>
      </div>

      <p-tabView>
        <!-- Expenses -->
        <p-tabPanel header="المصروفات" (click)="loadExpenses()">
          <div *ngIf="expenses()" class="stats-row">
            <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-money-bill"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ expenses()!.totalExpenses | number:'1.0-0' }}</span>
                <span class="mini-stat__label">إجمالي المصروفات</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-list"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ expenses()!.expensesCount }}</span>
                <span class="mini-stat__label">عدد العمليات</span></div></div>
          </div>
          <div class="rep-grid" *ngIf="expenses()">
            <div class="data-card"><h4 class="section-title">حسب الفئة</h4>
              <p-table [value]="expenses()!.byCategory"><ng-template pTemplate="header"><tr><th>الفئة</th><th>العدد</th><th>الإجمالي</th></tr></ng-template>
                <ng-template pTemplate="body" let-c><tr><td>{{ c.categoryName }}</td><td>{{ c.count }}</td><td>{{ c.total | number:'1.0-2' }}</td></tr></ng-template>
              </p-table></div>
            <div class="data-card"><h4 class="section-title">حسب الفرع</h4>
              <p-table [value]="expenses()!.byBranch"><ng-template pTemplate="header"><tr><th>الفرع</th><th>العدد</th><th>الإجمالي</th></tr></ng-template>
                <ng-template pTemplate="body" let-b><tr><td>{{ b.branchName }}</td><td>{{ b.count }}</td><td>{{ b.total | number:'1.0-2' }}</td></tr></ng-template>
              </p-table></div>
          </div>
        </p-tabPanel>

        <!-- POS Sales -->
        <p-tabPanel header="مبيعات المتجر" (click)="loadPosSales()">
          <div *ngIf="posSales()" class="stats-row">
            <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-dollar"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ posSales()!.totalRevenue | number:'1.0-0' }}</span>
                <span class="mini-stat__label">الإيرادات</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-shopping-cart"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ posSales()!.salesCount }}</span>
                <span class="mini-stat__label">عمليات البيع</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon purple"><i class="pi pi-box"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ posSales()!.itemsSold }}</span>
                <span class="mini-stat__label">منتجات مباعة</span></div></div>
          </div>
          <div class="rep-grid" *ngIf="posSales()">
            <div class="data-card"><h4 class="section-title">أفضل المنتجات</h4>
              <p-table [value]="posSales()!.topProducts"><ng-template pTemplate="header"><tr><th>المنتج</th><th>الكمية</th><th>الإيراد</th></tr></ng-template>
                <ng-template pTemplate="body" let-p><tr><td>{{ p.productName }}</td><td>{{ p.quantitySold }}</td><td>{{ p.revenue | number:'1.0-2' }}</td></tr></ng-template>
              </p-table></div>
            <div class="data-card"><h4 class="section-title">حسب الكاشير</h4>
              <p-table [value]="posSales()!.byCashier"><ng-template pTemplate="header"><tr><th>الكاشير</th><th>العدد</th><th>الإيراد</th></tr></ng-template>
                <ng-template pTemplate="body" let-c><tr><td>{{ c.cashierName }}</td><td>{{ c.salesCount }}</td><td>{{ c.revenue | number:'1.0-2' }}</td></tr></ng-template>
              </p-table></div>
          </div>
        </p-tabPanel>

        <!-- Stock Valuation -->
        <p-tabPanel header="تقييم المخزون" (click)="loadStock()">
          <div *ngIf="stock()" class="stats-row">
            <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-box"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ stock()!.productsCount }}</span>
                <span class="mini-stat__label">منتج</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-exclamation-triangle"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ stock()!.lowStockCount }}</span>
                <span class="mini-stat__label">منخفضة المخزون</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-dollar"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ stock()!.totalCostValue | number:'1.0-0' }}</span>
                <span class="mini-stat__label">قيمة التكلفة</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-chart-line"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ stock()!.totalRetailValue | number:'1.0-0' }}</span>
                <span class="mini-stat__label">قيمة البيع</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon purple"><i class="pi pi-arrow-up"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ stock()!.potentialProfit | number:'1.0-0' }}</span>
                <span class="mini-stat__label">ربح محتمل</span></div></div>
          </div>
          <div class="data-card" *ngIf="stock()">
            <p-table [value]="stock()!.products" [paginator]="true" [rows]="15">
              <ng-template pTemplate="header"><tr><th>المنتج</th><th>SKU</th><th>الكمية</th><th>قيمة التكلفة</th><th>قيمة البيع</th></tr></ng-template>
              <ng-template pTemplate="body" let-p><tr><td>{{ p.productName }}</td><td><code>{{ p.sku }}</code></td><td>{{ p.quantity }}</td><td>{{ p.costValue | number:'1.0-2' }}</td><td>{{ p.retailValue | number:'1.0-2' }}</td></tr></ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <!-- Payroll Summary -->
        <p-tabPanel header="ملخص الرواتب" (click)="loadPayroll()">
          <div class="toolbar">
            <input type="number" class="form-input" [(ngModel)]="payrollYear" (change)="loadPayroll()" style="max-width:100px"/>
            <input type="number" class="form-input" [(ngModel)]="payrollMonth" (change)="loadPayroll()" min="1" max="12" style="max-width:80px"/>
          </div>
          <div *ngIf="payroll()" class="stats-row">
            <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-money-bill"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ payroll()!.totalBaseSalaries | number:'1.0-0' }}</span>
                <span class="mini-stat__label">الرواتب الأساسية</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon purple"><i class="pi pi-percentage"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ payroll()!.totalCommissions | number:'1.0-0' }}</span>
                <span class="mini-stat__label">العمولات</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-star"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ payroll()!.totalBonuses | number:'1.0-0' }}</span>
                <span class="mini-stat__label">المكافآت</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-minus"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ payroll()!.totalDeductions | number:'1.0-0' }}</span>
                <span class="mini-stat__label">الخصومات</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon cyan"><i class="pi pi-check-circle"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ payroll()!.totalNetSalaries | number:'1.0-0' }}</span>
                <span class="mini-stat__label">الصافي</span></div></div>
          </div>
        </p-tabPanel>

        <!-- Class Attendance -->
        <p-tabPanel header="حضور الحصص" (click)="loadClassAttendance()">
          <div *ngIf="classAtt()" class="stats-row">
            <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-calendar"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ classAtt()!.totalSchedulesHeld }}</span>
                <span class="mini-stat__label">حصص منعقدة</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon purple"><i class="pi pi-bookmark"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ classAtt()!.totalBookings }}</span>
                <span class="mini-stat__label">حجوزات</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ classAtt()!.attendanceRatePercent | number:'1.0-1' }}%</span>
                <span class="mini-stat__label">معدل الحضور</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-percentage"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ classAtt()!.averageFillRatePercent | number:'1.0-1' }}%</span>
                <span class="mini-stat__label">متوسط الامتلاء</span></div></div>
          </div>
          <div class="rep-grid" *ngIf="classAtt()">
            <div class="data-card"><h4 class="section-title">أكثر الحصص طلباً</h4>
              <p-table [value]="classAtt()!.topClasses"><ng-template pTemplate="header"><tr><th>الحصة</th><th>حجوزات</th><th>معدل الحضور</th></tr></ng-template>
                <ng-template pTemplate="body" let-c><tr><td>{{ c.className }}</td><td>{{ c.bookingsCount }}</td><td>{{ c.attendanceRate | number:'1.0-1' }}%</td></tr></ng-template>
              </p-table></div>
            <div class="data-card"><h4 class="section-title">أداء المدربين</h4>
              <p-table [value]="classAtt()!.coachStats"><ng-template pTemplate="header"><tr><th>المدرب</th><th>الحصص</th><th>إجمالي الحضور</th></tr></ng-template>
                <ng-template pTemplate="body" let-c><tr><td>{{ c.coachName }}</td><td>{{ c.classesHeld }}</td><td>{{ c.totalAttendance }}</td></tr></ng-template>
              </p-table></div>
          </div>
        </p-tabPanel>

        <!-- Equipment Utilization -->
        <p-tabPanel header="استخدام الأجهزة" (click)="loadEquipment()">
          <div *ngIf="equipment()" class="stats-row">
            <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-cog"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ equipment()!.totalEquipment }}</span>
                <span class="mini-stat__label">إجمالي الأجهزة</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ equipment()!.activeCount }}</span>
                <span class="mini-stat__label">نشط</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-wrench"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ equipment()!.underMaintenanceCount }}</span>
                <span class="mini-stat__label">تحت الصيانة</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-dollar"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ equipment()!.totalMaintenanceCost | number:'1.0-0' }}</span>
                <span class="mini-stat__label">تكلفة الصيانة</span></div></div>
          </div>
          <div class="data-card" *ngIf="equipment()"><h4 class="section-title">الأجهزة الأكثر تكلفة في الصيانة</h4>
            <p-table [value]="equipment()!.mostCostlyEquipment">
              <ng-template pTemplate="header"><tr><th>الجهاز</th><th>عدد البلاغات</th><th>إجمالي التكلفة</th></tr></ng-template>
              <ng-template pTemplate="body" let-e><tr><td>{{ e.equipmentName }}</td><td>{{ e.ticketsCount }}</td><td>{{ e.totalCost | number:'1.0-2' }}</td></tr></ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <!-- Branch Comparison -->
        <p-tabPanel header="مقارنة الفروع" (click)="loadBranchComp()">
          <div class="data-card" *ngIf="branchComp()">
            <p-table [value]="branchComp()!.branches">
              <ng-template pTemplate="header">
                <tr><th>الفرع</th><th>الإيرادات</th><th>المصروفات</th><th>صافي الربح</th>
                    <th>حضور</th><th>حصص منعقدة</th><th>موظفين</th><th>أعضاء</th></tr>
              </ng-template>
              <ng-template pTemplate="body" let-b>
                <tr>
                  <td><strong>{{ b.branchName }}</strong></td>
                  <td class="text-green">{{ b.revenue | number:'1.0-0' }}</td>
                  <td class="text-red">{{ b.expenses | number:'1.0-0' }}</td>
                  <td><strong [class.text-green]="b.netProfit > 0" [class.text-red]="b.netProfit < 0">{{ b.netProfit | number:'1.0-0' }}</strong></td>
                  <td>{{ b.checkIns }}</td>
                  <td>{{ b.classesHeld }}</td>
                  <td>{{ b.employees }}</td>
                  <td>{{ b.activeMembers }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <!-- Commissions -->
        <p-tabPanel header="العمولات" (click)="loadCommissions()">
          <div *ngIf="commissions()" class="stats-row">
            <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-dollar"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ commissions()!.totalEarned | number:'1.0-0' }}</span>
                <span class="mini-stat__label">المستحق</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ commissions()!.totalPaid | number:'1.0-0' }}</span>
                <span class="mini-stat__label">المدفوع</span></div></div>
            <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-clock"></i></div>
              <div class="mini-stat__content"><span class="mini-stat__value">{{ commissions()!.totalPending | number:'1.0-0' }}</span>
                <span class="mini-stat__label">المعلق</span></div></div>
          </div>
          <div class="rep-grid" *ngIf="commissions()">
            <div class="data-card"><h4 class="section-title">حسب الموظف</h4>
              <p-table [value]="commissions()!.byEmployee"><ng-template pTemplate="header"><tr><th>الموظف</th><th>عدد</th><th>الإجمالي</th></tr></ng-template>
                <ng-template pTemplate="body" let-e><tr><td>{{ e.employeeName }}</td><td>{{ e.count }}</td><td>{{ e.total | number:'1.0-2' }}</td></tr></ng-template>
              </p-table></div>
            <div class="data-card"><h4 class="section-title">حسب المصدر</h4>
              <p-table [value]="commissions()!.bySource"><ng-template pTemplate="header"><tr><th>المصدر</th><th>عدد</th><th>الإجمالي</th></tr></ng-template>
                <ng-template pTemplate="body" let-s><tr><td>{{ s.source }}</td><td>{{ s.count }}</td><td>{{ s.total | number:'1.0-2' }}</td></tr></ng-template>
              </p-table></div>
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [GYM_PAGE_STYLES + `
    .rep-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1rem; }
    .section-title { padding: 1rem; margin: 0; }
    .text-green { color:#10b981; }
    .text-red { color:#ef4444; }
  `]
})
export class OperationsReportsComponent implements OnInit {
  private svc = inject(OperationsReportsService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);

  expenses = signal<ExpensesReport | null>(null);
  posSales = signal<PosSalesReport | null>(null);
  stock = signal<StockValuationReport | null>(null);
  payroll = signal<PayrollSummaryReport | null>(null);
  classAtt = signal<ClassAttendanceReport | null>(null);
  equipment = signal<EquipmentUtilizationReport | null>(null);
  branchComp = signal<BranchComparisonReport | null>(null);
  commissions = signal<CommissionsReport | null>(null);
  branches = signal<Branch[]>([]);

  fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0,10);
  toDate = new Date().toISOString().substring(0,10);
  branchId: string | null = null;
  payrollYear = new Date().getFullYear();
  payrollMonth = new Date().getMonth() + 1;

  get branchOptions() { return () => this.branches().map(b => ({ label: b.name, value: b.id })); }

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.refreshAll();
  }

  refreshAll() {
    this.loadExpenses(); this.loadPosSales(); this.loadStock();
    this.loadPayroll(); this.loadClassAttendance(); this.loadEquipment();
    this.loadBranchComp(); this.loadCommissions();
  }

  loadExpenses() {
    this.svc.expenses({ fromDate: this.fromDate, toDate: this.toDate, branchId: this.branchId ?? undefined })
      .subscribe({ next: d => this.expenses.set(d), error: () => {} });
  }
  loadPosSales() {
    this.svc.posSales({ fromDate: this.fromDate, toDate: this.toDate, branchId: this.branchId ?? undefined })
      .subscribe({ next: d => this.posSales.set(d), error: () => {} });
  }
  loadStock() {
    this.svc.stockValuation(this.branchId ?? undefined)
      .subscribe({ next: d => this.stock.set(d), error: () => {} });
  }
  loadPayroll() {
    this.svc.payrollSummary({ year: this.payrollYear, month: this.payrollMonth })
      .subscribe({ next: d => this.payroll.set(d), error: () => {} });
  }
  loadClassAttendance() {
    this.svc.classAttendance({ fromDate: this.fromDate, toDate: this.toDate, branchId: this.branchId ?? undefined })
      .subscribe({ next: d => this.classAtt.set(d), error: () => {} });
  }
  loadEquipment() {
    this.svc.equipmentUtilization(this.branchId ?? undefined)
      .subscribe({ next: d => this.equipment.set(d), error: () => {} });
  }
  loadBranchComp() {
    this.svc.branchComparison({ fromDate: this.fromDate, toDate: this.toDate })
      .subscribe({ next: d => this.branchComp.set(d), error: () => {} });
  }
  loadCommissions() {
    this.svc.commissions({ fromDate: this.fromDate, toDate: this.toDate })
      .subscribe({ next: d => this.commissions.set(d), error: () => {} });
  }
}
