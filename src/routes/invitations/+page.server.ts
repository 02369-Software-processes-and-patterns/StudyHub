import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return { invitations: [] };
	}

	// // For now we return an empty array as we're only focusing on UI
	// When backend logic is ready, we'll fetch from database
	const invitations: any[] = [];

	return { invitations };
};
