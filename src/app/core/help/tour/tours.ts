import { Tour } from './tour.models';

/**
 * Spotlight tours for the critical flows. Targets use `[data-tour="..."]`
 * anchors placed on the real elements so the highlight survives refactors of
 * class names. A step with no target shows a centered info card.
 */
export const TOURS: Tour[] = [
  {
    id: 'add-client', role: 'owner', icon: 'pi-user-plus',
    title: 'إضافة عميل',
    description: 'أضف عميلاً جديداً لصالتك خطوة بخطوة.',
    steps: [
      { route: '/owner/clients', target: '[data-tour="add-client"]', title: 'ابدأ الإضافة',
        text: 'هذا زر «إضافة عميل». اضغطه لفتح نافذة الإضافة، ثم اضغط «التالي».', hint: 'اضغط الزر لفتح النافذة' },
      { target: '[data-tour="pf-fullName"]', title: 'الاسم الكامل', text: 'اكتب الاسم الكامل للعميل هنا (حقل مطلوب).' },
      { target: '[data-tour="pf-phone"]', title: 'رقم الهاتف', text: 'اكتب رقم هاتف العميل (حقل مطلوب — هو معرّف الدخول).' },
      { target: '[data-tour="pf-password"]', title: 'كلمة المرور', text: 'اختر كلمة مرور قوية: 8 أحرف على الأقل وتحتوي حرف كبير وصغير ورقم.' },
      { target: '[data-tour="pf-submit"]', title: 'احفظ', text: 'اضغط «إضافة» لحفظ العميل. سيظهر مباشرة في القائمة.' },
    ],
  },
  {
    id: 'add-coach', role: 'owner', icon: 'pi-id-card',
    title: 'إضافة مدرب',
    description: 'أضف مدرباً جديداً لفريقك.',
    steps: [
      { route: '/owner/coaches', target: '[data-tour="add-coach"]', title: 'ابدأ الإضافة',
        text: 'هذا زر «إضافة مدرب». اضغطه لفتح النافذة ثم «التالي».', hint: 'اضغط الزر لفتح النافذة' },
      { target: '[data-tour="pf-fullName"]', title: 'اسم المدرب', text: 'اكتب الاسم الكامل للمدرب.' },
      { target: '[data-tour="pf-phone"]', title: 'رقم الهاتف', text: 'اكتب رقم هاتف المدرب (معرّف الدخول).' },
      { target: '[data-tour="pf-password"]', title: 'كلمة المرور', text: 'اختر كلمة مرور قوية للمدرب.' },
      { target: '[data-tour="pf-submit"]', title: 'احفظ', text: 'اضغط «إضافة» لحفظ المدرب.' },
    ],
  },
  {
    id: 'create-subscription', role: 'owner', icon: 'pi-wallet',
    title: 'إنشاء اشتراك',
    description: 'فعّل عضوية لعميل عبر باقة.',
    steps: [
      { route: '/owner/subscription-plans', target: '[data-tour="add-plan"]', title: 'تأكد من وجود باقة',
        text: 'قبل الاشتراك لازم يكون فيه باقة. لو مفيش، اضغط «إضافة خطة» وأنشئ واحدة.', hint: 'اختياري لو عندك باقات بالفعل' },
      { route: '/owner/subscriptions', target: '[data-tour="add-subscription"]', title: 'أنشئ الاشتراك',
        text: 'اضغط «إضافة اشتراك» لبدء إنشاء عضوية جديدة، ثم «التالي».', hint: 'اضغط الزر لفتح النافذة' },
      { title: 'أكمل البيانات', text: 'اختر العميل والباقة وتاريخ البداية داخل النافذة، ثم احفظ. سجّل الدفعة إن وُجدت ليصبح الاشتراك نشطاً.' },
    ],
  },
  {
    id: 'record-attendance', role: 'owner', icon: 'pi-check-square',
    title: 'تسجيل حضور',
    description: 'سجّل دخول عضو إلى الصالة.',
    steps: [
      { route: '/owner/attendance', target: '[data-tour="attendance-checkin"]', title: 'تسجيل الدخول',
        text: 'اضغط زر تسجيل الحضور، ثم اختر العضو لتسجيل دخوله.', hint: 'اضغط الزر لبدء التسجيل' },
      { title: 'المتابعة', text: 'بعد الاختيار يُسجَّل وقت الدخول. يمكنك لاحقاً تسجيل الخروج من نفس الصف.' },
    ],
  },
  {
    id: 'payment-proof', role: 'owner', icon: 'pi-credit-card',
    title: 'رفع إثبات دفع',
    description: 'ادفع اشتراك صالتك في المنصة وارفع الإيصال.',
    steps: [
      { route: '/owner/subscription', target: '[data-tour="platform-plans"]', title: 'اختر الباقة',
        text: 'اضغط «عرض الباقات» أو «ترقية» لاختيار باقة المنصة، ثم «التالي».', hint: 'اضغط لاختيار باقة' },
      { title: 'حوّل المبلغ', text: 'اختر طريقة الدفع المعروضة وحوّل المبلغ المطلوب إليها.' },
      { title: 'ارفع الإيصال', text: 'ارفع صورة إثبات التحويل (أقل من 5 ميجابايت) واضغط «إرسال طلب الدفع». سيُراجَع ويُفعّل اشتراكك.' },
    ],
  },
];
