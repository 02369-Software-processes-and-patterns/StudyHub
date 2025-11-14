import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	try {
		const {
			data: { user },
			error: userErr
		} = await supabase.auth.getUser();
		if (userErr) {
			console.error('getUser error:', userErr);
			return { tasks: [] };
		}
		if (!user) return { tasks: [] };

		const { data: tasks, error: tasksError } = await supabase
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
			.eq('user_id', user.id)
			.order('deadline', { ascending: true });

		if (tasksError) {
			console.error('Error loading tasks:', tasksError);
			return { tasks: [] };
		}

		return { tasks: tasks ?? [] };
	} catch (err) {
		console.error('LOAD /workload crashed:', err);
		return { tasks: [] };
	}
};
