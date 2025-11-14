import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return { tasks: [], courses: [] };
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

	// Fetch user's courses
	const { data: courses, error: coursesError } = await supabase
		.from('courses')
		.select('*')
		.eq('user_id', session.user.id)
		.order('name', { ascending: true });

	if (coursesError) console.error('Error loading courses:', coursesError);

	return {
		tasks: tasks ?? [],
		courses: courses ?? []
	};
};

export const actions: Actions = {
	updateTask: async ({ request, locals: { supabase } }) => {
		try {
			const {
				data: { user },
				error: userErr
			} = await supabase.auth.getUser();
			if (userErr) return fail(401, { error: userErr.message });
			if (!user) return fail(401, { error: 'Not authenticated' });

			const formData = await request.formData();
			const task_id = formData.get('task_id')?.toString();
			if (!task_id) return fail(400, { error: 'Missing task_id' });

			const patch: Record<string, unknown> = {};

			if (formData.has('status')) {
				const raw = formData.get('status')?.toString().toLowerCase();
				const allowed = ['pending', 'todo', 'on-hold', 'working', 'completed'] as const;
				if (!raw || !allowed.includes(raw as (typeof allowed)[number])) {
					return fail(400, { error: 'Invalid status value' });
				}
				patch.status = raw;
			}

			if (formData.has('name')) {
				const name = formData.get('name')?.toString()?.trim();
				if (name) patch.name = name;
			}

			if (formData.has('effort_hours')) {
				let num = Number.parseFloat(formData.get('effort_hours')?.toString() ?? '');
				if (!Number.isFinite(num) || num < 0) return fail(400, { error: 'Invalid effort_hours' });
				num = Math.round(num);
				patch.effort_hours = num;
			}

			if (formData.has('deadline')) {
				const raw = formData.get('deadline')?.toString();
				if (raw) {
					const d = new Date(raw);
					patch.deadline = isNaN(d.getTime()) ? raw : d.toISOString();
				}
			}

			if (formData.has('course_id')) {
				const cid = formData.get('course_id')?.toString() || null;
				patch.course_id = cid;
			}

			if (Object.keys(patch).length === 0) {
				return fail(400, { error: 'No updatable fields provided' });
			}

			const { error } = await supabase
				.from('tasks')
				.update(patch)
				.eq('id', task_id)
				.eq('user_id', user.id);

			if (error) {
				console.error('Supabase update error:', error);
				return fail(500, { error: error.message });
			}

			return { success: true, updated: Object.keys(patch) };
		} catch (err) {
			console.error('updateTask action crashed:', err);
			return fail(500, { error: 'Internal error while updating task' });
		}
	}
};
