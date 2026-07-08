import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from '../../core/auth/services/auth.service';
import { Permission } from '../../core/auth/models/auth.models';

/**
 * Structural directive that renders its content only when the current user holds
 * the required permission(s). Reactive to permission changes via signals.
 *
 * Usage:
 *   <button *appHasPermission="'ManageFinance'">إضافة فاتورة</button>
 *   <div *appHasPermission="['ManagePOS','ManageInventory']">...</div>   // ANY of them
 *   <div *appHasPermission="['ManageMembers','ManageCoaches']; mode: 'all'">...</div>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private auth = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);

  private required: Permission[] = [];
  private mode: 'any' | 'all' = 'any';
  private rendered = false;

  constructor() {
    // Re-evaluate whenever the permission signal changes.
    effect(() => {
      this.auth.permissions();
      this.update();
    });
  }

  @Input() set appHasPermission(value: Permission | Permission[]) {
    this.required = Array.isArray(value) ? value : [value];
    this.update();
  }

  @Input() set appHasPermissionMode(mode: 'any' | 'all') {
    this.mode = mode;
    this.update();
  }

  private allowed(): boolean {
    if (!this.required.length) return true;
    return this.mode === 'all'
      ? this.auth.hasAllPermissions(...this.required)
      : this.auth.hasAnyPermission(...this.required);
  }

  private update(): void {
    const show = this.allowed();
    if (show && !this.rendered) {
      this.vcr.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!show && this.rendered) {
      this.vcr.clear();
      this.rendered = false;
    }
  }
}
