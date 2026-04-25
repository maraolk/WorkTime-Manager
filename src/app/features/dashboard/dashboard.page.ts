import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiLoader } from '@taiga-ui/core/components/loader';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { TimeEntryDraft } from '../../core/models/time.model';
import { formatDuration, minutesToHours, todayIso } from '../../core/services/date.util';
import { TimeStore } from '../../core/services/time.store';
import { MetricCardComponent } from '../../shared/components/metric-card.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [FormsModule, TuiButton, TuiLoader, TuiTitle, MetricCardComponent],
  template: `
    <section class="page-stack">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Today</p>
          <h1 tuiTitle="l">Work dashboard</h1>
        </div>
      </div>

      @if (store.loading()) {
        <tui-loader size="m" />
      }

      @if (store.error()) {
        <p class="banner-error" role="alert">{{ store.error() }}</p>
      }

      <section class="metric-grid" aria-label="Time statistics">
        <app-metric-card label="Today" [value]="format(store.todayMinutes())" [note]="goalNote()" />
        <app-metric-card label="Goal progress" [value]="goalProgress() + '%'" note="Daily target" />
        <app-metric-card
          label="Projects"
          [value]="store.projects().length.toString()"
          note="Available for tracking"
        />
        <app-metric-card label="Billable" [value]="billableHours()" note="Tracked today" />
      </section>

      <section class="panel timer-panel" aria-labelledby="timer-title">
        <div>
          <h2 id="timer-title">Timer</h2>
          <p class="muted">Choose project and task, then start tracking.</p>
        </div>

        <div class="timer-grid">
          <label>
            Project
            <select [(ngModel)]="projectId">
              <option value="">Select project</option>
              @for (project of store.projects(); track project.id) {
                <option [value]="project.id">{{ project.name }}</option>
              }
            </select>
          </label>

          <label>
            Task
            <select [(ngModel)]="taskId">
              <option value="">Select task</option>
              @for (task of timerTasks(); track task.id) {
                <option [value]="task.id">{{ task.title }}</option>
              }
            </select>
          </label>

          <label class="wide">
            Description
            <input [(ngModel)]="description" placeholder="Short work summary" />
          </label>
        </div>

        <div class="timer-actions">
          @if (!startedAt()) {
            <button tuiButton type="button" [disabled]="!canStart()" (click)="start()">
              Start
            </button>
          } @else {
            <button tuiButton type="button" appearance="accent" (click)="stop()">
              Stop and save
            </button>
            <strong>{{ runningLabel() }}</strong>
          }
        </div>
      </section>

      <section class="panel" aria-labelledby="recent-title">
        <h2 id="recent-title">Recent entries</h2>
        <div class="entry-list">
          @for (entry of store.entries().slice(0, 5); track entry.id) {
            <article>
              <span>{{ entry.date }}</span>
              <strong>{{ projectName(entry.projectId) }}</strong>
              <span>{{ format(entry.minutes) }}</span>
              <p>{{ entry.description }}</p>
            </article>
          } @empty {
            <p class="muted">No entries yet.</p>
          }
        </div>
      </section>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  protected readonly store = inject(TimeStore);
  protected readonly startedAt = signal<number | null>(null);
  protected readonly timerTasks = computed(() =>
    this.projectId ? this.store.tasks().filter((task) => task.projectId === this.projectId) : [],
  );

  protected projectId = '';
  protected taskId = '';
  protected description = '';

  ngOnInit(): void {
    void this.store.load();
  }

  protected canStart(): boolean {
    return Boolean(this.projectId && this.taskId && this.description.trim());
  }

  protected start(): void {
    this.startedAt.set(Date.now());
  }

  protected async stop(): Promise<void> {
    const started = this.startedAt();

    if (!started) {
      return;
    }

    const minutes = Math.max(1, Math.round((Date.now() - started) / 60000));
    const draft: TimeEntryDraft = {
      projectId: this.projectId,
      taskId: this.taskId,
      date: todayIso(),
      minutes,
      description: this.description,
      billable: true,
    };

    await this.store.createEntry(draft);
    this.startedAt.set(null);
    this.description = '';
  }

  protected runningLabel(): string {
    const started = this.startedAt();

    return started ? `${Math.max(1, Math.round((Date.now() - started) / 60000))} min running` : '';
  }

  protected format(minutes: number): string {
    return formatDuration(minutes);
  }

  protected goalProgress(): number {
    return Math.min(
      100,
      Math.round((this.store.todayMinutes() / this.store.dailyGoalMinutes()) * 100),
    );
  }

  protected goalNote(): string {
    return `${minutesToHours(this.store.dailyGoalMinutes())}h goal`;
  }

  protected billableHours(): string {
    const minutes = this.store
      .entries()
      .filter((entry) => entry.date === todayIso() && entry.billable)
      .reduce((sum, entry) => sum + entry.minutes, 0);

    return `${minutesToHours(minutes)}h`;
  }

  protected projectName(projectId: string): string {
    return (
      this.store.projects().find((project) => project.id === projectId)?.name ?? 'Unknown project'
    );
  }
}
