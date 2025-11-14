import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return { tasks: [] };
	}

	// Fetch upcoming tasks sorted by deadline
	const { data: tasks, error: tasksError } = await supabase
		.from('tasks')
		.select(
			`
            *,
            course:courses(id, name)
        `
		)
		.eq('user_id', session.user.id)
		.order('deadline', { ascending: true });

	if (tasksError) console.error('Error loading tasks:', tasksError);

	return {
		tasks: tasks ?? []
	};
};
