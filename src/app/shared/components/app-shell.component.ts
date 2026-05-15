import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiIcon } from '@taiga-ui/core/components/icon';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TuiButton, TuiIcon],
  template: `
    <div class="shell">
      <aside class="sidebar" aria-label="Main navigation">
        <a class="brand" routerLink="/dashboard" aria-label="WorkTime Manager home">
          <span class="brand-mark">WT</span>
          <span>WorkTime</span>
        </a>

        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">
            <tui-icon icon="@tui.chart-no-axes-combined" />
            Dashboard
          </a>
          <a routerLink="/entries" routerLinkActive="active">
            <tui-icon icon="@tui.clock-3" />
            Entries
          </a>
          <a routerLink="/projects" routerLinkActive="active">
            <tui-icon icon="@tui.folder-kanban" />
            Projects
          </a>
          <a routerLink="/reports" routerLinkActive="active">
            <tui-icon icon="@tui.file-spreadsheet" />
            Reports
          </a>
          <a routerLink="/settings" routerLinkActive="active">
            <tui-icon icon="@tui.settings" />
            Settings
          </a>
        </nav>
      </aside>

      <main class="content">
        <header class="topbar">
          <div>
            <span class="muted">Signed in as</span>
            <strong>{{ auth.user()?.name }}</strong>
          </div>
          <button tuiButton type="button" appearance="secondary" size="s" (click)="auth.logout()">
            Logout
          </button>
        </header>

        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
}
