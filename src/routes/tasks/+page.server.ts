import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getTasksWithCourse,
	getCourseOptions,
	getAuthenticatedUser,
	createTask,
	markTasksCompleted,
	parseTaskCreateForm
} from '$lib/server/db';
import { handleUpdateTask, handleDeleteTask, requireAuth } from '$lib/server/actions';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	try {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return { tasks: [], courses: [] };
		}

		// Fetch tasks and courses in parallel
		const [tasksResult, coursesResult] = await Promise.all([
			getTasksWithCourse(supabase, authResult.userId, 'created_at'),
			getCourseOptions(supabase, authResult.userId)
		]);

		if (tasksResult.error) console.error('Error loading tasks:', tasksResult.error);
		if (coursesResult.error) console.error('Error loading courses:', coursesResult.error);

		return {
			tasks: tasksResult.data ?? [],
			courses: coursesResult.data ?? []
		};
	} catch (err) {
		console.error('LOAD /tasks crashed:', err);
		return { tasks: [], courses: [] };
	}
};

export const actions: Actions = {
	/** POST ?/create — create a new task */
	create: async ({ request, locals: { supabase } }) => {
		try {
			const { userId, failResponse } = await requireAuth(supabase);
			if (failResponse) return failResponse;

			const formData = await request.formData();
			const { data: taskData, error: parseError } = parseTaskCreateForm(formData);

			if (parseError || !taskData) {
				return fail(400, { error: parseError ?? 'Invalid form data' });
			}

			const { error } = await createTask(supabase, {
				...taskData,
				user_id: userId
			});

			if (error) {
				console.error('Supabase insert error:', error);
				return fail(500, { error: error.message });
			}

			return { success: true };
		} catch (err) {
			console.error('CREATE action crashed:', err);
			return fail(500, { error: 'Internal error while creating task' });
		}
	},

	/** POST ?/updateTask — update task fields (status, name, etc.) */
	updateTask: async ({ request, locals: { supabase } }) => {
		return handleUpdateTask(request, supabase);
	},

	/** POST ?/updateTasksBatch — mark multiple tasks as completed */
	updateTasksBatch: async ({ request, locals: { supabase } }) => {
		try {
			const { userId, failResponse } = await requireAuth(supabase);
			if (failResponse) return failResponse;

			const formData = await request.formData();
			const taskIds = formData.getAll('task_ids').map(String);

			if (taskIds.length === 0) {
				return fail(400, { error: 'No task IDs provided' });
			}

			const { data, error } = await markTasksCompleted(supabase, taskIds, userId);

			if (error) {
				console.error('Supabase batch update error:', error);
				return fail(500, { error: error.message });
			}

			return { success: true, updated: data?.length ?? 0 };
		} catch (err) {
			console.error('updateTasksBatch action crashed:', err);
			return fail(500, { error: 'Internal error while updating tasks' });
		}
	},

	/** POST ?/deleteTask — delete a single task */
	deleteTask: async ({ request, locals: { supabase } }) => {
		return handleDeleteTask(request, supabase);
	}
};
