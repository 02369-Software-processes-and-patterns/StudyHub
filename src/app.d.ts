import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

// Minimal session type for our secure auth flow (validated via getUser())
type SafeSession = {
	user: User;
	expires_at: number;
};

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: SafeSession | null; user: User | null }>;
			session: SafeSession | null;
			user: User | null;
		}
		interface PageData {
			session: SafeSession | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
