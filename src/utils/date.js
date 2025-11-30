import { formatDistanceToNow, parseISO } from 'date-fns';

export function formatRelativeTime(dateString) {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
}

