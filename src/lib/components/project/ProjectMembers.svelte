<script lang="ts">
import { enhance } from '$app/forms';
	type Member = {
		id: string;
		name: string;
		email: string;
		role: 'Owner' | 'Admin' | 'Member';
	};

	type PendingInvitation = {
		id: string;
		email: string;
		name: string;
		role: string;
		created_at: string;
	};

	type Props = {
		members?: Member[];
		pendingInvitations?: PendingInvitation[];
		currentUserId?: string;
		userRole?: 'Owner' | 'Admin' | 'Member' | null;
	};
	let { members = [], pendingInvitations = [], currentUserId = '', userRole = null }: Props = $props();
	
	// Only Owner and Admin can remove members
	let canRemoveMembers = $derived(userRole === 'Owner' || userRole === 'Admin');

	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	function getRoleBadgeClass(role: string): string {
		switch (role.toLowerCase()) {
			case 'owner':
				return 'bg-purple-100 text-purple-800 border-purple-200';
			case 'admin':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'member':
				return 'bg-green-100 text-green-800 border-green-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	function getAvatarGradient(index: number): string {
		const gradients = [
			'from-purple-500 to-pink-500',
			'from-blue-500 to-cyan-500',
			'from-green-500 to-emerald-500',
			'from-orange-500 to-red-500',
			'from-indigo-500 to-purple-500',
			'from-yellow-500 to-orange-500',
			'from-pink-500 to-rose-500',
			'from-teal-500 to-green-500'
		];
		return gradients[index % gradients.length];
	}
</script>

<!-- Active Members -->
{#if members.length > 0}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each members as member, index (member.id)}
			<div
				class="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 transition-all hover:border-purple-200 hover:shadow-md"
			>
				<!-- Role Badge -->
				<div class="absolute top-3 right-3">
					<span
						class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold {getRoleBadgeClass(
							member.role
						)}"
					>
						{member.role}
					</span>
				</div>

				<!-- Avatar and Info -->
				<div class="flex items-start gap-3">
					<!-- Avatar -->
					<div class="flex-shrink-0">
						<div
							class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br {getAvatarGradient(
								index
							)} text-lg font-bold text-white shadow-md ring-2 ring-white"
						>
							{getInitials(member.name)}
						</div>
					</div>

					<!-- Member Details -->
					<div class="min-w-0 flex-1 pt-1">
						<h3 class="mb-1 truncate font-semibold text-gray-900">
							{member.name}
						</h3>
						<p class="flex items-center gap-1 truncate text-sm text-gray-500">
							<svg
								class="h-3.5 w-3.5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							<span class="truncate">{member.email}</span>
						</p>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="mt-4 flex gap-2 border-t border-gray-100 pt-3">
					<!-- TODO: Connect Profile button to view member profile details -->
					<button
						type="button"
						class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
						title="View profile"
					>
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
						Profile
					</button>
				{#if canRemoveMembers && member.role !== 'Owner' && member.id !== currentUserId}
					<form 
						method="POST" 
						action="?/removeMember" 
						use:enhance={() => {
							return async ({ update }) => {
								await update(); // Opdaterer data på siden automatisk efter sletning
							};
						}}
						class="inline" 
					>
						<input type="hidden" name="user_id" value={member.id} />
						
						<button
							type="submit"
							class="inline-flex items-center justify-center rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
							title="Remove member"
							onclick={(e) => {
								// Bekræftelse så man ikke sletter ved en fejl
								if (!confirm(`Are you sure you want to remove ${member.name} from the project?`)) {
									e.preventDefault();
								}
							}}
						>
							<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</form>
				{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<!-- Pending Invitations -->
{#if pendingInvitations.length > 0}
	<div class="mt-6">
		<h3 class="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
			<svg class="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			Pending Invitations
		</h3>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each pendingInvitations as invitation, index (invitation.id)}
				<div
					class="group relative overflow-hidden rounded-xl border border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 transition-all hover:border-amber-400 hover:shadow-md"
				>
					<!-- Pending Badge -->
					<div class="absolute top-3 right-3">
						<span
							class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
						>
							Pending
						</span>
					</div>

					<!-- Avatar and Info -->
					<div class="flex items-start gap-3">
						<!-- Avatar with pending indicator -->
						<div class="flex-shrink-0 relative">
							<div
								class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-lg font-bold text-white shadow-md ring-2 ring-white opacity-70"
							>
								{getInitials(invitation.name)}
							</div>
							<div class="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
								<svg class="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
								</svg>
							</div>
						</div>

						<!-- Member Details -->
						<div class="min-w-0 flex-1 pt-1">
							<h3 class="mb-1 truncate font-semibold text-gray-700">
								{invitation.name}
							</h3>
							<p class="flex items-center gap-1 truncate text-sm text-gray-500">
								<svg
									class="h-3.5 w-3.5 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								<span class="truncate">{invitation.email}</span>
							</p>
							<p class="mt-1 text-xs text-amber-600">
								Will join as {invitation.role}
							</p>
						</div>
					</div>

					<!-- Action Buttons -->
					{#if canRemoveMembers}
						<div class="mt-4 flex gap-2 border-t border-amber-200 pt-3">
							<form 
								method="POST" 
								action="?/cancelInvitation" 
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
								class="flex-1" 
							>
								<input type="hidden" name="invitation_id" value={invitation.id} />
								
								<button
									type="submit"
									class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 border border-gray-200"
									title="Cancel invitation"
									onclick={(e) => {
										if (!confirm(`Are you sure you want to cancel the invitation for ${invitation.name}?`)) {
											e.preventDefault();
										}
									}}
								>
									<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
									Cancel Invitation
								</button>
							</form>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if members.length === 0 && pendingInvitations.length === 0}
	<!-- Empty State -->
	<div class="py-12 text-center">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
			<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
		</div>
		<h3 class="mb-2 text-lg font-semibold text-gray-900">No team members yet</h3>
		<p class="mb-4 text-gray-500">Start building your team by inviting members to this project</p>
	</div>
{/if}
