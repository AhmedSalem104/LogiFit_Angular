import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TenantBillingService } from './tenant-billing.service';
import { SubscriptionInvoice, SubscriptionInvoiceStatus, INVOICE_STATUS_AR } from './tenant-billing.models';

@Component({
  selector: 'app-subscription-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="invoices-page">
      <div class="page-head">
        <div>
          <h1>فواتير المنصة</h1>
          <p class="muted">فواتير اشتراك صالتك في منصة LogicFit</p>
        </div>
        <a routerLink="/owner/subscription" class="btn btn-ghost"><i class="pi pi-arrow-right"></i> رجوع للاشتراك</a>
      </div>

      @if (loading()) {
        <div class="loading"><i class="pi pi-spin pi-spinner"></i> جاري التحميل...</div>
      } @else if (!invoices().length) {
        <div class="card empty"><i class="pi pi-inbox empty-icon"></i><p class="muted">لا توجد فواتير بعد</p></div>
      } @else {
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th><th>المبلغ</th><th>الحالة</th>
                  <th>تاريخ الإصدار</th><th>الاستحقاق</th><th>تاريخ الدفع</th>
                </tr>
              </thead>
              <tbody>
                @for (inv of invoices(); track inv.id) {
                  <tr>
                    <td class="mono">{{ inv.invoiceNumber }}</td>
                    <td><b>{{ inv.amount }}</b> {{ inv.currency }}</td>
                    <td><span class="badge" [class]="'st-' + inv.status">{{ statusLabel(inv.status) }}</span></td>
                    <td>{{ inv.issueDate | date:'yyyy/MM/dd' }}</td>
                    <td>{{ inv.dueDate ? (inv.dueDate | date:'yyyy/MM/dd') : '—' }}</td>
                    <td>{{ inv.paidAt ? (inv.paidAt | date:'yyyy/MM/dd') : '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .invoices-page { padding:1.5rem; max-width:1000px; margin:0 auto; }
    .page-head { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    h1 { font-size:1.5rem; font-weight:700; color:var(--text-primary); }
    .muted { color:var(--text-secondary); }
    .loading { text-align:center; padding:3rem; color:var(--text-secondary); }
    .card { background:var(--bg-primary); border:1px solid var(--border-color); border-radius:14px; padding:1rem; }
    .empty { text-align:center; padding:3rem; } .empty-icon { font-size:2.5rem; color:var(--text-muted); margin-bottom:.75rem; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:.75rem 1rem; text-align:start; border-bottom:1px solid var(--border-color); font-size:.9rem; }
    th { color:var(--text-secondary); font-weight:600; }
    td { color:var(--text-primary); } .mono { font-family:monospace; }
    .badge { display:inline-block; padding:.2rem .7rem; border-radius:999px; font-size:.75rem; font-weight:700; }
    .st-3 { background:#dcfce7; color:#15803d; } .st-2 { background:#fef9c3; color:#a16207; }
    .st-1,.st-5 { background:#fee2e2; color:#b91c1c; } .st-4 { background:#f3f4f6; color:#6b7280; }
    .btn { display:inline-flex; align-items:center; gap:.5rem; padding:.6rem 1.1rem; border-radius:9px; cursor:pointer; font-weight:600; font-size:.9rem; text-decoration:none; }
    .btn-ghost { background:transparent; color:var(--text-secondary); border:1px solid var(--border-color); }
  `]
})
export class SubscriptionInvoicesComponent implements OnInit {
  private billing = inject(TenantBillingService);
  loading = signal(true);
  invoices = signal<SubscriptionInvoice[]>([]);

  ngOnInit(): void {
    this.billing.getInvoices().subscribe({
      next: (data) => { this.invoices.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  statusLabel(s: SubscriptionInvoiceStatus): string { return INVOICE_STATUS_AR[s] ?? '—'; }
}
