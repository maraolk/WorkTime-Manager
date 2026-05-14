import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiLoader } from '@taiga-ui/core/components/loader';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { TimeEntry, TimeEntryDraft } from '../../core/models/time.model';
import { formatDuration } from '../../core/services/date.util';
import { TimeStore } from '../../core/services/time.store';
import { TimeEntryFormComponent } from '../../shared/components/time-entry-form.component';

@Component({
  selector: 'app-time-entries-page',
  imports: [FormsModule, TuiButton, TuiLoader, TuiTitle, TimeEntryFormComponent],
  template: `
    <section class="page-stack">
      <div class="page-heading">
        <div>
          <p class="eyebrow">CRUD</p>
          <h1 tuiTitle="l">Time entries</h1>
        </div>
      </div>

      @if (store.error()) {
        <p class="banner-error" role="alert">{{ store.error() }}</p>
      }

      <section class="panel" aria-label="Filters">
        <div class="filters">
          <label>
            Search
            <input
              [ngModel]="store.filters.query()"
              (ngModelChange)="store.setFilters({ query: $event })"
              placeholder="Description"
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
            Sort
            <select
              [ngModel]="store.filters.sortBy()"
              (ngModelChange)="store.setFilters({ sortBy: $event })"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="minutes-desc">Duration</option>
            </select>
          </label>
        </div>
      </section>

      <section class="split-layout">
        <div class="panel">
          <h2>{{ editing() ? 'Edit entry' : 'New entry' }}</h2>
          <app-time-entry-form
            [projects]="store.projects()"
            [tasks]="store.tasks()"
            [entry]="editing()"
            (save)="save($event)"
            (canceled)="editing.set(null)"
          />
        </div>

        <div class="panel">
          <div class="section-title">
            <h2>Entries</h2>
            @if (store.loading()) {
              <tui-loader size="s" />
            }
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Task</th>
                  <th>Time</th>
                  <th>Description</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                @for (entry of store.filteredEntries(); track entry.id) {
                  <tr>
                    <td>{{ entry.date }}</td>
                    <td>{{ projectName(entry.projectId) }}</td>
                    <td>{{ taskName(entry.taskId) }}</td>
                    <td>{{ format(entry.minutes) }}</td>
                    <td>{{ entry.description }}</td>
                    <td class="row-actions">
                      <button
                        tuiButton
                        type="button"
                        size="xs"
                        appearance="secondary"
                        (click)="editing.set(entry)"
                      >
                        Edit
                      </button>
                      <button
                        tuiButton
                        type="button"
                        size="xs"
                        appearance="flat"
                        (click)="delete(entry.id)"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="empty">No entries match filters.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntriesPage implements OnInit {
  protected readonly store = inject(TimeStore);
  protected readonly editing = signal<TimeEntry | null>(null);

  ngOnInit(): void {
    void this.store.load();
  }

  protected async save(draft: TimeEntryDraft): Promise<void> {
    const entry = this.editing();

    if (entry) {
      await this.store.updateEntry({ ...entry, ...draft });
      this.editing.set(null);
      return;
    }

    await this.store.createEntry(draft);
  }

  protected async delete(id: string): Promise<void> {
    if (!confirm('Delete this time entry?')) {
      return;
    }

    await this.store.deleteEntry(id);
  }

  protected format(minutes: number): string {
    return formatDuration(minutes);
  }

  protected projectName(projectId: string): string {
    return this.store.projects().find((project) => project.id === projectId)?.name ?? 'Unknown';
  }

  protected taskName(taskId: string): string {
    return this.store.tasks().find((task) => task.id === taskId)?.title ?? 'Unknown';
  }
}
