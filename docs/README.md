# مركز توثيق واجهة إدارة الصالات

هذا المجلد هو مرجع التشغيل والتطوير لواجهة الصالة (`LogicFit_Angular`). لا يعتمد
على ذاكرة المحادثات: يوضح تدفق المستخدم، الشاشات، التكامل مع الخادم، التصميم،
والـresponsive. لا توثّق Tokens أو Connection Strings أو بيانات دخول حقيقية.

| الوثيقة | ما الذي تجيب عنه؟ |
|---|---|
| [التوثيق الكامل لكل الشاشات](COMPLETE-SCREEN-DOCUMENTATION.md) | كل Route فعلي، الحماية، الغرض، عائلة الـAPI، التدفقات، الحالات، الصلاحيات، واختبارات واجهة الصالة والمدرب والمتدرب. |
| [مرجع المشروع](PROJECT_REFERENCE.md) | البنية، Guards، Services، النماذج، والأوامر. |
| [تدفقات ومساحات العمل](WORKSPACE-FLOWS.md) | من يستخدم كل شاشة، ما الذي يفعله، وما حدود الصلاحية. |
| [كتالوج عقود API](API-ENDPOINT-CATALOG.md) | جميع Tenant وPlatform endpoints: route، method، access، inputs، responses. |
| [دليل التصميم وResponsive](RESPONSIVE-DESIGN.md) | breakpoints، القائمة الجانبية، الجداول، الحوارات، وTailwind/PrimeNG. |

## قاعدة تحديث التوثيق

أي تغيير في route أو endpoint أو request/response أو permission أو شاشة أو تصميم
مشترك يجب أن يحدّث هذه الوثائق في نفس الـPull Request. كتالوج الـAPI هو نسخة
مطابقة للملف المولّد في مشروع Backend؛ حدّثه بتشغيل:

```powershell
cd "..\LogicFit"
.\Scripts\Export-ApiEndpointCatalog.ps1
Copy-Item .\docs\API-ENDPOINT-CATALOG.md "..\LogicFit_Angular\docs\API-ENDPOINT-CATALOG.md"
```

ثم راجع فرق الملف قبل الدمج. المصدر التنفيذي الوحيد للـAPI هو الـControllers
وDTOs في مشروع `LogicFit`.

يتم تحديث جدول الـRoutes ونسخة كتالوج الـAPI معاً من مستودع الـBackend عبر:

```powershell
cd "..\LogicFit"
.\Scripts\Export-FrontendRouteDocumentation.ps1
```

لا تعتبر شاشة موثقة إلا إذا كان لها Route أو سبب واضح لعدم وجوده، Guard/Permission،
حالة Loading/Empty/Error/Blocked، وربط موثق بالـAPI.
