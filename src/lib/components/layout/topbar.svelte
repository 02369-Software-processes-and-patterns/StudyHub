<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Session, User } from '@supabase/supabase-js';
	
	interface Props {
		session: Session | null;
		user: User | null;
	}
	
	let { session, user }: Props = $props();
	
	// Navigation buttons data
	const navButtons = [
		{ label: 'My dashboard', href: '/dashboard' },
		{ label: 'My Workload', href: '/workload' },
		{ label: 'My tasks', href: '/tasks' },
		{ label: 'My courses', href: '/course' }
	];

    // Get user name from authenticated user object - stored in identity_data as JSONB
	const userName = user?.identities?.[0]?.identity_data?.name?.split(' ')[0]
		|| "N/A";
	let mobileMenuOpen = $state(false);
	let profileMenuOpen = $state(false);

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function toggleProfileMenu() {
		profileMenuOpen = !profileMenuOpen;
	}
	
	async function signOut() {
		const supabase = $page.data.supabase;
		await supabase.auth.signOut();
		await invalidateAll();
		window.location.href = '/';
	}
</script>

<svelte:window onclick={(e) => {
	// Close profile menu when clicking outside
	if (session && profileMenuOpen && e.target instanceof Element && !e.target.closest('.profile-menu-container')) {
		profileMenuOpen = false;
	}
}} />

<header class="w-full bg-white border-b border-gray-200 shadow-sm relative">
	{#if session}
		<!-- Signed In View -->
		<nav class="flex justify-between items-center px-4 md:px-8 py-3">
			<!-- Desktop Navigation - Left Side -->
			<div class="hidden md:flex gap-4 items-center">
				{#each navButtons as button}
					<a 
						href={button.href} 
						class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium transition-all border border-transparent hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
					>
						{button.label}
					</a>
				{/each}
			</div>

			<!-- Mobile Menu Button -->
			<button 
				class="md:hidden flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
				onclick={toggleMenu}
				aria-label="Toggle menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>

			<!-- Right Side - User Profile (always visible) -->
			<div class="flex items-center gap-3 ml-auto md:ml-0 profile-menu-container relative">
				<span class="font-medium text-gray-700">Hey {userName}!</span>
				<button 
					onclick={toggleProfileMenu}
					class="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 hover:border-indigo-600 transition-colors cursor-pointer"
				>
					<img 
						src="https://ui-avatars.com/api/?name={userName}&background=4f46e5&color=fff&size=40" 
						alt="{userName}'s profile"
						class="w-full h-full object-cover"
					/>
				</button>
				
				<!-- Profile Dropdown Menu -->
				{#if profileMenuOpen}
					<div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
						<button
							onclick={signOut}
							class="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							Sign Out
						</button>
					</div>
				{/if}
			</div>
		</nav>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="absolute left-0 right-0 top-full md:hidden border-t border-gray-200 bg-white shadow-lg z-40">
				<div class="flex flex-col py-2 px-4 gap-2">
					{#each navButtons as button}
						<a 
							href={button.href} 
							class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium transition-all border border-transparent hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
							onclick={() => mobileMenuOpen = false}
						>
							{button.label}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<!-- Signed Out View - left aligned StudyHub -->
		<nav class="flex justify-start items-center px-4 md:px-8 py-3">
			<h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
				StudyHub
			</h1>
		</nav>
	{/if}
</header>
