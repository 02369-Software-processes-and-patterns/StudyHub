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
		// Using type assertion since this RPC function is defined in the database but not in the generated types
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC functions aren't typed in database.types.ts
		const { data, error } = await (supabase as any).rpc('search_users_by_email_or_name', {
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
