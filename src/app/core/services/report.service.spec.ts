import { EntryFilters, Project, TimeEntry } from '../models/time.model';
import { ReportService } from './report.service';

const projects: Project[] = [
  {
    id: 'p1',
    userId: 'u1',
    name: 'Client Portal',
    client: 'Northwind',
    plannedHours: 10,
    color: '#0f8b8d',
  },
  {
    id: 'p2',
    userId: 'u1',
    name: 'Design System',
    client: 'Contoso',
    plannedHours: 5,
    color: '#8a5cf6',
  },
];

const entries: TimeEntry[] = [
  {
    id: 'e1',
    userId: 'u1',
    projectId: 'p1',
    taskId: 't1',
    date: '2026-04-20',
    minutes: 60,
    description: 'Auth work',
    billable: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'e2',
    userId: 'u1',
    projectId: 'p2',
    taskId: 't2',
    date: '2026-04-21',
    minutes: 150,
    description: 'Dashboard layout',
    billable: true,
    createdAt: '',
    updatedAt: '',
  },
];

const filters: EntryFilters = {
  query: '',
  projectId: '',
  dateFrom: '2026-04-01',
  dateTo: '2026-04-30',
  sortBy: 'date-desc',
};

describe('ReportService', () => {
  const service = new ReportService();

  it('filters entries by project', () => {
    expect(service.filterEntries(entries, { ...filters, projectId: 'p1' })).toHaveLength(1);
  });

  it('filters entries by search query', () => {
    expect(service.filterEntries(entries, { ...filters, query: 'dashboard' })[0].id).toBe('e2');
  });

  it('sorts entries by duration', () => {
    expect(service.filterEntries(entries, { ...filters, sortBy: 'minutes-desc' })[0].id).toBe('e2');
  });

  it('builds project summary with progress and status', () => {
    const summary = service.buildProjectSummary(projects, entries);

    expect(summary[0]).toMatchObject({
      projectId: 'p1',
      actualHours: 1,
      progress: 10,
      status: 'on-track',
    });
  });

  it('marks projects as near limit or overrun', () => {
    const summary = service.buildProjectSummary(projects, [
      { ...entries[0], projectId: 'p1', minutes: 9 * 60 },
      { ...entries[1], projectId: 'p2', minutes: 6 * 60 },
    ]);

    expect(summary[0].status).toBe('near-limit');
    expect(summary[1].status).toBe('overrun');
  });

  it('exports quoted csv', () => {
    const csv = service.toCsv(entries, projects);

    expect(csv).toContain('"Date","Project","Hours","Billable","Description"');
    expect(csv).toContain('"Client Portal"');
  });
});
