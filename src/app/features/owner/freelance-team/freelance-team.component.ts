import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { FreelanceTeamService } from './freelance-team.service';

@Component({
  selector: 'app-freelance-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="team-page">
      <h1>فريق المدرب الحر</h1>
      @if (!auth.isFreelanceWorkspace()) {
        <div class="notice warning"><i class="pi pi-lock"></i> هذه الميزة متاحة لمساحة المدرب الحر فقط.</div>
      } @else {
        <p class="subtitle">أضف مدربًا أو مساعدًا أو عميلًا بطلب يخضع لموافقة إدارة المنصة. لا يُمنح الشخص أي وصول قبل الاعتماد.</p>
        <div class="notice"><i class="pi pi-info-circle"></i><span>يجب أن ينشئ الشخص هويته في LogicFit بالبريد نفسه أولًا. <a routerLink="/identity/register">إنشاء هوية مستقلة</a></span></div>
        <form [formGroup]="form" (ngSubmit)="submit()" class="team-form">
          <label>الاسم الكامل<input class="form-input" formControlName="fullName" /></label>
          <label>بريد الهوية<input class="form-input" type="email" formControlName="identityEmail" dir="ltr" /></label>
          <label>الدور المطلوب<select class="form-input" formControlName="requestedRole"><option [ngValue]="11">مدرب ضمن الفريق</option><option [ngValue]="12">مساعد مدرب</option><option [ngValue]="3">عميل</option></select></label>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          @if (success()) { <p class="success" role="status">{{ success() }}</p> }
          <button class="btn btn-primary" [disabled]="saving() || form.invalid">{{ saving() ? 'جارٍ إرسال الطلب...' : 'إرسال للموافقة' }}</button>
        </form>
      }
    </section>
  `,
  styles: [`
    .team-page { max-width:720px; }.team-page h1 { margin:0 0 .5rem; color:var(--text-primary); font-size:1.65rem; }.subtitle { color:var(--text-secondary); line-height:1.7; }.notice { display:flex; gap:.55rem; margin:1rem 0; padding:.8rem .9rem; border:1px solid #bfdbfe; border-radius:.65rem; color:#1e40af; background:#eff6ff; line-height:1.6; }.notice.warning { color:#92400e; border-color:#fde68a; background:#fffbeb; }.notice a { color:#1d4ed8; font-weight:700; }.team-form { display:grid; gap:.85rem; padding:1rem; border:1px solid var(--border-color); border-radius:.75rem; background:var(--bg-primary); } label { display:grid; gap:.35rem; color:var(--text-primary); font-size:.9rem; font-weight:600; }.form-input { width:100%; min-height:42px; box-sizing:border-box; padding:.65rem .75rem; border:1px solid var(--border-color); border-radius:8px; color:var(--text-primary); background:var(--bg-primary); font:inherit; }.btn { width:max-content; min-height:44px; padding:0 1rem; }.btn:disabled { opacity:.65; cursor:not-allowed; }.error { margin:0; color:#b91c1c; }.success { margin:0; color:#047857; }
  `],
})
export class FreelanceTeamComponent {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FreelanceTeamService);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    identityEmail: ['', [Validators.required, Validators.email]],
    requestedRole: [11 as 3 | 11 | 12, Validators.required],
  });

  submit(): void {
    if (this.form.invalid || !this.auth.isFreelanceWorkspace()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true); this.error.set(''); this.success.set('');
    this.service.sponsor(this.form.getRawValue()).subscribe({
      next: () => { this.saving.set(false); this.success.set('تم إرسال طلب الانضمام إلى إدارة المنصة للمراجعة.'); this.form.reset({ fullName: '', identityEmail: '', requestedRole: 11 }); },
      error: err => { this.saving.set(false); this.error.set(err?.translatedMessage || err?.error?.message || 'تعذر إرسال طلب الانضمام.'); },
    });
  }
}
