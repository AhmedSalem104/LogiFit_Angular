import { Component, OnInit, inject, signal } from '@angular/core';
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

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>جاري تحميل البيانات...</span>
        </div>
      } @else {
        <!-- Cover Image Section -->
        <div class="cover-section">
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
          <div class="settings-card">
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
          <div class="settings-card">
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
                  <input type="email" pInputText [(ngModel)]="form.email" placeholder="info@gym.com" />
                </div>
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
          <div class="settings-card">
            <div class="card-header">
              <i class="pi pi-share-alt"></i>
              <h3>التواصل الاجتماعي</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>Facebook</label>
                <div class="input-with-icon">
                  <i class="pi pi-facebook"></i>
                  <input type="url" pInputText [(ngModel)]="form.facebook" placeholder="https://facebook.com/..." />
                </div>
              </div>
              <div class="form-group">
                <label>Instagram</label>
                <div class="input-with-icon">
                  <i class="pi pi-instagram"></i>
                  <input type="url" pInputText [(ngModel)]="form.instagram" placeholder="https://instagram.com/..." />
                </div>
              </div>
              <div class="form-group">
                <label>الموقع الإلكتروني</label>
                <div class="input-with-icon">
                  <i class="pi pi-globe"></i>
                  <input type="url" pInputText [(ngModel)]="form.website" placeholder="https://www.gym.com" />
                </div>
              </div>
            </div>
          </div>

          <!-- Gallery Card -->
          <div class="settings-card gallery-card">
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
        </div>

        <!-- Save Button -->
        <div class="save-section">
          <button pButton label="حفظ التغييرات" icon="pi pi-check" (click)="saveSettings()" [loading]="saving()" class="save-btn"></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .gym-settings-page {
      padding-bottom: 40px;
    }

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

      .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .save-section { justify-content: center; }
      .save-btn { width: 100%; }
    }
  `]
})
export class GymSettingsComponent implements OnInit {
  private ownerService = inject(OwnerService);
  private notify = inject(NotificationService);

  profile = signal<GymProfile | null>(null);
  loading = signal(true);
  saving = signal(false);

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
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          website: data.website || '',
          openingHours: data.openingHours || ''
        };
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
    this.saving.set(true);
    this.ownerService.updateGymProfile(this.form).subscribe({
      next: () => {
        this.notify.success('تم حفظ الإعدادات بنجاح');
        this.saving.set(false);
        this.loadProfile();
      },
      error: () => {
        this.notify.error('حدث خطأ في حفظ الإعدادات');
        this.saving.set(false);
      }
    });
  }

  uploadLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
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
    const file = (event.target as HTMLInputElement).files?.[0];
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
    const file = (event.target as HTMLInputElement).files?.[0];
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
    return environment.apiUrl.replace('/api', '') + path;
  }
}
