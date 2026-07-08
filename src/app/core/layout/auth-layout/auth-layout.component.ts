import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeState } from '../../../state/theme.state';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-layout">
      <!-- Top actions -->
      <div class="auth-actions">
        <button
          class="action-btn"
          (click)="themeState.toggleLanguage()"
          [title]="themeState.language() === 'ar' ? 'Switch to English' : 'التبديل للعربية'"
        >
          <span>{{ themeState.language() === 'ar' ? 'EN' : 'ع' }}</span>
        </button>
        <button
          class="action-btn"
          (click)="themeState.toggleDarkMode()"
          [title]="themeState.darkMode() ? 'الوضع الفاتح' : 'الوضع الداكن'"
        >
          <i [class]="themeState.darkMode() ? 'pi pi-sun' : 'pi pi-moon'"></i>
        </button>
      </div>

      <!-- Left Side - Branding -->
      <div class="auth-branding">
        <!-- animated backdrop -->
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="grid-overlay"></div>

        <div class="branding-content">
          <div class="logo">
            <div class="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 6.5l11 11M4 9l-1.5 1.5a1.5 1.5 0 000 2.1L10.4 21a1.5 1.5 0 002.1 0L14 19.5M9 4l1.5-1.5a1.5 1.5 0 012.1 0L21 10.4a1.5 1.5 0 010 2.1L19.5 14"
                  stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="logo-word">Logic<b>Fit</b></span>
          </div>

          <h1>منصّة متكاملة لإدارة صالتك الرياضية</h1>
          <p>الأعضاء، المدربين، الاشتراكات، المالية، المخزون والتقارير — كل ما تحتاجه لإدارة صالتك في مكان واحد.</p>

          <div class="features">
            <div class="feature">
              <div class="feature-icon"><i class="pi pi-users"></i></div>
              <div><b>الأعضاء والمدربين</b><span>إدارة كاملة وبطاقات عضوية</span></div>
            </div>
            <div class="feature">
              <div class="feature-icon"><i class="pi pi-wallet"></i></div>
              <div><b>الاشتراكات والمالية</b><span>فواتير ومدفوعات وتقارير</span></div>
            </div>
            <div class="feature">
              <div class="feature-icon"><i class="pi pi-calendar"></i></div>
              <div><b>برامج وخطط</b><span>تمارين وتغذية مخصّصة</span></div>
            </div>
            <div class="feature">
              <div class="feature-icon"><i class="pi pi-chart-bar"></i></div>
              <div><b>تحليلات فورية</b><span>لوحات تحكم وإحصائيات</span></div>
            </div>
          </div>

          <div class="trust">
            <span class="dot"></span> متعدّد الفروع · ثنائي اللغة · آمن وسريع
          </div>
        </div>
      </div>

      <!-- Right Side - Form -->
      <div class="auth-form-container">
        <div class="auth-form-wrapper">
          <router-outlet></router-outlet>
        </div>
        <div class="form-footer">© {{ year }} LogicFit — جميع الحقوق محفوظة</div>
      </div>
    </div>
  `,
  styles: [`
    :host { --brand-a: #4f46e5; --brand-b: #3b82f6; --brand-c: #06b6d4; }

    .auth-layout { min-height: 100vh; display: flex; position: relative; }

    .auth-actions {
      position: fixed; top: 1.5rem; left: 1.5rem;
      display: flex; gap: 0.5rem; z-index: 100;
    }
    :host-context([dir="rtl"]) .auth-actions { left: auto; right: 1.5rem; }
    .action-btn {
      width: 40px; height: 40px; border: 1px solid rgba(255,255,255,.18);
      background: rgba(255,255,255,.12); backdrop-filter: blur(10px);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #fff; transition: all .2s ease; font-weight: 600;
    }
    .action-btn:hover { background: rgba(255,255,255,.22); transform: translateY(-1px); }

    /* ---------- Branding side ---------- */
    .auth-branding {
      flex: 1; position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center; padding: 3.5rem;
      background:
        radial-gradient(1200px 600px at 80% -10%, rgba(6,182,212,.25), transparent 60%),
        linear-gradient(135deg, #0b1220 0%, #172554 45%, #1d4ed8 100%);
    }
    .grid-overlay {
      position: absolute; inset: 0; opacity: .35;
      background-image:
        linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(circle at 50% 40%, #000 40%, transparent 85%);
    }
    .orb { position: absolute; border-radius: 50%; filter: blur(40px); opacity: .55; }
    .orb-1 { width: 340px; height: 340px; background: #3b82f6; top: -80px; right: -60px; animation: float 9s ease-in-out infinite; }
    .orb-2 { width: 260px; height: 260px; background: #06b6d4; bottom: -60px; left: -40px; animation: float 11s ease-in-out infinite reverse; }
    .orb-3 { width: 200px; height: 200px; background: #6366f1; top: 40%; left: 55%; animation: float 8s ease-in-out infinite; }

    .branding-content { color: #fff; max-width: 520px; position: relative; z-index: 1; }

    .logo { display: flex; align-items: center; gap: .85rem; margin-bottom: 2.25rem; }
    .logo-mark {
      width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22);
      border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.25);
    }
    .logo-mark svg { width: 30px; height: 30px; }
    .logo-word { font-size: 1.9rem; font-weight: 800; letter-spacing: .3px; }
    .logo-word b { font-weight: 600; opacity: .82; }

    h1 { font-size: 2rem; font-weight: 800; line-height: 1.35; margin-bottom: 1rem; }
    .branding-content > p { font-size: 1.02rem; opacity: .85; line-height: 1.8; margin-bottom: 2.5rem; }

    .features { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .feature {
      display: flex; align-items: center; gap: .85rem; padding: 1rem;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
      backdrop-filter: blur(12px); border-radius: 14px; transition: all .3s ease;
    }
    .feature:hover { background: rgba(255,255,255,.14); transform: translateY(-3px); border-color: rgba(255,255,255,.22); }
    .feature-icon {
      flex-shrink: 0; width: 42px; height: 42px; border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(255,255,255,.25), rgba(255,255,255,.08));
    }
    .feature-icon i { font-size: 1.15rem; }
    .feature > div { display: flex; flex-direction: column; }
    .feature b { font-size: .92rem; font-weight: 700; }
    .feature span { font-size: .78rem; opacity: .75; }

    .trust { margin-top: 2rem; display: flex; align-items: center; gap: .5rem; font-size: .85rem; opacity: .8; }
    .trust .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.2); }

    /* ---------- Form side ---------- */
    .auth-form-container {
      width: 520px; background: var(--bg-primary);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 3rem; position: relative;
    }
    .auth-form-wrapper { width: 100%; max-width: 400px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .form-footer { margin-top: 1.5rem; font-size: .78rem; color: var(--text-muted); text-align: center; }

    @keyframes float { 0%,100% { transform: translate(0,0); } 50% { transform: translate(0,-26px); } }
    @media (prefers-reduced-motion: reduce) { .orb { animation: none; } }

    /* ---------- Responsive ---------- */
    @media (max-width: 1024px) {
      .auth-layout { flex-direction: column; }
      .auth-branding { padding: 2.5rem 2rem; min-height: 42vh; }
      h1 { font-size: 1.6rem; }
      .branding-content > p { margin-bottom: 1.5rem; }
      .features { display: none; }
      .trust { display: none; }
      .auth-form-container { width: 100%; flex: 1; padding: 2rem; }
    }
    @media (max-width: 480px) {
      .auth-branding { padding: 2rem 1.5rem; min-height: 32vh; }
      .logo-word { font-size: 1.6rem; }
      h1 { font-size: 1.35rem; }
      .branding-content > p { display: none; }
      .auth-form-container { padding: 1.5rem; }
      .form-footer { display: none; }
    }
  `]
})
export class AuthLayoutComponent {
  themeState = inject(ThemeState);
  readonly year = 2026;
}
