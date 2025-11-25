import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getTasksWithCourse,
	getCourses,
	getAuthenticatedUser,
	updateTask,
	deleteTask,
	updateCourse,
	deleteTasksByCourse,
	createTasksBatch,
	parseTaskUpdateForm,
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
		return { tasks: [], courses: [] };
	}

	// Fetch tasks and courses in parallel
	const [tasksResult, coursesResult] = await Promise.all([
		getTasksWithCourse(supabase, session.user.id, 'deadline'),
		getCourses(supabase, session.user.id, 'name')
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
		try {
			// Get authenticated user
			const authResult = await getAuthenticatedUser(supabase);
			if (authResult.error) {
				return fail(authResult.error.status, { error: authResult.error.message });
			}

			// Parse form data
			const formData = await request.formData();
			const { taskId, updates, error: parseError } = parseTaskUpdateForm(formData);

			if (parseError || !taskId) {
				return fail(400, { error: parseError ?? 'Missing task_id' });
			}

			// Update the task
			const { error } = await updateTask(supabase, taskId, authResult.userId, updates);

			if (error) {
				console.error('Supabase update error:', error);
				return fail(500, { error: error.message });
			}

			return { success: true, updated: Object.keys(updates) };
		} catch (err) {
			console.error('updateTask action crashed:', err);
			return fail(500, { error: 'Internal error while updating task' });
		}
	},

	deleteTask: async ({ request, locals: { supabase } }) => {
		try {
			const authResult = await getAuthenticatedUser(supabase);
			if (authResult.error) {
				return fail(authResult.error.status, { error: authResult.error.message });
			}

			const formData = await request.formData();
			const taskId = formData.get('task_id')?.toString();

			if (!taskId) {
				return fail(400, { error: 'Missing task_id' });
			}

			const { error } = await deleteTask(supabase, taskId, authResult.userId);

			if (error) {
				console.error('Supabase delete error:', error);
				return fail(500, { error: error.message });
			}

			return { success: true };
		} catch (err) {
			console.error('deleteTask action crashed:', err);
			return fail(500, { error: 'Internal error while deleting task' });
		}
	},

	updateCourse: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const courseId = formData.get('course_id')?.toString();
		const name = formData.get('name')?.toString()?.trim();
		const ectsPointsStr = formData.get('ects_points')?.toString();
		const startDateStr = formData.get('start_date')?.toString();
		const endDateStr = formData.get('end_date')?.toString();
		const lectureWeekdaysStr = formData.get('lecture_weekdays')?.toString();

		if (!courseId) {
			return fail(400, { error: 'Missing course_id' });
		}

		const updates: {
			name?: string;
			ects_points?: number;
			start_date?: string;
			end_date?: string;
			lecture_weekdays?: string;
		} = {};

		if (name) updates.name = name;
		if (ectsPointsStr) updates.ects_points = Number(ectsPointsStr);
		if (startDateStr) updates.start_date = startDateStr;
		if (endDateStr) updates.end_date = endDateStr;
		if (lectureWeekdaysStr) updates.lecture_weekdays = lectureWeekdaysStr;

		if (Object.keys(updates).length === 0) {
			return fail(400, { error: 'No fields to update' });
		}

		// Check if scheduling-related fields changed (requires task regeneration)
		const schedulingFieldsChanged = 
			updates.start_date !== undefined || 
			updates.end_date !== undefined || 
			updates.lecture_weekdays !== undefined ||
			updates.ects_points !== undefined;

		try {
			// Update the course
			const { error } = await updateCourse(supabase, courseId, session.user.id, updates);

			if (error) {
				console.error('Error updating course:', error);
				return fail(500, { error: error.message });
			}

			// If scheduling fields changed, regenerate tasks
			if (schedulingFieldsChanged) {
				// Delete existing auto-generated tasks
				await deleteTasksByCourse(supabase, courseId, session.user.id);

				// Get the updated course data to regenerate tasks
				const { data: updatedCourse } = await supabase
					.from('courses')
					.select('*')
					.eq('id', courseId)
					.single();

				if (updatedCourse) {
					const ectsPoints = updatedCourse.ects_points;
					const startDate = new Date(updatedCourse.start_date);
					const endDate = new Date(updatedCourse.end_date);
					let lectureWeekdays: number[] = [];
					
					if (updatedCourse.lecture_weekdays) {
						if (typeof updatedCourse.lecture_weekdays === 'string') {
							try {
								lectureWeekdays = JSON.parse(updatedCourse.lecture_weekdays);
							} catch {
								lectureWeekdays = [];
							}
						} else if (Array.isArray(updatedCourse.lecture_weekdays)) {
							lectureWeekdays = updatedCourse.lecture_weekdays as number[];
						}
					}

					// Generate new tasks
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
								course_id: courseId,
								name: `Lecture ${weekCounter}`,
								effort_hours: Math.round(lectureHours),
								deadline: deadline.toISOString(),
								status: 'pending'
							});

							tasksToInsert.push({
								user_id: session.user.id,
								course_id: courseId,
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
							console.error('Error regenerating tasks:', tasksError);
							// Don't fail - course was updated successfully
						}
					}
				}
			}

			return { success: true };
		} catch (err) {
			console.error('updateCourse action crashed:', err);
			return fail(500, { error: 'Internal error while updating course' });
		}
	}
};
