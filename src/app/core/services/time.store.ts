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

interface PersistedTimeState {
  projects: Project[];
  tasks: WorkTask[];
  entries: TimeEntry[];
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

const createLocalProject = (userId: string, draft: ProjectDraft): Project => ({
  id: crypto.randomUUID(),
  userId,
  ...draft,
});

const createLocalTask = (draft: WorkTaskDraft): WorkTask => ({
  id: crypto.randomUUID(),
  ...draft,
});

const createLocalEntry = (userId: string, draft: TimeEntryDraft): TimeEntry => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    userId,
    ...draft,
    createdAt: now,
    updatedAt: now,
  };
};

const storageKey = (userId: string): string => `worktime.data.${userId}`;

const mergeById = <T extends { id: string }>(base: T[], saved: T[]): T[] => {
  const map = new Map(base.map((item) => [item.id, item]));

  saved.forEach((item) => map.set(item.id, item));

  return [...map.values()];
};

const readPersistedState = (userId: string): PersistedTimeState => {
  try {
    const raw = localStorage.getItem(storageKey(userId));

    if (!raw) {
      return { projects: [], tasks: [], entries: [] };
    }

    return JSON.parse(raw) as PersistedTimeState;
  } catch {
    localStorage.removeItem(storageKey(userId));
    return { projects: [], tasks: [], entries: [] };
  }
};

const persistState = (
  userId: string,
  projects: Project[],
  tasks: WorkTask[],
  entries: TimeEntry[],
): void => {
  if (!userId) {
    return;
  }

  const projectIds = new Set(projects.map((project) => project.id));
  const state: PersistedTimeState = {
    projects: projects.filter((project) => project.userId === userId),
    tasks: tasks.filter((task) => projectIds.has(task.projectId)),
    entries: entries.filter((entry) => entry.userId === userId),
  };

  localStorage.setItem(storageKey(userId), JSON.stringify(state));
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
        const persisted = readPersistedState(user.id);

        patchState(store, {
          projects: mergeById(projects, persisted.projects),
          tasks: mergeById(tasks, persisted.tasks),
          entries: mergeById(entries, persisted.entries),
          loading: false,
        });
      } catch (error) {
        const persisted = readPersistedState(user.id);

        patchState(store, {
          projects: persisted.projects,
          tasks: persisted.tasks,
          entries: persisted.entries,
          loading: false,
          error: persisted.projects.length || persisted.entries.length ? null : 'Load failed',
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

      const project = createLocalProject(user.id, draft);
      const projects = [...store.projects(), project];

      patchState(store, {
        projects,
        loading: false,
        error: null,
      });
      persistState(user.id, projects, store.tasks(), store.entries());

      if (!api.supportsWrites) {
        return;
      }

      void firstValueFrom(api.createProject(project))
        .then((created) => {
          if (created.id === project.id) {
            return;
          }

          const projects = store
            .projects()
            .map((item) => (item.id === project.id ? created : item));
          const tasks = store
            .tasks()
            .map((task) =>
              task.projectId === project.id ? { ...task, projectId: created.id } : task,
            );

          patchState(store, { projects, tasks });
          persistState(user.id, projects, tasks, store.entries());
        })
        .catch(() => undefined);
    },

    async updateProject(project: Project): Promise<void> {
      if (!api.supportsWrites) {
        const projects = store.projects().map((item) => (item.id === project.id ? project : item));

        patchState(store, {
          projects,
          loading: false,
          error: null,
        });
        persistState(project.userId, projects, store.tasks(), store.entries());
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const updated = await firstValueFrom(api.updateProject(project));
        const projects = store.projects().map((item) => (item.id === updated.id ? updated : item));

        patchState(store, {
          projects,
          loading: false,
        });
        persistState(project.userId, projects, store.tasks(), store.entries());
      } catch (error) {
        if (isNotFoundError(error)) {
          const projects = store
            .projects()
            .map((item) => (item.id === project.id ? project : item));

          patchState(store, {
            projects,
            loading: false,
            error: null,
          });
          persistState(project.userId, projects, store.tasks(), store.entries());
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

      if (!api.supportsWrites) {
        const projects = store.projects().filter((project) => project.id !== id);
        const tasks = store.tasks().filter((task) => task.projectId !== id);

        patchState(store, {
          projects,
          tasks,
          loading: false,
          error: null,
        });
        persistState(auth.user()?.id ?? '', projects, tasks, store.entries());
        return;
      }

      try {
        await Promise.all([
          firstValueFrom(api.deleteProject(id)),
          ...tasksToDelete.map((task) => firstValueFrom(api.deleteTask(task.id))),
        ]);
        const projects = store.projects().filter((project) => project.id !== id);
        const tasks = store.tasks().filter((task) => task.projectId !== id);

        patchState(store, {
          projects,
          tasks,
          loading: false,
        });
        persistState(auth.user()?.id ?? '', projects, tasks, store.entries());
      } catch (error) {
        if (isNotFoundError(error)) {
          const projects = store.projects().filter((project) => project.id !== id);
          const tasks = store.tasks().filter((task) => task.projectId !== id);

          patchState(store, {
            projects,
            tasks,
            loading: false,
            error: null,
          });
          persistState(auth.user()?.id ?? '', projects, tasks, store.entries());
          return;
        }

        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Project delete failed',
        });
      }
    },

    async createTask(draft: WorkTaskDraft): Promise<void> {
      const task = createLocalTask(draft);
      const tasks = [...store.tasks(), task];

      patchState(store, {
        tasks,
        loading: false,
        error: null,
      });
      persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());

      if (!api.supportsWrites) {
        return;
      }

      void firstValueFrom(api.createTask(task))
        .then((created) => {
          if (created.id === task.id) {
            return;
          }

          const tasks = store.tasks().map((item) => (item.id === task.id ? created : item));

          patchState(store, { tasks });
          persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());
        })
        .catch(() => undefined);
    },

    async updateTask(task: WorkTask): Promise<void> {
      if (!api.supportsWrites) {
        const tasks = store.tasks().map((item) => (item.id === task.id ? task : item));

        patchState(store, {
          tasks,
          loading: false,
          error: null,
        });
        persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const updated = await firstValueFrom(api.updateTask(task));
        const tasks = store.tasks().map((item) => (item.id === updated.id ? updated : item));

        patchState(store, {
          tasks,
          loading: false,
        });
        persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());
      } catch (error) {
        if (isNotFoundError(error)) {
          const tasks = store.tasks().map((item) => (item.id === task.id ? task : item));

          patchState(store, {
            tasks,
            loading: false,
            error: null,
          });
          persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());
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

      if (!api.supportsWrites) {
        const tasks = store.tasks().filter((task) => task.id !== id);

        patchState(store, {
          tasks,
          loading: false,
          error: null,
        });
        persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());
        return;
      }

      try {
        await firstValueFrom(api.deleteTask(id));
        const tasks = store.tasks().filter((task) => task.id !== id);

        patchState(store, {
          tasks,
          loading: false,
        });
        persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());
      } catch (error) {
        if (isNotFoundError(error)) {
          const tasks = store.tasks().filter((task) => task.id !== id);

          patchState(store, {
            tasks,
            loading: false,
            error: null,
          });
          persistState(auth.user()?.id ?? '', store.projects(), tasks, store.entries());
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

      if (!api.supportsWrites) {
        const entry = createLocalEntry(user.id, draft);
        const entries = [entry, ...store.entries()];

        patchState(store, { entries, loading: false, error: null });
        persistState(user.id, store.projects(), store.tasks(), entries);
        return;
      }

      try {
        const entry = await firstValueFrom(api.createEntry(user.id, draft));
        const entries = [entry, ...store.entries()];

        patchState(store, { entries, loading: false });
        persistState(user.id, store.projects(), store.tasks(), entries);
      } catch (error) {
        patchState(store, {
          loading: false,
          error: error instanceof Error ? error.message : 'Create failed',
        });
      }
    },

    async updateEntry(entry: TimeEntry): Promise<void> {
      if (!api.supportsWrites) {
        const updated = { ...entry, updatedAt: new Date().toISOString() };
        const entries = store.entries().map((item) => (item.id === updated.id ? updated : item));

        patchState(store, {
          entries,
          loading: false,
          error: null,
        });
        persistState(auth.user()?.id ?? '', store.projects(), store.tasks(), entries);
        return;
      }

      patchState(store, { loading: true, error: null });

      try {
        const updated = await firstValueFrom(api.updateEntry(entry));
        const entries = store.entries().map((item) => (item.id === updated.id ? updated : item));

        patchState(store, {
          entries,
          loading: false,
        });
        persistState(auth.user()?.id ?? '', store.projects(), store.tasks(), entries);
      } catch (error) {
        if (isNotFoundError(error)) {
          const entries = store.entries().map((item) => (item.id === entry.id ? entry : item));

          patchState(store, {
            entries,
            loading: false,
            error: null,
          });
          persistState(auth.user()?.id ?? '', store.projects(), store.tasks(), entries);
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

      if (!api.supportsWrites) {
        const entries = store.entries().filter((entry) => entry.id !== id);

        patchState(store, {
          entries,
          loading: false,
          error: null,
        });
        persistState(auth.user()?.id ?? '', store.projects(), store.tasks(), entries);
        return;
      }

      try {
        await firstValueFrom(api.deleteEntry(id));
        const entries = store.entries().filter((entry) => entry.id !== id);

        patchState(store, {
          entries,
          loading: false,
        });
        persistState(auth.user()?.id ?? '', store.projects(), store.tasks(), entries);
      } catch (error) {
        if (isNotFoundError(error)) {
          const entries = store.entries().filter((entry) => entry.id !== id);

          patchState(store, {
            entries,
            loading: false,
            error: null,
          });
          persistState(auth.user()?.id ?? '', store.projects(), store.tasks(), entries);
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
