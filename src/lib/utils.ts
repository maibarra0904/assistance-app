export const START_DATE = new Date('2026-04-20');

export function getWeekAndPartial(date: Date) {
  const diffTime = Math.abs(date.getTime() - START_DATE.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // If date is before start date, return week 1
  if (date < START_DATE) return { week: 1, partial: 1 };
  
  const week = Math.ceil(diffDays / 7) || 1;
  const partial = week <= 8 ? 1 : 2;
  
  return { week: Math.min(week, 16), partial };
}

export function getDatesForWeek(week: number) {
  const dates = [];
  const weekStart = new Date(START_DATE);
  weekStart.setDate(START_DATE.getDate() + (week - 1) * 7);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

export const DAYS_SPANISH = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DAYS_ENGLISH_TO_SPANISH: Record<string, string> = {
  'Monday': 'Lunes',
  'Tuesday': 'Martes',
  'Wednesday': 'Miércoles',
  'Thursday': 'Jueves',
  'Friday': 'Viernes',
  'Saturday': 'Sábado',
  'Sunday': 'Domingo'
};

export function toTitleCase(str: string) {
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}
