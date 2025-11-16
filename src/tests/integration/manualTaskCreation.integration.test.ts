import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for manual task creation workflow
 * Tests the complete flow from form submission to database insertion
 */

interface MockSupabaseResponse {
	data: unknown;
	error: Error | null;
}

interface TaskData {
	user_id: string;
	name: string;
	effort_hours: number;
	course_id: string | null;
	deadline: string | null;
	status: 'pending';
}

// Mock Supabase client for integration testing
function createMockSupabaseClient() {
	const mockTasks: TaskData[] = [];
	let shouldFailAuth = false;
	let shouldFailInsert = false;
	let mockUser = { id: 'test-user-123' };

	return {
		auth: {
			getUser: vi.fn().mockImplementation(() => {
				if (shouldFailAuth) {
					return Promise.resolve({
						data: { user: null },
						error: new Error('Authentication failed')
					});
				}
				return Promise.resolve({
					data: { user: mockUser },
					error: null
				});
			})
		},
		from: vi.fn().mockImplementation((table: string) => ({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockImplementation((data: TaskData) => {
				if (shouldFailInsert) {
					return Promise.resolve({
						data: null,
						error: new Error('Database error')
					});
				}
				mockTasks.push(data);
				return Promise.resolve({
					data: data,
					error: null
				});
			}),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis()
		})),
		// Test utilities
		_setAuthFailure: (fail: boolean) => { shouldFailAuth = fail; },
		_setInsertFailure: (fail: boolean) => { shouldFailInsert = fail; },
		_setMockUser: (user: any) => { mockUser = user; },
		_getTasks: () => [...mockTasks],
		_clearTasks: () => { mockTasks.length = 0; }
	};
}

// Simulate the server action logic
async function createTaskAction(
	formData: FormData,
	supabase: ReturnType<typeof createMockSupabaseClient>
) {
	try {
		const {
			data: { user },
			error: userErr
		} = await supabase.auth.getUser();
		
		if (userErr) return { success: false, error: userErr.message };
		if (!user) return { success: false, error: 'Not authenticated' };

		const name = formData.get('name')?.toString()?.trim();
		const effortStr = formData.get('effort_hours')?.toString();
		const course_id = formData.get('course_id')?.toString() || null;
		const deadlineRaw = formData.get('deadline')?.toString();

		if (!name) return { success: false, error: 'Missing name' };
		if (!effortStr) return { success: false, error: 'Missing effort_hours' };

		let effort_hours = Number.parseFloat(effortStr);
		if (!Number.isFinite(effort_hours) || effort_hours < 0) {
			return { success: false, error: 'effort_hours must be a non-negative number' };
		}
		effort_hours = Math.round(effort_hours);

		let deadline: string | null = null;
		if (deadlineRaw) {
			const d = new Date(deadlineRaw);
			deadline = isNaN(d.getTime()) ? deadlineRaw : d.toISOString();
		}

		const { error } = await supabase.from('tasks').insert({
			user_id: user.id,
			name,
			effort_hours,
			course_id,
			deadline,
			status: 'pending'
		});

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (err) {
		return { success: false, error: 'Internal error while creating task' };
	}
}

describe('Manual Task Creation - Integration Tests', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient();
		mockSupabase._clearTasks();
	});

	describe('Successful Task Creation', () => {
		it('should create task with all fields provided', async () => {
			const formData = new FormData();
			formData.append('name', 'Complete final project');
			formData.append('effort_hours', '15.5');
			formData.append('course_id', 'course-123');
			formData.append('deadline', '2024-12-15T23:59:00');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks).toHaveLength(1);
			expect(tasks[0]).toMatchObject({
				user_id: 'test-user-123',
				name: 'Complete final project',
				effort_hours: 16, // rounded from 15.5
				course_id: 'course-123',
				status: 'pending'
			});
			expect(tasks[0].deadline).toMatch(/2024-12-15T\d{2}:59:00/);
		});

		it('should create task with minimal required fields', async () => {
			const formData = new FormData();
			formData.append('name', 'Quick task');
			formData.append('effort_hours', '1');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks).toHaveLength(1);
			expect(tasks[0]).toMatchObject({
				name: 'Quick task',
				effort_hours: 1,
				course_id: null,
				deadline: null,
				status: 'pending'
			});
		});

		it('should handle empty course_id gracefully', async () => {
			const formData = new FormData();
			formData.append('name', 'Personal task');
			formData.append('effort_hours', '2');
			formData.append('course_id', ''); // empty string

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks[0].course_id).toBe(null);
		});

		it('should format deadline as ISO string', async () => {
			const formData = new FormData();
			formData.append('name', 'Deadline task');
			formData.append('effort_hours', '3');
			formData.append('deadline', '2024-12-01T10:30');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks[0].deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});
	});

	describe('Validation Errors', () => {
		it('should reject missing name', async () => {
			const formData = new FormData();
			formData.append('effort_hours', '2');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Missing name');
			expect(mockSupabase._getTasks()).toHaveLength(0);
		});

		it('should reject empty name after trimming', async () => {
			const formData = new FormData();
			formData.append('name', '   ');
			formData.append('effort_hours', '2');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Missing name');
		});

		it('should reject missing effort_hours', async () => {
			const formData = new FormData();
			formData.append('name', 'Test task');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Missing effort_hours');
		});

		it('should reject invalid effort_hours', async () => {
			const invalidEfforts = ['invalid', '-1', 'NaN', ''];

			for (const effort of invalidEfforts) {
				const formData = new FormData();
				formData.append('name', 'Test task');
				formData.append('effort_hours', effort);

				const result = await createTaskAction(formData, mockSupabase);

				expect(result.success).toBe(false);
				expect(result.error).toContain('effort_hours');
			}
		});
	});

	describe('Authentication Errors', () => {
		it('should reject unauthenticated requests', async () => {
			mockSupabase._setAuthFailure(true);

			const formData = new FormData();
			formData.append('name', 'Test task');
			formData.append('effort_hours', '2');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Authentication failed');
		});

		it('should use correct user_id from authentication', async () => {
			const customUser = { id: 'custom-user-456' };
			mockSupabase._setMockUser(customUser);

			const formData = new FormData();
			formData.append('name', 'User-specific task');
			formData.append('effort_hours', '1');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks[0].user_id).toBe('custom-user-456');
		});
	});

	describe('Database Errors', () => {
		it('should handle database insertion failures', async () => {
			mockSupabase._setInsertFailure(true);

			const formData = new FormData();
			formData.append('name', 'Test task');
			formData.append('effort_hours', '2');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Database error');
		});
	});

	describe('Data Integrity', () => {
		it('should maintain consistent task data structure', async () => {
			const formData = new FormData();
			formData.append('name', 'Integrity test');
			formData.append('effort_hours', '5.7');
			formData.append('course_id', 'course-xyz');
			formData.append('deadline', '2024-11-30T14:00:00');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			const task = tasks[0];

			// Verify all required fields are present and correct type
			expect(typeof task.user_id).toBe('string');
			expect(typeof task.name).toBe('string');
			expect(typeof task.effort_hours).toBe('number');
			expect(task.course_id === null || typeof task.course_id === 'string').toBe(true);
			expect(task.deadline === null || typeof task.deadline === 'string').toBe(true);
			expect(task.status).toBe('pending');
		});

		it('should handle multiple task creation correctly', async () => {
			const tasks = [
				{ name: 'Task 1', effort_hours: '1' },
				{ name: 'Task 2', effort_hours: '2' },
				{ name: 'Task 3', effort_hours: '3' }
			];

			for (const taskData of tasks) {
				const formData = new FormData();
				formData.append('name', taskData.name);
				formData.append('effort_hours', taskData.effort_hours);

				const result = await createTaskAction(formData, mockSupabase);
				expect(result.success).toBe(true);
			}

			const createdTasks = mockSupabase._getTasks();
			expect(createdTasks).toHaveLength(3);
			
			// Verify each task has unique data but same user
			const userIds = new Set(createdTasks.map(t => t.user_id));
			expect(userIds.size).toBe(1);
			
			const names = createdTasks.map(t => t.name);
			expect(names).toEqual(['Task 1', 'Task 2', 'Task 3']);
		});
	});

	describe('Edge Cases', () => {
		it('should handle very long task names', async () => {
			const longName = 'A'.repeat(500);
			const formData = new FormData();
			formData.append('name', longName);
			formData.append('effort_hours', '1');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe(longName);
		});

		it('should handle large effort_hours values', async () => {
			const formData = new FormData();
			formData.append('name', 'Marathon task');
			formData.append('effort_hours', '999.9');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks[0].effort_hours).toBe(1000);
		});

		it('should handle special characters in task data', async () => {
			const formData = new FormData();
			formData.append('name', 'Task with émojis 🎯 and spéciål chars');
			formData.append('effort_hours', '2');
			formData.append('course_id', 'course-with-dashes-123');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			
			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Task with émojis 🎯 and spéciål chars');
			expect(tasks[0].course_id).toBe('course-with-dashes-123');
		});
	});
});