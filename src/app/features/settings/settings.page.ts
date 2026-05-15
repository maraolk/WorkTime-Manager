import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
      </section>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  private readonly auth = inject(AuthService);
  protected dailyGoal = this.auth.user()?.dailyGoalHours ?? 8;

  protected save(): void {
    this.auth.updateDailyGoal(Number(this.dailyGoal));
  }
}
