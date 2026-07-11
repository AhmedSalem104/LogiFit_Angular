import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ProfileService, SelfProfile } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-owner-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageHeaderComponent],
  template: `
    <div class="profile-page">
      <app-page-header
        title="الملف الشخصي"
        subtitle="بياناتك الشخصية وكلمة المرور"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'الملف الشخصي'}]"
      ></app-page-header>

      @if (loading()) {
        <div class="loading"><i class="pi pi-spin pi-spinner"></i> جاري التحميل...</div>
      } @else {
        <!-- Identity header -->
        <div class="card head-card">
          <div class="avatar-block">
            <div class="avatar">
              @if (profile()?.profile?.profilePictureUrl) {
                <img [src]="profileSvc.fullImageUrl(profile()?.profile?.profilePictureUrl)" alt="avatar" />
              } @else {
                <span>{{ initials() }}</span>
              }
            </div>
            <input #avatarInput type="file" accept="image/*" hidden (change)="onAvatar($event)" />
            <button class="link-btn" (click)="avatarInput.click()" [disabled]="uploadingAvatar()">
              <i class="pi" [class.pi-camera]="!uploadingAvatar()" [class.pi-spin]="uploadingAvatar()" [class.pi-spinner]="uploadingAvatar()"></i>
              {{ uploadingAvatar() ? 'جاري الرفع...' : 'تغيير الصورة' }}
            </button>
          </div>
          <div class="head-info">
            <h2>{{ profile()?.profile?.fullName || 'المستخدم' }}</h2>
            <span class="role-chip">{{ roleLabel() }}</span>
            <div class="read-rows">
              <div><i class="pi pi-phone"></i> {{ profile()?.phoneNumber || '—' }}</div>
              <div><i class="pi pi-envelope"></i> {{ profile()?.email || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- Personal info -->
        <form [formGroup]="form" (ngSubmit)="save()" class="card">
          <h3>البيانات الشخصية</h3>
          <div class="grid2">
            <div class="field">
              <label>الاسم الكامل <span class="req">*</span></label>
              <input type="text" formControlName="fullName" [class.invalid]="invalid('fullName')" />
              <span class="err" *ngIf="invalid('fullName')">الاسم مطلوب</span>
            </div>
            <div class="field">
              <label>النوع</label>
              <select formControlName="gender">
                <option [ngValue]="null">— اختر —</option>
                <option [ngValue]="1">ذكر</option>
                <option [ngValue]="2">أنثى</option>
              </select>
            </div>
            <div class="field">
              <label>تاريخ الميلاد</label>
              <input type="date" formControlName="birthDate" />
            </div>
          </div>
          <div class="actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>

        <!-- Change password -->
        <form [formGroup]="pwForm" (ngSubmit)="changePassword()" class="card">
          <h3>تغيير كلمة المرور</h3>
          <div class="grid2">
            <div class="field">
              <label>كلمة المرور الحالية <span class="req">*</span></label>
              <input type="password" formControlName="currentPassword" [class.invalid]="invalidPw('currentPassword')" />
              <span class="err" *ngIf="invalidPw('currentPassword')">مطلوبة</span>
            </div>
            <div class="field">
              <label>كلمة المرور الجديدة <span class="req">*</span></label>
              <input type="password" formControlName="newPassword" [class.invalid]="invalidPw('newPassword')" />
              <span class="err" *ngIf="invalidPw('newPassword')">8 أحرف على الأقل، حرف كبير وصغير ورقم</span>
            </div>
            <div class="field">
              <label>تأكيد كلمة المرور <span class="req">*</span></label>
              <input type="password" formControlName="confirmPassword" [class.invalid]="invalidPw('confirmPassword')" />
              <span class="err" *ngIf="invalidPw('confirmPassword')">مطلوب</span>
            </div>
          </div>
          <div class="actions">
            <button type="submit" class="btn btn-secondary" [disabled]="changingPw()">
              <i class="pi pi-spin pi-spinner" *ngIf="changingPw()"></i>
              <span>تحديث كلمة المرور</span>
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .profile-page { max-width: 900px; }
    .loading { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .card { background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.25rem; }
    h2 { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0; }
    h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 1.1rem; }
    .head-card { display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap; }
    .avatar-block { display: flex; flex-direction: column; align-items: center; gap: .5rem; }
    .avatar { width: 88px; height: 88px; border-radius: 20px; overflow: hidden; background: var(--gradient-primary, #3b82f6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .link-btn { display: inline-flex; align-items: center; gap: .35rem; background: none; border: none; color: var(--primary-500, #3b82f6); cursor: pointer; font-size: .82rem; font-weight: 600; }
    .link-btn:disabled { opacity: .6; cursor: not-allowed; }
    .head-info { flex: 1; min-width: 220px; }
    .role-chip { display: inline-block; margin: .35rem 0 .6rem; font-size: .72rem; font-weight: 700; padding: .15rem .6rem; border-radius: 999px; background: var(--role-soft, rgba(59,130,246,.12)); color: var(--role-solid, #3b82f6); }
    .read-rows { display: flex; flex-wrap: wrap; gap: 1.25rem; color: var(--text-secondary); font-size: .9rem; }
    .read-rows i { color: var(--text-muted); margin-inline-end: .35rem; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: .4rem; }
    .field label { font-size: .85rem; color: var(--text-secondary); font-weight: 500; }
    .field .req { color: #ef4444; }
    .field input, .field select { padding: .65rem .85rem; border: 1px solid var(--border-color); border-radius: 9px; background: var(--bg-secondary); color: var(--text-primary); font-size: .95rem; }
    .field input:focus, .field select:focus { outline: none; border-color: var(--primary-500, #3b82f6); }
    .field input.invalid { border-color: #ef4444; }
    .err { color: #ef4444; font-size: .78rem; }
    .actions { margin-top: 1.25rem; display: flex; justify-content: flex-end; }
    .btn { display: inline-flex; align-items: center; gap: .5rem; height: 44px; padding: 0 1.3rem; border-radius: 9px; font-weight: 600; border: none; cursor: pointer; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn-primary { background: var(--primary-500, #3b82f6); color: #fff; }
    .btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
    @media (max-width: 600px) { .grid2 { grid-template-columns: 1fr; } }
  `]
})
export class OwnerProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);
  protected profileSvc = inject(ProfileService);
  private auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  changingPw = signal(false);
  uploadingAvatar = signal(false);
  profile = signal<SelfProfile | null>(null);

  form: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    gender: [null as number | null],
    birthDate: ['']
  });

  pwForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
    confirmPassword: ['', Validators.required]
  });

  private readonly ROLE_AR: Record<number, string> = {
    1: 'المالك', 2: 'مدرب', 3: 'عميل', 4: 'مدير', 5: 'موظف استقبال', 6: 'محاسب', 7: 'مدرب'
  };

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.profileSvc.get().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form.patchValue({
          fullName: p.profile?.fullName ?? '',
          gender: p.profile?.gender ?? null,
          birthDate: p.profile?.birthDate ? p.profile.birthDate.substring(0, 10) : ''
        });
        this.loading.set(false);
      },
      error: () => { this.notify.error('تعذّر تحميل الملف الشخصي'); this.loading.set(false); }
    });
  }

  roleLabel(): string { return this.ROLE_AR[this.profile()?.role ?? 0] || 'مستخدم'; }
  initials(): string {
    const n = this.profile()?.profile?.fullName || '';
    return n.split(' ').map(x => x[0]).slice(0, 2).join('') || '؟';
  }

  invalid(f: string): boolean { const c = this.form.get(f); return !!(c && c.invalid && c.touched); }
  invalidPw(f: string): boolean { const c = this.pwForm.get(f); return !!(c && c.invalid && c.touched); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.saving.set(true);
    this.profileSvc.update({
      fullName: v.fullName,
      gender: v.gender ?? undefined,
      birthDate: v.birthDate || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('تم حفظ التغييرات بنجاح');
        if (v.fullName) this.auth.updateUserName(v.fullName);
        this.profile.update(p => p ? { ...p, profile: { ...p.profile, fullName: v.fullName, gender: v.gender ?? undefined, birthDate: v.birthDate || undefined } } : p);
      },
      error: (e) => { this.saving.set(false); this.notify.error(e?.translatedMessage || 'تعذّر حفظ التغييرات'); }
    });
  }

  changePassword(): void {
    if (this.pwForm.invalid) { this.pwForm.markAllAsTouched(); return; }
    const { currentPassword, newPassword, confirmPassword } = this.pwForm.value;
    if (newPassword !== confirmPassword) { this.notify.error('كلمة المرور الجديدة وتأكيدها غير متطابقين'); return; }
    this.changingPw.set(true);
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => { this.changingPw.set(false); this.notify.success('تم تغيير كلمة المرور بنجاح'); this.pwForm.reset(); },
      error: (err) => {
        this.changingPw.set(false);
        this.notify.error(err?.status === 401 ? 'كلمة المرور الحالية غير صحيحة' : (err?.translatedMessage || 'تعذّر تغيير كلمة المرور'));
      }
    });
  }

  onAvatar(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const okTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!okTypes.includes(file.type)) { this.notify.error('نوع الملف غير مدعوم. اختر صورة (JPG, PNG, GIF, WEBP).'); input.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { this.notify.error('حجم الصورة يتجاوز 5 ميجابايت.'); input.value = ''; return; }
    input.value = '';
    this.uploadingAvatar.set(true);
    this.profileSvc.uploadPicture(file).subscribe({
      next: (res) => {
        this.uploadingAvatar.set(false);
        this.profile.update(p => p ? { ...p, profile: { ...p.profile, profilePictureUrl: res.url } } : p);
        this.notify.success('تم تحديث الصورة بنجاح');
      },
      error: (e) => { this.uploadingAvatar.set(false); this.notify.error(e?.translatedMessage || 'تعذّر رفع الصورة'); }
    });
  }
}
