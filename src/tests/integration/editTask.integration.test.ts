/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for task editing workflow
 * Tests the complete flow from form submission to database update
 */

type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

interface TaskData {
	id: string;
	user_id: string;
	name: string;
	effort_hours: number;
	course_id: string | null;
	deadline: string | null;
	status: TaskStatus;
	priority: number | null;
	created_at: string;
}

interface TaskUpdateData {
	name?: string;
	effort_hours?: number;
	course_id?: string | null;
	deadline?: string | null;
	status?: TaskStatus;
	priority?: number;
}

// Mock Supabase client for integration testing
function createMockSupabaseClient() {
	const mockTasks: TaskData[] = [];
	let shouldFailAuth = false;
	let shouldFailUpdate = false;
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
			update: vi.fn().mockImplementation((updates: TaskUpdateData) => ({
				eq: vi.fn().mockImplementation((column: string, value: string) => ({
					eq: vi.fn().mockImplementation((userColumn: string, userId: string) => {
						if (shouldFailUpdate) {
							return Promise.resolve({
								data: null,
								error: new Error('Update failed')
							});
						}

						// Find task by id and user_id
						const taskIndex = mockTasks.findIndex((t) => t.id === value && t.user_id === userId);

						if (taskIndex === -1) {
							return Promise.resolve({
								data: null,
								error: new Error('Task not found or access denied')
							});
						}

						// Apply updates
						mockTasks[taskIndex] = {
							...mockTasks[taskIndex],
							...updates
						};

						return Promise.resolve({
							data: mockTasks[taskIndex],
							error: null
						});
					})
				}))
			}))
		})),
		// Test utilities
		_setAuthFailure: (fail: boolean) => {
			shouldFailAuth = fail;
		},
		_setUpdateFailure: (fail: boolean) => {
			shouldFailUpdate = fail;
		},
		_setMockUser: (user: { id: string }) => {
			mockUser = user;
		},
		_getTasks: () => [...mockTasks],
		_clearTasks: () => {
			mockTasks.length = 0;
		},
		_addTask: (task: TaskData) => {
			mockTasks.push(task);
		}
	};
}

// Simulate the server action logic for updating a task
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

		const taskId = formData.get('task_id')?.toString();
		if (!taskId) return { success: false, error: 'Missing task_id' };

		const updates: TaskUpdateData = {};
		const allowedStatuses: TaskStatus[] = ['pending', 'todo', 'on-hold', 'working', 'completed'];

		// Parse status
		if (formData.has('status')) {
			const raw = formData.get('status')?.toString().toLowerCase();
			if (!raw || !allowedStatuses.includes(raw as TaskStatus)) {
				return { success: false, error: 'Invalid status value' };
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
				return { success: false, error: 'Invalid effort_hours' };
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
					return { success: false, error: 'Priority must be 1, 2, or 3' };
				}
				updates.priority = priority;
			}
		}
		if (Object.keys(updates).length === 0) {
			return { success: false, error: 'No updatable fields provided' };
		}

		const { error } = await supabase
			.from('tasks')
			.update(updates)
			.eq('id', taskId)
			.eq('user_id', user.id);

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true, updated: Object.keys(updates) };
	} catch {
		return { success: false, error: 'Internal error while updating task' };
	}
}

describe('Edit Task - Integration Tests', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient();
		mockSupabase._clearTasks();
	});

	describe('Successful Task Updates', () => {
		it('should update task name', async () => {
			// Setup: Create initial task
			mockSupabase._addTask({
				id: 'task-1',
				user_id: 'test-user-123',
				name: 'Original Task',
				effort_hours: 5,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-1');
			formData.append('name', 'Updated Task Name');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			expect(result.updated).toEqual(['name']);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Updated Task Name');
			expect(tasks[0].effort_hours).toBe(5); // Unchanged
			expect(tasks[0].status).toBe('pending'); // Unchanged
		});

		it('should update task status', async () => {
			mockSupabase._addTask({
				id: 'task-2',
				user_id: 'test-user-123',
				name: 'Task to Complete',
				effort_hours: 3,
				course_id: null,
				deadline: null,
				status: 'working',
				priority: 1,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-2');
			formData.append('status', 'completed');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			expect(result.updated).toEqual(['status']);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].status).toBe('completed');
			expect(tasks[0].name).toBe('Task to Complete'); // Unchanged
		});

		it('should update effort hours with rounding', async () => {
			mockSupabase._addTask({
				id: 'task-3',
				user_id: 'test-user-123',
				name: 'Effort Task',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-3');
			formData.append('effort_hours', '7.7');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].effort_hours).toBe(8); // Rounded from 7.7
		});

		it('should update deadline with ISO formatting', async () => {
			mockSupabase._addTask({
				id: 'task-4',
				user_id: 'test-user-123',
				name: 'Deadline Task',
				effort_hours: 4,
				course_id: null,
				deadline: null,
				status: 'todo',
				priority: 1,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-4');
			formData.append('deadline', '2024-12-25T23:59:00');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].deadline).toMatch(/2024-12-25T\d{2}:59:00/);
			expect(new Date(tasks[0].deadline!).toISOString()).toMatch(/2024-12-25/);
		});

		it('should update course association', async () => {
			mockSupabase._addTask({
				id: 'task-5',
				user_id: 'test-user-123',
				name: 'Course Task',
				effort_hours: 6,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-5');
			formData.append('course_id', 'course-123');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].course_id).toBe('course-123');
		});

		it('should remove course association when set to empty', async () => {
			mockSupabase._addTask({
				id: 'task-6',
				user_id: 'test-user-123',
				name: 'Unlink Course Task',
				effort_hours: 3,
				course_id: 'course-existing',
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-6');
			formData.append('course_id', '');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].course_id).toBeNull();
		});

		it('should update priority level', async () => {
			mockSupabase._addTask({
				id: 'task-7',
				user_id: 'test-user-123',
				name: 'Priority Task',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'todo',
				priority: 3,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-7');
			formData.append('priority', '1');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].priority).toBe(1);
		});

		it('should update multiple fields simultaneously', async () => {
			mockSupabase._addTask({
				id: 'task-8',
				user_id: 'test-user-123',
				name: 'Multi-Update Task',
				effort_hours: 3,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-8');
			formData.append('name', 'Fully Updated Task');
			formData.append('effort_hours', '10.5');
			formData.append('course_id', 'course-456');
			formData.append('deadline', '2024-12-31T23:59:00');
			formData.append('status', 'working');
			formData.append('priority', '1');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			expect(result.updated).toEqual(
				expect.arrayContaining([
					'name',
					'effort_hours',
					'course_id',
					'deadline',
					'status',
					'priority'
				])
			);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0]).toMatchObject({
				id: 'task-8',
				user_id: 'test-user-123',
				name: 'Fully Updated Task',
				effort_hours: 11, // Rounded from 10.5
				course_id: 'course-456',
				status: 'working',
				priority: 1
			});
			expect(tasks[0].deadline).toMatch(/2024-12-31/);
		});

		it('should handle partial updates without affecting other fields', async () => {
			mockSupabase._addTask({
				id: 'task-9',
				user_id: 'test-user-123',
				name: 'Original Name',
				effort_hours: 5,
				course_id: 'course-original',
				deadline: '2024-12-15T10:00:00Z',
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-9');
			formData.append('status', 'completed');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0]).toMatchObject({
				name: 'Original Name', // Unchanged
				effort_hours: 5, // Unchanged
				course_id: 'course-original', // Unchanged
				deadline: '2024-12-15T10:00:00Z', // Unchanged
				status: 'completed', // Changed
				priority: 2 // Unchanged
			});
		});
	});

	describe('Validation Errors', () => {
		it('should reject update without task_id', async () => {
			const formData = new FormData();
			formData.append('name', 'No ID Task');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Missing task_id');
		});

		it('should reject update with no fields to change', async () => {
			mockSupabase._addTask({
				id: 'task-10',
				user_id: 'test-user-123',
				name: 'Empty Update Task',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-10');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('No updatable fields provided');
		});

		it('should reject invalid status values', async () => {
			mockSupabase._addTask({
				id: 'task-11',
				user_id: 'test-user-123',
				name: 'Status Task',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const invalidStatuses = ['invalid', 'done', 'cancelled', ''];

			for (const status of invalidStatuses) {
				const formData = new FormData();
				formData.append('task_id', 'task-11');
				formData.append('status', status);

				const result = await updateTaskAction(formData, mockSupabase);

				expect(result.success).toBe(false);
				expect(result.error).toBe('Invalid status value');
			}
		});

		it('should reject invalid effort_hours', async () => {
			mockSupabase._addTask({
				id: 'task-12',
				user_id: 'test-user-123',
				name: 'Effort Task',
				effort_hours: 5,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const invalidEfforts = ['-5', 'abc', 'NaN', 'Infinity'];

			for (const effort of invalidEfforts) {
				const formData = new FormData();
				formData.append('task_id', 'task-12');
				formData.append('effort_hours', effort);

				const result = await updateTaskAction(formData, mockSupabase);

				expect(result.success).toBe(false);
				expect(result.error).toBe('Invalid effort_hours');
			}
		});

		it('should reject invalid priority values', async () => {
			mockSupabase._addTask({
				id: 'task-13',
				user_id: 'test-user-123',
				name: 'Priority Task',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const invalidPriorities = ['0', '4', '-1', 'high', ''];

			for (const priority of invalidPriorities) {
				const formData = new FormData();
				formData.append('task_id', 'task-13');
				formData.append('priority', priority);

				const result = await updateTaskAction(formData, mockSupabase);

				expect(result.success).toBe(false);
				expect(result.error).toBe('Priority must be 1, 2, or 3');
			}
		});
	});

	describe('Authentication and Authorization', () => {
		it('should reject unauthenticated requests', async () => {
			mockSupabase._setAuthFailure(true);

			const formData = new FormData();
			formData.append('task_id', 'task-14');
			formData.append('name', 'Auth Test Task');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Authentication failed');
		});

		it('should prevent updating tasks belonging to other users', async () => {
			// Create task for different user
			mockSupabase._addTask({
				id: 'task-15',
				user_id: 'other-user-456',
				name: 'Other User Task',
				effort_hours: 3,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			// Current user is test-user-123
			const formData = new FormData();
			formData.append('task_id', 'task-15');
			formData.append('name', 'Unauthorized Update');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Task not found or access denied');

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Other User Task'); // Unchanged
		});

		it('should allow updating own tasks only', async () => {
			const customUser = { id: 'custom-user-789' };
			mockSupabase._setMockUser(customUser);

			mockSupabase._addTask({
				id: 'task-16',
				user_id: 'custom-user-789',
				name: 'Own Task',
				effort_hours: 4,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-16');
			formData.append('name', 'Updated Own Task');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Updated Own Task');
		});
	});

	describe('Database Errors', () => {
		it('should handle database update failures', async () => {
			mockSupabase._addTask({
				id: 'task-17',
				user_id: 'test-user-123',
				name: 'DB Error Task',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			mockSupabase._setUpdateFailure(true);

			const formData = new FormData();
			formData.append('task_id', 'task-17');
			formData.append('name', 'Will Fail');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Update failed');
		});

		it('should handle non-existent task IDs', async () => {
			const formData = new FormData();
			formData.append('task_id', 'non-existent-task');
			formData.append('name', 'Update Ghost Task');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Task not found or access denied');
		});
	});

	describe('Status Workflow Transitions', () => {
		it('should transition through status lifecycle', async () => {
			mockSupabase._addTask({
				id: 'task-18',
				user_id: 'test-user-123',
				name: 'Lifecycle Task',
				effort_hours: 5,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const statusFlow: TaskStatus[] = ['todo', 'working', 'on-hold', 'working', 'completed'];

			for (const status of statusFlow) {
				const formData = new FormData();
				formData.append('task_id', 'task-18');
				formData.append('status', status);

				const result = await updateTaskAction(formData, mockSupabase);

				expect(result.success).toBe(true);

				const tasks = mockSupabase._getTasks();
				expect(tasks[0].status).toBe(status);
			}
		});

		it('should handle case-insensitive status input', async () => {
			mockSupabase._addTask({
				id: 'task-19',
				user_id: 'test-user-123',
				name: 'Case Test Task',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-19');
			formData.append('status', 'WORKING');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].status).toBe('working');
		});
	});

	describe('Edge Cases and Data Integrity', () => {
		it('should handle very long task names', async () => {
			mockSupabase._addTask({
				id: 'task-20',
				user_id: 'test-user-123',
				name: 'Short Name',
				effort_hours: 1,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const longName = 'A'.repeat(500);
			const formData = new FormData();
			formData.append('task_id', 'task-20');
			formData.append('name', longName);

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe(longName);
		});

		it('should handle special characters and Unicode', async () => {
			mockSupabase._addTask({
				id: 'task-21',
				user_id: 'test-user-123',
				name: 'Original',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-21');
			formData.append('name', 'Task with émojis 🎯 and spéciål chars');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Task with émojis 🎯 and spéciål chars');
		});

		it('should preserve created_at timestamp when updating', async () => {
			const originalCreatedAt = '2024-11-01T08:00:00Z';
			mockSupabase._addTask({
				id: 'task-22',
				user_id: 'test-user-123',
				name: 'Timestamp Task',
				effort_hours: 3,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: originalCreatedAt
			});

			const formData = new FormData();
			formData.append('task_id', 'task-22');
			formData.append('name', 'Updated Name');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].created_at).toBe(originalCreatedAt); // Should not change
		});

		it('should handle zero effort hours', async () => {
			mockSupabase._addTask({
				id: 'task-23',
				user_id: 'test-user-123',
				name: 'Zero Effort Task',
				effort_hours: 5,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-23');
			formData.append('effort_hours', '0');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].effort_hours).toBe(0);
		});

		it('should handle trimming whitespace from name', async () => {
			mockSupabase._addTask({
				id: 'task-24',
				user_id: 'test-user-123',
				name: 'Untrimmed',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-24');
			formData.append('name', '   Trimmed Name   ');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Trimmed Name');
		});

		it('should ignore empty name after trimming', async () => {
			mockSupabase._addTask({
				id: 'task-25',
				user_id: 'test-user-123',
				name: 'Keep This Name',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-25');
			formData.append('name', '   ');
			formData.append('status', 'todo');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Keep This Name'); // Name unchanged
			expect(tasks[0].status).toBe('todo'); // Status changed
		});
	});

	describe('Multiple Tasks Management', () => {
		it('should update correct task when multiple tasks exist', async () => {
			mockSupabase._addTask({
				id: 'task-26',
				user_id: 'test-user-123',
				name: 'Task 1',
				effort_hours: 1,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			mockSupabase._addTask({
				id: 'task-27',
				user_id: 'test-user-123',
				name: 'Task 2',
				effort_hours: 2,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			mockSupabase._addTask({
				id: 'task-28',
				user_id: 'test-user-123',
				name: 'Task 3',
				effort_hours: 3,
				course_id: null,
				deadline: null,
				status: 'pending',
				priority: 2,
				created_at: '2024-11-20T10:00:00Z'
			});

			const formData = new FormData();
			formData.append('task_id', 'task-27');
			formData.append('name', 'Updated Task 2');

			const result = await updateTaskAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const tasks = mockSupabase._getTasks();
			expect(tasks[0].name).toBe('Task 1'); // Unchanged
			expect(tasks[1].name).toBe('Updated Task 2'); // Changed
			expect(tasks[2].name).toBe('Task 3'); // Unchanged
		});
	});
});
