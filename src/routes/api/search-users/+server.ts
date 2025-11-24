import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const query = url.searchParams.get('query') || url.searchParams.get('email');

	if (!query || query.length < 2) {
		return json({ users: [] });
	}

	try {
		// Search for users in auth.users by email or name
		const { data, error } = await supabase.rpc('search_users_by_email_or_name', {
			search_query: query
		});

		if (error) {
			console.error('Error searching users:', error);
			return json({ users: [] });
		}

		return json({ users: data || [] });
	} catch (err) {
		console.error('Search users error:', err);
		return json({ users: [] });
	}
};
