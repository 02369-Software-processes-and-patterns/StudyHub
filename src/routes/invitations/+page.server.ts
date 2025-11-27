import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getAuthenticatedUser, getMyInvitations, acceptInvitation, declineInvitation } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const authResult = await getAuthenticatedUser(supabase);
	
	if (authResult.error) {
		return { invitations: [] };
	}

    // Hent rigtige invitationer fra DB
	const { data } = await getMyInvitations(supabase, authResult.userId);

	return { invitations: data || [] };
};

export const actions: Actions = {
	accept: async ({ request, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
        if (authResult.error) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id') as string;

		const { error } = await acceptInvitation(supabase, id, authResult.userId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	},

	decline: async ({ request, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
        if (authResult.error) return fail(401);

		const formData = await request.formData();
		const id = formData.get('id') as string;

		const { error } = await declineInvitation(supabase, id, authResult.userId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};