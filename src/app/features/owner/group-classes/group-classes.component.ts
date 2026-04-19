import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ClassesService } from '../services/classes.service';
import { BranchesService } from '../services/branches.service';
import { GroupClass, CreateGroupClassRequest, Branch } from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-group-classes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, InputSwitchModule, DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الحصص الجماعية" subtitle="إدارة أنواع الحصص"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الحصص'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>حصة جديدة</span></button>
      </app-page-header>

      <div class="toolbar">
        <p-dropdown [options]="branchOptions()" [(ngModel)]="branchFilter"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="stats"></app-loading-skeleton>
      <div class="class-grid" *ngIf="!loading()">
        <div class="class-card" *ngFor="let c of items()" [style.borderTop]="'4px solid '+(c.color||'#3b82f6')">
          <div class="class-card__header">
            <h3>{{ c.name }}</h3>
            <span class="badge" [class.green]="c.isActive" [class.gray]="!c.isActive">
              {{ c.isActive ? 'نشطة' : 'متوقفة' }}
            </span>
          </div>
          <div class="class-meta">
            <span *ngIf="c.category"><i class="pi pi-tag"></i>{{ c.category }}</span>
            <span><i class="pi pi-clock"></i>{{ c.durationMinutes }} د</span>
            <span><i class="pi pi-users"></i>{{ c.capacity }}</span>
            <span *ngIf="c.price"><i class="pi pi-dollar"></i>{{ c.price | number }}</span>
            <span *ngIf="c.branchName"><i class="pi pi-building"></i>{{ c.branchName }}</span>
          </div>
          <p class="class-desc" *ngIf="c.description">{{ c.description }}</p>
          <div class="class-actions">
            <button class="action-btn" (click)="openEdit(c)" pTooltip="تعديل"><i class="pi pi-pencil"></i></button>
            <button class="action-btn danger" (click)="remove(c)" pTooltip="حذف"><i class="pi pi-trash"></i></button>
          </div>
        </div>
        <div *ngIf="!items().length" class="empty-state" style="grid-column:1/-1;">
          <i class="pi pi-calendar"></i><p>لا توجد حصص</p>
        </div>
      </div>
    </div>

    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'640px'}"
              [header]="isEdit ? 'تعديل':'حصة جديدة'" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الاسم *</label><input class="form-input" [(ngModel)]="form.name"/></div>
        <div><label class="form-label">الفئة</label><input class="form-input" [(ngModel)]="form.category"/></div>
        <div><label class="form-label">الفرع</label>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="form.branchId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">المدة (دقيقة) *</label>
          <p-inputNumber [(ngModel)]="form.durationMinutes" [min]="1" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">السعة *</label>
          <p-inputNumber [(ngModel)]="form.capacity" [min]="1" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">السعر</label>
          <p-inputNumber [(ngModel)]="form.price" [min]="0" styleClass="w-full"></p-inputNumber></div>
        <div><label class="form-label">اللون</label>
          <input class="form-input" type="color" [(ngModel)]="form.color"/></div>
        <div class="full"><label class="form-label">الوصف</label>
          <textarea pInputTextarea rows="2" class="w-full" [(ngModel)]="form.description"></textarea></div>
        <div class="full"><label class="form-label">رابط الصورة</label><input class="form-input" [(ngModel)]="form.imageUrl"/></div>
        <div class="full">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <p-inputSwitch [(ngModel)]="form.isActive"></p-inputSwitch><span>نشطة</span>
          </label>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .class-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap:1rem; }
    .class-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 14px; padding: 1.25rem; display:flex; flex-direction:column; gap:.75rem;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .class-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .class-card__header { display:flex; justify-content:space-between; align-items:flex-start; gap:.5rem; }
    .class-card__header h3 { margin:0; font-size:1.05rem; font-weight:600; }
    .class-meta { display:flex; flex-wrap:wrap; gap:.5rem; color: var(--text-secondary); font-size:.8rem; }
    .class-meta span { display:inline-flex; align-items:center; gap:.35rem; padding:.2rem .5rem; background: var(--bg-secondary); border-radius: 8px; }
    .class-desc { color: var(--text-secondary); font-size:.85rem; margin:0; }
    .class-actions { display:flex; gap:.35rem; margin-top:auto; }
  `]
})
export class GroupClassesComponent implements OnInit {
  private svc = inject(ClassesService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);
  items = signal<GroupClass[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  saving = signal(false);
  branchFilter: string | null = null;
  dialog = false; isEdit = false; editingId: string | null = null;
  form: CreateGroupClassRequest = this.emptyForm();
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.load();
  }
  load() {
    this.loading.set(true);
    this.svc.listClasses({ branchId: this.branchFilter ?? undefined }).subscribe({
      next: d => { this.items.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
  emptyForm(): CreateGroupClassRequest {
    return { name:'', durationMinutes: 60, capacity: 20, color: '#3b82f6', isActive: true };
  }
  openAdd() { this.isEdit=false; this.editingId=null; this.form = this.emptyForm(); this.dialog = true; }
  openEdit(c: GroupClass) {
    this.isEdit=true; this.editingId=c.id;
    this.form = {
      branchId:c.branchId, name:c.name, description:c.description, category:c.category,
      durationMinutes:c.durationMinutes, capacity:c.capacity, color:c.color, imageUrl:c.imageUrl,
      price:c.price, isActive:c.isActive
    };
    this.dialog = true;
  }
  save() {
    if (!this.form.name) { this.toast.error('الاسم مطلوب'); return; }
    this.saving.set(true);
    const obs: any = this.isEdit && this.editingId
      ? this.svc.updateClass(this.editingId, this.form)
      : this.svc.createClass(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialog=false; this.toast.success('تم'); this.load(); },
      error: (e: any) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
  remove(c: GroupClass) {
    Swal.fire({ title:'حذف الحصة؟', text:c.name, icon:'warning', showCancelButton:true,
      confirmButtonText:'حذف', cancelButtonText:'إلغاء', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.deleteClass(c.id).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (e) => this.toast.error(e?.error?.detail || 'تعذر')
      }); });
  }
}
