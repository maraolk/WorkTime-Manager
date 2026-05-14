import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const STRICT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const EMAIL_RULE_MESSAGE = 'Enter a valid email address, for example name@example.com.';
export const PASSWORD_RULE_MESSAGE =
  'Use at least 8 characters with uppercase, lowercase and a number.';

export function isStrictEmail(email: string): boolean {
  return STRICT_EMAIL_PATTERN.test(email.trim());
}

export function isStrongPassword(password: string): boolean {
  return STRONG_PASSWORD_PATTERN.test(password);
}

export function strictEmailValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    !control.value || isStrictEmail(control.value) ? null : { strictEmail: true };
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    !control.value || isStrongPassword(control.value) ? null : { strongPassword: true };
}
