# LogicFit — Project Reference (مرجع المشروع)

> مرجع تقني شامل لمشروع LogicFit. آخر تحديث بناءً على commit `b14aac3` (25 module / 150+ endpoint).
> **الغرض:** خريطة ذهنية سريعة قبل أي تعديل — الأدوار، المسارات، الخدمات، الـ endpoints، الـ enums، والاصطلاحات.

---

## 1. نظرة عامة

**LogicFit** = نظام SaaS متعدد المستأجرين (multi-tenant) لإدارة الصالات الرياضية.
- كل صالة = **tenant** منفصل. كل استدعاء API مرتبط ضمنياً بـ `tenantId` (من التوكن).
- **3 أدوار:** `Owner` / `Coach` / `Client`.
- ثنائي اللغة: **EN (LTR) + AR (RTL)**، مع وضعي Dark/Light.
- Backend حقيقي (لا mock data): `https://logicfit-platform.runasp.net/api`.

### Stack
| الطبقة | التقنية |
|--------|---------|
| Framework | Angular 18.2 — standalone components، Signals، لا NgRx |
| UI | PrimeNG 17 + Tailwind 3.4 + SCSS + PrimeIcons |
| الحالة | Angular Signals فقط (`AuthService`, `ThemeState`) |
| i18n | @ngx-translate — `assets/i18n/{en,ar}.json` (266 سطر لكل) + RTL |
| HTTP | HttpClient + `jwtInterceptor` + `errorInterceptor` |
| الرسوم | @swimlane/ngx-charts |
| التصدير | jsPDF + jspdf-autotable + docx + file-saver (عبر `ExportService`) |
| التنبيهات | SweetAlert2 + PrimeNG MessageService |
| النشر | Vercel → `dist/logicfit-app/browser` |

### ملاحظات معمارية مهمة
- **معظم المكونات inline templates** — لذلك ملف `.html` و`.scss` منفصل واحد فقط بالمشروع كله.
- `environment.ts` و`environment.prod.ts` **متطابقان** (نفس رابط الـ API في dev/prod).
- `styles.scss` ضخم (~3790 سطر) = globals. التنسيق موزّع: Tailwind (تخطيط) + SCSS (عام) + PrimeNG (مكونات) + `dark` class على `<html>`.
- أضخم ملفين: `diet-plan-builder.component.ts` (~4364 سطر)، `program-builder.component.ts` (~3977 سطر) — انتبه عند التعديل.

---

## 2. المصادقة والصلاحيات

**الأدوار (قيم الـ backend):** `Owner = 1`, `Coach = 2`, `Client = 3`.
- ⚠️ الـ backend يرجّع الدور كـ**نص** ("Owner") في login response، لكن يستقبله كـ**رقم** في register. `auth.service.ts` يعالج الحالتين (`mapRoleToEnum`).

**التدفّق:**
- JWT محفوظ في `localStorage` (مفتاح `logicfit_token`)، بيانات المستخدم في `logicfit_user`.
- فكّ التوكن يدوياً (`atob` على الـ payload) للتحقق من `exp`. عند الانتهاء → `logout()` → توجيه لـ `/auth/login`.
- **تسجيل صالة جديدة** (`registerGym`): خطوتان متسلسلتان — (1) POST `/tenants` لإنشاء الـ tenant (subdomain يُولّد آلياً من اسم الصالة + timestamp)، (2) `register` للـ owner بـ `role=1`.

**الحرّاس (`core/auth/guards`):** `authGuard`, `guestGuard`, `ownerGuard`, `coachGuard`, `clientGuard`.

**الـ Interceptors (`core/auth/interceptors`):**
- `jwtInterceptor`: يضيف `Authorization: Bearer` لكل الطلبات **ماعدا** مسارات `/auth/`.
- `errorInterceptor`: يترجم أخطاء HTTP للعربية. `401` → `logout()`. `403` → توجيه حسب الدور. يرفق `translatedMessage` بكل خطأ.

**التوجيه بعد الدخول:** `getRedirectUrl()` → `/owner/dashboard` أو `/coach/dashboard` أو `/client/dashboard`.

---

## 3. بنية المجلدات (`src/app`)

```
core/
  auth/         services (auth.service), guards, interceptors, models (auth.models)
  layout/       main-layout, auth-layout, components/{header, sidebar}
  services/     export, chat, notification, notifications-api, challenges,
                muscle-distribution, storage
features/
  auth/         login, register, register-gym, forgot-password, reset-password
  owner/        (35+ module — القسم 5)
  coach/        dashboard, trainees(+details), workout-programs(list+builder),
                diet-plans(list+builder), exercises, foods, muscles, measurements,
                appointments, chat, challenges, profile
  client/       dashboard, workout(my-program+session), diet(my-diet+meal-log),
                measurements, progress, subscriptions, chat, challenges, profile
shared/
  components/   page-header, stat-card, chart-card, wizard-stepper,
                live-summary-sidebar, export-menu, loading-skeleton,
                confirm-dialog, empty-state
  models/       api.models.ts (497L), gym-management.models.ts (1153L)
state/          theme.state.ts
```

**التوجيه:** جذر `app.routes.ts` يوزّع على `auth` / `owner` / `coach` / `client`، كل قسم `loadChildren` من ملف routes خاص به. الافتراضي `''` → `auth/login`، و`**` → `auth/login`.

---

## 4. الخدمات (Services) و الـ APIs

### خدمات Owner (`features/owner/services`) — مقسّمة حسب النطاق
| الخدمة | أسطر | يغطّي |
|--------|------|-------|
| `owner.service.ts` | 548 | عملاء، مدربين، خطط/اشتراكات، gym profile، تقارير |
| `finance.service.ts` | 138 | فئات مصروفات، مصروفات، فواتير، مدفوعات، كوبونات، ضرائب |
| `hr.service.ts` | 137 | موظفين، ورديات، إجازات، عمولات، رواتب |
| `inventory.service.ts` | 119 | فئات منتجات، منتجات، مخزون، موردين، مبيعات POS |
| `facilities.service.ts` | 75 | فروع، قاعات، أجهزة، صيانة |
| `classes.service.ts` | 71 | حصص جماعية، جدولة، حجوزات |
| `attendance.service.ts` | 88 | check-in/out، ملخّص الحضور |
| `access-control.service.ts` | 53 | بطاقات عضوية، بوابة (gate access) |
| `branches.service.ts` | 40 | الفروع |
| `operations-reports.service.ts` | 80 | تقارير تشغيلية |
| `reports.service.ts` | 75 | تقارير عامة (مالية/عملاء/اشتراكات) |

### خدمات أخرى
- `coach.service.ts` (948L) — كل نطاق المدرب. `appointments.service.ts` (74L).
- `client.service.ts` (596L) — كل نطاق العميل.
- **Core:** `export.service.ts` (999L)، `muscle-distribution.service.ts` (344L)، `challenges.service.ts` (146L)، `notifications-api.service.ts` (95L)، `chat.service.ts` (71L)، `notification.service.ts` (69L)، `storage.service.ts` (66L).

### الـ API Endpoints (المستخدمة فعلياً)
> القاعدة: `https://logicfit-platform.runasp.net/api`. الـ `{id}` بين المسارات.

**Auth & Tenant:** `POST /auth/login` · `/auth/register` · `/auth/forget-password` · `/auth/reset-password` · `GET|POST /tenants`

**Owner — الأعضاء:** `clients` (+`/{id}`, `/{id}/status`) · `coaches` (+`/{id}`, `/{id}/stats`, `/{id}/status`) · `coach-clients` (+`/assign`) · `MembershipCards` (+`/issue`, `/{id}/revoke`) · `GateAccess/check-in-qr` · `GateAccess/logs`

**Owner — الاشتراكات:** `subscriptions` (+`/{id}/cancel|freeze|renew|payment`, `/expiring`, `/freezes/{id}/end`) · `subscriptions/plans` · `attendance` (+`/check-in`, `/{id}/check-out`, `/summary`)

**Owner — المنشآت:** `Branches` · `Rooms` · `Equipment` (+`/{id}/status`) · `Maintenance` (+`/{id}/resolve`)

**Owner — الحصص:** `GroupClasses` · `ClassSchedules` (+`/{id}/book|cancel|enrollments`, `/enrollments/{id}/attended|cancel`)

**Owner — المالية:** `Invoices` (+`/{id}/issue|cancel`) · `Payments` · `Expenses` · `ExpenseCategories` · `Coupons` (+`/validate`) · `TaxSettings`

**Owner — المخزون/POS:** `Products` · `ProductCategories` · `Stock` (+`/adjust|transfer|movements`) · `Suppliers` · `Sales` (+`/checkout`) · `pos-sales`

**Owner — الموارد البشرية:** `Employees` (+`/{id}/terminate`) · `Shifts` (+`/assign`, `/assignments`) · `Leaves` (+`/{id}/review`) · `Commissions` (+`/rules`) · `Payroll` (+`/generate`, `/{id}/approve|pay`, `/items/{id}`)

**التقارير:** `reports/dashboard|financial|clients|subscriptions` · `reports/coach/dashboard|trainees|trainee/{id}` · `operations-dashboard` · `branch-comparison` · `class-attendance` · `equipment-utilization` · `payroll-summary` · `stock-valuation`

**Coach:** `coach/dashboard|trainees|trainee/{id}` · `workoutprograms` (+`/{id}/duplicate|routines`, `/routines/{id}/exercises`) · `dietplans` (+`/{id}/duplicate|meals`, `/meals/{id}/items`) · `exercises` · `foods` · `muscles` · `bodymeasurements` · `appointments` (+`/{id}/status`) · `challenges` (+`/{id}/join|progress`, `/my`) · `gymprofile` (+`/logo|cover|gallery`)

**Client:** `client/dashboard|my-coach|my-programs|my-diet-plans|my-measurements|my-subscriptions|my-appointments` · `workoutsessions` (+`/start`, `/{id}/end|sets`) · `meallog?clientId=` · `profile` (+`/picture`)

**مشترك:** `notifications` (+`/{id}/read`, `/read-all`, `/unread-count`, `/bulk`) · `chat/conversations` (+`/{id}/messages|read`) · `chat/messages`

---

## 5. وحدات Owner (35+ module) — التجميع في الـ Sidebar

| المجموعة | الوحدات (route تحت `/owner`) |
|----------|------------------------------|
| **رئيسي** | dashboard, operations |
| **الأعضاء** | clients, coaches, membership-cards, gate-access |
| **الاشتراكات** | subscription-plans, subscriptions, attendance |
| **المنشآت** | branches, rooms, equipment, maintenance |
| **الحصص** | group-classes, class-schedules |
| **المالية** | invoices, payments, expenses, expense-categories, coupons, tax-settings |
| **المخزون/POS** | pos-sales, products, product-categories, stock, suppliers |
| **الموارد البشرية** | employees, shifts, leaves, commissions, payroll |
| **التقارير** | reports, operations-reports |
| **الإعدادات** | gym-settings |

**Coach routes** (تحت `/coach`): dashboard, trainees, trainees/:id, workout-programs(+/create, +/:id/edit), diet-plans(+/create, +/:id/edit), exercises, foods, muscles, measurements, appointments, chat, challenges, profile.

**Client routes** (تحت `/client`): dashboard, my-program, workout-session, my-diet, meal-log, my-measurements, my-progress, my-subscriptions, chat, challenges, profile.

---

## 6. نماذج البيانات (Models)

مقسّمة على ملفين:
- **`api.models.ts`** (497L) — النطاق الأساسي: `WorkoutProgram → ProgramRoutine[] → RoutineExercise[]`، `Exercise` (+ `secondaryMuscles`)، `Muscle`/`MuscleWorkload`/`WorkoutAnalysis`، `DietPlan → DailyMeal[] → MealItem[]`، `Food`، `BodyMeasurement`، `WorkoutSession → SessionSet[]`، `Client`/`Coach`/`CoachClient`، `SubscriptionPlan`/`ClientSubscription`/`SubscriptionFreeze`، `GymProfile`، وتقارير (Dashboard/Financial/Clients/Subscriptions/Coach/Trainee).
- **`gym-management.models.ts`** (1153L) — منظومة الصالة: Branch، MembershipCard/GateAccess، Room/Equipment/Maintenance، Invoice/Payment/Expense/Coupon/Tax، GroupClass/ClassSchedule/Enrollment، Product/Stock/Supplier/Sale، Employee/Shift/Leave/Commission/Payroll، وتقارير تشغيلية.

### الـ Enums المرجعية
```
// api.models.ts
SubscriptionStatus  { Active=0, Expired=1, Frozen=2, Cancelled=3 }
DietPlanStatus      { Draft=0, Active=1, Archived=2 }

// gym-management.models.ts
PaymentMethodEnum   { Cash=1, Card=2, Bank=3, Wallet=4 }
InvoiceStatus       { Draft=1, Issued=2, PartiallyPaid=3, Paid=4, Overdue=5, Cancelled=6 }
InvoiceItemType     { Subscription=1, Product=2, Class=3, PersonalTraining=4, Manual=5, Other=99 }
DiscountType        { Percentage=1, Fixed=2 }
CouponApplicability { All=1, Subscriptions=2, Products=3, Classes=4, PersonalTraining=5 }
RoomType            { Cardio=1, Weights=2, FreeWeights=3, Studio=4, Cycling=5, Crossfit=6,
                      Pool=7, Boxing=8, Stretching=9, LockerRoom=10, Reception=11, Other=99 }
EquipmentStatus     { Active=1, UnderMaintenance=2, OutOfService=3, Retired=4 }
MaintenanceStatus   { Pending=1, InProgress=2, Completed=3, Cancelled=4 }
GateAccessResult    { Granted=1, Denied=2 }
GateAccessMethod    { Manual=1, Qr=2, Card=3, Face=4, Fingerprint=5 }
GateDenyReason      { None=0, NoActiveSubscription=1, SessionsPerWeekExceeded=2,
                      BranchCapacityFull=3, OutsideOperatingHours=4, SubscriptionFrozen=5, ... }
RecurrencePattern   { None=0, Daily=1, Weekly=2, Monthly=3 }
ClassEnrollmentStatus { Booked=1, Attended=2, Cancelled=3, NoShow=4, Waitlist=5 }
StockMovementType   { In=1, Out=2, Adjustment=3, Transfer=4 }
EmployeeRole        { Owner=1, Coach=2, Client=3, Manager=4, Receptionist=5, Accountant=6, Trainer=7 }
SalaryType          { Monthly=1, Hourly=2, Daily=3 }
LeaveType           { Annual=1, Sick=2, Unpaid=3, Maternity=4, Emergency=5, Other=99 }
LeaveStatus         { Pending=1, Approved=2, Rejected=3, Cancelled=4 }
CommissionSourceType{ SubscriptionSale=1, ProductSale=2, PersonalTraining=3, Manual=99 }
CommissionStatus    { Pending=1, Approved=2, Paid=3, Cancelled=4 }
CommissionRuleType  { Percentage=1, Fixed=2 }
PayrollStatus       { Draft=1, Approved=2, Paid=3, Cancelled=4 }
```
> **ملاحظة تعارض:** `SubscriptionStatus` يبدأ من 0، بينما أغلب enums منظومة الصالة تبدأ من 1. انتبه عند المقارنة.

---

## 7. الحالة والثيم (`state/theme.state.ts`)

Signals: `darkMode`, `language` (`ar`/`en`), `sidebarCollapsed`. Computed: `theme()`, `direction()` (rtl/ltr)، `isRtl()`.
الأفعال: `toggleDarkMode`, `setTheme`, `toggleLanguage`, `setLanguage`, `toggleSidebar`, `setSidebarCollapsed`. يُحفظ في `localStorage` (مفاتيح `logicfit_theme` / `logicfit_lang`).

> ⚠️ **`loadLanguage()` يكتب `'en'` بشكل ثابت في localStorage (السطر ~138)** — اللغة الافتراضية عملياً إنجليزي رغم كون العربية اللغة الأساسية للـ UI. يستحق المراجعة عند العمل على i18n.

---

## 8. الاصطلاحات (Conventions) — اتبعها

1. **كل المكونات standalone**؛ المسارات `loadComponent`/`loadChildren`.
2. **لا mock data / لا fallbacks** — كل الخدمات تضرب الـ backend الحقيقي. (تم حذف الـ mocks عمداً؛ لا تُعِدها.)
3. **Client = Trainee** = نفس كيان الـ backend؛ منظور المدرب يسمّيه Trainee. الحقول تظهر بأسماء مزدوجة (`clientId`/`id`, `clientName`/`fullName`) — الخدمات تُطبّعها.
4. **Workout builder**: wizard-stepper + live-summary-sidebar + `MuscleDistributionService` (يحسب حجم التدريب لكل عضلة ويصدر تحذيرات: undertrained / overtrained / imbalanced).
5. **معاينات الطباعة**: للبرامج والخطط الغذائية، تحاكي الـ builder (تشمل تعليمات التمرين/النصائح/الأخطاء الشائعة). PDF يدعم RTL عربي (`setR2L(true)`).
6. **انتهاء التوكن** → توجيه لـ `/auth/login` (مش مسح صامت).
7. **RBAC**: عناصر الـ sidebar مفلترة بـ `roles: [UserRole.X]`.

---

## 9. أوامر التشغيل

```bash
npm install
ng serve                          # dev على http://localhost:4200
ng build --configuration=production
```
Vercel: Build = `npm run build`, Output = `dist/logicfit-app/browser`.

---

## 9.5 تكامل SaaS (مُنفّذ من `FRONTEND_SAAS_INTEGRATION.md`)

منظومة SaaS كاملة أُضيفت للتوافق مع الباك اند الجديد (Tenant API):

**المصادقة (متغيّرة):**
- التوكن الآن **`accessToken` عمره 15 دقيقة** + **`refreshToken`**. التجديد تلقائي عبر `error.interceptor` (single-flight: عند `401` يجدّد مرة ويعيد الطلب، ولو فشل → logout). `POST /auth/refresh`, `POST /auth/logout-all`.
- login يرجّع `roles[]` + **`permissions[]`** — مخزّنة في `AuthService.permissions` (signal).
- **register ينشئ Client فقط** (أُزيل اختيار الدور). نسيت/إعادة كلمة المرور الآن بـ `phoneNumber + tenantId + resetToken` (شاشة `reset-password` جديدة).

**الأدوار (7 الآن):** `Owner=1, Coach=2, Client=3, Manager=4, Receptionist=5, Accountant=6, Trainer=7`.
- `BACK_OFFICE_ROLES` = Owner/Manager/Receptionist/Accountant → لوحة `/owner` (يفصلها الصلاحيات).
- `COACH_ROLES` = Coach/Trainer → لوحة `/coach`. (محدّثة في `role.guard.ts`.)

**RBAC (الصلاحيات):** كتالوج 14 صلاحية في `auth.models.ts` (`Permission`). الأدوات:
- `AuthService.hasPermission() / hasAnyPermission() / hasAllPermissions()`.
- `*appHasPermission` directive (`shared/directives/has-permission.directive.ts`) لإظهار/إخفاء الأزرار.
- الـ sidebar يفلتر العناصر بالصلاحيات (`matchesPanel` + `matchesPermission`).
- `402` (تجاوز حد الباقة) → توجيه لـ `/owner/subscription?upgrade=1`. `403` → إخفاء/توجيه.

**White-Label Branding:** `BrandingService` + `APP_INITIALIZER` في `app.config.ts` → يقرأ الـ subdomain، يجلب `GET /api/branding/{identifier}`، يطبّق الألوان/اللوجو/الخط/CSS ويحفظ `tenantId`. (localhost يتخطّى.)

**اشتراك الصالة في المنصة** (`features/owner/subscription/`) — صلاحية `ManageTenantBilling`:
- `tenant-billing.models.ts` + `tenant-billing.service.ts` (كل مسارات `/api/tenant/*`).
- `my-subscription.component.ts`: الحالة + الاستخدام مقابل الحدود + اختيار/ترقية/تجديد الباقة + رفع إثبات الدفع (multipart).
- `subscription-invoices.component.ts`: فواتير المنصة.
- routes: `/owner/subscription`, `/owner/subscription/invoices`. مجموعة sidebar "اشتراك المنصة".
- Enums: `TenantSubscriptionStatus`, `PaymentRequestStatus`, `SubscriptionInvoiceStatus`, `BillingCycle`, `FeatureCode`.

**مفاتيح تخزين جديدة** (`environment`): `refreshTokenKey`, `permissionsKey`, `tenantIdKey`, `brandingKey`.

**تحديد الصالة (tenant) في شاشات الدخول:** login / register / forgot-password تستخدم `tenantId` المُستخرَج من الـ subdomain (عبر `BrandingService.getResolvedTenantId()`) وتعرض اسم الصالة كـ banner للقراءة فقط — **بدون كشف قائمة كل الصالات علناً**. قائمة الصالات (`getTenants()`) تبقى فقط كـ fallback على localhost / الدومين المجرّد (تطوير).

**تسجيل صالة جديدة (`register-gym`):** لم يعد ينشئ tenant عبر هذا الـ API (توفير الصالات والموافقة انتقل لمنصة LogicFit). الصفحة الآن **توجيه** لمنصة التسجيل عبر `environment.platformUrl` (`https://logicfit-platform.runasp.net`).

> ⚠️ ملاحظة: **لوحة تحكم المنصة (Super-Admin)** على API منفصل (`logicfit-platform.runasp.net`) — خارج نطاق هذا الفرونت.

---

## 10. نقاط تستحق الانتباه (Tech-debt / مخاطر)

- ملفات مكونات عملاقة (builders 4000+ سطر) — أي تعديل يحتاج حذر واختبار يدوي.
- `styles.scss` (~3790 سطر) globals مركزية — تغيير واحد قد يؤثر على شاشات كثيرة.
- `environment.prod.ts` = `environment.ts` (لا فصل حقيقي بين dev/prod).
- `loadLanguage()` مثبّت على `'en'` (بند 7).
- لا يوجد ملفات test فعلية بارزة رغم إعداد Karma/Jasmine.
- تعارض بدايات الـ enums (0 مقابل 1) بين الملفين.
```
