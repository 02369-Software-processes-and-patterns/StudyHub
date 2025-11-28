import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
	const { session, user } = await safeGetSession();

	let pendingInvitationsCount = 0;

	// If user is logged in, count pending invitations
	if (user) {
		const { count, error } = await supabase
			.from('project_invitations')
			.select('*', { count: 'exact', head: true }) // 'head: true' means we only fetch count, not data
			.eq('invited_user_id', user.id)
			.eq('status', 'pending');

		if (!error && count !== null) {
			pendingInvitationsCount = count;
		}
	}

	return {
		session,
		user,
		pendingInvitationsCount, // Send the count to frontend
		cookies: cookies.getAll()
	};
};
