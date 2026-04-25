import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { EntryFilters, Project, TimeEntry, TimeEntryDraft, WorkTask } from '../models/time.model';
import { isWithinPeriod, todayIso } from './date.util';
import { ReportService } from './report.service';
import { TimeApiService } from './time-api.service';

interface TimeState {
  projects: Project[];
  tasks: WorkTask[];
  entries: TimeEntry[];
  filters: EntryFilters;
  loading: boolean;
  error: string | null;
}

const initialState: TimeState = {
  projects: [],
  tasks: [],
  entries: [],
  filters: {
    query: '',
    projectId: '',
    dateFrom: todayIso(),
    dateTo: todayIso(),
    sortBy: 'date-desc',
  },
  loading: false,
  error: null,
};

export const TimeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store, reports = inject(ReportService), auth = inject(AuthService)) => ({
    filteredEntries: computed(() => reports.filterEntries(store.entries(), store.filters())),
    projectSummary: computed(() => reports.buildProjectSummary(store.projects(), store.entries())),
    todayMinutes: computed(() =>
      store
        .entries()
        .filter((entry) => entry.date === todayIso())
        .reduce((sum, entry) => sum + entry.minutes, 0),
    ),
    dailyGoalMinutes: computed(() => (auth.user()?.dailyGoalHours ?? 8) * 60),
    visibleTasks: computed(() => {
      const projectId = store.filters.projectId();

      return projectId
        ? store.tasks().filter((task) => task.projectId === projectId)
        : store.tasks();
    }),
    periodEntries: computed(() =>
      store
        .entries()
        .filter((entry) =>
          isWithinPeriod(entry.date, store.filters.dateFrom(), store.filters.dateTo()),
        ),
    ),
  })),
  withMethods((store, api = inject(TimeApiService), auth = inject(AuthService)) => ({
    async load(): Promise<void> {
      const user = auth.user();

      if (!user) {
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const [projects, tasks, entries] = await Promise.all([
          firstValueFrom(api.getProjects(user.id)),
          firstValueFrom(api.getTasks()),
          firstValueFrom(api.getEntries(user.id)),
        ]);

        patchState(store, { projects, tasks, entries, loading: false });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Load failed',
        });
      }
    },

    setFilters(filters: Partial<EntryFilters>): void {
      patchState(store, { filters: { ...store.filters(), ...filters } });
    },

    async createEntry(draft: TimeEntryDraft): Promise<void> {
      const user = auth.user();

      if (!user) {
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const entry = await firstValueFrom(api.createEntry(user.id, draft));
        patchState(store, { entries: [entry, ...store.entries()], loading: false });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Create failed',
        });
      }
    },

    async updateEntry(entry: TimeEntry): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        const updated = await firstValueFrom(api.updateEntry(entry));
        patchState(store, {
          entries: store.entries().map((item) => (item.id === updated.id ? updated : item)),
          loading: false,
        });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Update failed',
        });
      }
    },

    async deleteEntry(id: string): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        await firstValueFrom(api.deleteEntry(id));
        patchState(store, {
          entries: store.entries().filter((entry) => entry.id !== id),
          loading: false,
        });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Delete failed',
        });
      }
    },
  })),
);
