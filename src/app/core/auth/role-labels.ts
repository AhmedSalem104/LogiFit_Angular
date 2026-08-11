import { UserRole } from './models/auth.models';

/**
 * Presentation-only labels for the existing role model.
 *
 * `workspaceType === 2` is the existing FreelanceCoach workspace marker. It
 * changes the wording shown to the user, not the role, permissions, or panel
 * routing rules.
 */
export function getRoleLabel(role: UserRole | null | undefined, workspaceType?: number): string {
  switch (role) {
    case UserRole.Owner:
      return workspaceType === 2 ? 'مالك مساحة تدريب حر' : 'مالك الصالة';
    case UserRole.Manager:
      return 'مدير';
    case UserRole.Receptionist:
      return 'استقبال';
    case UserRole.Accountant:
      return 'محاسب';
    case UserRole.Coach:
      return workspaceType === 2 ? 'مدرب حر' : 'مدرب';
    case UserRole.Trainer:
      return workspaceType === 2 ? 'مساعد مدرب حر' : 'مدرب مساعد';
    case UserRole.Client:
      return 'عميل';
    default:
      return 'مستخدم';
  }
}

export function getPanelTitle(role: UserRole | null | undefined, workspaceType?: number): string {
  switch (role) {
    case UserRole.Owner:
      return workspaceType === 2 ? 'لوحة مساحة التدريب الحر' : 'لوحة تحكم المالك';
    case UserRole.Manager:
      return 'لوحة إدارة الصالة';
    case UserRole.Receptionist:
      return 'لوحة الاستقبال';
    case UserRole.Accountant:
      return 'لوحة الحسابات';
    case UserRole.Coach:
      return workspaceType === 2 ? 'لوحة المدرب الحر' : 'لوحة تحكم المدرب';
    case UserRole.Trainer:
      return 'لوحة المدرب المساعد';
    case UserRole.Client:
      return 'برنامجي التدريبي';
    default:
      return 'LogicFit';
  }
}
