import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AccessControlService, StaffAttendanceRecord } from '../services/access-control.service';
import { OwnerService, Client, ClientSubscription } from '../services/owner.service';
import { FinanceService } from '../services/finance.service';
import { BranchesService } from '../services/branches.service';
import {
  Branch, GateAccessLog, GateAccessResponse, GateAccessResult,
  GateDenyReasonLabels
  , QrMemberLookup
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';
import { AttendanceComponent } from '../attendance/attendance.component';

@Component({
  selector: 'app-gate-access',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, DropdownModule, ButtonModule, InputTextModule, CalendarModule,
    PageHeaderComponent, LoadingSkeletonComponent, AttendanceComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="الدخول والحضور" subtitle="تسجيل الدخول والخروج ومراجعة الحضور من مكان واحد"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'الدخول والحضور'}]"></app-page-header>

      <div class="state-card error-state" *ngIf="!loading() && logsError()" role="alert">
        <i class="pi pi-exclamation-triangle"></i>
        <div>
          <strong>تعذر تحميل سجل البوابة</strong>
          <p>{{ logsError() }}</p>
          <button type="button" class="btn btn-primary" (click)="load()">إعادة المحاولة</button>
        </div>
      </div>

      <div class="checkin-card">
        <h3 class="section-title"><i class="pi pi-sign-in"></i> تسجيل دخول برمز QR</h3>
        <div class="checkin-row">
          <input #qrInput class="form-input" [(ngModel)]="qrCode" placeholder="امسح البطاقة أو الصق كود QR هنا..."
            (keyup.enter)="checkIn()" autofocus/>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="selectedBranchId"
            placeholder="الفرع (افتراضي)" [showClear]="true" appendTo="body"></p-dropdown>
          <button class="btn btn-ghost" (click)="toggleScanner()" [disabled]="scanning()">
            <i class="pi" [class.pi-camera]="!scanning()" [class.pi-stop]="scanning()"></i><span>{{ scanning() ? 'إيقاف الكاميرا' : 'مسح بالكاميرا' }}</span>
          </button>
          <button class="btn btn-primary" (click)="checkIn()" [disabled]="checking()">
            <i class="pi pi-check"></i><span>{{ checking() ? 'جارٍ...' : 'تسجيل دخول' }}</span>
          </button>
        </div>

        <div class="scanner" *ngIf="scanning()"><video #scannerVideo autoplay muted playsinline></video><small>وجّه الكاميرا إلى QR البطاقة</small></div>

        <div class="member-lookup" *ngIf="lookup() as member">
          <div class="member-summary">
            <img *ngIf="member.profilePictureUrl" [src]="member.profilePictureUrl" [alt]="member.clientName" class="member-avatar" />
            <div class="member-main"><strong>{{ member.clientName }}</strong><span>{{ member.phoneNumber || member.email || '—' }}</span></div>
            <span class="badge" [class.green]="member.subscriptionActive" [class.red]="!member.subscriptionActive">
              {{ member.subscriptionActive ? 'اشتراك فعال' : 'لا يوجد اشتراك فعال' }}
            </span>
            <button class="btn btn-outline btn-sm" type="button" (click)="openMemberHistory(member.clientId)">
              <i class="pi pi-user"></i> الملف الكامل والمدفوعات
            </button>
          </div>
          <div class="member-details">
            <div><span class="detail-label">العميل</span><strong>{{ member.clientName }}</strong></div>
            <div><span class="detail-label">الطريقة</span><strong>QR Code</strong></div>
            <div><span class="detail-label">الفرع</span><strong>{{ getSelectedBranchName() }}</strong></div>
            <div><span class="detail-label">رقم البطاقة</span><code>{{ member.cardNumber }}</code></div>
            <div><span class="detail-label">حالة البطاقة</span><strong>{{ member.cardActive ? 'نشطة' : 'غير نشطة' }}</strong></div>
            <div><span class="detail-label">الخطة</span><strong>{{ member.planName || '—' }}</strong></div>
            <div><span class="detail-label">بداية الاشتراك</span><strong>{{ member.subscriptionStartDate ? (member.subscriptionStartDate | date:'yyyy-MM-dd') : '—' }}</strong></div>
            <div><span class="detail-label">نهاية الاشتراك</span><strong>{{ member.subscriptionEndDate ? (member.subscriptionEndDate | date:'yyyy-MM-dd') : '—' }}</strong></div>
            <div><span class="detail-label">المبلغ المتبقي</span><strong>{{ member.remainingAmount != null ? (member.remainingAmount | number:'1.2-2') : '—' }}</strong></div>
          </div>
        </div>
        <div class="member-lookup" *ngIf="staffLookup() as staff">
          <div class="member-summary"><i class="pi pi-user" style="font-size:2rem"></i><div class="member-main"><strong>{{ staff.name || staff.email }}</strong><span>{{ staff.phoneNumber || staff.email }}</span></div><span class="badge green">موظف / مدرب</span></div>
          <div class="member-details"><div><span class="detail-label">وقت الدخول</span><strong>{{ staff.checkInTime | date:'yyyy-MM-dd HH:mm' }}</strong></div><div><span class="detail-label">وقت الخروج</span><strong>{{ staff.checkOutTime ? (staff.checkOutTime | date:'yyyy-MM-dd HH:mm') : 'داخل الجيم' }}</strong></div><div><span class="detail-label">الطريقة</span><strong>QR</strong></div></div>
        </div>

        <div *ngIf="lastResult()" class="result-banner" [class.granted]="lastResult()!.granted" [class.denied]="!lastResult()!.granted">
          <i class="pi" [class.pi-check-circle]="lastResult()!.granted" [class.pi-times-circle]="!lastResult()!.granted"></i>
          <div class="result-text">
            <strong>{{ lastResult()!.granted ? 'تم السماح بالدخول' : 'تم رفض الدخول' }}</strong>
            <span *ngIf="lastResult()!.clientName">— {{ lastResult()!.clientName }}</span>
            <small *ngIf="!lastResult()!.granted">{{ denyLabels[lastResult()!.denyReason] }}</small>
          </div>
        </div>
      </div>

      <p-dialog [(visible)]="detailsDialogVisible" [modal]="true" [style]="{width:'760px', maxWidth:'96vw'}"
                header="الملف الكامل للعميل" [dismissableMask]="true">
        <app-loading-skeleton *ngIf="detailsLoading" type="card"></app-loading-skeleton>
        <div class="state-card error-state" *ngIf="!detailsLoading && detailsError()" role="alert">
          <i class="pi pi-exclamation-triangle"></i><div><strong>تعذر تحميل ملف العميل</strong><p>{{ detailsError() }}</p><button type="button" class="btn btn-primary" (click)="retryMemberHistory()">إعادة المحاولة</button></div>
        </div>
        <ng-container *ngIf="!detailsLoading && !detailsError() && memberDetails as details">
          <div class="details-hero">
            <div><h3>{{ details.client.profile?.fullName || details.client.fullName || details.client.email }}</h3>
              <span>{{ details.client.phoneNumber || details.client.email || '—' }}</span></div>
          </div>
          <div class="history-section"><h4>بيانات العميل</h4>
            <div class="history-grid"><span>الاسم: <strong>{{ details.client.profile?.fullName || details.client.fullName || '—' }}</strong></span>
              <span>الهاتف: <strong>{{ details.client.phoneNumber || '—' }}</strong></span>
              <span>البريد: <strong>{{ details.client.email || '—' }}</strong></span>
              <span>تاريخ الميلاد: <strong>{{ details.client.profile?.birthDate ? (details.client.profile?.birthDate | date:'yyyy-MM-dd') : '—' }}</strong></span>
            </div>
          </div>
          <div class="history-section"><h4>الاشتراكات</h4>
            <div class="history-list" *ngIf="details.subscriptions.length; else noSubscriptions">
              <div class="history-row" *ngFor="let sub of details.subscriptions"><strong>{{ sub.planName || 'خطة' }}</strong>
                <span>{{ sub.startDate | date:'yyyy-MM-dd' }} - {{ sub.endDate | date:'yyyy-MM-dd' }}</span>
                <span>{{ sub.statusName || sub.status }}</span><span>{{ sub.amountPaid || 0 | number:'1.2-2' }}</span></div>
            </div><ng-template #noSubscriptions><span class="muted">لا توجد اشتراكات</span></ng-template>
          </div>
          <div class="history-section"><h4>المدفوعات</h4>
            <div class="history-list" *ngIf="details.payments.length; else noPayments">
              <div class="history-row" *ngFor="let payment of details.payments"><strong>{{ payment.amount | number:'1.2-2' }}</strong>
                <span>{{ payment.receivedAt | date:'yyyy-MM-dd HH:mm' }}</span><span>{{ payment.methodName || payment.method }}</span>
                <span>{{ payment.receiptNumber || '—' }}</span></div>
            </div><ng-template #noPayments><span class="muted">لا توجد مدفوعات</span></ng-template>
          </div>
        </ng-container>
      </p-dialog>

      <h3 class="section-title" style="margin-top:2rem"><i class="pi pi-list"></i> سجل البوابة</h3>
      <div class="toolbar">
        <p-dropdown [options]="branchOptions()" [(ngModel)]="filterBranch"
          placeholder="كل الفروع" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="resultOptions" [(ngModel)]="filterResult"
          placeholder="كل النتائج" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <input type="date" class="form-input" [(ngModel)]="fromDate" (change)="load()"/>
        <input type="date" class="form-input" [(ngModel)]="toDate" (change)="load()"/>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>

      <div class="data-card" *ngIf="!loading() && !logsError()">
        <p-table class="gate-log-table" dir="ltr" [value]="logs()" [paginator]="true" [rows]="15">
          <ng-template pTemplate="header">
            <tr>
              <th>التاريخ</th><th>العميل</th><th>الفرع</th><th>الطريقة</th>
              <th>النتيجة</th><th>السبب (عند الرفض)</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-l>
            <tr>
              <td>{{ l.accessTime | date:'yyyy-MM-dd HH:mm' }}</td>
              <td>{{ l.clientName || '-' }}</td>
              <td>{{ l.branchName || '-' }}</td>
              <td>{{ l.methodName || '-' }}</td>
              <td>
                <span class="badge" [class.green]="l.result===1" [class.red]="l.result===2">
                  {{ l.result===1 ? 'مسموح' : 'مرفوض' }}
                </span>
              </td>
              <td>{{ l.result===2 ? (denyLabels[l.denyReason || 0] || '-') : '-' }}</td>
              <td><button *ngIf="l.clientId" class="btn btn-outline btn-sm" type="button" (click)="openMemberHistory(l.clientId)"><i class="pi pi-user"></i> Details</button><span *ngIf="!l.clientId" class="muted">-</span></td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6"><div class="empty-state"><i class="pi pi-inbox"></i><p>لا توجد سجلات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
      <h3 class="section-title" style="margin-top:2rem"><i class="pi pi-users"></i> سجل حضور الموظفين والمدربين</h3>
      <app-loading-skeleton *ngIf="staffLoading()" type="table"></app-loading-skeleton>
      <div class="state-card error-state" *ngIf="!staffLoading() && staffError()" role="alert">
        <i class="pi pi-exclamation-triangle"></i><div><strong>تعذر تحميل حضور الموظفين والمدربين</strong><p>{{ staffError() }}</p><button type="button" class="btn btn-primary" (click)="load()">إعادة المحاولة</button></div>
      </div>
      <div class="data-card" *ngIf="!staffLoading() && !staffError()"><p-table [value]="staffRows()" [paginator]="true" [rows]="15">
        <ng-template pTemplate="header"><tr><th>الموظف</th><th>الفرع</th><th>الدخول</th><th>الخروج</th><th>المدة</th><th>الطريقة</th></tr></ng-template>
        <ng-template pTemplate="body" let-s><tr><td>{{ s.name || s.email || '-' }}</td><td>{{ branchName(s.branchId) }}</td><td>{{ s.checkInTime | date:'yyyy-MM-dd HH:mm' }}</td><td>{{ s.checkOutTime ? (s.checkOutTime | date:'yyyy-MM-dd HH:mm') : 'داخل الجيم' }}</td><td>{{ s.durationMinutes != null ? (s.durationMinutes | number:'1.0-0') + ' دقيقة' : '-' }}</td><td>QR</td></tr></ng-template>
        <ng-template pTemplate="emptymessage"><tr><td colspan="6"><div class="empty-state"><i class="pi pi-clock"></i><p>لا يوجد حضور موظفين</p></div></td></tr></ng-template>
      </p-table></div>
      <div class="attendance-embed-toggle"><button class="btn btn-outline" type="button" (click)="showAttendance = !showAttendance"><i class="pi pi-clock"></i> {{ showAttendance ? 'إخفاء سجل الحضور' : 'فتح سجل الحضور داخل نفس الشاشة' }}</button></div>
      <app-attendance *ngIf="showAttendance"></app-attendance>
    </div>
  `,
  styles: [GYM_PAGE_STYLES + `
    .checkin-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;
    }
    .state-card { display:flex; align-items:center; gap:.75rem; min-height:130px; padding:1.25rem; margin-bottom:1.25rem; border:1px dashed #fecaca; border-radius:16px; color:#991b1b; background:#fff7f7; }
    .state-card i { font-size:1.5rem; color:#dc2626; }
    .state-card p { margin:.35rem 0 .75rem; color:#7f1d1d; }
    .checkin-row { display:flex; gap:.75rem; align-items:center; flex-wrap: wrap; }
    .checkin-row input.form-input { flex: 1 1 280px; font-size: 1rem; }
    .result-banner {
      margin-top: 1rem; padding: 1rem 1.25rem; border-radius: 12px;
      display: flex; align-items: center; gap: 1rem;
    }
    .result-banner.granted { background: rgba(16,185,129,.1); color:#10b981; border:1px solid rgba(16,185,129,.3); }
    .result-banner.denied  { background: rgba(239,68,68,.1); color:#ef4444; border:1px solid rgba(239,68,68,.3); }
    .result-banner i { font-size: 1.75rem; }
    .result-text { display:flex; flex-direction: column; gap: .15rem; }
    .result-text small { color: var(--text-secondary); }
    .scanner { margin-top:1rem; display:flex; flex-direction:column; align-items:center; gap:.5rem; color:var(--text-secondary); }
    .scanner video { width:min(100%,360px); aspect-ratio:4/3; object-fit:cover; border-radius:14px; background:#0f172a; }
    .member-lookup { margin-top:1rem; display:flex; flex-direction:column; gap:1rem; padding:1rem; border:1px solid var(--card-border); border-radius:12px; background:var(--bg-secondary); }
    .member-summary { display:flex; align-items:center; gap:.75rem; flex-wrap:wrap; }
    .member-main { display:flex; flex-direction:column; gap:.15rem; min-width:180px; }
    .member-main span,.detail-label { color:var(--text-secondary); }
    .member-details { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.75rem; padding-top:.75rem; border-top:1px solid var(--card-border); }
    .member-details > div { display:flex; flex-direction:column; gap:.2rem; min-width:0; }
    .detail-label { font-size:.78rem; }
    .member-details strong,.member-details code { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .member-avatar { width:48px; height:48px; border-radius:50%; object-fit:cover; }
    .gate-log-table th, .gate-log-table td { direction: rtl; text-align: right; }
    .btn-sm { padding:.45rem .7rem; font-size:.8rem; }
    .details-hero { display:flex; align-items:center; gap:1rem; padding:1rem; background:var(--bg-secondary); border-radius:12px; }
    .details-hero h3 { margin:0 0 .25rem; }
    .details-hero span,.muted { color:var(--text-secondary); }
    .history-section { margin-top:1.25rem; }
    .history-section h4 { margin:0 0 .65rem; }
    .history-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:.6rem; }
    .history-list { display:flex; flex-direction:column; gap:.4rem; }
    .history-row { display:grid; grid-template-columns:1.1fr 1.2fr .8fr .8fr; gap:.6rem; padding:.65rem; border:1px solid var(--card-border); border-radius:8px; }
    @media (max-width:640px) { .history-row { grid-template-columns:1fr 1fr; } }
  `]
})
export class GateAccessComponent implements OnInit {
  private svc = inject(AccessControlService);
  private ownerSvc = inject(OwnerService);
  private financeSvc = inject(FinanceService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);

  @ViewChild('scannerVideo') scannerVideo?: ElementRef<HTMLVideoElement>;
  logs = signal<GateAccessLog[]>([]);
  staffRows = signal<StaffAttendanceRecord[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  logsError = signal<string | null>(null);
  staffLoading = signal(false);
  staffError = signal<string | null>(null);
  checking = signal(false);
  scanning = signal(false);
  lookup = signal<QrMemberLookup | null>(null);
  staffLookup = signal<StaffAttendanceRecord | null>(null);
  detailsDialogVisible = false;
  showAttendance = false;
  detailsLoading = false;
  detailsError = signal<string | null>(null);
  memberDetails: { client: Client; subscriptions: ClientSubscription[]; payments: import('../../../shared/models/gym-management.models').Payment[] } | null = null;
  lastResult = signal<GateAccessResponse | null>(null);

  qrCode = '';
  selectedBranchId: string | null = null;
  filterBranch: string | null = null;
  filterResult: GateAccessResult | null = null;
  fromDate = '';
  toDate = '';
  private cameraStream?: MediaStream;
  private scanTimer?: number;

  denyLabels = GateDenyReasonLabels;
  resultOptions = [{ label: 'مسموح', value: 1 }, { label: 'مرفوض', value: 2 }];
  branchOptions = computed(() => this.branches().map(b => ({ label: b.name, value: b.id })));

  ngOnInit() {
    this.branchesSvc.list().subscribe(b => this.branches.set(b || []));
    this.load();
  }

  checkIn() {
    if (!this.qrCode.trim()) { this.toast.error('أدخل كود QR'); return; }
    this.checking.set(true);
    if (this.qrCode.trim().startsWith('staff:')) {
      this.svc.toggleStaffQr({ qrCode: this.qrCode.trim(), branchId: this.selectedBranchId }).subscribe({
        next: staff => { this.checking.set(false); this.staffLookup.set(staff); this.lookup.set(null); this.toast.success(staff.isOpen ? `تم تسجيل دخول ${staff.name || ''}` : `تم تسجيل خروج ${staff.name || ''}`); this.qrCode = ''; },
        error: e => { this.checking.set(false); this.toast.error(e?.error?.detail || 'فشل تسجيل حضور الموظف'); }
      });
      return;
    }
    this.svc.checkInQr({ qrCode: this.qrCode, branchId: this.selectedBranchId }).subscribe({
      next: res => {
        this.checking.set(false);
        this.lastResult.set(res);
        if (res.granted) this.toast.success(`تم دخول ${res.clientName || ''}`);
        else this.toast.error(this.denyLabels[res.denyReason] || 'تم رفض الدخول');
        this.qrCode = '';
        this.load();
      },
      error: (e) => { this.checking.set(false); this.toast.error(e?.error?.detail || 'فشل التسجيل'); }
    });
  }

  async toggleScanner(): Promise<void> {
    if (this.scanning()) { this.stopScanner(); return; }
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) { this.toast.error('المتصفح لا يدعم قراءة QR بالكاميرا؛ استخدم الإدخال اليدوي.'); return; }
    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      this.scanning.set(true);
      setTimeout(() => { if (this.scannerVideo) { this.scannerVideo.nativeElement.srcObject = this.cameraStream!; this.scanFrame(new Detector({ formats: ['qr_code'] })); } }, 0);
    } catch { this.toast.error('تعذر الوصول إلى الكاميرا. تحقق من إذن المتصفح.'); this.stopScanner(); }
  }

  private async scanFrame(detector: any): Promise<void> {
    if (!this.scanning() || !this.scannerVideo) return;
    try {
      const codes = await detector.detect(this.scannerVideo.nativeElement);
      const value = codes?.[0]?.rawValue;
      if (value) { this.qrCode = value; this.lookupMember(value); this.stopScanner(); return; }
    } catch { /* camera frame may not be ready */ }
    this.scanTimer = window.setTimeout(() => this.scanFrame(detector), 250);
  }

  lookupMember(code: string): void {
    if (code.trim().startsWith('staff:')) { this.staffLookup.set(null); return; }
    this.svc.scanQr(code).subscribe({ next: member => this.lookup.set(member), error: () => this.lookup.set(null) });
  }

  openMemberHistory(clientId: string): void {
    this.historyClientId = clientId;
    this.detailsDialogVisible = true;
    this.detailsLoading = true;
    this.detailsError.set(null);
    this.memberDetails = null;
    forkJoin({
      client: this.ownerSvc.getClientById(clientId),
      subscriptions: this.ownerSvc.getSubscriptions({ clientId }),
      payments: this.financeSvc.listPayments({ clientId })
    }).subscribe({
      next: details => { this.memberDetails = details; this.detailsLoading = false; },
      error: (e) => {
        this.detailsLoading = false;
        const message = e?.translatedMessage || e?.error?.detail || e?.error?.message || 'تعذر تحميل الملف الكامل للعميل';
        this.detailsError.set(message);
        this.toast.error(message);
      }
    });
  }
  private historyClientId: string | null = null;

  retryMemberHistory(): void {
    if (this.historyClientId) this.openMemberHistory(this.historyClientId);
  }
  getSelectedBranchName(): string {
    return this.branches().find(branch => branch.id === this.selectedBranchId)?.name || 'الفرع الافتراضي';
  }

  stopScanner(): void {
    this.scanning.set(false);
    if (this.scanTimer) window.clearTimeout(this.scanTimer);
    this.cameraStream?.getTracks().forEach(track => track.stop());
    this.cameraStream = undefined;
  }

  ngOnDestroy(): void { this.stopScanner(); }

  load() {
    this.loading.set(true);
    this.logsError.set(null);
    this.staffError.set(null);
    this.staffLoading.set(true);
    this.svc.staffAttendance({ branchId: this.filterBranch ?? undefined, fromDate: this.fromDate || undefined, toDate: this.toDate || undefined }).subscribe({
      next: rows => { this.staffRows.set(rows || []); this.staffLoading.set(false); },
      error: (e) => { this.staffRows.set([]); this.staffLoading.set(false); this.staffError.set(e?.translatedMessage || e?.error?.detail || e?.error?.message || 'تعذر تحميل حضور الموظفين والمدربين'); }
    });
    this.svc.logs({
      branchId: this.filterBranch ?? undefined,
      result: this.filterResult ?? undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
      take: 200
    }).subscribe({
      next: d => { this.logs.set(d || []); this.loading.set(false); },
      error: (e) => {
        const message = e?.translatedMessage || e?.error?.detail || e?.error?.message || 'تعذر تحميل سجل البوابة';
        this.logsError.set(message);
        this.toast.error(message);
        this.loading.set(false);
      }
    });
  }

  branchName(id?: string): string { return this.branches().find(b => b.id === id)?.name || '-'; }
}
