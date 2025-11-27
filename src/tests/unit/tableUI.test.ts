import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Table UI and Status Update Interactions
 * Tests filtering, sorting, status changes, and UI state management
 */

type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

interface Task {
	id: string | number;
	name: string;
	status: TaskStatus;
	deadline?: string | null;
	effort_hours?: number | null;
	course?: { id: string | number; name: string } | null;
	priority?: number | null;
}

/**
 * Filter tasks by various criteria
 */
function filterTasks(
	tasks: Task[],
	filters: {
		nameQuery?: string;
		statusFilter?: TaskStatus | 'all';
		courseFilter?: string | 'all';
		priorityFilter?: '1' | '2' | '3' | 'all';
		deadlineFrom?: Date | null;
		deadlineTo?: Date | null;
	}
): Task[] {
	return tasks.filter((task) => {
		// Name filter
		if (filters.nameQuery) {
			const matchesName = task.name.toLowerCase().includes(filters.nameQuery.toLowerCase());
			if (!matchesName) return false;
		}

		// Status filter
		if (filters.statusFilter && filters.statusFilter !== 'all') {
			if (task.status !== filters.statusFilter) return false;
		}

		// Course filter
		if (filters.courseFilter && filters.courseFilter !== 'all') {
			if (!task.course || String(task.course.id) !== filters.courseFilter) return false;
		}

		// Priority filter
		if (filters.priorityFilter && filters.priorityFilter !== 'all') {
			if (String(task.priority) !== filters.priorityFilter) return false;
		}

		// Deadline range filter
		if (filters.deadlineFrom || filters.deadlineTo) {
			if (!task.deadline) return false;
			const taskDate = new Date(task.deadline);

			if (filters.deadlineFrom && taskDate < filters.deadlineFrom) return false;
			if (filters.deadlineTo && taskDate > filters.deadlineTo) return false;
		}

		return true;
	});
}

/**
 * Sort tasks by effort hours
 */
function sortTasksByEffort(tasks: Task[], direction: 'asc' | 'desc' | 'none'): Task[] {
	if (direction === 'none') return tasks;

	return [...tasks].sort((a, b) => {
		const aEffort = a.effort_hours ?? 0;
		const bEffort = b.effort_hours ?? 0;
		return direction === 'asc' ? aEffort - bEffort : bEffort - aEffort;
	});
}

/**
 * Update task status
 */
function updateTaskStatus(task: Task, newStatus: TaskStatus): Task {
	return { ...task, status: newStatus };
}

/**
 * Toggle task completion (completed <-> todo)
 */
function toggleTaskCompletion(task: Task, uncheckStatus: TaskStatus = 'todo'): Task {
	const newStatus = task.status === 'completed' ? uncheckStatus : 'completed';
	return { ...task, status: newStatus };
}

/**
 * Check if task is overdue
 */
function isTaskOverdue(task: Task): boolean {
	if (!task.deadline) return false;
	return new Date(task.deadline) < new Date() && task.status !== 'completed';
}

/**
 * Get task row CSS class based on status and deadline
 */
function getTaskRowClass(task: Task): string {
	const isOverdue = isTaskOverdue(task);
	const isWorking = task.status === 'working';
	const isCompleted = task.status === 'completed';

	if (isOverdue && isWorking) return 'bg-orange-50';
	if (isOverdue) return 'bg-red-50';
	if (isCompleted) return 'bg-green-50';
	if (isWorking) return 'bg-yellow-50';
	return '';
}

/**
 * Get deadline text color based on task state
 */
function getDeadlineClass(task: Task): string {
	const isOverdue = isTaskOverdue(task);
	const isWorking = task.status === 'working';
	const isCompleted = task.status === 'completed';

	if (isOverdue && isWorking) return 'text-orange-600 font-semibold';
	if (isOverdue) return 'text-red-600 font-semibold';
	if (isCompleted) return 'text-green-600 font-semibold';
	if (isWorking) return 'text-yellow-600 font-semibold';
	return 'text-gray-500';
}

/**
 * Get priority label
 */
function getPriorityLabel(priority: number | null | undefined): string {
	if (priority === null || priority === undefined) return 'None';
	const labels: Record<number, string> = { 1: 'High', 2: 'Medium', 3: 'Low' };
	return labels[priority] || 'None';
}

/**
 * Get priority color class
 */
function getPriorityColor(priority: number | null | undefined): string {
	if (priority === null || priority === undefined) return 'bg-gray-100 text-gray-600';
	const colors: Record<number, string> = {
		1: 'bg-red-100 text-red-700',
		2: 'bg-orange-100 text-orange-700',
		3: 'bg-yellow-100 text-yellow-700'
	};
	return colors[priority] || 'bg-gray-100 text-gray-600';
}

describe('Table UI - Unit Tests', () => {
	const mockTasks: Task[] = [
		{
			id: '1',
			name: 'Complete Assignment 1',
			status: 'working',
			deadline: '2024-12-01T23:59:00Z',
			effort_hours: 5,
			course: { id: 'course-1', name: 'Math' },
			priority: 1
		},
		{
			id: '2',
			name: 'Study for Exam',
			status: 'todo',
			deadline: '2024-12-15T10:00:00Z',
			effort_hours: 10,
			course: { id: 'course-2', name: 'Physics' },
			priority: 2
		},
		{
			id: '3',
			name: 'Complete Project',
			status: 'completed',
			deadline: '2024-11-20T23:59:00Z',
			effort_hours: 20,
			course: { id: 'course-1', name: 'Math' },
			priority: 1
		},
		{
			id: '4',
			name: 'Review Notes',
			status: 'pending',
			deadline: null,
			effort_hours: 2,
			course: null,
			priority: 3
		},
		{
			id: '5',
			name: 'Lab Report',
			status: 'on-hold',
			deadline: '2024-12-10T23:59:00Z',
			effort_hours: 8,
			course: { id: 'course-2', name: 'Physics' },
			priority: 2
		}
	];

	describe('Task Filtering', () => {
		it('should filter tasks by name query', () => {
			const result = filterTasks(mockTasks, { nameQuery: 'complete' });

			expect(result).toHaveLength(2);
			expect(result.map((t) => t.name)).toEqual([
				'Complete Assignment 1',
				'Complete Project'
			]);
		});

		it('should filter tasks by name case-insensitively', () => {
			const result = filterTasks(mockTasks, { nameQuery: 'EXAM' });

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Study for Exam');
		});

		it('should filter tasks by status', () => {
			const todoTasks = filterTasks(mockTasks, { statusFilter: 'todo' });
			expect(todoTasks).toHaveLength(1);
			expect(todoTasks[0].status).toBe('todo');

			const completedTasks = filterTasks(mockTasks, { statusFilter: 'completed' });
			expect(completedTasks).toHaveLength(1);
			expect(completedTasks[0].status).toBe('completed');

			const workingTasks = filterTasks(mockTasks, { statusFilter: 'working' });
			expect(workingTasks).toHaveLength(1);
			expect(workingTasks[0].status).toBe('working');
		});

		it('should return all tasks when status filter is "all"', () => {
			const result = filterTasks(mockTasks, { statusFilter: 'all' });
			expect(result).toHaveLength(5);
		});

		it('should filter tasks by course', () => {
			const mathTasks = filterTasks(mockTasks, { courseFilter: 'course-1' });
			expect(mathTasks).toHaveLength(2);
			expect(mathTasks.every((t) => t.course?.id === 'course-1')).toBe(true);

			const physicsTasks = filterTasks(mockTasks, { courseFilter: 'course-2' });
			expect(physicsTasks).toHaveLength(2);
			expect(physicsTasks.every((t) => t.course?.id === 'course-2')).toBe(true);
		});

		it('should filter tasks by priority', () => {
			const highPriority = filterTasks(mockTasks, { priorityFilter: '1' });
			expect(highPriority).toHaveLength(2);
			expect(highPriority.every((t) => t.priority === 1)).toBe(true);

			const mediumPriority = filterTasks(mockTasks, { priorityFilter: '2' });
			expect(mediumPriority).toHaveLength(2);
			expect(mediumPriority.every((t) => t.priority === 2)).toBe(true);

			const lowPriority = filterTasks(mockTasks, { priorityFilter: '3' });
			expect(lowPriority).toHaveLength(1);
			expect(lowPriority[0].priority).toBe(3);
		});

		it('should filter tasks by deadline range', () => {
			const from = new Date('2024-12-01T00:00:00Z');
			const to = new Date('2024-12-31T23:59:59Z');

			const result = filterTasks(mockTasks, { deadlineFrom: from, deadlineTo: to });

			expect(result).toHaveLength(3);
			expect(result.every((t) => t.deadline && new Date(t.deadline) >= from)).toBe(true);
			expect(result.every((t) => t.deadline && new Date(t.deadline) <= to)).toBe(true);
		});

		it('should combine multiple filters', () => {
			const result = filterTasks(mockTasks, {
				nameQuery: 'complete',
				statusFilter: 'working',
				courseFilter: 'course-1'
			});

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Complete Assignment 1');
			expect(result[0].status).toBe('working');
			expect(result[0].course?.id).toBe('course-1');
		});

		it('should return empty array when no tasks match filters', () => {
			const result = filterTasks(mockTasks, {
				nameQuery: 'nonexistent task'
			});

			expect(result).toHaveLength(0);
		});
	});

	describe('Task Sorting', () => {
		it('should sort tasks by effort hours ascending', () => {
			const sorted = sortTasksByEffort(mockTasks, 'asc');

			expect(sorted[0].effort_hours).toBe(2);
			expect(sorted[1].effort_hours).toBe(5);
			expect(sorted[2].effort_hours).toBe(8);
			expect(sorted[3].effort_hours).toBe(10);
			expect(sorted[4].effort_hours).toBe(20);
		});

		it('should sort tasks by effort hours descending', () => {
			const sorted = sortTasksByEffort(mockTasks, 'desc');

			expect(sorted[0].effort_hours).toBe(20);
			expect(sorted[1].effort_hours).toBe(10);
			expect(sorted[2].effort_hours).toBe(8);
			expect(sorted[3].effort_hours).toBe(5);
			expect(sorted[4].effort_hours).toBe(2);
		});

		it('should return tasks unchanged when sort is "none"', () => {
			const sorted = sortTasksByEffort(mockTasks, 'none');

			expect(sorted).toEqual(mockTasks);
		});

		it('should handle tasks with null effort hours', () => {
			const tasksWithNull: Task[] = [
				{ id: '1', name: 'Task 1', status: 'todo', effort_hours: 5, priority: null },
				{ id: '2', name: 'Task 2', status: 'todo', effort_hours: null, priority: null },
				{ id: '3', name: 'Task 3', status: 'todo', effort_hours: 10, priority: null }
			];

			const sorted = sortTasksByEffort(tasksWithNull, 'asc');

			expect(sorted[0].effort_hours).toBe(null); // Treated as 0
			expect(sorted[1].effort_hours).toBe(5);
			expect(sorted[2].effort_hours).toBe(10);
		});
	});

	describe('Status Update Interactions', () => {
		it('should update task status correctly', () => {
			const task = mockTasks[1]; // 'Study for Exam' with status 'todo'
			const updated = updateTaskStatus(task, 'working');

			expect(updated.status).toBe('working');
			expect(updated.id).toBe(task.id);
			expect(updated.name).toBe(task.name);
		});

		it('should not mutate original task when updating status', () => {
			const task = mockTasks[1];
			const originalStatus = task.status;

			updateTaskStatus(task, 'completed');

			expect(task.status).toBe(originalStatus); // Original unchanged
		});

		it('should toggle task to completed when not completed', () => {
			const task: Task = {
				id: '1',
				name: 'Test Task',
				status: 'working',
				priority: null
			};

			const toggled = toggleTaskCompletion(task);

			expect(toggled.status).toBe('completed');
		});

		it('should toggle task from completed to default uncheck status', () => {
			const task: Task = {
				id: '1',
				name: 'Test Task',
				status: 'completed',
				priority: null
			};

			const toggled = toggleTaskCompletion(task);

			expect(toggled.status).toBe('todo');
		});

		it('should use custom uncheck status when toggling from completed', () => {
			const task: Task = {
				id: '1',
				name: 'Test Task',
				status: 'completed',
				priority: null
			};

			const toggled = toggleTaskCompletion(task, 'working');

			expect(toggled.status).toBe('working');
		});

		it('should handle all status transitions', () => {
			const statuses: TaskStatus[] = ['pending', 'todo', 'on-hold', 'working', 'completed'];

			statuses.forEach((fromStatus) => {
				statuses.forEach((toStatus) => {
					const task: Task = {
						id: '1',
						name: 'Test',
						status: fromStatus,
						priority: null
					};

					const updated = updateTaskStatus(task, toStatus);
					expect(updated.status).toBe(toStatus);
				});
			});
		});
	});

	describe('Deadline and Status Visual Indicators', () => {
		it('should detect overdue tasks', () => {
			const overdueTask: Task = {
				id: '1',
				name: 'Overdue Task',
				status: 'working',
				deadline: '2020-01-01T00:00:00Z',
				priority: null
			};

			expect(isTaskOverdue(overdueTask)).toBe(true);
		});

		it('should not mark completed tasks as overdue', () => {
			const completedTask: Task = {
				id: '1',
				name: 'Completed Task',
				status: 'completed',
				deadline: '2020-01-01T00:00:00Z',
				priority: null
			};

			expect(isTaskOverdue(completedTask)).toBe(false);
		});

		it('should not mark future deadlines as overdue', () => {
			const futureTask: Task = {
				id: '1',
				name: 'Future Task',
				status: 'working',
				deadline: '2099-12-31T23:59:59Z',
				priority: null
			};

			expect(isTaskOverdue(futureTask)).toBe(false);
		});

		it('should return false for tasks without deadline', () => {
			const task: Task = {
				id: '1',
				name: 'No Deadline',
				status: 'working',
				deadline: null,
				priority: null
			};

			expect(isTaskOverdue(task)).toBe(false);
		});

		it('should return correct row class for overdue working task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'working',
				deadline: '2020-01-01T00:00:00Z',
				priority: null
			};

			expect(getTaskRowClass(task)).toBe('bg-orange-50');
		});

		it('should return correct row class for overdue non-working task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'todo',
				deadline: '2020-01-01T00:00:00Z',
				priority: null
			};

			expect(getTaskRowClass(task)).toBe('bg-red-50');
		});

		it('should return correct row class for completed task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'completed',
				deadline: '2024-12-31T23:59:59Z',
				priority: null
			};

			expect(getTaskRowClass(task)).toBe('bg-green-50');
		});

		it('should return correct row class for working task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'working',
				deadline: '2099-12-31T23:59:59Z',
				priority: null
			};

			expect(getTaskRowClass(task)).toBe('bg-yellow-50');
		});

		it('should return empty class for normal tasks', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'pending',
				deadline: '2099-12-31T23:59:59Z',
				priority: null
			};

			expect(getTaskRowClass(task)).toBe('');
		});

		it('should return correct deadline class for overdue working task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'working',
				deadline: '2020-01-01T00:00:00Z',
				priority: null
			};

			expect(getDeadlineClass(task)).toBe('text-orange-600 font-semibold');
		});

		it('should return correct deadline class for overdue task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'todo',
				deadline: '2020-01-01T00:00:00Z',
				priority: null
			};

			expect(getDeadlineClass(task)).toBe('text-red-600 font-semibold');
		});

		it('should return correct deadline class for completed task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'completed',
				deadline: '2024-12-31T23:59:59Z',
				priority: null
			};

			expect(getDeadlineClass(task)).toBe('text-green-600 font-semibold');
		});

		it('should return correct deadline class for working task', () => {
			const task: Task = {
				id: '1',
				name: 'Task',
				status: 'working',
				deadline: '2099-12-31T23:59:59Z',
				priority: null
			};

			expect(getDeadlineClass(task)).toBe('text-yellow-600 font-semibold');
		});
	});

	describe('Priority Display', () => {
		it('should return correct priority labels', () => {
			expect(getPriorityLabel(1)).toBe('High');
			expect(getPriorityLabel(2)).toBe('Medium');
			expect(getPriorityLabel(3)).toBe('Low');
			expect(getPriorityLabel(null)).toBe('None');
			expect(getPriorityLabel(undefined)).toBe('None');
		});

		it('should return "None" for invalid priority values', () => {
			expect(getPriorityLabel(0)).toBe('None');
			expect(getPriorityLabel(4)).toBe('None');
			expect(getPriorityLabel(999)).toBe('None');
		});

		it('should return correct priority colors', () => {
			expect(getPriorityColor(1)).toBe('bg-red-100 text-red-700');
			expect(getPriorityColor(2)).toBe('bg-orange-100 text-orange-700');
			expect(getPriorityColor(3)).toBe('bg-yellow-100 text-yellow-700');
			expect(getPriorityColor(null)).toBe('bg-gray-100 text-gray-600');
			expect(getPriorityColor(undefined)).toBe('bg-gray-100 text-gray-600');
		});

		it('should return default color for invalid priority', () => {
			expect(getPriorityColor(0)).toBe('bg-gray-100 text-gray-600');
			expect(getPriorityColor(999)).toBe('bg-gray-100 text-gray-600');
		});
	});

	describe('Combined Filtering and Sorting', () => {
		it('should filter then sort tasks', () => {
			// Filter for Math course tasks
			const filtered = filterTasks(mockTasks, { courseFilter: 'course-1' });

			// Then sort by effort ascending
			const sorted = sortTasksByEffort(filtered, 'asc');

			expect(sorted).toHaveLength(2);
			expect(sorted[0].effort_hours).toBe(5);
			expect(sorted[1].effort_hours).toBe(20);
		});

		it('should handle complex filter combinations with sorting', () => {
			const filtered = filterTasks(mockTasks, {
				statusFilter: 'working',
				priorityFilter: '1'
			});

			const sorted = sortTasksByEffort(filtered, 'desc');

			expect(sorted).toHaveLength(1);
			expect(sorted[0].name).toBe('Complete Assignment 1');
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty task list', () => {
			const result = filterTasks([], { nameQuery: 'test' });
			expect(result).toHaveLength(0);
		});

		it('should handle tasks with missing optional fields', () => {
			const minimalTasks: Task[] = [
				{ id: '1', name: 'Task 1', status: 'todo', priority: null },
				{ id: '2', name: 'Task 2', status: 'pending', priority: null }
			];

			const sorted = sortTasksByEffort(minimalTasks, 'asc');
			expect(sorted).toHaveLength(2);

			const filtered = filterTasks(minimalTasks, { courseFilter: 'all' });
			expect(filtered).toHaveLength(2);
		});

		it('should handle special characters in name filter', () => {
			const tasks: Task[] = [
				{
					id: '1',
					name: 'Task with émojis 🎯',
					status: 'todo',
					priority: null
				}
			];

			const result = filterTasks(tasks, { nameQuery: '🎯' });
			expect(result).toHaveLength(1);
		});

		it('should maintain task order when no sorting applied', () => {
			const sorted = sortTasksByEffort(mockTasks, 'none');
			expect(sorted[0].id).toBe('1');
			expect(sorted[4].id).toBe('5');
		});
	});
});
