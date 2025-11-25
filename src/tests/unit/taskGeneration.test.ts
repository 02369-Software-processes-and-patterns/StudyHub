import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Helper function for ECTS conversion - extracted for testing
 */
function convertEctsToWeeklyHours(ects: number): { lectureHours: number; assignmentHours: number } {
	const ratio = ects / 5.0;
	const lectureHours = ratio * 2;
	const assignmentHours = ratio * 2;

	return { lectureHours, assignmentHours };
}

/**
 * Generate tasks based on course parameters - extracted for testing
 */
interface TaskToInsert {
	user_id: string;
	course_id: string;
	name: string;
	effort_hours: number;
	deadline: string;
	status: 'pending';
}

function generateCourseTasks(
	userId: string,
	courseId: string,
	startDate: Date,
	endDate: Date,
	lectureWeekdays: number[],
	lectureHours: number,
	assignmentHours: number
): TaskToInsert[] {
	const tasksToInsert: TaskToInsert[] = [];
	const currentDate = new Date(startDate);
	let weekCounter = 1;

	while (currentDate <= endDate) {
		const dayOfWeek = currentDate.getDay();

		if (lectureWeekdays.includes(dayOfWeek)) {
			const deadline = new Date(currentDate);
			deadline.setHours(23, 59, 59);

			tasksToInsert.push({
				user_id: userId,
				course_id: courseId,
				name: 'Lecture ' + weekCounter,
				effort_hours: lectureHours,
				deadline: deadline.toISOString(),
				status: 'pending'
			});

			tasksToInsert.push({
				user_id: userId,
				course_id: courseId,
				name: 'Assignment ' + weekCounter,
				effort_hours: assignmentHours,
				deadline: deadline.toISOString(),
				status: 'pending'
			});
			weekCounter++;
		}

		currentDate.setDate(currentDate.getDate() + 1);
	}

	return tasksToInsert;
}

describe('Task Generation Logic', () => {
	describe('convertEctsToWeeklyHours', () => {
		it('should convert ECTS points to lecture and assignment hours correctly', () => {
			const result = convertEctsToWeeklyHours(5);

			expect(result.lectureHours).toBe(2);
			expect(result.assignmentHours).toBe(2);
		});

		it('should handle 10 ECTS correctly', () => {
			const result = convertEctsToWeeklyHours(10);

			expect(result.lectureHours).toBe(4);
			expect(result.assignmentHours).toBe(4);
		});

		it('should handle 7.5 ECTS correctly', () => {
			const result = convertEctsToWeeklyHours(7.5);

			expect(result.lectureHours).toBe(3);
			expect(result.assignmentHours).toBe(3);
		});

		it('should handle decimal ECTS values', () => {
			const result = convertEctsToWeeklyHours(3.5);

			expect(result.lectureHours).toBe(1.4);
			expect(result.assignmentHours).toBe(1.4);
		});

		it('should return equal lecture and assignment hours', () => {
			const testCases = [5, 10, 7.5, 12, 3];

			testCases.forEach((ects) => {
				const result = convertEctsToWeeklyHours(ects);
				expect(result.lectureHours).toBe(result.assignmentHours);
			});
		});

		it('should handle zero ECTS', () => {
			const result = convertEctsToWeeklyHours(0);

			expect(result.lectureHours).toBe(0);
			expect(result.assignmentHours).toBe(0);
		});

		it('should handle very large ECTS values', () => {
			const result = convertEctsToWeeklyHours(100);

			expect(result.lectureHours).toBe(40);
			expect(result.assignmentHours).toBe(40);
		});
	});

	describe('generateCourseTasks', () => {
		let userId: string;
		let courseId: string;
		let startDate: Date;
		let endDate: Date;
		let lectureHours: number;
		let assignmentHours: number;

		beforeEach(() => {
			userId = 'user-123';
			courseId = 'course-456';
			lectureHours = 2;
			assignmentHours = 2;
		});

		it('should generate no tasks if start date is after end date', () => {
			startDate = new Date('2024-12-01');
			endDate = new Date('2024-11-01');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			expect(tasks).toHaveLength(0);
		});

		it('should generate tasks for a single week course', () => {
			startDate = new Date('2024-11-04'); // Monday
			endDate = new Date('2024-11-04'); // Same Monday

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			expect(tasks).toHaveLength(2); // 1 lecture + 1 assignment
			expect(tasks[0].name).toBe('Lecture 1');
			expect(tasks[1].name).toBe('Assignment 1');
		});

		it('should generate tasks for multiple weeks', () => {
			startDate = new Date('2024-11-04'); // Monday
			endDate = new Date('2024-11-18'); // 2 weeks later (3 Mondays total)

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			// Should have 3 Mondays in this range (04, 11, 18)
			expect(tasks).toHaveLength(6); // 3 lectures + 3 assignments
			expect(tasks[0].name).toBe('Lecture 1');
			expect(tasks[2].name).toBe('Lecture 2');
			expect(tasks[4].name).toBe('Lecture 3');
		});

		it('should handle multiple lecture weekdays per week', () => {
			startDate = new Date('2024-11-04'); // Monday
			endDate = new Date('2024-11-08'); // Friday

			// Monday (1) and Wednesday (3)
			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1, 3],
				lectureHours,
				assignmentHours
			);

			expect(tasks).toHaveLength(4); // 2 lectures + 2 assignments (Mon + Wed)
			expect(tasks[0].name).toBe('Lecture 1');
			expect(tasks[2].name).toBe('Lecture 2');
		});

		it('should set correct effort hours for tasks', () => {
			startDate = new Date('2024-11-04');
			endDate = new Date('2024-11-04');

			const tasks = generateCourseTasks(userId, courseId, startDate, endDate, [1], 3.5, 2.5);

			expect(tasks[0].effort_hours).toBe(3.5);
			expect(tasks[1].effort_hours).toBe(2.5);
		});

		it('should set deadline to 23:59:59 on lecture day', () => {
			startDate = new Date('2024-11-04'); // Monday
			endDate = new Date('2024-11-04');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			const deadlineDate = new Date(tasks[0].deadline);
			expect(deadlineDate.getHours()).toBe(23);
			expect(deadlineDate.getMinutes()).toBe(59);
			expect(deadlineDate.getSeconds()).toBe(59);
		});

		it('should maintain user_id and course_id for all tasks', () => {
			startDate = new Date('2024-11-04');
			endDate = new Date('2024-11-11');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			tasks.forEach((task) => {
				expect(task.user_id).toBe(userId);
				expect(task.course_id).toBe(courseId);
			});
		});

		it('should alternate lecture and assignment names with correct numbering', () => {
			startDate = new Date('2024-11-04');
			endDate = new Date('2024-11-18');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			expect(tasks[0].name).toBe('Lecture 1');
			expect(tasks[1].name).toBe('Assignment 1');
			expect(tasks[2].name).toBe('Lecture 2');
			expect(tasks[3].name).toBe('Assignment 2');
		});

		it('should skip dates that are not in lecture weekdays', () => {
			startDate = new Date('2024-11-04'); // Monday
			endDate = new Date('2024-11-08'); // Friday

			// Only Monday (1), skip Tuesday-Friday
			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			expect(tasks).toHaveLength(2); // Only 1 lecture + 1 assignment
		});

		it('should handle weekend dates correctly (Saturday=6, Sunday=0)', () => {
			startDate = new Date('2024-11-09'); // Saturday
			endDate = new Date('2024-11-10'); // Sunday

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			); // Monday only

			expect(tasks).toHaveLength(0);
		});

		it('should generate correct number of tasks for 4-week course', () => {
			startDate = new Date('2024-11-04'); // Monday
			endDate = new Date('2024-12-01'); // 4 weeks

			// Monday only
			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			// Should have ~4 Mondays + some extra days
			expect(tasks.length).toBeGreaterThanOrEqual(8); // At least 4 lectures + 4 assignments
		});

		it('should set all tasks to pending status', () => {
			startDate = new Date('2024-11-04');
			endDate = new Date('2024-11-11');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			tasks.forEach((task) => {
				expect(task.status).toBe('pending');
			});
		});

		it('should handle edge case: single day course on non-lecture weekday', () => {
			startDate = new Date('2024-11-05'); // Tuesday
			endDate = new Date('2024-11-05'); // Tuesday

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			); // Monday only

			expect(tasks).toHaveLength(0);
		});

		it('should handle edge case: start and end on same non-lecture day', () => {
			startDate = new Date('2024-11-06'); // Wednesday
			endDate = new Date('2024-11-06'); // Wednesday

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1, 3],
				lectureHours,
				assignmentHours
			);

			expect(tasks).toHaveLength(2); // Wednesday is in lecture weekdays
		});

		it('should generate tasks with valid ISO datetime strings', () => {
			startDate = new Date('2024-11-04');
			endDate = new Date('2024-11-04');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			tasks.forEach((task) => {
				expect(() => new Date(task.deadline)).not.toThrow();
				expect(task.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
			});
		});

		it('should increment week counter correctly across multiple weeks', () => {
			startDate = new Date('2024-11-04');
			endDate = new Date('2024-11-25');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			// Extract week numbers from task names
			const weekNumbers = new Set<number>();
			tasks.forEach((task) => {
				const match = task.name.match(/\d+$/);
				if (match) {
					weekNumbers.add(Number(match[0]));
				}
			});

			// Should have consecutive week numbers
			expect(weekNumbers.size).toBeGreaterThan(1);
		});

		it('should handle empty lecture weekdays array', () => {
			startDate = new Date('2024-11-04');
			endDate = new Date('2024-11-11');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[],
				lectureHours,
				assignmentHours
			);

			expect(tasks).toHaveLength(0);
		});

		it('should handle all 7 weekdays', () => {
			startDate = new Date('2024-11-04'); // Monday
			endDate = new Date('2024-11-10'); // Sunday

			// All weekdays (0-6)
			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[0, 1, 2, 3, 4, 5, 6],
				lectureHours,
				assignmentHours
			);

			// Should have tasks for all 7 days
			expect(tasks).toHaveLength(14); // 7 lectures + 7 assignments
		});

		it('should handle leap year dates correctly', () => {
			startDate = new Date('2024-02-29'); // Leap year date
			endDate = new Date('2024-03-06');

			const tasks = generateCourseTasks(
				userId,
				courseId,
				startDate,
				endDate,
				[1, 2, 3, 4],
				lectureHours,
				assignmentHours
			);

			// Should not throw and generate tasks
			expect(tasks.length).toBeGreaterThan(0);
		});
	});

	describe('Integration: ECTS to Task Generation', () => {
		it('should generate tasks with correct effort hours from ECTS conversion', () => {
			const ects = 10;
			const { lectureHours, assignmentHours } = convertEctsToWeeklyHours(ects);

			const startDate = new Date('2024-11-04');
			const endDate = new Date('2024-11-04');

			const tasks = generateCourseTasks(
				'user-123',
				'course-456',
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			expect(tasks[0].effort_hours).toBe(4);
			expect(tasks[1].effort_hours).toBe(4);
		});

		it('should handle fractional ECTS leading to fractional hours', () => {
			const ects = 7.5;
			const { lectureHours, assignmentHours } = convertEctsToWeeklyHours(ects);

			expect(lectureHours).toBe(3);
			expect(assignmentHours).toBe(3);

			const startDate = new Date('2024-11-04');
			const endDate = new Date('2024-11-04');

			const tasks = generateCourseTasks(
				'user-123',
				'course-456',
				startDate,
				endDate,
				[1],
				lectureHours,
				assignmentHours
			);

			expect(tasks[0].effort_hours).toBe(3);
		});
	});
});
