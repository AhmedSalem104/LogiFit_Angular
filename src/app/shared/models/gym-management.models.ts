// ============================================================================
// GYM MANAGEMENT MODELS — LogicFit Phases 1-9
// All interfaces & enums for the 25 new API modules
// ============================================================================

// ==================== 1. BRANCHES ====================
export interface Branch {
  id: string;
  tenantId?: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  isDefault: boolean;
  capacity?: number;
  openTime?: string;
  closeTime?: string;
  managerId?: string | null;
  managerName?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  operatingHours?: OperatingHour[];
  activeClientsCount?: number;
  todayCheckInsCount?: number;
}

export interface OperatingHour {
  id?: string;
  dayOfWeek: number; // 0=Sunday..6=Saturday
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface CreateBranchRequest {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phoneNumber?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  isDefault?: boolean;
  capacity?: number;
  openTime?: string;
  closeTime?: string;
  managerId?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
}
export type UpdateBranchRequest = CreateBranchRequest;

export interface SetOperatingHoursRequest {
  hours: OperatingHour[];
}

// ==================== 2. MEMBERSHIP CARDS ====================
export interface MembershipCard {
  id: string;
  clientId: string;
  clientName?: string;
  cardNumber: string;
  qrCode: string;
  isActive: boolean;
  issuedAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revokedReason?: string | null;
  isExpired: boolean;
}

export interface IssueCardRequest {
  clientId: string;
  expiresAt?: string | null;
  cardNumber?: string | null;
}

export interface RevokeCardRequest {
  reason: string;
}

// ==================== 3. GATE ACCESS ====================
export enum GateDenyReason {
  None = 0,
  NoActiveSubscription = 1,
  SessionsPerWeekExceeded = 2,
  BranchCapacityFull = 3,
  OutsideOperatingHours = 4,
  SubscriptionFrozen = 5,
  SubscriptionExpired = 6,
  AlreadyCheckedIn = 7,
  CardInactive = 8,
  CardExpired = 9,
  BranchAccessDenied = 10,
  ClientNotFound = 11,
  BranchInactive = 12
}

export enum GateAccessResult { Granted = 1, Denied = 2 }
export enum GateAccessMethod { Manual = 1, Qr = 2, Card = 3, Face = 4, Fingerprint = 5 }

export interface GateAccessResponse {
  granted: boolean;
  message: string;
  attendanceId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  branchId?: string | null;
  denyReason: GateDenyReason;
}

export interface CheckInQrRequest {
  qrCode: string;
  branchId?: string | null;
}

export interface GateAccessLog {
  id: string;
  clientId?: string | null;
  clientName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  result: GateAccessResult;
  resultName?: string;
  method: GateAccessMethod;
  methodName?: string;
  denyReason?: GateDenyReason;
  denyReasonName?: string;
  occurredAt: string;
  notes?: string | null;
}

// ==================== 4. ROOMS ====================
export enum RoomType {
  Cardio = 1, Weights = 2, FreeWeights = 3, Studio = 4, Cycling = 5,
  Crossfit = 6, Pool = 7, Boxing = 8, Stretching = 9, LockerRoom = 10,
  Reception = 11, Other = 99
}

export interface Room {
  id: string;
  branchId: string;
  branchName?: string;
  name: string;
  type: RoomType;
  typeName?: string;
  capacity?: number;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface CreateRoomRequest {
  branchId: string;
  name: string;
  type: RoomType;
  capacity?: number;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}
export type UpdateRoomRequest = CreateRoomRequest;

// ==================== 5. EQUIPMENT ====================
export enum EquipmentStatus { Active = 1, UnderMaintenance = 2, OutOfService = 3, Retired = 4 }

export interface Equipment {
  id: string;
  branchId: string;
  branchName?: string;
  roomId?: string | null;
  roomName?: string | null;
  name: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  category?: string;
  purchaseDate?: string | null;
  purchasePrice?: number;
  status: EquipmentStatus;
  statusName?: string;
  warrantyUntil?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
  openMaintenanceCount?: number;
}

export interface CreateEquipmentRequest {
  branchId: string;
  roomId?: string | null;
  name: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  category?: string;
  purchaseDate?: string | null;
  purchasePrice?: number;
  status?: EquipmentStatus;
  warrantyUntil?: string | null;
  imageUrl?: string | null;
  notes?: string | null;
}
export type UpdateEquipmentRequest = CreateEquipmentRequest;

export interface ChangeEquipmentStatusRequest {
  status: EquipmentStatus;
  notes?: string;
}

// ==================== 6. MAINTENANCE ====================
export enum MaintenanceStatus { Pending = 1, InProgress = 2, Completed = 3, Cancelled = 4 }

export interface MaintenanceTicket {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  issueDate: string;
  resolvedDate?: string | null;
  cost?: number;
  description: string;
  technicianName?: string | null;
  technicianContact?: string | null;
  status: MaintenanceStatus;
  statusName?: string;
  resolutionNotes?: string | null;
  durationDays?: number | null;
}

export interface CreateMaintenanceRequest {
  equipmentId: string;
  issueDate: string;
  description: string;
  technicianName?: string | null;
  technicianContact?: string | null;
  cost?: number;
  putEquipmentUnderMaintenance?: boolean;
}

export interface ResolveMaintenanceRequest {
  resolutionNotes?: string;
  finalCost?: number;
  reactivateEquipment?: boolean;
}

// ==================== 7-8. EXPENSES ====================
export enum PaymentMethodEnum { Cash = 1, Card = 2, Bank = 3, Wallet = 4 }

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  isActive: boolean;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isActive?: boolean;
}
export type UpdateExpenseCategoryRequest = CreateExpenseCategoryRequest;

export interface Expense {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  categoryId: string;
  categoryName?: string;
  amount: number;
  expenseDate: string;
  description: string;
  vendorName?: string | null;
  paymentMethod: PaymentMethodEnum;
  paymentMethodName?: string;
  receiptImageUrl?: string | null;
  referenceNumber?: string | null;
}

export interface CreateExpenseRequest {
  branchId?: string | null;
  categoryId: string;
  amount: number;
  expenseDate: string;
  description: string;
  vendorName?: string | null;
  paymentMethod: PaymentMethodEnum;
  receiptImageUrl?: string | null;
  referenceNumber?: string | null;
}
export type UpdateExpenseRequest = CreateExpenseRequest;

// ==================== 9. INVOICES ====================
export enum InvoiceStatus {
  Draft = 1, Issued = 2, PartiallyPaid = 3, Paid = 4, Overdue = 5, Cancelled = 6
}

export enum InvoiceItemType {
  Subscription = 1, Product = 2, Class = 3, PersonalTraining = 4, Manual = 5, Other = 99
}

export interface InvoiceItem {
  id?: string;
  itemType: InvoiceItemType;
  itemTypeName?: string;
  referenceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountAmount?: number;
  lineTotal?: number;
}

export interface InvoicePaymentSummary {
  id: string;
  amount: number;
  method: PaymentMethodEnum;
  methodName?: string;
  receivedAt: string;
  receiptNumber?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId?: string | null;
  clientName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  issueDate: string;
  dueDate?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  remainingAmount: number;
  status: InvoiceStatus;
  statusName?: string;
  couponId?: string | null;
  couponCode?: string | null;
  notes?: string | null;
  pdfUrl?: string | null;
  items?: InvoiceItem[];
  payments?: InvoicePaymentSummary[];
}

export interface CreateInvoiceRequest {
  clientId?: string | null;
  branchId?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  couponId?: string | null;
  notes?: string | null;
  issueImmediately?: boolean;
  items: InvoiceItem[];
}

export interface CancelInvoiceRequest { reason: string }

// ==================== 10. PAYMENTS ====================
export interface Payment {
  id: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  subscriptionId?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  amount: number;
  method: PaymentMethodEnum;
  methodName?: string;
  receivedAt: string;
  receiptNumber?: string;
  notes?: string | null;
  referenceNumber?: string | null;
}

export interface CreatePaymentRequest {
  invoiceId?: string | null;
  subscriptionId?: string | null;
  clientId?: string | null;
  branchId?: string | null;
  amount: number;
  method: PaymentMethodEnum;
  receivedAt?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  referenceNumber?: string | null;
}

// ==================== 11. COUPONS ====================
export enum DiscountType { Percentage = 1, Fixed = 2 }
export enum CouponApplicability {
  All = 1, Subscriptions = 2, Products = 3, Classes = 4, PersonalTraining = 5
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountTypeName?: string;
  discountValue: number;
  minimumAmount?: number;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerUser?: number;
  usedCount?: number;
  startDate?: string | null;
  endDate?: string | null;
  applicableTo: CouponApplicability;
  applicableToName?: string;
  isActive: boolean;
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minimumAmount?: number;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
  maxUsesPerUser?: number;
  startDate?: string | null;
  endDate?: string | null;
  applicableTo: CouponApplicability;
  isActive?: boolean;
}
export type UpdateCouponRequest = CreateCouponRequest;

export interface CouponValidation {
  isValid: boolean;
  errorMessage?: string | null;
  estimatedDiscount: number;
  coupon?: Coupon;
}

// ==================== 12. TAX SETTINGS ====================
export interface TaxSetting {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string | null;
}

export interface CreateTaxRequest {
  name: string;
  rate: number;
  isDefault?: boolean;
  isActive?: boolean;
  description?: string | null;
}
export type UpdateTaxRequest = CreateTaxRequest;

// ==================== 13. GROUP CLASSES ====================
export interface GroupClass {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  name: string;
  description?: string | null;
  category?: string;
  durationMinutes: number;
  capacity: number;
  color?: string;
  imageUrl?: string | null;
  price?: number;
  isActive: boolean;
}

export interface CreateGroupClassRequest {
  branchId?: string | null;
  name: string;
  description?: string | null;
  category?: string;
  durationMinutes: number;
  capacity: number;
  color?: string;
  imageUrl?: string | null;
  price?: number;
  isActive?: boolean;
}
export type UpdateGroupClassRequest = CreateGroupClassRequest;

// ==================== 14. CLASS SCHEDULES & ENROLLMENTS ====================
export enum RecurrencePattern { None = 0, Daily = 1, Weekly = 2, Monthly = 3 }
export enum ClassEnrollmentStatus {
  Booked = 1, Attended = 2, Cancelled = 3, NoShow = 4, Waitlist = 5
}

export interface ClassSchedule {
  id: string;
  groupClassId: string;
  groupClassName?: string;
  color?: string;
  coachId?: string | null;
  coachName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  startTime: string;
  endTime: string;
  recurrencePattern: RecurrencePattern;
  recurrenceDaysOfWeek?: string | null;
  recurrenceEndDate?: string | null;
  overrideCapacity?: number | null;
  effectiveCapacity: number;
  bookedCount: number;
  waitlistCount: number;
  isFull: boolean;
  isCancelled: boolean;
  cancellationReason?: string | null;
}

export interface CreateScheduleRequest {
  groupClassId: string;
  coachId?: string | null;
  roomId?: string | null;
  startTime: string;
  endTime: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceDaysOfWeek?: string | null;
  recurrenceEndDate?: string | null;
  overrideCapacity?: number | null;
}

export interface ClassEnrollment {
  id: string;
  scheduleId: string;
  clientId: string;
  clientName?: string;
  enrolledAt: string;
  status: ClassEnrollmentStatus;
  statusName?: string;
  waitlistPosition?: number | null;
  cancellationReason?: string | null;
}

export interface BookClassRequest { clientId: string }
export interface CancelEnrollmentRequest { reason: string }
export interface CancelScheduleRequest { reason: string }

// ==================== 15-16. PRODUCTS ====================
export interface ProductCategory {
  id: string;
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface CreateProductCategoryRequest {
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}
export type UpdateProductCategoryRequest = CreateProductCategoryRequest;

export interface Product {
  id: string;
  categoryId?: string | null;
  categoryName?: string | null;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  costPrice: number;
  sellingPrice: number;
  taxRate?: number;
  unit?: string;
  imageUrl?: string | null;
  isActive: boolean;
  minStockLevel?: number;
  trackStock: boolean;
  totalStock?: number;
  isLowStock?: boolean;
}

export interface CreateProductRequest {
  categoryId?: string | null;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  costPrice: number;
  sellingPrice: number;
  taxRate?: number;
  unit?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  minStockLevel?: number;
  trackStock?: boolean;
}
export type UpdateProductRequest = CreateProductRequest;

// ==================== 17. STOCK ====================
export enum StockMovementType { In = 1, Out = 2, Adjustment = 3, Transfer = 4 }

export interface StockItem {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  branchId: string;
  branchName?: string;
  quantity: number;
  minStockLevel?: number;
  isLowStock?: boolean;
  lastMovementAt?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  branchId: string;
  branchName?: string;
  type: StockMovementType;
  typeName?: string;
  quantity: number;
  reason?: string;
  referenceId?: string | null;
  createdAt: string;
  createdByName?: string;
}

export interface AdjustStockRequest {
  productId: string;
  branchId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
}

export interface TransferStockRequest {
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  reason?: string;
}

// ==================== 18. SUPPLIERS ====================
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
  isActive: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
  isActive?: boolean;
}
export type UpdateSupplierRequest = CreateSupplierRequest;

// ==================== 19. SALES / POS ====================
export interface SaleItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPriceOverride?: number | null;
  unitPrice?: number;
  discountAmount?: number;
  lineTotal?: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  branchId: string;
  branchName?: string;
  clientId?: string | null;
  clientName?: string | null;
  cashierId?: string;
  cashierName?: string;
  paymentMethod: PaymentMethodEnum;
  paymentMethodName?: string;
  couponId?: string | null;
  couponCode?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  extraDiscount?: number;
  total: number;
  createdAt: string;
  notes?: string;
  items?: SaleItem[];
}

export interface CheckoutRequest {
  branchId: string;
  clientId?: string | null;
  paymentMethod: PaymentMethodEnum;
  couponId?: string | null;
  extraDiscount?: number;
  notes?: string;
  items: SaleItem[];
}

// ==================== 20. EMPLOYEES ====================
export enum SalaryType { Monthly = 1, Hourly = 2, Daily = 3 }
export enum EmployeeRole { Owner = 1, Coach = 2, Client = 3, Manager = 4, Receptionist = 5, Accountant = 6, Trainer = 7 }

export interface Employee {
  id: string;
  userId: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role: EmployeeRole;
  roleName?: string;
  employeeCode: string;
  jobTitle: string;
  department?: string;
  joinDate: string;
  terminationDate?: string | null;
  baseSalary: number;
  salaryType: SalaryType;
  salaryTypeName?: string;
  hourlyRate?: number | null;
  bankAccount?: string;
  bankName?: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  qualifications?: string;
  branchIds?: string[];
  branchNames?: string[];
  isActive: boolean;
}

export interface CreateEmployeeRequest {
  userId: string;
  employeeCode: string;
  jobTitle: string;
  department?: string;
  joinDate: string;
  baseSalary: number;
  salaryType: SalaryType;
  hourlyRate?: number | null;
  bankAccount?: string;
  bankName?: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  qualifications?: string;
  branchIds?: string[];
}
export type UpdateEmployeeRequest = CreateEmployeeRequest;

export interface TerminateEmployeeRequest {
  terminationDate?: string | null;
  reason?: string;
}

// ==================== 21. SHIFTS ====================
export interface Shift {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  name: string;
  startTime: string;
  endTime: string;
  color?: string;
  isActive: boolean;
}

export interface CreateShiftRequest {
  branchId?: string | null;
  name: string;
  startTime: string;
  endTime: string;
  color?: string;
  isActive?: boolean;
}
export type UpdateShiftRequest = CreateShiftRequest;

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  shiftName?: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  notes?: string | null;
}

export interface AssignShiftRequest {
  shiftId: string;
  employeeId: string;
  date: string;
  notes?: string | null;
}

// ==================== 22. LEAVES ====================
export enum LeaveType { Annual = 1, Sick = 2, Unpaid = 3, Maternity = 4, Emergency = 5, Other = 99 }
export enum LeaveStatus { Pending = 1, Approved = 2, Rejected = 3, Cancelled = 4 }

export interface Leave {
  id: string;
  employeeId: string;
  employeeName?: string;
  fromDate: string;
  toDate: string;
  durationDays: number;
  leaveType: LeaveType;
  leaveTypeName?: string;
  reason?: string;
  status: LeaveStatus;
  statusName?: string;
  reviewedById?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}

export interface CreateLeaveRequest {
  employeeId: string;
  fromDate: string;
  toDate: string;
  leaveType: LeaveType;
  reason?: string;
}

export interface ReviewLeaveRequest {
  decision: LeaveStatus; // 2=Approved, 3=Rejected
  notes?: string;
}

// ==================== 23. COMMISSIONS ====================
export enum CommissionSourceType { SubscriptionSale = 1, ProductSale = 2, PersonalTraining = 3, Manual = 99 }
export enum CommissionStatus { Pending = 1, Approved = 2, Paid = 3, Cancelled = 4 }
export enum CommissionRuleType { Percentage = 1, Fixed = 2 }

export interface Commission {
  id: string;
  employeeId: string;
  employeeName?: string;
  sourceType: CommissionSourceType;
  sourceTypeName?: string;
  referenceId?: string | null;
  amount: number;
  sourceAmount?: number;
  earnedDate: string;
  status: CommissionStatus;
  statusName?: string;
  payrollItemId?: string | null;
  description?: string;
}

export interface CommissionRule {
  id: string;
  employeeId?: string | null;
  employeeName?: string | null;
  role?: EmployeeRole | null;
  roleName?: string;
  sourceType: CommissionSourceType;
  sourceTypeName?: string;
  type: CommissionRuleType;
  typeName?: string;
  value: number;
  minAmount?: number | null;
  isActive: boolean;
}

export interface CreateCommissionRuleRequest {
  employeeId?: string | null;
  role?: EmployeeRole | null;
  sourceType: CommissionSourceType;
  type: CommissionRuleType;
  value: number;
  minAmount?: number | null;
  isActive?: boolean;
}
export type UpdateCommissionRuleRequest = CreateCommissionRuleRequest;

// ==================== 24. PAYROLL ====================
export enum PayrollStatus { Draft = 1, Approved = 2, Paid = 3, Cancelled = 4 }

export interface PayrollItem {
  id: string;
  employeeId: string;
  employeeName?: string;
  baseSalary: number;
  commissionTotal: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  paidAt?: string | null;
  notes?: string | null;
}

export interface PayrollRun {
  id: string;
  branchId?: string | null;
  branchName?: string | null;
  month: number;
  year: number;
  status: PayrollStatus;
  statusName?: string;
  totalAmount: number;
  approvedAt?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  itemsCount: number;
  items?: PayrollItem[];
}

export interface GeneratePayrollRequest {
  month: number;
  year: number;
  branchId?: string | null;
}

export interface UpdatePayrollItemRequest {
  bonus?: number;
  deductions?: number;
  notes?: string;
}

// ==================== 25. OPERATIONS REPORTS ====================
export interface BranchKpi {
  branchId: string;
  branchName: string;
  capacity: number;
  currentlyInside: number;
  todayCheckIns: number;
  activeMembers: number;
  capacityUsagePercent: number;
}

export interface OperationsDashboard {
  activeMembers: number;
  todayCheckIns: number;
  currentlyInsideCount: number;
  expiringSubscriptionsIn7Days: number;
  expiredSubscriptions: number;
  monthRevenue: number;
  monthExpenses: number;
  monthNetProfit: number;
  todayRevenue: number;
  todayExpenses: number;
  lowStockProductsCount: number;
  equipmentUnderMaintenanceCount: number;
  pendingLeaveRequestsCount: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;
  branchKpis: BranchKpi[];
}

export interface ExpensesReport {
  totalExpenses: number;
  expensesCount: number;
  byCategory: { categoryId: string; categoryName: string; total: number; count: number }[];
  byBranch: { branchId: string; branchName: string; total: number; count: number }[];
  byMonth: { month: string; total: number; count: number }[];
}

export interface PosSalesReport {
  totalRevenue: number;
  salesCount: number;
  itemsSold: number;
  topProducts: { productId: string; productName: string; quantitySold: number; revenue: number }[];
  byCashier: { cashierId: string; cashierName: string; salesCount: number; revenue: number }[];
  byBranch: { branchId: string; branchName: string; salesCount: number; revenue: number }[];
  byPaymentMethod: { method: string; count: number; total: number }[];
}

export interface StockValuationReport {
  totalCostValue: number;
  totalRetailValue: number;
  potentialProfit: number;
  productsCount: number;
  lowStockCount: number;
  products: { productId: string; productName: string; sku: string; quantity: number; costValue: number; retailValue: number }[];
}

export interface PayrollSummaryReport {
  totalBaseSalaries: number;
  totalCommissions: number;
  totalBonuses: number;
  totalDeductions: number;
  totalNetSalaries: number;
  employeesPaid: number;
  pendingCommissionsCount: number;
  pendingCommissionsAmount: number;
  byBranch: { branchId: string; branchName: string; total: number; employees: number }[];
}

export interface ClassAttendanceReport {
  totalSchedulesHeld: number;
  totalBookings: number;
  totalAttended: number;
  attendanceRatePercent: number;
  averageFillRatePercent: number;
  topClasses: { classId: string; className: string; bookingsCount: number; attendanceRate: number }[];
  coachStats: { coachId: string; coachName: string; classesHeld: number; totalAttendance: number }[];
}

export interface EquipmentUtilizationReport {
  totalEquipment: number;
  activeCount: number;
  underMaintenanceCount: number;
  totalMaintenanceCost: number;
  mostCostlyEquipment: { equipmentId: string; equipmentName: string; totalCost: number; ticketsCount: number }[];
  byBranch: { branchId: string; branchName: string; total: number; active: number; underMaintenance: number }[];
}

export interface BranchComparisonReport {
  branches: {
    branchId: string;
    branchName: string;
    revenue: number;
    expenses: number;
    netProfit: number;
    checkIns: number;
    classesHeld: number;
    employees: number;
    activeMembers: number;
  }[];
}

export interface CommissionsReport {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  commissionsCount: number;
  byEmployee: { employeeId: string; employeeName: string; total: number; count: number }[];
  bySource: { source: string; total: number; count: number }[];
}

// ==================== Label helpers ====================
export const GateDenyReasonLabels: Record<number, string> = {
  0: '-',
  1: 'لا يوجد اشتراك نشط',
  2: 'تجاوز الحصص الأسبوعية',
  3: 'الفرع ممتلئ',
  4: 'خارج ساعات العمل',
  5: 'الاشتراك مجمد',
  6: 'الاشتراك منتهي',
  7: 'تم تسجيل الدخول بالفعل',
  8: 'البطاقة غير نشطة',
  9: 'البطاقة منتهية',
  10: 'لا يوجد صلاحية للفرع',
  11: 'العميل غير موجود',
  12: 'الفرع غير نشط'
};

export const RoomTypeLabels: Record<number, string> = {
  1: 'كارديو', 2: 'أوزان', 3: 'أوزان حرة', 4: 'ستوديو', 5: 'دراجات',
  6: 'كروس فيت', 7: 'سباحة', 8: 'ملاكمة', 9: 'استطالة', 10: 'غرفة تبديل',
  11: 'استقبال', 99: 'أخرى'
};

export const EquipmentStatusLabels: Record<number, string> = {
  1: 'نشط', 2: 'تحت الصيانة', 3: 'خارج الخدمة', 4: 'متقاعد'
};

export const MaintenanceStatusLabels: Record<number, string> = {
  1: 'معلقة', 2: 'قيد التنفيذ', 3: 'مكتملة', 4: 'ملغاة'
};

export const InvoiceStatusLabels: Record<number, string> = {
  1: 'مسودة', 2: 'مُصدرة', 3: 'دفع جزئي', 4: 'مدفوعة', 5: 'متأخرة', 6: 'ملغاة'
};

export const InvoiceItemTypeLabels: Record<number, string> = {
  1: 'اشتراك', 2: 'منتج', 3: 'حصة', 4: 'تدريب شخصي', 5: 'يدوي', 99: 'أخرى'
};

export const PaymentMethodGymLabels: Record<number, string> = {
  1: 'كاش', 2: 'بطاقة', 3: 'تحويل بنكي', 4: 'محفظة'
};

export const DiscountTypeLabels: Record<number, string> = { 1: 'نسبة', 2: 'ثابت' };
export const CouponApplicabilityLabels: Record<number, string> = {
  1: 'الكل', 2: 'اشتراكات', 3: 'منتجات', 4: 'حصص', 5: 'تدريب شخصي'
};

export const StockMovementTypeLabels: Record<number, string> = {
  1: 'وارد', 2: 'صادر', 3: 'تعديل', 4: 'نقل'
};

export const SalaryTypeLabels: Record<number, string> = {
  1: 'شهري', 2: 'بالساعة', 3: 'يومي'
};

export const LeaveTypeLabels: Record<number, string> = {
  1: 'سنوية', 2: 'مرضية', 3: 'بدون راتب', 4: 'وضع', 5: 'طارئة', 99: 'أخرى'
};

export const LeaveStatusLabels: Record<number, string> = {
  1: 'معلقة', 2: 'موافق عليها', 3: 'مرفوضة', 4: 'ملغاة'
};

export const CommissionSourceTypeLabels: Record<number, string> = {
  1: 'بيع اشتراك', 2: 'بيع منتج', 3: 'تدريب شخصي', 99: 'يدوي'
};

export const CommissionStatusLabels: Record<number, string> = {
  1: 'معلقة', 2: 'موافق عليها', 3: 'مدفوعة', 4: 'ملغاة'
};

export const CommissionRuleTypeLabels: Record<number, string> = { 1: 'نسبة', 2: 'ثابت' };

export const PayrollStatusLabels: Record<number, string> = {
  1: 'مسودة', 2: 'موافق عليها', 3: 'مدفوعة', 4: 'ملغاة'
};

export const ClassEnrollmentStatusLabels: Record<number, string> = {
  1: 'محجوزة', 2: 'حضر', 3: 'ملغاة', 4: 'لم يحضر', 5: 'قائمة انتظار'
};

export const RecurrencePatternLabels: Record<number, string> = {
  0: 'بدون', 1: 'يومي', 2: 'أسبوعي', 3: 'شهري'
};

export const EmployeeRoleLabels: Record<number, string> = {
  1: 'مالك', 2: 'مدرب', 3: 'عميل', 4: 'مدير', 5: 'موظف استقبال', 6: 'محاسب', 7: 'مدرب'
};

export const DayOfWeekLabels: Record<number, string> = {
  0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
  4: 'الخميس', 5: 'الجمعة', 6: 'السبت'
};
