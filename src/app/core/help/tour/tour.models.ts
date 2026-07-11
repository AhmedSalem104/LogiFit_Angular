/** One spotlight step: navigates (optional), waits for the target, then highlights it. */
export interface TourStep {
  /** CSS selector of the element to spotlight. Omit for a centered info step. */
  target?: string;
  title: string;
  text: string;
  /** Navigate here before showing the step (waits for the target to appear). */
  route?: string;
  /** Extra hint (e.g. "اضغط الزر لفتح النافذة"). */
  hint?: string;
}

/** An ordered, guided spotlight walkthrough for a critical flow. */
export interface Tour {
  id: string;
  role: 'owner' | 'coach' | 'client';
  title: string;
  icon: string;
  description: string;
  steps: TourStep[];
}
