import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { concatMap } from 'rxjs';
import { FreelanceOnboardingService } from '../../../../core/freelance/services/freelance-onboarding.service';
import { ApplicationRequestStatus, ApplicationTrackingStatus } from '../../../../core/freelance/models/freelance.models';

@Component({
  selector: 'app-application-status',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="status-page">
      <h2>متابعة الطلب</h2>
      @if (loading()) { <p class="muted">جارٍ تحميل حالة الطلب...</p> }
      @else {
        @if (status(); as application) {
        <div class="status-card" [class.needs-info]="application.status === Status.NeedsMoreInformation">
          <span class="badge">{{ statusLabel(application.status) }}</span>
          <h3>{{ applicationLabel(application.applicationType) }}</h3>
          @if (application.workspaceIdentifier) { <p class="muted" dir="ltr">{{ application.workspaceIdentifier }}</p> }
          <p class="muted">آخر تحديث: {{ (application.reviewedAt || application.submittedAt) | date:'mediumDate' }}</p>
        </div>
        @if (application.status === Status.NeedsMoreInformation) {
          <div class="information-request"><b>طلب الإدارة:</b><p>{{ application.informationRequest || 'يرجى استكمال البيانات المطلوبة.' }}</p></div>
          <form [formGroup]="form" (ngSubmit)="saveAndResubmit(application)">
            @for (field of application.requestedFields; track field) {
              <label>{{ fieldLabel(field) }}
                @if (isLongText(field)) { <textarea class="form-input" rows="4" [formControlName]="field"></textarea> }
                @else { <input class="form-input" [type]="field.includes('Color') ? 'color' : 'text'" [formControlName]="field" /> }
              </label>
            }
            @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
            <button class="btn btn-primary w-full" [disabled]="saving()">{{ saving() ? 'جارٍ إعادة التقديم...' : 'حفظ وإعادة تقديم الطلب' }}</button>
          </form>
        } @else if (application.status === Status.Rejected) {
          <p class="information-request">الطلب مرفوض. يمكنك إنشاء طلب جديد عند تجهيز البيانات أو تغيير الهوية المطلوبة.</p>
          <a routerLink="/auth/register-freelance" class="btn btn-primary">إنشاء طلب جديد</a>
        } @else { <p class="information-request">سنرسل التحديث عند انتقال الطلب إلى المرحلة التالية. يمكنك العودة لاحقًا عبر تسجيل الدخول بالهوية.</p> }
        } @else {
        <div class="information-request"><p>انتهت جلسة المتابعة أو لم تُفتح من هذا المتصفح.</p><a routerLink="/identity/login">سجّل الدخول بالهوية للمتابعة</a></div>
        }
      }
      @if (error() && !status()) { <p class="error" role="alert">{{ error() }}</p> }
    </section>
  `,
  styles: [`
    .status-page h2 { margin:0 0 1rem; color:var(--text-primary); font-size:1.7rem; }.status-card,.information-request { padding:1rem; border:1px solid var(--border-color); border-radius:10px; background:var(--bg-primary); }.status-card.needs-info { border-color:#f59e0b; }.status-card h3 { margin:.55rem 0 .25rem; color:var(--text-primary); }.badge { display:inline-block; padding:.25rem .55rem; border-radius:999px; background:rgba(37,99,235,.1); color:#1d4ed8; font-size:.8rem; font-weight:700; }.muted { color:var(--text-secondary); }.information-request { margin-top:1rem; color:var(--text-primary); line-height:1.7; }.information-request p { margin:.25rem 0 0; } form { display:grid; gap:.85rem; margin-top:1rem; } label { display:grid; gap:.35rem; color:var(--text-primary); font-size:.9rem; font-weight:600; }.form-input { width:100%; box-sizing:border-box; min-height:42px; padding:.65rem .75rem; border:1px solid var(--border-color); border-radius:8px; color:var(--text-primary); background:var(--bg-primary); font:inherit; }.btn { display:inline-flex; align-items:center; justify-content:center; min-height:46px; border:0; border-radius:8px; text-decoration:none; }.w-full { width:100%; }.btn:disabled { opacity:.65; }.error { color:#b91c1c; margin:0; }.status-page > .btn { margin-top:1rem; padding:0 1rem; }
  `],
})
export class ApplicationStatusComponent implements OnInit {
  private readonly onboarding = inject(FreelanceOnboardingService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly Status = ApplicationRequestStatus;
  readonly status = signal<ApplicationTrackingStatus | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({
    FullName: [''], WorkspaceName: [''], OwnerFullName: [''], BrandName: [''], LogoUrl: [''], PhotoUrl: [''], CoverImageUrl: [''], BackgroundImageUrl: [''], PrimaryColor: ['#2563eb'], SecondaryColor: ['#0f172a'], Bio: [''], Specialties: [''], Certifications: [''], SocialLinks: [''], WelcomeMessage: [''], BookingSettings: [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    if (!this.onboarding.getTrackingToken()) { this.loading.set(false); return; }
    this.loading.set(true); this.error.set('');
    this.onboarding.getTrackingStatus().subscribe({
      next: status => { this.status.set(status); this.patchEditableValues(status); this.loading.set(false); },
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر تحميل حالة الطلب.'); this.loading.set(false); },
    });
  }

  saveAndResubmit(application: ApplicationTrackingStatus): void {
    this.saving.set(true); this.error.set('');
    const fields: Record<string, unknown> = {};
    for (const field of application.requestedFields) fields[field] = this.toApiValue(field, this.form.get(field)?.value);
    this.onboarding.updateRequestedFields(fields).pipe(concatMap(() => this.onboarding.resubmit())).subscribe({
      next: status => { this.status.set(status); this.saving.set(false); },
      error: err => { this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر حفظ البيانات وإعادة التقديم.'); this.saving.set(false); },
    });
  }

  fieldLabel(field: string): string { return ({ FullName: 'الاسم الكامل', WorkspaceName: 'اسم مساحة العمل', OwnerFullName: 'اسم المالك', BrandName: 'الاسم التجاري', LogoUrl: 'رابط الشعار', PhotoUrl: 'رابط الصورة الشخصية', CoverImageUrl: 'رابط الغلاف', BackgroundImageUrl: 'رابط الخلفية', PrimaryColor: 'اللون الأساسي', SecondaryColor: 'اللون الثانوي', Bio: 'النبذة', Specialties: 'التخصصات (مفصولة بفواصل)', Certifications: 'الشهادات (مفصولة بفواصل)', SocialLinks: 'روابط التواصل بصيغة JSON', WelcomeMessage: 'رسالة الترحيب', BookingSettings: 'إعدادات الحجز بصيغة JSON' } as Record<string, string>)[field] || field; }
  isLongText(field: string): boolean { return ['Bio', 'WelcomeMessage', 'SocialLinks', 'BookingSettings'].includes(field); }
  statusLabel(status: ApplicationRequestStatus): string { return ({ 1: 'مسودة', 2: 'مُقدّم', 3: 'قيد المراجعة', 4: 'مطلوب استكمال', 5: 'مقبول', 6: 'مرفوض', 7: 'ملغى', 8: 'منتهي' } as Record<number, string>)[status]; }
  applicationLabel(type: number): string { return type === 2 ? 'طلب مساحة مدرب حر' : 'طلب انضمام إلى مساحة عمل'; }

  private patchEditableValues(status: ApplicationTrackingStatus): void {
    for (const [field, value] of Object.entries(status.editableValues || {})) {
      const control = this.form.get(field);
      if (control) control.setValue(Array.isArray(value) ? value.join(', ') : typeof value === 'object' && value ? JSON.stringify(value) : String(value ?? ''));
    }
  }

  private toApiValue(field: string, value: unknown): unknown {
    const text = String(value ?? '').trim();
    if (['Specialties', 'Certifications'].includes(field)) return text.split(',').map(item => item.trim()).filter(Boolean);
    if (['SocialLinks', 'BookingSettings'].includes(field)) { try { return text ? JSON.parse(text) : {}; } catch { return text; } }
    return text;
  }
}
