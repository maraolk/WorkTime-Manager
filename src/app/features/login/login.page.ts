import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiLoader } from '@taiga-ui/core/components/loader';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { AuthService } from '../../core/auth/auth.service';

type AuthMode = 'login' | 'register';

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
          </form>
        } @else {
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
          </form>
        }

        <button tuiButton type="button" appearance="flat" size="s" (click)="toggleMode()">
          {{ mode() === 'login' ? 'Create a new account' : 'I already have an account' }}
        </button>
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
  protected readonly title = computed(() =>
    this.mode() === 'login' ? 'Sign in to your workspace' : 'Create your workspace',
  );
  protected readonly subtitle = computed(() =>
    this.mode() === 'login'
      ? 'Use your account to continue tracking projects, tasks and reports.'
      : 'Register an account and set your first daily time goal.',
  );

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

  toggleMode(): void {
    this.error.set('');
    this.loading.set(false);
    this.mode.update((mode) => (mode === 'login' ? 'register' : 'login'));
  }
}
