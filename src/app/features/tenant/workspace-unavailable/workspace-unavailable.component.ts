import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-workspace-unavailable',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="workspace-unavailable" role="alert">
      <div class="card">
        <i class="pi pi-lock" aria-hidden="true"></i>
        <h1>الميزة غير متاحة لهذه المساحة</h1>
        <p>هذه الشاشة مخصصة لنوع مساحة عمل مختلف. استخدم أقسام مساحتك الحالية من القائمة.</p>
        <a routerLink="/coach/dashboard" class="primary">العودة إلى لوحة المساحة</a>
      </div>
    </main>
  `,
  styles: [`
    .workspace-unavailable { min-height: 100vh; display: grid; place-items: center; padding: 2rem; background: #f8fafc; }
    .card { max-width: 32rem; text-align: center; padding: 2.5rem; border-radius: 1.25rem; background: #fff; box-shadow: 0 18px 50px rgba(15, 23, 42, .12); }
    i { display: inline-grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 1rem; color: #7c3aed; background: #ede9fe; font-size: 1.5rem; }
    h1 { margin: 1.25rem 0 .75rem; color: #0f172a; font-size: 1.35rem; }
    p { margin: 0 0 1.5rem; color: #475569; line-height: 1.8; }
    .primary { display: inline-block; padding: .75rem 1.25rem; border-radius: .75rem; color: #fff; background: #2563eb; text-decoration: none; }
  `]
})
export class WorkspaceUnavailableComponent {}
