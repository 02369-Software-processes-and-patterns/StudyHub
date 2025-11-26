<script lang="ts">
	import { enhance } from '$app/forms';
	
	// Henter data fra load-funktionen
	let { data } = $props();

	function formatDate(dateString: string) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getRoleColor(role: string) {
		const colors: Record<string, string> = {
			Owner: 'bg-purple-100 text-purple-700',
			Admin: 'bg-orange-100 text-orange-700',
			Member: 'bg-blue-100 text-blue-700',
			Viewer: 'bg-gray-100 text-gray-700'
		};
		return colors[role] || 'bg-gray-100 text-gray-700';
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<div class="mb-8">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">Project Invitations</h1>
			<p class="text-lg text-gray-600">Review and respond to project invitations you've received</p>
		</div>

		{#if data.invitations.length === 0}
			<div class="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
					<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">No pending invitations</h2>
				<p class="mb-6 text-gray-600">You don't have any project invitations at the moment.</p>
				<a href="/dashboard" class="inline-block rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white transition-colors hover:bg-indigo-700">
					Go to Dashboard
				</a>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.invitations as invitation (invitation.id)}
					<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md">
						<div class="flex flex-col items-start justify-between gap-6 md:flex-row">
							<div class="min-w-0 flex-1">
								<div class="mb-3 flex flex-wrap items-center gap-3">
									<h3 class="text-xl font-semibold text-gray-900">
										{invitation.project?.name || 'Unknown Project (Loading error)'}
									</h3>
									<span class="rounded-full px-3 py-1 text-sm font-medium {getRoleColor(invitation.role)}">
										{invitation.role}
									</span>
								</div>

								{#if invitation.project?.description}
									<p class="mb-4 text-sm leading-relaxed text-gray-600">
										{invitation.project.description}
									</p>
								{/if}

								<div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
									<div class="flex items-center gap-2">
										<svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
										</svg>
										<span>Invited by {invitation.inviter?.name || 'Unknown'}</span>
									</div>
									<div class="flex items-center gap-2">
										<svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
										</svg>
										<span>{formatDate(invitation.created_at)}</span>
									</div>
								</div>
							</div>

							<div class="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:flex-col">
								<form method="POST" action="?/accept" use:enhance class="w-full sm:w-auto">
									<input type="hidden" name="id" value={invitation.id} />
									<button type="submit" class="w-full rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-green-700 sm:w-auto">
										Accept
									</button>
								</form>

								<form method="POST" action="?/decline" use:enhance class="w-full sm:w-auto">
									<input type="hidden" name="id" value={invitation.id} />
									<button type="submit" class="w-full rounded-lg border-2 border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto">
										Decline
									</button>
								</form>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>