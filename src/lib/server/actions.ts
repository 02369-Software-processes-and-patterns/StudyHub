/**
 * Shared action handlers for server-side form actions.
 * These can be spread into page-specific actions to avoid duplication.
 */

import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';
import {
	getAuthenticatedUser,
	updateTask,
	deleteTask,
	updateCourse,
	deleteCourse,
	deleteTasksByCourse,
	parseTaskUpdateForm,
	regenerateCourseTasks
} from './db';

type TypedSupabaseClient = SupabaseClient<Database>;

// =============================================================================
// Helper: Require Authentication
// =============================================================================

/**
 * Helper to get authenticated user or return a fail response.
 * Use this at the start of actions that require authentication.
 */
export async function requireAuth(supabase: TypedSupabaseClient) {
	const authResult = await getAuthenticatedUser(supabase);
	if (authResult.error) {
		return {
			userId: null as null,
			failResponse: fail(authResult.error.status, { error: authResult.error.message })
		};
	}
	return { userId: authResult.userId, failResponse: null };
}

// =============================================================================
// Task Actions
// =============================================================================

/**
 * Shared updateTask action handler.
 * Can be used in any page that needs to update tasks.
 */
export async function handleUpdateTask(request: Request, supabase: TypedSupabaseClient) {
	try {
		const { userId, failResponse } = await requireAuth(supabase);
		if (failResponse) return failResponse;

		const formData = await request.formData();
		const { taskId, updates, error: parseError } = parseTaskUpdateForm(formData);

		if (parseError || !taskId) {
			return fail(400, { error: parseError ?? 'Missing task_id' });
		}

		const { error } = await updateTask(supabase, taskId, userId, updates);

		if (error) {
			console.error('Supabase update error:', error);
			return fail(500, { error: error.message });
		}

		return { success: true, updated: Object.keys(updates) };
	} catch (err) {
		console.error('updateTask action crashed:', err);
		return fail(500, { error: 'Internal error while updating task' });
	}
}

/**
 * Shared deleteTask action handler.
 * Can be used in any page that needs to delete tasks.
 */
export async function handleDeleteTask(request: Request, supabase: TypedSupabaseClient) {
	try {
		const { userId, failResponse } = await requireAuth(supabase);
		if (failResponse) return failResponse;

		const formData = await request.formData();
		const taskId = formData.get('task_id')?.toString();

		if (!taskId) {
			return fail(400, { error: 'Missing task_id' });
		}

		const { error } = await deleteTask(supabase, taskId, userId);

		if (error) {
			console.error('Supabase delete error:', error);
			return fail(500, { error: error.message });
		}

		return { success: true };
	} catch (err) {
		console.error('deleteTask action crashed:', err);
		return fail(500, { error: 'Internal error while deleting task' });
	}
}

// =============================================================================
// Course Actions
// =============================================================================

/**
 * Shared updateCourse action handler.
 * Can be used in any page that needs to update courses.
 */
export async function handleUpdateCourse(request: Request, supabase: TypedSupabaseClient) {
	const { userId, failResponse } = await requireAuth(supabase);
	if (failResponse) return failResponse;

	const formData = await request.formData();
	const courseId = formData.get('course_id')?.toString();
	const name = formData.get('name')?.toString()?.trim();
	const ectsPointsStr = formData.get('ects_points')?.toString();
	const startDateStr = formData.get('start_date')?.toString();
	const endDateStr = formData.get('end_date')?.toString();
	const lectureWeekdaysStr = formData.get('lecture_weekdays')?.toString();

	if (!courseId) {
		return fail(400, { error: 'Missing course_id' });
	}

	const updates: {
		name?: string;
		ects_points?: number;
		start_date?: string;
		end_date?: string;
		lecture_weekdays?: string;
	} = {};

	if (name) updates.name = name;
	if (ectsPointsStr) updates.ects_points = Number(ectsPointsStr);
	if (startDateStr) updates.start_date = startDateStr;
	if (endDateStr) updates.end_date = endDateStr;
	if (lectureWeekdaysStr) updates.lecture_weekdays = lectureWeekdaysStr;

	if (Object.keys(updates).length === 0) {
		return fail(400, { error: 'No fields to update' });
	}

	// Check if scheduling-related fields changed (requires task regeneration)
	const schedulingFieldsChanged =
		updates.start_date !== undefined ||
		updates.end_date !== undefined ||
		updates.lecture_weekdays !== undefined ||
		updates.ects_points !== undefined;

	try {
		const { error } = await updateCourse(supabase, courseId, userId, updates);

		if (error) {
			console.error('Error updating course:', error);
			return fail(500, { error: error.message });
		}

		// If scheduling fields changed, regenerate tasks
		if (schedulingFieldsChanged) {
			const { error: regenError } = await regenerateCourseTasks(supabase, userId, courseId);
			if (regenError) {
				console.error('Error regenerating tasks:', regenError);
				// Don't fail - course was updated successfully
			}
		}

		return { success: true };
	} catch (err) {
		console.error('updateCourse action crashed:', err);
		return fail(500, { error: 'Internal error while updating course' });
	}
}

/**
 * Shared deleteCourse action handler.
 * Can be used in any page that needs to delete courses.
 */
export async function handleDeleteCourse(request: Request, supabase: TypedSupabaseClient) {
	const { userId, failResponse } = await requireAuth(supabase);
	if (failResponse) return failResponse;

	const formData = await request.formData();
	const courseId = formData.get('course_id')?.toString();

	if (!courseId) {
		return fail(400, { error: 'Missing course_id' });
	}

	try {
		// Delete tasks first to avoid orphaned records
		const { error: tasksError } = await deleteTasksByCourse(supabase, courseId, userId);

		if (tasksError) {
			console.error('Error deleting tasks:', tasksError);
			// Continue anyway - try to delete the course
		}

		// Delete the course
		const { error: courseError } = await deleteCourse(supabase, courseId, userId);

		if (courseError) {
			console.error('Error deleting course:', courseError);
			return fail(500, { error: 'Failed to delete course' });
		}

		return { success: true };
	} catch (err) {
		console.error('deleteCourse action crashed:', err);
		return fail(500, { error: 'Internal error while deleting course' });
	}
}
