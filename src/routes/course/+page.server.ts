import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getCourses,
	createCourse,
	deleteCourse,
	deleteTasksByCourse,
	createTasksBatch,
	type TaskCreateData
} from '$lib/server/db';

/**
 * Convert ECTS points to weekly hours for lectures and assignments
 */
function convertEctsToWeeklyHours(ects: number): { lectureHours: number; assignmentHours: number } {
	const ratio = ects / 5.0;
	return {
		lectureHours: ratio * 2,
		assignmentHours: ratio * 2
	};
}

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		throw redirect(303, '/login');
	}

	const { data, error } = await getCourses(supabase, session.user.id, 'created_at');

	if (error) {
		console.error('Error loading courses:', error);
		return { courses: [] };
	}

	return { courses: data ?? [] };
};

export const actions: Actions = {
	addCourse: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session) {
			return fail(401, { error: 'Not authenticated' });
		}

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
			user_id: session.user.id,
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
			const { lectureHours, assignmentHours } = convertEctsToWeeklyHours(ectsPoints);
			const tasksToInsert: TaskCreateData[] = [];

			const currentDate = new Date(startDate);
			let weekCounter = 1;

			while (currentDate <= endDate) {
				const dayOfWeek = currentDate.getDay();

				if (lectureWeekdays.includes(dayOfWeek)) {
					const deadline = new Date(currentDate);
					deadline.setHours(23, 59, 59);

					tasksToInsert.push({
						user_id: session.user.id,
						course_id: newCourse.id,
						name: `Lecture ${weekCounter}`,
						effort_hours: Math.round(lectureHours),
						deadline: deadline.toISOString(),
						status: 'pending'
					});

					tasksToInsert.push({
						user_id: session.user.id,
						course_id: newCourse.id,
						name: `Assignment ${weekCounter}`,
						effort_hours: Math.round(assignmentHours),
						deadline: deadline.toISOString(),
						status: 'pending'
					});

					weekCounter++;
				}

				currentDate.setDate(currentDate.getDate() + 1);
			}

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

	deleteCourse: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const courseId = formData.get('course_id')?.toString();

		if (!courseId) {
			return fail(400, { error: 'Missing course_id' });
		}

		try {
			// Delete tasks first to avoid orphaned records
			const { error: tasksError } = await deleteTasksByCourse(supabase, courseId, session.user.id);

			if (tasksError) {
				console.error('Error deleting tasks:', tasksError);
				// Continue anyway - try to delete the course
			}

			// Delete the course
			const { error: courseError } = await deleteCourse(supabase, courseId, session.user.id);

			if (courseError) {
				console.error('Error deleting course:', courseError);
				return fail(500, { error: 'Failed to delete course' });
			}

			return { success: true };
		} catch (err) {
			console.error('deleteCourse action crashed:', err);
			return fail(500, { error: 'Internal error while deleting course' });
		}
	}
};
