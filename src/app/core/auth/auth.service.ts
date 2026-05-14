import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthSession, PasswordRecovery, RegisterPayload, User } from '../models/user.model';
import {
  EMAIL_RULE_MESSAGE,
  PASSWORD_RULE_MESSAGE,
  isStrictEmail,
  isStrongPassword,
} from './auth-validation';

const TOKEN_KEY = 'worktime.token';
const USER_KEY = 'worktime.user';
const REGISTERED_USERS_KEY = 'worktime.registeredUsers';

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
            const localUser = this.readRegisteredUsers().find(
              (item) => item.email === email && item.password === password,
            );

            if (!localUser) {
              throw new Error('Invalid email or password');
            }

            return this.createSession(localUser);
          }

          return this.createSession(user);
        }),
        tap((session) => this.persistSession(session)),
      );
  }

  register(payload: RegisterPayload) {
    if (!isStrictEmail(payload.email)) {
      return throwError(() => new Error(EMAIL_RULE_MESSAGE));
    }

    if (!isStrongPassword(payload.password)) {
      return throwError(() => new Error(PASSWORD_RULE_MESSAGE));
    }

    return this.http
      .get<User[]>(`${environment.apiUrl}/users`, { params: { email: payload.email } })
      .pipe(
        switchMap((users) => {
          const existsInStorage = this.readRegisteredUsers().some(
            (user) => user.email === payload.email,
          );

          if (users.length || existsInStorage) {
            throw new Error('User with this email already exists');
          }

          const user: User = {
            id: crypto.randomUUID(),
            role: 'freelancer',
            ...payload,
          };

          this.saveRegisteredUser(user);

          return this.http.post<User>(`${environment.apiUrl}/users`, user).pipe(map(() => user));
        }),
        map((user) => this.createSession(user)),
        tap((session) => this.persistSession(session)),
      );
  }

  requestPasswordRecovery(email: string) {
    if (!isStrictEmail(email)) {
      return throwError(() => new Error(EMAIL_RULE_MESSAGE));
    }

    return this.http.get<User[]>(`${environment.apiUrl}/users`, { params: { email } }).pipe(
      map((users): PasswordRecovery => {
        const user =
          users.at(0) ?? this.readRegisteredUsers().find((item) => item.email === email);

        if (!user) {
          throw new Error('No account found for this email');
        }

        return {
          email: user.email,
          resetLink: `${location.origin}/login?resetToken=mock-${user.id}`,
        };
      }),
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

  private createSession(user: User): AuthSession {
    return {
      token: `mock-jwt-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dailyGoalHours: user.dailyGoalHours,
      },
    };
  }

  private readRegisteredUsers(): User[] {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as User[];
    } catch {
      localStorage.removeItem(REGISTERED_USERS_KEY);
      return [];
    }
  }

  private saveRegisteredUser(user: User): void {
    const users = this.readRegisteredUsers().filter((item) => item.email !== user.email);

    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, user]));
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
