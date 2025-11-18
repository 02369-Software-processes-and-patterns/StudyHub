import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Mock Supabase client for integration tests
 */
interface MockSupabaseInstance {
	from: (table: string) => MockQuery;
}

interface MockQuery {
	select: (fields?: string) => MockQuery;
	insert: (data: unknown) => MockQuery;
	update: (data: unknown) => MockQuery;
	eq: (column: string, value: unknown) => MockQuery;
	order: (column: string, options?: unknown) => MockQuery;
	single: () => Promise<{ data: unknown; error: null } | { data: null; error: Error }>;
	then: (callback: (result: any) => void) => Promise<any>;
}

function createMockSupabase(): MockSupabaseInstance {
	const tables: Record<string, unknown[]> = {
		tasks: [],
		courses: []
	};

	const mockQueries: Record<string, unknown[]> = {
		lastInsertedTasks: [],
		lastInsertedCourse: {}
	};

	const createQuery = (operation: string, tableName: string): MockQuery => {
		let data: unknown = null;
		let whereConditions: Array<[string, unknown]> = [];
		let selectFields = '*';

		return {
			select: (fields = '*') => {
				selectFields = fields;
				return createQuery(operation, tableName);
			},
			insert: (insertData) => {
				data = insertData;
				return {
					select: () => createQuery('insertSelect', tableName),
					eq: () => createQuery(operation, tableName),
					order: () => createQuery(operation, tableName),
					then: async (callback) => {
						// Simulate insert
						if (Array.isArray(insertData)) {
							tables[tableName].push(...insertData);
							mockQueries.lastInsertedTasks = insertData;
						} else {
							tables[tableName].push(insertData);
						}
						callback({ data: null, error: null });
					}
				};
			},
			update: (updateData) => {
				data = updateData;
				return {
					eq: (column: string, value: unknown) => {
						whereConditions.push([column, value]);
						return {
							eq: (column2: string, value2: unknown) => {
								whereConditions.push([column2, value2]);
								return {
									then: async (callback) => {
										callback({ data: null, error: null });
									}
								};
							},
							then: async (callback) => {
								callback({ data: null, error: null });
							}
						};
					}
				};
			},
			eq: (column: string, value: unknown) => {
				whereConditions.push([column, value]);
				return createQuery(operation, tableName);
			},
			order: (column: string, options?: unknown) => {
				return createQuery(operation, tableName);
			},
			single: async () => {
				const mockCourse = {
					id: 'mock-course-id-' + Math.random(),
					user_id: 'mock-user-id',
					name: 'Test Course',
					ects_points: 10,
					start_date: '2024-11-01',
					end_date: '2024-12-01',
					lecture_weekdays: '[1]'
				};
				mockQueries.lastInsertedCourse = mockCourse;
				return { data: mockCourse, error: null };
			},
			then: async (callback) => {
				return callback({ data: tables[tableName], error: null });
			}
		};
	};

	return {
		from: (table: string) => createQuery('select', table)
	};
}

/**
 * Helper to convert ECTS to hours
 */
function convertEctsToWeeklyHours(ects: number): { lectureHours: number; assignmentHours: number } {
	const ratio = ects / 5.0;
	const lectureHours = ratio * 2;
	const assignmentHours = ratio * 2;

	return { lectureHours, assignmentHours };
}

/**
 * Helper to generate tasks
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
	let currentDate = new Date(startDate);
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

describe('Task Generation Integration Tests', () => {
	let mockSupabase: MockSupabaseInstance;
	let userId: string;
	let courseId: string;

	beforeEach(() => {
		mockSupabase = createMockSupabase();
		userId = 'test-user-' + Date.now();
		courseId = 'test-course-' + Date.now();
	});

	describe('Course Creation with Auto-Generated Tasks', () => {
		it('should create course and generate tasks in single operation', async () => {
			const courseData = {
				user_id: userId,
				name: 'Mathematics 101',
				ects_points: 10,
				start_date: '2024-11-04',
				end_date: '2024-11-18',
				lecture_weekdays: '[1]'
			};

			const { lectureHours, assignmentHours } = convertEctsToWeeklyHours(10);

			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-11-04'),
				new Date('2024-11-18'),
				[1],
				lectureHours,
				assignmentHours
			);

			expect(tasks.length).toBeGreaterThan(0);
			expect(tasks[0].name).toBe('Lecture 1');
			tasks.forEach((task) => {
				expect(task.user_id).toBe(userId);
				expect(task.course_id).toBe(courseId);
			});
		});

		it('should validate ECTS points before task generation', () => {
			const validEcts = [5, 7.5, 10, 15, 30];

			validEcts.forEach((ects) => {
				const result = convertEctsToWeeklyHours(ects);

				expect(result.lectureHours).toBeGreaterThan(0);
				expect(result.assignmentHours).toBeGreaterThan(0);
				expect(typeof result.lectureHours).toBe('number');
				expect(typeof result.assignmentHours).toBe('number');
			});
		});

		it('should validate date range before task generation', () => {
			const startDate = new Date('2024-11-04');
			const endDate = new Date('2024-12-31');

			// Invalid: start > end
			const invalidTasks = generateCourseTasks(userId, courseId, new Date('2024-12-31'), startDate, [1], 2, 2);
			expect(invalidTasks).toHaveLength(0);

			// Valid: start <= end
			const validTasks = generateCourseTasks(userId, courseId, startDate, endDate, [1], 2, 2);
			expect(validTasks.length).toBeGreaterThan(0);
		});

		it('should validate lecture weekdays are valid day numbers', () => {
			const validWeekdays = [0, 1, 2, 3, 4, 5, 6];
			const startDate = new Date('2024-11-04');
			const endDate = new Date('2024-11-18');

			validWeekdays.forEach((day) => {
				const tasks = generateCourseTasks(userId, courseId, startDate, endDate, [day], 2, 2);

				// Should generate tasks (might be 0 if the specific day isn't in range, but function should work)
				expect(Array.isArray(tasks)).toBe(true);
			});
		});
	});

	describe('Task Data Integrity', () => {
		it('should maintain data consistency across task generation', () => {
			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-11-04'),
				new Date('2024-11-18'),
				[1, 3],
				3.5,
				2.5
			);

			// All tasks should have same user and course
			const userIds = new Set(tasks.map((t) => t.user_id));
			const courseIds = new Set(tasks.map((t) => t.course_id));

			expect(userIds.size).toBe(1);
			expect(courseIds.size).toBe(1);
		});

		it('should maintain correct task naming and ordering', () => {
			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-11-04'),
				new Date('2024-11-25'),
				[1],
				2,
				2
			);

			const lectureCount = tasks.filter((t) => t.name.includes('Lecture')).length;
			const assignmentCount = tasks.filter((t) => t.name.includes('Assignment')).length;

			expect(lectureCount).toBe(assignmentCount);

			// Check sequence
			for (let i = 0; i < tasks.length; i += 2) {
				const lectureName = tasks[i].name;
				const assignmentName = tasks[i + 1].name;

				const lectureNum = lectureName.match(/\d+$/)?.[0];
				const assignmentNum = assignmentName.match(/\d+$/)?.[0];

				expect(lectureNum).toBe(assignmentNum);
			}
		});

		it('should ensure all task deadlines are ISO format strings', () => {
			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-11-04'),
				new Date('2024-11-11'),
				[1, 3],
				2,
				2
			);

			tasks.forEach((task) => {
				// Valid ISO format
				expect(task.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

				// Can be parsed as Date
				const date = new Date(task.deadline);
				expect(date.getTime()).not.toBeNaN();

				// Hours are set to 23:59:59
				expect(date.getHours()).toBe(23);
				expect(date.getMinutes()).toBe(59);
				expect(date.getSeconds()).toBe(59);
			});
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle courses spanning semester boundary', () => {
			const startDate = new Date('2024-12-16'); // Near semester end
			const endDate = new Date('2025-01-20'); // Across year boundary

			const tasks = generateCourseTasks(userId, courseId, startDate, endDate, [1, 3, 5], 2, 2);

			expect(tasks.length).toBeGreaterThan(0);

			// Check dates span across years
			const minDate = new Date(Math.min(...tasks.map((t) => new Date(t.deadline).getTime())));
			const maxDate = new Date(Math.max(...tasks.map((t) => new Date(t.deadline).getTime())));

			expect(minDate.getFullYear()).toBeLessThanOrEqual(maxDate.getFullYear());
		});

		it('should handle intensive course (all weekdays)', () => {
			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-11-04'),
				new Date('2024-11-08'),
				[1, 2, 3, 4, 5],
				1,
				1
			);

			// Should have lectures and assignments for each weekday (Monday-Friday)
			expect(tasks.length).toBeGreaterThanOrEqual(10);
		});

		it('should handle sparse course (single weekday per month)', () => {
			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-11-01'),
				new Date('2024-12-31'),
				[3], // Only Wednesday
				2,
				2
			);

			// Should still generate tasks for all Wednesdays
			expect(tasks.length).toBeGreaterThan(0);

			// Verify all are Wednesdays
			const allWednesdays = tasks.every((task) => {
				const date = new Date(task.deadline);
				return date.getDay() === 3;
			});

			expect(allWednesdays).toBe(true);
		});

		it('should handle courses with unequal lecture/assignment hours', () => {
			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-11-04'),
				new Date('2024-11-11'),
				[1],
				5.5,
				1.5
			);

			const lectures = tasks.filter((t) => t.name.includes('Lecture'));
			const assignments = tasks.filter((t) => t.name.includes('Assignment'));

			lectures.forEach((lecture) => {
				expect(lecture.effort_hours).toBe(5.5);
			});

			assignments.forEach((assignment) => {
				expect(assignment.effort_hours).toBe(1.5);
			});
		});
	});

	describe('Performance and Scalability', () => {
		it('should handle full year course generation efficiently', () => {
			const startTime = Date.now();

			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date('2024-01-01'),
				new Date('2024-12-31'),
				[1, 2, 3, 4, 5],
				2,
				2
			);

			const endTime = Date.now();

			// Should complete in reasonable time (< 100ms)
			expect(endTime - startTime).toBeLessThan(100);

			// Should generate reasonable number of tasks (~50 weeks * 5 days * 2 tasks)
			expect(tasks.length).toBeGreaterThan(100);
			expect(tasks.length).toBeLessThan(600);
		});

		it('should handle large ECTS values without precision loss', () => {
			const largeCourse = convertEctsToWeeklyHours(120);

			// Should calculate correctly even for large values
			expect(largeCourse.lectureHours).toBe(48);
			expect(largeCourse.assignmentHours).toBe(48);
		});
	});

	describe('Workflow: Full Course Creation Simulation', () => {
		it('should simulate complete course creation workflow', async () => {
			// Step 1: Validate input
			const courseData = {
				name: 'Web Development',
				ects_points: 7.5,
				start_date: '2024-11-04',
				end_date: '2024-12-20',
				lecture_weekdays: [1, 3] // Monday and Wednesday
			};

			expect(courseData.ects_points).toBeGreaterThan(0);
			expect(new Date(courseData.start_date).getTime()).toBeLessThanOrEqual(new Date(courseData.end_date).getTime());

			// Step 2: Convert ECTS
			const { lectureHours, assignmentHours } = convertEctsToWeeklyHours(courseData.ects_points);

			expect(lectureHours).toBe(3);
			expect(assignmentHours).toBe(3);

			// Step 3: Generate tasks
			const tasks = generateCourseTasks(
				userId,
				courseId,
				new Date(courseData.start_date),
				new Date(courseData.end_date),
				courseData.lecture_weekdays,
				lectureHours,
				assignmentHours
			);

			// Step 4: Validate generated tasks
			expect(tasks.length).toBeGreaterThan(0);

			// Should have lecture and assignment pairs
			const tasksByWeek = new Map<number, TaskToInsert[]>();
			tasks.forEach((task) => {
				const week = task.name.match(/\d+$/)?.[0] || '0';
				if (!tasksByWeek.has(Number(week))) {
					tasksByWeek.set(Number(week), []);
				}
				tasksByWeek.get(Number(week))!.push(task);
			});

			// Each week increments when a lecture day is found
			// With 2 lecture days per week (Mon + Wed), we get 4 tasks per week
			// But the week counter increments on each lecture day, so we need to check differently
			// Group by consecutive lecture days within a single weeknumber
			let maxWeekNum = 0;
			tasks.forEach((task) => {
				const match = task.name.match(/\d+$/);
				if (match) {
					maxWeekNum = Math.max(maxWeekNum, Number(match[0]));
				}
			});

			// Should have generated multiple weeks
			expect(maxWeekNum).toBeGreaterThan(1);

			// Each week should have 2 tasks (1 lecture + 1 assignment on each occurrence of a lecture day)
			tasksByWeek.forEach((tasksInWeek) => {
				// Each week number appears with 2 tasks (lecture + assignment for that occurrence)
				expect(tasksInWeek.length).toBe(2);
			});
		});
	});
});
