import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiLoader } from '@taiga-ui/core/components/loader';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { AuthService } from '../../core/auth/auth.service';
import {
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE_MESSAGE,
  strictEmailValidator,
  strongPasswordValidator,
} from '../../core/auth/auth-validation';

type AuthMode = 'login' | 'register' | 'reset';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, TuiButton, TuiLoader, TuiTitle],
  template: `
    <main class="auth-page">
      <section class="auth-panel" aria-labelledby="login-title">
        <div>
          <p class="eyebrow">WorkTime Manager</p>
          <h1 id="login-title" tuiTitle="l">{{ title() }}</h1>
          <p class="muted">{{ subtitle() }}</p>
        </div>

        @if (mode() === 'login') {
          <form [formGroup]="loginForm" (ngSubmit)="login()" aria-label="Login form">
            <label>
              Email
              <input type="email" formControlName="email" autocomplete="email" />
              @if (loginForm.controls.email.touched && loginForm.controls.email.invalid) {
                <small class="field-error">{{ emailRuleMessage }}</small>
              }
            </label>

            <label>
              Password
              <input type="password" formControlName="password" autocomplete="current-password" />
            </label>

            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
            }

            <button tuiButton type="submit" [disabled]="loginForm.invalid || loading()">
              @if (loading()) {
                <tui-loader size="s" [inheritColor]="true" />
              }
              Sign in
            </button>

            <div class="auth-actions" aria-label="Account actions">
              <button
                tuiButton
                type="button"
                appearance="flat"
                size="s"
                (click)="setMode('reset')"
              >
                Forgot password?
              </button>
              <button
                tuiButton
                type="button"
                appearance="secondary"
                size="s"
                (click)="setMode('register')"
              >
                Create a new account
              </button>
            </div>
          </form>
        } @else if (mode() === 'register') {
          <form [formGroup]="registerForm" (ngSubmit)="register()" aria-label="Registration form">
            <label>
              Name
              <input type="text" formControlName="name" autocomplete="name" />
            </label>

            <label>
              Email
              <input type="email" formControlName="email" autocomplete="email" />
              @if (registerForm.controls.email.touched && registerForm.controls.email.invalid) {
                <small class="field-error">{{ emailRuleMessage }}</small>
              }
            </label>

            <label>
              Password
              <input type="password" formControlName="password" autocomplete="new-password" />
              @if (registerForm.controls.password.touched && registerForm.controls.password.invalid) {
                <small class="field-error">{{ passwordRuleMessage }}</small>
              }
            </label>

            <label>
              Daily goal, hours
              <input type="number" min="1" max="16" formControlName="dailyGoalHours" />
            </label>

            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
            }

            <button tuiButton type="submit" [disabled]="registerForm.invalid || loading()">
              @if (loading()) {
                <tui-loader size="s" [inheritColor]="true" />
              }
              Create account
            </button>

            <button tuiButton type="button" appearance="flat" size="s" (click)="setMode('login')">
              I already have an account
            </button>
          </form>
        } @else {
          <form [formGroup]="resetForm" (ngSubmit)="recoverPassword()" aria-label="Password reset form">
            <label>
              Email
              <input type="email" formControlName="email" autocomplete="email" />
              @if (resetForm.controls.email.touched && resetForm.controls.email.invalid) {
                <small class="field-error">{{ emailRuleMessage }}</small>
              }
            </label>

            @if (info()) {
              <p class="form-info" role="status">{{ info() }}</p>
            }

            @if (resetLink()) {
              <a class="mock-link" [href]="resetLink()">Open mock reset link</a>
            }

            @if (error()) {
              <p class="form-error" role="alert">{{ error() }}</p>
            }

            <button tuiButton type="submit" [disabled]="resetForm.invalid || loading()">
              @if (loading()) {
                <tui-loader size="s" [inheritColor]="true" />
              }
              Send recovery link
            </button>

            <button tuiButton type="button" appearance="flat" size="s" (click)="setMode('login')">
              Back to sign in
            </button>
          </form>
        }
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('login');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly info = signal('');
  protected readonly resetLink = signal('');
  protected readonly emailRuleMessage = EMAIL_RULE_MESSAGE;
  protected readonly passwordRuleMessage = PASSWORD_RULE_MESSAGE;
  protected readonly title = computed(() => {
    switch (this.mode()) {
      case 'register':
        return 'Create your workspace';
      case 'reset':
        return 'Recover your password';
      default:
        return 'Sign in to your workspace';
    }
  });
  protected readonly subtitle = computed(() => {
    switch (this.mode()) {
      case 'register':
        return 'Register an account and set your first daily time goal.';
      case 'reset':
        return 'Enter your email and we will send a mock recovery link.';
      default:
        return 'Use your account to continue tracking projects, tasks and reports.';
    }
  });
  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, strictEmailValidator()]],
    password: ['', [Validators.required, strongPasswordValidator()]],
    dailyGoalHours: [8, [Validators.required, Validators.min(1), Validators.max(16)]],
  });

  protected readonly resetForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
  });

  login(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth
      .login(this.loginForm.controls.email.value, this.loginForm.controls.password.value)
      .subscribe({
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: (error: Error) => {
          this.error.set(error.message);
          this.loading.set(false);
        },
      });
  }

  register(): void {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.registerForm.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  recoverPassword(): void {
    this.resetForm.markAllAsTouched();

    if (this.resetForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.info.set('');
    this.resetLink.set('');

    const email = this.resetForm.controls.email.value;

    this.auth.requestPasswordRecovery(email).subscribe({
      next: (recovery) => {
        this.resetLink.set(recovery.resetLink);
        this.info.set(
          `Mock server prepared a reset link for ${recovery.email}. In a real app it would be sent by email.`,
        );
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  setMode(mode: AuthMode): void {
    this.error.set('');
    this.info.set('');
    this.resetLink.set('');
    this.loading.set(false);
    this.mode.set(mode);
  }
}
