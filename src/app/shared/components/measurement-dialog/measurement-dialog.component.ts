import {
  Component, EventEmitter, Input, Output, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Editable subset submitted when adding a measurement. */
export interface MeasurementValue {
  dateRecorded?: string;
  weightKg?: number;
  bodyFatPercent?: number;
  skeletalMuscleMass?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  notes?: string;
}

/** One labeled row shown in view mode. */
interface ViewRow { label: string; value: string; }

/**
 * Shared body-measurement modal — add mode (form → save) or view mode
 * (read-only labeled grid). Theme-aware and RTL. Used by the coach trainee
 * details and measurements list.
 */
@Component({
  selector: 'app-measurement-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="md-overlay" (click)="onBackdrop($event)">
        <div class="md-modal" role="dialog" aria-modal="true">
          <div class="md-head">
            <h3>{{ mode === 'add' ? 'إضافة قياس جديد' : 'تفاصيل القياس' }}</h3>
            <button type="button" class="md-close" (click)="cancel.emit()" aria-label="إغلاق"><i class="pi pi-times"></i></button>
          </div>

          @if (mode === 'add') {
            <form class="md-body" (ngSubmit)="submit()">
              <div class="md-grid">
                <div class="md-field">
                  <label>التاريخ <span class="req">*</span></label>
                  <input type="date" [(ngModel)]="form.dateRecorded" name="date" required />
                </div>
                <div class="md-field"><label>الوزن (كجم)</label><input type="number" step="0.1" [(ngModel)]="form.weightKg" name="weightKg" /></div>
                <div class="md-field"><label>نسبة الدهون (%)</label><input type="number" step="0.1" [(ngModel)]="form.bodyFatPercent" name="bf" /></div>
                <div class="md-field"><label>الكتلة العضلية (كجم)</label><input type="number" step="0.1" [(ngModel)]="form.skeletalMuscleMass" name="smm" /></div>
                <div class="md-field"><label>الصدر (سم)</label><input type="number" step="0.1" [(ngModel)]="form.chest" name="chest" /></div>
                <div class="md-field"><label>الخصر (سم)</label><input type="number" step="0.1" [(ngModel)]="form.waist" name="waist" /></div>
                <div class="md-field"><label>الأرداف (سم)</label><input type="number" step="0.1" [(ngModel)]="form.hips" name="hips" /></div>
              </div>
              <div class="md-field full"><label>ملاحظات</label><textarea rows="2" [(ngModel)]="form.notes" name="notes"></textarea></div>
              <div class="md-actions">
                <button type="button" class="btn btn-ghost" (click)="cancel.emit()" [disabled]="saving">إلغاء</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving || !form.dateRecorded">
                  <i class="pi pi-spin pi-spinner" *ngIf="saving"></i><span>حفظ القياس</span>
                </button>
              </div>
            </form>
          } @else {
            <div class="md-body">
              <div class="md-view">
                @for (row of viewRows; track row.label) {
                  <div class="md-vrow"><span class="k">{{ row.label }}</span><span class="v">{{ row.value }}</span></div>
                }
                @if (!viewRows.length) { <p class="muted">لا توجد تفاصيل إضافية.</p> }
              </div>
              <div class="md-actions"><button type="button" class="btn btn-ghost" (click)="cancel.emit()">إغلاق</button></div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .md-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(15,23,42,.55); backdrop-filter: blur(2px); padding: 1rem; }
    .md-modal { width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
    .md-head { display: flex; align-items: center; justify-content: space-between; padding: 1.15rem 1.4rem; border-bottom: 1px solid var(--border-color); }
    .md-head h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
    .md-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.05rem; }
    .md-close:hover { color: var(--text-primary); }
    .md-body { padding: 1.4rem; }
    .md-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .9rem; }
    .md-field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: .9rem; }
    .md-field.full { margin-top: .2rem; }
    .md-field label { font-size: .82rem; color: var(--text-secondary); font-weight: 500; }
    .md-field .req { color: #ef4444; }
    .md-field input, .md-field textarea { padding: .6rem .8rem; border: 1px solid var(--border-color); border-radius: 9px; background: var(--bg-secondary); color: var(--text-primary); font-size: .93rem; width: 100%; }
    .md-field input:focus, .md-field textarea:focus { outline: none; border-color: var(--primary-500, #3b82f6); }
    .md-view { display: flex; flex-direction: column; gap: .1rem; }
    .md-vrow { display: flex; justify-content: space-between; gap: 1rem; padding: .6rem .2rem; border-bottom: 1px solid var(--border-color); }
    .md-vrow:last-child { border-bottom: none; }
    .md-vrow .k { color: var(--text-secondary); font-size: .9rem; }
    .md-vrow .v { color: var(--text-primary); font-weight: 600; font-variant-numeric: tabular-nums; }
    .muted { color: var(--text-muted); }
    .md-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 44px; padding: 0 1.25rem; border-radius: 9px; font-weight: 600; border: none; cursor: pointer; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn-primary { background: var(--primary-500, #3b82f6); color: #fff; }
    .btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }
    @media (max-width: 560px) { .md-grid { grid-template-columns: 1fr; } }
  `]
})
export class MeasurementDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() mode: 'add' | 'view' = 'add';
  @Input() saving = false;
  /** Any measurement-like record; used to build the read-only rows in view mode. */
  @Input() record: Record<string, any> | null = null;

  @Output() save = new EventEmitter<MeasurementValue>();
  @Output() cancel = new EventEmitter<void>();

  form: MeasurementValue = {};
  viewRows: ViewRow[] = [];

  private static readonly FIELDS: { key: string; label: string; unit?: string }[] = [
    { key: 'dateRecorded', label: 'التاريخ' },
    { key: 'weightKg', label: 'الوزن', unit: 'كجم' },
    { key: 'height', label: 'الطول', unit: 'سم' },
    { key: 'bodyFatPercent', label: 'نسبة الدهون', unit: '%' },
    { key: 'skeletalMuscleMass', label: 'الكتلة العضلية', unit: 'كجم' },
    { key: 'bodyFatMass', label: 'كتلة الدهون', unit: 'كجم' },
    { key: 'totalBodyWater', label: 'ماء الجسم', unit: 'لتر' },
    { key: 'bmr', label: 'معدل الأيض', unit: 'kcal' },
    { key: 'visceralFatLevel', label: 'الدهون الحشوية' },
    { key: 'chest', label: 'الصدر', unit: 'سم' },
    { key: 'waist', label: 'الخصر', unit: 'سم' },
    { key: 'hips', label: 'الأرداف', unit: 'سم' },
    { key: 'notes', label: 'ملاحظات' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) return;
    if (this.mode === 'add') {
      this.form = {};
    } else if (this.record) {
      this.viewRows = MeasurementDialogComponent.FIELDS
        .map(f => {
          const raw = this.record?.[f.key] ?? (f.key === 'dateRecorded' ? this.record?.['measurementDate'] : undefined);
          if (raw == null || raw === '') return null;
          const value = f.key === 'dateRecorded' ? new Date(raw).toLocaleDateString('ar-EG') : `${raw}${f.unit ? ' ' + f.unit : ''}`;
          return { label: f.label, value } as ViewRow;
        })
        .filter((r): r is ViewRow => r !== null);
    }
  }

  submit(): void {
    if (!this.form.dateRecorded) return;
    // Drop empty numeric fields so we don't send nulls.
    const clean: MeasurementValue = { dateRecorded: this.form.dateRecorded };
    (['weightKg', 'bodyFatPercent', 'skeletalMuscleMass', 'chest', 'waist', 'hips'] as const)
      .forEach(k => { if (this.form[k] != null && !isNaN(this.form[k] as number)) clean[k] = Number(this.form[k]); });
    if (this.form.notes?.trim()) clean.notes = this.form.notes.trim();
    this.save.emit(clean);
  }

  onBackdrop(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget && !this.saving) this.cancel.emit();
  }
}
