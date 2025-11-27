import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
	const { session, user } = await safeGetSession();

	let pendingInvitationsCount = 0;

	// Hvis brugeren er logget ind, tæl antallet af ventende invitationer
	if (user) {
		const { count, error } = await supabase
			.from('project_invitations')
			.select('*', { count: 'exact', head: true }) // 'head: true' betyder vi kun henter antallet, ikke data
			.eq('invited_user_id', user.id)
			.eq('status', 'pending');

		if (!error && count !== null) {
			pendingInvitationsCount = count;
		}
	}

	return {
		session,
		user,
		pendingInvitationsCount, // Vi sender tallet med til frontend
		cookies: cookies.getAll()
	};
};
