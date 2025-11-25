import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
    getAuthenticatedUser,
    getProject,
    getProjectMemberRole,
    getProjectMembers,
    addProjectMembers
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
            if ((error as any).code === '23505') {
                return fail(400, { error: 'One or more users are already in this project.' });
            }
            console.error('Error inviting members:', error);
            return fail(500, { error: error.message || 'Failed to invite members.' });
        }

        if (added === 0) {
            return fail(404, { error: 'No users found with these emails' });
        }

        return { success: true };
    }
};