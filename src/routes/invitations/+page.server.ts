import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return { invitations: [] };
	}

	// For nu returnerer vi tom array da vi kun fokuserer på UI
	// Når backend-logik er klar, henter vi fra database
	const invitations: any[] = [];

	return { invitations };
};
