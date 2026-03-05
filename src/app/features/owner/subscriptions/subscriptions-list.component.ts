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
import { InputSwitchModule } from 'primeng/inputswitch';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import {
  OwnerService,
  ClientSubscription,
  SubscriptionPlan,
  Client,
  SubscriptionStatus,
  PaymentMethod,
  StatusLabels,
  PaymentMethodLabels
} from '../services/owner.service';
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
    InputSwitchModule,
    TagModule,
    TooltipModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="subscriptions-page">
      <app-page-header
        title="إدارة الاشتراكات"
        subtitle="إدارة اشتراكات العملاء والدفعات والتجميد"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'الاشتراكات'}]"
      >
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openSubscriptionDialog()">
            <i class="pi pi-plus"></i>
            <span>اشتراك جديد</span>
          </button>
        </div>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card" [class.active-stat]="selectedStatus === null" (click)="filterByStatus(null)">
          <div class="stat-icon blue"><i class="pi pi-credit-card"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ subscriptions().length }}</span>
            <span class="stat-label">الكل</span>
          </div>
        </div>
        <div class="stat-card" [class.active-stat]="selectedStatus === 1" (click)="filterByStatus(1)">
          <div class="stat-icon green"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">نشط</span>
          </div>
        </div>
        <div class="stat-card" [class.active-stat]="selectedStatus === 2" (click)="filterByStatus(2)">
          <div class="stat-icon orange"><i class="pi pi-pause-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ suspendedCount() }}</span>
            <span class="stat-label">مجمد</span>
          </div>
        </div>
        <div class="stat-card" [class.active-stat]="selectedStatus === 4" (click)="filterByStatus(4)">
          <div class="stat-icon gray"><i class="pi pi-clock"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ expiredCount() }}</span>
            <span class="stat-label">منتهي</span>
          </div>
        </div>
        <div class="stat-card" [class.active-stat]="selectedStatus === 5" (click)="filterByStatus(5)">
          <div class="stat-icon red"><i class="pi pi-times-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ cancelledCount() }}</span>
            <span class="stat-label">ملغي</span>
          </div>
        </div>
      </div>

      <!-- Expiring Alert -->
      @if (expiringCount() > 0) {
        <div class="expiring-alert">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ expiringCount() }} اشتراك ستنتهي خلال 7 أيام</span>
          <button class="alert-btn" (click)="showExpiringOnly = !showExpiringOnly">
            {{ showExpiringOnly ? 'عرض الكل' : 'عرض المنتهية قريباً' }}
          </button>
        </div>
      }

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table" [rows]="5"></app-loading-skeleton>

      <!-- Subscriptions Table -->
      <div class="table-card" *ngIf="!loading()">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch()"
              placeholder="البحث باسم العميل أو الموبايل..."
            />
          </div>
          <div class="toolbar-filters">
            <p-dropdown
              [options]="planFilterOptions"
              [(ngModel)]="selectedPlanFilter"
              (onChange)="loadSubscriptions()"
              placeholder="كل الباقات"
              [style]="{minWidth: '180px'}"
              [showClear]="true"
            ></p-dropdown>
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
          [rowHover]="true"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="clientName">العميل <p-sortIcon field="clientName"></p-sortIcon></th>
              <th pSortableColumn="planName">الباقة <p-sortIcon field="planName"></p-sortIcon></th>
              <th pSortableColumn="startDate">الفترة <p-sortIcon field="startDate"></p-sortIcon></th>
              <th>المدفوعات</th>
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
                    @if (sub.salesCoachName) {
                      <span class="coach-name">
                        <i class="pi pi-user"></i> {{ sub.salesCoachName }}
                      </span>
                    }
                  </div>
                </div>
              </td>
              <td>
                <span class="plan-badge">{{ sub.planName || 'غير محدد' }}</span>
              </td>
              <td>
                <div class="date-range">
                  <span class="date">{{ sub.startDate | date:'yyyy-MM-dd' }}</span>
                  <i class="pi pi-arrow-left date-arrow"></i>
                  <span class="date" [class.expiring-soon]="isExpiringSoon(sub)">
                    {{ sub.endDate | date:'yyyy-MM-dd' }}
                  </span>
                </div>
                @if (sub.remainingDays !== undefined && sub.status === 1) {
                  <span class="remaining-days" [class.warning]="sub.remainingDays <= 7">
                    {{ sub.remainingDays }} يوم متبقي
                  </span>
                }
              </td>
              <td>
                <div class="payment-info">
                  <span class="payment-amount">{{ sub.amountPaid || 0 | number:'1.0-0' }} / {{ sub.totalAmount || 0 | number:'1.0-0' }}</span>
                  @if (sub.remainingAmount && sub.remainingAmount > 0) {
                    <span class="payment-remaining">متبقي {{ sub.remainingAmount | number:'1.0-0' }}</span>
                  }
                  @if (sub.isPaid) {
                    <span class="paid-badge"><i class="pi pi-check"></i> مدفوع</span>
                  }
                  @if (sub.discount && sub.discount > 0) {
                    <span class="discount-badge">خصم {{ sub.discount | number:'1.0-0' }}</span>
                  }
                </div>
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
                    class="action-btn detail-btn"
                    (click)="viewDetails(sub)"
                    pTooltip="التفاصيل"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  @if (sub.remainingAmount && sub.remainingAmount > 0) {
                    <button
                      class="action-btn payment-btn"
                      (click)="openPaymentDialog(sub)"
                      pTooltip="إضافة دفعة"
                      tooltipPosition="top"
                    >
                      <i class="pi pi-wallet"></i>
                    </button>
                  }
                  <button
                    class="action-btn renew-btn"
                    (click)="openRenewDialog(sub)"
                    [disabled]="sub.status === 1"
                    pTooltip="تجديد"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-refresh"></i>
                  </button>
                  <button
                    class="action-btn freeze-btn"
                    (click)="openFreezeDialog(sub)"
                    [disabled]="sub.status !== 1"
                    pTooltip="تجميد"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-pause"></i>
                  </button>
                  <button
                    class="action-btn cancel-btn"
                    (click)="openCancelDialog(sub)"
                    [disabled]="sub.status === 5 || sub.status === 4"
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

      <!-- New Subscription Dialog -->
      <p-dialog
        [(visible)]="subscriptionDialogVisible"
        header="اشتراك جديد"
        [modal]="true"
        [style]="{width: '550px'}"
        [contentStyle]="{'overflow-y': 'auto'}"
      >
        <div class="dialog-content">
          <div class="form-group">
            <label>العميل <span class="required">*</span></label>
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
            <label>الباقة <span class="required">*</span></label>
            <p-dropdown
              [options]="planOptions"
              [(ngModel)]="subscriptionForm.planId"
              placeholder="اختر الباقة"
              [style]="{width: '100%'}"
              (onChange)="onPlanChange()"
            ></p-dropdown>
          </div>

          @if (selectedPlanPrice > 0) {
            <div class="plan-summary">
              <span>سعر الباقة: <strong>{{ selectedPlanPrice | number:'1.0-0' }} جنيه</strong></span>
            </div>
          }

          <div class="form-row">
            <div class="form-group">
              <label>تاريخ البدء <span class="required">*</span></label>
              <p-calendar
                [(ngModel)]="subscriptionForm.startDate"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [style]="{width: '100%'}"
              ></p-calendar>
            </div>

            <div class="form-group">
              <label>طريقة الدفع</label>
              <p-dropdown
                [options]="paymentMethodOptions"
                [(ngModel)]="subscriptionForm.paymentMethod"
                [style]="{width: '100%'}"
              ></p-dropdown>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>المبلغ المدفوع</label>
              <p-inputNumber
                [(ngModel)]="subscriptionForm.amountPaid"
                [min]="0"
                mode="decimal"
                [maxFractionDigits]="2"
                placeholder="0"
              ></p-inputNumber>
            </div>

            <div class="form-group">
              <label>الخصم</label>
              <p-inputNumber
                [(ngModel)]="subscriptionForm.discount"
                [min]="0"
                mode="decimal"
                [maxFractionDigits]="2"
                placeholder="0"
              ></p-inputNumber>
            </div>
          </div>

          <div class="form-group">
            <label>ملاحظات</label>
            <input type="text" pInputText [(ngModel)]="subscriptionForm.notes" placeholder="ملاحظات (اختياري)" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button class="btn btn-outline" (click)="subscriptionDialogVisible = false">إلغاء</button>
            <button class="btn btn-primary" (click)="saveSubscription()" [disabled]="saving()">
              <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
              إنشاء الاشتراك
            </button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Payment Dialog -->
      <p-dialog
        [(visible)]="paymentDialogVisible"
        header="إضافة دفعة"
        [modal]="true"
        [style]="{width: '400px'}"
      >
        <div class="dialog-content">
          @if (selectedSubscription) {
            <div class="payment-summary">
              <div class="summary-row">
                <span>العميل:</span>
                <strong>{{ selectedSubscription.clientName }}</strong>
              </div>
              <div class="summary-row">
                <span>المتبقي:</span>
                <strong class="remaining">{{ selectedSubscription.remainingAmount | number:'1.0-0' }} جنيه</strong>
              </div>
            </div>
          }

          <div class="form-group">
            <label>المبلغ <span class="required">*</span></label>
            <p-inputNumber
              [(ngModel)]="paymentForm.amount"
              [min]="1"
              [max]="selectedSubscription?.remainingAmount || 99999"
              mode="decimal"
              [maxFractionDigits]="2"
              placeholder="0"
            ></p-inputNumber>
          </div>

          <div class="form-group">
            <label>طريقة الدفع</label>
            <p-dropdown
              [options]="paymentMethodOptions"
              [(ngModel)]="paymentForm.paymentMethod"
              [style]="{width: '100%'}"
            ></p-dropdown>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button class="btn btn-outline" (click)="paymentDialogVisible = false">إلغاء</button>
            <button class="btn btn-primary" (click)="savePayment()" [disabled]="saving() || !paymentForm.amount">
              <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
              تأكيد الدفع
            </button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Renew Dialog -->
      <p-dialog
        [(visible)]="renewDialogVisible"
        header="تجديد الاشتراك"
        [modal]="true"
        [style]="{width: '500px'}"
        [contentStyle]="{'overflow-y': 'auto'}"
      >
        <div class="dialog-content">
          @if (selectedSubscription) {
            <div class="renew-info">
              <i class="pi pi-info-circle"></i>
              <p>سيتم إنشاء اشتراك جديد مربوط بالاشتراك الحالي لـ <strong>{{ selectedSubscription.clientName }}</strong></p>
            </div>
          }

          <div class="form-group">
            <label>الباقة</label>
            <p-dropdown
              [options]="planOptions"
              [(ngModel)]="renewForm.planId"
              placeholder="نفس الباقة الحالية"
              [showClear]="true"
              [style]="{width: '100%'}"
            ></p-dropdown>
            <small class="hint">اتركها فارغة لاستخدام نفس الباقة</small>
          </div>

          <div class="form-group">
            <label>تاريخ البدء</label>
            <p-calendar
              [(ngModel)]="renewForm.startDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              [style]="{width: '100%'}"
            ></p-calendar>
            <small class="hint">اتركه فارغ ليبدأ من نهاية الاشتراك الحالي</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>المبلغ المدفوع</label>
              <p-inputNumber
                [(ngModel)]="renewForm.amountPaid"
                [min]="0"
                mode="decimal"
                [maxFractionDigits]="2"
                placeholder="0"
              ></p-inputNumber>
            </div>

            <div class="form-group">
              <label>طريقة الدفع</label>
              <p-dropdown
                [options]="paymentMethodOptions"
                [(ngModel)]="renewForm.paymentMethod"
                [style]="{width: '100%'}"
              ></p-dropdown>
            </div>
          </div>

          <div class="form-group">
            <label>ملاحظات</label>
            <input type="text" pInputText [(ngModel)]="renewForm.notes" placeholder="ملاحظات (اختياري)" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button class="btn btn-outline" (click)="renewDialogVisible = false">إلغاء</button>
            <button class="btn btn-success" (click)="saveRenew()" [disabled]="saving()">
              <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
              تجديد الاشتراك
            </button>
          </div>
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
              <label>من تاريخ <span class="required">*</span></label>
              <p-calendar
                [(ngModel)]="freezeForm.startDate"
                dateFormat="yy-mm-dd"
                [showIcon]="true"
                [style]="{width: '100%'}"
              ></p-calendar>
            </div>

            <div class="form-group">
              <label>إلى تاريخ <span class="required">*</span></label>
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
          <div class="dialog-footer">
            <button class="btn btn-outline" (click)="freezeDialogVisible = false">إلغاء</button>
            <button class="btn btn-warning" (click)="saveFreeze()" [disabled]="saving()">
              <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
              تجميد
            </button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Cancel Dialog -->
      <p-dialog
        [(visible)]="cancelDialogVisible"
        header="إلغاء الاشتراك"
        [modal]="true"
        [style]="{width: '450px'}"
      >
        <div class="dialog-content">
          <div class="cancel-warning">
            <i class="pi pi-exclamation-triangle"></i>
            <p>هل أنت متأكد من إلغاء اشتراك <strong>{{ selectedSubscription?.clientName }}</strong>؟</p>
          </div>

          <div class="form-group">
            <div class="switch-row">
              <label>استرداد المبلغ للمحفظة</label>
              <p-inputSwitch [(ngModel)]="cancelForm.refundToWallet"></p-inputSwitch>
            </div>
          </div>

          @if (cancelForm.refundToWallet) {
            <div class="form-group">
              <label>مبلغ الاسترداد</label>
              <p-inputNumber
                [(ngModel)]="cancelForm.refundAmount"
                [min]="0"
                mode="decimal"
                [maxFractionDigits]="2"
                placeholder="تلقائي حسب الأيام المتبقية"
              ></p-inputNumber>
              <small class="hint">اتركه فارغ لحساب المبلغ تلقائياً حسب الأيام المتبقية</small>
            </div>
          }
        </div>
        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button class="btn btn-outline" (click)="cancelDialogVisible = false">تراجع</button>
            <button class="btn btn-danger" (click)="confirmCancel()" [disabled]="saving()">
              <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
              تأكيد الإلغاء
            </button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Detail Dialog -->
      <p-dialog
        [(visible)]="detailDialogVisible"
        header="تفاصيل الاشتراك"
        [modal]="true"
        [style]="{width: '650px'}"
        [contentStyle]="{'overflow-y': 'auto', 'max-height': '75vh'}"
      >
        @if (detailSubscription) {
          <div class="detail-content">
            <!-- Client Info -->
            <div class="detail-section">
              <h4><i class="pi pi-user"></i> بيانات العميل</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">الاسم</span>
                  <span class="detail-value">{{ detailSubscription.clientName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">الموبايل</span>
                  <span class="detail-value">{{ detailSubscription.clientPhone || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">الإيميل</span>
                  <span class="detail-value">{{ detailSubscription.clientEmail || '-' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">المدرب</span>
                  <span class="detail-value">{{ detailSubscription.salesCoachName || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Subscription Info -->
            <div class="detail-section">
              <h4><i class="pi pi-credit-card"></i> بيانات الاشتراك</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">الباقة</span>
                  <span class="detail-value plan">{{ detailSubscription.planName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">الحالة</span>
                  <p-tag
                    [value]="getStatusLabel(detailSubscription.status)"
                    [severity]="getStatusSeverity(detailSubscription.status)"
                  ></p-tag>
                </div>
                <div class="detail-item">
                  <span class="detail-label">من</span>
                  <span class="detail-value">{{ detailSubscription.startDate | date:'yyyy-MM-dd' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">إلى</span>
                  <span class="detail-value">{{ detailSubscription.endDate | date:'yyyy-MM-dd' }}</span>
                </div>
                @if (detailSubscription.remainingDays !== undefined) {
                  <div class="detail-item">
                    <span class="detail-label">أيام متبقية</span>
                    <span class="detail-value">{{ detailSubscription.remainingDays }} يوم</span>
                  </div>
                }
                @if (detailSubscription.totalFreezeDays) {
                  <div class="detail-item">
                    <span class="detail-label">أيام تجميد</span>
                    <span class="detail-value">{{ detailSubscription.totalFreezeDays }} يوم</span>
                  </div>
                }
              </div>
            </div>

            <!-- Payment Info -->
            <div class="detail-section">
              <h4><i class="pi pi-wallet"></i> بيانات الدفع</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">الإجمالي</span>
                  <span class="detail-value">{{ detailSubscription.totalAmount | number:'1.0-0' }} جنيه</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">المدفوع</span>
                  <span class="detail-value">{{ detailSubscription.amountPaid | number:'1.0-0' }} جنيه</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">المتبقي</span>
                  <span class="detail-value" [class.remaining]="(detailSubscription.remainingAmount || 0) > 0">
                    {{ detailSubscription.remainingAmount | number:'1.0-0' }} جنيه
                  </span>
                </div>
                @if (detailSubscription.discount) {
                  <div class="detail-item">
                    <span class="detail-label">الخصم</span>
                    <span class="detail-value discount">{{ detailSubscription.discount | number:'1.0-0' }} جنيه</span>
                  </div>
                }
                <div class="detail-item">
                  <span class="detail-label">طريقة الدفع</span>
                  <span class="detail-value">{{ detailSubscription.paymentMethodName || getPaymentLabel(detailSubscription.paymentMethod) }}</span>
                </div>
              </div>
            </div>

            <!-- Freezes -->
            @if (detailSubscription.freezes && detailSubscription.freezes.length > 0) {
              <div class="detail-section">
                <h4><i class="pi pi-pause"></i> سجل التجميد</h4>
                <div class="freeze-list">
                  @for (freeze of detailSubscription.freezes; track freeze.id) {
                    <div class="freeze-item">
                      <div class="freeze-dates">
                        <span>{{ freeze.startDate | date:'yyyy-MM-dd' }}</span>
                        <i class="pi pi-arrow-left"></i>
                        <span>{{ freeze.endDate | date:'yyyy-MM-dd' }}</span>
                      </div>
                      @if (freeze.reason) {
                        <span class="freeze-reason">{{ freeze.reason }}</span>
                      }
                      @if (freeze.isActive) {
                        <button class="btn btn-sm btn-outline" (click)="endFreeze(freeze.id)">
                          إنهاء التجميد
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Renewal History -->
            @if (detailSubscription.renewalHistory && detailSubscription.renewalHistory.length > 0) {
              <div class="detail-section">
                <h4><i class="pi pi-history"></i> سجل التجديدات</h4>
                <div class="renewal-list">
                  @for (renewal of detailSubscription.renewalHistory; track renewal.id) {
                    <div class="renewal-item">
                      <span class="renewal-plan">{{ renewal.planName }}</span>
                      <span class="renewal-dates">
                        {{ renewal.startDate | date:'yyyy-MM-dd' }} - {{ renewal.endDate | date:'yyyy-MM-dd' }}
                      </span>
                      <span class="renewal-amount">{{ renewal.amountPaid | number:'1.0-0' }} جنيه</span>
                      <p-tag
                        [value]="getStatusLabel(renewal.status)"
                        [severity]="getStatusSeverity(renewal.status)"
                        [style]="{fontSize: '0.7rem'}"
                      ></p-tag>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Notes -->
            @if (detailSubscription.notes) {
              <div class="detail-section">
                <h4><i class="pi pi-file"></i> ملاحظات</h4>
                <p class="notes-text">{{ detailSubscription.notes }}</p>
              </div>
            }
          </div>
        }
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
      grid-template-columns: repeat(5, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { border-color: rgba(59, 130, 246, 0.3); }
      &.active-stat { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }

      .stat-icon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
      }

      &:nth-child(1) .stat-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    }

    .stat-icon {
      &.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      &.orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.gray { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
      &.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .expiring-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      color: #f59e0b;
      font-size: 0.9rem;

      i { font-size: 1.1rem; }

      .alert-btn {
        margin-right: auto;
        padding: 0.35rem 0.75rem;
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 6px;
        color: #f59e0b;
        cursor: pointer;
        font-size: 0.8rem;

        &:hover { background: rgba(245, 158, 11, 0.25); }
      }
    }

    :host-context([dir="ltr"]) .expiring-alert .alert-btn {
      margin-right: 0;
      margin-left: auto;
    }

    .table-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .table-toolbar {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;

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

    :host-context([dir="ltr"]) .search-box {
      i { right: auto; left: 1rem; }
      input { padding: 0.75rem 1rem 0.75rem 2.5rem; }
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
          padding: 0.875rem 1rem;
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
      flex-shrink: 0;
    }

    .client-details {
      display: flex;
      flex-direction: column;
    }

    .client-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9rem;
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

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;

      .date-arrow { font-size: 0.7rem; color: var(--text-muted); }
    }

    .expiring-soon {
      color: #f59e0b;
      font-weight: 600;
    }

    .remaining-days {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;

      &.warning { color: #f59e0b; font-weight: 600; }
    }

    .payment-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.85rem;
    }

    .payment-amount {
      font-weight: 600;
      color: var(--text-primary);
    }

    .payment-remaining {
      font-size: 0.75rem;
      color: #f59e0b;
      font-weight: 500;
    }

    .paid-badge {
      font-size: 0.7rem;
      color: #22c55e;
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .discount-badge {
      font-size: 0.7rem;
      color: #8b5cf6;
    }

    .action-buttons {
      display: flex;
      gap: 0.35rem;
    }

    .action-btn {
      width: 30px;
      height: 30px;
      border-radius: 7px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 0.85rem;

      &:disabled { opacity: 0.3; cursor: not-allowed; }

      &.detail-btn { background: rgba(59, 130, 246, 0.1); color: #3b82f6; &:hover:not(:disabled) { background: #3b82f6; color: white; } }
      &.payment-btn { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; &:hover:not(:disabled) { background: #8b5cf6; color: white; } }
      &.renew-btn { background: rgba(34, 197, 94, 0.1); color: #22c55e; &:hover:not(:disabled) { background: #22c55e; color: white; } }
      &.freeze-btn { background: rgba(245, 158, 11, 0.1); color: #f59e0b; &:hover:not(:disabled) { background: #f59e0b; color: white; } }
      &.cancel-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; &:hover:not(:disabled) { background: #ef4444; color: white; } }
    }

    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-muted);

      i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
      h4 { color: var(--text-primary); margin: 0 0 0.5rem; }
      p { margin: 0; }
    }

    /* Dialog Styles */
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

        .required { color: #ef4444; }
      }

      input, :host ::ng-deep .p-dropdown, :host ::ng-deep .p-calendar, :host ::ng-deep .p-inputnumber {
        width: 100%;
      }

      .hint {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .plan-summary {
      padding: 0.75rem 1rem;
      background: rgba(139, 92, 246, 0.08);
      border-radius: 8px;
      color: #8b5cf6;
      font-size: 0.9rem;
    }

    .payment-summary {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 10px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.35rem 0;
      font-size: 0.9rem;

      .remaining { color: #f59e0b; }
    }

    .switch-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .freeze-info, .renew-info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(59, 130, 246, 0.08);
      border-radius: 10px;
      color: #3b82f6;

      i { font-size: 1.25rem; margin-top: 2px; }
      p { margin: 0; font-size: 0.9rem; }
    }

    .freeze-info {
      background: rgba(245, 158, 11, 0.08);
      color: #f59e0b;
    }

    .cancel-warning {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(239, 68, 68, 0.08);
      border-radius: 10px;
      color: #ef4444;

      i { font-size: 1.5rem; margin-top: 2px; }
      p { margin: 0; font-size: 0.95rem; }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
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
      font-family: inherit;

      &.btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; }

      &.btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        &:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
      }

      &.btn-success {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white;
        &:hover { background: linear-gradient(135deg, #16a34a, #15803d); }
      }

      &.btn-warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        &:hover { background: linear-gradient(135deg, #d97706, #b45309); }
      }

      &.btn-danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        &:hover { background: linear-gradient(135deg, #dc2626, #b91c1c); }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        &:hover { border-color: #3b82f6; color: #3b82f6; }
      }

      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    /* Detail Dialog */
    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .detail-section {
      h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem;
        color: var(--text-primary);
        font-size: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color);

        i { color: #3b82f6; }
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .detail-value {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-primary);

      &.plan { color: #8b5cf6; }
      &.remaining { color: #f59e0b; }
      &.discount { color: #22c55e; }
    }

    .freeze-list, .renewal-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .freeze-item, .renewal-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      font-size: 0.85rem;
      flex-wrap: wrap;
    }

    .freeze-dates {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .freeze-reason {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .renewal-plan {
      font-weight: 600;
      color: #8b5cf6;
    }

    .renewal-dates {
      color: var(--text-secondary);
    }

    .renewal-amount {
      margin-right: auto;
      font-weight: 500;
    }

    :host-context([dir="ltr"]) .renewal-amount {
      margin-right: 0;
      margin-left: auto;
    }

    .notes-text {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    @media (max-width: 1024px) {
      .stats-row { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .form-row { grid-template-columns: 1fr; }
      .header-actions { flex-direction: column; }
      .table-toolbar { flex-direction: column; }
      .detail-grid { grid-template-columns: 1fr; }
      .action-buttons { flex-wrap: wrap; }
    }
  `]
})
export class SubscriptionsListComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  subscriptions = signal<ClientSubscription[]>([]);
  plans = signal<SubscriptionPlan[]>([]);
  clients = signal<Client[]>([]);

  searchQuery = '';
  selectedStatus: number | null = null;
  selectedPlanFilter: string | null = null;
  showExpiringOnly = false;
  private searchTimeout: any;

  // Dialogs
  subscriptionDialogVisible = false;
  paymentDialogVisible = false;
  renewDialogVisible = false;
  freezeDialogVisible = false;
  cancelDialogVisible = false;
  detailDialogVisible = false;

  selectedSubscription: ClientSubscription | null = null;
  detailSubscription: ClientSubscription | null = null;

  subscriptionForm = {
    clientId: '',
    planId: '',
    startDate: new Date(),
    paymentMethod: 0,
    amountPaid: 0,
    discount: 0,
    notes: ''
  };

  paymentForm = {
    amount: 0,
    paymentMethod: 0
  };

  renewForm = {
    planId: '' as string | null,
    startDate: null as Date | null,
    paymentMethod: 0,
    amountPaid: 0,
    notes: ''
  };

  freezeForm = {
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    reason: ''
  };

  cancelForm = {
    refundToWallet: false,
    refundAmount: null as number | null
  };

  selectedPlanPrice = 0;

  clientOptions: { label: string; value: string }[] = [];
  planOptions: { label: string; value: string }[] = [];
  planFilterOptions: { label: string; value: string }[] = [];

  paymentMethodOptions = [
    { label: 'كاش', value: 0 },
    { label: 'محفظة', value: 1 },
    { label: 'كارت', value: 2 },
    { label: 'تحويل بنكي', value: 3 }
  ];

  // Computed stats
  activeCount = computed(() => this.subscriptions().filter(s => s.status === SubscriptionStatus.Active).length);
  suspendedCount = computed(() => this.subscriptions().filter(s => s.status === SubscriptionStatus.Suspended).length);
  expiredCount = computed(() => this.subscriptions().filter(s => s.status === SubscriptionStatus.Expired).length);
  cancelledCount = computed(() => this.subscriptions().filter(s => s.status === SubscriptionStatus.Cancelled).length);
  expiringCount = computed(() => this.subscriptions().filter(s =>
    s.status === SubscriptionStatus.Active && s.remainingDays !== undefined && s.remainingDays <= 7 && s.remainingDays > 0
  ).length);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.loadSubscriptions();
    this.loadPlans();
    this.loadClients();
  }

  loadSubscriptions(): void {
    const params: any = {};
    if (this.selectedStatus !== null) params.status = this.selectedStatus;
    if (this.selectedPlanFilter) params.planId = this.selectedPlanFilter;
    if (this.searchQuery.trim()) params.searchTerm = this.searchQuery.trim();

    this.ownerService.getSubscriptions(params).subscribe({
      next: (data) => {
        this.subscriptions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subscriptions:', err);
        this.subscriptions.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadPlans(): void {
    this.ownerService.getSubscriptionPlans(true).subscribe({
      next: (data) => {
        this.plans.set(data);
        this.planOptions = data.map(p => ({ label: `${p.name} - ${p.price} جنيه`, value: p.id }));
        this.planFilterOptions = data.map(p => ({ label: p.name, value: p.id }));
      },
      error: () => {}
    });
  }

  private loadClients(): void {
    this.ownerService.getClients().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.clientOptions = data.map(c => ({
          label: c.fullName || c.profile?.fullName || c.phoneNumber || '',
          value: c.id
        }));
      },
      error: () => {}
    });
  }

  filteredSubscriptions(): ClientSubscription[] {
    let result = this.subscriptions();
    if (this.showExpiringOnly) {
      result = result.filter(s =>
        s.status === SubscriptionStatus.Active &&
        s.remainingDays !== undefined && s.remainingDays <= 7 && s.remainingDays > 0
      );
    }
    return result;
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadSubscriptions(), 400);
  }

  filterByStatus(status: number | null): void {
    this.selectedStatus = status;
    this.loadSubscriptions();
  }

  getInitials(name: string): string {
    if (!name) return '؟';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  getStatusLabel(status: number): string {
    return StatusLabels[status] || 'غير معروف';
  }

  getStatusSeverity(status: number): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const map: Record<number, 'success' | 'warning' | 'info' | 'danger' | 'secondary'> = {
      [SubscriptionStatus.Active]: 'success',
      [SubscriptionStatus.Suspended]: 'warning',
      [SubscriptionStatus.Trial]: 'info',
      [SubscriptionStatus.Expired]: 'secondary',
      [SubscriptionStatus.Cancelled]: 'danger'
    };
    return map[status] || 'secondary';
  }

  getPaymentLabel(method?: number): string {
    if (method === undefined || method === null) return '-';
    return PaymentMethodLabels[method] || '-';
  }

  isExpiringSoon(sub: ClientSubscription): boolean {
    return sub.status === SubscriptionStatus.Active &&
      sub.remainingDays !== undefined && sub.remainingDays <= 7 && sub.remainingDays > 0;
  }

  onPlanChange(): void {
    const plan = this.plans().find(p => p.id === this.subscriptionForm.planId);
    this.selectedPlanPrice = plan?.price || 0;
  }

  // ==================== Subscription Dialog ====================
  openSubscriptionDialog(): void {
    this.subscriptionForm = {
      clientId: '',
      planId: '',
      startDate: new Date(),
      paymentMethod: 0,
      amountPaid: 0,
      discount: 0,
      notes: ''
    };
    this.selectedPlanPrice = 0;
    this.subscriptionDialogVisible = true;
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

    this.ownerService.createSubscription({
      clientId: this.subscriptionForm.clientId,
      planId: this.subscriptionForm.planId,
      startDate,
      paymentMethod: this.subscriptionForm.paymentMethod,
      amountPaid: this.subscriptionForm.amountPaid || undefined,
      discount: this.subscriptionForm.discount || undefined,
      notes: this.subscriptionForm.notes || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.subscriptionDialogVisible = false;
        this.notificationService.success('تم إنشاء الاشتراك بنجاح');
        this.loadSubscriptions();
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'حدث خطأ أثناء إنشاء الاشتراك';
        this.notificationService.error(msg);
      }
    });
  }

  // ==================== Payment Dialog ====================
  openPaymentDialog(sub: ClientSubscription): void {
    this.selectedSubscription = sub;
    this.paymentForm = { amount: sub.remainingAmount || 0, paymentMethod: 0 };
    this.paymentDialogVisible = true;
  }

  savePayment(): void {
    if (!this.selectedSubscription || !this.paymentForm.amount) return;

    this.saving.set(true);
    this.ownerService.addPayment(this.selectedSubscription.id, {
      amount: this.paymentForm.amount,
      paymentMethod: this.paymentForm.paymentMethod
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.paymentDialogVisible = false;
        this.notificationService.success('تم إضافة الدفعة بنجاح');
        this.loadSubscriptions();
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.error(err.error?.message || 'حدث خطأ أثناء إضافة الدفعة');
      }
    });
  }

  // ==================== Renew Dialog ====================
  openRenewDialog(sub: ClientSubscription): void {
    this.selectedSubscription = sub;
    this.renewForm = {
      planId: null,
      startDate: null,
      paymentMethod: 0,
      amountPaid: 0,
      notes: ''
    };
    this.renewDialogVisible = true;
  }

  saveRenew(): void {
    if (!this.selectedSubscription) return;

    this.saving.set(true);
    const startDate = this.renewForm.startDate instanceof Date
      ? this.renewForm.startDate.toISOString().split('T')[0]
      : this.renewForm.startDate;

    this.ownerService.renewSubscription(this.selectedSubscription.id, {
      planId: this.renewForm.planId || undefined,
      startDate: startDate || undefined,
      paymentMethod: this.renewForm.paymentMethod,
      amountPaid: this.renewForm.amountPaid || undefined,
      notes: this.renewForm.notes || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.renewDialogVisible = false;
        this.notificationService.success('تم تجديد الاشتراك بنجاح');
        this.loadSubscriptions();
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.error(err.error?.message || 'حدث خطأ أثناء تجديد الاشتراك');
      }
    });
  }

  // ==================== Freeze Dialog ====================
  openFreezeDialog(sub: ClientSubscription): void {
    this.selectedSubscription = sub;
    this.freezeForm = {
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reason: ''
    };
    this.freezeDialogVisible = true;
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

    this.ownerService.freezeSubscription(this.selectedSubscription.id, {
      startDate,
      endDate,
      reason: this.freezeForm.reason || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.freezeDialogVisible = false;
        this.notificationService.success('تم تجميد الاشتراك بنجاح');
        this.loadSubscriptions();
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.error(err.error?.message || 'حدث خطأ أثناء تجميد الاشتراك');
      }
    });
  }

  endFreeze(freezeId: string): void {
    Swal.fire({
      title: 'إنهاء التجميد',
      text: 'هل أنت متأكد من إنهاء التجميد مبكراً؟',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ownerService.endFreeze(freezeId).subscribe({
          next: () => {
            this.notificationService.success('تم إنهاء التجميد بنجاح');
            if (this.detailSubscription) this.viewDetails(this.detailSubscription);
            this.loadSubscriptions();
          },
          error: (err) => {
            this.notificationService.error(err.error?.message || 'حدث خطأ');
          }
        });
      }
    });
  }

  // ==================== Cancel Dialog ====================
  openCancelDialog(sub: ClientSubscription): void {
    this.selectedSubscription = sub;
    this.cancelForm = { refundToWallet: false, refundAmount: null };
    this.cancelDialogVisible = true;
  }

  confirmCancel(): void {
    if (!this.selectedSubscription) return;

    this.saving.set(true);
    this.ownerService.cancelSubscription(this.selectedSubscription.id, {
      refundToWallet: this.cancelForm.refundToWallet,
      refundAmount: this.cancelForm.refundToWallet ? this.cancelForm.refundAmount : undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelDialogVisible = false;
        this.notificationService.success('تم إلغاء الاشتراك بنجاح');
        this.loadSubscriptions();
      },
      error: (err) => {
        this.saving.set(false);
        this.notificationService.error(err.error?.message || 'حدث خطأ أثناء إلغاء الاشتراك');
      }
    });
  }

  // ==================== Detail Dialog ====================
  viewDetails(sub: ClientSubscription): void {
    this.ownerService.getSubscriptionById(sub.id).subscribe({
      next: (data) => {
        this.detailSubscription = data;
        this.detailDialogVisible = true;
      },
      error: () => {
        this.detailSubscription = sub;
        this.detailDialogVisible = true;
      }
    });
  }
}
