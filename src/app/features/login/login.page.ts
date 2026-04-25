import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiLoader } from '@taiga-ui/core/components/loader';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, TuiButton, TuiLoader, TuiTitle],
  template: `
    <main class="auth-page">
      <section class="auth-panel" aria-labelledby="login-title">
        <div>
          <p class="eyebrow">WorkTime Manager</p>
          <h1 id="login-title" tuiTitle="l">Track time without losing the thread</h1>
          <p class="muted">Demo account: arina@example.com / password</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="login()" aria-label="Login form">
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

          <button tuiButton type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <tui-loader size="s" [inheritColor]="true" />
            }
            Sign in
          </button>
        </form>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly form = this.fb.group({
    email: ['arina@example.com', [Validators.required, Validators.email]],
    password: ['password', [Validators.required, Validators.minLength(4)]],
  });

  login(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.controls.email.value, this.form.controls.password.value).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }
}
