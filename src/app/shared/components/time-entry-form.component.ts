import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core/components/button';

import { Project, TimeEntry, TimeEntryDraft, WorkTask } from '../../core/models/time.model';
import { todayIso } from '../../core/services/date.util';

@Component({
  selector: 'app-time-entry-form',
  imports: [ReactiveFormsModule, TuiButton],
  template: `
    <form class="entry-form" [formGroup]="form" (ngSubmit)="submit()" aria-label="Time entry form">
      <label>
        Date
        <input type="date" formControlName="date" />
      </label>

      <label>
        Project
        <select formControlName="projectId">
          <option value="">Select project</option>
          @for (project of projects; track project.id) {
            <option [value]="project.id">{{ project.name }}</option>
          }
        </select>
      </label>

      <label>
        Task
        <select formControlName="taskId">
          <option value="">Select task</option>
          @for (task of availableTasks; track task.id) {
            <option [value]="task.id">{{ task.title }}</option>
          }
        </select>
      </label>

      <label>
        Minutes
        <input type="number" min="1" max="1440" formControlName="minutes" />
      </label>

      <label class="wide">
        Description
        <textarea rows="3" formControlName="description" placeholder="What was done?"></textarea>
      </label>

      <label class="checkbox">
        <input type="checkbox" formControlName="billable" />
        Billable
      </label>

      @if (form.invalid && form.touched) {
        <p class="form-error" role="alert">Fill project, task, date and at least 1 minute.</p>
      }

      <div class="actions">
        <button tuiButton type="submit" size="s">{{ entry ? 'Save changes' : 'Add entry' }}</button>
        @if (entry) {
          <button tuiButton type="button" appearance="secondary" size="s" (click)="canceled.emit()">
            Cancel
          </button>
        }
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeEntryFormComponent implements OnChanges {
  @Input() projects: Project[] = [];
  @Input() tasks: WorkTask[] = [];
  @Input() entry: TimeEntry | null = null;
  @Output() save = new EventEmitter<TimeEntryDraft>();
  @Output() canceled = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    projectId: ['', Validators.required],
    taskId: ['', Validators.required],
    date: [todayIso(), Validators.required],
    minutes: [60, [Validators.required, Validators.min(1), Validators.max(1440)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    billable: [true],
  });

  get availableTasks(): WorkTask[] {
    const projectId = this.form.controls.projectId.value;

    return projectId ? this.tasks.filter((task) => task.projectId === projectId) : this.tasks;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entry']) {
      this.form.reset(
        this.entry
          ? {
              projectId: this.entry.projectId,
              taskId: this.entry.taskId,
              date: this.entry.date,
              minutes: this.entry.minutes,
              description: this.entry.description,
              billable: this.entry.billable,
            }
          : {
              projectId: '',
              taskId: '',
              date: todayIso(),
              minutes: 60,
              description: '',
              billable: true,
            },
      );
    }
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.save.emit(this.form.getRawValue());

    if (!this.entry) {
      this.form.reset({
        projectId: '',
        taskId: '',
        date: todayIso(),
        minutes: 60,
        description: '',
        billable: true,
      });
    }
  }
}
