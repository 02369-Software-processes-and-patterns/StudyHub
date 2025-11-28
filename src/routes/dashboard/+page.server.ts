import type { Actions, PageServerLoad } from './$types';
import { getTasksWithCourse, getCourses, getAuthenticatedUser } from '$lib/server/db';
import {
	handleUpdateTask,
	handleDeleteTask,
	handleUpdateCourse,
	handleDeleteCourse
} from '$lib/server/actions';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const authResult = await getAuthenticatedUser(supabase);
	if (authResult.error) {
		return { tasks: [], courses: [] };
	}

	// Fetch tasks and courses in parallel
	const [tasksResult, coursesResult] = await Promise.all([
		getTasksWithCourse(supabase, authResult.userId, 'deadline'),
		getCourses(supabase, authResult.userId, 'name')
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
		return handleUpdateTask(request, supabase);
	},

	deleteTask: async ({ request, locals: { supabase } }) => {
		return handleDeleteTask(request, supabase);
	},

	updateCourse: async ({ request, locals: { supabase } }) => {
		return handleUpdateCourse(request, supabase);
	},

	deleteCourse: async ({ request, locals: { supabase } }) => {
		return handleDeleteCourse(request, supabase);
	}
};
