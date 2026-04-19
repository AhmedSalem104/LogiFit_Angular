import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ClassesService } from '../services/classes.service';
import { FacilitiesService } from '../services/facilities.service';
import { OwnerService, Client, Coach } from '../services/owner.service';
import {
  ClassSchedule, CreateScheduleRequest, GroupClass, Room, ClassEnrollment,
  RecurrencePattern, RecurrencePatternLabels, ClassEnrollmentStatusLabels
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-class-schedules',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    InputNumberModule, DropdownModule, ButtonModule, TooltipModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="جدولة الحصص" subtitle="جدولة وحجز الحصص الجماعية"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الجدولة'}]">
        <button class="btn btn-primary" (click)="openAdd()"><i class="pi pi-plus"></i><span>جدولة جديدة</span></button>
      </app-page-header>

      <div class="toolbar">
        <p-dropdown [options]="classOptions()" [(ngModel)]="classFilter"
          placeholder="كل الحصص" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="coachOptions()" [(ngModel)]="coachFilter"
          placeholder="كل المدربين" [showClear]="true" [filter]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="load()"/>
        <input type="date" class="form-input" [(ngModel)]="toDate" (change)="load()"/>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>
      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="schedules()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr><th>الحصة</th><th>المدرب</th><th>القاعة</th><th>الوقت</th>
                <th>التكرار</th><th>الحجوزات</th><th>الانتظار</th><th>الحالة</th>
                <th style="width:170px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-s>
            <tr [class.cancelled-row]="s.isCancelled">
              <td><span class="color-dot" [style.background]="s.color || '#3b82f6'"></span> {{ s.groupClassName }}</td>
              <td>{{ s.coachName || '-' }}</td>
              <td>{{ s.roomName || '-' }}</td>
              <td>{{ s.startTime | date:'yyyy-MM-dd HH:mm' }}<br>
                <small class="text-muted-color">حتى {{ s.endTime | date:'HH:mm' }}</small></td>
              <td>{{ recurLabels[s.recurrencePattern] }}
                <span *ngIf="s.recurrenceDaysOfWeek" class="text-muted-color"><br>{{ s.recurrenceDaysOfWeek }}</span></td>
              <td>{{ s.bookedCount }} / {{ s.effectiveCapacity }}</td>
              <td>{{ s.waitlistCount }}</td>
              <td>
                <span class="badge" *ngIf="s.isCancelled" [class.red]="true">ملغاة</span>
                <span class="badge" *ngIf="!s.isCancelled && s.isFull" [class.orange]="true">ممتلئة</span>
                <span class="badge" *ngIf="!s.isCancelled && !s.isFull" [class.green]="true">متاحة</span>
              </td>
              <td>
                <button class="action-btn" (click)="viewEnrollments(s)" pTooltip="الحجوزات"><i class="pi pi-users"></i></button>
                <button class="action-btn success" *ngIf="!s.isCancelled" (click)="openBook(s)" pTooltip="حجز"><i class="pi pi-plus-circle"></i></button>
                <button class="action-btn danger" *ngIf="!s.isCancelled" (click)="cancelSchedule(s)" pTooltip="إلغاء"><i class="pi pi-times"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="9"><div class="empty-state"><i class="pi pi-calendar"></i><p>لا توجد جدولات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Schedule Dialog -->
    <p-dialog [(visible)]="dialog" [modal]="true" [style]="{width:'640px', maxWidth:'95vw'}"
              header="جدولة جديدة" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">الحصة *</label>
          <p-dropdown [options]="classOptions()" [(ngModel)]="form.groupClassId" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">المدرب</label>
          <p-dropdown [options]="coachOptions()" [(ngModel)]="form.coachId" [filter]="true" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">القاعة</label>
          <p-dropdown [options]="roomOptions()" [(ngModel)]="form.roomId" [showClear]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div><label class="form-label">بداية الحصة *</label>
          <input type="datetime-local" class="form-input" [(ngModel)]="form.startTime"/></div>
        <div><label class="form-label">نهاية الحصة *</label>
          <input type="datetime-local" class="form-input" [(ngModel)]="form.endTime"/></div>
        <div><label class="form-label">نمط التكرار</label>
          <p-dropdown [options]="recurOptions" [(ngModel)]="form.recurrencePattern" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div *ngIf="form.recurrencePattern===2"><label class="form-label">أيام التكرار (Mon,Wed,Fri)</label>
          <input class="form-input" [(ngModel)]="form.recurrenceDaysOfWeek"/></div>
        <div *ngIf="form.recurrencePattern && form.recurrencePattern > 0"><label class="form-label">نهاية التكرار</label>
          <input type="date" class="form-input" [(ngModel)]="form.recurrenceEndDate"/></div>
        <div><label class="form-label">سعة مخصصة (اختياري)</label>
          <p-inputNumber [(ngModel)]="form.overrideCapacity" [min]="1" styleClass="w-full"></p-inputNumber></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="dialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="save()" [disabled]="saving()">حفظ</button>
      </div>
    </p-dialog>

    <!-- Enrollments Dialog -->
    <p-dialog [(visible)]="enrollDialog" [modal]="true" [style]="{width:'680px'}"
              [header]="'حجوزات: ' + (selected?.groupClassName || '')" [dismissableMask]="true">
      <div *ngIf="enrollments().length">
        <p-table [value]="enrollments()">
          <ng-template pTemplate="header">
            <tr><th>العميل</th><th>تاريخ الحجز</th><th>الحالة</th><th>قائمة الانتظار</th><th style="width:130px">إجراءات</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-e>
            <tr>
              <td>{{ e.clientName || '-' }}</td>
              <td>{{ e.enrolledAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td><span class="badge"
                [class.green]="e.status===1 || e.status===2"
                [class.red]="e.status===3 || e.status===4"
                [class.orange]="e.status===5">{{ enrollLabels[e.status] }}</span></td>
              <td>{{ e.waitlistPosition || '-' }}</td>
              <td>
                <button class="action-btn success" *ngIf="e.status===1" (click)="markAttended(e)" pTooltip="حضر"><i class="pi pi-check"></i></button>
                <button class="action-btn danger" *ngIf="e.status===1 || e.status===5" (click)="cancelEnrollment(e)" pTooltip="إلغاء"><i class="pi pi-times"></i></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
      <div *ngIf="!enrollments().length" class="empty-state"><i class="pi pi-users"></i><p>لا توجد حجوزات</p></div>
    </p-dialog>

    <!-- Book Dialog -->
    <p-dialog [(visible)]="bookDialog" [modal]="true" [style]="{width:'440px'}"
              header="حجز عميل" [dismissableMask]="true">
      <div class="form-group">
        <label class="form-label">العميل</label>
        <p-dropdown [options]="clientOptions()" [(ngModel)]="bookClientId" [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="bookDialog=false">إلغاء</button>
        <button class="btn btn-primary" (click)="confirmBook()" [disabled]="saving()">حجز</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .color-dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-left:.4rem; }
    tr.cancelled-row { opacity:.5; text-decoration: line-through; }
  `]
})
export class ClassSchedulesComponent implements OnInit {
  private svc = inject(ClassesService);
  private facSvc = inject(FacilitiesService);
  private ownerSvc = inject(OwnerService);
  private toast = inject(NotificationService);

  schedules = signal<ClassSchedule[]>([]);
  enrollments = signal<ClassEnrollment[]>([]);
  classes = signal<GroupClass[]>([]);
  rooms = signal<Room[]>([]);
  clients = signal<Client[]>([]);
  coaches = signal<Coach[]>([]);
  loading = signal(false);
  saving = signal(false);

  classFilter: string | null = null;
  coachFilter: string | null = null;
  fromDate = ''; toDate = '';

  dialog = false;
  enrollDialog = false;
  bookDialog = false;
  selected: ClassSchedule | null = null;
  bookClientId = '';
  form: CreateScheduleRequest = this.emptyForm();

  recurLabels = RecurrencePatternLabels;
  enrollLabels = ClassEnrollmentStatusLabels;
  recurOptions = Object.entries(RecurrencePatternLabels).map(([v,l]) => ({ label: l, value: Number(v) as RecurrencePattern }));
  classOptions = computed(() => this.classes().map(c => ({ label: c.name, value: c.id })));
  coachOptions = computed(() => this.coaches().map(c => ({ label: c.fullName || c.email || c.id, value: c.id })));
  roomOptions = computed(() => this.rooms().map(r => ({ label: r.name, value: r.id })));
  clientOptions = computed(() => this.clients().map(c => ({ label: c.fullName || c.email || c.id, value: c.id })));

  ngOnInit() {
    this.svc.listClasses().subscribe(c => this.classes.set(c || []));
    this.facSvc.listRooms().subscribe(r => this.rooms.set(r || []));
    this.ownerSvc.getClients().subscribe(c => this.clients.set(c || []));
    this.ownerSvc.getCoaches().subscribe(c => this.coaches.set(c || []));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.listSchedules({
      groupClassId: this.classFilter ?? undefined,
      coachId: this.coachFilter ?? undefined,
      fromDate: this.fromDate || undefined, toDate: this.toDate || undefined,
      includeCancelled: true
    }).subscribe({
      next: d => { this.schedules.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }

  emptyForm(): CreateScheduleRequest {
    return { groupClassId: '', startTime: '', endTime: '', recurrencePattern: RecurrencePattern.None };
  }

  openAdd() { this.form = this.emptyForm(); this.dialog = true; }

  save() {
    if (!this.form.groupClassId || !this.form.startTime || !this.form.endTime) {
      this.toast.error('الحصة والوقت مطلوبة'); return;
    }
    this.saving.set(true);
    this.svc.createSchedule({
      ...this.form,
      startTime: new Date(this.form.startTime).toISOString(),
      endTime: new Date(this.form.endTime).toISOString()
    }).subscribe({
      next: () => { this.saving.set(false); this.dialog = false; this.toast.success('تم'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }

  viewEnrollments(s: ClassSchedule) {
    this.selected = s;
    this.svc.listEnrollments(s.id, true).subscribe({
      next: d => { this.enrollments.set(d || []); this.enrollDialog = true; },
      error: () => this.toast.error('فشل التحميل')
    });
  }

  openBook(s: ClassSchedule) {
    this.selected = s; this.bookClientId = ''; this.bookDialog = true;
  }

  confirmBook() {
    if (!this.selected || !this.bookClientId) { this.toast.error('اختر العميل'); return; }
    this.saving.set(true);
    this.svc.book(this.selected.id, { clientId: this.bookClientId }).subscribe({
      next: r => {
        this.saving.set(false); this.bookDialog = false;
        this.toast.success(r.status === 5 ? `قائمة انتظار (#${r.waitlistPosition})` : 'تم الحجز');
        this.load();
      },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }

  markAttended(e: ClassEnrollment) {
    this.svc.markAttended(e.id).subscribe({
      next: () => { this.toast.success('تم تسجيل الحضور'); this.reloadEnrollments(); },
      error: (err) => this.toast.error(err?.error?.detail || 'فشل')
    });
  }

  cancelEnrollment(e: ClassEnrollment) {
    Swal.fire({ title:'إلغاء الحجز؟', input:'text', inputPlaceholder:'السبب...',
      showCancelButton:true, confirmButtonText:'إلغاء', cancelButtonText:'رجوع', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.cancelEnrollment(e.id, { reason: r.value || '' }).subscribe({
        next: () => { this.toast.success('تم'); this.reloadEnrollments(); this.load(); },
        error: (err) => this.toast.error(err?.error?.detail || 'فشل')
      }); });
  }

  cancelSchedule(s: ClassSchedule) {
    Swal.fire({ title:'إلغاء الجدولة؟', input:'text', inputPlaceholder:'السبب...',
      showCancelButton:true, confirmButtonText:'إلغاء', cancelButtonText:'رجوع', confirmButtonColor:'#ef4444' })
      .then(r => { if(r.isConfirmed) this.svc.cancelSchedule(s.id, { reason: r.value || '' }).subscribe({
        next: () => { this.toast.success('تم'); this.load(); },
        error: (err) => this.toast.error(err?.error?.detail || 'فشل')
      }); });
  }

  reloadEnrollments() {
    if (!this.selected) return;
    this.svc.listEnrollments(this.selected.id, true).subscribe(d => this.enrollments.set(d || []));
  }
}
