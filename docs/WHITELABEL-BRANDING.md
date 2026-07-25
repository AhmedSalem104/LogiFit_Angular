# Tenant Branding / White-label

## الوضع الحالي

يعتمد Gym App على `GET /api/branding/{identifier}` قبل تسجيل الدخول. يتم حفظ الهوية في `BrandingService` وتطبيقها على `document.documentElement` مع عزلها عن هوية Platform Management.

## مصدر الهوية

يُحسم `identifier` من النطاق أو من اختيار الجيم قبل الدخول، بينما يؤخذ `tenantId` بعد الدخول من استجابة المصادقة وJWT. لا تعتمد الواجهة على `tenantId` القادم من query أو body كحد أمني.

## الحقول المدعومة

تم توسيع `BrandingSettings` الحالي (المخزن داخل Tenant كـ JSON للحفاظ على البيانات والمigrations الحالية) ليشمل الشعارات، favicon، صور Login/Dashboard، الألوان الأساسية وحالاتها، ألوان الواجهات، الخط، نصف قطر الحواف، ونمط الثيم. الصور الموجودة في `GalleryImagesJson` تُعرض بحد أقصى خمس صور في الاستجابة العامة.

## تطبيق الواجهة

`BrandingService.apply` يضع CSS custom properties للهوية ويحدّث عنوان الصفحة وfavicon. يستخدم التطبيق cache محليًا للهوية السابقة المطابقة ثم يستبدلها بنتيجة الشبكة، ويجب مسحها عند تسجيل الخروج أو تغيير الجيم.

## API

- `GET /api/branding/{identifier}`: نقطة عامة للهوية قبل تسجيل الدخول.
- تحديث الهوية يتم عبر مسار Gym Profile المحمي بصلاحية `ManageSettings` واشتراك WhiteLabel حسب قواعد الباك اند الحالية.
- رفع الأصول يتم عبر `POST /api/GymProfile/assets` والحذف عبر `DELETE /api/GymProfile/assets/{id}`؛ الواجهة لا تعرض أدوات الإدارة إلا للمستخدم المصرح.

## حدود الأمان

تظل Platform Management بهويتها المستقلة. البحث العام فقط يستخدم `IgnoreQueryFilters` لمطابقة identifier؛ أي تعديل للهوية يمر عبر `ITenantService` والـTenant subscription guard، ولا يقبل TenantId لتجاوز السياق الحالي.

## التحقق

- `dotnet build --no-restore` نجح (3 تحذيرات nullable قائمة مسبقًا، 0 أخطاء).
- `npm run build` نجح (تحذيرات حجم/CommonJS قائمة مسبقًا، 0 أخطاء).
