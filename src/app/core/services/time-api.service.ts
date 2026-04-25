import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { Project, TimeEntry, TimeEntryDraft, WorkTask } from '../models/time.model';

@Injectable({ providedIn: 'root' })
export class TimeApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProjects(userId: string) {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`, { params: { userId } });
  }

  getTasks() {
    return this.http.get<WorkTask[]>(`${this.apiUrl}/tasks`);
  }

  getEntries(userId: string) {
    return this.http.get<TimeEntry[]>(`${this.apiUrl}/timeEntries`, {
      params: { userId, _sort: '-date' },
    });
  }

  createEntry(userId: string, draft: TimeEntryDraft) {
    const now = new Date().toISOString();
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      userId,
      ...draft,
      createdAt: now,
      updatedAt: now,
    };

    return this.http.post<TimeEntry>(`${this.apiUrl}/timeEntries`, entry);
  }

  updateEntry(entry: TimeEntry) {
    return this.http.put<TimeEntry>(`${this.apiUrl}/timeEntries/${entry.id}`, {
      ...entry,
      updatedAt: new Date().toISOString(),
    });
  }

  deleteEntry(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/timeEntries/${id}`);
  }
}
