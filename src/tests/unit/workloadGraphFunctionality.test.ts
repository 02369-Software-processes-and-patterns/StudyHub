import { describe, it, expect } from 'vitest';
import {
	getStartOfWeek,
	getStartOfMonth,
	getEndOfMonth,
	getWeekNumber,
	isTaskOverdue,
	isTaskIncomplete,
	isTaskCompleted,
	getTotal,
	calculateSummaryTotals,
	type Task,
	type DayData,
	type WeekData
} from '$lib/utility/workloadCalculation';

describe('Workload Graph Functionality - Unit Tests', () => {
	describe('getStartOfWeek', () => {
		it('should return Monday for a date in the middle of the week', () => {
			const wednesday = new Date('2024-12-11'); // Wednesday
			const result = getStartOfWeek(wednesday);

			expect(result.getDay()).toBe(1); // Monday
			expect(result.getDate()).toBe(9); // Dec 9 is Monday
		});

		it('should return the same date if already Monday', () => {
			const monday = new Date('2024-12-09'); // Monday
			const result = getStartOfWeek(monday);

			expect(result.getDay()).toBe(1);
			expect(result.getDate()).toBe(9);
		});

		it('should handle Sunday correctly (return previous Monday)', () => {
			const sunday = new Date('2024-12-15'); // Sunday
			const result = getStartOfWeek(sunday);

			expect(result.getDay()).toBe(1); // Monday
			expect(result.getDate()).toBe(9); // Previous Monday
		});

		it('should handle year boundary correctly', () => {
			const newYear = new Date('2025-01-01'); // Wednesday
			const result = getStartOfWeek(newYear);

			expect(result.getDay()).toBe(1); // Monday
			expect(result.getFullYear()).toBe(2024); // Previous year
			expect(result.getMonth()).toBe(11); // December
			expect(result.getDate()).toBe(30); // Dec 30, 2024
		});
	});

	describe('getStartOfMonth', () => {
		it('should return first day of the month', () => {
			const midMonth = new Date('2024-12-15');
			const result = getStartOfMonth(midMonth);

			expect(result.getDate()).toBe(1);
			expect(result.getMonth()).toBe(11); // December (0-indexed)
			expect(result.getFullYear()).toBe(2024);
		});

		it('should return same date if already first of month', () => {
			const firstDay = new Date('2024-12-01');
			const result = getStartOfMonth(firstDay);

			expect(result.getDate()).toBe(1);
			expect(result.getMonth()).toBe(11);
		});

		it('should handle leap year February', () => {
			const leapYear = new Date('2024-02-29');
			const result = getStartOfMonth(leapYear);

			expect(result.getDate()).toBe(1);
			expect(result.getMonth()).toBe(1); // February
			expect(result.getFullYear()).toBe(2024);
		});
	});

	describe('getEndOfMonth', () => {
		it('should return last day of the month', () => {
			const midMonth = new Date('2024-12-15');
			const result = getEndOfMonth(midMonth);

			expect(result.getDate()).toBe(31);
			expect(result.getMonth()).toBe(11); // December
		});

		it('should handle February in non-leap year', () => {
			const feb2023 = new Date('2023-02-15');
			const result = getEndOfMonth(feb2023);

			expect(result.getDate()).toBe(28);
			expect(result.getMonth()).toBe(1); // February
		});

		it('should handle February in leap year', () => {
			const feb2024 = new Date('2024-02-15');
			const result = getEndOfMonth(feb2024);

			expect(result.getDate()).toBe(29);
			expect(result.getMonth()).toBe(1); // February
		});

		it('should handle 30-day months', () => {
			const november = new Date('2024-11-15');
			const result = getEndOfMonth(november);

			expect(result.getDate()).toBe(30);
			expect(result.getMonth()).toBe(10); // November
		});
	});

	describe('getWeekNumber', () => {
		it('should calculate ISO week number correctly', () => {
			const date1 = new Date('2024-01-01');
			expect(getWeekNumber(date1)).toBe(1);

			const date2 = new Date('2024-12-10');
			expect(getWeekNumber(date2)).toBe(50);
		});

		it('should handle week 53', () => {
			const date = new Date('2020-12-31'); // 2020 had 53 weeks
			expect(getWeekNumber(date)).toBe(53);
		});

		it('should handle year boundary where week belongs to previous year', () => {
			const date = new Date('2024-01-01'); // Monday, part of week 1
			const weekNum = getWeekNumber(date);
			expect(weekNum).toBeGreaterThan(0);
			expect(weekNum).toBeLessThan(54);
		});

		it('should return consistent week numbers for same week', () => {
			const monday = new Date('2024-12-09');
			const friday = new Date('2024-12-13');

			expect(getWeekNumber(monday)).toBe(getWeekNumber(friday));
		});
	});

	describe('isTaskOverdue', () => {
		it('should return true for task with past deadline and not completed', () => {
			const task: Task = {
				id: '1',
				name: 'Overdue Task',
				status: 'todo',
				deadline: '2024-12-01T10:00:00Z',
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskOverdue(task, now)).toBe(true);
		});

		it('should return false for task with past deadline but completed', () => {
			const task: Task = {
				id: '1',
				name: 'Completed Task',
				status: 'completed',
				deadline: '2024-12-01T10:00:00Z',
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskOverdue(task, now)).toBe(false);
		});

		it('should return false for task with future deadline', () => {
			const task: Task = {
				id: '1',
				name: 'Future Task',
				status: 'todo',
				deadline: '2024-12-20T10:00:00Z',
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskOverdue(task, now)).toBe(false);
		});

		it('should return false for task without deadline', () => {
			const task: Task = {
				id: '1',
				name: 'No Deadline',
				status: 'todo',
				deadline: null,
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskOverdue(task, now)).toBe(false);
		});

		it('should return true for task overdue by minutes', () => {
			const task: Task = {
				id: '1',
				name: 'Just Overdue',
				status: 'working',
				deadline: '2024-12-10T11:59:00Z',
				effort_hours: 2
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskOverdue(task, now)).toBe(true);
		});
	});

	describe('isTaskIncomplete', () => {
		it('should return true for task with future deadline and not completed', () => {
			const task: Task = {
				id: '1',
				name: 'Incomplete Task',
				status: 'todo',
				deadline: '2024-12-20T10:00:00Z',
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskIncomplete(task, now)).toBe(true);
		});

		it('should return false for task with past deadline', () => {
			const task: Task = {
				id: '1',
				name: 'Past Task',
				status: 'todo',
				deadline: '2024-12-01T10:00:00Z',
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskIncomplete(task, now)).toBe(false);
		});

		it('should return false for completed task', () => {
			const task: Task = {
				id: '1',
				name: 'Completed Task',
				status: 'completed',
				deadline: '2024-12-20T10:00:00Z',
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskIncomplete(task, now)).toBe(false);
		});

		it('should return false for task without deadline', () => {
			const task: Task = {
				id: '1',
				name: 'No Deadline',
				status: 'todo',
				deadline: null,
				effort_hours: 5
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskIncomplete(task, now)).toBe(false);
		});

		it('should return true for task with deadline exactly at now', () => {
			const task: Task = {
				id: '1',
				name: 'Right Now',
				status: 'working',
				deadline: '2024-12-10T12:00:00Z',
				effort_hours: 3
			};
			const now = new Date('2024-12-10T12:00:00Z');

			expect(isTaskIncomplete(task, now)).toBe(true);
		});
	});

	describe('isTaskCompleted', () => {
		it('should return true for task with completed status', () => {
			const task: Task = {
				id: '1',
				name: 'Done',
				status: 'completed',
				deadline: '2024-12-10',
				effort_hours: 5
			};

			expect(isTaskCompleted(task)).toBe(true);
		});

		it('should return false for task with todo status', () => {
			const task: Task = {
				id: '1',
				name: 'Not Done',
				status: 'todo',
				deadline: '2024-12-10',
				effort_hours: 5
			};

			expect(isTaskCompleted(task)).toBe(false);
		});

		it('should return false for task with working status', () => {
			const task: Task = {
				id: '1',
				name: 'In Progress',
				status: 'working',
				deadline: '2024-12-10',
				effort_hours: 5
			};

			expect(isTaskCompleted(task)).toBe(false);
		});

		it('should return false for task with on-hold status', () => {
			const task: Task = {
				id: '1',
				name: 'On Hold',
				status: 'on-hold',
				deadline: '2024-12-10',
				effort_hours: 5
			};

			expect(isTaskCompleted(task)).toBe(false);
		});

		it('should return false for task with pending status', () => {
			const task: Task = {
				id: '1',
				name: 'Pending',
				status: 'pending',
				deadline: '2024-12-10',
				effort_hours: 5
			};

			expect(isTaskCompleted(task)).toBe(false);
		});
	});

	describe('getTotal', () => {
		it('should sum overdue, incomplete, and completed for DayData', () => {
			const dayData: DayData = {
				date: new Date('2024-12-10'),
				label: 'Tue',
				overdue: 5,
				incomplete: 10,
				completed: 3
			};

			expect(getTotal(dayData)).toBe(18);
		});

		it('should sum overdue, incomplete, and completed for WeekData', () => {
			const weekData: WeekData = {
				weekNumber: 50,
				label: 'Week 50',
				overdue: 8,
				incomplete: 15,
				completed: 7
			};

			expect(getTotal(weekData)).toBe(30);
		});

		it('should return 0 for data with all zeros', () => {
			const emptyData: DayData = {
				date: new Date('2024-12-10'),
				label: 'Tue',
				overdue: 0,
				incomplete: 0,
				completed: 0
			};

			expect(getTotal(emptyData)).toBe(0);
		});

		it('should handle only overdue hours', () => {
			const overdueOnly: WeekData = {
				weekNumber: 50,
				label: 'Week 50',
				overdue: 25,
				incomplete: 0,
				completed: 0
			};

			expect(getTotal(overdueOnly)).toBe(25);
		});

		it('should handle decimal hours', () => {
			const decimalData: DayData = {
				date: new Date('2024-12-10'),
				label: 'Tue',
				overdue: 2.5,
				incomplete: 3.75,
				completed: 1.25
			};

			expect(getTotal(decimalData)).toBe(7.5);
		});
	});

	describe('calculateSummaryTotals', () => {
		it('should calculate totals from DayData array', () => {
			const weekData: DayData[] = [
				{
					date: new Date('2024-12-09'),
					label: 'Mon',
					overdue: 2,
					incomplete: 5,
					completed: 3
				},
				{
					date: new Date('2024-12-10'),
					label: 'Tue',
					overdue: 1,
					incomplete: 4,
					completed: 2
				},
				{
					date: new Date('2024-12-11'),
					label: 'Wed',
					overdue: 0,
					incomplete: 8,
					completed: 1
				}
			];

			const result = calculateSummaryTotals(weekData);

			expect(result.totalOverdue).toBe(3);
			expect(result.totalIncomplete).toBe(17);
			expect(result.totalCompleted).toBe(6);
		});

		it('should calculate totals from WeekData array', () => {
			const monthData: WeekData[] = [
				{
					weekNumber: 48,
					label: 'Week 48',
					overdue: 5,
					incomplete: 10,
					completed: 5
				},
				{
					weekNumber: 49,
					label: 'Week 49',
					overdue: 3,
					incomplete: 12,
					completed: 8
				}
			];

			const result = calculateSummaryTotals(monthData);

			expect(result.totalOverdue).toBe(8);
			expect(result.totalIncomplete).toBe(22);
			expect(result.totalCompleted).toBe(13);
		});

		it('should return zeros for empty array', () => {
			const result = calculateSummaryTotals([]);

			expect(result.totalOverdue).toBe(0);
			expect(result.totalIncomplete).toBe(0);
			expect(result.totalCompleted).toBe(0);
		});

		it('should handle array with single element', () => {
			const singleDay: DayData[] = [
				{
					date: new Date('2024-12-10'),
					label: 'Tue',
					overdue: 4,
					incomplete: 6,
					completed: 2
				}
			];

			const result = calculateSummaryTotals(singleDay);

			expect(result.totalOverdue).toBe(4);
			expect(result.totalIncomplete).toBe(6);
			expect(result.totalCompleted).toBe(2);
		});

		it('should handle decimal values correctly', () => {
			const decimalData: DayData[] = [
				{
					date: new Date('2024-12-09'),
					label: 'Mon',
					overdue: 1.5,
					incomplete: 2.25,
					completed: 3.75
				},
				{
					date: new Date('2024-12-10'),
					label: 'Tue',
					overdue: 0.5,
					incomplete: 1.75,
					completed: 2.25
				}
			];

			const result = calculateSummaryTotals(decimalData);

			expect(result.totalOverdue).toBe(2);
			expect(result.totalIncomplete).toBe(4);
			expect(result.totalCompleted).toBe(6);
		});

		it('should handle data with all zeros', () => {
			const zeroData: WeekData[] = [
				{
					weekNumber: 50,
					label: 'Week 50',
					overdue: 0,
					incomplete: 0,
					completed: 0
				},
				{
					weekNumber: 51,
					label: 'Week 51',
					overdue: 0,
					incomplete: 0,
					completed: 0
				}
			];

			const result = calculateSummaryTotals(zeroData);

			expect(result.totalOverdue).toBe(0);
			expect(result.totalIncomplete).toBe(0);
			expect(result.totalCompleted).toBe(0);
		});

		it('should handle large numbers correctly', () => {
			const largeData: DayData[] = [
				{
					date: new Date('2024-12-09'),
					label: 'Mon',
					overdue: 100,
					incomplete: 500,
					completed: 200
				},
				{
					date: new Date('2024-12-10'),
					label: 'Tue',
					overdue: 150,
					incomplete: 300,
					completed: 250
				}
			];

			const result = calculateSummaryTotals(largeData);

			expect(result.totalOverdue).toBe(250);
			expect(result.totalIncomplete).toBe(800);
			expect(result.totalCompleted).toBe(450);
		});
	});
});
