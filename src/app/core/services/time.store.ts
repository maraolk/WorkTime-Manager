import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withState, patchState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import {
  EntryFilters,
  Project,
  ProjectDraft,
  TimeEntry,
  TimeEntryDraft,
  WorkTask,
  WorkTaskDraft,
} from '../models/time.model';
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
    dateFrom: '',
    dateTo: '',
    sortBy: 'date-desc',
  },
  loading: false,
  error: null,
};

const isNotFoundError = (error: unknown): boolean =>
  error instanceof Error && /404|not found/i.test(error.message);

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

    async createProject(draft: ProjectDraft): Promise<void> {
      const user = auth.user();

      if (!user) {
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const project = await firstValueFrom(api.createProject(user.id, draft));
        patchState(store, { projects: [...store.projects(), project], loading: false });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Project create failed',
        });
      }
    },

    async updateProject(project: Project): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        const updated = await firstValueFrom(api.updateProject(project));
        patchState(store, {
          projects: store.projects().map((item) => (item.id === updated.id ? updated : item)),
          loading: false,
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          patchState(store, {
            projects: store.projects().map((item) => (item.id === project.id ? project : item)),
            loading: false,
            error: null,
          });
          return;
        }

        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Project update failed',
        });
      }
    },

    async deleteProject(id: string): Promise<void> {
      const hasEntries = store.entries().some((entry) => entry.projectId === id);

      if (hasEntries) {
        patchState(store, { error: 'Project with time entries cannot be deleted' });
        return;
      }

      patchState(store, { loading: true, error: null });

      const tasksToDelete = store.tasks().filter((task) => task.projectId === id);

      try {
        await Promise.all([
          firstValueFrom(api.deleteProject(id)),
          ...tasksToDelete.map((task) => firstValueFrom(api.deleteTask(task.id))),
        ]);

        patchState(store, {
          projects: store.projects().filter((project) => project.id !== id),
          tasks: store.tasks().filter((task) => task.projectId !== id),
          loading: false,
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          patchState(store, {
            projects: store.projects().filter((project) => project.id !== id),
            tasks: store.tasks().filter((task) => task.projectId !== id),
            loading: false,
            error: null,
          });
          return;
        }

        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Project delete failed',
        });
      }
    },

    async createTask(draft: WorkTaskDraft): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        const task = await firstValueFrom(api.createTask(draft));
        patchState(store, { tasks: [...store.tasks(), task], loading: false });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Task create failed',
        });
      }
    },

    async updateTask(task: WorkTask): Promise<void> {
      patchState(store, { loading: true, error: null });

      try {
        const updated = await firstValueFrom(api.updateTask(task));
        patchState(store, {
          tasks: store.tasks().map((item) => (item.id === updated.id ? updated : item)),
          loading: false,
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          patchState(store, {
            tasks: store.tasks().map((item) => (item.id === task.id ? task : item)),
            loading: false,
            error: null,
          });
          return;
        }

        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Task update failed',
        });
      }
    },

    async deleteTask(id: string): Promise<void> {
      const hasEntries = store.entries().some((entry) => entry.taskId === id);

      if (hasEntries) {
        patchState(store, { error: 'Task with time entries cannot be deleted' });
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        await firstValueFrom(api.deleteTask(id));
        patchState(store, {
          tasks: store.tasks().filter((task) => task.id !== id),
          loading: false,
        });
      } catch (error) {
        if (isNotFoundError(error)) {
          patchState(store, {
            tasks: store.tasks().filter((task) => task.id !== id),
            loading: false,
            error: null,
          });
          return;
        }

        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Task delete failed',
        });
      }
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
        if (isNotFoundError(error)) {
          patchState(store, {
            entries: store.entries().map((item) => (item.id === entry.id ? entry : item)),
            loading: false,
            error: null,
          });
          return;
        }

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
        if (isNotFoundError(error)) {
          patchState(store, {
            entries: store.entries().filter((entry) => entry.id !== id),
            loading: false,
            error: null,
          });
          return;
        }

        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Delete failed',
        });
      }
    },
  })),
);
