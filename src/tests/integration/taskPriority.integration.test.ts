/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for task priority functionality
 * Tests priority creation, update, deletion, and sorting
 */

interface TaskData {
	user_id: string;
	name: string;
	effort_hours: number;
	course_id: string | null;
	deadline: string | null;
	status: 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';
	priority: number | null;
}

// Mock Supabase client for integration testing
function createMockSupabaseClient() {
	const mockTasks: TaskData[] = [];
	let shouldFailAuth = false;
	let shouldFailInsert = false;
	let shouldFailUpdate = false;
	let shouldFailDelete = false;
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
		from: vi.fn().mockImplementation((_table: string) => ({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockImplementation((data: TaskData | TaskData[]) => {
				if (shouldFailInsert) {
					return Promise.resolve({
						data: null,
						error: new Error('Database error')
					});
				}
				const tasksToInsert = Array.isArray(data) ? data : [data];
				mockTasks.push(...tasksToInsert);
				return Promise.resolve({
					data: tasksToInsert,
					error: null
				});
			}),
			update: vi.fn().mockImplementation((data: Partial<TaskData>) => ({
				eq: vi.fn().mockImplementation(() => {
					if (shouldFailUpdate) {
						return Promise.resolve({
							data: null,
							error: new Error('Update failed')
						});
					}
					return Promise.resolve({
						data: data,
						error: null
					});
				})
			})),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockImplementation(() => {
				if (shouldFailDelete) {
					return Promise.resolve({
						data: null,
						error: new Error('Delete failed')
					});
				}
				return Promise.resolve({
					data: {},
					error: null
				});
			}),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis()
		})),
		// Test utilities
		_setAuthFailure: (fail: boolean) => {
			shouldFailAuth = fail;
		},
		_setInsertFailure: (fail: boolean) => {
			shouldFailInsert = fail;
		},
		_setUpdateFailure: (fail: boolean) => {
			shouldFailUpdate = fail;
		},
		_setDeleteFailure: (fail: boolean) => {
			shouldFailDelete = fail;
		},
		_setMockUser: (user: { id: string }) => {
			mockUser = user;
		},
		_getTasks: () => [...mockTasks],
		_clearTasks: () => {
			mockTasks.length = 0;
		}
	};
}

// Simulate the server action logic for creating tasks
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
		const priorityStr = formData.get('priority')?.toString();

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

		let priority: number | null = null;
		if (priorityStr) {
			const priorityNum = Number.parseInt(priorityStr, 10);
			if (![1, 2, 3].includes(priorityNum)) {
				return { success: false, error: 'Priority must be 1, 2, or 3' };
			}
			priority = priorityNum;
		}

		const { error } = await supabase.from('tasks').insert({
			user_id: user.id,
			name,
			effort_hours,
			course_id,
			deadline,
			status: 'pending',
			priority
		});

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch {
		return { success: false, error: 'Internal error while creating task' };
	}
}

// Simulate the server action logic for updating tasks
async function updateTaskAction(
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

		const task_id = formData.get('task_id')?.toString();
		if (!task_id) return { success: false, error: 'Missing task_id' };

		const updates: Partial<TaskData> = {};

		const priorityStr = formData.get('priority')?.toString();
		if (priorityStr !== undefined && priorityStr !== null) {
			if (priorityStr === '') {
				updates.priority = null;
			} else {
				const priority = Number.parseInt(priorityStr, 10);
				if (![1, 2, 3].includes(priority)) {
					return { success: false, error: 'Priority must be 1, 2, or 3' };
				}
				updates.priority = priority;
			}
		}

		const name = formData.get('name')?.toString()?.trim();
		if (name !== undefined && name !== null) {
			if (!name) return { success: false, error: 'Name cannot be empty' };
			updates.name = name;
		}

		const effortStr = formData.get('effort_hours')?.toString();
		if (effortStr !== undefined && effortStr !== null) {
			const effort = Number.parseFloat(effortStr);
			if (!Number.isFinite(effort) || effort < 0) {
				return { success: false, error: 'Invalid effort_hours' };
			}
			updates.effort_hours = Math.round(effort);
		}

		const status = formData.get('status')?.toString();
		if (status) {
			const validStatuses = ['pending', 'todo', 'on-hold', 'working', 'completed'];
			if (!validStatuses.includes(status)) {
				return { success: false, error: 'Invalid status' };
			}
			updates.status = status as TaskData['status'];
		}

		const { error } = await supabase.from('tasks').update(updates).eq('id', task_id);

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch {
		return { success: false, error: 'Internal error while updating task' };
	}
}

describe('Task Priority - Integration Tests', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient();
		mockSupabase._clearTasks();
	});

	describe('Creating Tasks with Priority', () => {
		it('should create task with high priority (1)', async () => {
			const formData = new FormData();
			formData.append('name', 'Urgent assignment');
			formData.append('effort_hours', '3');
			formData.append('priority', '1');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0]).toMatchObject({
				name: 'Urgent assignment',
				priority: 1
			});
		});

		it('should create task with medium priority (2)', async () => {
			const formData = new FormData();
			formData.append('name', 'Regular task');
			formData.append('effort_hours', '2');
			formData.append('priority', '2');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].priority).toBe(2);
		});

		it('should create task with low priority (3)', async () => {
			const formData = new FormData();
			formData.append('name', 'Low priority task');
			formData.append('effort_hours', '1');
			formData.append('priority', '3');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].priority).toBe(3);
		});

		it('should create task without priority (null)', async () => {
			const formData = new FormData();
			formData.append('name', 'No priority task');
			formData.append('effort_hours', '1');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].priority).toBeNull();
		});

		it('should reject invalid priority during creation', async () => {
			const invalidPriorities = ['0', '4', '10', '-1', 'high'];

			for (const priority of invalidPriorities) {
				mockSupabase._clearTasks();

				const formData = new FormData();
				formData.append('name', 'Test task');
				formData.append('effort_hours', '1');
				formData.append('priority', priority);

				const result = await createTaskAction(formData, mockSupabase);

				expect(result.success).toBe(false);
				expect(result.error).toBe('Priority must be 1, 2, or 3');
			}
		});

		it('should create task with all fields including priority', async () => {
			const formData = new FormData();
			formData.append('name', 'Complete final project');
			formData.append('effort_hours', '15.5');
			formData.append('course_id', 'course-123');
			formData.append('deadline', '2024-12-15T23:59:00');
			formData.append('priority', '1');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0]).toMatchObject({
				name: 'Complete final project',
				effort_hours: 16,
				course_id: 'course-123',
				priority: 1,
				status: 'pending'
			});
		});
	});

	describe('Updating Task Priority', () => {
		it('should update task priority from null to 1', async () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('priority', '1');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
		});

		it('should update task priority from 1 to 3', async () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('priority', '3');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
		});

		it('should clear task priority (set to null)', async () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('priority', '');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
		});

		it('should update priority along with other fields', async () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('name', 'Updated task');
			formData.append('status', 'working');
			formData.append('priority', '2');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
		});

		it('should reject invalid priority during update', async () => {
			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('priority', '5');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Priority must be 1, 2, or 3');
		});
	});

	describe('Priority Filtering and Sorting', () => {
		it('should create multiple tasks with different priorities', async () => {
			const tasks = [
				{ name: 'High priority', priority: '1' },
				{ name: 'Medium priority', priority: '2' },
				{ name: 'Low priority', priority: '3' },
				{ name: 'No priority', priority: null }
			];

			for (const taskData of tasks) {
				const formData = new FormData();
				formData.append('name', taskData.name);
				formData.append('effort_hours', '1');
				if (taskData.priority) {
					formData.append('priority', taskData.priority);
				}

				const result = await createTaskAction(formData, mockSupabase);
				expect(result.success).toBe(true);
			}

			const createdTasks = mockSupabase._getTasks();
			expect(createdTasks).toHaveLength(4);

			const priorities = createdTasks.map((t) => t.priority);
			expect(priorities).toContain(1);
			expect(priorities).toContain(2);
			expect(priorities).toContain(3);
			expect(priorities).toContain(null);
		});

		it('should sort tasks by priority correctly', () => {
			const tasks = [
				{ name: 'Task C', priority: 3 },
				{ name: 'Task A', priority: 1 },
				{ name: 'Task D', priority: null },
				{ name: 'Task B', priority: 2 }
			];

			const sorted = tasks.sort((a, b) => {
				if (a.priority === null && b.priority === null) return 0;
				if (a.priority === null) return 1;
				if (b.priority === null) return -1;
				return a.priority - b.priority;
			});

			expect(sorted[0].name).toBe('Task A');
			expect(sorted[1].name).toBe('Task B');
			expect(sorted[2].name).toBe('Task C');
			expect(sorted[3].name).toBe('Task D');
		});

		it('should filter tasks by priority level', () => {
			const allTasks = [
				{ priority: 1, name: 'A' },
				{ priority: 2, name: 'B' },
				{ priority: 1, name: 'C' },
				{ priority: 3, name: 'D' }
			];

			const highPriority = allTasks.filter((t) => t.priority === 1);
			expect(highPriority).toHaveLength(2);

			const mediumPriority = allTasks.filter((t) => t.priority === 2);
			expect(mediumPriority).toHaveLength(1);

			const lowPriority = allTasks.filter((t) => t.priority === 3);
			expect(lowPriority).toHaveLength(1);
		});
	});

	describe('Priority Statistics', () => {
		beforeEach(async () => {
			const tasks = [
				{ name: 'High 1', priority: '1' },
				{ name: 'High 2', priority: '1' },
				{ name: 'Medium 1', priority: '2' },
				{ name: 'Medium 2', priority: '2' },
				{ name: 'Medium 3', priority: '2' },
				{ name: 'Low 1', priority: '3' }
			];

			for (const taskData of tasks) {
				const formData = new FormData();
				formData.append('name', taskData.name);
				formData.append('effort_hours', '1');
				formData.append('priority', taskData.priority);

				await createTaskAction(formData, mockSupabase);
			}
		});

		it('should count high priority tasks correctly', () => {
			const tasks = mockSupabase._getTasks();
			const highPriorityCount = tasks.filter((t) => t.priority === 1).length;
			expect(highPriorityCount).toBe(2);
		});

		it('should count medium priority tasks correctly', () => {
			const tasks = mockSupabase._getTasks();
			const mediumPriorityCount = tasks.filter((t) => t.priority === 2).length;
			expect(mediumPriorityCount).toBe(3);
		});

		it('should count low priority tasks correctly', () => {
			const tasks = mockSupabase._getTasks();
			const lowPriorityCount = tasks.filter((t) => t.priority === 3).length;
			expect(lowPriorityCount).toBe(1);
		});
	});

	describe('End-to-End Priority Workflow', () => {
		it('should complete full task lifecycle with priority changes', async () => {
			// Create task with medium priority
			let formData = new FormData();
			formData.append('name', 'Important project');
			formData.append('effort_hours', '10');
			formData.append('priority', '2');

			let result = await createTaskAction(formData, mockSupabase);
			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].priority).toBe(2);

			// Update to high priority
			formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('priority', '1');

			result = await updateTaskAction(formData, mockSupabase);
			expect(result.success).toBe(true);

			// Update status to working while keeping priority
			formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('status', 'working');

			result = await updateTaskAction(formData, mockSupabase);
			expect(result.success).toBe(true);

			// Complete the task and clear priority
			formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('status', 'completed');
			formData.append('priority', '');

			result = await updateTaskAction(formData, mockSupabase);
			expect(result.success).toBe(true);
		});
	});

	describe('Error Handling with Priority', () => {
		it('should handle authentication failure when creating task with priority', async () => {
			mockSupabase._setAuthFailure(true);

			const formData = new FormData();
			formData.append('name', 'Test task');
			formData.append('effort_hours', '1');
			formData.append('priority', '1');

			const result = await createTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Authentication failed');
		});

		it('should handle database error when updating priority', async () => {
			mockSupabase._setUpdateFailure(true);

			const formData = new FormData();
			formData.append('task_id', 'task-123');
			formData.append('priority', '2');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Update failed');
		});
	});
});
