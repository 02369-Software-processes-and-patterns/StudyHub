<script lang="ts">
	const { data } = $props();

	let loadingStates: Record<string, boolean> = $state({});

	function formatDate(dateString: string) {
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

	function handleAccept(id: string) {
		loadingStates[id] = true;
		// Simulate API call
		setTimeout(() => {
			loadingStates[id] = false;
		}, 1000);
	}

	function handleDecline(id: string) {
		loadingStates[id] = true;
		// Simulate API call
		setTimeout(() => {
			loadingStates[id] = false;
		}, 1000);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-2">Project Invitations</h1>
			<p class="text-lg text-gray-600">Review and respond to project invitations you've received</p>
		</div>

		{#if data.invitations.length === 0}
			<!-- Empty State -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
				<div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
						/>
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-gray-900 mb-2">No pending invitations</h2>
				<p class="text-gray-600 mb-6">You don't have any project invitations at the moment.</p>
				<a
					href="/dashboard"
					class="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
				>
					Go to Dashboard
				</a>
			</div>
		{:else}
			<!-- Invitations List -->
			<div class="space-y-4">
				{#each data.invitations as invitation}
					<div
						class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-gray-300"
					>
						<div class="flex flex-col md:flex-row items-start justify-between gap-6">
							<!-- Left Content -->
							<div class="flex-1 min-w-0">
								<!-- Project Title and Role -->
								<div class="flex items-center gap-3 mb-3 flex-wrap">
									<h3 class="text-xl font-semibold text-gray-900">
										{invitation.project.name}
									</h3>
									<span class="px-3 py-1 text-sm font-medium rounded-full {getRoleColor(invitation.role)}">
										{invitation.role}
									</span>
								</div>

								<!-- Project Description -->
								{#if invitation.project.description}
									<p class="text-gray-600 mb-4 text-sm leading-relaxed">
										{invitation.project.description}
									</p>
								{/if}

								<!-- Metadata -->
								<div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
									<div class="flex items-center gap-2">
										<svg
											class="w-4 h-4 flex-shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
										<span>Invited by {invitation.inviter.name}</span>
									</div>
									<div class="flex items-center gap-2">
										<svg
											class="w-4 h-4 flex-shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										<span>{formatDate(invitation.created_at)}</span>
									</div>
								</div>
							</div>

							<!-- Right Actions -->
							<div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:flex-col">
								<button
									disabled={loadingStates[invitation.id]}
									onclick={() => handleAccept(invitation.id)}
									class="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap order-first sm:order-none"
								>
									{loadingStates[invitation.id] ? 'Processing...' : 'Accept'}
								</button>
								<button
									disabled={loadingStates[invitation.id]}
									onclick={() => handleDecline(invitation.id)}
									class="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
								>
									{loadingStates[invitation.id] ? 'Processing...' : 'Decline'}
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer Info -->
			<div class="mt-8 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
				<p class="text-sm text-indigo-700">
					<strong>Tip:</strong> You have {data.invitations.length}
					{data.invitations.length === 1 ? 'invitation' : 'invitations'} to review. Accept to join a project or decline if you're not interested.
				</p>
			</div>
		{/if}
	</div>
</div>
