import { Component, signal, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CoachService, ProfileResponse, UpdateProfileRequest } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-coach-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    InputTextareaModule,
    ToastModule,
    SkeletonModule,
    PageHeaderComponent
  ],
  template: `
    <div class="profile-page">
      <app-page-header
        title="الملف الشخصي"
        subtitle="إدارة بياناتك الشخصية وإعدادات الحساب"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'الملف الشخصي'}]"
      ></app-page-header>

      <!-- Loading State -->
      <div class="profile-skeleton" *ngIf="loading()">
        <div class="skeleton-card">
          <p-skeleton shape="circle" size="120px"></p-skeleton>
          <p-skeleton width="200px" height="24px"></p-skeleton>
          <p-skeleton width="150px" height="16px"></p-skeleton>
        </div>
        <div class="skeleton-form">
          <p-skeleton width="100%" height="50px"></p-skeleton>
          <p-skeleton width="100%" height="50px"></p-skeleton>
          <p-skeleton width="100%" height="50px"></p-skeleton>
        </div>
      </div>

      <div class="profile-content" *ngIf="!loading()">
        <!-- Profile Header Card -->
        <div class="profile-header-card">
          <div class="profile-cover"></div>
          <div class="profile-header-content">
            <div class="avatar-section">
              <div class="avatar-wrapper" (click)="triggerFileInput()">
                <img
                  *ngIf="profilePictureUrl()"
                  [src]="getFullImageUrl(profilePictureUrl()!)"
                  alt="Profile Picture"
                  class="avatar-image"
                />
                <div *ngIf="!profilePictureUrl()" class="avatar-placeholder">
                  <i class="pi pi-user"></i>
                </div>
                <div class="avatar-overlay">
                  <i class="pi pi-camera"></i>
                  <span>تغيير الصورة</span>
                </div>
                <div class="upload-spinner" *ngIf="uploadingImage()">
                  <i class="pi pi-spin pi-spinner"></i>
                </div>
              </div>
              <input
                #fileInput
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                style="display: none"
              />
              <button
                *ngIf="profilePictureUrl()"
                class="delete-photo-btn"
                (click)="deleteProfilePicture()"
                [disabled]="uploadingImage()"
              >
                <i class="pi pi-trash"></i>
              </button>
            </div>
            <div class="profile-info">
              <h1 class="profile-name">{{ profileForm.fullName || 'اسم المستخدم' }}</h1>
              <div class="profile-meta">
                <span class="meta-item">
                  <i class="pi pi-envelope"></i>
                  {{ profile()?.email }}
                </span>
                <span class="meta-item" *ngIf="profile()?.phoneNumber">
                  <i class="pi pi-phone"></i>
                  {{ profile()?.phoneNumber }}
                </span>
                <span class="role-badge">
                  <i class="pi pi-shield"></i>
                  {{ getRoleName(profile()?.role || 0) }}
                </span>
              </div>
            </div>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-value">{{ profile()?.walletBalance?.toFixed(2) || '0.00' }}</span>
                <span class="stat-label">الرصيد</span>
              </div>
              <div class="stat-item">
                <span class="stat-value status-active" *ngIf="profile()?.isActive">نشط</span>
                <span class="stat-value status-inactive" *ngIf="!profile()?.isActive">غير نشط</span>
                <span class="stat-label">الحالة</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Form -->
        <div class="profile-form-card">
          <div class="card-header">
            <h2><i class="pi pi-user-edit"></i> البيانات الشخصية</h2>
          </div>
          <div class="form-content">
            <div class="form-grid">
              <!-- Full Name -->
              <div class="form-group full-width">
                <label>الاسم الكامل</label>
                <div class="input-wrapper">
                  <i class="pi pi-user"></i>
                  <input
                    type="text"
                    pInputText
                    [(ngModel)]="profileForm.fullName"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
              </div>

              <!-- Gender -->
              <div class="form-group">
                <label>الجنس</label>
                <p-dropdown
                  [options]="genderOptions"
                  [(ngModel)]="profileForm.gender"
                  placeholder="اختر الجنس"
                  [style]="{width: '100%'}"
                ></p-dropdown>
              </div>

              <!-- Birth Date -->
              <div class="form-group">
                <label>تاريخ الميلاد</label>
                <p-calendar
                  [(ngModel)]="profileForm.birthDate"
                  dateFormat="yy-mm-dd"
                  [showIcon]="true"
                  [style]="{width: '100%'}"
                  placeholder="اختر تاريخ الميلاد"
                ></p-calendar>
              </div>

              <!-- Height -->
              <div class="form-group">
                <label>الطول (سم)</label>
                <p-inputNumber
                  [(ngModel)]="profileForm.heightCm"
                  [min]="100"
                  [max]="250"
                  suffix=" سم"
                  placeholder="الطول"
                ></p-inputNumber>
              </div>

              <!-- Weight -->
              <div class="form-group">
                <label>الوزن (كجم)</label>
                <p-inputNumber
                  [(ngModel)]="profileForm.weightKg"
                  [min]="30"
                  [max]="300"
                  [maxFractionDigits]="1"
                  suffix=" كجم"
                  placeholder="الوزن"
                ></p-inputNumber>
              </div>

              <!-- Activity Level -->
              <div class="form-group">
                <label>مستوى النشاط</label>
                <p-dropdown
                  [options]="activityLevelOptions"
                  [(ngModel)]="profileForm.activityLevel"
                  placeholder="اختر مستوى النشاط"
                  [style]="{width: '100%'}"
                ></p-dropdown>
              </div>

              <!-- Fitness Goal -->
              <div class="form-group">
                <label>الهدف</label>
                <p-dropdown
                  [options]="fitnessGoalOptions"
                  [(ngModel)]="profileForm.fitnessGoal"
                  placeholder="اختر هدفك"
                  [style]="{width: '100%'}"
                ></p-dropdown>
              </div>

              <!-- Medical History -->
              <div class="form-group full-width">
                <label>التاريخ الطبي</label>
                <textarea
                  pInputTextarea
                  [(ngModel)]="profileForm.medicalHistory"
                  rows="3"
                  placeholder="أي معلومات طبية مهمة (اختياري)"
                ></textarea>
              </div>
            </div>

            <!-- BMI Calculator -->
            <div class="bmi-section" *ngIf="profileForm.heightCm && profileForm.weightKg">
              <div class="bmi-card">
                <div class="bmi-header">
                  <i class="pi pi-chart-bar"></i>
                  <span>مؤشر كتلة الجسم (BMI)</span>
                </div>
                <div class="bmi-value" [class]="getBMIClass()">
                  {{ calculateBMI() }}
                </div>
                <div class="bmi-label">{{ getBMILabel() }}</div>
                <div class="bmi-scale">
                  <div class="scale-segment underweight" [class.active]="calculateBMI() < 18.5">نقص</div>
                  <div class="scale-segment normal" [class.active]="calculateBMI() >= 18.5 && calculateBMI() < 25">طبيعي</div>
                  <div class="scale-segment overweight" [class.active]="calculateBMI() >= 25 && calculateBMI() < 30">زيادة</div>
                  <div class="scale-segment obese" [class.active]="calculateBMI() >= 30">سمنة</div>
                </div>
              </div>
            </div>

            <!-- Save Button -->
            <div class="form-actions">
              <button
                class="btn btn-primary"
                (click)="saveProfile()"
                [disabled]="saving()"
              >
                <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
                <i class="pi pi-check" *ngIf="!saving()"></i>
                <span>{{ saving() ? 'جاري الحفظ...' : 'حفظ التغييرات' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Account Info Card -->
        <div class="account-info-card">
          <div class="card-header">
            <h2><i class="pi pi-cog"></i> معلومات الحساب</h2>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">معرف المستخدم</span>
              <span class="info-value code">{{ profile()?.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">البريد الإلكتروني</span>
              <span class="info-value">{{ profile()?.email }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">رقم الهاتف</span>
              <span class="info-value">{{ profile()?.phoneNumber || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">نوع الحساب</span>
              <span class="info-value">{{ getRoleName(profile()?.role || 0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 1200px;
    }

    .profile-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .skeleton-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .skeleton-form {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Profile Header Card */
    .profile-header-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
    }

    .profile-cover {
      height: 120px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
    }

    .profile-header-content {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      padding: 0 2rem 2rem;
      margin-top: -60px;
      flex-wrap: wrap;
    }

    .avatar-section {
      position: relative;
    }

    .avatar-wrapper {
      width: 120px;
      height: 120px;
      border-radius: 20px;
      overflow: hidden;
      border: 4px solid var(--bg-primary);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      position: relative;
      background: var(--bg-secondary);
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;

      i {
        font-size: 3rem;
      }
    }

    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      opacity: 0;
      transition: opacity 0.3s;
      gap: 0.25rem;

      i {
        font-size: 1.5rem;
      }

      span {
        font-size: 0.75rem;
      }
    }

    .avatar-wrapper:hover .avatar-overlay {
      opacity: 1;
    }

    .upload-spinner {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      i {
        font-size: 2rem;
      }
    }

    .delete-photo-btn {
      position: absolute;
      bottom: -8px;
      left: -8px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      border: 2px solid var(--bg-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #dc2626;
        transform: scale(1.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .profile-info {
      flex: 1;
      padding-top: 70px;
      min-width: 200px;
    }

    .profile-name {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .profile-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        color: var(--text-muted);
      }
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .profile-stats {
      display: flex;
      gap: 2rem;
      padding-top: 70px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      color: #3b82f6;

      &.status-active {
        color: #22c55e;
      }
      &.status-inactive {
        color: #ef4444;
      }
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Profile Form Card */
    .profile-form-card,
    .account-info-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);

      h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          color: #3b82f6;
        }
      }
    }

    .form-content {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      &.full-width {
        grid-column: span 2;
      }

      label {
        font-weight: 500;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .input-wrapper {
        position: relative;

        i {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        input {
          padding-right: 2.5rem;
        }
      }

      input, textarea {
        width: 100%;
      }
    }

    :host ::ng-deep {
      .p-inputtext,
      .p-dropdown,
      .p-calendar,
      .p-inputnumber {
        width: 100%;
      }

      .p-inputtext {
        padding: 0.75rem 1rem;
        border-radius: 10px;
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);

        &:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      .p-dropdown {
        border-radius: 10px;
      }

      .p-calendar input {
        border-radius: 10px;
      }
    }

    /* BMI Section */
    .bmi-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .bmi-card {
      background: var(--bg-secondary);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
    }

    .bmi-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      i {
        color: #3b82f6;
      }
    }

    .bmi-value {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 0.25rem;

      &.underweight { color: #3b82f6; }
      &.normal { color: #22c55e; }
      &.overweight { color: #f59e0b; }
      &.obese { color: #ef4444; }
    }

    .bmi-label {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .bmi-scale {
      display: flex;
      gap: 0.25rem;
      border-radius: 8px;
      overflow: hidden;
    }

    .scale-segment {
      flex: 1;
      padding: 0.5rem;
      font-size: 0.75rem;
      color: white;
      opacity: 0.4;
      transition: opacity 0.3s;

      &.underweight { background: #3b82f6; }
      &.normal { background: #22c55e; }
      &.overweight { background: #f59e0b; }
      &.obese { background: #ef4444; }

      &.active {
        opacity: 1;
      }
    }

    /* Form Actions */
    .form-actions {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-size: 1rem;

      &.btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    /* Account Info Card */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      padding: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .info-value {
      font-size: 0.95rem;
      color: var(--text-primary);
      font-weight: 500;

      &.code {
        font-family: monospace;
        font-size: 0.8rem;
        background: var(--bg-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        word-break: break-all;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .profile-header-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .profile-info {
        padding-top: 1rem;
      }

      .profile-meta {
        justify-content: center;
      }

      .profile-stats {
        padding-top: 1rem;
        justify-content: center;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-group.full-width {
        grid-column: span 1;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CoachProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  uploadingImage = signal(false);
  profile = signal<ProfileResponse | null>(null);
  profilePictureUrl = signal<string | null>(null);

  profileForm = {
    fullName: '',
    gender: null as number | null,
    birthDate: null as Date | null,
    heightCm: null as number | null,
    weightKg: null as number | null,
    activityLevel: '',
    fitnessGoal: '',
    medicalHistory: ''
  };

  genderOptions = [
    { label: 'ذكر', value: 0 },
    { label: 'أنثى', value: 1 }
  ];

  activityLevelOptions = [
    { label: 'قليل الحركة', value: 'Sedentary' },
    { label: 'نشاط خفيف', value: 'Light' },
    { label: 'نشاط متوسط', value: 'Moderate' },
    { label: 'نشيط', value: 'Active' },
    { label: 'نشيط جداً', value: 'Very Active' }
  ];

  fitnessGoalOptions = [
    { label: 'إنقاص الوزن', value: 'Lose Weight' },
    { label: 'بناء العضلات', value: 'Build Muscle' },
    { label: 'الحفاظ على الوزن', value: 'Maintain' },
    { label: 'تحسين اللياقة', value: 'Improve Fitness' }
  ];

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);

    this.coachService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.profilePictureUrl.set(data.profile?.profilePictureUrl || null);

        // Populate form
        if (data.profile) {
          this.profileForm.fullName = data.profile.fullName || '';
          this.profileForm.gender = data.profile.gender || null;
          this.profileForm.birthDate = data.profile.birthDate ? new Date(data.profile.birthDate) : null;
          this.profileForm.heightCm = data.profile.heightCm || null;
          this.profileForm.weightKg = data.profile.weightKg || null;
          this.profileForm.activityLevel = data.profile.activityLevel || '';
          this.profileForm.fitnessGoal = data.profile.fitnessGoal || '';
          this.profileForm.medicalHistory = data.profile.medicalHistory || '';
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.notificationService.error('حدث خطأ أثناء تحميل البيانات');
        this.loading.set(false);
      }
    });
  }

  saveProfile(): void {
    this.saving.set(true);

    const request: UpdateProfileRequest = {
      fullName: this.profileForm.fullName || undefined,
      gender: this.profileForm.gender || undefined,
      birthDate: this.profileForm.birthDate ? this.profileForm.birthDate.toISOString().split('T')[0] : undefined,
      heightCm: this.profileForm.heightCm || undefined,
      weightKg: this.profileForm.weightKg || undefined,
      activityLevel: this.profileForm.activityLevel || undefined,
      fitnessGoal: this.profileForm.fitnessGoal || undefined,
      medicalHistory: this.profileForm.medicalHistory || undefined
    };

    this.coachService.updateProfile(request).subscribe({
      next: () => {
        this.notificationService.success('تم حفظ التغييرات بنجاح');
        this.saving.set(false);

        // Update auth service user name if changed
        if (this.profileForm.fullName) {
          this.authService.updateUserName(this.profileForm.fullName);
        }
      },
      error: (err) => {
        console.error('Error saving profile:', err);
        this.notificationService.error('حدث خطأ أثناء حفظ التغييرات');
        this.saving.set(false);
      }
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.notificationService.error('نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, GIF, WEBP');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notificationService.error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    this.uploadingImage.set(true);

    this.coachService.uploadProfilePicture(file).subscribe({
      next: (response) => {
        this.profilePictureUrl.set(response.url);
        this.notificationService.success('تم تحديث الصورة بنجاح');
        this.uploadingImage.set(false);

        // Clear the input
        input.value = '';
      },
      error: (err) => {
        console.error('Error uploading image:', err);
        this.notificationService.error('حدث خطأ أثناء رفع الصورة');
        this.uploadingImage.set(false);
        input.value = '';
      }
    });
  }

  deleteProfilePicture(): void {
    this.uploadingImage.set(true);

    this.coachService.deleteProfilePicture().subscribe({
      next: () => {
        this.profilePictureUrl.set(null);
        this.notificationService.success('تم حذف الصورة بنجاح');
        this.uploadingImage.set(false);
      },
      error: (err) => {
        console.error('Error deleting image:', err);
        this.notificationService.error('حدث خطأ أثناء حذف الصورة');
        this.uploadingImage.set(false);
      }
    });
  }

  getFullImageUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  getRoleName(role: number): string {
    const roles: Record<number, string> = {
      0: 'متدرب',
      1: 'مدرب',
      2: 'مدير'
    };
    return roles[role] || 'مستخدم';
  }

  calculateBMI(): number {
    if (!this.profileForm.heightCm || !this.profileForm.weightKg) return 0;
    const heightM = this.profileForm.heightCm / 100;
    const bmi = this.profileForm.weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  }

  getBMIClass(): string {
    const bmi = this.calculateBMI();
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  getBMILabel(): string {
    const bmi = this.calculateBMI();
    if (bmi < 18.5) return 'نقص في الوزن';
    if (bmi < 25) return 'وزن طبيعي';
    if (bmi < 30) return 'زيادة في الوزن';
    return 'سمنة';
  }
}
