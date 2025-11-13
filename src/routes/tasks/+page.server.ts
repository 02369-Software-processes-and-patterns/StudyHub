import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	try {
		const {
			data: { user },
			error: userErr
		} = await supabase.auth.getUser();
		if (userErr) {
			console.error('getUser error:', userErr);
			return { tasks: [], courses: [] };
		}
		if (!user) return { tasks: [], courses: [] };

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
			.order('created_at', { ascending: false });

		const { data: courses, error: coursesError } = await supabase
			.from('courses')
			.select('id, name')
			.eq('user_id', user.id)
			.order('name');

		if (tasksError) console.error('Error loading tasks:', tasksError);
		if (coursesError) console.error('Error loading courses:', coursesError);

		return { tasks: tasks ?? [], courses: courses ?? [] };
	} catch (err) {
		console.error('LOAD /tasks crashed:', err);
		return { tasks: [], courses: [] };
	}
};

export const actions: Actions = {
	/** POST ?/create — opret task */
	create: async ({ request, locals: { supabase } }) => {
		try {
			const {
				data: { user },
				error: userErr
			} = await supabase.auth.getUser();
			if (userErr) return fail(401, { error: userErr.message });
			if (!user) return fail(401, { error: 'Not authenticated' });

			const formData = await request.formData();
			const name = formData.get('name')?.toString()?.trim();
			const effortStr = formData.get('effort_hours')?.toString();
			const course_id = formData.get('course_id')?.toString() || null;
			const deadlineRaw = formData.get('deadline')?.toString();

			if (!name) return fail(400, { error: 'Missing name' });
			if (!effortStr) return fail(400, { error: 'Missing effort_hours' });

			// DB-fejl viste at effort_hours er INT → rund af for nu.
			let effort_hours = Number.parseFloat(effortStr);
			if (!Number.isFinite(effort_hours) || effort_hours < 0) {
				return fail(400, { error: 'effort_hours must be a non-negative number' });
			}
			effort_hours = Math.round(effort_hours);

			let deadline: string | null = null;
			if (deadlineRaw) {
				const d = new Date(deadlineRaw);
				deadline = isNaN(d.getTime()) ? deadlineRaw : d.toISOString();
			}

			const { error } = await supabase.from('tasks').insert({
				user_id: user.id,
				name,
				effort_hours,
				course_id,
				deadline,
				status: 'pending'
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

	/** POST ?/updateTask — opdater felter (status mm.) */
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
				// rund til heltal hvis kolonnen er INT
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
