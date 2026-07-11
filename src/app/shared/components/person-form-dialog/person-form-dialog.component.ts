import {
  Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

export interface PersonFormValue {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password?: string;   // add mode only
  gender?: number;     // 1 = Male, 2 = Female (backend GenderType)
  birthDate?: string;  // yyyy-MM-dd
}

export interface PersonFormInitial extends Omit<PersonFormValue, 'password'> {}

/**
 * Reusable add/edit modal for a "person" (client or coach). Both entities share
 * the same create/update contract: fullName + phoneNumber (+ password on add),
 * with optional email / gender / birthDate. Theme-aware, RTL-friendly.
 */
@Component({
  selector: 'app-person-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (open) {
      <div class="pfd-overlay" (click)="onBackdrop($event)">
        <div class="pfd-modal" role="dialog" aria-modal="true">
          <div class="pfd-head">
            <h3>{{ (mode === 'add' ? 'إضافة ' : 'تعديل ') + entityLabel }}</h3>
            <button type="button" class="pfd-close" (click)="cancel.emit()" aria-label="إغلاق">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="pfd-body">
            <div class="pfd-field" data-tour="pf-fullName">
              <label>الاسم الكامل <span class="req">*</span></label>
              <input type="text" formControlName="fullName" placeholder="أدخل الاسم الكامل"
                [class.invalid]="invalid('fullName')" />
              <span class="err" *ngIf="invalid('fullName')">الاسم مطلوب</span>
            </div>

            <div class="pfd-field" data-tour="pf-phone">
              <label>رقم الهاتف <span class="req">*</span></label>
              <input type="tel" formControlName="phoneNumber" placeholder="01xxxxxxxxx"
                [class.invalid]="invalid('phoneNumber')" />
              <span class="err" *ngIf="invalid('phoneNumber')">رقم هاتف صحيح مطلوب</span>
            </div>

            <div class="pfd-field">
              <label>البريد الإلكتروني <span class="opt">(اختياري)</span></label>
              <input type="email" formControlName="email" placeholder="name@example.com"
                [class.invalid]="invalid('email')" />
              <span class="err" *ngIf="invalid('email')">صيغة البريد غير صحيحة</span>
            </div>

            @if (mode === 'add') {
              <div class="pfd-field" data-tour="pf-password">
                <label>كلمة المرور <span class="req">*</span></label>
                <input type="password" formControlName="password" placeholder="8 أحرف على الأقل"
                  [class.invalid]="invalid('password')" />
                <span class="err" *ngIf="invalid('password')">
                  8 أحرف على الأقل، وتحتوي حرف كبير وصغير ورقم
                </span>
              </div>
            }

            <div class="pfd-row">
              <div class="pfd-field">
                <label>النوع <span class="opt">(اختياري)</span></label>
                <select formControlName="gender">
                  <option [ngValue]="null">— اختر —</option>
                  <option [ngValue]="1">ذكر</option>
                  <option [ngValue]="2">أنثى</option>
                </select>
              </div>
              <div class="pfd-field">
                <label>تاريخ الميلاد <span class="opt">(اختياري)</span></label>
                <input type="date" formControlName="birthDate" />
              </div>
            </div>

            <div class="pfd-actions">
              <button type="button" class="btn btn-ghost" (click)="cancel.emit()" [disabled]="saving">إلغاء</button>
              <button type="submit" class="btn btn-primary" data-tour="pf-submit" [disabled]="saving">
                <i class="pi pi-spin pi-spinner" *ngIf="saving"></i>
                <span>{{ mode === 'add' ? 'إضافة' : 'حفظ التعديلات' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .pfd-overlay {
      position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, .55); backdrop-filter: blur(2px); padding: 1rem;
    }
    .pfd-modal {
      width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto;
      background: var(--bg-primary); border: 1px solid var(--border-color);
      border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
    }
    .pfd-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);
    }
    .pfd-head h3 { font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .pfd-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
    .pfd-close:hover { color: var(--text-primary); }
    .pfd-body { padding: 1.5rem; }
    .pfd-field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1.1rem; }
    .pfd-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .pfd-field label { font-size: .85rem; color: var(--text-secondary); font-weight: 500; }
    .pfd-field .req { color: #ef4444; } .pfd-field .opt { color: var(--text-muted); font-weight: 400; font-size: .78rem; }
    .pfd-field input, .pfd-field select {
      padding: .65rem .85rem; border: 1px solid var(--border-color); border-radius: 9px;
      background: var(--bg-secondary); color: var(--text-primary); font-size: .95rem; width: 100%;
    }
    .pfd-field input:focus, .pfd-field select:focus { outline: none; border-color: var(--primary-500, #3b82f6); }
    .pfd-field input.invalid { border-color: #ef4444; }
    .err { color: #ef4444; font-size: .78rem; }
    .pfd-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
      height: 44px; padding: 0 1.25rem; border-radius: 9px; font-weight: 600; font-size: .95rem;
      cursor: pointer; border: none;
    }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn-primary { background: var(--primary-500, #3b82f6); color: #fff; }
    .btn-primary:hover:not(:disabled) { filter: brightness(.95); }
    .btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }
    .btn-ghost:hover:not(:disabled) { background: var(--bg-secondary); }
    @media (max-width: 520px) { .pfd-row { grid-template-columns: 1fr; } }
  `]
})
export class PersonFormDialogComponent implements OnChanges {
  private fb = inject(FormBuilder);

  @Input() open = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() entityLabel = 'عميل';
  @Input() initial: PersonFormInitial | null = null;
  @Input() saving = false;

  @Output() save = new EventEmitter<PersonFormValue>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup = this.build();

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild when the dialog opens or switches mode/target so validators and
    // prefilled values match the current context.
    if (changes['open'] || changes['mode'] || changes['initial']) {
      if (this.open) this.reset();
    }
  }

  private build(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^0\d{9,10}$/)]],
      email: ['', [Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
      gender: [null as number | null],
      birthDate: ['']
    });
  }

  private reset(): void {
    const pw = this.form.get('password');
    if (this.mode === 'edit') {
      pw?.clearValidators();
    } else {
      pw?.setValidators([Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]);
    }
    pw?.updateValueAndValidity({ emitEvent: false });

    this.form.reset({
      fullName: this.initial?.fullName ?? '',
      phoneNumber: this.initial?.phoneNumber ?? '',
      email: this.initial?.email ?? '',
      password: '',
      gender: this.initial?.gender ?? null,
      birthDate: this.initial?.birthDate ? this.initial.birthDate.substring(0, 10) : ''
    });
  }

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    const payload: PersonFormValue = {
      fullName: v.fullName.trim(),
      phoneNumber: v.phoneNumber.trim(),
      email: v.email?.trim() || undefined,
      gender: v.gender ?? undefined,
      birthDate: v.birthDate || undefined
    };
    if (this.mode === 'add') payload.password = v.password;
    this.save.emit(payload);
  }

  onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget && !this.saving) this.cancel.emit();
  }
}
