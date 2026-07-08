import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

/**
 * Gym (tenant) provisioning now lives on the separate LogicFit Platform, where a
 * new gym is created and reviewed/approved before it can sign in to this app.
 * This screen no longer creates a tenant here — it directs owners to the platform.
 */
@Component({
  selector: 'app-register-gym',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="register-gym-page">
      <a routerLink="/auth/login" class="back-link">
        <i class="pi pi-arrow-right"></i>
        <span>العودة لتسجيل الدخول</span>
      </a>

      <div class="hero">
        <div class="hero-icon"><i class="pi pi-building"></i></div>
        <h2>سجّل صالتك على منصة LogicFit</h2>
        <p class="subtitle">
          إنشاء صالة جديدة يتم عبر منصة LogicFit، حيث تختار باقتك وتُفعّل صالتك بعد المراجعة.
          بمجرد تفعيل الصالة، يمكنك تسجيل الدخول من هنا بحساب المالك.
        </p>
      </div>

      <ul class="steps">
        <li><span class="num">1</span> أنشئ حساب صالتك على المنصة واختر الباقة</li>
        <li><span class="num">2</span> ارفع إثبات الدفع وانتظر التفعيل</li>
        <li><span class="num">3</span> سجّل الدخول من هذا التطبيق برقم هاتف المالك</li>
      </ul>

      <a [href]="platformUrl" target="_blank" rel="noopener" class="btn btn-primary w-full">
        <i class="pi pi-external-link"></i>
        <span>الذهاب إلى منصة التسجيل</span>
      </a>

      <div class="login-link">
        <span>صالتك مُفعّلة بالفعل؟</span>
        <a routerLink="/auth/login">تسجيل الدخول</a>
      </div>
    </div>
  `,
  styles: [`
    .register-gym-page { text-align: center; }
    .back-link { display:inline-flex; align-items:center; gap:.5rem; color:var(--text-secondary); text-decoration:none; margin-bottom:1.5rem; font-size:.9rem; float:inline-start; }
    .back-link:hover { color:#3b82f6; }
    :host-context([dir="ltr"]) .back-link i { transform:rotate(180deg); }
    .hero { margin: 1.5rem 0 1.5rem; clear: both; }
    .hero-icon { width:72px; height:72px; border-radius:50%; background:rgba(59,130,246,.1); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; }
    .hero-icon i { font-size:2rem; color:#3b82f6; }
    h2 { font-size:1.6rem; font-weight:700; color:var(--text-primary); margin-bottom:.75rem; }
    .subtitle { color:var(--text-secondary); line-height:1.7; }
    .steps { list-style:none; text-align:start; display:flex; flex-direction:column; gap:.75rem; margin:1.5rem 0; }
    .steps li { display:flex; align-items:center; gap:.75rem; color:var(--text-primary); font-size:.95rem; }
    .steps .num { flex-shrink:0; width:28px; height:28px; border-radius:50%; background:var(--bg-secondary); border:1px solid var(--border-color); display:inline-flex; align-items:center; justify-content:center; font-weight:700; color:#3b82f6; }
    .btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; height:48px; font-size:1rem; text-decoration:none; }
    .w-full { width:100%; }
    .login-link { margin-top:2rem; padding-top:2rem; border-top:1px solid var(--border-color); color:var(--text-secondary); }
    .login-link a { color:#3b82f6; text-decoration:none; font-weight:500; margin-inline-start:.25rem; }
    .login-link a:hover { text-decoration:underline; }
  `]
})
export class RegisterGymComponent {
  readonly platformUrl = environment.platformUrl;
}
