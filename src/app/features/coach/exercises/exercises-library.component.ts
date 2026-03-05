import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { TabViewModule } from 'primeng/tabview';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CoachService, Exercise, Muscle, SecondaryMuscle } from '../services/coach.service';
import { NotificationService } from '../../../core/services/notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-exercises-library',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    CheckboxModule,
    TableModule,
    TagModule,
    TooltipModule,
    FileUploadModule,
    TabViewModule,
    PageHeaderComponent,
    LoadingSkeletonComponent
  ],
  template: `
    <div class="exercises-page">
      <app-page-header
        title="مكتبة التمارين"
        subtitle="إدارة وتنظيم التمارين"
        [breadcrumbs]="[{label: 'لوحة التحكم', route: '/coach/dashboard'}, {label: 'مكتبة التمارين'}]"
      >
        <button class="btn btn-primary" (click)="openAddDialog()">
          <i class="pi pi-plus"></i>
          <span>إضافة تمرين</span>
        </button>
      </app-page-header>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card purple">
          <div class="stat-icon"><i class="pi pi-list"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ exercises().length }}</span>
            <span class="stat-label">إجمالي التمارين</span>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ beginnerCount() }}</span>
            <span class="stat-label">مبتدئ</span>
          </div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon"><i class="pi pi-star"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ intermediateCount() }}</span>
            <span class="stat-label">متوسط</span>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon"><i class="pi pi-bolt"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ advancedCount() }}</span>
            <span class="stat-label">متقدم</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-loading-skeleton *ngIf="loading()" type="table"></app-loading-skeleton>

      <!-- Table Container -->
      <div class="table-container" *ngIf="!loading()">
        <div class="table-header">
          <div class="table-title">
            <i class="pi pi-list"></i>
            <span>قائمة التمارين</span>
            <span class="count-badge">{{ filteredExercises().length }}</span>
          </div>
          <div class="table-actions">
            <span class="p-input-icon-right search-box">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchTerm"
                placeholder="بحث..."
                (input)="filterExercises()"
              />
            </span>
            <p-dropdown
              [options]="muscleGroupOptions"
              [(ngModel)]="selectedMuscleGroup"
              placeholder="المجموعة العضلية"
              (onChange)="filterExercises()"
              [showClear]="true"
              [style]="{'min-width': '160px'}"
            ></p-dropdown>
          </div>
        </div>

        <!-- PrimeNG Table -->
        <p-table
          [value]="filteredExercises()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[5, 10, 25]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} تمرين"
          [sortField]="'name'"
          [sortOrder]="1"
          styleClass="p-datatable-striped"
          [tableStyle]="{'min-width': '60rem'}"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="nameAr" style="width: 25%">
                التمرين
                <p-sortIcon field="nameAr"></p-sortIcon>
              </th>
              <th pSortableColumn="targetMuscleName" style="width: 15%">
                المجموعة العضلية
                <p-sortIcon field="targetMuscleName"></p-sortIcon>
              </th>
              <th pSortableColumn="equipment" style="width: 12%">
                المعدات
                <p-sortIcon field="equipment"></p-sortIcon>
              </th>
              <th style="width: 18%">الوصف</th>
              <th pSortableColumn="difficulty" style="width: 15%">
                المستوى
                <p-sortIcon field="difficulty"></p-sortIcon>
              </th>
              <th style="width: 15%">الإجراءات</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-exercise>
            <tr>
              <!-- Exercise Name -->
              <td>
                <div class="exercise-cell">
                  <div class="exercise-icon">
                    @if (exercise.imageUrl) {
                      <img [src]="exercise.imageUrl" [alt]="exercise.name" class="exercise-img" />
                    } @else {
                      <i class="pi pi-bolt"></i>
                    }
                  </div>
                  <div class="exercise-details">
                    <span class="exercise-name">{{ exercise.nameAr || exercise.name }}</span>
                    <span class="exercise-name-en" *ngIf="exercise.nameAr && exercise.name">{{ exercise.name }}</span>
                    @if (exercise.difficulty === 'Advanced') {
                      <span class="high-impact-tag">
                        <i class="pi pi-bolt"></i> متقدم
                      </span>
                    }
                  </div>
                </div>
              </td>

              <!-- Muscle Group -->
              <td>
                <div class="muscle-cell">
                  <span class="muscle-badge primary">{{ exercise.targetMuscleName || exercise.muscleGroupName }}</span>
                  @if (exercise.primaryMuscleContributionPercent) {
                    <span class="contribution-percent">{{ exercise.primaryMuscleContributionPercent }}%</span>
                  }
                  @if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
                    <div class="secondary-muscles">
                      @for (secondary of exercise.secondaryMuscles.slice(0, 2); track secondary.muscleId) {
                        <span class="muscle-badge secondary" [pTooltip]="secondary.contributionPercent + '%'" tooltipPosition="top">
                          {{ secondary.muscleName }}
                        </span>
                      }
                    </div>
                  }
                </div>
              </td>

              <!-- Equipment -->
              <td>
                <span class="equipment-badge">{{ exercise.equipment || exercise.equipmentType || '-' }}</span>
              </td>

              <!-- Description -->
              <td>
                <span class="description-text" *ngIf="exercise.descriptionAr || exercise.description" [pTooltip]="exercise.descriptionAr || exercise.description" tooltipPosition="top">
                  {{ (exercise.descriptionAr || exercise.description) | slice:0:40 }}{{ (exercise.descriptionAr || exercise.description)?.length > 40 ? '...' : '' }}
                </span>
                <span class="no-desc" *ngIf="!exercise.description && !exercise.descriptionAr">-</span>
              </td>

              <!-- Difficulty & Category -->
              <td>
                <div class="tags-cell">
                  <p-tag
                    *ngIf="exercise.difficulty"
                    [value]="getDifficultyLabel(exercise.difficulty)"
                    [severity]="getDifficultySeverity(exercise.difficulty)"
                    [rounded]="true"
                  ></p-tag>
                  <span class="category-badge" *ngIf="exercise.category">{{ exercise.category }}</span>
                </div>
              </td>

              <!-- Actions -->
              <td>
                <div class="actions-cell">
                  <button
                    class="action-icon view"
                    (click)="viewExercise(exercise)"
                    pTooltip="عرض التفاصيل"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  @if (exercise.videoUrl) {
                    <button
                      class="action-icon video"
                      (click)="playVideo(exercise)"
                      pTooltip="شاهد الفيديو"
                      tooltipPosition="top"
                    >
                      <i class="pi pi-play"></i>
                    </button>
                  }
                  <button
                    class="action-icon edit"
                    (click)="editExercise(exercise)"
                    pTooltip="تعديل"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button
                    class="action-icon delete"
                    (click)="deleteExercise(exercise)"
                    pTooltip="حذف"
                    tooltipPosition="top"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6">
                <div class="empty-state">
                  <i class="pi pi-list"></i>
                  <h3>لا توجد تمارين</h3>
                  <p>ابدأ بإضافة تمارين جديدة</p>
                  <button class="btn btn-primary" (click)="openAddDialog()">
                    <i class="pi pi-plus"></i>
                    إضافة تمرين
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Add/Edit Dialog -->
      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingExercise ? 'تعديل التمرين' : 'إضافة تمرين جديد'"
        [modal]="true"
        [style]="{width: '750px', maxHeight: '90vh'}"
        [closable]="true"
        styleClass="exercise-dialog"
      >
        <p-tabView>
          <!-- Tab 1: Basic Info -->
          <p-tabPanel header="المعلومات الأساسية">
            <div class="dialog-content">
              <div class="form-row">
                <div class="form-group">
                  <label>اسم التمرين (بالإنجليزية) *</label>
                  <input type="text" pInputText [(ngModel)]="exerciseForm.name" placeholder="e.g., Bench Press" />
                </div>
                <div class="form-group">
                  <label>اسم التمرين (بالعربية)</label>
                  <input type="text" pInputText [(ngModel)]="exerciseForm.nameAr" placeholder="مثال: ضغط الصدر" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>العضلة المستهدفة *</label>
                  <p-dropdown
                    [options]="muscleOptions()"
                    [(ngModel)]="exerciseForm.targetMuscleId"
                    placeholder="اختر العضلة"
                    [style]="{width: '100%'}"
                    [filter]="true"
                    filterPlaceholder="بحث..."
                    optionLabel="label"
                    optionValue="value"
                  ></p-dropdown>
                </div>
                <div class="form-group">
                  <label>المعدات</label>
                  <p-dropdown
                    [options]="equipmentOptions"
                    [(ngModel)]="exerciseForm.equipment"
                    placeholder="اختر المعدات"
                    [style]="{width: '100%'}"
                    [editable]="true"
                  ></p-dropdown>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>المستوى</label>
                  <p-dropdown
                    [options]="difficultyOptions"
                    [(ngModel)]="exerciseForm.difficulty"
                    placeholder="اختر المستوى"
                    [style]="{width: '100%'}"
                  ></p-dropdown>
                </div>
                <div class="form-group">
                  <label>التصنيف</label>
                  <p-dropdown
                    [options]="categoryOptions"
                    [(ngModel)]="exerciseForm.category"
                    placeholder="اختر التصنيف"
                    [style]="{width: '100%'}"
                    [editable]="true"
                  ></p-dropdown>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>نمط الحركة</label>
                  <p-dropdown
                    [options]="movementPatternOptions"
                    [(ngModel)]="exerciseForm.movementPattern"
                    placeholder="اختر نمط الحركة"
                    [style]="{width: '100%'}"
                  ></p-dropdown>
                </div>
                <div class="form-group">
                  <label>الميكانيكا</label>
                  <p-dropdown
                    [options]="mechanicOptions"
                    [(ngModel)]="exerciseForm.mechanic"
                    placeholder="اختر نوع الميكانيكا"
                    [style]="{width: '100%'}"
                  ></p-dropdown>
                </div>
              </div>

              <div class="form-row three-cols">
                <div class="form-group">
                  <label>نطاق التكرارات</label>
                  <input type="text" pInputText [(ngModel)]="exerciseForm.repsRange" placeholder="8-12" />
                </div>
                <div class="form-group">
                  <label>نطاق المجموعات</label>
                  <input type="text" pInputText [(ngModel)]="exerciseForm.setsRange" placeholder="3-4" />
                </div>
                <div class="form-group">
                  <label>وقت الراحة (ثانية)</label>
                  <p-inputNumber [(ngModel)]="exerciseForm.restSeconds" [min]="0" [max]="300"></p-inputNumber>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>الإيقاع (Tempo)</label>
                  <input type="text" pInputText [(ngModel)]="exerciseForm.tempo" placeholder="2-1-2-0" />
                </div>
                <div class="form-group">
                  <label>الأيقونة (Emoji)</label>
                  <input type="text" pInputText [(ngModel)]="exerciseForm.icon" placeholder="💪" />
                </div>
              </div>

              <div class="form-group checkbox-group">
                <p-checkbox
                  [(ngModel)]="exerciseForm.isHighImpact"
                  [binary]="true"
                  inputId="highImpact"
                ></p-checkbox>
                <label for="highImpact">تمرين عالي الشدة (High Impact)</label>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab 2: Description & Instructions -->
          <p-tabPanel header="الوصف والتعليمات">
            <div class="dialog-content">
              <div class="form-row">
                <div class="form-group">
                  <label>الوصف (بالإنجليزية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.description" rows="3" placeholder="Exercise description..."></textarea>
                </div>
                <div class="form-group">
                  <label>الوصف (بالعربية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.descriptionAr" rows="3" placeholder="وصف التمرين..."></textarea>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>التعليمات (بالإنجليزية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.instructions" rows="4" placeholder="Step 1...&#10;Step 2...&#10;Step 3..."></textarea>
                  <small class="hint">اكتب كل خطوة في سطر منفصل</small>
                </div>
                <div class="form-group">
                  <label>التعليمات (بالعربية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.instructionsAr" rows="4" placeholder="الخطوة 1...&#10;الخطوة 2...&#10;الخطوة 3..."></textarea>
                  <small class="hint">اكتب كل خطوة في سطر منفصل</small>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>النصائح (بالإنجليزية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.tips" rows="3" placeholder="Tip 1...&#10;Tip 2..."></textarea>
                  <small class="hint">اكتب كل نصيحة في سطر منفصل</small>
                </div>
                <div class="form-group">
                  <label>النصائح (بالعربية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.tipsAr" rows="3" placeholder="نصيحة 1...&#10;نصيحة 2..."></textarea>
                  <small class="hint">اكتب كل نصيحة في سطر منفصل</small>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>الأخطاء الشائعة (بالإنجليزية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.commonMistakes" rows="3" placeholder="Mistake 1...&#10;Mistake 2..."></textarea>
                  <small class="hint">اكتب كل خطأ في سطر منفصل</small>
                </div>
                <div class="form-group">
                  <label>الأخطاء الشائعة (بالعربية)</label>
                  <textarea pInputTextarea [(ngModel)]="exerciseForm.commonMistakesAr" rows="3" placeholder="خطأ 1...&#10;خطأ 2..."></textarea>
                  <small class="hint">اكتب كل خطأ في سطر منفصل</small>
                </div>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab 3: Media -->
          <p-tabPanel header="الوسائط">
            <div class="dialog-content">
              <div class="form-group">
                <label>رابط الصورة</label>
                <input type="text" pInputText [(ngModel)]="exerciseForm.imageUrl" placeholder="https://..." />
              </div>

              <div class="form-group">
                <label>رابط الفيديو</label>
                <input type="text" pInputText [(ngModel)]="exerciseForm.videoUrl" placeholder="https://youtube.com/..." />
              </div>

              <div class="media-preview" *ngIf="exerciseForm.imageUrl">
                <label>معاينة الصورة</label>
                <img [src]="exerciseForm.imageUrl" alt="Exercise preview" class="preview-img" />
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>

        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="dialogVisible = false">إلغاء</button>
          <button class="btn btn-primary" (click)="saveExercise()">
            <i class="pi pi-save"></i>
            حفظ
          </button>
        </ng-template>
      </p-dialog>

      <!-- Exercise Detail Dialog -->
      <p-dialog
        [(visible)]="detailDialogVisible"
        [header]="selectedExercise()?.nameAr || selectedExercise()?.name || 'تفاصيل التمرين'"
        [modal]="true"
        [style]="{ width: '750px', maxWidth: '95vw' }"
        [maximizable]="true"
        styleClass="exercise-detail-dialog"
        [closable]="true">

        <div class="detail-content" *ngIf="selectedExercise() as ex">
          <!-- Header with icon and badges -->
          <div class="detail-header">
            <div class="detail-title-row">
              <span class="detail-icon" *ngIf="ex.icon">{{ ex.icon }}</span>
              <div>
                <h3 class="detail-name">{{ ex.nameAr || ex.name }}</h3>
                <span class="detail-name-en" *ngIf="ex.nameAr && ex.name">{{ ex.name }}</span>
              </div>
            </div>
            <div class="detail-badges">
              <p-tag *ngIf="ex.difficulty" [value]="getDifficultyLabel(ex.difficulty)" [severity]="getDifficultySeverity(ex.difficulty)"></p-tag>
              <span class="category-badge" *ngIf="ex.category">{{ ex.category }}</span>
              <span class="high-impact-tag" *ngIf="ex.isHighImpact"><i class="pi pi-bolt"></i> عالي الشدة</span>
            </div>
          </div>

          <!-- Image -->
          <div class="detail-image" *ngIf="ex.imageUrl">
            <img [src]="ex.imageUrl" [alt]="ex.name" />
          </div>

          <!-- Basic Info Grid -->
          <div class="detail-section">
            <h4 class="section-title"><i class="pi pi-info-circle"></i> المعلومات الأساسية</h4>
            <div class="info-grid">
              <div class="info-item" *ngIf="ex.targetMuscleName || ex.muscleGroupName">
                <span class="info-label">العضلة المستهدفة</span>
                <span class="info-value muscle-badge primary">{{ ex.targetMuscleName || ex.muscleGroupName }}</span>
              </div>
              <div class="info-item" *ngIf="ex.equipment || ex.equipmentType">
                <span class="info-label">المعدات</span>
                <span class="info-value">{{ ex.equipment || ex.equipmentType }}</span>
              </div>
              <div class="info-item" *ngIf="ex.mechanic">
                <span class="info-label">النوع</span>
                <span class="info-value">{{ ex.mechanic === 'Compound' ? 'مركب' : ex.mechanic === 'Isolation' ? 'عزل' : ex.mechanic }}</span>
              </div>
              <div class="info-item" *ngIf="ex.force">
                <span class="info-label">القوة</span>
                <span class="info-value">{{ ex.force === 'Push' ? 'دفع' : ex.force === 'Pull' ? 'سحب' : ex.force }}</span>
              </div>
              <div class="info-item" *ngIf="ex.movementPattern">
                <span class="info-label">نمط الحركة</span>
                <span class="info-value">{{ ex.movementPattern }}</span>
              </div>
              <div class="info-item" *ngIf="ex.repsRange">
                <span class="info-label">عدد التكرارات</span>
                <span class="info-value">{{ ex.repsRange }}</span>
              </div>
              <div class="info-item" *ngIf="ex.setsRange">
                <span class="info-label">عدد المجموعات</span>
                <span class="info-value">{{ ex.setsRange }}</span>
              </div>
              <div class="info-item" *ngIf="ex.restSeconds">
                <span class="info-label">وقت الراحة</span>
                <span class="info-value">{{ ex.restSeconds }} ثانية</span>
              </div>
              <div class="info-item" *ngIf="ex.tempo">
                <span class="info-label">الإيقاع</span>
                <span class="info-value">{{ ex.tempo }}</span>
              </div>
            </div>
          </div>

          <!-- Secondary Muscles -->
          <div class="detail-section" *ngIf="ex.secondaryMuscles?.length">
            <h4 class="section-title"><i class="pi pi-sitemap"></i> العضلات الثانوية</h4>
            <div class="secondary-muscles-list">
              <span class="muscle-badge secondary" *ngFor="let sm of ex.secondaryMuscles">
                {{ sm.muscleName }}
                <span class="contribution-percent" *ngIf="sm.contributionPercent">({{ sm.contributionPercent }}%)</span>
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="detail-section" *ngIf="ex.descriptionAr || ex.description">
            <h4 class="section-title"><i class="pi pi-align-right"></i> الوصف</h4>
            <p class="detail-text">{{ ex.descriptionAr || ex.description }}</p>
            <p class="detail-text-secondary" *ngIf="ex.descriptionAr && ex.description">{{ ex.description }}</p>
          </div>

          <!-- Instructions -->
          <div class="detail-section" *ngIf="ex.instructionsAr?.length || ex.instructions?.length">
            <h4 class="section-title"><i class="pi pi-list"></i> خطوات التنفيذ</h4>
            <ol class="detail-list" *ngIf="ex.instructionsAr?.length">
              <li *ngFor="let step of ex.instructionsAr">{{ step }}</li>
            </ol>
            <ol class="detail-list secondary-list" *ngIf="!ex.instructionsAr?.length && ex.instructions?.length">
              <li *ngFor="let step of ex.instructions">{{ step }}</li>
            </ol>
            <div class="en-version" *ngIf="ex.instructionsAr?.length && ex.instructions?.length">
              <span class="en-label">English:</span>
              <ol class="detail-list secondary-list">
                <li *ngFor="let step of ex.instructions">{{ step }}</li>
              </ol>
            </div>
          </div>

          <!-- Tips -->
          <div class="detail-section" *ngIf="ex.tipsAr?.length || ex.tips?.length">
            <h4 class="section-title"><i class="pi pi-lightbulb"></i> نصائح</h4>
            <ul class="detail-list tips-list" *ngIf="ex.tipsAr?.length">
              <li *ngFor="let tip of ex.tipsAr">{{ tip }}</li>
            </ul>
            <ul class="detail-list tips-list secondary-list" *ngIf="!ex.tipsAr?.length && ex.tips?.length">
              <li *ngFor="let tip of ex.tips">{{ tip }}</li>
            </ul>
            <div class="en-version" *ngIf="ex.tipsAr?.length && ex.tips?.length">
              <span class="en-label">English:</span>
              <ul class="detail-list tips-list secondary-list">
                <li *ngFor="let tip of ex.tips">{{ tip }}</li>
              </ul>
            </div>
          </div>

          <!-- Common Mistakes -->
          <div class="detail-section" *ngIf="ex.commonMistakesAr?.length || ex.commonMistakes?.length">
            <h4 class="section-title"><i class="pi pi-exclamation-triangle"></i> أخطاء شائعة</h4>
            <ul class="detail-list mistakes-list" *ngIf="ex.commonMistakesAr?.length">
              <li *ngFor="let mistake of ex.commonMistakesAr">{{ mistake }}</li>
            </ul>
            <ul class="detail-list mistakes-list secondary-list" *ngIf="!ex.commonMistakesAr?.length && ex.commonMistakes?.length">
              <li *ngFor="let mistake of ex.commonMistakes">{{ mistake }}</li>
            </ul>
            <div class="en-version" *ngIf="ex.commonMistakesAr?.length && ex.commonMistakes?.length">
              <span class="en-label">English:</span>
              <ul class="detail-list mistakes-list secondary-list">
                <li *ngFor="let mistake of ex.commonMistakes">{{ mistake }}</li>
              </ul>
            </div>
          </div>

          <!-- Video -->
          <div class="detail-section" *ngIf="ex.videoUrl">
            <h4 class="section-title"><i class="pi pi-video"></i> فيديو التمرين</h4>
            <a [href]="ex.videoUrl" target="_blank" class="video-link">
              <i class="pi pi-external-link"></i>
              مشاهدة الفيديو
            </a>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button class="btn btn-outline" (click)="detailDialogVisible = false">إغلاق</button>
          <button class="btn btn-primary" (click)="detailDialogVisible = false; editExercise(selectedExercise()!)">
            <i class="pi pi-pencil"></i>
            تعديل
          </button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .exercises-page {
      max-width: 1600px;
    }

    /* Stats Row - Unified Design */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--shadow-color);
      }
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .stat-card.purple .stat-icon {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.15));
      color: #8b5cf6;
    }

    .stat-card.blue .stat-icon {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15));
      color: #3b82f6;
    }

    .stat-card.green .stat-icon {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15));
      color: #22c55e;
    }

    .stat-card.orange .stat-icon {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15));
      color: #f59e0b;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Table Container - Unified Design */
    .table-container {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }

    .table-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);

      i {
        color: #8b5cf6;
        font-size: 1.25rem;
      }

      .count-badge {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
      }
    }

    .table-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .search-box {
      input {
        border-radius: 10px;
        background: var(--bg-primary);
        border-color: var(--border-color);

        &:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
        }
      }
    }

    /* Table Cells */
    .exercise-cell {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .exercise-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        color: white;
        font-size: 1.1rem;
      }
    }

    .exercise-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .exercise-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .exercise-name-en {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .exercise-img {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
    }

    .contribution-percent {
      font-size: 0.7rem;
      color: var(--text-secondary);
      margin-right: 0.25rem;
    }

    .tags-cell {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      align-items: flex-start;
    }

    .category-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      background: var(--primary-light);
      color: var(--primary-color);
      border-radius: 4px;
    }

    .high-impact-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.15rem 0.5rem;
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      color: white;
      border-radius: 6px;
      font-size: 0.65rem;
      font-weight: 500;
      width: fit-content;

      i {
        font-size: 0.55rem;
      }
    }

    .muscle-cell {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .muscle-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.35rem 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      width: fit-content;

      &.primary {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
      }

      &.secondary {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
      }
    }

    .secondary-muscles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .equipment-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border-radius: 8px;
      font-size: 0.85rem;
    }

    .description-text {
      color: var(--text-secondary);
      font-size: 0.85rem;
      cursor: help;
    }

    .no-desc {
      color: var(--text-muted);
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .action-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);

      &:hover {
        transform: scale(1.08);
      }

      &.view:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        color: #3b82f6;
      }

      &.video:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: #8b5cf6;
        color: #8b5cf6;
      }

      &.edit:hover {
        background: rgba(245, 158, 11, 0.1);
        border-color: #f59e0b;
        color: #f59e0b;
      }

      &.delete:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
        color: #8b5cf6;
      }

      h3 {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
        font-size: 1.25rem;
      }

      p {
        margin-bottom: 1.5rem;
      }
    }

    /* Dialog */
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      &.three-cols {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 500;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      input, textarea {
        width: 100%;
      }

      .hint {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      &.checkbox-group {
        flex-direction: row;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: 8px;
        margin-top: 0.5rem;

        label {
          margin: 0;
          cursor: pointer;
        }
      }
    }

    .media-preview {
      margin-top: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .preview-img {
        max-width: 200px;
        max-height: 200px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        object-fit: cover;
      }
    }

    :host ::ng-deep {
      .exercise-dialog {
        .p-dialog-content {
          padding: 0 1.5rem 1rem;
        }

        .p-tabview-panels {
          padding: 1rem 0;
        }

        .p-tabview-nav-link {
          font-size: 0.9rem;
        }
      }

      .p-inputtextarea {
        resize: vertical;
      }
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &.btn-primary {
        background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        color: white;

        &:hover {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
      }

      &.btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);

        &:hover {
          border-color: #8b5cf6;
          color: #8b5cf6;
        }
      }
    }

    /* PrimeNG Table Overrides */
    :host ::ng-deep {
      .p-datatable {
        .p-datatable-header {
          background: transparent;
          border: none;
          padding: 0;
        }

        .p-datatable-thead > tr > th {
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          padding: 1rem;
          border-color: var(--border-color);
        }

        .p-datatable-tbody > tr > td {
          padding: 1rem;
          border-color: var(--border-color);
          vertical-align: middle;
        }

        .p-datatable-tbody > tr:hover {
          background: var(--bg-secondary) !important;
        }

        .p-paginator {
          background: var(--bg-secondary);
          border: none;
          border-top: 1px solid var(--border-color);
          padding: 1rem;
        }
      }

      .p-dropdown {
        background: var(--bg-primary);
        border-color: var(--border-color);
        border-radius: 10px;

        &:not(.p-disabled):hover {
          border-color: #8b5cf6;
        }

        &:not(.p-disabled).p-focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
        }
      }

      .p-tag {
        font-size: 0.8rem;
        padding: 0.35rem 0.75rem;
      }

      .p-sortable-column:not(.p-highlight):hover {
        background: var(--bg-secondary);
      }

      .p-sortable-column.p-highlight {
        background: var(--bg-secondary);
        color: #8b5cf6;
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .table-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .table-actions {
        flex-direction: column;

        .search-box {
          width: 100%;

          input {
            width: 100%;
          }
        }
      }

      .info-grid {
        grid-template-columns: 1fr !important;
      }
    }

    /* Exercise Detail Dialog */
    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .detail-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .detail-icon {
      font-size: 2rem;
    }

    .detail-name {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .detail-name-en {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .detail-badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .detail-image {
      img {
        max-width: 100%;
        max-height: 300px;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        object-fit: cover;
      }
    }

    .detail-section {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);

      i {
        color: #8b5cf6;
        font-size: 1.1rem;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.65rem 0.85rem;
      background: var(--bg-secondary);
      border-radius: 10px;
    }

    .info-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .info-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .secondary-muscles-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .detail-text {
      margin: 0;
      font-size: 0.95rem;
      color: var(--text-primary);
      line-height: 1.7;
    }

    .detail-text-secondary {
      margin: 0.5rem 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
      direction: ltr;
      text-align: left;
    }

    .detail-list {
      margin: 0;
      padding-right: 1.25rem;
      padding-left: 0;

      li {
        padding: 0.35rem 0;
        font-size: 0.95rem;
        color: var(--text-primary);
        line-height: 1.6;
      }
    }

    .tips-list li::marker {
      color: #22c55e;
    }

    .mistakes-list li::marker {
      color: #ef4444;
    }

    .secondary-list {
      li {
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
    }

    .en-version {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--border-color);
    }

    .en-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
      display: block;
      margin-bottom: 0.25rem;
      direction: ltr;
      text-align: left;
    }

    .video-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.25rem;
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }
    }

    :host ::ng-deep .exercise-detail-dialog {
      .p-dialog-content {
        padding: 1rem 1.5rem;
      }
    }
  `]
})
export class ExercisesLibraryComponent implements OnInit {
  private coachService = inject(CoachService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  exercises = signal<Exercise[]>([]);
  filteredExercises = signal<Exercise[]>([]);
  muscles = signal<Muscle[]>([]);

  // Computed stats
  beginnerCount = computed(() => this.exercises().filter(e => e.difficulty === 'Beginner').length);
  intermediateCount = computed(() => this.exercises().filter(e => e.difficulty === 'Intermediate').length);
  advancedCount = computed(() => this.exercises().filter(e => e.difficulty === 'Advanced').length);

  // Muscle options for dropdown
  muscleOptions = computed(() =>
    this.muscles().map(m => ({
      label: m.nameAr || m.name,
      value: m.id
    }))
  );

  searchTerm = '';
  selectedMuscleGroup: string | null = null;

  dialogVisible = false;
  detailDialogVisible = false;
  selectedExercise = signal<Exercise | null>(null);
  editingExercise: Exercise | null = null;
  exerciseForm: {
    name: string;
    nameAr: string;
    targetMuscleId: number | null;
    equipment: string;
    difficulty: string;
    category: string;
    movementPattern: string;
    mechanic: string;
    description: string;
    descriptionAr: string;
    instructions: string;
    instructionsAr: string;
    tips: string;
    tipsAr: string;
    commonMistakes: string;
    commonMistakesAr: string;
    repsRange: string;
    setsRange: string;
    restSeconds: number | null;
    tempo: string;
    icon: string;
    imageUrl: string;
    videoUrl: string;
    isHighImpact: boolean;
  } = this.getEmptyForm();

  // Dropdown options
  equipmentOptions = [
    { label: 'Barbell', value: 'Barbell' },
    { label: 'Dumbbell', value: 'Dumbbell' },
    { label: 'Machine', value: 'Machine' },
    { label: 'Cable', value: 'Cable' },
    { label: 'Bodyweight', value: 'Bodyweight' },
    { label: 'Kettlebell', value: 'Kettlebell' },
    { label: 'Resistance Band', value: 'Resistance Band' },
    { label: 'EZ Bar', value: 'EZ Bar' },
    { label: 'Smith Machine', value: 'Smith Machine' },
    { label: 'Other', value: 'Other' }
  ];

  difficultyOptions = [
    { label: 'مبتدئ (Beginner)', value: 'Beginner' },
    { label: 'متوسط (Intermediate)', value: 'Intermediate' },
    { label: 'متقدم (Advanced)', value: 'Advanced' }
  ];

  categoryOptions = [
    { label: 'قوة (Strength)', value: 'Strength' },
    { label: 'كارديو (Cardio)', value: 'Cardio' },
    { label: 'مرونة (Flexibility)', value: 'Flexibility' },
    { label: 'بلايومتريك (Plyometric)', value: 'Plyometric' },
    { label: 'توازن (Balance)', value: 'Balance' }
  ];

  movementPatternOptions = [
    { label: 'دفع (Push)', value: 'Push' },
    { label: 'سحب (Pull)', value: 'Pull' },
    { label: 'أرجل (Legs)', value: 'Legs' },
    { label: 'جذع (Core)', value: 'Core' },
    { label: 'كامل الجسم (Full Body)', value: 'Full Body' }
  ];

  mechanicOptions = [
    { label: 'مركب (Compound)', value: 'Compound' },
    { label: 'عزل (Isolation)', value: 'Isolation' }
  ];

  // Keep legacy muscle group options for backward compatibility
  muscleGroupOptions = [
    { label: 'صدر', value: 'chest' },
    { label: 'ظهر', value: 'back' },
    { label: 'أكتاف', value: 'shoulders' },
    { label: 'ذراعين', value: 'arms' },
    { label: 'أرجل', value: 'legs' },
    { label: 'بطن', value: 'abs' }
  ];

  getEmptyForm() {
    return {
      name: '',
      nameAr: '',
      targetMuscleId: null as number | null,
      equipment: '',
      difficulty: '',
      category: '',
      movementPattern: '',
      mechanic: '',
      description: '',
      descriptionAr: '',
      instructions: '',
      instructionsAr: '',
      tips: '',
      tipsAr: '',
      commonMistakes: '',
      commonMistakesAr: '',
      repsRange: '',
      setsRange: '',
      restSeconds: null as number | null,
      tempo: '',
      icon: '',
      imageUrl: '',
      videoUrl: '',
      isHighImpact: false
    };
  }

  ngOnInit(): void {
    this.loadExercises();
    this.loadMuscles();
  }

  loadMuscles(): void {
    this.coachService.getMuscles().subscribe({
      next: (data) => {
        this.muscles.set(data);
      },
      error: (err) => {
        console.error('Error loading muscles:', err);
      }
    });
  }

  loadExercises(): void {
    this.loading.set(true);

    this.coachService.getExercises().subscribe({
      next: (data) => {
        this.exercises.set(data);
        this.filteredExercises.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading exercises:', err);
        this.notificationService.error('حدث خطأ في تحميل البيانات');
        this.exercises.set([]);
        this.filteredExercises.set([]);
        this.loading.set(false);
      }
    });
  }

  filterExercises(): void {
    let result = this.exercises();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.nameAr?.toLowerCase().includes(term) ||
        (e.targetMuscleName || e.muscleGroupName)?.toLowerCase().includes(term)
      );
    }

    if (this.selectedMuscleGroup) {
      result = result.filter(e =>
        e.targetMuscleId?.toString() === this.selectedMuscleGroup ||
        e.muscleGroupId === this.selectedMuscleGroup
      );
    }

    this.filteredExercises.set(result);
  }

  openAddDialog(): void {
    this.editingExercise = null;
    this.exerciseForm = this.getEmptyForm();
    this.dialogVisible = true;
  }

  viewExercise(exercise: Exercise): void {
    this.selectedExercise.set(exercise);
    this.detailDialogVisible = true;
  }

  editExercise(exercise: Exercise): void {
    this.editingExercise = exercise;
    this.exerciseForm = {
      name: exercise.name || '',
      nameAr: exercise.nameAr || '',
      targetMuscleId: exercise.targetMuscleId || null,
      equipment: exercise.equipment || exercise.equipmentType || '',
      difficulty: exercise.difficulty || '',
      category: exercise.category || '',
      movementPattern: exercise.movementPattern || '',
      mechanic: exercise.mechanic || '',
      description: exercise.description || '',
      descriptionAr: exercise.descriptionAr || '',
      instructions: Array.isArray(exercise.instructions) ? exercise.instructions.join('\n') : (exercise.instructions || ''),
      instructionsAr: Array.isArray(exercise.instructionsAr) ? exercise.instructionsAr.join('\n') : '',
      tips: Array.isArray(exercise.tips) ? exercise.tips.join('\n') : '',
      tipsAr: Array.isArray(exercise.tipsAr) ? exercise.tipsAr.join('\n') : '',
      commonMistakes: Array.isArray(exercise.commonMistakes) ? exercise.commonMistakes.join('\n') : '',
      commonMistakesAr: Array.isArray(exercise.commonMistakesAr) ? exercise.commonMistakesAr.join('\n') : '',
      repsRange: exercise.repsRange || '',
      setsRange: exercise.setsRange || '',
      restSeconds: exercise.restSeconds || null,
      tempo: exercise.tempo || '',
      icon: exercise.icon || '',
      imageUrl: exercise.imageUrl || '',
      videoUrl: exercise.videoUrl || '',
      isHighImpact: exercise.isHighImpact || false
    };
    this.dialogVisible = true;
  }

  deleteExercise(exercise: Exercise): void {
    Swal.fire({
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف "${exercise.name}"؟`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.coachService.deleteExercise(exercise.id).subscribe({
          next: () => {
            this.exercises.update(exercises => exercises.filter(e => e.id !== exercise.id));
            this.filterExercises();
            this.notificationService.success('تم حذف التمرين بنجاح');
          },
          error: (err) => {
            console.error('Error deleting exercise:', err);
            this.notificationService.error('حدث خطأ أثناء حذف التمرين');
          }
        });
      }
    });
  }

  saveExercise(): void {
    if (!this.exerciseForm.name || !this.exerciseForm.targetMuscleId) {
      this.notificationService.warn('يرجى إدخال اسم التمرين والعضلة المستهدفة');
      return;
    }

    // Helper to convert text to array (split by newlines)
    const textToArray = (text: string): string[] => {
      if (!text) return [];
      return text.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    };

    // Build exercise data matching API expectations
    const exerciseData: Partial<Exercise> = {
      name: this.exerciseForm.name,
      nameAr: this.exerciseForm.nameAr || undefined,
      targetMuscleId: this.exerciseForm.targetMuscleId,
      equipment: this.exerciseForm.equipment || undefined,
      difficulty: this.exerciseForm.difficulty || undefined,
      category: this.exerciseForm.category || undefined,
      movementPattern: this.exerciseForm.movementPattern || undefined,
      mechanic: this.exerciseForm.mechanic || undefined,
      description: this.exerciseForm.description || undefined,
      descriptionAr: this.exerciseForm.descriptionAr || undefined,
      instructions: textToArray(this.exerciseForm.instructions),
      instructionsAr: textToArray(this.exerciseForm.instructionsAr),
      tips: textToArray(this.exerciseForm.tips),
      tipsAr: textToArray(this.exerciseForm.tipsAr),
      commonMistakes: textToArray(this.exerciseForm.commonMistakes),
      commonMistakesAr: textToArray(this.exerciseForm.commonMistakesAr),
      repsRange: this.exerciseForm.repsRange || undefined,
      setsRange: this.exerciseForm.setsRange || undefined,
      restSeconds: this.exerciseForm.restSeconds || undefined,
      tempo: this.exerciseForm.tempo || undefined,
      icon: this.exerciseForm.icon || undefined,
      imageUrl: this.exerciseForm.imageUrl || undefined,
      videoUrl: this.exerciseForm.videoUrl || undefined,
      isHighImpact: this.exerciseForm.isHighImpact
    };

    // Get muscle name for display
    const selectedMuscle = this.muscles().find(m => m.id === this.exerciseForm.targetMuscleId);
    const muscleName = selectedMuscle?.nameAr || selectedMuscle?.name || '';

    if (this.editingExercise) {
      // Update existing exercise
      this.coachService.updateExercise(this.editingExercise.id, exerciseData).subscribe({
        next: () => {
          this.exercises.update(exercises =>
            exercises.map(e => e.id === this.editingExercise!.id ? {
              ...e,
              ...exerciseData,
              targetMuscleName: muscleName
            } : e)
          );
          this.filterExercises();
          this.dialogVisible = false;
          this.notificationService.success('تم تحديث التمرين بنجاح');
        },
        error: (err) => {
          console.error('Error updating exercise:', err);
          this.notificationService.error('حدث خطأ أثناء تحديث التمرين');
        }
      });
    } else {
      // Create new exercise
      this.coachService.createExercise(exerciseData).subscribe({
        next: (response: any) => {
          const newId = typeof response === 'number' ? response : response?.id || Date.now();
          const newExercise: Exercise = {
            id: newId,
            ...exerciseData,
            targetMuscleName: muscleName,
            isGlobal: false
          } as Exercise;
          this.exercises.update(exercises => [...exercises, newExercise]);
          this.filterExercises();
          this.dialogVisible = false;
          this.notificationService.success('تم إضافة التمرين بنجاح');
        },
        error: (err) => {
          console.error('Error creating exercise:', err);
          this.notificationService.error('حدث خطأ أثناء إضافة التمرين');
        }
      });
    }
  }

  getMuscleIdFromGroup(muscleGroupId: string): number {
    const muscleMap: Record<string, number> = {
      'chest': 1,
      'back': 2,
      'shoulders': 3,
      'arms': 4,
      'legs': 7,
      'abs': 11
    };
    return muscleMap[muscleGroupId] || 1;
  }

  getMuscleGroupName(muscleGroupId: string): string {
    const nameMap: Record<string, string> = {
      'chest': 'صدر',
      'back': 'ظهر',
      'shoulders': 'أكتاف',
      'arms': 'ذراعين',
      'legs': 'أرجل',
      'abs': 'بطن'
    };
    return nameMap[muscleGroupId] || '';
  }

  playVideo(exercise: Exercise): void {
    if (exercise.videoUrl) {
      window.open(exercise.videoUrl, '_blank');
    }
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      'Beginner': 'مبتدئ',
      'Intermediate': 'متوسط',
      'Advanced': 'متقدم'
    };
    return labels[difficulty] || difficulty;
  }

  getDifficultySeverity(difficulty: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<string, 'success' | 'info' | 'warning'> = {
      'Beginner': 'success',
      'Intermediate': 'info',
      'Advanced': 'warning'
    };
    return severities[difficulty] || 'info';
  }
}
