// ==================== Tenant → Platform Billing Models ====================
// The gym's own subscription to the LogicFit platform (distinct from client gym subscriptions).

// ---- Enums (numeric, matching backend) ----
export enum TenantSubscriptionStatus {
  PendingPayment = 1, Trial = 2, Active = 3, PastDue = 4, Suspended = 5, Cancelled = 6, Expired = 7
}
export enum PaymentRequestStatus {
  Pending = 1, Approved = 2, Rejected = 3, Cancelled = 4, Expired = 5
}
export enum PaymentRequestOperation { NewSubscription = 1, Renew = 2, Upgrade = 3, Extend = 4 }
export enum SubscriptionInvoiceStatus {
  Unpaid = 1, PendingReview = 2, Paid = 3, Cancelled = 4, Overdue = 5
}
export enum BillingCycle {
  Monthly = 1, SemiAnnual = 2, Annual = 3
}

export type FeatureCode =
  | 'POS' | 'Inventory' | 'AdvancedReports' | 'MultiBranch' | 'WhiteLabel'
  | 'EmployeeManagement' | 'FinanceModule' | 'ClientMobileApp' | 'CustomDomain';

// ---- DTOs ----
export interface PlatformPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  durationInDays: number;
  maxMembers: number | null;   // null = unlimited
  maxCoaches: number | null;
  maxBranches: number | null;
  maxEmployees: number | null;
  maxStorageMB: number | null;
  isActive: boolean;
  displayOrder: number;
  features: FeatureCode[];
}

export interface UsageMetric {
  used: number;
  limit: number | null;  // null = unlimited
}

export interface MySubscription {
  hasSubscription: boolean;
  subscriptionId?: string;
  planId?: string;
  planName?: string;
  status?: TenantSubscriptionStatus;
  startDate?: string;
  endDate?: string;
  trialEndsAt?: string | null;
  remainingDays?: number;
  amount?: number;
  currency?: string;
  autoRenew?: boolean;
  features?: FeatureCode[];
  members?: UsageMetric;
  coaches?: UsageMetric;
  branches?: UsageMetric;
  employees?: UsageMetric;
}

export interface UsageSummary {
  members: UsageMetric;
  coaches: UsageMetric;
  branches: UsageMetric;
  employees: UsageMetric;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: SubscriptionInvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  paidAt?: string | null;
}

export interface PlatformPaymentMethod {
  id: string;
  name: string;
  type: string;              // e.g. "InstaPay", "BankTransfer", "Wallet"
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  walletNumber?: string;
  instructions?: string;
  qrImageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface TenantSubscriptionSummary {
  subscriptionId: string;
  planId: string;
  planName: string;
  status: TenantSubscriptionStatus;
  amount: number;
  currency: string;
}

export interface PaymentRequest {
  id: string;
  tenantId: string;
  planId: string;
  planName: string;
  tenantSubscriptionId: string;
  operation: PaymentRequestOperation;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  transactionNumber?: string;
  paymentDate?: string;
  proofFileUrl?: string;
  notes?: string | null;
  status: PaymentRequestStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  createdAt: string;
}

export interface CreatePaymentRequestForm {
  planId: string;
  proof?: File;
  paymentMethodId?: string;
  transactionNumber?: string;
  paymentDate?: string;
  notes?: string;
  operation?: PaymentRequestOperation;
  extensionDays?: number;
}

// ---- Display helpers ----
export const TENANT_SUB_STATUS_AR: Record<TenantSubscriptionStatus, string> = {
  [TenantSubscriptionStatus.PendingPayment]: 'بانتظار الدفع',
  [TenantSubscriptionStatus.Trial]: 'تجريبي',
  [TenantSubscriptionStatus.Active]: 'نشط',
  [TenantSubscriptionStatus.PastDue]: 'متأخر',
  [TenantSubscriptionStatus.Suspended]: 'موقوف',
  [TenantSubscriptionStatus.Cancelled]: 'ملغي',
  [TenantSubscriptionStatus.Expired]: 'منتهي'
};

export const PAYMENT_REQUEST_STATUS_AR: Record<PaymentRequestStatus, string> = {
  [PaymentRequestStatus.Pending]: 'قيد المراجعة',
  [PaymentRequestStatus.Approved]: 'مقبول',
  [PaymentRequestStatus.Rejected]: 'مرفوض',
  [PaymentRequestStatus.Cancelled]: 'ملغي',
  [PaymentRequestStatus.Expired]: 'منتهي'
};

export const INVOICE_STATUS_AR: Record<SubscriptionInvoiceStatus, string> = {
  [SubscriptionInvoiceStatus.Unpaid]: 'غير مدفوعة',
  [SubscriptionInvoiceStatus.PendingReview]: 'قيد المراجعة',
  [SubscriptionInvoiceStatus.Paid]: 'مدفوعة',
  [SubscriptionInvoiceStatus.Cancelled]: 'ملغاة',
  [SubscriptionInvoiceStatus.Overdue]: 'متأخرة'
};

export const BILLING_CYCLE_AR: Record<BillingCycle, string> = {
  [BillingCycle.Monthly]: 'شهري',
  [BillingCycle.Quarterly]: 'ربع سنوي',
  [BillingCycle.Annual]: 'سنوي'
};

export const FEATURE_AR: Record<FeatureCode, string> = {
  POS: 'نقطة البيع',
  Inventory: 'المخزون',
  AdvancedReports: 'تقارير متقدمة',
  MultiBranch: 'تعدد الفروع',
  WhiteLabel: 'العلامة البيضاء',
  EmployeeManagement: 'إدارة الموظفين',
  FinanceModule: 'الوحدة المالية',
  ClientMobileApp: 'تطبيق العملاء',
  CustomDomain: 'دومين مخصص'
};
