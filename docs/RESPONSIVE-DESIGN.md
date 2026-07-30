# دليل التصميم والـResponsive

## نظام التصميم

## Unified login card (2026-07-30)

- `/identity/login` uses one centered card on desktop over a quiet neutral background; gym branding is applied only after a server-issued workspace session.
- At `480px` and below the card becomes full screen without a border or shadow. Language and theme controls remain available.
- The step indicator shortens at narrow widths and the three start-action cards change from three columns to one. No horizontal scrolling is introduced.
- The experience must be reviewed in RTL/LTR and Light/Dark modes before release. Visible cards are navigation only; authorization, role assignment, and membership creation remain backend decisions.
- Email verification and password-reset views use the same card and the same mobile full-screen behavior. The email-action token stays in the URL fragment and is never rendered, copied to localStorage, or shown in an error message.

- Angular 18 standalone components، Tailwind CSS 3.4، PrimeNG 17، PrimeIcons.
- الخط الافتراضي: `Cairo` ثم `Tajawal`، مع دعم RTL/LTR من `ThemeState`.
- الألوان والمقاسات المشتركة موجودة في `src/styles.scss` عبر CSS variables؛ لا
  تنسخ درجات اللون أو الـshadow داخل كل شاشة ما لم تكن هوية domain مقصودة.
- الصلاحيات تخفي actions غير المتاحة، لكن عدم ظهور زر لا يساوي authorization؛ API
  يبقى الحارس النهائي.

## نقاط التوقف المعتمدة

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

تحذيرات حجم مكونات builders وCommonJS الحالية معروفة، لكن أي خطأ TypeScript أو
فشل build يمنع الدمج.
