import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getAuthenticatedUser,
	getProject,
	getProjectMemberRole,
	getProjectMembers,
	addProjectMembers,
	removeProjectMember,
	deleteProject,
	createInvitation
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
	}
};