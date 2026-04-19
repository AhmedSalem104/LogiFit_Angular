import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AccessControlService } from '../services/access-control.service';
import { OwnerService, Client } from '../services/owner.service';
import { MembershipCard } from '../../../shared/models/gym-management.models';
import { GYM_PAGE_STYLES } from '../shared/gym-page.styles';

@Component({
  selector: 'app-membership-cards',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, DialogModule, InputTextModule,
    DropdownModule, ButtonModule, TooltipModule, InputTextareaModule,
    PageHeaderComponent, LoadingSkeletonComponent
  ],
  template: `
    <div class="gym-page">
      <app-page-header title="بطاقات العضوية" subtitle="إصدار وإدارة بطاقات QR للعملاء"
        [breadcrumbs]="[{label:'لوحة التحكم', route:'/owner/dashboard'},{label:'بطاقات العضوية'}]">
        <div class="header-actions">
          <button class="btn btn-primary" (click)="openIssue()"><i class="pi pi-plus"></i><span>إصدار بطاقة</span></button>
        </div>
      </app-page-header>

      <div class="stats-row">
        <div class="mini-stat"><div class="mini-stat__icon blue"><i class="pi pi-id-card"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ cards().length }}</span>
            <span class="mini-stat__label">إجمالي البطاقات</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon green"><i class="pi pi-check-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ activeCount() }}</span>
            <span class="mini-stat__label">نشطة</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon orange"><i class="pi pi-clock"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ expiredCount() }}</span>
            <span class="mini-stat__label">منتهية</span></div></div>
        <div class="mini-stat"><div class="mini-stat__icon red"><i class="pi pi-times-circle"></i></div>
          <div class="mini-stat__content"><span class="mini-stat__value">{{ revokedCount() }}</span>
            <span class="mini-stat__label">ملغاة</span></div></div>
      </div>

      <div class="toolbar">
        <p-dropdown class="flex-fill" [options]="clientOptions()" [(ngModel)]="clientFilter"
          placeholder="كل العملاء" [showClear]="true" [filter]="true" (onChange)="load()" appendTo="body"></p-dropdown>
        <p-dropdown [options]="activeOptions" [(ngModel)]="activeFilter"
          placeholder="الكل" [showClear]="true" (onChange)="load()" appendTo="body"></p-dropdown>
      </div>

      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>

      <div class="data-card" *ngIf="!loading()">
        <p-table [value]="cards()" [paginator]="true" [rows]="10">
          <ng-template pTemplate="header">
            <tr>
              <th>رقم البطاقة</th><th>العميل</th><th>تاريخ الإصدار</th><th>ينتهي في</th>
              <th>الحالة</th><th style="width:140px">إجراءات</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-c>
            <tr>
              <td><code>{{ c.cardNumber }}</code></td>
              <td>{{ c.clientName || '-' }}</td>
              <td>{{ c.issuedAt | date:'yyyy-MM-dd' }}</td>
              <td>{{ c.expiresAt ? (c.expiresAt | date:'yyyy-MM-dd') : '—' }}</td>
              <td>
                <span class="badge" *ngIf="c.revokedAt" [class.red]="true">ملغاة</span>
                <span class="badge" *ngIf="!c.revokedAt && c.isExpired" [class.orange]="true">منتهية</span>
                <span class="badge" *ngIf="!c.revokedAt && !c.isExpired && c.isActive" [class.green]="true">نشطة</span>
                <span class="badge" *ngIf="!c.revokedAt && !c.isExpired && !c.isActive" [class.gray]="true">معطلة</span>
              </td>
              <td>
                <button class="action-btn" (click)="showQr(c)" pTooltip="عرض QR"><i class="pi pi-qrcode"></i></button>
                <button class="action-btn danger" *ngIf="c.isActive && !c.revokedAt" (click)="revoke(c)" pTooltip="إلغاء"><i class="pi pi-ban"></i></button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6"><div class="empty-state"><i class="pi pi-id-card"></i><p>لا توجد بطاقات</p></div></td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <p-dialog [(visible)]="issueDialogVisible" [modal]="true" [style]="{width:'480px'}"
              header="إصدار بطاقة جديدة" [dismissableMask]="true">
      <div class="dialog-grid">
        <div class="full"><label class="form-label">العميل *</label>
          <p-dropdown [options]="clientOptions()" [(ngModel)]="issueForm.clientId"
            [filter]="true" appendTo="body" styleClass="w-full"></p-dropdown></div>
        <div class="full"><label class="form-label">تاريخ انتهاء البطاقة</label>
          <input type="date" class="form-input" [(ngModel)]="issueForm.expiresAt"/></div>
        <div class="full"><label class="form-label">رقم بطاقة مخصص (اختياري)</label>
          <input class="form-input" [(ngModel)]="issueForm.cardNumber" placeholder="يتم التوليد تلقائياً"/></div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="issueDialogVisible=false">إلغاء</button>
        <button class="btn btn-primary" (click)="saveIssue()" [disabled]="saving()">إصدار</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="qrDialogVisible" [modal]="true" [style]="{width:'420px'}"
              header="بطاقة العضوية" [dismissableMask]="true">
      <div class="qr-card" *ngIf="selectedCard">
        <div class="qr-placeholder">
          <i class="pi pi-qrcode"></i>
        </div>
        <div class="qr-info">
          <div class="qr-row"><span class="label">رقم البطاقة:</span> <code>{{ selectedCard.cardNumber }}</code></div>
          <div class="qr-row"><span class="label">العميل:</span> <span>{{ selectedCard.clientName }}</span></div>
          <div class="qr-row"><span class="label">رمز QR:</span> <code class="small">{{ selectedCard.qrCode }}</code></div>
          <div class="qr-row"><span class="label">تنتهي في:</span>
            <span>{{ selectedCard.expiresAt ? (selectedCard.expiresAt | date:'yyyy-MM-dd') : '—' }}</span>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="qrDialogVisible=false">إغلاق</button>
      </div>
    </p-dialog>

    <p-dialog [(visible)]="revokeDialogVisible" [modal]="true" [style]="{width:'440px'}"
              header="إلغاء البطاقة" [dismissableMask]="true">
      <div class="form-group">
        <label class="form-label">سبب الإلغاء</label>
        <textarea pInputTextarea rows="3" class="w-full" [(ngModel)]="revokeReason"></textarea>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-ghost" (click)="revokeDialogVisible=false">إلغاء</button>
        <button class="btn btn-danger" (click)="confirmRevoke()" [disabled]="saving()">تأكيد الإلغاء</button>
      </div>
    </p-dialog>
  `,
  styles: [GYM_PAGE_STYLES + `
    .qr-card {
      display:flex; flex-direction:column; gap:1rem; align-items:center;
      padding: 1rem;
    }
    .qr-placeholder {
      width: 160px; height: 160px; border-radius: 16px;
      background: linear-gradient(135deg,#1e293b,#0f172a);
      color: #60a5fa; display:flex; align-items:center; justify-content:center;
      font-size: 5rem;
    }
    .qr-info { width: 100%; display: flex; flex-direction: column; gap: .5rem; }
    .qr-row { display:flex; justify-content:space-between; gap:.5rem; padding: .35rem 0; border-bottom:1px dashed var(--border-color); }
    .qr-row .label { color: var(--text-secondary); font-size:.85rem; }
    .qr-row code { background: var(--bg-secondary); padding: .15rem .4rem; border-radius: 6px; font-size:.8rem; }
    .qr-row code.small { font-size:.7rem; max-width: 220px; overflow:hidden; text-overflow:ellipsis; }
  `]
})
export class MembershipCardsComponent implements OnInit {
  private svc = inject(AccessControlService);
  private ownerSvc = inject(OwnerService);
  private toast = inject(NotificationService);

  cards = signal<MembershipCard[]>([]);
  clients = signal<Client[]>([]);
  loading = signal(false);
  saving = signal(false);
  clientFilter: string | null = null;
  activeFilter: boolean | null = null;
  activeOptions = [{ label: 'نشطة', value: true }, { label: 'غير نشطة', value: false }];

  issueDialogVisible = false;
  qrDialogVisible = false;
  revokeDialogVisible = false;
  selectedCard: MembershipCard | null = null;
  issueForm: { clientId: string; expiresAt?: string; cardNumber?: string } = { clientId: '' };
  revokeReason = '';

  activeCount = computed(() => this.cards().filter(c => c.isActive && !c.revokedAt && !c.isExpired).length);
  expiredCount = computed(() => this.cards().filter(c => c.isExpired).length);
  revokedCount = computed(() => this.cards().filter(c => !!c.revokedAt).length);
  clientOptions = computed(() => this.clients().map(c => ({
    label: c.fullName || c.email || c.phoneNumber || c.id,
    value: c.id
  })));

  ngOnInit() {
    this.ownerSvc.getClients().subscribe(c => this.clients.set(c || []));
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.listCards({
      clientId: this.clientFilter ?? undefined,
      isActive: this.activeFilter ?? undefined
    }).subscribe({
      next: d => { this.cards.set(d || []); this.loading.set(false); },
      error: () => { this.toast.error('فشل التحميل'); this.loading.set(false); }
    });
  }

  openIssue() {
    this.issueForm = { clientId: '' };
    this.issueDialogVisible = true;
  }

  saveIssue() {
    if (!this.issueForm.clientId) { this.toast.error('اختر العميل'); return; }
    this.saving.set(true);
    this.svc.issueCard({
      clientId: this.issueForm.clientId,
      expiresAt: this.issueForm.expiresAt ? new Date(this.issueForm.expiresAt).toISOString() : null,
      cardNumber: this.issueForm.cardNumber || null
    }).subscribe({
      next: () => { this.saving.set(false); this.issueDialogVisible = false; this.toast.success('تم إصدار البطاقة'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }

  showQr(c: MembershipCard) { this.selectedCard = c; this.qrDialogVisible = true; }

  revoke(c: MembershipCard) {
    this.selectedCard = c; this.revokeReason = '';
    this.revokeDialogVisible = true;
  }

  confirmRevoke() {
    if (!this.selectedCard || !this.revokeReason.trim()) { this.toast.error('اكتب السبب'); return; }
    this.saving.set(true);
    this.svc.revokeCard(this.selectedCard.id, { reason: this.revokeReason }).subscribe({
      next: () => { this.saving.set(false); this.revokeDialogVisible = false; this.toast.success('تم الإلغاء'); this.load(); },
      error: (e) => { this.saving.set(false); this.toast.error(e?.error?.detail || 'فشل'); }
    });
  }
}
