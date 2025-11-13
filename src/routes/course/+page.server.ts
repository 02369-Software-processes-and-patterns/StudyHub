	import { redirect, fail } from '@sveltejs/kit';
	import type { PageServerLoad, Actions } from './$types';

	// HHelper function for ECTS conversion
	function convertEctsToWeeklyHours(ects: number): { lectureHours: number; assignmentHours: number } {
		const ratio = ects / 5.0;
		const lectureHours = ratio * 2;
		const assignmentHours = ratio * 2;

		return { lectureHours, assignmentHours };
	}

	export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
		// Load the current session
		const { session } = await safeGetSession();

		// If no session, redirect to login
		if (!session) {
			throw redirect(303, '/login');
		}

		// Load user's courses from the database
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

	// Adding a new course action
	export const actions: Actions = {
		addCourse: async ({ request, locals: { supabase, safeGetSession } }) => {
			const { session } = await safeGetSession();

			if (!session) {
				return fail(401, { error: 'Not authenticated' });
			}

			
			const formData = await request.formData();
			const name = formData.get('name') as string;
			const ects_points_str = formData.get('ects_points') as string;
			const start_date_str = formData.get('start_date') as string;
			const end_date_str = formData.get('end_date') as string;
			const lecture_weekdays_str = formData.get('lecture_weekdays') as string;

			if (!name || !ects_points_str || !start_date_str || !end_date_str || !lecture_weekdays_str) {
				return fail(400, { error: 'Missing required fields' });
			}


			//changing constants to correct types
			const ects_points = Number(ects_points_str);
			const start_date = new Date(start_date_str);
			const end_date = new Date(end_date_str);
			const lecture_weekdays : Number[] = JSON.parse(lecture_weekdays_str);

			const { data: newCourse,  error: courseError } = await supabase.
				from('courses')
				.insert({
					user_id: session.user.id,
					name: name,
					ects_points: Number(ects_points),
					start_date: start_date_str,
					end_date: end_date_str,
					lecture_weekdays: lecture_weekdays_str
				})
				.select()
				.single();

			if (courseError) {
				return fail(500, { error: courseError.message });
			}
			
			if (!newCourse) {
				return fail(500, { error: 'Failed to create course or retrieve new course ID' });
			}
			
			try {

				const { lectureHours, assignmentHours } = convertEctsToWeeklyHours(ects_points);

				const tasksToInsert = [];

				let currentDate = new Date(start_date);
				let weekCounter = 1;

				// Loop through dates and weekdays to create tasks
				while (currentDate <= end_date) {
					const dayOfWeek = currentDate.getDay();

					if (lecture_weekdays.includes(dayOfWeek)) {
						
						const deadline = new Date (currentDate);
						deadline.setHours(23, 59, 59);

						tasksToInsert.push({
							user_id : session.user.id,
							course_id : newCourse.id,
							name : 'Lecture ' + weekCounter,
							effort_hours : lectureHours,
							deadline : deadline.toISOString(),
							status : 'pending'
						});

						tasksToInsert.push({
							user_id : session.user.id,
							course_id : newCourse.id,
							name : 'Assignment ' + weekCounter,
							effort_hours : assignmentHours,
							deadline : deadline.toISOString(),
							status : 'pending'
						});
						weekCounter ++;
					}
						
					currentDate.setDate(currentDate.getDate() + 1);

				}

				//insert all tasks in database
				if (tasksToInsert.length > 0) {
					const { error: tasksError } = await supabase
						.from('tasks')
						.insert(tasksToInsert);

					if (tasksError) {
						return console.error('Error inserting auto generated tasks:', tasksError);
					}
				}
				
			} catch (e: any) {
			console.error('Error during task generation logic:', e.message);
			// Error in logic (e.g., date parsing)
			}


			return { success: true };
			
		}
	};	