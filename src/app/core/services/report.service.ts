import { Injectable } from '@angular/core';

import { EntryFilters, Project, ProjectSummary, TimeEntry } from '../models/time.model';
import { isWithinPeriod, minutesToHours } from './date.util';

@Injectable({ providedIn: 'root' })
export class ReportService {
  filterEntries(entries: TimeEntry[], filters: EntryFilters): TimeEntry[] {
    const query = filters.query.trim().toLowerCase();

    return entries
      .filter((entry) => !filters.projectId || entry.projectId === filters.projectId)
      .filter((entry) => isWithinPeriod(entry.date, filters.dateFrom, filters.dateTo))
      .filter((entry) => !query || entry.description.toLowerCase().includes(query))
      .sort((a, b) => {
        if (filters.sortBy === 'date-asc') {
          return a.date.localeCompare(b.date);
        }

        if (filters.sortBy === 'minutes-desc') {
          return b.minutes - a.minutes;
        }

        return b.date.localeCompare(a.date);
      });
  }

  buildProjectSummary(projects: Project[], entries: TimeEntry[]): ProjectSummary[] {
    return projects.map((project) => {
      const actualMinutes = entries
        .filter((entry) => entry.projectId === project.id)
        .reduce((sum, entry) => sum + entry.minutes, 0);
      const actualHours = minutesToHours(actualMinutes);
      const ratio = project.plannedHours ? actualHours / project.plannedHours : 0;
      const progress = project.plannedHours
        ? Math.min(100, Math.round(ratio * 100))
        : 0;
      const status = ratio > 1 ? 'overrun' : ratio >= 0.8 ? 'near-limit' : 'on-track';

      return {
        projectId: project.id,
        projectName: project.name,
        plannedHours: project.plannedHours,
        actualHours,
        progress,
        status,
      };
    });
  }

  toCsv(entries: TimeEntry[], projects: Project[]): string {
    const projectById = new Map(projects.map((project) => [project.id, project.name]));
    const rows = entries.map((entry) => [
      entry.date,
      projectById.get(entry.projectId) ?? entry.projectId,
      minutesToHours(entry.minutes).toString(),
      entry.billable ? 'yes' : 'no',
      entry.description.replaceAll('"', '""'),
    ]);

    return [['Date', 'Project', 'Hours', 'Billable', 'Description'], ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
  }
}
