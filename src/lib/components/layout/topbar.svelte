<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { User } from '@supabase/supabase-js';

	// Using the SafeSession type from our app.d.ts
	type SafeSession = { user: User; expires_at: number };

	interface Props {
		session: SafeSession | null;
		user: User | null;
		pendingInvitationsCount?: number;
	}

	let { session, user, pendingInvitationsCount = 0 }: Props = $props();

	// Navigation buttons data
	const navButtons = [
		{ label: 'My dashboard', href: '/dashboard' },
		{ label: 'My Tasks', href: '/tasks' },
		{ label: 'My Courses', href: '/course' },
		{ label: 'My Projects', href: '/project' }
	];

	// Get user name from authenticated user object - stored in identity_data as JSONB
	const userName = user?.identities?.[0]?.identity_data?.name?.split(' ')[0] || 'N/A';
	let mobileMenuOpen = $state(false);
	let profileMenuOpen = $state(false);

	// Funktion til at tjekke om en knap er aktiv
	const isActive = (href: string) => $page.url.pathname.startsWith(href);

	// Filtrer navigationsknapper til mobilvisning (ekskluder 'My dashboard')
	const mobileNavButtons = navButtons.filter((b) => b.href !== '/dashboard');

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

<svelte:window
	onclick={(e) => {
		// Close profile menu when clicking outside
		if (
			session &&
			profileMenuOpen &&
			e.target instanceof Element &&
			!e.target.closest('.profile-menu-container')
		) {
			profileMenuOpen = false;
		}
	}}
/>

<header class="relative w-full border-b border-gray-200 bg-white shadow-sm">
	{#if session}
		<!-- Signed In View -->
		<nav class="flex items-center justify-between px-4 py-3 md:px-8">
			<!-- Desktop Navigation - Left Side -->
			<div class="hidden items-center gap-4 md:flex">
				{#each navButtons as button (button.href)}
					{#if button.href === '/dashboard'}
						<a
							href={button.href}
							class="inline-flex items-center justify-center rounded-md border px-3 py-2 font-medium transition-all"
							class:bg-indigo-600={isActive(button.href)}
							class:text-white={isActive(button.href)}
							class:border-indigo-600={isActive(button.href)}
							class:bg-gray-100={!isActive(button.href)}
							class:text-gray-700={!isActive(button.href)}
							class:border-transparent={!isActive(button.href)}
							aria-current={isActive(button.href) ? 'page' : undefined}
							aria-label="Home"
							title="Home"
						>
							<!-- Lave 'home' ikon-->
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 11.25L12 3l9 8.25M5.25 9.75V21h5.25v-5.25h3V21H18.75V9.75"
								/>
							</svg>
							<span class="sr-only">My dashboard</span>
						</a>
					{:else}
						<a
							href={button.href}
							class="rounded-md border px-4 py-2 font-medium transition-all"
							class:bg-indigo-600={isActive(button.href)}
							class:text-white={isActive(button.href)}
							class:border-indigo-600={isActive(button.href)}
							class:bg-gray-100={!isActive(button.href)}
							class:text-gray-700={!isActive(button.href)}
							class:border-transparent={!isActive(button.href)}
							aria-current={isActive(button.href) ? 'page' : undefined}
						>
							{button.label}
						</a>
					{/if}
				{/each}
			</div>
			<!-- Mobile: burger + home-ikon -->
			<div class="flex items-center gap-2 md:hidden">
				<button
					class="flex h-10 w-10 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100"
					onclick={toggleMenu}
					aria-label="Toggle menu"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if mobileMenuOpen}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						{/if}
					</svg>
				</button>

				<!-- Home-ikon (dashboard) -->
				<a
					href="/dashboard"
					class="flex h-10 w-10 items-center justify-center rounded-md border transition-all"
					class:bg-indigo-600={isActive('/dashboard')}
					class:text-white={isActive('/dashboard')}
					class:border-indigo-600={isActive('/dashboard')}
					class:bg-gray-100={!isActive('/dashboard')}
					class:text-gray-700={!isActive('/dashboard')}
					class:border-transparent={!isActive('/dashboard')}
					aria-label="Home"
					title="Home"
				>
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 11.25L12 3l9 8.25M5.25 9.75V21h5.25v-5.25h3V21H18.75V9.75"
						/>
					</svg>
				</a>
			</div>

			<!-- Right Side - User Profile (always visible) -->
			<div class="profile-menu-container relative ml-auto flex items-center gap-3 md:ml-0">
				<span class="font-medium text-gray-700">Hey {userName}!</span>

				<!-- Profile Picture with Notification Badge -->
				<div class="relative">
					<button
						onclick={toggleProfileMenu}
						class="h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-gray-200 transition-colors hover:border-indigo-600"
					>
						<img
							src="https://ui-avatars.com/api/?name={userName}&background=4f46e5&color=fff&size=40"
							alt="{userName}'s profile"
							class="h-full w-full object-cover"
						/>
					</button>

					<!-- Notification Badge -->
					{#if pendingInvitationsCount > 0}
						<a
							href="/invitations"
							class="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md ring-2 ring-white transition-colors hover:bg-red-600"
							title="{pendingInvitationsCount} pending {pendingInvitationsCount === 1
								? 'invitation'
								: 'invitations'}"
						>
							{pendingInvitationsCount > 9 ? '9+' : pendingInvitationsCount}
						</a>
					{/if}
				</div>

				<!-- Profile Dropdown Menu -->
				{#if profileMenuOpen}
					<div
						class="absolute top-full right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
					>
						<a
							href="/invitations"
							class="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 transition-colors hover:bg-gray-100"
							onclick={() => (profileMenuOpen = false)}
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
								/>
							</svg>
							<div class="flex flex-1 items-center justify-between">
								<span>Invitations</span>
								{#if pendingInvitationsCount > 0}
									<span
										class="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
									>
										{pendingInvitationsCount > 9 ? '9+' : pendingInvitationsCount}
									</span>
								{/if}
							</div>
						</a>
						<hr class="my-1 border-gray-200" />
						<button
							onclick={signOut}
							class="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 transition-colors hover:bg-gray-100"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							Sign Out
						</button>
					</div>
				{/if}
			</div>
		</nav>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div
				class="absolute top-full right-0 left-0 z-40 border-t border-gray-200 bg-white shadow-lg md:hidden"
			>
				<div class="flex flex-col gap-2 px-4 py-2">
					{#each mobileNavButtons as button (button.href)}
						<a
							href={button.href}
							class="rounded-md border px-4 py-2 font-medium transition-all"
							class:bg-indigo-600={isActive(button.href)}
							class:text-white={isActive(button.href)}
							class:border-indigo-600={isActive(button.href)}
							class:bg-gray-100={!isActive(button.href)}
							class:text-gray-700={!isActive(button.href)}
							class:border-transparent={!isActive(button.href)}
							onclick={() => (mobileMenuOpen = false)}
							aria-current={isActive(button.href) ? 'page' : undefined}
						>
							{button.label}
						</a>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<!-- Signed Out View - left aligned StudyHub -->
		<nav class="flex items-center justify-start px-4 py-3 md:px-8">
			<h1
				class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl"
			>
				StudyHub
			</h1>
		</nav>
	{/if}
</header>
