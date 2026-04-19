import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AccessControlService } from '../services/access-control.service';
import { BranchesService } from '../services/branches.service';
import {
  Branch, GateAccessLog, GateAccessResponse, GateAccessResult,
  GateDenyReasonLabels
} from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-gate-access',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DropdownModule, ButtonModule, InputTextModule, CalendarModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="البوابة الإلكترونية" subtitle="تسجيل الدخول بالـ QR ومراجعة السجل"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'البوابة'}]"></app-page-header>

      <div class="checkin-card">
        <h3 class="section-title"><i class="pi pi-sign-in"></i> تسجيل دخول برمز QR</h3>
        <div class="checkin-row">
          <input #qrInput class="form-input" [(ngModel)]="qrCode" placeholder="امسح البطاقة أو الصق كود QR هنا..."
            (keyup.enter)="checkIn()" autofocus/>
          <p-dropdown [options]="branchOptions()" [(ngModel)]="selectedBranchId"
            placeholder="الفرع (افتراضي)" [showClear]="true" appendTo="body"></p-dropdown>
          <button class="btn btn-primary" (click)="checkIn()" [disabled]="checking()">
            <i class="pi pi-check"></i><span>{{ checking() ? 'جارٍ...' : 'تسجيل دخول' }}</span>
          </button>
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

      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="logs()" [paginator]="true" [rows]="15">
          <ng-template pTemplate="header">
            <tr>
              <th>التاريخ</th><th>العميل</th><th>الفرع</th><th>الطريقة</th>
              <th>النتيجة</th><th>السبب (عند الرفض)</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-l>
            <tr>
              <td>{{ l.occurredAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td>{{ l.clientName || '-' }}</td>
              <td>{{ l.branchName || '-' }}</td>
              <td>{{ l.methodName || '-' }}</td>
              <td>
                <span class="badge" [class.green]="l.result===1" [class.red]="l.result===2">
                  {{ l.result===1 ? 'مسموح' : 'مرفوض' }}
                </span>
              </td>
              <td>{{ l.result===2 ? (denyLabels[l.denyReason || 0] || '-') : '-' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6"><div class="empty-state"><i class="pi pi-inbox"></i><p>لا توجد سجلات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [GYM_PAGE_STYLES + `
    .checkin-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;
    }
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
  `]
})
export class GateAccessComponent implements OnInit {
  private svc = inject(AccessControlService);
  private branchesSvc = inject(BranchesService);
  private toast = inject(NotificationService);

  logs = signal<GateAccessLog[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  checking = signal(false);
  lastResult = signal<GateAccessResponse | null>(null);

  qrCode = '';
  selectedBranchId: string | null = null;
  filterBranch: string | null = null;
  filterResult: GateAccessResult | null = null;
  fromDate = '';
  toDate = '';

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

  load() {
    this.loading.set(true);
    this.svc.logs({
      branchId: this.filterBranch ?? undefined,
      result: this.filterResult ?? undefined,
      fromDate: this.fromDate || undefined,
      toDate: this.toDate || undefined,
      take: 200
    }).subscribe({
      next: d => { this.logs.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }
}
