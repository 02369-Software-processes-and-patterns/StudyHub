import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getAuthenticatedUser,
	getProject,
	getProjectMemberRole,
	getProjectMembers,
	addProjectMembers,
	removeProjectMember,
	deleteProject
} from '$lib/server/db';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const authResult = await getAuthenticatedUser(supabase);
	if (authResult.error) {
		return { project: null, userRole: null, members: [] };
	}

	const { uuid } = params;

	// Fetch project, user role, and members in parallel
	const [projectResult, roleResult, membersResult] = await Promise.all([
		getProject(supabase, uuid),
		getProjectMemberRole(supabase, uuid, authResult.userId),
		getProjectMembers(supabase, uuid)
	]);

	if (projectResult.error) {
		console.error('Error loading project:', projectResult.error);
		return { project: null, userRole: null, members: [] };
	}

	return {
		project: projectResult.data,
		userRole: roleResult.role,
		members: membersResult.data ?? []
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
};