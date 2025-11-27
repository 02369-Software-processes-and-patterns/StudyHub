<script>
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import Topbar from '$lib/components/layout/topbar.svelte';
	import '../app.css';

	let { data, children } = $props();
	let { session, user, supabase, pendingInvitationsCount } = $derived(data);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event) => {
			// Only invalidate on meaningful auth events
			// We don't use the newSession parameter as it may be unvalidated
			// Instead, invalidation triggers a re-fetch through our secure getUser() flow
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				invalidateAll();
			}
		});

		return () => data.subscription.unsubscribe();
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<Topbar {session} {user} {pendingInvitationsCount} />
	<main class="w-full">
		{@render children()}
	</main>
</div>
