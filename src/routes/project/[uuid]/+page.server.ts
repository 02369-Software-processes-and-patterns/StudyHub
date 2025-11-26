import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getAuthenticatedUser,
	getProject,
	getProjectMemberRole,
	getProjectMembers,
	getProjectTasks,
	addProjectMembers,
	removeProjectMember,
	createProjectTask,
	updateProjectTask,
	updateProjectTaskAssignee,
	deleteProjectTask,
	deleteProject
} from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const authResult = await getAuthenticatedUser(supabase);
	if (authResult.error) {
		return { project: null, userRole: null, members: [], tasks: [] };
	}

	const { uuid } = params;

	// Fetch project, user role, members, and tasks in parallel
	const [projectResult, roleResult, membersResult, tasksResult] = await Promise.all([
		getProject(supabase, uuid),
		getProjectMemberRole(supabase, uuid, authResult.userId),
		getProjectMembers(supabase, uuid),
		getProjectTasks(supabase, uuid)
	]);

	if (projectResult.error) {
		console.error('Error loading project:', projectResult.error);
		return { project: null, userRole: null, members: [], tasks: [] };
	}

	if (tasksResult.error) {
		console.error('Error loading project tasks:', tasksResult.error);
	}

	return {
		project: projectResult.data,
		userRole: roleResult.role,
		members: membersResult.data ?? [],
		tasks: tasksResult.data ?? []
	};
};

export const actions: Actions = {
	inviteMembers: async ({ request, params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;
		const formData = await request.formData();
		const invitedMembersStr = formData.get('invitedMembers') as string;

		if (!invitedMembersStr) {
			return fail(400, { error: 'No members selected' });
		}

		// Check if the user is Owner or Admin
		const { role } = await getProjectMemberRole(supabase, projectId, authResult.userId);
		if (!role || !['Owner', 'Admin'].includes(role)) {
			return fail(403, { error: 'Only Owners and Admins can invite members.' });
		}

		let invitedMembers: Array<{ email: string; role: string }> = [];
		try {
			invitedMembers = JSON.parse(invitedMembersStr);
		} catch {
			return fail(400, { error: 'Invalid data format' });
		}

		const { added, error } = await addProjectMembers(supabase, projectId, invitedMembers);

		if (error) {
			// Handle unique constraint violation (user already a member)
			const pgError = error as { code?: string };
			if (pgError.code === '23505') {
				return fail(400, { error: 'One or more users are already in this project.' });
			}
			console.error('Error inviting members:', error);
			return fail(500, { error: error.message || 'Failed to invite members.' });
		}

		if (added === 0) {
			return fail(404, { error: 'No users found with these emails' });
		}

		return { success: true };
	},

	leaveProject: async ({ params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;
		const userId = authResult.userId;

		// 1. Tjek rolle
		const { role } = await getProjectMemberRole(supabase, projectId, userId);

		if (role === 'Owner') {
			return fail(400, {
				error: 'Owners cannot leave a project. You must delete the project or transfer ownership.'
			});
		}

		// 2. Forlad projektet
		const { error } = await removeProjectMember(supabase, projectId, userId);

		if (error) {
			console.error('Error leaving project:', error);
			return fail(500, { error: 'Failed to leave project.' });
		}

		throw redirect(303, '/project');
	},
  
  removeMember: async ({ request, params, locals: { supabase } }) => {
        // 1. Tjek at man er logget ind
        const authResult = await getAuthenticatedUser(supabase);
        if (authResult.error) {
            return fail(authResult.error.status, { error: authResult.error.message });
        }

        const projectId = params.uuid;
        const adminUserId = authResult.userId; // Dig (den der udfører handlingen)

        // 2. Hent data fra formularen
        const formData = await request.formData();
        const targetUserId = formData.get('user_id') as string; // Den der skal slettes

        if (!targetUserId) {
            return fail(400, { error: 'Missing user_id to remove' });
        }

        // 3. Tjek rettigheder: Er du Owner eller Admin?
        const { role } = await getProjectMemberRole(supabase, projectId, adminUserId);
        if (role !== 'Owner' && role !== 'Admin') {
            return fail(403, { error: 'Only Owners and Admins can remove members.' });
        }

        // Sikkerhed: Man må ikke kunne slette sig selv via denne knap (brug 'Leave' knappen i stedet)
        if (targetUserId === adminUserId) {
            return fail(400, { error: 'Use the "Leave Project" button to remove yourself.' });
        }

        // 4. Udfør sletningen ved hjælp af din funktion fra db.ts
        const { error } = await removeProjectMember(supabase, projectId, targetUserId);

        if (error) {
            console.error('Error removing member:', error);
            return fail(500, { error: 'Failed to remove member.' });
        }

        return { success: true };
    },

	deleteProject: async ({ params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;
		const userId = authResult.userId;

		// tjekker om brugeren er Owner
		const { role } = await getProjectMemberRole(supabase, projectId, userId);
		if (role !== 'Owner') {
			return fail(403, { error: 'Only the project Owner can delete the project.' });
		}

		// Slet projektet
		const { error } = await deleteProject(supabase, projectId);

		if (error) {
			console.error('Error deleting project:', error);
			return fail(500, { error: 'Failed to delete project.' });
		}

		throw redirect(303, '/project');
	},

	/** Create a new task for this project */
	createTask: async ({ request, params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;

		// Verify user is a project member
		const { role } = await getProjectMemberRole(supabase, projectId, authResult.userId);
		if (!role) {
			return fail(403, { error: 'You are not a member of this project.' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const effortHoursStr = formData.get('effort_hours') as string;
		const deadline = formData.get('deadline') as string;
		const assignedUserId = formData.get('user_id') as string | null;

		// Validation
		if (!name?.trim()) {
			return fail(400, { error: 'Task name is required.' });
		}
		if (!deadline) {
			return fail(400, { error: 'Deadline is required.' });
		}

		const effortHours = parseFloat(effortHoursStr);
		if (isNaN(effortHours) || effortHours < 0.5) {
			return fail(400, { error: 'Effort hours must be at least 0.5.' });
		}

		// If assigning to someone, verify they are a project member
		if (assignedUserId) {
			const { role: assigneeRole } = await getProjectMemberRole(
				supabase,
				projectId,
				assignedUserId
			);
			if (!assigneeRole) {
				return fail(400, { error: 'Assigned user is not a member of this project.' });
			}
		}

		const { error } = await createProjectTask(supabase, {
			project_id: projectId,
			name: name.trim(),
			effort_hours: effortHours,
			deadline,
			user_id: assignedUserId || null
		});

		if (error) {
			console.error('Error creating project task:', error);
			return fail(500, { error: `Failed to create task: ${error.message}` });
		}

		return { success: true };
	},

	/** Update a project task */
	updateTask: async ({ request, params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;

		// Verify user is a project member
		const { role } = await getProjectMemberRole(supabase, projectId, authResult.userId);
		if (!role) {
			return fail(403, { error: 'You are not a member of this project.' });
		}

		const formData = await request.formData();
		const taskId = formData.get('task_id') as string;

		if (!taskId) {
			return fail(400, { error: 'Task ID is required.' });
		}

		// Build updates object from form data
		const updates: Record<string, unknown> = {};

		const name = formData.get('name');
		if (name !== null) updates.name = (name as string).trim();

		const status = formData.get('status');
		const validStatuses = ['pending', 'todo', 'on-hold', 'working', 'completed'];
		if (status !== null) {
			if (!validStatuses.includes(status as string)) {
				return fail(400, { error: 'Invalid status value.' });
			}
			updates.status = status as string;
		}

		const effortHoursStr = formData.get('effort_hours');
		if (effortHoursStr !== null) {
			const effortHours = parseFloat(effortHoursStr as string);
			if (isNaN(effortHours) || effortHours < 0.5) {
				return fail(400, { error: 'Effort hours must be at least 0.5.' });
			}
			updates.effort_hours = effortHours;
		}

		const deadline = formData.get('deadline');
		if (deadline !== null) updates.deadline = deadline as string;

		// Handle assignee update
		const userId = formData.get('user_id');
		if (userId !== null) {
			const assigneeId = (userId as string).trim();
			updates.user_id = assigneeId === '' ? null : assigneeId;
		}

		if (Object.keys(updates).length === 0) {
			return fail(400, { error: 'No updates provided.' });
		}

		const { error } = await updateProjectTask(supabase, taskId, projectId, updates);

		if (error) {
			console.error('Error updating project task:', error);
			return fail(500, { error: 'Failed to update task.' });
		}

		return { success: true };
	},

	/** Assign a task to a project member */
	assignTask: async ({ request, params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;

		// Verify user is a project member
		const { role } = await getProjectMemberRole(supabase, projectId, authResult.userId);
		if (!role) {
			return fail(403, { error: 'You are not a member of this project.' });
		}

		const formData = await request.formData();
		const taskId = formData.get('task_id')?.toString();
		const rawAssigneeId = formData.get('user_id')?.toString();
		const assigneeId = rawAssigneeId && rawAssigneeId.trim() !== '' ? rawAssigneeId : null;

		if (!taskId) {
			return fail(400, { error: 'Task ID is required.' });
		}

		const { error } = await updateProjectTaskAssignee(
			supabase,
			taskId,
			projectId,
			assigneeId
		);

		if (error) {
			console.error('Error assigning task:', error);
			return fail(500, { error: error.message || 'Failed to assign task.' });
		}

		return { success: true };
	},

	/** Delete a project task */
	deleteTask: async ({ request, params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;

		// Verify user is a project member (optionally restrict to Owner/Admin)
		const { role } = await getProjectMemberRole(supabase, projectId, authResult.userId);
		if (!role) {
			return fail(403, { error: 'You are not a member of this project.' });
		}

		const formData = await request.formData();
		const taskId = formData.get('task_id') as string;

		if (!taskId) {
			return fail(400, { error: 'Task ID is required.' });
		}

		const { error } = await deleteProjectTask(supabase, taskId, projectId);

		if (error) {
			console.error('Error deleting project task:', error);
			return fail(500, { error: 'Failed to delete task.' });
		}

		return { success: true };
	}
};