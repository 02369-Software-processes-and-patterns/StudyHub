import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getCourses,
	createCourse,
	createTasksBatch,
	generateCourseTasksData,
	getAuthenticatedUser
} from '$lib/server/db';
import { handleUpdateCourse, handleDeleteCourse, requireAuth } from '$lib/server/actions';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const authResult = await getAuthenticatedUser(supabase);
	if (authResult.error) {
		throw redirect(303, '/login');
	}

	const { data, error } = await getCourses(supabase, authResult.userId, 'created_at');

	if (error) {
		console.error('Error loading courses:', error);
		return { courses: [] };
	}

	return { courses: data ?? [] };
};

export const actions: Actions = {
	addCourse: async ({ request, locals: { supabase } }) => {
		const { userId, failResponse } = await requireAuth(supabase);
		if (failResponse) return failResponse;

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const ectsPointsStr = formData.get('ects_points') as string;
		const startDateStr = formData.get('start_date') as string;
		const endDateStr = formData.get('end_date') as string;
		const lectureWeekdaysStr = formData.get('lecture_weekdays') as string;

		if (!name || !ectsPointsStr || !startDateStr || !endDateStr || !lectureWeekdaysStr) {
			return fail(400, { error: 'Missing required fields' });
		}

		const ectsPoints = Number(ectsPointsStr);
		const startDate = new Date(startDateStr);
		const endDate = new Date(endDateStr);
		const lectureWeekdays: number[] = JSON.parse(lectureWeekdaysStr);

		// Create the course
		const { data: newCourse, error: courseError } = await createCourse(supabase, {
			user_id: userId,
			name,
			ects_points: ectsPoints,
			start_date: startDateStr,
			end_date: endDateStr,
			lecture_weekdays: lectureWeekdaysStr
		});

		if (courseError) {
			return fail(500, { error: courseError.message });
		}

		if (!newCourse) {
			return fail(500, { error: 'Failed to create course or retrieve new course ID' });
		}

		// Auto-generate tasks for the course
		try {
			const tasksToInsert = generateCourseTasksData(
				userId,
				newCourse.id,
				ectsPoints,
				startDate,
				endDate,
				lectureWeekdays
			);

			if (tasksToInsert.length > 0) {
				const { error: tasksError } = await createTasksBatch(supabase, tasksToInsert);

				if (tasksError) {
					console.error('Error inserting auto-generated tasks:', tasksError);
					// Don't fail the action - course was created successfully
				}
			}
		} catch (e) {
			console.error('Error during task generation logic:', e);
			// Don't fail the action - course was created successfully
		}

		return { success: true };
	},

	deleteCourse: async ({ request, locals: { supabase } }) => {
		return handleDeleteCourse(request, supabase);
	},

	updateCourse: async ({ request, locals: { supabase } }) => {
		return handleUpdateCourse(request, supabase);
	}
};
