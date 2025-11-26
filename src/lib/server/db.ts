/**
 * Centralized database operations for server-side code.
 * All Supabase queries should go through these functions to avoid duplication.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

type TypedSupabaseClient = SupabaseClient<Database>;

// =============================================================================
// Types
// =============================================================================

export type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

export type TaskWithCourse = {
	id: string;
	name: string;
	effort_hours: number;
	deadline: string;
	status: TaskStatus;
	course_id: string | null;
	created_at: string;
	course: { id: string; name: string } | null;
};

export type Course = {
	id: string;
	name: string;
	ects_points: number;
	start_date: string;
	end_date: string;
	lecture_weekdays: number[] | string | null;
	created_at: string;
	user_id: string | null;
};

export type TaskUpdateData = {
	status?: TaskStatus;
	name?: string;
	effort_hours?: number;
	deadline?: string;
	course_id?: string | null;
	user_id?: string | null; // For assigning project tasks to members
};

// For personal tasks (user_id set, project_id null)
export type TaskCreateData = {
	user_id: string;
	name: string;
	effort_hours: number;
	deadline: string;
	course_id?: string | null;
	status?: TaskStatus;
};

// For project tasks (project_id set, user_id is assigned member or null)
export type ProjectTaskCreateData = {
	project_id: string;
	name: string;
	effort_hours: number;
	deadline: string;
	user_id?: string | null; // Assigned member (null = unassigned)
	course_id?: string | null; // Inherited from project's linked course
	status?: TaskStatus;
};

// Project task with assignee information
export type ProjectTaskWithAssignee = {
	id: string;
	name: string;
	effort_hours: number;
	deadline: string;
	status: TaskStatus;
	project_id: string;
	created_at: string;
	user_id: string | null; // Assigned member
	assignee?: {
		id: string;
		name: string;
		email: string;
	} | null;
};

// =============================================================================
// Task Operations
// =============================================================================

/**
 * Fetch all tasks for a user with course information
 */
export async function getTasksWithCourse(
	supabase: TypedSupabaseClient,
	userId: string,
	orderBy: 'deadline' | 'created_at' = 'deadline'
): Promise<{ data: TaskWithCourse[] | null; error: Error | null }> {
	const { data, error } = await supabase
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
		.eq('user_id', userId)
		.order(orderBy, { ascending: orderBy === 'deadline' });

	return { data: data as TaskWithCourse[] | null, error };
}

/**
 * Create a new personal task (user_id set, project_id null)
 */
export async function createTask(
	supabase: TypedSupabaseClient,
	taskData: TaskCreateData
): Promise<{ error: Error | null }> {
	const { error } = await supabase.from('tasks').insert({
		user_id: taskData.user_id,
		project_id: null, // Explicitly null for personal tasks
		name: taskData.name,
		effort_hours: taskData.effort_hours,
		deadline: taskData.deadline,
		course_id: taskData.course_id ?? null,
		status: taskData.status ?? 'pending'
	});

	return { error };
}

/**
 * Create a new project task (project_id set, user_id is assigned member or null)
 */
export async function createProjectTask(
	supabase: TypedSupabaseClient,
	taskData: ProjectTaskCreateData
): Promise<{ data: { id: string } | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('tasks')
		.insert({
			user_id: taskData.user_id ?? null, // Assigned member or null (unassigned)
			project_id: taskData.project_id,
			name: taskData.name,
			effort_hours: taskData.effort_hours,
			deadline: taskData.deadline,
			course_id: taskData.course_id ?? null, // Inherited from project's linked course
			status: taskData.status ?? 'pending'
		})
		.select('id')
		.single();

	return { data, error };
}

/**
 * Get all tasks for a project with assignee information
 */
export async function getProjectTasks(
	supabase: TypedSupabaseClient,
	projectId: string
): Promise<{ data: ProjectTaskWithAssignee[] | null; error: Error | null }> {
	const { data: tasks, error } = await supabase
		.from('tasks')
		.select('id, name, effort_hours, deadline, status, project_id, created_at, user_id')
		.eq('project_id', projectId)
		.order('deadline', { ascending: true });

	if (error || !tasks) {
		return { data: null, error };
	}

	// Get unique assignee IDs (user_id for project tasks = assigned member)
	const assigneeIds = [...new Set(tasks.filter((t) => t.user_id).map((t) => t.user_id!))];

	if (assigneeIds.length === 0) {
		return {
			data: tasks.map((t) => ({
				...t,
				project_id: t.project_id!, // We know it's not null since we filtered by project_id
				status: t.status as TaskStatus,
				assignee: null
			})),
			error: null
		};
	}

	// Get assignee details using RPC function
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC functions aren't typed
	const { data: userDetails, error: userError } = (await (supabase as any).rpc(
		'get_user_details_by_ids',
		{ user_ids: assigneeIds }
	)) as {
		data: Array<{ id: string; email: string; name?: string }> | null;
		error: Error | null;
	};

	if (userError) {
		console.error('Error fetching assignee details:', userError);
		// Return tasks without assignee details rather than failing
		return {
			data: tasks.map((t) => ({
				...t,
				project_id: t.project_id!, // We know it's not null since we filtered by project_id
				status: t.status as TaskStatus,
				assignee: null
			})),
			error: null
		};
	}

	// Map assignee details to tasks
	const tasksWithAssignees: ProjectTaskWithAssignee[] = tasks.map((task) => {
		const assigneeDetail = task.user_id
			? userDetails?.find((u) => u.id === task.user_id)
			: null;
		return {
			...task,
			project_id: task.project_id!, // We know it's not null since we filtered by project_id
			status: task.status as TaskStatus,
			assignee: assigneeDetail
				? {
						id: assigneeDetail.id,
						name: assigneeDetail.name || assigneeDetail.email?.split('@')[0] || 'Unknown',
						email: assigneeDetail.email
					}
				: null
		};
	});

	return { data: tasksWithAssignees, error: null };
}

/**
 * Update a project task's assignee (sets user_id)
 * Validates that the assignee is a member of the project
 */
export async function updateProjectTaskAssignee(
	supabase: TypedSupabaseClient,
	taskId: string,
	projectId: string,
	assigneeId: string | null
): Promise<{ error: Error | null }> {
	// If assigning to someone, verify they are a project member
	if (assigneeId) {
		const { data: membership } = await supabase
			.from('project_members')
			.select('user_id')
			.eq('project_id', projectId)
			.eq('user_id', assigneeId)
			.single();

		if (!membership) {
			return { error: new Error('User is not a member of this project') };
		}
	}

	const { error } = await supabase
		.from('tasks')
		.update({ user_id: assigneeId })
		.eq('id', taskId)
		.eq('project_id', projectId);

	return { error };
}

/**
 * Update a project task (for project members)
 */
export async function updateProjectTask(
	supabase: TypedSupabaseClient,
	taskId: string,
	projectId: string,
	updates: TaskUpdateData
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('tasks')
		.update(updates)
		.eq('id', taskId)
		.eq('project_id', projectId);

	return { error };
}

/**
 * Delete a project task
 */
export async function deleteProjectTask(
	supabase: TypedSupabaseClient,
	taskId: string,
	projectId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('tasks')
		.delete()
		.eq('id', taskId)
		.eq('project_id', projectId);

	return { error };
}

/**
 * Update a task by ID (only updates provided fields)
 */
export async function updateTask(
	supabase: TypedSupabaseClient,
	taskId: string,
	userId: string,
	updates: TaskUpdateData
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('tasks')
		.update(updates)
		.eq('id', taskId)
		.eq('user_id', userId);

	return { error };
}

/**
 * Mark multiple tasks as completed
 */
export async function markTasksCompleted(
	supabase: TypedSupabaseClient,
	taskIds: string[],
	userId: string
): Promise<{ data: { id: string }[] | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('tasks')
		.update({ status: 'completed' })
		.in('id', taskIds)
		.eq('user_id', userId)
		.select('id');

	return { data, error };
}

/**
 * Delete tasks by course ID
 */
export async function deleteTasksByCourse(
	supabase: TypedSupabaseClient,
	courseId: string,
	userId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('tasks')
		.delete()
		.eq('course_id', courseId)
		.eq('user_id', userId);

	return { error };
}

/**
 * Delete a single task by ID
 */
export async function deleteTask(
	supabase: TypedSupabaseClient,
	taskId: string,
	userId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);

	return { error };
}

/**
 * Bulk insert tasks (used for auto-generating tasks from courses)
 */
export async function createTasksBatch(
	supabase: TypedSupabaseClient,
	tasks: TaskCreateData[]
): Promise<{ error: Error | null }> {
	const { error } = await supabase.from('tasks').insert(tasks);
	return { error };
}

// =============================================================================
// Course Operations
// =============================================================================

/**
 * Fetch all courses for a user
 */
export async function getCourses(
	supabase: TypedSupabaseClient,
	userId: string,
	orderBy: 'name' | 'created_at' = 'name'
): Promise<{ data: Course[] | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('courses')
		.select('*')
		.eq('user_id', userId)
		.order(orderBy, { ascending: orderBy === 'name' });

	return { data: data as Course[] | null, error };
}

/**
 * Fetch course names and IDs only (for dropdowns)
 */
export async function getCourseOptions(
	supabase: TypedSupabaseClient,
	userId: string
): Promise<{ data: { id: string; name: string }[] | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('courses')
		.select('id, name')
		.eq('user_id', userId)
		.order('name');

	return { data, error };
}

/**
 * Create a new course
 */
export async function createCourse(
	supabase: TypedSupabaseClient,
	courseData: {
		user_id: string;
		name: string;
		ects_points: number;
		start_date: string;
		end_date: string;
		lecture_weekdays: string;
	}
): Promise<{ data: Course | null; error: Error | null }> {
	const { data, error } = await supabase.from('courses').insert(courseData).select().single();

	return { data: data as Course | null, error };
}

/**
 * Delete a course by ID
 */
export async function deleteCourse(
	supabase: TypedSupabaseClient,
	courseId: string,
	userId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('courses')
		.delete()
		.eq('id', courseId)
		.eq('user_id', userId);

	return { error };
}

/**
 * Update a course by ID
 */
export async function updateCourse(
	supabase: TypedSupabaseClient,
	courseId: string,
	userId: string,
	updates: {
		name?: string;
		ects_points?: number;
		start_date?: string;
		end_date?: string;
		lecture_weekdays?: string;
	}
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('courses')
		.update(updates)
		.eq('id', courseId)
		.eq('user_id', userId);

	return { error };
}

// =============================================================================
// Auth Helpers
// =============================================================================

/**
 * Get the current authenticated user
 * Throws standardized error responses for use in actions
 */
export async function getAuthenticatedUser(
	supabase: TypedSupabaseClient
): Promise<
	{ userId: string; error: null } | { userId: null; error: { status: number; message: string } }
> {
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	if (error) {
		return { userId: null, error: { status: 401, message: error.message } };
	}

	if (!user) {
		return { userId: null, error: { status: 401, message: 'Not authenticated' } };
	}

	return { userId: user.id, error: null };
}

// =============================================================================
// Form Data Helpers
// =============================================================================

/**
 * Parse and validate task update data from FormData
 */
export function parseTaskUpdateForm(formData: FormData): {
	taskId: string | null;
	updates: TaskUpdateData;
	error: string | null;
} {
	const taskId = formData.get('task_id')?.toString() ?? null;

	if (!taskId) {
		return { taskId: null, updates: {}, error: 'Missing task_id' };
	}

	const updates: TaskUpdateData = {};
	const allowedStatuses: TaskStatus[] = ['pending', 'todo', 'on-hold', 'working', 'completed'];

	// Parse status
	if (formData.has('status')) {
		const raw = formData.get('status')?.toString().toLowerCase();
		if (!raw || !allowedStatuses.includes(raw as TaskStatus)) {
			return { taskId, updates: {}, error: 'Invalid status value' };
		}
		updates.status = raw as TaskStatus;
	}

	// Parse name
	if (formData.has('name')) {
		const name = formData.get('name')?.toString()?.trim();
		if (name) updates.name = name;
	}

	// Parse effort_hours
	if (formData.has('effort_hours')) {
		const num = Number.parseFloat(formData.get('effort_hours')?.toString() ?? '');
		if (!Number.isFinite(num) || num < 0) {
			return { taskId, updates: {}, error: 'Invalid effort_hours' };
		}
		updates.effort_hours = Math.round(num);
	}

	// Parse deadline
	if (formData.has('deadline')) {
		const raw = formData.get('deadline')?.toString();
		if (raw) {
			const d = new Date(raw);
			updates.deadline = isNaN(d.getTime()) ? raw : d.toISOString();
		}
	}

	// Parse course_id
	if (formData.has('course_id')) {
		const cid = formData.get('course_id')?.toString() || null;
		updates.course_id = cid;
	}

	if (Object.keys(updates).length === 0) {
		return { taskId, updates: {}, error: 'No updatable fields provided' };
	}

	return { taskId, updates, error: null };
}

/**
 * Parse and validate task creation data from FormData
 */
export function parseTaskCreateForm(formData: FormData): {
	data: Omit<TaskCreateData, 'user_id'> | null;
	error: string | null;
} {
	const name = formData.get('name')?.toString()?.trim();
	const effortStr = formData.get('effort_hours')?.toString();
	const courseId = formData.get('course_id')?.toString() || null;
	const deadlineRaw = formData.get('deadline')?.toString();

	if (!name) return { data: null, error: 'Missing name' };
	if (!effortStr) return { data: null, error: 'Missing effort_hours' };

	let effortHours = Number.parseFloat(effortStr);
	if (!Number.isFinite(effortHours) || effortHours < 0) {
		return { data: null, error: 'effort_hours must be a non-negative number' };
	}
	effortHours = Math.round(effortHours);

	let deadline: string = '';
	if (deadlineRaw) {
		const d = new Date(deadlineRaw);
		deadline = isNaN(d.getTime()) ? deadlineRaw : d.toISOString();
	}

	return {
		data: {
			name,
			effort_hours: effortHours,
			course_id: courseId,
			deadline,
			status: 'pending'
		},
		error: null
	};
}

// =============================================================================
// Project Operations
// =============================================================================

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold';

export type Project = {
	id: string;
	name: string;
	description: string;
	status: ProjectStatus;
	course_id: string | null;
	created_at: string;
	course?: { id: string; name: string } | null;
};

export type ProjectMember = {
	id: string;
	role: 'Owner' | 'Admin' | 'Member';
	email: string;
	name: string;
};

export type ProjectWithRole = Project & {
	role: 'Owner' | 'Admin' | 'Member';
};

/**
 * Get all projects for a user with their role in each project
 */
export async function getProjectsWithRole(
	supabase: TypedSupabaseClient,
	userId: string
): Promise<{ data: ProjectWithRole[] | null; error: Error | null }> {
	const { data: projectMembers, error } = await supabase
		.from('project_members')
		.select(
			`
			project_id,
			role,
			projects (
				id,
				name,
				description,
				status,
				created_at,
				course:courses(id, name)
			)
		`
		)
		.eq('user_id', userId);

	if (error) {
		return { data: null, error };
	}

	const projects = (projectMembers ?? []).map((member) => ({
		...member.projects,
		role: member.role
	})) as ProjectWithRole[];

	return { data: projects, error: null };
}

/**
 * Create a new project and add the creator as owner
 */
export async function createProject(
	supabase: TypedSupabaseClient,
	userId: string,
	projectData: {
		name: string;
		description: string;
		course_id?: string | null;
		status?: ProjectStatus;
	}
): Promise<{ data: Project | null; error: Error | null }> {
	// Use RPC function to create project and add owner atomically
	// This bypasses RLS issues and ensures both operations succeed together
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC functions aren't typed in database.types.ts
	const { data, error } = await (supabase as any).rpc('create_project_with_owner', {
		p_name: projectData.name,
		p_description: projectData.description,
		p_course_id: projectData.course_id || null,
		p_status: projectData.status || 'planning'
	});

	if (error) {
		return { data: null, error };
	}

	return { data: data as Project, error: null };
}

/**
 * Get a project by ID with course info
 */
export async function getProject(
	supabase: TypedSupabaseClient,
	projectId: string
): Promise<{ data: Project | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('projects')
		.select(
			`
			*,
			course:courses(name)
		`
		)
		.eq('id', projectId)
		.single();

	return { data: data as Project | null, error };
}

/**
 * Get a user's role in a project
 */
export async function getProjectMemberRole(
	supabase: TypedSupabaseClient,
	projectId: string,
	userId: string
): Promise<{ role: 'Owner' | 'Admin' | 'Member' | null; error: Error | null }> {
	const { data, error } = await supabase
		.from('project_members')
		.select('role')
		.eq('project_id', projectId)
		.eq('user_id', userId)
		.single();

	if (error && error.code !== 'PGRST116') {
		// PGRST116 = no rows returned
		return { role: null, error };
	}

	return { role: data?.role as 'Owner' | 'Admin' | 'Member' | null, error: null };
}

/**
 * Get all members of a project with their details
 */
export async function getProjectMembers(
	supabase: TypedSupabaseClient,
	projectId: string
): Promise<{ data: ProjectMember[] | null; error: Error | null }> {
	const { data: members, error: membersError } = await supabase
		.from('project_members')
		.select('user_id, role, created_at')
		.eq('project_id', projectId)
		.order('role', { ascending: false })
		.order('created_at', { ascending: true });

	if (membersError || !members || members.length === 0) {
		return { data: [], error: membersError };
	}

	const userIds = members.map((m) => m.user_id);

	// Get user details using RPC function
	// Using type assertion since RPC functions may not be typed in database.types.ts
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC functions aren't typed
	const { data: userDetails, error: userError } = (await (supabase as any).rpc(
		'get_user_details_by_ids',
		{ user_ids: userIds }
	)) as {
		data: Array<{ id: string; email: string; name?: string }> | null;
		error: Error | null;
	};

	if (userError) {
		return { data: null, error: userError };
	}

	const membersWithDetails = members.map((member) => {
		const userDetail = userDetails?.find((u) => u.id === member.user_id);
		return {
			id: member.user_id,
			role: member.role as 'Owner' | 'Admin' | 'Member',
			email: userDetail?.email || 'N/A',
			name: userDetail?.name || userDetail?.email?.split('@')[0] || 'Unknown User'
		};
	});

	return { data: membersWithDetails, error: null };
}

/**
 * Add members to a project by their emails
 */
export async function addProjectMembers(
	supabase: TypedSupabaseClient,
	projectId: string,
	members: Array<{ email: string; role: string }>
): Promise<{ added: number; error: Error | null }> {
	if (members.length === 0) {
		return { added: 0, error: null };
	}

	const emails = members.map((m) => m.email);

	// Get user IDs from emails
	// Using type assertion since RPC functions may not be typed in database.types.ts
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC functions aren't typed
	const { data: userData, error: userError } = (await (supabase as any).rpc(
		'get_user_ids_by_emails',
		{
			email_list: emails
		}
	)) as {
		data: Array<{ id: string; email: string }> | null;
		error: Error | null;
	};

	if (userError) {
		return { added: 0, error: userError };
	}

	if (!userData || userData.length === 0) {
		return { added: 0, error: new Error('No users found with these emails') };
	}

	// Create member records
	const memberInserts = userData.map((user) => {
		const invitedMember = members.find((m) => m.email === user.email);
		return {
			project_id: projectId,
			user_id: user.id,
			role: invitedMember?.role || 'Member'
		};
	});

	const { error: insertError } = await supabase.from('project_members').insert(memberInserts);

	if (insertError) {
		return { added: 0, error: insertError };
	}

	return { added: memberInserts.length, error: null };
}

// =============================================================================
// Course Task Generation
// =============================================================================

/**
 * Parse lecture_weekdays which can be stored as JSON string, number array, or other JSON types
 */
export function parseLectureWeekdays(value: unknown): number[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		// Ensure all elements are numbers
		return value.filter((item): item is number => typeof item === 'number');
	}
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed)
				? parsed.filter((item): item is number => typeof item === 'number')
				: [];
		} catch {
			return [];
		}
	}
	return [];
}

/**
 * Convert ECTS points to weekly hours for lectures and assignments
 */
export function convertEctsToWeeklyHours(ects: number): {
	lectureHours: number;
	assignmentHours: number;
} {
	const ratio = ects / 5.0;
	return {
		lectureHours: ratio * 2,
		assignmentHours: ratio * 2
	};
}

/**
 * Generate task data for a course based on its schedule
 * Returns an array of TaskCreateData ready for insertion
 */
export function generateCourseTasksData(
	userId: string,
	courseId: string,
	ectsPoints: number,
	startDate: Date,
	endDate: Date,
	lectureWeekdays: number[]
): TaskCreateData[] {
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
				user_id: userId,
				course_id: courseId,
				name: `Lecture ${weekCounter}`,
				effort_hours: Math.round(lectureHours),
				deadline: deadline.toISOString(),
				status: 'pending'
			});

			tasksToInsert.push({
				user_id: userId,
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

	return tasksToInsert;
}

/**
 * Regenerate all tasks for a course after schedule changes
 * Deletes existing tasks and creates new ones based on updated schedule
 */
export async function regenerateCourseTasks(
	supabase: TypedSupabaseClient,
	userId: string,
	courseId: string
): Promise<{ error: Error | null }> {
	// Delete existing tasks for this course
	const { error: deleteError } = await deleteTasksByCourse(supabase, courseId, userId);
	if (deleteError) {
		return { error: deleteError };
	}

	// Get the course data
	const { data: course, error: courseError } = await supabase
		.from('courses')
		.select('*')
		.eq('id', courseId)
		.single();

	if (courseError || !course) {
		return { error: courseError || new Error('Course not found') };
	}

	// Generate new tasks
	const lectureWeekdays = parseLectureWeekdays(course.lecture_weekdays);
	const tasks = generateCourseTasksData(
		userId,
		courseId,
		course.ects_points,
		new Date(course.start_date),
		new Date(course.end_date),
		lectureWeekdays
	);

	if (tasks.length > 0) {
		const { error: insertError } = await createTasksBatch(supabase, tasks);
		if (insertError) {
			return { error: insertError };
		}
	}

	return { error: null };
}

/**
 * Remove a user from a project (Used when leaving a project or removing a member)
 */
export async function removeProjectMember(
	supabase: TypedSupabaseClient,
	projectId: string,
	userId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('project_members')
		.delete()
		.eq('project_id', projectId)
		.eq('user_id', userId);

	return { error };
}

/**
 * Delete a project by ID
 */
export async function deleteProject(
	supabase: TypedSupabaseClient,
	projectId: string
): Promise<{ error: Error | null }> {
	const { error } = await supabase
		.from('projects')
		.delete()
		.eq('id', projectId);

	return { error };
}

