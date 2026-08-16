import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ClientService, AthleteCheckin } from '../services/client.service';

@Component({
  selector: 'app-my-checkins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="page">
      <header class="header"><div><span class="eyebrow">المتابعة اليومية</span><h1>استعدادي اليومي</h1><p>سجل نومك ومزاجك وإجهادك ليساعد المدرب على تعديل الخطة بأمان.</p></div><button class="primary" type="button" (click)="resetForm()">Check-in جديد</button></header>
      @if (message()) { <div class="message" [class.error]="messageType() === 'error'" role="status">{{ message() }}</div> }
      <section class="layout">
        <form class="card form" [formGroup]="form" (ngSubmit)="save()">
          <h2>{{ editingId() ? 'تعديل Check-in' : 'تسجيل Check-in اليوم' }}</h2>
          <label>التاريخ<input type="date" formControlName="checkinDate"></label>
          <div class="form-grid"><label>ساعات النوم<input type="number" min="0" max="24" step="0.5" formControlName="sleepHours"></label><label>نبض الراحة<input type="number" min="20" max="250" formControlName="restingHeartRate"></label><label>HRV<input type="number" min="0" max="500" formControlName="hrv"></label><label>الوزن (كجم)<input type="number" min="0" max="1000" step="0.1" formControlName="bodyweightKg"></label></div>
          <div class="scale-grid"><label>جودة النوم<select formControlName="sleepQuality"><option [ngValue]="null">—</option><option [ngValue]="1">1 - ضعيف</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option><option [ngValue]="4">4</option><option [ngValue]="5">5 - ممتاز</option></select></label><label>الإجهاد<select formControlName="fatigue"><option [ngValue]="null">—</option><option [ngValue]="1">1 - منخفض</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option><option [ngValue]="4">4</option><option [ngValue]="5">5 - مرتفع</option></select></label><label>ألم العضلات<select formControlName="soreness"><option [ngValue]="null">—</option><option [ngValue]="1">1 - منخفض</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option><option [ngValue]="4">4</option><option [ngValue]="5">5 - مرتفع</option></select></label><label>التوتر<select formControlName="stress"><option [ngValue]="null">—</option><option [ngValue]="1">1 - منخفض</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option><option [ngValue]="4">4</option><option [ngValue]="5">5 - مرتفع</option></select></label><label>المزاج<select formControlName="mood"><option [ngValue]="null">—</option><option [ngValue]="1">1 - سيئ</option><option [ngValue]="2">2</option><option [ngValue]="3">3</option><option [ngValue]="4">4</option><option [ngValue]="5">5 - ممتاز</option></select></label></div>
          <label>ملاحظات<textarea rows="3" maxlength="1000" formControlName="notes"></textarea></label>
          <div class="form-actions"><button type="submit" class="primary" [disabled]="saving()">{{ saving() ? 'جاري الحفظ...' : 'حفظ Check-in' }}</button><button type="button" class="secondary" (click)="resetForm()">إلغاء</button></div>
        </form>
        <section class="card history"><div class="section-heading"><h2>السجل السابق</h2><span>{{ checkins().length }} سجل</span></div>@if (loading()) { <div class="empty">جاري التحميل...</div> } @else if (!checkins().length) { <div class="empty">لا يوجد سجل بعد.</div> } @else { @for (checkin of checkins(); track checkin.id) { <article class="checkin"><div><strong>{{ checkin.checkinDate | date:'dd/MM/yyyy' }}</strong><small>النوم {{ checkin.sleepHours ?? '—' }} ساعة · الوزن {{ checkin.bodyweightKg ?? '—' }} كجم</small></div><span class="score">{{ checkin.readinessScore ?? '—' }}%</span><button type="button" class="link" (click)="edit(checkin)">تعديل</button></article> } }</section>
      </section>
    </main>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding: 2rem; color: #0f172a; } .header, .section-heading, .form-actions { display: flex; justify-content: space-between; gap: 1rem; align-items: center; } .header { align-items: flex-start; margin-bottom: 1.3rem; } .eyebrow, p, small, .section-heading span { color: #64748b; font-size: .86rem; } h1 { margin: .35rem 0; } p { margin: 0; } h2 { margin: 0 0 1rem; font-size: 1.1rem; } .layout { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 1rem; } .card { background: #fff; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 8px 24px rgba(15,23,42,.07); } label { display: grid; gap: .4rem; color: #475569; font-size: .86rem; margin-bottom: .8rem; } input, select, textarea { border: 1px solid #cbd5e1; border-radius: .55rem; padding: .65rem; font: inherit; color: #0f172a; background: #fff; } .form-grid, .scale-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .7rem; } .scale-grid { grid-template-columns: repeat(3, 1fr); } .form-grid label, .scale-grid label { margin: 0; } button { border: 0; border-radius: .55rem; padding: .65rem .9rem; cursor: pointer; font: inherit; } button:disabled { opacity: .6; cursor: not-allowed; } .primary { color: #fff; background: #2563eb; } .secondary { color: #334155; background: #e2e8f0; } .link { color: #2563eb; background: transparent; padding: .2rem; } .form-actions { justify-content: flex-start; margin-top: .5rem; } .message { color: #166534; background: #dcfce7; padding: .75rem; border-radius: .6rem; margin-bottom: 1rem; } .message.error { color: #991b1b; background: #fee2e2; } .empty { color: #64748b; padding: 1rem 0; } .checkin { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: .6rem; padding: .8rem 0; border-bottom: 1px solid #e2e8f0; } .checkin:last-child { border-bottom: 0; } .checkin strong, .checkin small { display: block; } .checkin small { margin-top: .25rem; } .score { color: #0f766e; font-weight: 700; } @media (max-width: 800px) { .page { padding: 1rem; } .layout { grid-template-columns: 1fr; } } @media (max-width: 520px) { .form-grid, .scale-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class MyCheckinsComponent implements OnInit {
  private readonly client = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly checkins = signal<AthleteCheckin[]>([]);
  readonly message = signal('');
  readonly messageType = signal<'success' | 'error'>('success');
  readonly editingId = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    checkinDate: [this.today(), Validators.required], sleepHours: [null as number | null], sleepQuality: [null as number | null], fatigue: [null as number | null], soreness: [null as number | null], stress: [null as number | null], mood: [null as number | null], restingHeartRate: [null as number | null], hrv: [null as number | null], bodyweightKg: [null as number | null], notes: ['']
  });

  ngOnInit(): void { this.load(); }
  private today(): string { return new Date().toISOString().slice(0, 10); }
  load(): void { this.loading.set(true); this.client.getMyCheckins().subscribe({ next: rows => { this.checkins.set(rows); this.loading.set(false); }, error: () => { this.messageType.set('error'); this.message.set('تعذر تحميل سجل الاستعداد اليومي.'); this.loading.set(false); } }); }
  edit(checkin: AthleteCheckin): void { this.editingId.set(checkin.id); this.form.patchValue({ ...checkin, checkinDate: checkin.checkinDate.slice(0, 10) }); }
  resetForm(): void { this.editingId.set(null); this.form.reset({ checkinDate: this.today(), sleepHours: null, sleepQuality: null, fatigue: null, soreness: null, stress: null, mood: null, restingHeartRate: null, hrv: null, bodyweightKg: null, notes: '' }); }
  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.message.set('');
    const raw = this.form.getRawValue();
    const payload = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== null && value !== '')) as Partial<AthleteCheckin>;
    const request$: Observable<unknown> = this.editingId()
      ? this.client.updateMyCheckin(this.editingId()!, payload)
      : this.client.createMyCheckin(payload);
    request$.subscribe({
      next: () => { this.saving.set(false); this.messageType.set('success'); this.message.set('تم حفظ Check-in بنجاح.'); this.resetForm(); this.load(); },
      error: (err: any) => { this.saving.set(false); this.messageType.set('error'); this.message.set(err?.error?.message || 'تعذر حفظ Check-in. قد يكون هناك سجل لنفس اليوم بالفعل.'); }
    });
  }
}
