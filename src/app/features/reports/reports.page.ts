import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { minutesToHours } from '../../core/services/date.util';
import { ReportService } from '../../core/services/report.service';
import { TimeStore } from '../../core/services/time.store';
import { MetricCardComponent } from '../../shared/components/metric-card.component';

@Component({
  selector: 'app-reports-page',
  imports: [FormsModule, TuiButton, TuiTitle, MetricCardComponent],
  template: `
    <section class="page-stack">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Reports</p>
          <h1 tuiTitle="l">Plan vs actual</h1>
        </div>
        <button tuiButton type="button" (click)="exportCsv()">Export CSV</button>
      </div>

      <section class="metric-grid" aria-label="Report statistics">
        <app-metric-card label="Period hours" [value]="periodHours()" note="Filtered by dates" />
        <app-metric-card label="Planned" [value]="plannedHours()" note="All visible projects" />
        <app-metric-card
          label="Projects"
          [value]="store.projectSummary().length.toString()"
          note="In report"
        />
      </section>

      <section class="panel" aria-label="Report period">
        <div class="filters">
          <label>
            From
            <input
              type="date"
              [ngModel]="store.filters.dateFrom()"
              (ngModelChange)="store.setFilters({ dateFrom: $event })"
            />
          </label>
          <label>
            To
            <input
              type="date"
              [ngModel]="store.filters.dateTo()"
              (ngModelChange)="store.setFilters({ dateTo: $event })"
            />
          </label>
          <label>
            Project
            <select
              [ngModel]="store.filters.projectId()"
              (ngModelChange)="store.setFilters({ projectId: $event })"
            >
              <option value="">All projects</option>
              @for (project of store.projects(); track project.id) {
                <option [value]="project.id">{{ project.name }}</option>
              }
            </select>
          </label>
        </div>
      </section>

      <section class="panel">
        <h2>Project summary</h2>
        <div class="summary-list">
          @for (item of store.projectSummary(); track item.projectId) {
            <article [class]="'summary-' + item.status">
              <div>
                <strong>{{ item.projectName }}</strong>
                <span>{{ item.actualHours }}h of {{ item.plannedHours }}h</span>
                <small>{{ statusLabel(item.status) }}</small>
              </div>
              <progress
                [value]="item.progress"
                max="100"
                [attr.aria-label]="item.projectName + ' progress'"
              ></progress>
              <b>{{ item.progress }}%</b>
            </article>
          }
        </div>
      </section>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  protected readonly store = inject(TimeStore);
  private readonly reports = inject(ReportService);

  ngOnInit(): void {
    void this.store.load();
  }

  protected periodHours(): string {
    const minutes = this.store.periodEntries().reduce((sum, entry) => sum + entry.minutes, 0);

    return `${minutesToHours(minutes)}h`;
  }

  protected plannedHours(): string {
    const total = this.store.projects().reduce((sum, project) => sum + project.plannedHours, 0);

    return `${total}h`;
  }

  protected exportCsv(): void {
    const csv = `\uFEFF${this.reports.toCsv(this.store.filteredEntries(), this.store.projects())}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = this.reportFilename();
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  protected reportFilename(): string {
    const { dateFrom, dateTo, projectId } = this.store.filters();
    const period = dateFrom || dateTo ? `${dateFrom || 'start'}-${dateTo || 'today'}` : 'all-time';
    const project = projectId
      ? (this.store.projects().find((item) => item.id === projectId)?.name ?? 'project')
      : 'all-projects';
    const safeProject = project
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-|-$)/g, '');

    return `worktime-report-${safeProject}-${period}.csv`;
  }

  protected statusLabel(status: 'on-track' | 'near-limit' | 'overrun'): string {
    switch (status) {
      case 'overrun':
        return 'Over planned time';
      case 'near-limit':
        return 'Close to plan';
      default:
        return 'On track';
    }
  }
}
