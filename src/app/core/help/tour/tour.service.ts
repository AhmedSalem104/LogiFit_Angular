import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { TOURS } from './tours';
import { Tour, TourStep } from './tour.models';

@Injectable({ providedIn: 'root' })
export class TourService {
  private auth = inject(AuthService);

  private readonly activeTour = signal<Tour | null>(null);
  private readonly index = signal(0);

  readonly running = computed(() => !!this.activeTour());
  readonly stepIndex = this.index.asReadonly();
  readonly total = computed(() => this.activeTour()?.steps.length ?? 0);
  readonly currentStep = computed<TourStep | null>(() => {
    const t = this.activeTour();
    return t ? t.steps[this.index()] ?? null : null;
  });
  readonly isLast = computed(() => this.index() >= this.total() - 1);
  readonly isFirst = computed(() => this.index() === 0);

  /** Tours available to the signed-in user's role. */
  readonly availableTours = computed<Tour[]>(() => {
    if (!this.auth.isAuthenticated()) return [];
    const role = this.auth.isCoach() ? 'coach' : this.auth.isClient() ? 'client' : 'owner';
    return TOURS.filter(t => t.role === role);
  });

  start(tourId: string): void {
    const tour = TOURS.find(t => t.id === tourId);
    if (!tour) return;
    this.index.set(0);
    this.activeTour.set(tour);
  }

  next(): void {
    if (this.isLast()) { this.stop(); return; }
    this.index.update(i => i + 1);
  }

  prev(): void {
    if (!this.isFirst()) this.index.update(i => i - 1);
  }

  stop(): void {
    this.activeTour.set(null);
    this.index.set(0);
  }
}
