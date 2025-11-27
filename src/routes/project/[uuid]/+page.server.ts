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
	deleteProject,
	createInvitation,
	createProjectTask,
	updateProjectTask,
	updateProjectTaskAssignee,
	deleteProjectTask,
	getPendingProjectInvitations,
	cancelProjectInvitation,
	transferProjectOwnership
} from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const authResult = await getAuthenticatedUser(supabase);
	if (authResult.error) {
		return { project: null, userRole: null, members: [], pendingInvitations: [], tasks: [], userId: null };
	}

	const { uuid } = params;

	// Fetch project, user role, members, pending invitations, and tasks in parallel
	const [projectResult, roleResult, membersResult, pendingResult, tasksResult] = await Promise.all([
		getProject(supabase, uuid),
		getProjectMemberRole(supabase, uuid, authResult.userId),
		getProjectMembers(supabase, uuid),
		getPendingProjectInvitations(supabase, uuid),
		getProjectTasks(supabase, uuid)
	]);

	if (projectResult.error) {
		console.error('Error loading project:', projectResult.error);
		return { project: null, userRole: null, members: [], pendingInvitations: [], tasks: [], userId: null };
	}

	if (tasksResult.error) {
		console.error('Error loading project tasks:', tasksResult.error);
	}

	return {
		project: projectResult.data,
		userRole: roleResult.role,
		members: membersResult.data ?? [],
		pendingInvitations: pendingResult.data ?? [],
		tasks: tasksResult.data ?? [],
		userId: authResult.userId
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

        // (Behold rolle-tjek koden her...)

		let invitedMembers: Array<{ email: string; role: string }> = [];
		try {
			invitedMembers = JSON.parse(invitedMembersStr);
		} catch {
			return fail(400, { error: 'Invalid data format' });
		}

        // ÆNDRING: Loop igennem og opret invitationer i stedet for direkte tilføjelse
        let successCount = 0;
        let errors = [];

        for (const member of invitedMembers) {
            const { error } = await createInvitation(
                supabase, 
                projectId, 
                authResult.userId, 
                member.email, 
                member.role
            );
            
            if (error) {
                console.error(`Failed to invite ${member.email}:`, error);
                errors.push(member.email);
            } else {
                successCount++;
            }
        }

		if (successCount === 0 && errors.length > 0) {
			return fail(400, { error: 'Failed to send invitations.' });
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

	updateProject: async ({ request, params, locals: { supabase } }) => {
        // Auth
        const auth = await getAuthenticatedUser(supabase);
        if (auth.error) return fail(auth.error.status, { error: auth.error.message });

        const projectId = params.uuid;

        // Permission
        const { role } = await getProjectMemberRole(supabase, projectId, auth.userId);
        if (!role || !['Owner', 'Admin'].includes(role)) {
            return fail(403, { error: 'Only Owners and Admins can update the project.' });
        }

        // Data
        const form = await request.formData();
        const name = (form.get('name') as string)?.trim();
        const description = (form.get('description') as string | null)?.trim() || undefined;
        const statusRaw = (form.get('status') as string | null) ?? null;
        const course_id_raw = (form.get('course_id') as string | null) ?? null;

        if (!name) return fail(400, { error: 'Name is required' });

        // Normalize status
        const norm = (s?: string | null) => {
            if (!s) return 'planning';
            if (s === 'on-hold') return 'on-hold';
            const allowed = ['planning', 'active', 'on-hold', 'completed'] as const;
            return (allowed as readonly string[]).includes(s) ? s : 'planning';
        };

        const { error } = await supabase
            .from('projects')
            .update({
                name,
                description,
                status: norm(statusRaw),
                course_id: course_id_raw || null
            })
            .eq('id', projectId);

        if (error) {
            console.error('updateProject error:', error);
            return fail(500, { error: error.message || 'Failed to update project.' });
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
		if (role !== 'Owner' && role !== 'Admin') {
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

	transferOwnership: async ({ params, request, locals: { supabase } }) => {
        const authResult = await getAuthenticatedUser(supabase);
        if (authResult.error) {
            return fail(authResult.error.status, { error: authResult.error.message });
        }

        const formData = await request.formData();
        const newOwnerId = formData.get('new_owner_id')?.toString();

        if (!newOwnerId) {
            return fail(400, { error: 'New owner ID is required' });
        }

        if (newOwnerId === authResult.userId) {
            return fail(400, { error: 'You are already the owner' });
        }

        const { error } = await transferProjectOwnership(
            supabase,
            params.uuid,
            authResult.userId,
            newOwnerId
        );

        if (error) {
            console.error('Error transferring ownership:', error);
            return fail(500, { error: error.message });
        }

        return { success: true, message: 'Ownership transferred successfully' };
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

		// Get the project to retrieve its linked course_id
		const { data: project } = await getProject(supabase, projectId);
		const courseId = project?.course_id ?? null;

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
			user_id: assignedUserId || null,
			course_id: courseId
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
	},

	/** Cancel a pending invitation */
	cancelInvitation: async ({ request, params, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const projectId = params.uuid;

		// Verify user is Owner or Admin
		const { role } = await getProjectMemberRole(supabase, projectId, authResult.userId);
		if (role !== 'Owner' && role !== 'Admin') {
			return fail(403, { error: 'Only Owners and Admins can cancel invitations.' });
		}

		const formData = await request.formData();
		const invitationId = formData.get('invitation_id') as string;

		if (!invitationId) {
			return fail(400, { error: 'Invitation ID is required.' });
		}

		const { error } = await cancelProjectInvitation(supabase, invitationId, projectId);

		if (error) {
			console.error('Error canceling invitation:', error);
			return fail(500, { error: 'Failed to cancel invitation.' });
		}

		return { success: true };
	}
};