import { UserRole } from './models/auth.models';
import { getPanelTitle, getRoleLabel } from './role-labels';

describe('role labels', () => {
  it('keeps distinct labels for the existing back-office roles', () => {
    expect(getRoleLabel(UserRole.Owner)).toBe('مالك الصالة');
    expect(getRoleLabel(UserRole.Manager)).toBe('مدير');
    expect(getRoleLabel(UserRole.Receptionist)).toBe('استقبال');
    expect(getRoleLabel(UserRole.Accountant)).toBe('محاسب');
  });

  it('uses the existing workspace context for freelance wording', () => {
    expect(getRoleLabel(UserRole.Owner, 2)).toBe('مالك مساحة تدريب حر');
    expect(getRoleLabel(UserRole.Coach, 2)).toBe('مدرب حر');
    expect(getRoleLabel(UserRole.Trainer, 2)).toBe('مساعد مدرب حر');
  });

  it('does not change panel routing concepts while making titles complete', () => {
    expect(getPanelTitle(UserRole.Manager)).toBe('لوحة إدارة الصالة');
    expect(getPanelTitle(UserRole.Trainer)).toBe('لوحة المدرب المساعد');
    expect(getPanelTitle(UserRole.Client)).toBe('برنامجي التدريبي');
  });
});
