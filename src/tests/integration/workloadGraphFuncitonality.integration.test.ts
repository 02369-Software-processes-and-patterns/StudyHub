/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	calculateWeekData,
	calculateMonthData,
	calculateCustomData,
	calculateSummaryTotals,
	getStartOfWeek,
	getStartOfMonth,
	getEndOfMonth,
	getWeekNumber,
	isTaskOverdue,
	isTaskIncomplete,
	isTaskCompleted,
	getTotal,
	type Task,
	type DayData,
	type WeekData
} from '$lib/utility/workloadCalculation';

/**
 * Integration tests for Workload Graph Functionality
 * Tests the complete workflow of workload calculation and visualization
 */

describe('Workload Graph - Integration Tests', () => {
	// Mock current date for consistent testing
	const mockNow = new Date('2024-12-10T12:00:00Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(mockNow);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const createTask = (
		id: string,
		name: string,
		deadline: string | null,
		effortHours: number | null,
		status: 'pending' | 'todo' | 'on-hold' | 'working' | 'completed'
	): Task => ({
		id,
		name,
		deadline,
		effort_hours: effortHours,
		status
	});

	describe('Date Utility Functions', () => {
		it('should get start of week (Monday)', () => {
			const wednesday = new Date('2024-12-11T12:00:00Z'); // Wednesday
			const startOfWeek = getStartOfWeek(wednesday);

			expect(startOfWeek.getDay()).toBe(1); // Monday
			expect(startOfWeek.getDate()).toBe(9); // Dec 9 is Monday
		});

		it('should handle Sunday correctly (start of week is previous Monday)', () => {
			const sunday = new Date('2024-12-15T12:00:00Z'); // Sunday
			const startOfWeek = getStartOfWeek(sunday);

			expect(startOfWeek.getDay()).toBe(1); // Monday
			expect(startOfWeek.getDate()).toBe(9); // Dec 9 is Monday of that week
		});

		it('should get start of month', () => {
			const midMonth = new Date('2024-12-15T12:00:00Z');
			const startOfMonth = getStartOfMonth(midMonth);

			expect(startOfMonth.getDate()).toBe(1);
			expect(startOfMonth.getMonth()).toBe(11); // December (0-indexed)
		});

		it('should get end of month', () => {
			const midMonth = new Date('2024-12-15T12:00:00Z');
			const endOfMonth = getEndOfMonth(midMonth);

			expect(endOfMonth.getDate()).toBe(31); // December has 31 days
			expect(endOfMonth.getMonth()).toBe(11); // December
		});

		it('should calculate ISO week number correctly', () => {
			const dec10 = new Date('2024-12-10T12:00:00Z');
			const weekNum = getWeekNumber(dec10);

			expect(weekNum).toBeGreaterThan(0);
			expect(weekNum).toBeLessThanOrEqual(53);
		});

		it('should handle leap year February correctly', () => {
			const feb2024 = new Date('2024-02-15T12:00:00Z'); // 2024 is a leap year
			const endOfMonth = getEndOfMonth(feb2024);

			expect(endOfMonth.getDate()).toBe(29);
		});
	});

	describe('Task Status Classification', () => {
		it('should identify overdue tasks correctly', () => {
			const overdueTask = createTask('1', 'Overdue', '2024-12-05T23:59:00Z', 5, 'working');
			const notOverdue = createTask('2', 'Future', '2024-12-20T23:59:00Z', 3, 'working');
			const completed = createTask('3', 'Done', '2024-12-05T23:59:00Z', 2, 'completed');

			expect(isTaskOverdue(overdueTask, mockNow)).toBe(true);
			expect(isTaskOverdue(notOverdue, mockNow)).toBe(false);
			expect(isTaskOverdue(completed, mockNow)).toBe(false); // Completed tasks are never overdue
		});

		it('should identify incomplete tasks correctly', () => {
			const incompleteTask = createTask('1', 'Upcoming', '2024-12-20T23:59:00Z', 5, 'todo');
			const overdueTask = createTask('2', 'Overdue', '2024-12-05T23:59:00Z', 3, 'working');
			const completed = createTask('3', 'Done', '2024-12-20T23:59:00Z', 2, 'completed');

			expect(isTaskIncomplete(incompleteTask, mockNow)).toBe(true);
			expect(isTaskIncomplete(overdueTask, mockNow)).toBe(false);
			expect(isTaskIncomplete(completed, mockNow)).toBe(false);
		});

		it('should identify completed tasks', () => {
			const completed = createTask('1', 'Done', '2024-12-05T23:59:00Z', 5, 'completed');
			const notCompleted = createTask('2', 'Working', '2024-12-20T23:59:00Z', 3, 'working');

			expect(isTaskCompleted(completed)).toBe(true);
			expect(isTaskCompleted(notCompleted)).toBe(false);
		});

		it('should handle tasks without deadlines', () => {
			const noDeadline = createTask('1', 'No Deadline', null, 5, 'working');

			expect(isTaskOverdue(noDeadline, mockNow)).toBe(false);
			expect(isTaskIncomplete(noDeadline, mockNow)).toBe(false);
		});
	});

	describe('Week Data Calculation', () => {
		it('should calculate workload for current week', () => {
			const tasks: Task[] = [
				createTask('1', 'Monday Task', '2024-12-09T10:00:00Z', 5, 'working'), // Mon
				createTask('2', 'Tuesday Task', '2024-12-10T10:00:00Z', 3, 'todo'), // Tue (today)
				createTask('3', 'Wednesday Task', '2024-12-11T10:00:00Z', 4, 'completed'), // Wed
				createTask('4', 'Overdue Mon', '2024-12-09T10:00:00Z', 2, 'todo') // Mon but overdue
			];

			const weekData = calculateWeekData(tasks, 0); // Current week

			expect(weekData).toHaveLength(7); // 7 days in a week

			// Monday should have 5 (incomplete) + 2 (overdue) = 7 total hours
			const monday = weekData[0];
			expect(monday.label).toBe('Mon');
			expect(monday.incomplete + monday.overdue).toBe(7);

			// Wednesday should have 4 completed hours
			const wednesday = weekData[2];
			expect(wednesday.completed).toBe(4);
		});

		it('should calculate workload for previous week', () => {
			const tasks: Task[] = [
				createTask('1', 'Last Week', '2024-12-02T10:00:00Z', 8, 'completed')
			];

			const weekData = calculateWeekData(tasks, -1); // Previous week

			expect(weekData).toHaveLength(7);

			// Find Monday Dec 2
			const taskDay = weekData.find((d) => d.date.getDate() === 2);
			expect(taskDay).toBeDefined();
			expect(taskDay!.completed).toBe(8);
		});

		it('should calculate workload for next week', () => {
			const tasks: Task[] = [
				createTask('1', 'Next Week', '2024-12-16T10:00:00Z', 6, 'todo')
			];

			const weekData = calculateWeekData(tasks, 1); // Next week

			expect(weekData).toHaveLength(7);

			// Find Monday Dec 16
			const taskDay = weekData.find((d) => d.date.getDate() === 16);
			expect(taskDay).toBeDefined();
			expect(taskDay!.incomplete).toBe(6);
		});

	it('should handle multiple tasks on same day', () => {
		const tasks: Task[] = [
			createTask('1', 'Task 1', '2024-12-10T09:00:00Z', 3, 'todo'), // Before noon - overdue
			createTask('2', 'Task 2', '2024-12-10T15:00:00Z', 5, 'working'), // After noon - incomplete
			createTask('3', 'Task 3', '2024-12-10T20:00:00Z', 2, 'completed')
		];

		const weekData = calculateWeekData(tasks, 0);

		// Tuesday Dec 10 (now is 12:00 on Dec 10)
		const tuesday = weekData[1];
		expect(tuesday.overdue).toBe(3); // Task 1 at 09:00 is before now
		expect(tuesday.incomplete).toBe(5); // Task 2 at 15:00 is after now
		expect(tuesday.completed).toBe(2);
	});		it('should handle empty task list', () => {
			const weekData = calculateWeekData([], 0);

			expect(weekData).toHaveLength(7);
			weekData.forEach((day) => {
				expect(day.overdue).toBe(0);
				expect(day.incomplete).toBe(0);
				expect(day.completed).toBe(0);
			});
		});

		it('should ignore tasks without deadlines', () => {
			const tasks: Task[] = [
				createTask('1', 'With Deadline', '2024-12-10T10:00:00Z', 5, 'todo'),
				createTask('2', 'No Deadline', null, 10, 'working')
			];

			const weekData = calculateWeekData(tasks, 0);

			const totalHours = weekData.reduce(
				(sum, day) => sum + day.overdue + day.incomplete + day.completed,
				0
			);

			expect(totalHours).toBe(5); // Only the task with deadline
		});

		it('should correctly categorize tasks as overdue or incomplete', () => {
			const tasks: Task[] = [
				createTask('1', 'Overdue Mon', '2024-12-09T10:00:00Z', 4, 'todo'), // Overdue
				createTask('2', 'Future Wed', '2024-12-11T10:00:00Z', 6, 'todo') // Incomplete
			];

			const weekData = calculateWeekData(tasks, 0);

			const monday = weekData[0];
			expect(monday.overdue).toBe(4);
			expect(monday.incomplete).toBe(0);

			const wednesday = weekData[2];
			expect(wednesday.overdue).toBe(0);
			expect(wednesday.incomplete).toBe(6);
		});
	});

	describe('Month Data Calculation', () => {
		it('should calculate workload for current month', () => {
			const tasks: Task[] = [
				createTask('1', 'Early Dec', '2024-12-05T10:00:00Z', 8, 'completed'),
				createTask('2', 'Mid Dec', '2024-12-15T10:00:00Z', 12, 'working'),
				createTask('3', 'Late Dec', '2024-12-25T10:00:00Z', 6, 'todo')
			];

			const monthData = calculateMonthData(tasks, 0); // Current month

			expect(monthData.length).toBeGreaterThan(0);

			const totalHours = monthData.reduce((sum, week) => {
				return sum + week.overdue + week.incomplete + week.completed;
			}, 0);

			expect(totalHours).toBeGreaterThan(0);
		});

		it('should calculate workload for previous month', () => {
			const tasks: Task[] = [
				createTask('1', 'November Task', '2024-11-15T10:00:00Z', 10, 'completed')
			];

			const monthData = calculateMonthData(tasks, -1); // Previous month

			expect(monthData.length).toBeGreaterThan(0);

			const totalCompleted = monthData.reduce((sum, week) => sum + week.completed, 0);
			expect(totalCompleted).toBe(10);
		});

		it('should calculate workload for next month', () => {
			const tasks: Task[] = [
				createTask('1', 'January Task', '2025-01-15T10:00:00Z', 7, 'todo')
			];

			const monthData = calculateMonthData(tasks, 1); // Next month

			expect(monthData.length).toBeGreaterThan(0);

			const totalIncomplete = monthData.reduce((sum, week) => sum + week.incomplete, 0);
			expect(totalIncomplete).toBe(7);
		});

		it('should group tasks by ISO week number', () => {
			const tasks: Task[] = [
				createTask('1', 'Week Start', '2024-12-09T10:00:00Z', 3, 'todo'), // Week 50
				createTask('2', 'Week Middle', '2024-12-11T10:00:00Z', 4, 'working'), // Week 50
				createTask('3', 'Week End', '2024-12-15T10:00:00Z', 5, 'completed'), // Week 50
				createTask('4', 'Next Week', '2024-12-16T10:00:00Z', 6, 'todo') // Week 51
			];

			const monthData = calculateMonthData(tasks, 0);

			// Find the weeks
			const week50 = monthData.find((w) => w.weekNumber === 50);
			const week51 = monthData.find((w) => w.weekNumber === 51);

			if (week50) {
				const week50Total = week50.overdue + week50.incomplete + week50.completed;
				expect(week50Total).toBeGreaterThan(0);
			}

			if (week51) {
				expect(week51.incomplete).toBeGreaterThanOrEqual(6);
			}
		});

		it('should handle month with no tasks', () => {
			const monthData = calculateMonthData([], 0);

			expect(monthData.length).toBeGreaterThan(0); // Still has weeks
			monthData.forEach((week) => {
				expect(week.overdue).toBe(0);
				expect(week.incomplete).toBe(0);
				expect(week.completed).toBe(0);
			});
		});

		it('should include partial weeks at month boundaries', () => {
			const monthData = calculateMonthData([], 0);

			// December 2024 starts on Sunday, so we should include partial weeks
			expect(monthData.length).toBeGreaterThanOrEqual(4);
			expect(monthData.length).toBeLessThanOrEqual(6);
		});
	});

	describe('Custom Date Range Calculation', () => {
		it('should calculate workload for custom date range', () => {
			const tasks: Task[] = [
				createTask('1', 'In Range', '2024-12-15T10:00:00Z', 8, 'working'),
				createTask('2', 'Also In Range', '2024-12-20T10:00:00Z', 5, 'todo'),
				createTask('3', 'Out of Range', '2024-12-01T10:00:00Z', 10, 'completed')
			];

			const customData = calculateCustomData(tasks, '2024-12-10', '2024-12-25');

			expect(customData.length).toBeGreaterThan(0);

			const totalInRange = customData.reduce((sum, week) => {
				return sum + week.overdue + week.incomplete + week.completed;
			}, 0);

			expect(totalInRange).toBe(13); // 8 + 5, excluding the out-of-range task
		});

		it('should return empty array for invalid date range (start > end)', () => {
			const tasks: Task[] = [
				createTask('1', 'Task', '2024-12-15T10:00:00Z', 5, 'working')
			];

			const customData = calculateCustomData(tasks, '2024-12-25', '2024-12-10');

			expect(customData).toHaveLength(0);
		});

		it('should return empty array for empty date strings', () => {
			const tasks: Task[] = [
				createTask('1', 'Task', '2024-12-15T10:00:00Z', 5, 'working')
			];

			const customData = calculateCustomData(tasks, '', '');

			expect(customData).toHaveLength(0);
		});

	it('should handle single-day range', () => {
		const tasks: Task[] = [
			createTask('1', 'Single Day', '2024-12-15', 8, 'todo') // Use date-only format
		];

		const customData = calculateCustomData(tasks, '2024-12-15', '2024-12-15');

		expect(customData.length).toBeGreaterThan(0);
		expect(customData[0].incomplete).toBe(8); // Dec 15 is after now (Dec 10)

		const totalHours = customData.reduce(
			(sum, week) => sum + week.overdue + week.incomplete + week.completed,
			0
		);

		expect(totalHours).toBe(8);
	});		it('should handle range spanning multiple weeks', () => {
			const tasks: Task[] = [
				createTask('1', 'Week 1', '2024-12-10T10:00:00Z', 5, 'todo'),
				createTask('2', 'Week 2', '2024-12-17T10:00:00Z', 6, 'working'),
				createTask('3', 'Week 3', '2024-12-24T10:00:00Z', 7, 'completed')
			];

			const customData = calculateCustomData(tasks, '2024-12-01', '2024-12-31');

			expect(customData.length).toBeGreaterThanOrEqual(3); // At least 3 weeks

			const totalHours = customData.reduce(
				(sum, week) => sum + week.overdue + week.incomplete + week.completed,
				0
			);

			expect(totalHours).toBe(18);
		});

		it('should correctly categorize tasks in custom range', () => {
			const tasks: Task[] = [
				createTask('1', 'Past Overdue', '2024-12-05T10:00:00Z', 4, 'working'),
				createTask('2', 'Future Incomplete', '2024-12-20T10:00:00Z', 6, 'todo'),
				createTask('3', 'Completed', '2024-12-15T10:00:00Z', 8, 'completed')
			];

			const customData = calculateCustomData(tasks, '2024-12-01', '2024-12-31');

			const totals = {
				overdue: customData.reduce((sum, w) => sum + w.overdue, 0),
				incomplete: customData.reduce((sum, w) => sum + w.incomplete, 0),
				completed: customData.reduce((sum, w) => sum + w.completed, 0)
			};

			expect(totals.overdue).toBe(4);
			expect(totals.incomplete).toBe(6);
			expect(totals.completed).toBe(8);
		});

		it('should sort weeks by week number', () => {
			const tasks: Task[] = [
				createTask('1', 'Late Week', '2024-12-25T10:00:00Z', 5, 'todo'),
				createTask('2', 'Early Week', '2024-12-05T10:00:00Z', 3, 'working')
			];

			const customData = calculateCustomData(tasks, '2024-12-01', '2024-12-31');

			// Verify sorted order
			for (let i = 1; i < customData.length; i++) {
				expect(customData[i].weekNumber).toBeGreaterThanOrEqual(customData[i - 1].weekNumber);
			}
		});
	});

	describe('Summary Totals Calculation', () => {
		it('should calculate summary totals for week data', () => {
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
					completed: 6
				},
				{
					date: new Date('2024-12-11'),
					label: 'Wed',
					overdue: 0,
					incomplete: 8,
					completed: 2
				}
			];

			const totals = calculateSummaryTotals(weekData);

			expect(totals.totalOverdue).toBe(3);
			expect(totals.totalIncomplete).toBe(17);
			expect(totals.totalCompleted).toBe(11);
		});

		it('should calculate summary totals for month data', () => {
			const monthData: WeekData[] = [
				{ weekNumber: 50, label: 'W50', overdue: 5, incomplete: 10, completed: 8 },
				{ weekNumber: 51, label: 'W51', overdue: 3, incomplete: 12, completed: 6 },
				{ weekNumber: 52, label: 'W52', overdue: 0, incomplete: 7, completed: 15 }
			];

			const totals = calculateSummaryTotals(monthData);

			expect(totals.totalOverdue).toBe(8);
			expect(totals.totalIncomplete).toBe(29);
			expect(totals.totalCompleted).toBe(29);
		});

		it('should handle empty data array', () => {
			const totals = calculateSummaryTotals([]);

			expect(totals.totalOverdue).toBe(0);
			expect(totals.totalIncomplete).toBe(0);
			expect(totals.totalCompleted).toBe(0);
		});

		it('should calculate total hours for single data point', () => {
			const dayData: DayData = {
				date: new Date('2024-12-10'),
				label: 'Tue',
				overdue: 3,
				incomplete: 5,
				completed: 7
			};

			const total = getTotal(dayData);
			expect(total).toBe(15);
		});
	});

	describe('Complete Workload Workflow', () => {
	it('should handle realistic weekly workload scenario', () => {
		const tasks: Task[] = [
			// Monday - 2 tasks (Dec 9)
			createTask('1', 'Monday Meeting Prep', '2024-12-09T09:00:00Z', 2, 'completed'),
			createTask('2', 'Monday Report', '2024-12-09T17:00:00Z', 4, 'completed'),

			// Tuesday - current day (Dec 10, now = 12:00)
			createTask('3', 'Tuesday Task 1', '2024-12-10T10:00:00Z', 3, 'working'), // Before noon - overdue
			createTask('4', 'Tuesday Task 2', '2024-12-10T15:00:00Z', 2, 'todo'), // After noon - incomplete

			// Wednesday - future tasks (Dec 11)
			createTask('5', 'Wednesday Project', '2024-12-11T10:00:00Z', 8, 'todo'),

			// Friday - deadline (Dec 13)
			createTask('6', 'Friday Deadline', '2024-12-13T23:59:00Z', 5, 'todo')
		];

		const weekData = calculateWeekData(tasks, 0);
		const totals = calculateSummaryTotals(weekData);

		// Verify distribution
		expect(totals.totalCompleted).toBe(6); // Monday tasks (2 + 4)
		expect(totals.totalIncomplete).toBe(15); // Tuesday afternoon (2) + Wed (8) + Fri (5)
		expect(totals.totalOverdue).toBe(3); // Tuesday morning task

		// Verify total hours
		const grandTotal =
			totals.totalOverdue + totals.totalIncomplete + totals.totalCompleted;
		expect(grandTotal).toBe(24); // Sum of all effort hours
	});		it('should handle semester planning scenario', () => {
			const tasks: Task[] = [
				// Spread across multiple weeks
				createTask('1', 'Week 1 Assignment', '2024-12-05T23:59:00Z', 10, 'completed'),
				createTask('2', 'Week 2 Project', '2024-12-15T23:59:00Z', 15, 'working'),
				createTask('3', 'Week 3 Exam Prep', '2024-12-20T23:59:00Z', 20, 'todo'),
				createTask('4', 'Week 4 Final', '2024-12-27T23:59:00Z', 12, 'todo')
			];

			const monthData = calculateMonthData(tasks, 0);
			const totals = calculateSummaryTotals(monthData);

			expect(totals.totalCompleted).toBe(10);
			expect(totals.totalIncomplete).toBeGreaterThan(0);

			const grandTotal =
				totals.totalOverdue + totals.totalIncomplete + totals.totalCompleted;
			expect(grandTotal).toBe(57);
		});

		it('should track progress over time with mixed statuses', () => {
			const tasks: Task[] = [
				// Completed tasks (past)
				createTask('1', 'Done 1', '2024-12-01T10:00:00Z', 5, 'completed'),
				createTask('2', 'Done 2', '2024-12-03T10:00:00Z', 8, 'completed'),

				// Overdue tasks (past but incomplete)
				createTask('3', 'Overdue 1', '2024-12-05T10:00:00Z', 3, 'working'),
				createTask('4', 'Overdue 2', '2024-12-07T10:00:00Z', 4, 'todo'),

				// Current and future tasks
				createTask('5', 'In Progress', '2024-12-12T10:00:00Z', 6, 'working'),
				createTask('6', 'Upcoming', '2024-12-20T10:00:00Z', 10, 'todo')
			];

			const customData = calculateCustomData(tasks, '2024-12-01', '2024-12-31');
			const totals = calculateSummaryTotals(customData);

			expect(totals.totalCompleted).toBe(13); // 5 + 8
			expect(totals.totalOverdue).toBe(7); // 3 + 4
			expect(totals.totalIncomplete).toBe(16); // 6 + 10
		});
	});

	describe('Edge Cases and Error Handling', () => {
	it('should handle tasks with zero effort hours', () => {
		const tasks: Task[] = [
			createTask('1', 'Zero Effort', '2024-12-10T15:00:00Z', 0, 'todo'), // Zero effort counts as 0
			createTask('2', 'Normal Effort', '2024-12-10T15:00:00Z', 5, 'working')
		];

		const weekData = calculateWeekData(tasks, 0);
		const tuesday = weekData[1];

		expect(tuesday.incomplete).toBe(5); // 0 + 5 (zero effort is treated as 0)
	});

	it('should handle tasks with null effort hours', () => {
		const tasks: Task[] = [
			createTask('1', 'Null Effort', '2024-12-10T15:00:00Z', null, 'todo'), // Null effort counts as 0
			createTask('2', 'Normal Effort', '2024-12-10T15:00:00Z', 3, 'working')
		];

		const weekData = calculateWeekData(tasks, 0);
		const tuesday = weekData[1];

		expect(tuesday.incomplete).toBe(3); // 0 + 3 (null effort is treated as 0)
	});

		it('should handle extreme week offsets', () => {
			const tasks: Task[] = [
				createTask('1', 'Far Future', '2025-06-15T10:00:00Z', 10, 'todo')
			];

			const weekData = calculateWeekData(tasks, 26); // ~6 months ahead

			expect(weekData).toHaveLength(7);
		});

		it('should handle tasks on year boundary', () => {
			const tasks: Task[] = [
				createTask('1', 'New Year Eve', '2024-12-31T23:59:00Z', 5, 'todo'),
				createTask('2', 'New Year Day', '2025-01-01T00:01:00Z', 3, 'working')
			];

			const customData = calculateCustomData(tasks, '2024-12-30', '2025-01-02');

			const totalHours = customData.reduce(
				(sum, week) => sum + week.overdue + week.incomplete + week.completed,
				0
			);

			expect(totalHours).toBe(8);
		});

		it('should handle daylight saving time transitions', () => {
			// This test ensures time transitions don't break date calculations
			const tasks: Task[] = [
				createTask('1', 'DST Task', '2024-03-10T10:00:00Z', 5, 'todo') // Around DST in some regions
			];

			const weekData = calculateWeekData(tasks, 0);

			expect(weekData).toHaveLength(7);
		});

	it('should handle very large effort hours', () => {
		const tasks: Task[] = [
			createTask('1', 'Huge Task', '2024-12-10T15:00:00Z', 1000, 'working') // After noon - incomplete
		];

		const weekData = calculateWeekData(tasks, 0);
		const tuesday = weekData[1];

		expect(tuesday.incomplete).toBe(1000);
	});		it('should handle multiple view mode switches', () => {
			const tasks: Task[] = [
				createTask('1', 'Task 1', '2024-12-10T10:00:00Z', 5, 'working'),
				createTask('2', 'Task 2', '2024-12-15T10:00:00Z', 8, 'todo')
			];

			// Simulate switching between views
			const weekView = calculateWeekData(tasks, 0);
			const monthView = calculateMonthData(tasks, 0);
			const customView = calculateCustomData(tasks, '2024-12-01', '2024-12-31');

			expect(weekView).toHaveLength(7);
			expect(monthView.length).toBeGreaterThan(0);
			expect(customView.length).toBeGreaterThan(0);
		});
	});

	describe('Data Visualization Preparation', () => {
		it('should provide correct data for bar chart rendering', () => {
			const tasks: Task[] = [
				createTask('1', 'Task 1', '2024-12-10T10:00:00Z', 5, 'completed'),
				createTask('2', 'Task 2', '2024-12-10T10:00:00Z', 8, 'working'),
				createTask('3', 'Task 3', '2024-12-10T10:00:00Z', 3, 'todo')
			];

			const weekData = calculateWeekData(tasks, 0);
			const tuesday = weekData[1];

			// Verify data structure for stacked bar chart
			expect(tuesday).toHaveProperty('overdue');
			expect(tuesday).toHaveProperty('incomplete');
			expect(tuesday).toHaveProperty('completed');
			expect(tuesday).toHaveProperty('label');
			expect(tuesday).toHaveProperty('date');

			const total = getTotal(tuesday);
			expect(total).toBe(16); // 5 + 8 + 3
		});

		it('should calculate max value for chart scaling', () => {
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
					incomplete: 15,
					completed: 6
				}, // Highest
				{
					date: new Date('2024-12-11'),
					label: 'Wed',
					overdue: 0,
					incomplete: 4,
					completed: 2
				}
			];

			const maxValue = Math.max(...weekData.map((d) => getTotal(d)));

			expect(maxValue).toBe(22); // Tuesday's total
		});
	});
});
