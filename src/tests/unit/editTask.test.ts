import { describe, it, expect } from 'vitest';

/**
 * Unit tests for Edit Task functionality
 * Tests the parseTaskUpdateForm logic extracted from $lib/server/db.ts
 */

type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

type TaskUpdateData = {
	status?: TaskStatus;
	name?: string;
	effort_hours?: number;
	deadline?: string;
	course_id?: string | null;
	priority?: number;
};

/**
 * Parse and validate task update data from FormData
 * This is the core logic from parseTaskUpdateForm in db.ts
 */
function parseTaskUpdateForm(formData: FormData): {
	taskId: string | null;
	updates: TaskUpdateData;
	error: string | null;
} {
	const taskId = formData.get('task_id')?.toString() ?? null;

	if (!taskId) {
		return { taskId: null, updates: {}, error: 'Missing task_id' };
	}

	const updates: TaskUpdateData = {};
	const allowedStatuses: TaskStatus[] = ['pending', 'todo', 'on-hold', 'working', 'completed'];

	// Parse status
	if (formData.has('status')) {
		const raw = formData.get('status')?.toString().toLowerCase();
		if (!raw || !allowedStatuses.includes(raw as TaskStatus)) {
			return { taskId, updates: {}, error: 'Invalid status value' };
		}
		updates.status = raw as TaskStatus;
	}

	// Parse name
	if (formData.has('name')) {
		const name = formData.get('name')?.toString()?.trim();
		if (name) updates.name = name;
	}

	// Parse effort_hours
	if (formData.has('effort_hours')) {
		const num = Number.parseFloat(formData.get('effort_hours')?.toString() ?? '');
		if (!Number.isFinite(num) || num < 0) {
			return { taskId, updates: {}, error: 'Invalid effort_hours' };
		}
		updates.effort_hours = Math.round(num);
	}

	// Parse deadline
	if (formData.has('deadline')) {
		const raw = formData.get('deadline')?.toString();
		if (raw) {
			const d = new Date(raw);
			updates.deadline = isNaN(d.getTime()) ? raw : d.toISOString();
		}
	}

	// Parse course_id
	if (formData.has('course_id')) {
		const cid = formData.get('course_id')?.toString() || null;
		updates.course_id = cid;
	}

	// Parse priority
	if (formData.has('priority')) {
		const priorityStr = formData.get('priority')?.toString();
		if (priorityStr !== undefined && priorityStr !== null) {
			const priority = Number.parseInt(priorityStr);
			if (!Number.isFinite(priority) || priority < 1 || priority > 3) {
				return { taskId, updates: {}, error: 'Priority must be 1, 2, or 3' };
			}
			updates.priority = priority;
		}
	}

	if (Object.keys(updates).length === 0) {
		return { taskId, updates: {}, error: 'No updatable fields provided' };
	}

	return { taskId, updates, error: null };
}

describe('Edit Task - Unit Tests', () => {
	describe('parseTaskUpdateForm - Basic Validation', () => {
		it('should reject update without task_id', () => {
			const formData = new FormData();
			formData.append('name', 'Updated Task');

			const result = parseTaskUpdateForm(formData);

			expect(result.taskId).toBeNull();
			expect(result.error).toBe('Missing task_id');
			expect(Object.keys(result.updates)).toHaveLength(0);
		});

		it('should reject update with no fields to update', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');

			const result = parseTaskUpdateForm(formData);

			expect(result.taskId).toBe('task-123');
			expect(result.error).toBe('No updatable fields provided');
			expect(Object.keys(result.updates)).toHaveLength(0);
		});

		it('should parse valid single field update', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('name', 'Updated Task Name');

			const result = parseTaskUpdateForm(formData);

			expect(result.taskId).toBe('task-123');
			expect(result.error).toBeNull();
			expect(result.updates.name).toBe('Updated Task Name');
			expect(Object.keys(result.updates)).toHaveLength(1);
		});

		it('should parse multiple fields in a single update', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-456');
			formData.append('name', 'Complete Assignment');
			formData.append('effort_hours', '5');
			formData.append('status', 'working');
			formData.append('priority', '1');

			const result = parseTaskUpdateForm(formData);

			expect(result.taskId).toBe('task-456');
			expect(result.error).toBeNull();
			expect(result.updates.name).toBe('Complete Assignment');
			expect(result.updates.effort_hours).toBe(5);
			expect(result.updates.status).toBe('working');
			expect(result.updates.priority).toBe(1);
		});
	});

	describe('parseTaskUpdateForm - Name Field', () => {
		it('should trim whitespace from name', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('name', '  Study for Exam  ');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.name).toBe('Study for Exam');
		});

		it('should ignore empty name after trimming', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('name', '   ');
			formData.append('status', 'todo');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.name).toBeUndefined();
			expect(result.updates.status).toBe('todo');
		});

		it('should handle Unicode characters in name', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('name', 'Opgave 🎯 математика');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.name).toBe('Opgave 🎯 математика');
		});
	});

	describe('parseTaskUpdateForm - Status Field', () => {
		it('should accept valid status values', () => {
			const validStatuses: TaskStatus[] = ['pending', 'todo', 'on-hold', 'working', 'completed'];

			validStatuses.forEach((status) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('status', status);

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBeNull();
				expect(result.updates.status).toBe(status);
			});
		});

		it('should convert status to lowercase', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('status', 'TODO');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.status).toBe('todo');
		});

		it('should reject invalid status values', () => {
			const invalidStatuses = ['invalid', 'done', 'cancelled', 'archived', ''];

			invalidStatuses.forEach((status) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('status', status);

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBe('Invalid status value');
				expect(Object.keys(result.updates)).toHaveLength(0);
			});
		});
	});

	describe('parseTaskUpdateForm - Effort Hours Field', () => {
		it('should parse valid effort hours', () => {
			const testCases = [
				{ input: '1', expected: 1 },
				{ input: '5', expected: 5 },
				{ input: '10.5', expected: 11 },
				{ input: '0', expected: 0 }
			];

			testCases.forEach(({ input, expected }) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('effort_hours', input);

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBeNull();
				expect(result.updates.effort_hours).toBe(expected);
			});
		});

		it('should round effort hours to integer', () => {
			const testCases = [
				{ input: '2.3', expected: 2 },
				{ input: '2.7', expected: 3 },
				{ input: '5.5', expected: 6 },
				{ input: '7.1', expected: 7 }
			];

			testCases.forEach(({ input, expected }) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('effort_hours', input);

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBeNull();
				expect(result.updates.effort_hours).toBe(expected);
			});
		});

		it('should reject negative effort hours', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('effort_hours', '-5');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBe('Invalid effort_hours');
			expect(Object.keys(result.updates)).toHaveLength(0);
		});

		it('should reject non-numeric effort hours', () => {
			const invalidInputs = ['abc', 'NaN', 'Infinity', ''];

			invalidInputs.forEach((input) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('effort_hours', input);

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBe('Invalid effort_hours');
			});
		});
	});

	describe('parseTaskUpdateForm - Deadline Field', () => {
		it('should parse valid ISO datetime', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('deadline', '2024-12-15T10:00:00');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});

		it('should convert valid datetime to ISO format', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('deadline', '2024-12-31T23:59:00');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			const deadline = new Date(result.updates.deadline!);
			expect(deadline.getFullYear()).toBe(2024);
			expect(deadline.getMonth()).toBe(11); // December = 11
			expect(deadline.getDate()).toBe(31);
		});

		it('should handle invalid datetime gracefully', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('deadline', 'not-a-valid-date');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.deadline).toBe('not-a-valid-date');
		});

		it('should allow empty deadline to be set', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('deadline', '');
			formData.append('name', 'Task without deadline');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.deadline).toBeUndefined();
			expect(result.updates.name).toBe('Task without deadline');
		});
	});

	describe('parseTaskUpdateForm - Course ID Field', () => {
		it('should parse valid course_id', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('course_id', 'course-456');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.course_id).toBe('course-456');
		});

		it('should allow null course_id (no course)', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('course_id', '');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.course_id).toBeNull();
		});

		it('should handle UUID format course_id', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('course_id', '550e8400-e29b-41d4-a716-446655440000');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.course_id).toBe('550e8400-e29b-41d4-a716-446655440000');
		});
	});

	describe('parseTaskUpdateForm - Priority Field', () => {
		it('should accept valid priority values (1, 2, 3)', () => {
			const validPriorities = [1, 2, 3];

			validPriorities.forEach((priority) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('priority', String(priority));

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBeNull();
				expect(result.updates.priority).toBe(priority);
			});
		});

		it('should reject priority values outside 1-3 range', () => {
			const invalidPriorities = ['0', '4', '-1', '10'];

			invalidPriorities.forEach((priority) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('priority', priority);

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBe('Priority must be 1, 2, or 3');
				expect(Object.keys(result.updates)).toHaveLength(0);
			});
		});

		it('should reject non-numeric priority values', () => {
			const invalidInputs = ['high', 'low', 'abc', ''];

			invalidInputs.forEach((input) => {
				const formData = new FormData();
				formData.append('task_id', 'task-123');
				formData.append('priority', input);

				const result = parseTaskUpdateForm(formData);

				expect(result.error).toBe('Priority must be 1, 2, or 3');
			});
		});
	});

	describe('parseTaskUpdateForm - Complex Scenarios', () => {
		it('should parse full task update with all fields', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-789');
			formData.append('name', 'Complete Final Project');
			formData.append('effort_hours', '15.7');
			formData.append('deadline', '2024-12-20T23:59:00');
			formData.append('course_id', 'course-101');
			formData.append('status', 'working');
			formData.append('priority', '1');

			const result = parseTaskUpdateForm(formData);

			expect(result.taskId).toBe('task-789');
			expect(result.error).toBeNull();
			expect(result.updates.name).toBe('Complete Final Project');
			expect(result.updates.effort_hours).toBe(16); // Rounded from 15.7
			expect(result.updates.deadline).toMatch(/2024-12-20/);
			expect(result.updates.course_id).toBe('course-101');
			expect(result.updates.status).toBe('working');
			expect(result.updates.priority).toBe(1);
		});

		it('should handle partial updates correctly', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('status', 'completed');
			formData.append('priority', '3');

			const result = parseTaskUpdateForm(formData);

			expect(result.taskId).toBe('task-123');
			expect(result.error).toBeNull();
			expect(result.updates.status).toBe('completed');
			expect(result.updates.priority).toBe(3);
			expect(result.updates.name).toBeUndefined();
			expect(result.updates.effort_hours).toBeUndefined();
			expect(result.updates.deadline).toBeUndefined();
		});

		it('should stop processing on first error encountered', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('effort_hours', '-10'); // Invalid
			formData.append('name', 'Valid Name');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBe('Invalid effort_hours');
			expect(Object.keys(result.updates)).toHaveLength(0);
		});

		it('should handle removing course association', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('course_id', '');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.course_id).toBeNull();
		});
	});

	describe('parseTaskUpdateForm - Edge Cases', () => {
		it('should handle very long task names', () => {
			const longName = 'a'.repeat(500);
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('name', longName);

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.name).toBe(longName);
		});

		it('should handle very large effort hours', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('effort_hours', '999.9');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.effort_hours).toBe(1000);
		});

		it('should handle special characters in task_id', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123-abc_def');
			formData.append('name', 'Test Task');

			const result = parseTaskUpdateForm(formData);

			expect(result.taskId).toBe('task-123-abc_def');
			expect(result.error).toBeNull();
		});

		it('should handle FormData with duplicate field names (takes first)', () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('priority', '1');
			formData.append('priority', '2');

			const result = parseTaskUpdateForm(formData);

			expect(result.error).toBeNull();
			expect(result.updates.priority).toBe(1);
		});
	});
});
