import { Injectable, computed, signal } from '@angular/core';
import {
  TenantStatusCode, TenantStatusInfo, tenantStatusInfo, isTenantStatusCode
} from './tenant-status';

/**
 * Holds the current tenant-access state surfaced by the backend gates.
 *
 * - `block`      → the gym is blocked (suspended/expired/archived); UI shows the
 *                  status screen (/gym-unavailable).
 * - `onboarding` → the gym is PendingApproval; the UI is restricted to the
 *                  billing/onboarding screens until the admin approves it.
 */
@Injectable({ providedIn: 'root' })
export class TenantStatusService {
  private readonly blockSig = signal<TenantStatusInfo | null>(null);
  private readonly onboardingSig = signal<boolean>(false);

  /** The active block (null when the gym is accessible). */
  readonly block = this.blockSig.asReadonly();
  /** True while the gym is pending approval (billing-only mode). */
  readonly onboarding = this.onboardingSig.asReadonly();
  /** True when any tenant gate is active (block or onboarding). */
  readonly isGated = computed(() => !!this.blockSig() || this.onboardingSig());

  /** Record a blocking tenant code (suspended / expired / archived / cancelled). */
  setBlock(code: TenantStatusCode): void {
    this.onboardingSig.set(false);
    this.blockSig.set(tenantStatusInfo(code));
  }

  /** Enter billing-only onboarding mode (PendingApproval). */
  setOnboarding(): void {
    this.blockSig.set(null);
    this.onboardingSig.set(true);
  }

  /** Resolve a raw code string to its info without mutating state (safe lookup). */
  resolve(code: string | null | undefined): TenantStatusInfo | null {
    return isTenantStatusCode(code) ? tenantStatusInfo(code) : null;
  }

  /** Clear all tenant gates (on successful login to a healthy gym / logout). */
  clear(): void {
    this.blockSig.set(null);
    this.onboardingSig.set(false);
  }
}
