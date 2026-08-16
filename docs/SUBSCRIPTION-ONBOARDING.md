# إنشاء مشترك واشتراك الجيم

## الهدف

تسمح شاشة `/owner/subscriptions` لمالك الجيم بإضافة أول مشترك مع اشتراكه من نفس النموذج، أو إنشاء اشتراك لعميل موجود. لا تعتمد الشاشة على وجود عميل سابق كي تبدأ العملية.

## المساران

### عميل جديد مع اشتراك

يُرسل النموذج إلى `POST /api/Clients/onboard` ويحتوي على بيانات العميل و`membership`:

```json
{
  "phoneNumber": "01000000000",
  "email": "client@example.com",
  "password": "temporary-password",
  "fullName": "عميل جديد",
  "membership": {
    "planId": "<plan-id>",
    "startDate": "2026-08-16",
    "paymentMethod": 0,
    "amountPaid": 0,
    "discount": 0,
    "issueCard": true
  }
}
```

ينفذ الخادم إنشاء العميل والاشتراك والبطاقة داخل معاملة واحدة. معاملة الـOnboarding الخارجية هي المالكة للعملية، لذلك ينضم إنشاء الاشتراك إليها ولا يفتح معاملة متداخلة على نفس `DbContext`.

### عميل موجود

يُرسل النموذج إلى `POST /api/Subscriptions`:

```json
{
  "clientId": "<client-id>",
  "planId": "<plan-id>",
  "startDate": "2026-08-16",
  "paymentMethod": 0,
  "amountPaid": 0,
  "discount": 0
}
```

في هذا المسار يدير `CreateClientSubscriptionCommandHandler` معاملته الخاصة، ويتحقق من ملكية العميل والخطة داخل الـTenant ومن عدم وجود اشتراك Active أو Suspended متداخل.

## الحالات والأخطاء

- لا توجد خطط: تعرض الشاشة حالة واضحة وتطلب إنشاء خطة من `/owner/subscription-plans`.
- لا يوجد عملاء: يفتح النموذج مباشرة في وضع «عميل جديد».
- بيانات ناقصة: تمنع الواجهة الإرسال وتوضح الحقول المطلوبة.
- هاتف مكرر أو اشتراك متداخل: يعرض الخادم رسالة تعارض ولا ينشئ سجلاً مكرراً.
- فشل أي خطوة في Onboarding: يتم Rollback للعميل والاشتراك والبطاقة معاً.

## الأمان

يستنتج الخادم `TenantId` من السياق المصادق عليه، ولا يثق في `ClientId` أو `PlanId` القادم من المتصفح قبل التحقق من ملكيتهما. صلاحية إنشاء الاشتراك هي `Permissions.ManageClientSubscriptions`، وصلاحية إنشاء العميل هي `Permissions.CreateMembers`.
