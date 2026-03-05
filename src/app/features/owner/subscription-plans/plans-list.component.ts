import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ChipsModule } from 'primeng/chips';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ExportMenuComponent, ExportFormat } from '../../../shared/components/export-menu/export-menu.component';
import { ExportService } from '../../../core/services/export.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnerService, SubscriptionPlan } from '../services/owner.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    InputSwitchModule,
    ChipsModule,
    PageHeaderComponent,
    LoadingSkeletonComponent,
    ExportMenuComponent
  ],
  template: `
    <div class="plans-page">
      <app-page-header
        title="خطط الاشتراك"
        subtitle="إدارة خطط اشتراك الصالة"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'خطط الاشتراك'}]"
      >
        <div class="header-actions">
          <app-export-menu
            buttonLabel="تصدير"
            (export)="onExport($event)"
          ></app-export-menu>
          <button class="btn btn-primary" (click)="openAddDialog()">
            <i class="pi pi-plus"></i>
            <span>إضافة خطة</span>
          </button>
        </div>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-stat__icon blue"><i class="pi pi-box"></i></div>
          <span class="mini-stat__value">{{ plans().length }}</span>
          <span class="mini-stat__label">إجمالي الخطط</span>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <span class="mini-stat__value">{{ activePlansCount() }}</span>
          <span class="mini-stat__label">خطط نشطة</span>
        </div>
        <div class="mini-stat">
          <div class="mini-stat__icon purple"><i class="pi pi-users"></i></div>
          <span class="mini-stat__value">{{ totalSubscribers() }}</span>
          <span class="mini-stat__label">إجمالي المشتركين</span>
        </div>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <div class="plans-grid" *ngIf="!loading()">
        @for (plan of plans(); track plan.id) {
          <div class="plan-card" [class.inactive]="!plan.isActive">
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <span class="plan-badge" [class.active]="plan.isActive">
                {{ plan.isActive ? 'نشط' : 'غير نشط' }}
              </span>
            </div>

            <div class="plan-price">
              <span class="price-value">{{ plan.price | number }}</span>
              <span class="price-currency">جنيه</span>
            </div>

            <div class="plan-meta">
              <div class="meta-item">
                <i class="pi pi-calendar"></i>
                <span>{{ plan.durationMonths }} {{ getDurationLabel(plan.durationMonths) }}</span>
              </div>
              <div class="meta-item">
                <i class="pi pi-users"></i>
                <span>{{ plan.activeSubscribersCount || 0 }} مشترك</span>
              </div>
              @if (plan.sessionsPerWeek) {
                <div class="meta-item">
                  <i class="pi pi-clock"></i>
                  <span>{{ plan.sessionsPerWeek }} حصة/أسبوع</span>
                </div>
              }
              @if (plan.maxFreezeDays) {
                <div class="meta-item">
                  <i class="pi pi-pause"></i>
                  <span>تجميد {{ plan.maxFreezeDays }} يوم ({{ plan.maxFreezeCount || 1 }} مرة)</span>
                </div>
              }
            </div>

            <!-- Features Tags -->
            @if (plan.features && plan.features.length > 0) {
              <div class="plan-features">
                @for (feature of plan.features; track feature) {
                  <span class="feature-tag">
                    <i class="pi pi-check"></i>
                    {{ feature }}
                  </span>
                }
              </div>
            }

            <!-- Special Badges -->
            <div class="plan-badges">
              @if (plan.inBodyIncluded) {
                <span class="special-badge inbody">
                  <i class="pi pi-heart"></i> InBody
                </span>
              }
              @if (plan.privateCoach) {
                <span class="special-badge coach">
                  <i class="pi pi-user"></i> مدرب خاص
                </span>
              }
            </div>

            @if (plan.description) {
              <div class="plan-description">
                <p>{{ plan.description }}</p>
              </div>
            }

            <div class="plan-actions">
              <button class="action-btn" (click)="editPlan(plan)" title="تعديل">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="action-btn" (click)="togglePlan(plan)" [title]="plan.isActive ? 'تعطيل' : 'تفعيل'">
                <i [class]="plan.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
              <button class="action-btn danger" (click)="deletePlan(plan)" title="حذف">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (plans().length === 0) {
          <div class="empty-state">
            <i class="pi pi-box"></i>
            <h3>لا توجد خطط اشتراك</h3>
            <p>قم بإضافة خطة اشتراك جديدة للبدء</p>
            <button class="btn btn-primary" (click)="openAddDialog()">
              <i class="pi pi-plus"></i>
              إضافة خطة
            </button>
          </div>
        }
      </div>

      <!-- Add/Edit Plan Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="isEditing ? 'تعديل خطة الاشتراك' : 'إضافة خطة اشتراك جديدة'"
        [modal]="true"
        [style]="{width: '600px', maxHeight: '90vh'}"
        [closable]="true"
        [contentStyle]="{'overflow-y': 'auto'}"
      >
        <div class="dialog-content">
          <div class="form-group">
            <label>اسم الخطة <span class="required">*</span></label>
            <input
              type="text"
              pInputText
              [(ngModel)]="planForm.name"
              placeholder="مثال: الاشتراك الشهري VIP"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>السعر (جنيه) <span class="required">*</span></label>
              <p-inputNumber
                [(ngModel)]="planForm.price"
                [min]="0"
                mode="decimal"
                [minFractionDigits]="0"
                [maxFractionDigits]="2"
                placeholder="0"
              ></p-inputNumber>
            </div>

            <div class="form-group">
              <label>المدة (شهور) <span class="required">*</span></label>
              <p-inputNumber
                [(ngModel)]="planForm.durationMonths"
                [min]="1"
                [max]="24"
                placeholder="1"
              ></p-inputNumber>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>الحصص في الأسبوع</label>
              <p-inputNumber
                [(ngModel)]="planForm.sessionsPerWeek"
                [min]="1"
                [max]="7"
                placeholder="غير محدود"
              ></p-inputNumber>
            </div>

            <div class="form-group">
              <label>أقصى أيام تجميد</label>
              <p-inputNumber
                [(ngModel)]="planForm.maxFreezeDays"
                [min]="0"
                placeholder="0"
              ></p-inputNumber>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>أقصى عدد مرات تجميد</label>
              <p-inputNumber
                [(ngModel)]="planForm.maxFreezeCount"
                [min]="0"
                placeholder="0"
              ></p-inputNumber>
            </div>
            <div class="form-group"></div>
          </div>

          <div class="form-group">
            <label>المميزات</label>
            <p-chips
              [(ngModel)]="planForm.features"
              placeholder="اكتب ميزة واضغط Enter"
              [addOnBlur]="true"
              [addOnTab]="true"
            ></p-chips>
            <small class="hint">اضغط Enter بعد كل ميزة لإضافتها</small>
          </div>

          <div class="form-group">
            <label>الوصف</label>
            <textarea
              pInputText
              [(ngModel)]="planForm.description"
              rows="3"
              placeholder="وصف مختصر للخطة..."
            ></textarea>
          </div>

          <div class="switches-row">
            <div class="switch-item">
              <label>InBody مشمول</label>
              <p-inputSwitch [(ngModel)]="planForm.inBodyIncluded"></p-inputSwitch>
            </div>
            <div class="switch-item">
              <label>مدرب خاص</label>
              <p-inputSwitch [(ngModel)]="planForm.privateCoach"></p-inputSwitch>
            </div>
            <div class="switch-item">
              <label>نشط</label>
              <p-inputSwitch [(ngModel)]="planForm.isActive"></p-inputSwitch>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button class="btn btn-outline" (click)="closeDialog()">إلغاء</button>
            <button
              class="btn btn-primary"
              (click)="savePlan()"
              [disabled]="saving() || !isFormValid()"
            >
              <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
              {{ isEditing ? 'حفظ التعديلات' : 'إضافة الخطة' }}
            </button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .plans-page {
      max-width: 1200px;
    }

    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .mini-stat {
      flex: 1;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .mini-stat__icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;

      &.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
      &.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    }

    .mini-stat__value {
      display: block;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .mini-stat__label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .plan-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 8px 25px var(--shadow-color);
        transform: translateY(-2px);
      }

      &.inactive {
        opacity: 0.7;
      }
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .plan-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .plan-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;

      &.active {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
      }
    }

    .plan-price {
      margin-bottom: 1rem;
    }

    .price-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #8b5cf6;
    }

    .price-currency {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-right: 0.25rem;
    }

    :host-context([dir="ltr"]) .price-currency {
      margin-right: 0;
      margin-left: 0.25rem;
    }

    .plan-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        color: var(--text-muted);
        width: 18px;
        text-align: center;
      }
    }

    .plan-features {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .feature-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      background: rgba(34, 197, 94, 0.08);
      color: #16a34a;
      border-radius: 20px;
      font-size: 0.8rem;

      i { font-size: 0.7rem; }
    }

    .plan-badges {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .special-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.75rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;

      &.inbody {
        background: rgba(236, 72, 153, 0.1);
        color: #ec4899;
      }

      &.coach {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
    }

    .plan-description {
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border-color);
      margin-bottom: 0.75rem;

      p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-muted);
        line-height: 1.5;
      }
    }

    .plan-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bg-secondary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s;

      &:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }

      &.danger:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }
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
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;

        &:hover { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover { border-color: #8b5cf6; color: #8b5cf6; }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-primary);
      border: 2px dashed var(--border-color);
      border-radius: 16px;

      i { font-size: 4rem; color: var(--text-muted); opacity: 0.5; margin-bottom: 1rem; }
      h3 { margin: 0 0 0.5rem; color: var(--text-primary); }
      p { margin: 0 0 1.5rem; color: var(--text-muted); }
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

      input, textarea, :host ::ng-deep .p-inputnumber, :host ::ng-deep .p-chips {
        width: 100%;
      }

      textarea {
        resize: vertical;
        min-height: 80px;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: var(--bg-primary);
        color: var(--text-primary);
        font-family: inherit;

        &:focus { outline: none; border-color: #8b5cf6; }
      }

      .hint {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .switches-row {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 10px;
    }

    .switch-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      label {
        font-size: 0.9rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    @media (max-width: 768px) {
      .stats-row { flex-direction: column; }
      .form-row { grid-template-columns: 1fr; }
      .switches-row { flex-direction: column; gap: 1rem; }
      .plans-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PlansListComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private exportService = inject(ExportService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);
  plans = signal<SubscriptionPlan[]>([]);

  // Dialog state
  dialogVisible = false;
  isEditing = false;
  editingPlanId: string | null = null;

  planForm: {
    name: string;
    price: number;
    durationMonths: number;
    description: string;
    features: string[];
    maxFreezeDays: number;
    maxFreezeCount: number;
    sessionsPerWeek: number | null;
    inBodyIncluded: boolean;
    privateCoach: boolean;
    isActive: boolean;
  } = this.getDefaultForm();

  ngOnInit(): void {
    this.loadPlans();
  }

  private getDefaultForm() {
    return {
      name: '',
      price: 0,
      durationMonths: 1,
      description: '',
      features: [] as string[],
      maxFreezeDays: 0,
      maxFreezeCount: 0,
      sessionsPerWeek: null as number | null,
      inBodyIncluded: false,
      privateCoach: false,
      isActive: true
    };
  }

  loadPlans(): void {
    this.loading.set(true);
    this.ownerService.getSubscriptionPlans().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading plans:', err);
        this.plans.set([]);
        this.loading.set(false);
        this.notificationService.error('حدث خطأ أثناء تحميل الخطط');
      }
    });
  }

  activePlansCount(): number {
    return this.plans().filter(p => p.isActive !== false).length;
  }

  totalSubscribers(): number {
    return this.plans().reduce((sum, p) => sum + (p.activeSubscribersCount || 0), 0);
  }

  getDurationLabel(months: number): string {
    if (months === 1) return 'شهر';
    if (months === 2) return 'شهران';
    if (months >= 3 && months <= 10) return 'شهور';
    return 'شهر';
  }

  isFormValid(): boolean {
    return !!(
      this.planForm.name?.trim() &&
      this.planForm.price > 0 &&
      this.planForm.durationMonths >= 1
    );
  }

  openAddDialog(): void {
    this.isEditing = false;
    this.editingPlanId = null;
    this.planForm = this.getDefaultForm();
    this.dialogVisible = true;
  }

  editPlan(plan: SubscriptionPlan): void {
    this.isEditing = true;
    this.editingPlanId = plan.id;
    this.planForm = {
      name: plan.name,
      price: plan.price,
      durationMonths: plan.durationMonths,
      description: plan.description || '',
      features: plan.features ? [...plan.features] : [],
      maxFreezeDays: plan.maxFreezeDays || 0,
      maxFreezeCount: plan.maxFreezeCount || 0,
      sessionsPerWeek: plan.sessionsPerWeek ?? null,
      inBodyIncluded: plan.inBodyIncluded || false,
      privateCoach: plan.privateCoach || false,
      isActive: plan.isActive !== false
    };
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingPlanId = null;
  }

  savePlan(): void {
    if (!this.isFormValid()) {
      this.notificationService.warn('يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    this.saving.set(true);

    const planData = {
      name: this.planForm.name.trim(),
      price: this.planForm.price,
      durationMonths: this.planForm.durationMonths,
      description: this.planForm.description?.trim() || undefined,
      features: this.planForm.features.length > 0 ? this.planForm.features : undefined,
      maxFreezeDays: this.planForm.maxFreezeDays || undefined,
      maxFreezeCount: this.planForm.maxFreezeCount || undefined,
      sessionsPerWeek: this.planForm.sessionsPerWeek || undefined,
      inBodyIncluded: this.planForm.inBodyIncluded,
      privateCoach: this.planForm.privateCoach,
      isActive: this.planForm.isActive
    };

    if (this.isEditing && this.editingPlanId) {
      this.ownerService.updatePlan(this.editingPlanId, planData).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible = false;
          this.notificationService.success('تم تحديث الخطة بنجاح');
          this.loadPlans();
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error updating plan:', err);
          this.notificationService.error('حدث خطأ أثناء تحديث الخطة');
        }
      });
    } else {
      this.ownerService.createPlan(planData).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible = false;
          this.notificationService.success('تم إضافة الخطة بنجاح');
          this.loadPlans();
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error creating plan:', err);
          this.notificationService.error('حدث خطأ أثناء إضافة الخطة');
        }
      });
    }
  }

  togglePlan(plan: SubscriptionPlan): void {
    const newStatus = !plan.isActive;
    const action = newStatus ? 'تفعيل' : 'تعطيل';

    Swal.fire({
      title: `تأكيد ${action} الخطة`,
      text: `هل أنت متأكد من ${action} خطة "${plan.name}"؟`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#22c55e' : '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `نعم، ${action}`,
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ownerService.updatePlan(plan.id, { isActive: newStatus }).subscribe({
          next: () => {
            this.plans.update(plans =>
              plans.map(p => p.id === plan.id ? { ...p, isActive: newStatus } : p)
            );
            this.notificationService.success(`تم ${action} الخطة بنجاح`);
          },
          error: (err) => {
            console.error('Error toggling plan:', err);
            this.notificationService.error(`حدث خطأ أثناء ${action} الخطة`);
          }
        });
      }
    });
  }

  deletePlan(plan: SubscriptionPlan): void {
    if ((plan.activeSubscribersCount || 0) > 0) {
      Swal.fire({
        title: 'لا يمكن حذف الخطة',
        text: `هذه الخطة لديها ${plan.activeSubscribersCount} مشترك نشط. قم بتعطيلها بدلاً من حذفها.`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'حسناً'
      });
      return;
    }

    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف خطة "${plan.name}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.ownerService.deletePlan(plan.id).subscribe({
          next: () => {
            this.plans.update(plans => plans.filter(p => p.id !== plan.id));
            this.notificationService.success('تم حذف الخطة بنجاح');
          },
          error: (err: any) => {
            console.error('Error deleting plan:', err);
            if (err.status === 409) {
              this.notificationService.error('لا يمكن حذف الخطة - توجد اشتراكات نشطة عليها');
            } else {
              this.notificationService.error('حدث خطأ أثناء حذف الخطة');
            }
          }
        });
      }
    });
  }

  async onExport(format: ExportFormat): Promise<void> {
    const plans = this.plans();
    const exportConfig = {
      title: 'خطط الاشتراك',
      fileName: 'subscription-plans',
      columns: [
        { header: 'اسم الخطة', field: 'name' },
        { header: 'السعر (جنيه)', field: 'price' },
        { header: 'المدة (شهور)', field: 'durationMonths' },
        { header: 'الحالة', field: 'status' },
        { header: 'عدد المشتركين', field: 'subscribersCount' },
        { header: 'المميزات', field: 'features' }
      ],
      data: plans.map(p => ({
        name: p.name,
        price: p.price.toString(),
        durationMonths: p.durationMonths.toString(),
        status: p.isActive !== false ? 'نشط' : 'غير نشط',
        subscribersCount: (p.activeSubscribersCount || 0).toString(),
        features: (p.features || []).join(', ')
      }))
    };

    switch (format) {
      case 'pdf': await this.exportService.exportToPDF(exportConfig); break;
      case 'word': await this.exportService.exportToWord(exportConfig); break;
      case 'text': this.exportService.exportToText(exportConfig); break;
      case 'csv': this.exportService.exportToCSV(exportConfig); break;
      case 'preview': this.exportService.printPreview(exportConfig); break;
      case 'print': this.exportService.print(exportConfig); break;
    }
  }
}
