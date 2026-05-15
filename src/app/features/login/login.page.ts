import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiLoader } from '@taiga-ui/core/components/loader';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { AuthService } from '../../core/auth/auth.service';

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
            </label>

            <label>
              Password
              <input type="password" formControlName="password" autocomplete="new-password" />
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
            </label>

            @if (info()) {
              <p class="form-info" role="status">{{ info() }}</p>
            }

            <button tuiButton type="submit" [disabled]="loading()">
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
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    dailyGoalHours: [8, [Validators.required, Validators.min(1), Validators.max(16)]],
  });

  protected readonly resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
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

    const email = this.resetForm.controls.email.value;

    this.info.set(
      `If an account for ${email} exists, a recovery link has been sent by the mock server.`,
    );
    this.loading.set(false);
  }

  setMode(mode: AuthMode): void {
    this.error.set('');
    this.info.set('');
    this.loading.set(false);
    this.mode.set(mode);
  }
}
