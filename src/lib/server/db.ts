/**
 * Centralized database operations for server-side code.
 * All Supabase queries should go through these functions to avoid duplication.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

type TypedSupabaseClient = SupabaseClient<Database>;

// =============================================================================
// Types
// =============================================================================

export type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

export type TaskWithCourse = {
	id: string;
	name: string;
	effort_hours: number;
	deadline: string;
	status: string;
	course_id: string | null;
	created_at: string;
	course: { id: string; name: string } | null;
};

export type Course = {
	id: string;
	name: string;
	ects_points: number;
	start_date: string;
	end_date: string;
	lecture_weekdays: unknown;
	created_at: string;
	user_id: string | null;
};

export type TaskUpdateData = {
	status?: TaskStatus;
	name?: string;
	effort_hours?: number;
	deadline?: string;
	course_id?: string | null;
};

export type TaskCreateData = {
	user_id: string;
	name: string;
	effort_hours: number;
	deadline: string;
	course_id?: string | null;
	status?: TaskStatus;
};

// =============================================================================
// Task Operations
// =============================================================================

/**
 * Fetch all tasks for a user with course information
 */
export async function getTasksWithCourse(
	supabase: TypedSupabaseClient,
	userId: string,
	orderBy: 'deadline' | 'created_at' = 'deadline'
): Promise<{ data: TaskWithCourse[] | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('tasks')
		.select(
			`
			id,
			name,
			effort_hours,
			deadline,
			status,
			course_id,
			created_at,
			course:courses(id, name)
		`
		)
		.eq('user_id', userId)
		.order(orderBy, { ascending: orderBy === 'deadline' });

	return { data: data as TaskWithCourse[] | null, error };
}

/**
 * Create a new task
 */
export async function createTask(
	supabase: TypedSupabaseClient,
	taskData: TaskCreateData
): Promise<{ error: Error | null }> {
	const { error } = await supabase.from('tasks').insert({
		user_id: taskData.user_id,
		name: taskData.name,
		effort_hours: taskData.effort_hours,
		deadline: taskData.deadline,
		course_id: taskData.course_id ?? null,
		status: taskData.status ?? 'pending'
	});

	return { error };
}

/**
 * Update a task by ID (only updates provided fields)
 */
export async function updateTask(
	supabase: TypedSupabaseClient,
	taskId: string,
	userId: string,
	updates: TaskUpdateData
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('tasks')
		.update(updates)
		.eq('id', taskId)
		.eq('user_id', userId);

	return { error };
}

/**
 * Mark multiple tasks as completed
 */
export async function markTasksCompleted(
	supabase: TypedSupabaseClient,
	taskIds: string[],
	userId: string
): Promise<{ data: { id: string }[] | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('tasks')
		.update({ status: 'completed' })
		.in('id', taskIds)
		.eq('user_id', userId)
		.select('id');

	return { data, error };
}

/**
 * Delete tasks by course ID
 */
export async function deleteTasksByCourse(
	supabase: TypedSupabaseClient,
	courseId: string,
	userId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('tasks')
		.delete()
		.eq('course_id', courseId)
		.eq('user_id', userId);

	return { error };
}

/**
 * Bulk insert tasks (used for auto-generating tasks from courses)
 */
export async function createTasksBatch(
	supabase: TypedSupabaseClient,
	tasks: TaskCreateData[]
): Promise<{ error: Error | null }> {
	const { error } = await supabase.from('tasks').insert(tasks);
	return { error };
}

// =============================================================================
// Course Operations
// =============================================================================

/**
 * Fetch all courses for a user
 */
export async function getCourses(
	supabase: TypedSupabaseClient,
	userId: string,
	orderBy: 'name' | 'created_at' = 'name'
): Promise<{ data: Course[] | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('courses')
		.select('*')
		.eq('user_id', userId)
		.order(orderBy, { ascending: orderBy === 'name' });

	return { data, error };
}

/**
 * Fetch course names and IDs only (for dropdowns)
 */
export async function getCourseOptions(
	supabase: TypedSupabaseClient,
	userId: string
): Promise<{ data: { id: string; name: string }[] | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('courses')
		.select('id, name')
		.eq('user_id', userId)
		.order('name');

	return { data, error };
}

/**
 * Create a new course
 */
export async function createCourse(
	supabase: TypedSupabaseClient,
	courseData: {
		user_id: string;
		name: string;
		ects_points: number;
		start_date: string;
		end_date: string;
		lecture_weekdays: string;
	}
): Promise<{ data: Course | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('courses')
		.insert(courseData)
		.select()
		.single();

	return { data, error };
}

/**
 * Delete a course by ID
 */
export async function deleteCourse(
	supabase: TypedSupabaseClient,
	courseId: string,
	userId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('courses')
		.delete()
		.eq('id', courseId)
		.eq('user_id', userId);

	return { error };
}

// =============================================================================
// Auth Helpers
// =============================================================================

/**
 * Get the current authenticated user
 * Throws standardized error responses for use in actions
 */
export async function getAuthenticatedUser(
	supabase: TypedSupabaseClient
): Promise<{ userId: string; error: null } | { userId: null; error: { status: number; message: string } }> {
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	if (error) {
		return { userId: null, error: { status: 401, message: error.message } };
	}

	if (!user) {
		return { userId: null, error: { status: 401, message: 'Not authenticated' } };
	}

	return { userId: user.id, error: null };
}

// =============================================================================
// Form Data Helpers
// =============================================================================

/**
 * Parse and validate task update data from FormData
 */
export function parseTaskUpdateForm(formData: FormData): {
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

	if (Object.keys(updates).length === 0) {
		return { taskId, updates: {}, error: 'No updatable fields provided' };
	}

	return { taskId, updates, error: null };
}

/**
 * Parse and validate task creation data from FormData
 */
export function parseTaskCreateForm(formData: FormData): {
	data: Omit<TaskCreateData, 'user_id'> | null;
	error: string | null;
} {
	const name = formData.get('name')?.toString()?.trim();
	const effortStr = formData.get('effort_hours')?.toString();
	const courseId = formData.get('course_id')?.toString() || null;
	const deadlineRaw = formData.get('deadline')?.toString();

	if (!name) return { data: null, error: 'Missing name' };
	if (!effortStr) return { data: null, error: 'Missing effort_hours' };

	let effortHours = Number.parseFloat(effortStr);
	if (!Number.isFinite(effortHours) || effortHours < 0) {
		return { data: null, error: 'effort_hours must be a non-negative number' };
	}
	effortHours = Math.round(effortHours);

	let deadline: string = '';
	if (deadlineRaw) {
		const d = new Date(deadlineRaw);
		deadline = isNaN(d.getTime()) ? deadlineRaw : d.toISOString();
	}

	return {
		data: {
			name,
			effort_hours: effortHours,
			course_id: courseId,
			deadline,
			status: 'pending'
		},
		error: null
	};
}

