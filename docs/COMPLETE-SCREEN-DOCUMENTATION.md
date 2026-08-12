# LogicFit Tenant UI — التوثيق الكامل للشاشات والتدفقات

هذا الملف يصف كل Route في تطبيق الصالة والمدرب الحر والمتدرب، ومصدر الحماية،
الغرض العملي، عائلة الـAPI، والحالات التي يجب أن تظهر للمستخدم. التفاصيل الدقيقة
للطلب والاستجابة موجودة في [كتالوج API المولد](API-ENDPOINT-CATALOG.md).

## 1. حدود التطبيق

التطبيق لا ينشئ صلاحية من الواجهة. التسلسل الأمني هو `authGuard` ثم guard للدور
ثم `permissionGuard`/`featureGuard` عند الحاجة، والخادم يعيد فحص الهوية والـTenant
والاشتراك والميزة والـQuota في كل طلب.

| السياق | المسارات | المسؤولية |
|---|---|---|
| الهوية العامة | `/identity/*`, `/auth/*` | التسجيل، التحقق، كلمة المرور، الدعوات، تتبع الطلب |
| Owner/Back-office | `/owner/*` | تشغيل الجيم أو مساحة FreelanceCoach |
| Coach | `/coach/*` | العملاء المعينون، البرامج، التغذية، المواعيد |
| Client | `/client/*` | الخطط والجلسات والوجبات والقياسات والاشتراكات |
| حالة ممنوعة | `/gym-unavailable` | شرح توقف/انتهاء/أرشفة المساحة |

## 2. عقد الشاشة الموحد

كل شاشة يجب أن تلتزم بالآتي:

- Loading واضح أثناء القراءة أو الحفظ، وعدم عرض جدول فارغ قبل انتهاء الطلب.
- Empty state يشرح عدم وجود بيانات ويعرض الإجراء المسموح فقط.
- Error state برسالة مفهومة وزر Retry عند إمكان إعادة القراءة.
- Blocked state عند الصلاحية أو الاشتراك أو جاهزية القاعدة، دون stack trace.
- لا تُعرض صفحات أو APIs خاصة بالـTenant أثناء provisioning أو عدم جاهزية القاعدة.
- عمليات الحفظ والحضور والدفع والجلسة تمنع النقر المكرر وتراجع النتيجة قبل الإعادة.
- الـClientId/CoachId/TenantId القادم من المتصفح ليس حدًا أمنيًا؛ الخادم يثبت الملكية.

## 3. التدفقات التي تغطيها الواجهة

### تسجيل Gym/FreelanceCoach

اختيار النوع → الباقة → البيانات الأساسية → الدفع/إرسال الطلب → شاشة الحالة →
المراجعة → التجهيز → الجاهزية → تسجيل الدخول واختيار Workspace. عند طلب معلومات
إضافية تظهر الحقول المطلوبة فقط؛ لا يعاد التسجيل من البداية.

### دخول المستخدم

Login → Identity context → قائمة المساحات/الطلبات → اختيار مساحة نشطة → Tenant JWT
→ الوجهة حسب الدور. الطلبات المعلقة تفتح `/identity/application-status` ولا تفتح
لوحة Tenant.

### Owner وموظفو الجيم

Owner يدخل `/owner/workspace-access` أو `/owner/employees`، ينشئ هوية/عضوية ودورًا
وصلاحيات مترابطة، يرى كلمة المرور المؤقتة مرة واحدة، ويُلزم الموظف بتغييرها.

### Coach وClient

Coach يفتح متدربًا مرتبطًا → ينشئ Workout Program أو Diet Plan → العميل يقرأ الخطة
→ يبدأ Workout Session أو يسجل Meal Log → المدرب يرى التقدم. كل خطوة مرتبطة بالـTenant
والعلاقة CoachClient.

## 4. مصفوفة الأدوار

| الدور | ما يراه | ما لا يملكه تلقائيًا |
|---|---|---|
| Owner | إعدادات المساحة، الفريق، العملاء، المال، التقارير حسب الخطة | إدارة منصة SaaS أو Tenant آخر |
| Manager/Staff | ما تمنحه Permissions فقط | Owner أو صلاحيات مالية/إعدادات غير ممنوحة |
| Coach | عملاؤه وبرامجهم ومواعيدهم | عملاء مدرب آخر أو مال الجيم |
| Client | بياناته وخططه وسجلاته | تعديل خطة المدرب أو رؤية عميل آخر |

## 5. جرد كل Route ومصدره

<!-- GENERATED ROUTES START -->
| Route | Guard / permission source | Component source | Purpose and benefit | Primary API family |
|---|---|---|---|---|
| `/auth/register-freelance` | `Inherited route guard` | `./pages/register-workspace/register-workspace.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/auth/register-gym` | `Inherited route guard` | `./pages/register-workspace/register-workspace.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/auth/register-workspace` | `Inherited route guard` | `./pages/register-workspace/register-workspace.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/client/appointments` | `Inherited route guard` | `./appointments/client-appointments.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/client/challenges` | `Inherited route guard` | `./challenges/my-challenges.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/client/chat` | `Inherited route guard` | `./chat/client-chat.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/client/dashboard` | `Inherited route guard` | `./dashboard/client-dashboard.component` | Live indicators and the next operational decision. | `/api/reports and dashboard endpoints` |
| `/client/meal-log` | `Inherited route guard` | `./diet/meal-log.component` | Relationship management and role-scoped client work. | `/api/dietplans, /api/meal-logs, /api/foods` |
| `/client/my-diet` | `Inherited route guard` | `./diet/my-diet.component` | Relationship management and role-scoped client work. | `/api/dietplans, /api/meal-logs, /api/foods` |
| `/client/my-measurements` | `Inherited route guard` | `./measurements/my-measurements.component` | Relationship management and role-scoped client work. | `/api/bodymeasurements and client progress endpoints` |
| `/client/my-program` | `Inherited route guard` | `./workout/my-program.component` | Relationship management and role-scoped client work. | `/api/workoutprograms, /api/workoutsessions, /api/exercises, /api/muscles` |
| `/client/my-progress` | `Inherited route guard` | `./progress/my-progress.component` | Relationship management and role-scoped client work. | `/api/bodymeasurements and client progress endpoints` |
| `/client/my-subscriptions` | `Inherited route guard` | `./subscriptions/my-subscriptions.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/client/profile` | `Inherited route guard` | `./profile/my-profile.component` | Workspace profile, lifecycle, or personal settings. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/client/workout-session` | `Inherited route guard` | `./workout/workout-session.component` | Relationship management and role-scoped client work. | `/api/workoutprograms, /api/workoutsessions, /api/exercises, /api/muscles` |
| `/coach/appointments` | `Inherited route guard` | `./appointments/appointments.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/coach/challenges` | `Inherited route guard` | `./challenges/challenges.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/coach/chat` | `Inherited route guard` | `./chat/coach-chat.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/coach/dashboard` | `Inherited route guard` | `./dashboard/coach-dashboard.component` | Live indicators and the next operational decision. | `/api/reports and dashboard endpoints` |
| `/coach/diet-plans` | `Inherited route guard` | `./diet-plans/diet-plans-list.component` | Relationship management and role-scoped client work. | `/api/dietplans, /api/meal-logs, /api/foods` |
| `/coach/diet-plans/:id/edit` | `Inherited route guard` | `./diet-plans/diet-plan-builder.component` | Relationship management and role-scoped client work. | `/api/dietplans, /api/meal-logs, /api/foods` |
| `/coach/diet-plans/create` | `Inherited route guard` | `./diet-plans/diet-plan-builder.component` | Relationship management and role-scoped client work. | `/api/dietplans, /api/meal-logs, /api/foods` |
| `/coach/exercises` | `Inherited route guard` | `./exercises/exercises-library.component` | Relationship management and role-scoped client work. | `/api/workoutprograms, /api/workoutsessions, /api/exercises, /api/muscles` |
| `/coach/foods` | `Inherited route guard` | `./foods/foods-database.component` | Relationship management and role-scoped client work. | `/api/dietplans, /api/meal-logs, /api/foods` |
| `/coach/measurements` | `Inherited route guard` | `./measurements/measurements-list.component` | Relationship management and role-scoped client work. | `/api/bodymeasurements and client progress endpoints` |
| `/coach/muscles` | `Inherited route guard` | `./muscles/muscles-list.component` | Relationship management and role-scoped client work. | `/api/workoutprograms, /api/workoutsessions, /api/exercises, /api/muscles` |
| `/coach/profile` | `Inherited route guard` | `./profile/coach-profile.component` | Workspace profile, lifecycle, or personal settings. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/coach/subscriptions` | `permissionGuard(Permissions.ManageClientSubscriptions)` | `../owner/subscriptions/subscriptions-list.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/coach/trainees` | `Inherited route guard` | `./trainees/trainees-list.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/coach/trainees/:id` | `Inherited route guard` | `./trainees/trainee-details.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/coach/workout-programs` | `Inherited route guard` | `./workout-programs/programs-list.component` | Relationship management and role-scoped client work. | `/api/workoutprograms, /api/workoutsessions, /api/exercises, /api/muscles` |
| `/coach/workout-programs/:id/edit` | `Inherited route guard` | `./workout-programs/program-builder.component` | Relationship management and role-scoped client work. | `/api/workoutprograms, /api/workoutsessions, /api/exercises, /api/muscles` |
| `/coach/workout-programs/create` | `Inherited route guard` | `./workout-programs/program-builder.component` | Relationship management and role-scoped client work. | `/api/workoutprograms, /api/workoutsessions, /api/exercises, /api/muscles` |
| `/gym-unavailable` | `Inherited route guard` | `./features/tenant/gym-unavailable/gym-unavailable.component` | Workspace profile, lifecycle, or personal settings. | `See the generated API endpoint catalog for the component service.` |
| `/identity/accept-invite` | `Inherited route guard` | `./features/auth/pages/identity-join/identity-join.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/identity/application-status` | `Inherited route guard` | `./features/auth/pages/application-status/application-status.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/identity/join-client` | `Inherited route guard` | `./features/auth/pages/identity-join/identity-join.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/identity/login` | `Inherited route guard` | `./features/auth/pages/identity-login/identity-login.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/identity/register` | `Inherited route guard` | `./features/auth/pages/identity-register/identity-register.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/identity/reset-password` | `Inherited route guard` | `./features/auth/pages/identity-password-reset/identity-password-reset.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/identity/verify-email` | `Inherited route guard` | `./features/auth/pages/identity-email-verification/identity-email-verification.component` | Identity, onboarding, access, and application tracking. | `/api/identity, /api/workspace-applications, /api/workspace-invites` |
| `/owner/attendance` | `permissionGuard(Permissions.ManageAttendance)` | `./attendance/attendance.component` | Attendance, scheduling, classes, or staff time. | `attendance, appointments, classes, and HR endpoints` |
| `/owner/branches` | `permissionGuard(Permissions.ManageBranches)` | `./branches/branches-list.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/class-schedules` | `permissionGuard(Permissions.ManageBranches)` | `./class-schedules/class-schedules.component` | Attendance, scheduling, classes, or staff time. | `attendance, appointments, classes, and HR endpoints` |
| `/owner/clients` | `permissionGuard(Permissions.ViewMembers)` | `./clients/clients-list.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/owner/coaches` | `permissionGuard(Permissions.ManageCoaches)` | `./coaches/coaches-list.component` | Relationship management and role-scoped client work. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/owner/commissions` | `permissionGuard(Permissions.ManageFinance)` | `./commissions/commissions.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/coupons` | `permissionGuard(Permissions.ManageFinance)` | `./coupons/coupons-list.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/dashboard` | `permissionGuard(Permissions.ViewReports)` | `./dashboard/owner-dashboard.component` | Live indicators and the next operational decision. | `/api/reports and dashboard endpoints` |
| `/owner/employees` | `permissionGuard(Permissions.ManageEmployees)` | `./employees/employees-list.component` | Role-scoped LogicFit workspace screen. | `See the generated API endpoint catalog for the component service.` |
| `/owner/equipment` | `permissionGuard(Permissions.ManageBranches)` | `./equipment/equipment-list.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/expense-categories` | `permissionGuard(Permissions.ManageFinance)` | `./expense-categories/expense-categories.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/expenses` | `permissionGuard(Permissions.ManageFinance)` | `./expenses/expenses-list.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/freelance-team` | `freelanceWorkspaceGuard, permissionGuard(Permissions.ManageCoaches)` | `./freelance-team/freelance-team.component` | Role-scoped LogicFit workspace screen. | `/api/clients, /api/coach-clients, /api/workspace members` |
| `/owner/gate-access` | `permissionGuard(Permissions.ManageAttendance)` | `./gate-access/gate-access.component` | Attendance, scheduling, classes, or staff time. | `attendance, appointments, classes, and HR endpoints` |
| `/owner/group-classes` | `permissionGuard(Permissions.ManageBranches)` | `./group-classes/group-classes.component` | Attendance, scheduling, classes, or staff time. | `attendance, appointments, classes, and HR endpoints` |
| `/owner/gym-settings` | `featureGuard('settings.branding', Permissions.ManageSettings)` | `./gym-settings/gym-settings.component` | Workspace profile, lifecycle, or personal settings. | `See the generated API endpoint catalog for the component service.` |
| `/owner/invoices` | `permissionGuard(Permissions.ManageFinance)` | `./invoices/invoices-list.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/leaves` | `permissionGuard(Permissions.ManageEmployees)` | `./leaves/leaves-list.component` | Attendance, scheduling, classes, or staff time. | `attendance, appointments, classes, and HR endpoints` |
| `/owner/maintenance` | `permissionGuard(Permissions.ManageBranches)` | `./maintenance/maintenance-list.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/membership-cards` | `permissionGuard(Permissions.ManageMembers)` | `./membership-cards/membership-cards.component` | Role-scoped LogicFit workspace screen. | `See the generated API endpoint catalog for the component service.` |
| `/owner/operations` | `permissionGuard(Permissions.ViewReports)` | `./operations-dashboard/operations-dashboard.component` | Monitoring, communication, reporting, or governance. | `See the generated API endpoint catalog for the component service.` |
| `/owner/operations-reports` | `permissionGuard(Permissions.ViewReports)` | `./operations-dashboard/operations-reports.component` | Monitoring, communication, reporting, or governance. | `/api/reports and dashboard endpoints` |
| `/owner/payments` | `permissionGuard(Permissions.ManageFinance)` | `./payments/payments-list.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/payroll` | `permissionGuard(Permissions.ManageEmployees)` | `./payroll/payroll.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/pos-sales` | `permissionGuard(Permissions.ManagePOS)` | `./pos-sales/pos-sales.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/product-categories` | `permissionGuard(Permissions.ManageInventory)` | `./product-categories/product-categories.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/products` | `permissionGuard(Permissions.ManageInventory)` | `./products/products-list.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/profile` | `Inherited route guard` | `./profile/owner-profile.component` | Workspace profile, lifecycle, or personal settings. | `See the generated API endpoint catalog for the component service.` |
| `/owner/reports` | `permissionGuard(Permissions.ViewReports)` | `./reports/reports.component` | Monitoring, communication, reporting, or governance. | `/api/reports and dashboard endpoints` |
| `/owner/rooms` | `permissionGuard(Permissions.ManageBranches)` | `./rooms/rooms-list.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/shifts` | `permissionGuard(Permissions.ManageEmployees)` | `./shifts/shifts.component` | Attendance, scheduling, classes, or staff time. | `attendance, appointments, classes, and HR endpoints` |
| `/owner/stock` | `permissionGuard(Permissions.ManageInventory)` | `./stock/stock.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/subscription` | `permissionGuard(Permissions.ManageTenantBilling)` | `./subscription/my-subscription.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/subscription/invoices` | `permissionGuard(Permissions.ManageTenantBilling)` | `./subscription/subscription-invoices.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/subscription-plans` | `permissionGuard(Permissions.ManageClientSubscriptions)` | `./subscription-plans/plans-list.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/subscriptions` | `permissionGuard(Permissions.ManageClientSubscriptions)` | `./subscriptions/subscriptions-list.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/suppliers` | `permissionGuard(Permissions.ManageInventory)` | `./suppliers/suppliers-list.component` | Facilities, inventory, sales, or maintenance. | `facilities, inventory, POS, and maintenance endpoints` |
| `/owner/tax-settings` | `permissionGuard(Permissions.ManageSettings)` | `./tax-settings/tax-settings.component` | Commercial, billing, finance, or payroll operations. | `/api/subscriptions, /api/payments, /api/invoices, finance endpoints` |
| `/owner/workspace-access` | `permissionGuard(Permissions.ManageEmployees)` | `./workspace-access/workspace-access.component` | Workspace creation, membership, or activation workflow. | `See the generated API endpoint catalog for the component service.` |
<!-- GENERATED ROUTES END -->

## 6. عائلات الـAPI المستخدمة في الشاشات

| المجال | أمثلة العمليات | النتيجة المتوقعة |
|---|---|---|
| Identity | login/register/verify/select-workspace/reset | Identity context أو Tenant session؛ لا Refresh Token في JavaScript |
| Applications | plans/create/tracking/fields/resubmit | حالة طلب قابلة للتتبع ورسالة وخطوة تالية |
| Owner | clients/coaches/branches/finance/inventory/HR | سجلات مرتبطة بالمساحة وبصلاحية الخادم |
| Coach | coach-clients/workoutprograms/dietplans/appointments | Aggregate محفوظ أو قراءة علاقة مصرح بها |
| Client | client/dashboard/my-programs/workoutsessions/meal-logs | بيانات صاحب الجلسة فقط |
| Shared | profile/notifications/chat/challenges/media | خدمة مشتركة مع عزل وهوية الجلسة |

الكتالوج الكامل في هذا المجلد يوضح لكل Endpoint: method، route، access policy،
inputs، response schema، failure contract، الأهمية، الفائدة، والآثار الجانبية.

## 7. الحالات ورسائل UX

| الحالة | الرسالة المقترحة | التصرف |
|---|---|---|
| Loading | جارٍ تحميل البيانات… | تعطيل الإجراء المتعارض |
| Empty | لا توجد بيانات بعد | إظهار إنشاء/إضافة إذا كانت الصلاحية تسمح |
| Forbidden | لا تملك الصلاحية لهذه الشاشة | العودة لمساحة الدور أو طلب الصلاحية |
| Provisioning | جاري تجهيز حسابك وقاعدة البيانات | لا تستدعِ Tenant APIs |
| Database unavailable | النظام غير متاح مؤقتًا | Retry/التواصل مع الإدارة |
| Conflict | تغيرت البيانات؛ أعد التحميل قبل المحاولة | قراءة الحالة الجديدة |
| Server error | حدث خطأ في الخادم | لا تكرر Mutation مالية أو حضورًا بلا فحص |

## 8. قواعد التدريب والتغذية

- البرنامج والخطة Aggregate واحد عند الحفظ، ولا تعلن الواجهة نجاحًا جزئيًا.
- التمرين والغذاء والقياسات بيانات حساسة وظيفيًا؛ تعرض حسب العلاقة والصلاحية.
- العميل ينفذ الجلسة ويسجل المجموعات/الوجبات، والمدرب يراجع التقدم.
- فشل عنصر فرعي لا يمسح خطة صحيحة تم تحميلها؛ يظهر خطأ العنصر وإمكانية المحاولة.

## 9. الاختبار قبل الدمج

- اختبر كل Route بالمستخدم المصرح وغير المصرح.
- اختبر 401 refresh و403 permission و404 isolation و409 concurrency.
- اختبر التسجيل Gym وFreelance، الدفع، التتبع، طلب المعلومات، الجاهزية، والرفض.
- اختبر إنشاء موظف، الهوية الموجودة، منع العضوية المكررة، PasswordChangeRequired.
- اختبر Coach plan وClient session/meal log وحالات Empty/Error.
- اختبر الهاتف والـLoading وعدم وجود صفحات فارغة.

## 10. صيانة الملف

مصدر جرد الشاشات هو `src/app/app.routes.ts` وملفات `owner.routes.ts` و`coach.routes.ts`
و`client.routes.ts`. شغّل من Backend:

```powershell
.\Scripts\Export-FrontendRouteDocumentation.ps1
```

أي تغيير في Route أو Component أو Service أو API يجب أن يحدث هذا الملف وكتالوج API
ودليل التدفق في نفس Pull Request.
