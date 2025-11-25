import type { PageServerLoad } from './$types';
import { getTasksWithCourse, getAuthenticatedUser } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	try {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return { tasks: [] };
		}

		const { data, error } = await getTasksWithCourse(supabase, authResult.userId, 'deadline');

		if (error) {
			console.error('Error loading tasks:', error);
			return { tasks: [] };
		}

		return { tasks: data ?? [] };
	} catch (err) {
		console.error('LOAD /workload crashed:', err);
		return { tasks: [] };
	}
};
