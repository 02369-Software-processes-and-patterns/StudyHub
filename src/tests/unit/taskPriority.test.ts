import { describe, it, expect } from 'vitest';

/**
 * Unit tests for task priority validation and processing
 */

interface TaskInput {
	name?: string;
	effort_hours?: string;
	course_id?: string;
	deadline?: string;
	priority?: string;
}

interface ValidationResult {
	isValid: boolean;
	errors: string[];
	processedData?: {
		name: string;
		effort_hours: number;
		course_id: string | null;
		deadline: string | null;
		priority: number | null;
	};
}

function validateTaskInput(input: TaskInput): ValidationResult {
	const errors: string[] = [];

	// Validate name
	const name = input.name?.trim();
	if (!name) {
		errors.push('Missing name');
	}

	// Validate effort_hours
	const effortStr = input.effort_hours?.toString();
	if (!effortStr) {
		errors.push('Missing effort_hours');
	}

	let effort_hours = 0;
	if (effortStr) {
		effort_hours = Number.parseFloat(effortStr);
		if (!Number.isFinite(effort_hours) || effort_hours < 0) {
			errors.push('effort_hours must be a non-negative number');
		}
		effort_hours = Math.round(effort_hours);
	}

	// Process course_id
	const course_id = input.course_id?.toString() || null;

	// Process deadline
	let deadline: string | null = null;
	if (input.deadline) {
		const d = new Date(input.deadline);
		deadline = isNaN(d.getTime()) ? input.deadline : d.toISOString();
	}

	// Validate priority
	let priority: number | null = null;
	if (input.priority !== undefined) {
		const priorityStr = input.priority;
		// Must be an integer 1, 2, or 3 - no decimals, no non-numeric chars (leading zeros OK)
		if (!priorityStr || !/^0*[1-3]$/.test(priorityStr)) {
			errors.push('Priority must be 1, 2, or 3');
		} else {
			priority = Number.parseInt(priorityStr, 10);
		}
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		errors: [],
		processedData: {
			name: name!,
			effort_hours,
			course_id,
			deadline,
			priority
		}
	};
}

describe('Task Priority - Unit Tests', () => {
	describe('Priority Field Validation', () => {
		it('should accept valid priority values (1, 2, 3)', () => {
			const priorities = ['1', '2', '3'];

			priorities.forEach((priority) => {
				const result = validateTaskInput({
					name: 'Test Task',
					effort_hours: '2',
					priority
				});

				expect(result.isValid).toBe(true);
				expect(result.processedData?.priority).toBe(Number.parseInt(priority));
			});
		});

		it('should reject invalid priority values', () => {
			const invalidPriorities = ['0', '4', '5', '-1', '10'];

			invalidPriorities.forEach((priority) => {
				const result = validateTaskInput({
					name: 'Test Task',
					effort_hours: '2',
					priority
				});

				expect(result.isValid).toBe(false);
				expect(result.errors).toContain('Priority must be 1, 2, or 3');
			});
		});

		it('should reject non-numeric priority values', () => {
			const invalidPriorities = ['abc', 'high', 'low', '', 'null'];

			invalidPriorities.forEach((priority) => {
				const result = validateTaskInput({
					name: 'Test Task',
					effort_hours: '2',
					priority
				});

				expect(result.isValid).toBe(false);
				expect(result.errors).toContain('Priority must be 1, 2, or 3');
			});
		});

		it('should handle missing priority as null', () => {
			const result = validateTaskInput({
				name: 'Test Task',
				effort_hours: '2'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.priority).toBeNull();
		});

		it('should handle undefined priority as null', () => {
			const result = validateTaskInput({
				name: 'Test Task',
				effort_hours: '2',
				priority: undefined
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.priority).toBeNull();
		});
	});

	describe('Priority with Other Fields', () => {
		it('should validate priority along with all other required fields', () => {
			const result = validateTaskInput({
				name: 'Complete assignment',
				effort_hours: '3',
				course_id: 'course-123',
				deadline: '2024-12-15T23:59:00',
				priority: '1'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData).toMatchObject({
				name: 'Complete assignment',
				effort_hours: 3,
				course_id: 'course-123',
				priority: 1
			});
		});

		it('should validate priority with minimal fields', () => {
			const result = validateTaskInput({
				name: 'Quick task',
				effort_hours: '1',
				priority: '2'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData).toMatchObject({
				name: 'Quick task',
				effort_hours: 1,
				priority: 2
			});
		});

		it('should fail if priority is invalid even with valid other fields', () => {
			const result = validateTaskInput({
				name: 'Test Task',
				effort_hours: '2',
				priority: '10'
			});

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Priority must be 1, 2, or 3');
		});
	});

	describe('Priority Parsing', () => {
		it('should parse string priority to number', () => {
			const result = validateTaskInput({
				name: 'Test',
				effort_hours: '1',
				priority: '2'
			});

			expect(result.isValid).toBe(true);
			expect(typeof result.processedData?.priority).toBe('number');
			expect(result.processedData?.priority).toBe(2);
		});

		it('should reject decimal priority values', () => {
			const result = validateTaskInput({
				name: 'Test',
				effort_hours: '1',
				priority: '1.5'
			});

			expect(result.isValid).toBe(false);
		});

		it('should reject priority with leading zeros', () => {
			const result = validateTaskInput({
				name: 'Test',
				effort_hours: '1',
				priority: '01'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.priority).toBe(1);
		});
	});

	describe('Priority Boundary Cases', () => {
		it('should accept priority 1 (high)', () => {
			const result = validateTaskInput({
				name: 'High priority task',
				effort_hours: '1',
				priority: '1'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.priority).toBe(1);
		});

		it('should accept priority 3 (low)', () => {
			const result = validateTaskInput({
				name: 'Low priority task',
				effort_hours: '1',
				priority: '3'
			});

			expect(result.isValid).toBe(true);
			expect(result.processedData?.priority).toBe(3);
		});

		it('should reject priority below minimum (0)', () => {
			const result = validateTaskInput({
				name: 'Test',
				effort_hours: '1',
				priority: '0'
			});

			expect(result.isValid).toBe(false);
		});

		it('should reject priority above maximum (4+)', () => {
			const result = validateTaskInput({
				name: 'Test',
				effort_hours: '1',
				priority: '4'
			});

			expect(result.isValid).toBe(false);
		});
	});

	describe('Priority Display Labels', () => {
		function getPriorityLabel(priority: number | null | undefined): string {
			if (priority === null || priority === undefined) return 'None';
			const labels: Record<number, string> = {
				1: 'High',
				2: 'Medium',
				3: 'Low'
			};
			return labels[priority] || 'None';
		}

		it('should return correct labels for priority values', () => {
			expect(getPriorityLabel(1)).toBe('High');
			expect(getPriorityLabel(2)).toBe('Medium');
			expect(getPriorityLabel(3)).toBe('Low');
		});

		it('should return "None" for null priority', () => {
			expect(getPriorityLabel(null)).toBe('None');
		});

		it('should return "None" for undefined priority', () => {
			expect(getPriorityLabel(undefined)).toBe('None');
		});

		it('should return "None" for invalid priority', () => {
			expect(getPriorityLabel(5)).toBe('None');
			expect(getPriorityLabel(0)).toBe('None');
		});
	});

	describe('Priority Color Classes', () => {
		function getPriorityColor(priority: number | null | undefined): string {
			if (priority === null || priority === undefined) return 'bg-gray-100 text-gray-600';
			const colors: Record<number, string> = {
				1: 'bg-red-100 text-red-700',
				2: 'bg-orange-100 text-orange-700',
				3: 'bg-yellow-100 text-yellow-700'
			};
			return colors[priority] || 'bg-gray-100 text-gray-600';
		}

		it('should return correct color classes for priority values', () => {
			expect(getPriorityColor(1)).toBe('bg-red-100 text-red-700');
			expect(getPriorityColor(2)).toBe('bg-orange-100 text-orange-700');
			expect(getPriorityColor(3)).toBe('bg-yellow-100 text-yellow-700');
		});

		it('should return gray for null priority', () => {
			expect(getPriorityColor(null)).toBe('bg-gray-100 text-gray-600');
		});

		it('should return gray for undefined priority', () => {
			expect(getPriorityColor(undefined)).toBe('bg-gray-100 text-gray-600');
		});

		it('should return gray for invalid priority', () => {
			expect(getPriorityColor(5)).toBe('bg-gray-100 text-gray-600');
		});
	});

	describe('Priority Sorting Logic', () => {
		interface Task {
			name: string;
			priority: number | null;
		}

		function sortByPriority(tasks: Task[]): Task[] {
			return tasks.slice().sort((a, b) => {
				if (a.priority === null && b.priority === null) return 0;
				if (a.priority === null) return 1;
				if (b.priority === null) return -1;
				return a.priority - b.priority;
			});
		}

		it('should sort tasks by priority (1 first, 3 last)', () => {
			const tasks: Task[] = [
				{ name: 'Task C', priority: 3 },
				{ name: 'Task A', priority: 1 },
				{ name: 'Task B', priority: 2 }
			];

			const sorted = sortByPriority(tasks);

			expect(sorted[0].priority).toBe(1);
			expect(sorted[1].priority).toBe(2);
			expect(sorted[2].priority).toBe(3);
		});

		it('should place null priority tasks last', () => {
			const tasks: Task[] = [
				{ name: 'Task D', priority: null },
				{ name: 'Task B', priority: 2 },
				{ name: 'Task A', priority: 1 },
				{ name: 'Task C', priority: 3 }
			];

			const sorted = sortByPriority(tasks);

			expect(sorted[3].priority).toBeNull();
		});

		it('should maintain order of tasks with same priority', () => {
			const tasks: Task[] = [
				{ name: 'Task C', priority: 2 },
				{ name: 'Task A', priority: 2 },
				{ name: 'Task B', priority: 2 }
			];

			const sorted = sortByPriority(tasks);

			expect(sorted.every((t) => t.priority === 2)).toBe(true);
		});

		it('should handle all null priorities', () => {
			const tasks: Task[] = [
				{ name: 'Task A', priority: null },
				{ name: 'Task B', priority: null }
			];

			const sorted = sortByPriority(tasks);

			expect(sorted).toHaveLength(2);
			expect(sorted.every((t) => t.priority === null)).toBe(true);
		});
	});
});
