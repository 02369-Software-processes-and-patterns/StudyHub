/**
 * Shared constants for course-related components.
 */

export const ECTS_OPTIONS = [
	{ label: '2.5 ECTS', value: '2.5' },
	{ label: '5 ECTS', value: '5' },
	{ label: '7.5 ECTS', value: '7.5' },
	{ label: '10 ECTS', value: '10' },
	{ label: '15 ECTS', value: '15' },
	{ label: '20 ECTS', value: '20' }
] as const;

export const WEEKDAYS = [
	{ label: 'Mon', value: 1 },
	{ label: 'Tue', value: 2 },
	{ label: 'Wed', value: 3 },
	{ label: 'Thu', value: 4 },
	{ label: 'Fri', value: 5 }
] as const;

/**
 * Toggle a weekday in an array of selected weekdays.
 * Returns a new array with the day added or removed.
 */
export function toggleWeekday(selectedWeekdays: number[], day: number): number[] {
	if (selectedWeekdays.includes(day)) {
		return selectedWeekdays.filter((d) => d !== day);
	}
	return [...selectedWeekdays, day];
}
