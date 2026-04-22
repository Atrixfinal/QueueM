import { CrowdStatus } from '@/lib/types/location';

export function formatTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatWaitTime(minutes?: number): string {
  if (!minutes || minutes <= 0) return 'No wait';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    serving: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    skipped: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getCrowdStatusColor(status: CrowdStatus): string {
  const colors = { low: 'text-green-600', medium: 'text-yellow-600', high: 'text-red-600' };
  return colors[status];
}

export function getCrowdStatusBadgeColor(status: CrowdStatus): string {
  const colors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-red-500',
  };
  return colors[status];
}
