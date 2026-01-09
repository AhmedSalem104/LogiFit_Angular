import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, SubscriptionPlan, ClientSubscription, Trainee } from '../../coach/services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subscriptions-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    ToastModule,
    TagModule,
    TabViewModule,
    TooltipModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="subscriptions-page">
      <app-page-header
        title="الاشتراكات"
        subtitle="إدارة باقات واشتراكات العملاء"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'الاشتراكات'}]"
      >
        <div class="header-actions">
          <button class="btn btn-outline" (click)="openPlanDialog()">
            <i class="pi pi-box"></i>
            <span>إضافة باقة</span>
          </button>
          <button class="btn btn-primary" (click)="openSubscriptionDialog()">
            <i class="pi pi-plus"></i>
            <span>اشتراك جديد</span>
          </button>
        </div>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card blue">
          <div class="stat-icon"><i class="pi pi-credit-card"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ subscriptions().length }}</span>
            <span class="stat-label">إجمالي الاشتراكات</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">نشط</span>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon"><i class="pi pi-pause-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ frozenCount() }}</span>
            <span class="stat-label">مجمد</span>
          </div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ expiredCount() }}</span>
            <span class="stat-label">منتهي</span>
          </div>
        </div>
      </div>

      <p-tabView>
        <!-- Subscriptions Tab -->
        <p-tabPanel header="اشتراكات العملاء">
          <!-- Loading State -->
          <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

          <!-- Subscriptions Table -->
          <div class="table-card card" *ngIf="!loading()">
            <div class="table-toolbar">
              <div class="search-box">
                <i class="pi pi-search"></i>
                <input
                  type="text"
                  pInputText
                  [(ngModel)]="searchQuery"
                  placeholder="البحث باسم العميل..."
                />
              </div>
              <div class="filter-chips">
                <button
                  class="chip"
                  [class.active]="selectedStatus === null"
                  (click)="filterByStatus(null)"
                >
                  الكل
                </button>
                <button
                  class="chip active-chip"
                  [class.active]="selectedStatus === 0"
                  (click)="filterByStatus(0)"
                >
                  <i class="pi pi-check-circle"></i>
                  نشط
                </button>
                <button
                  class="chip frozen-chip"
                  [class.active]="selectedStatus === 2"
                  (click)="filterByStatus(2)"
                >
                  <i class="pi pi-pause-circle"></i>
                  مجمد
                </button>
                <button
                  class="chip expired-chip"
                  [class.active]="selectedStatus === 1"
                  (click)="filterByStatus(1)"
                >
                  <i class="pi pi-clock"></i>
                  منتهي
                </button>
                <button
                  class="chip cancelled-chip"
                  [class.active]="selectedStatus === 3"
                  (click)="filterByStatus(3)"
                >
                  <i class="pi pi-times-circle"></i>
                  ملغي
                </button>
              </div>
            </div>

            <p-table
              [value]="filteredSubscriptions()"
              [paginator]="true"
              [rows]="10"
              [rowsPerPageOptions]="[5, 10, 25, 50]"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} اشتراك"
              styleClass="subscriptions-table"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th pSortableColumn="clientName">العميل <p-sortIcon field="clientName"></p-sortIcon></th>
                  <th pSortableColumn="planName">الباقة <p-sortIcon field="planName"></p-sortIcon></th>
                  <th pSortableColumn="startDate">تاريخ البدء <p-sortIcon field="startDate"></p-sortIcon></th>
                  <th pSortableColumn="endDate">تاريخ الانتهاء <p-sortIcon field="endDate"></p-sortIcon></th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-sub>
                <tr>
                  <td>
                    <div class="client-info">
                      <div class="client-avatar">{{ getInitials(sub.clientName || '') }}</div>
                      <div class="client-details">
                        <span class="client-name">{{ sub.clientName || 'غير محدد' }}</span>
                        <span class="coach-name" *ngIf="sub.salesCoachName">
                          <i class="pi pi-user"></i> {{ sub.salesCoachName }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="plan-badge">{{ sub.planName || 'غير محدد' }}</span>
                  </td>
                  <td>{{ sub.startDate | date:'yyyy-MM-dd' }}</td>
                  <td>
                    <span [class.expiring-soon]="isExpiringSoon(sub.endDate)">
                      {{ sub.endDate | date:'yyyy-MM-dd' }}
                    </span>
                  </td>
                  <td>
                    <p-tag
                      [value]="getStatusLabel(sub.status)"
                      [severity]="getStatusSeverity(sub.status)"
                    ></p-tag>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        class="action-btn freeze-btn"
                        (click)="openFreezeDialog(sub)"
                        [disabled]="sub.status !== 0"
                        pTooltip="تجميد"
                        tooltipPosition="top"
                      >
                        <i class="pi pi-pause"></i>
                      </button>
                      <button
                        class="action-btn cancel-btn"
                        (click)="cancelSubscription(sub)"
                        [disabled]="sub.status === 3 || sub.status === 1"
                        pTooltip="إلغاء"
                        tooltipPosition="top"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6">
                    <div class="empty-state">
                      <i class="pi pi-inbox"></i>
                      <h4>لا توجد اشتراكات</h4>
                      <p>لم يتم العثور على اشتراكات مطابقة</p>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </p-tabPanel>

        <!-- Plans Tab -->
        <p-tabPanel header="باقات الاشتراك">
          <div class="plans-grid">
            <div class="plan-card" *ngFor="let plan of plans()">
              <div class="plan-header">
                <h3>{{ plan.name }}</h3>
                <span class="plan-duration">{{ plan.durationMonths }} شهر</span>
              </div>
              <div class="plan-price">
                <span class="amount">{{ plan.price }}</span>
                <span class="currency">جنيه</span>
              </div>
              <div class="plan-features">
                <div class="feature">
                  <i class="pi pi-check"></i>
                  <span>الوصول لجميع التمارين</span>
                </div>
                <div class="feature">
                  <i class="pi pi-check"></i>
                  <span>خطة غذائية مخصصة</span>
                </div>
                <div class="feature">
                  <i class="pi pi-check"></i>
                  <span>متابعة مع المدرب</span>
                </div>
              </div>
            </div>

            <!-- Add Plan Card -->
            <div class="plan-card add-plan-card" (click)="openPlanDialog()">
              <i class="pi pi-plus-circle"></i>
              <span>إضافة باقة جديدة</span>
            </div>
          </div>
        </p-tabPanel>
      </p-tabView>

      <!-- New Subscription Dialog -->
      <p-dialog
        [(visible)]="subscriptionDialogVisible"
        header="اشتراك جديد"
        [modal]="true"
        [style]="{width: '500px'}"
      >
        <div class="dialog-content">
          <div class="form-group">
            <label>العميل *</label>
            <p-dropdown
              [options]="clientOptions"
              [(ngModel)]="subscriptionForm.clientId"
              placeholder="اختر العميل"
              [filter]="true"
              filterPlaceholder="ابحث..."
              [style]="{width: '100%'}"
            ></p-dropdown>
          </div>

          <div class="form-group">
            <label>الباقة *</label>
            <p-dropdown
              [options]="planOptions"
              [(ngModel)]="subscriptionForm.planId"
              placeholder="اختر الباقة"
              [style]="{width: '100%'}"
            ></p-dropdown>
          </div>

          <div class="form-group">
            <label>تاريخ البدء *</label>
            <p-calendar
              [(ngModel)]="subscriptionForm.startDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              [style]="{width: '100%'}"
            ></p-calendar>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="subscriptionDialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="saveSubscription()" [disabled]="saving()">
            <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
            حفظ
          </button>
        </ng-template>
      </p-dialog>

      <!-- New Plan Dialog -->
      <p-dialog
        [(visible)]="planDialogVisible"
        header="باقة جديدة"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <div class="dialog-content">
          <div class="form-group">
            <label>اسم الباقة *</label>
            <input type="text" pInputText [(ngModel)]="planForm.name" placeholder="مثال: الباقة الشهرية" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>السعر (جنيه) *</label>
              <p-inputNumber [(ngModel)]="planForm.price" [min]="0" mode="currency" currency="EGP" locale="ar-EG"></p-inputNumber>
            </div>

            <div class="form-group">
              <label>المدة (شهور) *</label>
              <p-inputNumber [(ngModel)]="planForm.durationMonths" [min]="1" [max]="24"></p-inputNumber>
            </div>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="planDialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="savePlan()" [disabled]="saving()">
            <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
            حفظ
          </button>
        </ng-template>
      </p-dialog>

      <!-- Freeze Dialog -->
      <p-dialog
        [(visible)]="freezeDialogVisible"
        header="تجميد الاشتراك"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <div class="dialog-content">
          <div class="freeze-info">
            <i class="pi pi-info-circle"></i>
            <p>سيتم تمديد تاريخ انتهاء الاشتراك تلقائياً بعدد أيام التجميد</p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>من تاريخ *</label>
              <p-calendar
                [(ngModel)]="freezeForm.startDate"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [style]="{width: '100%'}"
              ></p-calendar>
            </div>

            <div class="form-group">
              <label>إلى تاريخ *</label>
              <p-calendar
                [(ngModel)]="freezeForm.endDate"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [style]="{width: '100%'}"
              ></p-calendar>
            </div>
          </div>

          <div class="form-group">
            <label>السبب</label>
            <input type="text" pInputText [(ngModel)]="freezeForm.reason" placeholder="سبب التجميد (اختياري)" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="freezeDialogVisible = false">إلغاء</button>
          <button class="btn btn-warning" (click)="saveFreeze()" [disabled]="saving()">
            <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
            تجميد
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .subscriptions-page {
      max-width: 1400px;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;

      &.blue .stat-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.green .stat-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      &.orange .stat-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.red .stat-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-toolbar {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .search-box {
      position: relative;
      max-width: 400px;

      i {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }

      input {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .chip {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;

      &:hover { border-color: #3b82f6; color: #3b82f6; }
      &.active { background: #3b82f6; border-color: #3b82f6; color: white; }

      &.active-chip.active { background: #22c55e; border-color: #22c55e; }
      &.frozen-chip.active { background: #f59e0b; border-color: #f59e0b; }
      &.expired-chip.active { background: #6b7280; border-color: #6b7280; }
      &.cancelled-chip.active { background: #ef4444; border-color: #ef4444; }
    }

    :host ::ng-deep .subscriptions-table {
      .p-datatable-thead > tr > th {
        background: var(--bg-secondary);
        color: var(--text-secondary);
        font-weight: 600;
        font-size: 0.85rem;
        padding: 1rem;
        border: none;
        border-bottom: 1px solid var(--border-color);
      }

      .p-datatable-tbody > tr {
        &:hover { background: var(--bg-secondary); }
        > td {
          padding: 1rem;
          border: none;
          border-bottom: 1px solid var(--border-color);
        }
      }

      .p-paginator {
        padding: 1rem;
        border: none;
        background: transparent;
      }
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .client-details {
      display: flex;
      flex-direction: column;
    }

    .client-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .coach-name {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .plan-badge {
      padding: 0.35rem 0.75rem;
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .expiring-soon {
      color: #f59e0b;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      &.freeze-btn {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        &:hover:not(:disabled) { background: #f59e0b; color: white; }
      }

      &.cancel-btn {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        &:hover:not(:disabled) { background: #ef4444; color: white; }
      }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-muted);

      i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
      h4 { color: var(--text-primary); margin: 0 0 0.5rem; }
      p { margin: 0; }
    }

    /* Plans Grid */
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      padding: 1rem 0;
    }

    .plan-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s;

      &:hover {
        border-color: #8b5cf6;
        box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
      }

      &.add-plan-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 250px;
        cursor: pointer;
        border-style: dashed;
        color: var(--text-muted);

        i { font-size: 3rem; margin-bottom: 1rem; }
        &:hover { color: #8b5cf6; border-color: #8b5cf6; }
      }
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary);
      }
    }

    .plan-duration {
      padding: 0.25rem 0.75rem;
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .plan-price {
      text-align: center;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1rem;

      .amount {
        font-size: 2.5rem;
        font-weight: 700;
        color: #8b5cf6;
      }

      .currency {
        font-size: 1rem;
        color: var(--text-secondary);
        margin-right: 0.25rem;
      }
    }

    .plan-features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        color: #22c55e;
        font-size: 0.85rem;
      }
    }

    /* Dialog */
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 500;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      input, :host ::ng-deep .p-dropdown, :host ::ng-deep .p-calendar, :host ::ng-deep .p-inputnumber {
        width: 100%;
      }
    }

    .freeze-info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(245, 158, 11, 0.1);
      border-radius: 10px;
      color: #f59e0b;

      i { font-size: 1.25rem; margin-top: 2px; }
      p { margin: 0; font-size: 0.9rem; }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &.btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        &:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        &:hover { border-color: #3b82f6; color: #3b82f6; }
      }

      &.btn-warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        &:hover { background: linear-gradient(135deg, #d97706, #b45309); }
      }

      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .form-row { grid-template-columns: 1fr; }
      .header-actions { flex-direction: column; }
    }
  `]
})
export class SubscriptionsListComponent implements OnInit {
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  subscriptions = signal<ClientSubscription[]>([]);
  plans = signal<SubscriptionPlan[]>([]);
  clients = signal<Trainee[]>([]);

  searchQuery = '';
  selectedStatus: number | null = null;

  // Dialogs
  subscriptionDialogVisible = false;
  planDialogVisible = false;
  freezeDialogVisible = false;
  selectedSubscription: ClientSubscription | null = null;

  subscriptionForm = {
    clientId: '',
    planId: '',
    startDate: new Date()
  };

  planForm = {
    name: '',
    price: 0,
    durationMonths: 1
  };

  freezeForm = {
    startDate: new Date(),
    endDate: new Date(),
    reason: ''
  };

  clientOptions: { label: string; value: string }[] = [];
  planOptions: { label: string; value: string }[] = [];

  // Computed stats
  activeCount = computed(() => this.subscriptions().filter(s => s.status === 0).length);
  frozenCount = computed(() => this.subscriptions().filter(s => s.status === 2).length);
  expiredCount = computed(() => this.subscriptions().filter(s => s.status === 1).length);
  cancelledCount = computed(() => this.subscriptions().filter(s => s.status === 3).length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Load subscriptions
    this.coachService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Mock data for development
        this.subscriptions.set([
          { id: '1', clientId: 'c1', clientName: 'أحمد محمد', planId: 'p1', planName: 'الباقة الشهرية', startDate: '2024-01-01', endDate: '2024-02-01', status: 0, salesCoachName: 'محمد المدرب' },
          { id: '2', clientId: 'c2', clientName: 'خالد علي', planId: 'p2', planName: 'الباقة ربع السنوية', startDate: '2024-01-15', endDate: '2024-04-15', status: 0 },
          { id: '3', clientId: 'c3', clientName: 'محمود حسن', planId: 'p1', planName: 'الباقة الشهرية', startDate: '2023-12-01', endDate: '2024-01-01', status: 1 },
          { id: '4', clientId: 'c4', clientName: 'يوسف كريم', planId: 'p3', planName: 'الباقة السنوية', startDate: '2024-01-10', endDate: '2025-01-10', status: 2 },
        ]);
        this.loading.set(false);
      }
    });

    // Load plans
    this.coachService.getSubscriptionPlans().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.planOptions = data.map(p => ({ label: `${p.name} - ${p.price} جنيه`, value: p.id }));
      },
      error: () => {
        const mockPlans: SubscriptionPlan[] = [
          { id: 'p1', name: 'الباقة الشهرية', price: 299, durationMonths: 1 },
          { id: 'p2', name: 'الباقة ربع السنوية', price: 799, durationMonths: 3 },
          { id: 'p3', name: 'الباقة السنوية', price: 2499, durationMonths: 12 }
        ];
        this.plans.set(mockPlans);
        this.planOptions = mockPlans.map(p => ({ label: `${p.name} - ${p.price} جنيه`, value: p.id }));
      }
    });

    // Load clients
    this.coachService.getTrainees().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.clientOptions = data.map(c => ({
          label: c.clientName || c.fullName || c.profile?.fullName || '',
          value: c.id
        }));
      },
      error: () => {
        this.clientOptions = [
          { label: 'أحمد محمد', value: 'c1' },
          { label: 'خالد علي', value: 'c2' },
          { label: 'محمود حسن', value: 'c3' }
        ];
      }
    });
  }

  filteredSubscriptions(): ClientSubscription[] {
    let result = this.subscriptions();

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        (s.clientName || '').toLowerCase().includes(query) ||
        (s.planName || '').toLowerCase().includes(query)
      );
    }

    if (this.selectedStatus !== null) {
      result = result.filter(s => s.status === this.selectedStatus);
    }

    return result;
  }

  filterByStatus(status: number | null): void {
    this.selectedStatus = status;
  }

  getInitials(name: string): string {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getStatusLabel(status: number): string {
    const labels: Record<number, string> = {
      0: 'نشط',
      1: 'منتهي',
      2: 'مجمد',
      3: 'ملغي'
    };
    return labels[status] || 'غير معروف';
  }

  getStatusSeverity(status: number): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const severities: Record<number, 'success' | 'warning' | 'danger' | 'secondary'> = {
      0: 'success',
      1: 'secondary',
      2: 'warning',
      3: 'danger'
    };
    return severities[status] || 'secondary';
  }

  isExpiringSoon(endDate: string): boolean {
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  }

  openSubscriptionDialog(): void {
    this.subscriptionForm = {
      clientId: '',
      planId: '',
      startDate: new Date()
    };
    this.subscriptionDialogVisible = true;
  }

  openPlanDialog(): void {
    this.planForm = {
      name: '',
      price: 0,
      durationMonths: 1
    };
    this.planDialogVisible = true;
  }

  openFreezeDialog(subscription: ClientSubscription): void {
    this.selectedSubscription = subscription;
    this.freezeForm = {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      reason: ''
    };
    this.freezeDialogVisible = true;
  }

  saveSubscription(): void {
    if (!this.subscriptionForm.clientId || !this.subscriptionForm.planId) {
      this.notificationService.warn('يرجى اختيار العميل والباقة');
      return;
    }

    this.saving.set(true);
    const startDate = this.subscriptionForm.startDate instanceof Date
      ? this.subscriptionForm.startDate.toISOString().split('T')[0]
      : this.subscriptionForm.startDate;

    this.coachService.createSubscription({
      clientId: this.subscriptionForm.clientId,
      planId: this.subscriptionForm.planId,
      startDate
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.subscriptionDialogVisible = false;
        this.notificationService.success('تم إنشاء الاشتراك بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.error('حدث خطأ أثناء إنشاء الاشتراك');
        console.error(err);
      }
    });
  }

  savePlan(): void {
    if (!this.planForm.name || !this.planForm.price || !this.planForm.durationMonths) {
      this.notificationService.warn('يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    this.saving.set(true);
    this.coachService.createSubscriptionPlan({
      name: this.planForm.name,
      price: this.planForm.price,
      durationMonths: this.planForm.durationMonths
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.planDialogVisible = false;
        this.notificationService.success('تم إنشاء الباقة بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.error('حدث خطأ أثناء إنشاء الباقة');
        console.error(err);
      }
    });
  }

  saveFreeze(): void {
    if (!this.selectedSubscription) return;

    if (!this.freezeForm.startDate || !this.freezeForm.endDate) {
      this.notificationService.warn('يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    this.saving.set(true);
    const startDate = this.freezeForm.startDate instanceof Date
      ? this.freezeForm.startDate.toISOString().split('T')[0]
      : this.freezeForm.startDate;
    const endDate = this.freezeForm.endDate instanceof Date
      ? this.freezeForm.endDate.toISOString().split('T')[0]
      : this.freezeForm.endDate;

    this.coachService.freezeSubscription(this.selectedSubscription.id, {
      startDate,
      endDate,
      reason: this.freezeForm.reason || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.freezeDialogVisible = false;
        this.notificationService.success('تم تجميد الاشتراك بنجاح');
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.error('حدث خطأ أثناء تجميد الاشتراك');
        console.error(err);
      }
    });
  }

  cancelSubscription(subscription: ClientSubscription): void {
    Swal.fire({
      title: 'تأكيد الإلغاء',
      text: `هل أنت متأكد من إلغاء اشتراك "${subscription.clientName}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، إلغاء',
      cancelButtonText: 'تراجع',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.coachService.cancelSubscription(subscription.id).subscribe({
          next: () => {
            this.notificationService.success('تم إلغاء الاشتراك بنجاح');
            this.loadData();
          },
          error: (err) => {
            this.notificationService.error('حدث خطأ أثناء إلغاء الاشتراك');
            console.error(err);
          }
        });
      }
    });
  }
}
