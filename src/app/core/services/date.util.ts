export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const minutesToHours = (minutes: number): number => Math.round((minutes / 60) * 10) / 10;

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${hours}h ${rest.toString().padStart(2, '0')}m`;
};

export const isWithinPeriod = (date: string, from: string, to: string): boolean => {
  const afterStart = !from || date >= from;
  const beforeEnd = !to || date <= to;

  return afterStart && beforeEnd;
};
