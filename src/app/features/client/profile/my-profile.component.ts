import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ClientService, ClientProfile } from '../services/client.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    FileUploadModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="my-profile-page">
      <app-page-header
        title="ملفي الشخصي"
        subtitle="إدارة معلوماتك الشخصية"
        [breadcrumbs]="[{label: 'ملفي الشخصي'}]"
      ></app-page-header>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>

      <div class="profile-content" *ngIf="!loading()">
        <!-- Profile Header -->
        <div class="profile-header card">
          <div class="avatar-section">
            <div class="avatar">
              @if (profile()?.profileImageUrl) {
                <img [src]="profile()?.profileImageUrl" [alt]="profile()?.fullName" />
              } @else {
                {{ getInitials(profile()?.fullName || '') }}
              }
            </div>
            <button class="change-avatar-btn">
              <i class="pi pi-camera"></i>
              تغيير الصورة
            </button>
          </div>
          <div class="profile-info">
            <h2>{{ profile()?.fullName }}</h2>
            <p class="email">{{ profile()?.email }}</p>
            @if (profile()?.coachName) {
              <div class="coach-badge">
                <i class="pi pi-user"></i>
                المدرب: {{ profile()?.coachName }}
              </div>
            }
          </div>
        </div>

        <!-- Profile Form -->
        <div class="profile-form card">
          <h3>المعلومات الشخصية</h3>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group">
                <label for="fullName">الاسم الكامل</label>
                <input
                  id="fullName"
                  type="text"
                  pInputText
                  formControlName="fullName"
                />
              </div>

              <div class="form-group">
                <label for="phoneNumber">رقم الهاتف</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  pInputText
                  formControlName="phoneNumber"
                />
              </div>

              <div class="form-group">
                <label for="email">البريد الإلكتروني</label>
                <input
                  id="email"
                  type="email"
                  pInputText
                  formControlName="email"
                  [readonly]="true"
                />
              </div>

              <div class="form-group">
                <label for="dateOfBirth">تاريخ الميلاد</label>
                <p-calendar
                  id="dateOfBirth"
                  formControlName="dateOfBirth"
                  dateFormat="yy-mm-dd"
                  [showIcon]="true"
                  [maxDate]="maxDate"
                  [style]="{width: '100%'}"
                ></p-calendar>
              </div>

              <div class="form-group">
                <label for="gender">الجنس</label>
                <p-dropdown
                  id="gender"
                  [options]="genderOptions"
                  formControlName="gender"
                  placeholder="اختر"
                  [style]="{width: '100%'}"
                ></p-dropdown>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="form.invalid || saving()"
              >
                @if (saving()) {
                  <i class="pi pi-spin pi-spinner"></i>
                } @else {
                  <i class="pi pi-check"></i>
                }
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>

        <!-- Change Password -->
        <div class="password-section card">
          <h3>تغيير كلمة المرور</h3>

          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
            <div class="form-grid">
              <div class="form-group">
                <label for="currentPassword">كلمة المرور الحالية</label>
                <input
                  id="currentPassword"
                  type="password"
                  pInputText
                  formControlName="currentPassword"
                />
              </div>

              <div class="form-group">
                <label for="newPassword">كلمة المرور الجديدة</label>
                <input
                  id="newPassword"
                  type="password"
                  pInputText
                  formControlName="newPassword"
                />
              </div>

              <div class="form-group">
                <label for="confirmPassword">تأكيد كلمة المرور</label>
                <input
                  id="confirmPassword"
                  type="password"
                  pInputText
                  formControlName="confirmPassword"
                />
              </div>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-outline"
                [disabled]="passwordForm.invalid || changingPassword()"
              >
                @if (changingPassword()) {
                  <i class="pi pi-spin pi-spinner"></i>
                } @else {
                  <i class="pi pi-lock"></i>
                }
                تغيير كلمة المرور
              </button>
            </div>
          </form>
        </div>

        <!-- Danger Zone -->
        <div class="danger-zone card">
          <h3>منطقة الخطر</h3>
          <p>هذه الإجراءات لا يمكن التراجع عنها. كن حذراً.</p>

          <div class="danger-actions">
            <button class="btn btn-danger-outline" (click)="confirmDeleteAccount()">
              <i class="pi pi-trash"></i>
              حذف الحساب
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-profile-page {
      max-width: 800px;
      padding-bottom: 2rem;
    }

    .card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;

      h3 {
        margin: 0 0 1.25rem;
        color: var(--text-primary);
      }
    }

    .profile-header {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar {
      width: 100px;
      height: 100px;
      border-radius: 20px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 600;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .change-avatar-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 0.8rem;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }
    }

    .profile-info {
      h2 {
        margin: 0 0 0.25rem;
        color: var(--text-primary);
      }

      .email {
        margin: 0 0 0.75rem;
        color: var(--text-secondary);
      }
    }

    .coach-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #ede9fe;
      color: #7c3aed;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
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

      input {
        width: 100%;

        &[readonly] {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &.btn-primary {
        background: #3b82f6;
        color: white;

        &:hover:not(:disabled) {
          background: #2563eb;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover:not(:disabled) {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.btn-danger-outline {
        background: transparent;
        border: 1px solid #dc2626;
        color: #dc2626;

        &:hover {
          background: #dc2626;
          color: white;
        }
      }
    }

    .danger-zone {
      border-color: #fecaca;

      h3 {
        color: #dc2626;
      }

      p {
        margin: 0 0 1rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }
    }

    .danger-actions {
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  loading = signal(true);
  saving = signal(false);
  changingPassword = signal(false);
  profile = signal<ClientProfile | null>(null);

  maxDate = new Date();

  genderOptions = [
    { label: 'ذكر', value: 0 },
    { label: 'أنثى', value: 1 }
  ];

  form: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    dateOfBirth: [null],
    gender: [null]
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);

    this.clientService.getProfile().subscribe({
      next: (data) => {
        // Map API response to component format
        const mappedProfile = this.mapProfileFromApi(data);
        this.profile.set(mappedProfile);
        this.form.patchValue({
          fullName: mappedProfile.fullName,
          phoneNumber: mappedProfile.phoneNumber,
          email: mappedProfile.email,
          dateOfBirth: mappedProfile.birthDate ? new Date(mappedProfile.birthDate) : null,
          gender: mappedProfile.gender
        });
        this.loading.set(false);
      },
      error: () => {
        // Mock data - using numeric gender values (0=Male, 1=Female) as per API
        const mockProfile: ClientProfile = {
          id: '1',
          fullName: 'أحمد محمد علي',
          email: 'ahmed@email.com',
          phoneNumber: '01012345678',
          birthDate: '1995-05-15',
          gender: '0', // Male = 0
          coachId: 'c1',
          coachName: 'محمد المدرب'
        };
        this.profile.set(mockProfile);
        this.form.patchValue({
          fullName: mockProfile.fullName,
          phoneNumber: mockProfile.phoneNumber,
          email: mockProfile.email,
          dateOfBirth: mockProfile.birthDate ? new Date(mockProfile.birthDate) : null,
          gender: Number(mockProfile.gender)
        });
        this.loading.set(false);
      }
    });
  }

  /**
   * Map API profile response to component format
   * API returns nested profile object with different field names
   */
  private mapProfileFromApi(data: ClientProfile): ClientProfile {
    return {
      ...data,
      // Map from nested profile object if present
      fullName: data.profile?.fullName || data.fullName,
      gender: data.profile?.gender?.toString() || data.gender,
      birthDate: data.profile?.birthDate || data.birthDate || data.dateOfBirth,
      height: data.profile?.heightCm || data.height,
      medicalHistory: data.profile?.medicalHistory || data.medicalHistory,
      // activeSubscription info
      coachName: data.activeSubscription?.planName ? undefined : data.coachName
    };
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);

    const formValue = this.form.getRawValue();

    this.clientService.updateProfile(formValue).subscribe({
      next: () => {
        this.saving.set(false);
        // Show success message
      },
      error: () => {
        this.saving.set(false);
        // Show error message
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      // Show error message
      return;
    }

    this.changingPassword.set(true);

    // API call to change password
    setTimeout(() => {
      this.changingPassword.set(false);
      this.passwordForm.reset();
    }, 1500);
  }

  confirmDeleteAccount(): void {
    if (confirm('هل أنت متأكد من حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      console.log('Delete account');
    }
  }
}
