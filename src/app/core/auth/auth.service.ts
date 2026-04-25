import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthSession, User } from '../models/user.model';

const TOKEN_KEY = 'worktime.token';
const USER_KEY = 'worktime.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenState = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userState = signal<AuthSession['user'] | null>(this.readUser());

  readonly token = this.tokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState() && this.userState()));

  login(email: string, password: string) {
    return this.http
      .get<User[]>(`${environment.apiUrl}/users`, { params: { email, password } })
      .pipe(
        map((users) => {
          const user = users.at(0);

          if (!user) {
            throw new Error('Invalid email or password');
          }

          const session: AuthSession = {
            token: `mock-jwt-${user.id}-${Date.now()}`,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              dailyGoalHours: user.dailyGoalHours,
            },
          };

          return session;
        }),
        tap((session) => this.persistSession(session)),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
    void this.router.navigateByUrl('/login');
  }

  updateDailyGoal(hours: number): void {
    const user = this.userState();

    if (!user) {
      return;
    }

    const next = { ...user, dailyGoalHours: hours };
    this.userState.set(next);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
  }

  private persistSession(session: AuthSession): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    this.tokenState.set(session.token);
    this.userState.set(session.user);
  }

  private readUser(): AuthSession['user'] | null {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession['user'];
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
