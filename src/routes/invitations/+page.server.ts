import type { PageServerLoad } from './$types';

// Invitation type for when backend logic is implemented
interface Invitation {
	id: string;
	project: { name: string; description?: string };
	inviter: { name: string };
	role: string;
	created_at: string;
}

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return { invitations: [] as Invitation[] };
	}

	// For now we return an empty array as we're only focusing on UI
	// When backend logic is ready, we'll fetch from database
	const invitations: Invitation[] = [];

	return { invitations };
};
