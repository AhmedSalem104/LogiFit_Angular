/**
 * Tenant Access Gates — typed error codes returned by the backend when a gym
 * (tenant) is suspended, expired, archived, pending approval, etc.
 *
 * Every protected request may suddenly return one of these codes (the token can
 * have been issued BEFORE the gym was blocked). The error contract is:
 *   { statusCode, code, message, errors }
 * where `code` is the contract to switch on — `message` is only a fallback.
 *
 * See docs: FRONTEND_TENANT_ACCESS_GUIDE.md
 */

export type TenantStatusCode =
  | 'TENANT_SUSPENDED'
  | 'TENANT_SUSPENDED_NONPAYMENT'
  | 'TENANT_SUBSCRIPTION_EXPIRED'
  | 'TENANT_SUBSCRIPTION_CANCELLED'
  | 'TENANT_SUBSCRIPTION_SUSPENDED'
  | 'TENANT_ARCHIVED'
  | 'TENANT_NOT_FOUND'
  | 'TENANT_PENDING_APPROVAL';

/** How the frontend should react to a given tenant code. */
export type TenantStatusKind =
  | 'billing'    // 402 — payment/subscription problem → renew/pay screen
  | 'blocked'    // 403 — suspended/archived → status screen + logout
  | 'onboarding' // 403 PENDING_APPROVAL — restrict UI to billing/onboarding, no logout
  | 'notfound';  // 404 — wrong gym code (login only)

export interface TenantStatusInfo {
  code: TenantStatusCode;
  kind: TenantStatusKind;
  /** Localized title shown on the status screen. */
  title: string;
  /** Localized descriptive message. */
  message: string;
  /** PrimeNG icon class for the status screen. */
  icon: string;
  /** Whether the session must be cleared (logout). */
  logout: boolean;
}

const CATALOG: Record<TenantStatusCode, Omit<TenantStatusInfo, 'code'>> = {
  TENANT_SUSPENDED: {
    kind: 'blocked',
    title: 'تم إيقاف الصالة',
    message: 'تم إيقاف صالتك من قبل الإدارة. يرجى التواصل مع الدعم لمعرفة التفاصيل.',
    icon: 'pi pi-ban',
    logout: true,
  },
  TENANT_SUSPENDED_NONPAYMENT: {
    kind: 'billing',
    title: 'الاشتراك متوقف لعدم السداد',
    message: 'تم إيقاف الاشتراك بسبب عدم سداد المستحقات. يرجى تجديد الاشتراك لاستعادة الوصول.',
    icon: 'pi pi-credit-card',
    logout: false,
  },
  TENANT_SUBSCRIPTION_EXPIRED: {
    kind: 'billing',
    title: 'انتهى الاشتراك',
    message: 'انتهت مدة اشتراك صالتك. يرجى التجديد للاستمرار في استخدام النظام.',
    icon: 'pi pi-calendar-times',
    logout: false,
  },
  TENANT_SUBSCRIPTION_CANCELLED: {
    kind: 'billing',
    title: 'تم إلغاء الاشتراك',
    message: 'تم إلغاء اشتراك صالتك. يرجى التجديد أو التواصل مع الدعم.',
    icon: 'pi pi-times-circle',
    logout: false,
  },
  TENANT_SUBSCRIPTION_SUSPENDED: {
    kind: 'billing',
    title: 'الاشتراك موقوف',
    message: 'اشتراك صالتك موقوف حالياً. يرجى التجديد لاستعادة الوصول.',
    icon: 'pi pi-pause-circle',
    logout: false,
  },
  TENANT_ARCHIVED: {
    kind: 'blocked',
    title: 'الصالة غير متاحة',
    message: 'هذه الصالة غير متاحة حالياً. يرجى التواصل مع الدعم.',
    icon: 'pi pi-inbox',
    logout: true,
  },
  TENANT_NOT_FOUND: {
    kind: 'notfound',
    title: 'كود الصالة غير صحيح',
    message: 'لا توجد صالة بهذا المعرّف. تأكد من كتابة معرّف الصالة بشكل صحيح.',
    icon: 'pi pi-question-circle',
    logout: false,
  },
  TENANT_PENDING_APPROVAL: {
    kind: 'onboarding',
    title: 'بانتظار الموافقة',
    message: 'صالتك مُسجّلة وبانتظار موافقة الإدارة. أكمل خطوات الاشتراك ورفع إثبات الدفع.',
    icon: 'pi pi-hourglass',
    logout: false,
  },
};

/** True if the code is a tenant-access gate code (starts with TENANT_). */
export function isTenantStatusCode(code: unknown): code is TenantStatusCode {
  return typeof code === 'string' && code.startsWith('TENANT_') && code in CATALOG;
}

/** Resolve a code (from `error.error.code` or a query param) to its display info. */
export function tenantStatusInfo(code: TenantStatusCode): TenantStatusInfo {
  return { code, ...CATALOG[code] };
}
