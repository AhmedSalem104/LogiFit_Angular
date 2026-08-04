import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeState } from '../../../state/theme.state';
import { BrandingService } from '../../services/branding.service';
import { HelpCenterComponent } from '../../help/help-center/help-center.component';
import { HelpLocalComponent } from '../../help/help-local/help-local.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HelpCenterComponent, HelpLocalComponent],
  template: `
    <main class="auth-layout">
      <section class="auth-card" aria-label="رحلة الدخول إلى LogicFit">
        <div
          class="auth-journey"
          [style.background-image]="branding.branding()?.loginBackgroundUrl
            ? 'linear-gradient(145deg, rgba(8,15,35,.92), rgba(30,64,175,.84)), url(' + branding.branding()!.loginBackgroundUrl + ')'
            : null"
        >
          <div class="journey-orb orb-one"></div>
          <div class="journey-orb orb-two"></div>
          <div class="journey-grid"></div>

          <div class="journey-content">
            <div class="brand-lockup">
              <div class="logo-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.5 6.5l11 11M4 9l-1.5 1.5a1.5 1.5 0 000 2.1L10.4 21a1.5 1.5 0 002.1 0L14 19.5M9 4l1.5-1.5a1.5 1.5 0 012.1 0L21 10.4a1.5 1.5 0 010 2.1L19.5 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              @if (branding.branding()?.logoUrl) {
                <img class="tenant-logo" [src]="branding.branding()!.logoUrl" [alt]="branding.branding()?.name || 'LogicFit'">
              }
              <span>{{ branding.branding()?.appName || branding.branding()?.name || 'LogicFit' }}</span>
            </div>

            <div class="journey-intro">
              <span class="eyebrow">رحلة دخول منظمة</span>
              <h1>ادخل إلى مساحة عملك بثقة.</h1>
              <p>ثلاث خطوات قصيرة توصلك إلى لوحة العمل المناسبة، مع إبقاء هويتك وبياناتك محمية.</p>
            </div>

            <ol class="journey-steps" aria-label="خطوات الدخول">
              <li class="journey-step is-active">
                <span class="step-index">01</span>
                <span class="step-connector" aria-hidden="true"></span>
                <div>
                  <strong>حدد طريق الدخول</strong>
                  <small>صالة محددة أو هوية متعددة المساحات.</small>
                </div>
              </li>
              <li class="journey-step">
                <span class="step-index">02</span>
                <span class="step-connector" aria-hidden="true"></span>
                <div>
                  <strong>أكمل التحقق</strong>
                  <small>أدخل رقم هاتفك وكلمة المرور بأمان.</small>
                </div>
              </li>
              <li class="journey-step">
                <span class="step-index">03</span>
                <div>
                  <strong>ابدأ من مساحتك</strong>
                  <small>تصل تلقائياً إلى لوحة الدور المناسبة.</small>
                </div>
              </li>
            </ol>

            <div class="journey-trust">
              <i class="pi pi-shield"></i>
              <span>جلسة آمنة · وصول وفق الصلاحيات · دعم عربي وإنجليزي</span>
            </div>
          </div>
        </div>

        <div class="auth-form-container">
          <div class="auth-actions" aria-label="إعدادات العرض">
            <button
              class="action-btn"
              type="button"
              (click)="themeState.toggleLanguage()"
              [title]="themeState.language() === 'ar' ? 'Switch to English' : 'التبديل للعربية'"
            >
              <span>{{ themeState.language() === 'ar' ? 'EN' : 'ع' }}</span>
            </button>
            <button
              class="action-btn"
              type="button"
              (click)="themeState.toggleDarkMode()"
              [title]="themeState.darkMode() ? 'الوضع الفاتح' : 'الوضع الداكن'"
            >
              <i [class]="themeState.darkMode() ? 'pi pi-sun' : 'pi pi-moon'"></i>
            </button>
          </div>

          <div class="auth-form-wrapper">
            <router-outlet></router-outlet>
          </div>
          <footer class="form-footer">© {{ year }} LogicFit — جميع الحقوق محفوظة</footer>
        </div>
      </section>

      <app-help-center></app-help-center>
      <app-help-local></app-help-local>
    </main>
  `,
  styles: [`
    :host { --journey-blue: #2563eb; --journey-cyan: #22d3ee; }

    .auth-layout {
      align-items: center;
      background: #1d4ed8;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: clamp(1rem, 3vw, 3rem);
      position: relative;
    }

    .auth-card {
      background: var(--card-bg);
      border: 1px solid color-mix(in srgb, var(--card-border) 82%, transparent);
      border-radius: 28px;
      box-shadow: 0 28px 70px rgba(15, 23, 42, .18);
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      max-width: 620px;
      min-height: min(760px, calc(100vh - 3rem));
      overflow: hidden;
      width: 100%;
    }

    .auth-journey {
      display: none;
    }

    .journey-grid {
      background-image: linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
      background-size: 38px 38px;
      inset: 0;
      mask-image: radial-gradient(circle at 48% 50%, #000 20%, transparent 78%);
      opacity: .55;
      pointer-events: none;
      position: absolute;
    }

    .journey-orb { border-radius: 50%; filter: blur(20px); opacity: .55; position: absolute; }
    .orb-one { animation: float 10s ease-in-out infinite; background: #2563eb; height: 250px; left: -105px; top: -80px; width: 250px; }
    .orb-two { animation: float 12s ease-in-out infinite reverse; background: #22d3ee; bottom: -130px; height: 290px; right: -80px; width: 290px; }

    .journey-content { display: flex; flex-direction: column; height: 100%; position: relative; z-index: 1; }
    .brand-lockup { align-items: center; display: flex; font-size: 1.35rem; font-weight: 800; gap: .75rem; letter-spacing: .01em; }
    .logo-mark { align-items: center; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.23); border-radius: 13px; display: flex; height: 46px; justify-content: center; width: 46px; }
    .logo-mark svg { height: 26px; width: 26px; }
    .tenant-logo { background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.23); border-radius: 13px; height: 46px; object-fit: contain; padding: .25rem; width: 46px; }

    .journey-intro { margin-top: clamp(2.5rem, 8vh, 5.5rem); max-width: 480px; }
    .eyebrow { color: #a5f3fc; font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .journey-intro h1 { font-size: clamp(2rem, 4vw, 3.15rem); letter-spacing: -.035em; line-height: 1.16; margin: .7rem 0 1rem; }
    .journey-intro p { color: rgba(255,255,255,.76); font-size: 1rem; line-height: 1.85; margin: 0; max-width: 450px; }

    .journey-steps { display: grid; gap: .9rem; list-style: none; margin: clamp(2.2rem, 6vh, 4rem) 0 0; padding: 0; }
    .journey-step { align-items: center; display: grid; gap: 1rem; grid-template-columns: 42px 12px minmax(0, 1fr); min-height: 56px; opacity: .62; position: relative; }
    .journey-step:last-child { grid-template-columns: 42px 12px minmax(0, 1fr); }
    .journey-step.is-active { opacity: 1; }
    .step-index { align-items: center; background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.18); border-radius: 50%; color: rgba(255,255,255,.75); display: flex; font-size: .73rem; font-weight: 800; height: 42px; justify-content: center; letter-spacing: .04em; width: 42px; }
    .is-active .step-index { background: #fff; border-color: #fff; box-shadow: 0 0 0 6px rgba(255,255,255,.1); color: #1d4ed8; }
    .step-connector { align-self: stretch; background: linear-gradient(#fff, rgba(255,255,255,.1)); border-radius: 999px; margin: 42px auto -20px; opacity: .36; width: 2px; }
    .journey-step:last-child .step-connector { background: transparent; }
    .journey-step div { display: grid; gap: .18rem; }
    .journey-step strong { font-size: .94rem; }
    .journey-step small { color: rgba(255,255,255,.68); font-size: .79rem; line-height: 1.45; }

    .journey-trust { align-items: center; border-top: 1px solid rgba(255,255,255,.16); color: rgba(255,255,255,.78); display: flex; font-size: .78rem; gap: .6rem; margin-top: auto; padding-top: 1.45rem; }
    .journey-trust i { color: #67e8f9; }

    .auth-form-container { background: var(--card-bg); display: flex; flex-direction: column; min-width: 0; padding: clamp(1.5rem, 4vw, 3.5rem); position: relative; }
    .auth-actions { display: flex; gap: .5rem; justify-content: flex-end; }
    .action-btn { align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-secondary); cursor: pointer; display: flex; font-size: .85rem; font-weight: 700; height: 38px; justify-content: center; transition: .2s ease; width: 38px; }
    .action-btn:hover { border-color: var(--primary-400); color: var(--primary-600); transform: translateY(-1px); }
    .auth-form-wrapper { display: flex; flex: 1; flex-direction: column; justify-content: center; margin: 1.5rem auto; max-width: 440px; width: 100%; }
    .form-footer { color: var(--text-muted); font-size: .76rem; text-align: center; }

    @keyframes float { 0%, 100% { transform: translate3d(0, 0, 0); } 50% { transform: translate3d(0, -20px, 0); } }
    @media (prefers-reduced-motion: reduce) { .journey-orb { animation: none; } }

    @media (max-width: 980px) {
      .auth-card { grid-template-columns: 1fr; max-width: 620px; min-height: auto; }
      .auth-journey { min-height: 330px; padding: 2.2rem; }
      .journey-intro { margin-top: 2.5rem; }
      .journey-intro h1 { font-size: 2.1rem; }
      .journey-steps { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 2rem; }
      .journey-step, .journey-step:last-child { align-items: start; gap: .7rem; grid-template-columns: 36px minmax(0, 1fr); }
      .step-connector { display: none; }
      .step-index { height: 36px; width: 36px; }
      .journey-step small { display: none; }
      .journey-trust { display: none; }
      .auth-form-container { min-height: 520px; }
    }

    @media (max-width: 560px) {
      .auth-layout { align-items: center; padding: 1rem; }
      .auth-card { border-radius: 22px; box-shadow: 0 18px 42px rgba(15, 23, 42, .2); min-height: calc(100vh - 2rem); }
      .auth-journey { min-height: 280px; padding: 1.5rem; }
      .brand-lockup { font-size: 1.15rem; }
      .journey-intro { margin-top: 1.7rem; }
      .journey-intro h1 { font-size: 1.65rem; margin-bottom: .5rem; }
      .journey-intro p { font-size: .88rem; line-height: 1.65; }
      .journey-steps { gap: .45rem; margin-top: 1.35rem; }
      .journey-step { font-size: .78rem; grid-template-columns: 30px minmax(0, 1fr); }
      .journey-step strong { font-size: .76rem; }
      .step-index { font-size: .62rem; height: 30px; width: 30px; }
      .auth-form-container { min-height: 0; padding: 1.35rem; }
      .auth-form-wrapper { margin: 1rem auto 1.8rem; }
      .form-footer { font-size: .69rem; }
    }
  `]
})
export class AuthLayoutComponent {
  readonly themeState = inject(ThemeState);
  readonly branding = inject(BrandingService);
  readonly year = 2026;
}
