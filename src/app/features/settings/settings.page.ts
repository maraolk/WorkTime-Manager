import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, TuiButton, TuiTitle],
  template: `
    <section class="page-stack">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Preferences</p>
          <h1 tuiTitle="l">Settings</h1>
        </div>
      </div>

      <section class="panel settings-panel">
        <label>
          Daily goal, hours
          <input type="number" min="1" max="16" [(ngModel)]="dailyGoal" />
        </label>
        <button tuiButton type="button" (click)="save()">Save goal</button>
        @if (savedMessage()) {
          <p class="success-message" role="status">{{ savedMessage() }}</p>
        }
      </section>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly auth = inject(AuthService);
  protected dailyGoal = this.auth.user()?.dailyGoalHours ?? 8;
  protected readonly savedMessage = signal('');

  protected save(): void {
    const nextGoal = Math.min(16, Math.max(1, Math.round(Number(this.dailyGoal) || 8)));

    this.dailyGoal = nextGoal;
    this.auth.updateDailyGoal(nextGoal);
    this.savedMessage.set(`Daily goal saved: ${nextGoal}h`);
  }
}
