export interface Project {
  id: string;
  userId: string;
  name: string;
  client: string;
  plannedHours: number;
  color: string;
}

export interface WorkTask {
  id: string;
  projectId: string;
  title: string;
  plannedHours: number;
  status: 'todo' | 'active' | 'done';
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId: string;
  date: string;
  minutes: number;
  description: string;
  billable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntryDraft {
  projectId: string;
  taskId: string;
  date: string;
  minutes: number;
  description: string;
  billable: boolean;
}

export interface EntryFilters {
  query: string;
  projectId: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date-desc' | 'date-asc' | 'minutes-desc';
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  plannedHours: number;
  actualHours: number;
  progress: number;
}
