import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnerService, GymProfile, UpdateGymProfileRequest } from '../services/owner.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-gym-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, InputTextareaModule, PageHeaderComponent],
  template: `
    <div class="gym-settings-page">
      <app-page-header
        title="إعدادات الصالة"
        subtitle="إدارة معلومات وإعدادات الصالة الرياضية"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/owner/dashboard'}, {label: 'إعدادات الصالة'}]"
      ></app-page-header>

      <nav class="settings-nav" aria-label="أقسام إعدادات الصالة">
        <button type="button" [class.active]="activeTab() === 'branding'" (click)="selectTab('branding')">الهوية والألوان</button>
        <button type="button" [class.active]="activeTab() === 'profile'" (click)="selectTab('profile')">بيانات الجيم</button>
        <button type="button" [class.active]="activeTab() === 'contact'" (click)="selectTab('contact')">التواصل</button>
        <button type="button" [class.active]="activeTab() === 'social'" (click)="selectTab('social')">التواصل الاجتماعي</button>
        <button type="button" [class.active]="activeTab() === 'gallery'" (click)="selectTab('gallery')">معرض الصور</button>
      </nav>
      @if (hasInvalidFields()) {
        <div class="validation-summary" role="alert"><i class="pi pi-exclamation-triangle"></i> راجع البريد والروابط وأكواد الألوان قبل الحفظ.</div>
      }

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>جاري تحميل البيانات...</span>
        </div>
      } @else {
        <!-- Cover Image Section -->
        <div class="cover-section" [hidden]="activeTab() !== 'profile'">
          <div class="cover-image" [style.backgroundImage]="profile()?.coverImageUrl ? 'url(' + getFullUrl(profile()!.coverImageUrl!) + ')' : ''">
            @if (!profile()?.coverImageUrl) {
              <div class="cover-placeholder">
                <i class="pi pi-image"></i>
                <span>صورة الغلاف</span>
              </div>
            }
            <div class="cover-actions">
              <label class="upload-btn cover-upload-btn">
                <i class="pi pi-camera"></i>
                <span>تغيير الغلاف</span>
                <input type="file" accept="image/*" (change)="uploadCover($event)" hidden />
              </label>
            </div>
          </div>

          <!-- Logo -->
          <div class="logo-section">
            <div class="logo-wrapper">
              @if (profile()?.logoUrl) {
                <img [src]="getFullUrl(profile()!.logoUrl!)" alt="Logo" class="logo-image" />
              } @else {
                <div class="logo-placeholder">
                  <i class="pi pi-building"></i>
                </div>
              }
              <label class="logo-upload-btn">
                <i class="pi pi-camera"></i>
                <input type="file" accept="image/*" (change)="uploadLogo($event)" hidden />
              </label>
            </div>
            <div class="gym-name-display">
              <h2>{{ profile()?.name || 'اسم الصالة' }}</h2>
            </div>
          </div>
        </div>

        <!-- Settings Form -->
        <div class="settings-grid">
          <!-- Basic Info Card -->
          <div id="profile-section" class="settings-card" [hidden]="activeTab() !== 'profile'">
            <div class="card-header">
              <i class="pi pi-info-circle"></i>
              <h3>المعلومات الأساسية</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>اسم الصالة *</label>
                <input type="text" pInputText [(ngModel)]="form.name" placeholder="اسم الصالة الرياضية" />
              </div>
              <div class="form-group">
                <label>الوصف</label>
                <textarea pInputTextarea [(ngModel)]="form.description" rows="3" placeholder="وصف مختصر عن الصالة" [autoResize]="true"></textarea>
              </div>
              <div class="form-group">
                <label>ساعات العمل</label>
                <input type="text" pInputText [(ngModel)]="form.openingHours" placeholder="مثال: 6:00 ص - 11:00 م" />
              </div>
            </div>
          </div>

          <!-- Contact Info Card -->
          <div id="contact-section" class="settings-card" [hidden]="activeTab() !== 'contact'">
            <div class="card-header">
              <i class="pi pi-phone"></i>
              <h3>معلومات التواصل</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>رقم الهاتف</label>
                <div class="input-with-icon">
                  <i class="pi pi-phone"></i>
                  <input type="tel" pInputText [(ngModel)]="form.phone" placeholder="01xxxxxxxxx" />
                </div>
              </div>
              <div class="form-group">
                <label>البريد الإلكتروني</label>
                <div class="input-with-icon">
                  <i class="pi pi-envelope"></i>
                  <input type="email" pInputText [(ngModel)]="form.email" placeholder="info@gym.com" [class.invalid-field]="form.email && !isValidEmail(form.email)" aria-describedby="gym-email-error" />
                </div>
                @if (form.email && !isValidEmail(form.email)) { <small id="gym-email-error" class="field-error">أدخل بريدا إلكترونيا صحيحا.</small> }
              </div>
              <div class="form-group">
                <label>العنوان</label>
                <div class="input-with-icon">
                  <i class="pi pi-map-marker"></i>
                  <input type="text" pInputText [(ngModel)]="form.address" placeholder="العنوان الكامل" />
                </div>
              </div>
            </div>
          </div>

          <!-- Social Media Card -->
          <div id="social-section" class="settings-card" [hidden]="activeTab() !== 'social'">
            <div class="card-header">
              <i class="pi pi-share-alt"></i>
              <h3>التواصل الاجتماعي</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>Facebook</label>
                <div class="input-with-icon">
                  <i class="pi pi-facebook"></i>
                  <input type="url" pInputText [(ngModel)]="form.facebook" placeholder="https://facebook.com/..." [class.invalid-field]="form.facebook && !isValidUrl(form.facebook)" />
                </div>
              </div>
              <div class="form-group">
                <label>Instagram</label>
                <div class="input-with-icon">
                  <i class="pi pi-instagram"></i>
                  <input type="url" pInputText [(ngModel)]="form.instagram" placeholder="https://instagram.com/..." [class.invalid-field]="form.instagram && !isValidUrl(form.instagram)" />
                </div>
              </div>
              <div class="form-group">
                <label>الموقع الإلكتروني</label>
                <div class="input-with-icon">
                  <i class="pi pi-globe"></i>
                  <input type="url" pInputText [(ngModel)]="form.website" placeholder="https://www.gym.com" [class.invalid-field]="form.website && !isValidUrl(form.website)" />
                </div>
              </div>
            </div>
          </div>

          <!-- Gallery Card -->
          <div id="gallery-section" class="settings-card gallery-card" [hidden]="activeTab() !== 'gallery'">
            <div class="card-header">
              <i class="pi pi-images"></i>
              <h3>معرض الصور</h3>
              <label class="upload-gallery-btn">
                <i class="pi pi-plus"></i>
                <span>إضافة صورة</span>
                <input type="file" accept="image/*" (change)="uploadGalleryImage($event)" hidden />
              </label>
            </div>
            <div class="card-body">
              @if (profile()?.galleryImages?.length) {
                <div class="gallery-grid">
                  @for (img of profile()!.galleryImages; track img) {
                    <div class="gallery-item">
                      <img [src]="getFullUrl(img)" alt="Gallery" />
                      <button class="gallery-delete-btn" (click)="deleteGalleryImage(img)">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  }
                </div>
              } @else {
                <div class="gallery-empty">
                  <i class="pi pi-images"></i>
                  <span>لا توجد صور في المعرض</span>
                </div>
              }
            </div>
          </div>
        <!-- White-label branding is intentionally first so the owner sees the
             tenant identity controls before secondary profile details. -->
        <div id="branding-section" class="settings-card branding-card" [hidden]="activeTab() !== 'branding'">
          <div class="card-header"><i class="pi pi-palette"></i><h3>الهوية البصرية</h3><span class="branding-hint">تظهر لجميع مستخدمي الجيم</span></div>
          <div class="card-body branding-grid">
            <div class="form-group"><label>اسم التطبيق</label><input pInputText [(ngModel)]="form.appName" placeholder="اسم التطبيق داخل الجيم" /></div>
            <div class="form-group"><label>الخط</label><input pInputText [(ngModel)]="form.fontFamily" placeholder="Cairo" /></div>
            <div class="form-group color-field"><label>اللون الأساسي</label><input type="color" [(ngModel)]="form.primaryColor" /><input pInputText [(ngModel)]="form.primaryColor" /></div>
            <div class="form-group color-field"><label>اللون الثانوي</label><input type="color" [(ngModel)]="form.secondaryColor" /><input pInputText [(ngModel)]="form.secondaryColor" /></div>
            <div class="form-group color-field"><label>لون القائمة الجانبية</label><input type="color" [(ngModel)]="form.sidebarColor" /><input pInputText [(ngModel)]="form.sidebarColor" /></div>
            <div class="form-group color-field"><label>لون شريط التنقل</label><input type="color" [(ngModel)]="form.headerColor" /><input pInputText [(ngModel)]="form.headerColor" /></div>
            <div class="form-group"><label>هاتف الدعم</label><input pInputText [(ngModel)]="form.supportPhone" /></div>
            <div class="form-group"><label>بريد الدعم</label><input type="email" pInputText [(ngModel)]="form.supportEmail" [class.invalid-field]="form.supportEmail && !isValidEmail(form.supportEmail)" /></div>
            <div class="form-group upload-field"><label>خلفية تسجيل الدخول</label><input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadBrandingImage($event, 'LoginBackground')" /><small>{{ form.loginBackgroundUrl ? 'تم رفع الصورة' : 'اختر صورة من جهازك' }}</small>@if (form.loginBackgroundUrl) { <img class="branding-image-preview" [src]="getFullUrl(form.loginBackgroundUrl)" alt="معاينة خلفية تسجيل الدخول" /> }</div>
            <div class="form-group upload-field"><label>بانر لوحة التحكم</label><input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadBrandingImage($event, 'DashboardHero')" /><small>{{ form.dashboardBannerUrl ? 'تم رفع الصورة' : 'اختر صورة من جهازك' }}</small>@if (form.dashboardBannerUrl) { <img class="branding-image-preview" [src]="getFullUrl(form.dashboardBannerUrl)" alt="معاينة بانر لوحة التحكم" /> }</div>
            <div class="branding-preview full-width" [style.background]="'linear-gradient(120deg,' + (form.primaryColor || '#2563eb') + ',' + (form.secondaryColor || '#4f46e5') + ')'">
              <strong>{{ form.appName || form.name || 'LogicFit' }}</strong><span>معاينة الهوية والألوان</span>
            </div>
            <div class="theme-live-preview full-width" [style.--preview-sidebar]="form.sidebarColor || '#0f172a'" [style.--preview-header]="form.headerColor || '#ffffff'" [style.--preview-primary]="form.primaryColor || '#2563eb'">
              <aside><b>{{ form.appName || form.name || 'LogicFit' }}</b><span>القائمة الجانبية</span></aside>
              <section><header>شريط التنقل والمعاينة المباشرة</header><div><button>زر أساسي</button><button class="secondary">زر ثانوي</button></div></section>
            </div>
            <div class="full-width branding-actions"><small>يتم حفظ الهوية مع باقي إعدادات الصالة من زر الحفظ الموحد.</small></div>
          </div>
        </div>
        </div>

        <!-- Save Button -->
        @if (hasUnsavedChanges()) {
          <div class="sticky-save-bar" role="region" aria-label="تغييرات غير محفوظة">
            <span><i class="pi pi-info-circle"></i> توجد تغييرات غير محفوظة</span>
            <div><button pButton type="button" label="إلغاء" class="p-button-text" (click)="cancelChanges()" [disabled]="saving()"></button><button pButton type="button" label="حفظ كل التغييرات" icon="pi pi-save" (click)="saveSettings()" [loading]="saving()"></button></div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .gym-settings-page {
      padding-bottom: 40px;
    }

    .settings-nav { position: sticky; top: 78px; z-index: 20; display: flex; gap: .5rem; flex-wrap: wrap; padding: .7rem; margin-bottom: 1rem; background: var(--card-bg, #fff); border: 1px solid var(--border-color); border-radius: 14px; box-shadow: 0 8px 20px rgba(15,23,42,.08); }
    .settings-nav button { border: 0; border-radius: 999px; padding: .55rem .9rem; background: var(--bg-secondary, #f1f5f9); color: var(--text-primary, #334155); cursor: pointer; transition: .2s ease; }
    .settings-nav button:hover, .settings-nav button.active { background: var(--primary-500, #2563eb); color: #fff; }
    [hidden] { display: none !important; }
    .validation-summary { margin-bottom: 1rem; padding: .75rem 1rem; border: 1px solid #fecaca; border-radius: 12px; color: #b91c1c; background: #fef2f2; }
    .sticky-save-bar { position: sticky; bottom: 1rem; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.25rem; padding: .75rem 1rem; border: 1px solid var(--border-color); border-radius: 14px; background: color-mix(in srgb, var(--card-bg, #fff) 92%, transparent); box-shadow: 0 12px 28px rgba(15,23,42,.16); }
    .sticky-save-bar > span { color: var(--text-secondary); font-size: .9rem; }
    .sticky-save-bar > div { display: flex; gap: .5rem; }
    input[type="email"], input[type="url"], input[type="tel"], .color-field input[type="text"] { direction: ltr; text-align: left; }
    .settings-card { scroll-margin-top: 145px; }
    .invalid-field { border-color: #dc2626 !important; box-shadow: 0 0 0 1px #dc2626; }
    .field-error { display: block; margin-top: .35rem; color: #b91c1c; font-size: .8rem; }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;
      color: var(--text-muted);
      i { font-size: 2.5rem; }
    }

    /* Cover Section */
    .cover-section {
      position: relative;
      margin-bottom: 80px;
      border-radius: 16px;
      overflow: visible;
    }

    .cover-image {
      width: 100%;
      height: 220px;
      background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
      background-size: cover;
      background-position: center;
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }

    .cover-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
      gap: 8px;
      i { font-size: 3rem; opacity: 0.3; }
      span { font-size: 0.9rem; }
    }

    .cover-actions {
      position: absolute;
      bottom: 16px;
      left: 16px;
    }

    .upload-btn, .cover-upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(0,0,0,0.6);
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: background 0.2s;
      &:hover { background: rgba(0,0,0,0.8); }
      i { font-size: 0.9rem; }
    }

    /* Logo Section */
    .logo-section {
      position: absolute;
      bottom: -60px;
      right: 32px;
      display: flex;
      align-items: flex-end;
      gap: 20px;
    }

    :host-context([dir="ltr"]) .logo-section {
      right: auto;
      left: 32px;
    }

    .logo-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 20px;
      border: 4px solid var(--bg-primary);
      background: var(--bg-primary);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      overflow: hidden;
    }

    .logo-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      i { font-size: 2.5rem; color: var(--text-muted); }
    }

    .logo-upload-btn {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 32px;
      height: 32px;
      background: var(--gradient-primary);
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s;
      &:hover { transform: scale(1.1); }
      i { font-size: 0.8rem; }
    }

    .gym-name-display {
      padding-bottom: 8px;
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
    }

    /* Settings Grid */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .settings-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .gallery-card {
      grid-column: 1 / -1;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-color);

      i {
        font-size: 1rem;
        color: var(--text-muted);
      }

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        flex: 1;
      }
    }

    .card-body {
      padding: 20px 24px;
    }

    /* Form Groups */
    .form-group {
      margin-bottom: 18px;

      &:last-child { margin-bottom: 0; }

      label {
        display: block;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: 6px;
      }

      input, textarea {
        width: 100%;
      }
    }

    .input-with-icon {
      position: relative;

      i {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        font-size: 0.9rem;
        z-index: 1;
      }

      input {
        padding-right: 38px !important;
      }
    }

    :host-context([dir="ltr"]) .input-with-icon {
      i {
        right: auto;
        left: 12px;
      }
      input {
        padding-right: 12px !important;
        padding-left: 38px !important;
      }
    }

    /* Gallery */
    .upload-gallery-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      transition: all 0.2s;
      &:hover {
        background: var(--gradient-primary);
        color: white;
      }
      i { font-size: 0.8rem; }
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }

    .gallery-item {
      position: relative;
      aspect-ratio: 4/3;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .gallery-delete-btn {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 30px;
      height: 30px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      i { font-size: 0.8rem; }
    }

    .gallery-item:hover .gallery-delete-btn {
      opacity: 1;
    }

    .gallery-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 12px;
      color: var(--text-muted);
      i { font-size: 2rem; opacity: 0.4; }
      span { font-size: 0.875rem; }
    }

    /* Save Section */
    .save-section {
      display: flex;
      justify-content: flex-end;
    }

    .save-btn {
      min-width: 180px;
    }
    .branding-card { grid-column: 1 / -1; order: -1; }
    .branding-card .upload-field { min-height: 7rem; }
    .branding-image-preview { display: block; width: 100%; max-height: 110px; object-fit: cover; border-radius: .65rem; margin-top: .65rem; border: 1px solid var(--border-color); }
    .branding-hint { color: var(--text-muted); font-size: .75rem; }
    .branding-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem 1.25rem; }
    .branding-grid .form-group { margin:0; }
    .branding-grid .full-width { grid-column:1 / -1; }
    .color-field { display:grid; grid-template-columns:1fr 2.25rem; align-items:end; gap:.5rem; }
    .color-field label { grid-column:1 / -1; }
    .color-field input[type=color] { width:2.25rem; height:2.25rem; padding:0; border:0; background:transparent; }
    .color-field input[type=text] { grid-column:1; grid-row:2; }
    .branding-preview { display:flex; align-items:center; justify-content:space-between; min-height:5rem; padding:1rem 1.25rem; border-radius:1rem; color:#fff; box-shadow:0 10px 24px rgba(15,23,42,.14); }
    .branding-preview strong { font-size:1.15rem; }.branding-preview span { opacity:.85; font-size:.8rem; }
    .branding-actions { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }.branding-actions small { color:var(--text-muted); }
    .theme-live-preview { display:grid; grid-template-columns:180px 1fr; min-height:130px; overflow:hidden; border:1px solid var(--border-color); border-radius:1rem; background:var(--bg-secondary); }
    .theme-live-preview aside { display:flex; flex-direction:column; gap:.5rem; padding:1rem; color:#fff; background:var(--preview-sidebar); }.theme-live-preview aside span { opacity:.7; font-size:.72rem; }
    .theme-live-preview section header { padding:1rem; color:#1f2937; background:var(--preview-header); border-bottom:1px solid var(--border-color); font-weight:700; }.theme-live-preview section div { display:flex; gap:.6rem; padding:1rem; }.theme-live-preview button { border:0; border-radius:.6rem; padding:.55rem .9rem; color:#fff; background:var(--preview-primary); cursor:pointer; }.theme-live-preview button.secondary { opacity:.75; }

    /* Responsive */
    @media (max-width: 900px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }

      .logo-section {
        right: 20px;
      }
    }

    @media (max-width: 600px) {
      .cover-image { height: 160px; }

      .logo-wrapper {
        width: 90px;
        height: 90px;
      }

      .cover-section { margin-bottom: 60px; }
      .logo-section { bottom: -45px; right: 16px; }
      .gym-name-display h2 { font-size: 1.2rem; }

      .card-body { padding: 16px; }
      .branding-grid { grid-template-columns:1fr; }.branding-grid .full-width { grid-column:auto; }

      .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .save-section { justify-content: center; }
      .save-btn { width: 100%; }
      .sticky-save-bar { flex-direction: column; align-items: stretch; bottom: .5rem; }
      .sticky-save-bar > div button { flex: 1; }
    }
  `]
})
export class GymSettingsComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private notify = inject(NotificationService);

  profile = signal<GymProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  brandingSaving = signal(false);
  activeTab = signal<'branding' | 'profile' | 'contact' | 'social' | 'gallery'>('branding');
  hasUnsavedChanges = signal(false);
  private initialFormSnapshot = '';

  form: UpdateGymProfileRequest = {
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    facebook: '',
    instagram: '',
    website: '',
    openingHours: ''
  };

  @HostListener('input')
  @HostListener('change')
  markDirty(): void {
    this.applyLivePreviewTheme();
    this.hasUnsavedChanges.set(JSON.stringify(this.form) !== this.initialFormSnapshot);
  }

  private applyLivePreviewTheme(): void {
    const root = document.documentElement;
    const vars: Record<string, string | undefined> = {
      '--brand-primary': this.form.primaryColor,
      '--brand-secondary': this.form.secondaryColor,
      '--primary-400': this.form.primaryColor,
      '--primary-500': this.form.primaryColor,
      '--primary-600': this.form.primaryColor,
      '--primary-700': this.form.primaryColor,
      '--sidebar-bg': this.form.sidebarColor,
      '--sidebar-color': this.form.sidebarColor,
      '--header-color': this.form.headerColor,
      '--bg-primary': this.form.headerColor,
      '--bg-secondary': this.form.backgroundColor,
      '--bg-tertiary': this.form.surfaceColor,
      '--card-bg': this.form.surfaceColor,
      '--brand-font': this.form.fontFamily
    };
    Object.entries(vars).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });
  }

  selectTab(tab: 'branding' | 'profile' | 'contact' | 'social' | 'gallery'): void {
    this.activeTab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelChanges(): void {
    this.loadProfile();
    this.notify.info('تم إلغاء التغييرات غير المحفوظة');
  }

  isValidEmail(value: string | undefined): boolean {
    return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  isValidUrl(value: string | undefined): boolean {
    if (!value) return true;
    try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
  }

  isValidHex(value: string | undefined): boolean {
    return !value || /^#[0-9a-f]{6}$/i.test(value);
  }

  hasInvalidFields(): boolean {
    return !this.isValidEmail(this.form.email) || !this.isValidEmail(this.form.supportEmail) ||
      !this.isValidHex(this.form.primaryColor) || !this.isValidHex(this.form.secondaryColor) ||
      !this.isValidHex(this.form.sidebarColor) || !this.isValidHex(this.form.headerColor) ||
      !this.isValidUrl(this.form.facebookUrl || this.form.facebook) ||
      !this.isValidUrl(this.form.instagramUrl || this.form.instagram) ||
      !this.isValidUrl(this.form.websiteUrl || this.form.website);
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.ownerService.getGymProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.form = {
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          facebook: data.brandingSettings?.facebookUrl || data.facebook || '',
          instagram: data.brandingSettings?.instagramUrl || data.instagram || '',
          website: data.brandingSettings?.websiteUrl || data.website || '',
          openingHours: data.brandingSettings?.openingHours || data.openingHours || '',
          appName: data.brandingSettings?.appName || '',
          fontFamily: data.brandingSettings?.fontFamily || '',
          primaryColor: data.brandingSettings?.primaryColor || '#2563eb',
          secondaryColor: data.brandingSettings?.secondaryColor || '#4f46e5',
          sidebarColor: data.brandingSettings?.sidebarColor || '#0f172a',
          headerColor: data.brandingSettings?.headerColor || '#ffffff',
          accentColor: data.brandingSettings?.accentColor || '#06b6d4',
          backgroundColor: data.brandingSettings?.backgroundColor || '#f4f7fb',
          supportPhone: data.brandingSettings?.supportPhone || '',
          supportEmail: data.brandingSettings?.supportEmail || '',
          loginBackgroundUrl: data.brandingSettings?.loginBackgroundUrl || '',
          dashboardBannerUrl: data.brandingSettings?.dashboardBannerUrl || ''
        };
        this.applyLivePreviewTheme();
        this.initialFormSnapshot = JSON.stringify(this.form);
        this.hasUnsavedChanges.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('حدث خطأ في تحميل بيانات الصالة');
        this.loading.set(false);
      }
    });
  }

  saveSettings(): void {
    if (!this.form.name?.trim()) {
      this.notify.warn('اسم الصالة مطلوب');
      return;
    }
    if (!this.isValidEmail(this.form.email) || !this.isValidEmail(this.form.supportEmail) ||
        !this.isValidHex(this.form.primaryColor) || !this.isValidHex(this.form.secondaryColor) ||
        !this.isValidHex(this.form.sidebarColor) || !this.isValidHex(this.form.headerColor) ||
        !this.isValidUrl(this.form.facebookUrl || this.form.facebook) ||
        !this.isValidUrl(this.form.instagramUrl || this.form.instagram) ||
        !this.isValidUrl(this.form.websiteUrl || this.form.website)) {
      this.notify.warn('يرجى تصحيح الحقول المميزة بالأحمر قبل الحفظ');
      return;
    }
    this.saving.set(true);
    const payload: UpdateGymProfileRequest = {
      ...this.form,
      phoneNumber: this.form.phone,
      facebookUrl: this.form.facebook,
      instagramUrl: this.form.instagram,
      websiteUrl: this.form.website,
      openingHours: this.form.openingHours,
    };
    this.ownerService.updateGymProfile(payload).subscribe({
      next: () => {
        this.notify.success('تم حفظ الإعدادات بنجاح');
        this.saving.set(false);
        this.loadProfile();
      },
      error: (error) => {
        this.notify.error(error?.error?.message || error?.error || 'تعذر حفظ الإعدادات. تحقق من الباقة والصلاحيات والاتصال.');
        this.saving.set(false);
      }
    });
  }

  saveBranding(): void {
    const payload: UpdateGymProfileRequest = {
      primaryColor: this.form.primaryColor,
      secondaryColor: this.form.secondaryColor,
      sidebarColor: this.form.sidebarColor,
      headerColor: this.form.headerColor,
      ...(this.form.appName?.trim() ? { appName: this.form.appName.trim() } : {}),
      ...(this.form.fontFamily?.trim() ? { fontFamily: this.form.fontFamily.trim() } : {}),
      ...(this.form.supportPhone?.trim() ? { supportPhone: this.form.supportPhone.trim() } : {}),
      ...(this.form.supportEmail?.trim() ? { supportEmail: this.form.supportEmail.trim() } : {}),
      ...(this.form.loginBackgroundUrl ? { loginBackgroundUrl: this.form.loginBackgroundUrl } : {}),
      ...(this.form.dashboardBannerUrl ? { dashboardBannerUrl: this.form.dashboardBannerUrl } : {})
    };
    this.brandingSaving.set(true);
    this.ownerService.updateGymProfile(payload).subscribe({
      next: () => {
        // PUT returns 204; verify persistence with a fresh server read before
        // telling the owner that the change was saved.
        this.ownerService.getGymProfile().subscribe({
          next: (saved) => {
            const b = saved.brandingSettings;
            const matches =
              (!payload.primaryColor || b?.primaryColor === payload.primaryColor) &&
              (!payload.secondaryColor || b?.secondaryColor === payload.secondaryColor) &&
              (!payload.sidebarColor || b?.sidebarColor === payload.sidebarColor) &&
              (!payload.headerColor || b?.headerColor === payload.headerColor) &&
              (!payload.loginBackgroundUrl || b?.loginBackgroundUrl === payload.loginBackgroundUrl) &&
              (!payload.dashboardBannerUrl || b?.dashboardBannerUrl === payload.dashboardBannerUrl);
            this.brandingSaving.set(false);
            if (!matches) {
              this.notify.error('تم استلام الطلب لكن الخادم لم يعكس التعديل. تأكد من نشر Backend الأخير واتصال قاعدة البيانات.');
              return;
            }
            this.profile.set(saved);
            this.notify.success('تم حفظ الهوية البصرية والتحقق منها بنجاح');
          },
          error: () => { this.brandingSaving.set(false); this.notify.error('تم الحفظ لكن تعذر التحقق من البيانات من الخادم'); }
        });
      },
      error: (error) => { this.brandingSaving.set(false); this.notify.error(error?.error?.message || error?.error || 'تعذر حفظ الهوية البصرية'); }
    });
  }

  /** Reject non-images and files > 5 MB before uploading; clears the input for retry. */
  private validImage(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return null;
    const okTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!okTypes.includes(file.type)) {
      this.notify.error('نوع الملف غير مدعوم. اختر صورة (JPG, PNG, GIF, WEBP).');
      input.value = '';
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notify.error('حجم الصورة يتجاوز 5 ميجابايت.');
      input.value = '';
      return null;
    }
    input.value = ''; // allow re-selecting the same file later
    return file;
  }

  uploadLogo(event: Event): void {
    const file = this.validImage(event);
    if (!file) return;
    this.ownerService.uploadGymLogo(file).subscribe({
      next: (res) => {
        this.profile.update(p => p ? { ...p, logoUrl: res.url } : p);
        this.notify.success('تم رفع اللوجو بنجاح');
      },
      error: () => this.notify.error('حدث خطأ في رفع اللوجو')
    });
  }

  uploadCover(event: Event): void {
    const file = this.validImage(event);
    if (!file) return;
    this.ownerService.uploadGymCover(file).subscribe({
      next: (res) => {
        this.profile.update(p => p ? { ...p, coverImageUrl: res.url } : p);
        this.notify.success('تم رفع صورة الغلاف بنجاح');
      },
      error: () => this.notify.error('حدث خطأ في رفع صورة الغلاف')
    });
  }

  uploadGalleryImage(event: Event): void {
    const file = this.validImage(event);
    if (!file) return;
    this.ownerService.uploadGymGallery(file).subscribe({
      next: (res) => {
        this.profile.update(p => {
          if (!p) return p;
          const gallery = [...(p.galleryImages || []), res.url];
          return { ...p, galleryImages: gallery };
        });
        this.notify.success('تم إضافة الصورة بنجاح');
      },
      error: () => this.notify.error('حدث خطأ في رفع الصورة')
    });
  }

  uploadBrandingImage(event: Event, assetType: 'LoginBackground' | 'DashboardHero'): void {
    const file = this.validImage(event);
    if (!file) return;
    this.ownerService.uploadBrandingAsset(file, assetType).subscribe({
      next: (res) => {
        if (assetType === 'LoginBackground') this.form.loginBackgroundUrl = res.imageUrl;
        else this.form.dashboardBannerUrl = res.imageUrl;
        this.markDirty();
        this.notify.success('تم رفع الصورة، اضغط حفظ كل التغييرات لاعتمادها');
      },
      error: () => this.notify.error('تعذر رفع صورة الهوية')
    });
  }

  deleteGalleryImage(imageUrl: string): void {
    this.ownerService.deleteGymGalleryImage(imageUrl).subscribe({
      next: () => {
        this.profile.update(p => {
          if (!p) return p;
          return { ...p, galleryImages: p.galleryImages?.filter(img => img !== imageUrl) };
        });
        this.notify.success('تم حذف الصورة');
      },
      error: () => this.notify.error('حدث خطأ في حذف الصورة')
    });
  }

  getFullUrl(path: string): string {
    if (path.startsWith('http')) return path;
    const origin = environment.production ? 'https://logicfit-saas-model.runasp.net' : window.location.origin;
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
