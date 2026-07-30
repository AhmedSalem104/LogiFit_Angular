import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [CommonModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PasswordFieldComponent), multi: true }],
  template: `<div class="password-field"><input [type]="visible ? 'text' : 'password'" [value]="value" [placeholder]="placeholder" [disabled]="disabled" (input)="onInput($event)" (blur)="onTouched()" /><button type="button" class="password-action" (click)="visible = !visible" [attr.aria-label]="visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"><i class="pi" [class.pi-eye]="!visible" [class.pi-eye-slash]="visible"></i></button><button type="button" class="password-action" (click)="copy()" aria-label="نسخ كلمة المرور"><i class="pi pi-copy"></i></button></div>`,
  styles: [`.password-field{display:flex;align-items:center;gap:.25rem;position:relative}.password-field input{flex:1;min-width:0}.password-action{border:0;background:transparent;color:var(--text-muted,#64748b);cursor:pointer;padding:.45rem}.password-action:hover{color:var(--primary-500,#3b82f6)}`]
})
export class PasswordFieldComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  value = '';
  visible = false;
  disabled = false;
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  writeValue(value: string | null): void { this.value = value || ''; }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }
  onInput(event: Event): void { this.value = (event.target as HTMLInputElement).value; this.onChange(this.value); }
  copy(): void { if (this.value) navigator.clipboard?.writeText(this.value); }
}
