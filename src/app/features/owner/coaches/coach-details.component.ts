import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OwnerService, Coach } from '../services/owner.service';

@Component({
  selector: 'app-coach-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="details-page">
      <a routerLink="/owner/coaches" class="back-link"><i class="pi pi-arrow-right"></i> العودة إلى المدربين</a>
      @if (loading()) { <div class="state">جاري تحميل بيانات المدرب...</div> }
      @else if (error()) { <div class="state error" role="alert">{{ error() }}</div> }
      @else if (coach()) {
        <header class="page-header"><div><span class="eyebrow">ملف المدرب</span><h1>{{ coach()!.profile?.fullName || coach()!.fullName || 'مدرب' }}</h1><p>{{ coach()!.email || 'بدون بريد إلكتروني' }}</p></div><span class="status" [class.inactive]="!coach()!.isActive">{{ coach()!.isActive ? 'نشط' : 'غير نشط' }}</span></header>
        <section class="grid">
          <article><span>الهاتف</span><strong>{{ coach()!.phoneNumber || '—' }}</strong></article>
          <article><span>المتدربون</span><strong>{{ coach()!.traineesCount ?? coach()!.traineeCount ?? 0 }}</strong></article>
          <article><span>البرامج النشطة</span><strong>{{ coach()!.activePrograms ?? 0 }}</strong></article>
          <article><span>الحالة</span><strong>{{ coach()!.isActive ? 'متاح للعمل' : 'موقوف' }}</strong></article>
        </section>
        <section class="card"><h2>بيانات المدرب</h2><dl><div><dt>تاريخ الميلاد</dt><dd>{{ coach()!.profile?.birthDate || '—' }}</dd></div><div><dt>النوع</dt><dd>{{ coach()!.profile?.gender ?? '—' }}</dd></div></dl></section>
      }
    </main>
  `,
  styles: [`
    .details-page { max-width: 1050px; margin: 0 auto; padding: 2rem; color: #0f172a; } .back-link { display: inline-flex; gap: .5rem; align-items: center; color: #2563eb; text-decoration: none; margin-bottom: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; } .eyebrow { color: #64748b; font-size: .85rem; } h1 { margin: .35rem 0; } p { margin: 0; color: #64748b; }
    .status { padding: .4rem .8rem; border-radius: 999px; color: #166534; background: #dcfce7; } .status.inactive { color: #991b1b; background: #fee2e2; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; } article, .card { padding: 1.25rem; border-radius: 1rem; background: #fff; box-shadow: 0 8px 24px rgba(15,23,42,.07); } article span, dt { color: #64748b; font-size: .85rem; } article strong { display: block; margin-top: .55rem; }
    .card h2 { margin-top: 0; font-size: 1.1rem; } dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; } dt, dd { margin: 0; } dd { margin-top: .35rem; font-weight: 600; } .state { padding: 2rem; text-align: center; border-radius: 1rem; background: #fff; } .error { color: #991b1b; background: #fef2f2; }
    @media (max-width: 700px) { .details-page { padding: 1rem; } .grid, dl { grid-template-columns: 1fr 1fr; } .page-header { flex-direction: column; } }
  `]
})
export class CoachDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly owner = inject(OwnerService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly coach = signal<Coach | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); this.error.set('معرف المدرب غير موجود.'); return; }
    this.owner.getCoachById(id).subscribe({ next: value => { this.coach.set(value); this.loading.set(false); }, error: () => { this.error.set('تعذر تحميل بيانات المدرب.'); this.loading.set(false); } });
  }
}
