# دليل التصميم والـResponsive

## نظام التصميم

## Unified login card (2026-07-30)

- `/identity/login` and the legacy auth routes use one centered card over a uniform LogicFit blue background; the former journey panel is removed from the visible layout.
- The identity context card keeps pending activation details readable on narrow screens: Gym and FreelanceCoach badges remain visible, status/next-step text wraps, and the card action stays keyboard accessible without horizontal overflow.
- At `560px` and below the card keeps a small blue gutter, rounded corners, and a touch-friendly full-height layout. Language and theme controls remain available.
- The step indicator shortens at narrow widths and the three start-action cards change from three columns to one. No horizontal scrolling is introduced.
- The experience must be reviewed in RTL/LTR and Light/Dark modes before release. Visible cards are navigation only; authorization, role assignment, and membership creation remain backend decisions.
- Email verification and password-reset views use the same centered card and responsive blue-gutter behavior. The email-action token stays in the URL fragment and is never rendered, copied to localStorage, or shown in an error message.

- Angular 18 standalone components، Tailwind CSS 3.4، PrimeNG 17، PrimeIcons.
- الخط الافتراضي: `Cairo` ثم `Tajawal`، مع دعم RTL/LTR من `ThemeState`.
- الألوان والمقاسات المشتركة موجودة في `src/styles.scss` عبر CSS variables؛ لا
  تنسخ درجات اللون أو الـshadow داخل كل شاشة ما لم تكن هوية domain مقصودة.
- الصلاحيات تخفي actions غير المتاحة، لكن عدم ظهور زر لا يساوي authorization؛ API
  يبقى الحارس النهائي.

## نقاط التوقف المعتمدة

### بطاقة تسجيل الدخول الموجهة

- عند كل المقاسات تظهر بطاقة دخول واحدة في المنتصف فوق خلفية زرقاء موحدة، بدون لوحة جانبية أو تقسيم للشاشة.
- عند `560px` وأقل يحتفظ الكارت بهامش أزرق صغير وحواف مستديرة وارتفاع مناسب للشاشة، مع بقاء أزرار اللمس والحقول ضمن العرض الآمن ودون تمرير أفقي.
- بطاقات اختيار نوع الدخول تتحول إلى عمود واحد عند الحاجة؛ لا تعتمد التجربة على روابط نصية صغيرة للوصول إلى الوظائف الأساسية.
- يجب فحص `/auth/login` في RTL وLTR والوضعين الفاتح والداكن عند `360px` و`768px` و`1024px` و`1440px`.

| العرض | السلوك |
|---|---|
| أكثر من `1024px` | sidebar compact rail، يفتح بالـhover، ويمكن تثبيته من زر الدبوس. المحتوى يترك مساحة 80px أو 280px حسب التثبيت. |
| `1024px` وأقل | تتحول القائمة إلى drawer مغلق افتراضيًا. زر الرأس يفتحها وoverlay أو اختيار رابط يغلقها. |
| `768px` وأقل | padding للمحتوى أصغر، header مختصر، الجداول تتمرر أفقيًا داخل wrapper، والحوارات تستخدم عرضًا مرنًا. |
| `480px` وأقل | أزرار الإجراءات أكبر لمس، paginator مبسط، والـdialog بعرض مساحة الشاشة الآمنة. |

## القائمة الجانبية الذكية

1. في سطح المكتب تبقى القائمة بعرض مختصر لتزيد مساحة لوحة العمل، وتتمدد عند hover.
2. زر الدبوس يثبتها مفتوحة أو يعيدها إلى compact rail، ويُحفظ الاختيار في
   `localStorage` باسم `logicfit_sidebar_pinned`.
3. البحث لا يفتش في روابط غير مرئية للمستخدم؛ النتيجة تنتج من `visibleNavGroups`
   بعد فلترة role وpermission.
4. في الهاتف لا يوجد hover كآلية وحيدة: القائمة drawer صريح، تغلق بعد التنقل أو
   لمس الـoverlay، ولا تفتح تلقائيًا عند بدء الصفحة.

## الجداول والنماذج

- أي جدول PrimeNG يستخدم `p-datatable-wrapper` قابلاً للتمرير الأفقي؛ لا نضغط
  أعمدة الأعمال المهمة داخل شاشة هاتف صغيرة.
- تظل الأعمدة سليمة بـ`min-width: max-content`، وتبقى صفحة المحتوى نفسها بلا
  horizontal overflow.
- في الهاتف تقل padding والخطوط بدرجة بسيطة مع الحفاظ على قابلية القراءة.
- النماذج تستخدم `form-grid` أو `dialog-grid` المتجاوبة، والـdialog لا يتجاوز
  `calc(100vw - 1rem)`.
- Action buttons لا تكون أصغر من هدف لمس مناسب؛ الأيقونات تحتاج `title` أو
  `aria-label` عندما لا يوجد نص ظاهر.

## استرداد متابعة الطلب

- تعرض شاشة الدخول بالهوية شريط خطوات مختصرًا، ثم تنبيه استرداد واضح عندما يصل المستخدم من جلسة متابعة منتهية.
- عند `480px` وأقل: تبقى الخطوات أفقية ومختصرة، وتتحول بطاقة الشرح في شاشة حالة الطلب إلى مساحة أقل مع الحفاظ على زر المتابعة بعرض واضح.

## فحص واجب قبل الدمج

افحص المساحات التالية بعد أي تعديل layout أو جدول أو dialog:

1. `360 × 800` هاتف صغير: فتح/إغلاق القائمة، البحث، جدول طويل، dialog، وquick actions.
2. `768 × 1024` جهاز لوحي: drawer، toolbar متعدد الفلاتر، وgrid الإحصاءات.
3. `1024 × 768` التحول بين tablet وdesktop: لا يبقى overlay ولا margin قديم.
4. `1440 × 900` سطح المكتب: hover/pin، sidebar، charts والجداول الواسعة.
5. RTL وLTR، light وdark، وملك/موظف/مدرب/عميل بصلاحيات مختلفة.

شغّل بعد ذلك:

```powershell
npm run build
```

## Workspace navigation split (Issue #84)

The shared sidebar remains responsive at the existing 360/768/1024/1440 breakpoints. Capability
filtering changes the number of visible groups, not the drawer, hover, pin, or overflow behavior.
Verify both a Gym owner (full back-office menu) and a FreelanceCoach owner (coaching menu) in RTL
and LTR, including the blocked-feature screen on a narrow viewport. The workspace subtitle must
remain readable when the sidebar is collapsed.

تحذيرات حجم مكونات builders وCommonJS الحالية معروفة، لكن أي خطأ TypeScript أو
فشل build يمنع الدمج.

## Ordered workspace sidebar (Issue #88)

The ordered links use the existing two-column desktop menu and single-column collapsed/mobile
drawer. The change is limited to link and section order; it does not change drawer width,
breakpoints, hover expansion, pin persistence, search behavior, or overflow rules. Verify the
workflow order for both Gym and FreelanceCoach at 360, 768, 1024, and 1440 widths in RTL and LTR.
In collapsed mode every ordered item must remain identifiable by its icon tooltip/title.

## TOP-GYM canonical areas and member dialog (2026-08-17)

The primary sidebar is intentionally short and follows the TOP-GYM tabs: dashboard, members,
trainees, management, memberships/collection, attendance, expenses, library, and reports. For FreelanceCoach, the same
shell presents clients, payments/debts, sessions/appointments, library, reports, and the assistant
team. Detailed training, nutrition, measurement, membership, and payment operations open from the
selected member/client or its row actions. Management and collection hubs must expose their complete
card sets without horizontal overflow. The consolidation must not change the existing drawer,
hover, pin, or RTL/LTR behavior. Check the Gym and FreelanceCoach variants at all four required
widths.

The member onboarding dialog uses three stages. At `360px` and `480px` the step labels may stack
under their number, the form becomes one column, and the action footer remains visible after scroll.
At tablet and desktop widths the form uses two columns and the price summary uses three columns.
Loading, no-plan, API-error, and saving states must never render a blank dialog.
