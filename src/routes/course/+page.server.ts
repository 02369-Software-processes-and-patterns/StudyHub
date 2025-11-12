import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	// Hent den nuværende session
	const { session } = await safeGetSession();

	// Hvis ingen session, redirect til login
	if (!session) {
		throw redirect(303, '/login');
	}

	// Hent alle kurser for den indloggede bruger
	const { data: courses, error } = await supabase
		.from('courses')
		.select('*')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error loading courses:', error);
		return {
			courses: []
		};
	}

	return {
		courses: courses || []
	};
};

export const actions: Actions = {
	addCourse: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session) {
			return fail(401, { error: 'Ikke logget ind' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const ects_points = formData.get('ects_points') as string;
		const start_date = formData.get('start_date') as string;
		const end_date = formData.get('end_date') as string;
		const lecture_weekdays = formData.get('lecture_weekdays') as string;

		const { error } = await supabase.from('courses').insert({
			user_id: session.user.id,
			name: name,
			ects_points: Number(ects_points),
			start_date: start_date || null,
			end_date: end_date || null,
			lecture_weekdays: lecture_weekdays ? JSON.parse(lecture_weekdays) : null
		});

		if (error) {
			return fail(500, { error: error.message });
		}

		return { success: true };
	}
};
