import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core/components/button';
import { TuiLoader } from '@taiga-ui/core/components/loader';
import { TuiTitle } from '@taiga-ui/core/components/title';

import { Project, WorkTask } from '../../core/models/time.model';
import { TimeStore } from '../../core/services/time.store';

@Component({
  selector: 'app-projects-page',
  imports: [ReactiveFormsModule, TuiButton, TuiLoader, TuiTitle],
  template: `
    <section class="page-stack">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Planning</p>
          <h1 tuiTitle="l">Projects and tasks</h1>
        </div>
      </div>

      @if (store.error()) {
        <p class="banner-error" role="alert">{{ store.error() }}</p>
      }

      <section class="split-layout">
        <div class="panel">
          <div class="section-title">
            <h2>{{ editingProject() ? 'Edit project' : 'New project' }}</h2>
            @if (store.loading()) {
              <tui-loader size="s" />
            }
          </div>

          <form class="entry-form" [formGroup]="projectForm" (ngSubmit)="saveProject()">
            <label>
              Name
              <input formControlName="name" placeholder="Client Portal" />
            </label>

            <label>
              Client
              <input formControlName="client" placeholder="Northwind" />
            </label>

            <label>
              Planned hours
              <input type="number" min="1" max="999" formControlName="plannedHours" />
            </label>

            <label>
              Color
              <input type="color" formControlName="color" />
            </label>

            <div class="actions">
              <button tuiButton type="submit" size="s">
                {{ editingProject() ? 'Save project' : 'Add project' }}
              </button>
              @if (editingProject()) {
                <button
                  tuiButton
                  type="button"
                  appearance="secondary"
                  size="s"
                  (click)="resetProjectForm()"
                >
                  Cancel
                </button>
              }
            </div>
          </form>
        </div>

        <div class="panel">
          <h2>Project list</h2>
          <div class="management-list">
            @for (project of store.projects(); track project.id) {
              <article>
                <span class="swatch" [style.background]="project.color" aria-hidden="true"></span>
                <div>
                  <strong>{{ project.name }}</strong>
                  <span>{{ project.client }} · {{ project.plannedHours }}h planned</span>
                </div>
                <div class="row-actions">
                  <button
                    tuiButton
                    type="button"
                    size="xs"
                    appearance="secondary"
                    (click)="editProject(project)"
                  >
                    Edit
                  </button>
                  <button
                    tuiButton
                    type="button"
                    size="xs"
                    appearance="flat"
                    [disabled]="projectHasEntries(project.id)"
                    (click)="deleteProject(project.id)"
                  >
                    Delete
                  </button>
                </div>
              </article>
            }
          </div>
        </div>
      </section>

      <section class="split-layout">
        <div class="panel">
          <h2>{{ editingTask() ? 'Edit task' : 'New task' }}</h2>

          <form class="entry-form" [formGroup]="taskForm" (ngSubmit)="saveTask()">
            <label>
              Project
              <select formControlName="projectId">
                <option value="">Select project</option>
                @for (project of store.projects(); track project.id) {
                  <option [value]="project.id">{{ project.name }}</option>
                }
              </select>
            </label>

            <label>
              Title
              <input formControlName="title" placeholder="Reports page" />
            </label>

            <label>
              Planned hours
              <input type="number" min="1" max="999" formControlName="plannedHours" />
            </label>

            <label>
              Status
              <select formControlName="status">
                <option value="todo">Todo</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
              </select>
            </label>

            <div class="actions">
              <button tuiButton type="submit" size="s">
                {{ editingTask() ? 'Save task' : 'Add task' }}
              </button>
              @if (editingTask()) {
                <button
                  tuiButton
                  type="button"
                  appearance="secondary"
                  size="s"
                  (click)="resetTaskForm()"
                >
                  Cancel
                </button>
              }
            </div>
          </form>
        </div>

        <div class="panel">
          <h2>Tasks</h2>
          <div class="management-list">
            @for (task of tasksWithProjects(); track task.id) {
              <article>
                <span
                  class="status-dot"
                  [class.todo]="task.status === 'todo'"
                  [class.active]="task.status === 'active'"
                  [class.done]="task.status === 'done'"
                  aria-hidden="true"
                ></span>
                <div>
                  <strong>{{ task.title }}</strong>
                  <span
                    >{{ projectName(task.projectId) }} · {{ task.plannedHours }}h ·
                    {{ task.status }}</span
                  >
                </div>
                <div class="row-actions">
                  <button
                    tuiButton
                    type="button"
                    size="xs"
                    appearance="secondary"
                    (click)="editTask(task)"
                  >
                    Edit
                  </button>
                  <button
                    tuiButton
                    type="button"
                    size="xs"
                    appearance="flat"
                    [disabled]="taskHasEntries(task.id)"
                    (click)="deleteTask(task.id)"
                  >
                    Delete
                  </button>
                </div>
              </article>
            } @empty {
              <p class="muted">No tasks yet.</p>
            }
          </div>
        </div>
      </section>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage implements OnInit {
  protected readonly store = inject(TimeStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly editingProject = signal<Project | null>(null);
  protected readonly editingTask = signal<WorkTask | null>(null);
  protected readonly tasksWithProjects = computed(() =>
    this.store
      .tasks()
      .filter((task) => this.store.projects().some((project) => project.id === task.projectId)),
  );

  protected readonly projectForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    client: ['', [Validators.required, Validators.minLength(2)]],
    plannedHours: [8, [Validators.required, Validators.min(1)]],
    color: ['#0f8b8d', Validators.required],
  });

  protected readonly taskForm = this.fb.group({
    projectId: ['', Validators.required],
    title: ['', [Validators.required, Validators.minLength(2)]],
    plannedHours: [4, [Validators.required, Validators.min(1)]],
    status: ['todo' as WorkTask['status'], Validators.required],
  });

  ngOnInit(): void {
    void this.store.load();
  }

  protected async saveProject(): Promise<void> {
    this.projectForm.markAllAsTouched();

    if (this.projectForm.invalid) {
      return;
    }

    const draft = this.projectForm.getRawValue();
    const project = this.editingProject();

    if (project) {
      await this.store.updateProject({ ...project, ...draft });
    } else {
      await this.store.createProject(draft);
    }

    this.resetProjectForm();
  }

  protected editProject(project: Project): void {
    this.editingProject.set(project);
    this.projectForm.setValue({
      name: project.name,
      client: project.client,
      plannedHours: project.plannedHours,
      color: project.color,
    });
  }

  protected async deleteProject(id: string): Promise<void> {
    await this.store.deleteProject(id);
  }

  protected resetProjectForm(): void {
    this.editingProject.set(null);
    this.projectForm.reset({
      name: '',
      client: '',
      plannedHours: 8,
      color: '#0f8b8d',
    });
  }

  protected async saveTask(): Promise<void> {
    this.taskForm.markAllAsTouched();

    if (this.taskForm.invalid) {
      return;
    }

    const draft = this.taskForm.getRawValue();
    const task = this.editingTask();

    if (task) {
      await this.store.updateTask({ ...task, ...draft });
    } else {
      await this.store.createTask(draft);
    }

    this.resetTaskForm();
  }

  protected editTask(task: WorkTask): void {
    this.editingTask.set(task);
    this.taskForm.setValue({
      projectId: task.projectId,
      title: task.title,
      plannedHours: task.plannedHours,
      status: task.status,
    });
  }

  protected async deleteTask(id: string): Promise<void> {
    await this.store.deleteTask(id);
  }

  protected resetTaskForm(): void {
    this.editingTask.set(null);
    this.taskForm.reset({
      projectId: '',
      title: '',
      plannedHours: 4,
      status: 'todo',
    });
  }

  protected projectName(projectId: string): string {
    return this.store.projects().find((project) => project.id === projectId)?.name ?? 'Unknown';
  }

  protected projectHasEntries(projectId: string): boolean {
    return this.store.entries().some((entry) => entry.projectId === projectId);
  }

  protected taskHasEntries(taskId: string): boolean {
    return this.store.entries().some((entry) => entry.taskId === taskId);
  }
}
