import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getTasksWithCourse,
	getCourses,
	getAuthenticatedUser,
	updateTask,
	parseTaskUpdateForm
} from '$lib/server/db';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return { tasks: [], courses: [] };
	}

	// Fetch tasks and courses in parallel
	const [tasksResult, coursesResult] = await Promise.all([
		getTasksWithCourse(supabase, session.user.id, 'deadline'),
		getCourses(supabase, session.user.id, 'name')
	]);

	if (tasksResult.error) console.error('Error loading tasks:', tasksResult.error);
	if (coursesResult.error) console.error('Error loading courses:', coursesResult.error);

	return {
		tasks: tasksResult.data ?? [],
		courses: coursesResult.data ?? []
	};
};

export const actions: Actions = {
	updateTask: async ({ request, locals: { supabase } }) => {
		try {
			// Get authenticated user
			const authResult = await getAuthenticatedUser(supabase);
			if (authResult.error) {
				return fail(authResult.error.status, { error: authResult.error.message });
			}

			// Parse form data
			const formData = await request.formData();
			const { taskId, updates, error: parseError } = parseTaskUpdateForm(formData);

			if (parseError || !taskId) {
				return fail(400, { error: parseError ?? 'Missing task_id' });
			}

			// Update the task
			const { error } = await updateTask(supabase, taskId, authResult.userId, updates);

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
};
