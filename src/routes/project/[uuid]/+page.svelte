<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import InviteMemberModal from '$lib/components/modal/InviteMemberModal.svelte';
	import ProjectMembers from '$lib/components/project/ProjectMembers.svelte';
	import EditProjectModal from '$lib/components/modal/EditProjectModal.svelte';
	import type { PageData } from './$types';

	// data comes from the load function in +page.ts
	export let data: PageData;

	let project: PageData['project'] = data.project;
    let userRole: PageData['userRole'] = data.userRole;
    let members: NonNullable<PageData['members']> = data.members || [];
	
	// reactive variables updated when data changes
	$: project = data.project;
	$: userRole = data.userRole;
	$: members = data.members || [];

	// Checks if the user has permission to invite (Owner or Admin)
	$: canInvite = userRole === 'Owner' || userRole === 'Admin';

	// Checks if the user has permission to edit the project (Owner or Admin)
	$: canEdit = userRole === 'Owner' || userRole === 'Admin';

	let showInviteModal = false;
	let showEditProjectModal = false;

	// Reload data when an invitation is successfully sent
	function handleInvited() {
		invalidateAll();
		showInviteModal = false;
	}
	function handleProjectUpdated() {
        invalidateAll();
		showEditProjectModal = false;
    }
</script>

{#if !project}
	<div class="p-8 text-center text-gray-500">Project not found or error loading project.</div>
{:else}
	<div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
			<div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 sm:px-8">
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<h1 class="mb-2 text-3xl font-bold text-white">{project.name}</h1>
						<p class="text-lg text-indigo-100">
							{project.description || 'No description provided.'}
						</p>
					</div>
					<div class="ml-4">
						<span
							class="inline-flex items-center rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold text-white capitalize backdrop-blur-sm"
						>
							{project.status}
						</span>
					</div>
				</div>
			</div>

			<div class="border-t border-gray-100 bg-gray-50 px-6 py-4 sm:px-8">
				<div class="flex flex-wrap gap-6 text-sm">
					<div class="flex items-center gap-2">
						<svg
							class="h-5 w-5 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
						<span class="font-semibold text-gray-700">Course:</span>
						<span class="text-gray-900">{project.course?.name ?? 'No course assigned'}</span>
					</div>
					<div class="flex items-center gap-2">
						<svg
							class="h-5 w-5 text-purple-600"
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
						<span class="font-semibold text-gray-700">Created:</span>
						<span class="text-gray-900"
							>{new Date(project.created_at).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}</span
						>
					</div>
					<div class="flex items-center gap-2">
						<svg
							class="h-5 w-5 text-purple-600"
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
						<span class="font-semibold text-gray-700">Your Role:</span>
						<span class="text-gray-900 capitalize">{userRole || 'Member'}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
			<div class="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-white p-2 shadow-sm">
							<svg
								class="h-5 w-5 text-purple-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-lg font-bold text-gray-900">Team Members</h2>
							<p class="text-sm text-gray-500">
								{members.length}
								{members.length === 1 ? 'member' : 'members'}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						{#if userRole !== 'Owner'}
							<form
								method="POST"
								action="?/leaveProject"
								on:submit|preventDefault={(e) => {
									if (confirm('Are you sure you want to leave this project?')) {
										e.currentTarget.submit();
									}
								}}
							>
								<button
									type="submit"
									class="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50"
									title="Leave Project"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
										/>
									</svg>
									Leave
								</button>
							</form>
						{:else}
							<form
								method="POST"
								action="?/deleteProject"
								on:submit|preventDefault={(e) => {
									if (
										confirm(
											'DANGER: Are you sure you want to delete this entire project? This action cannot be undone and will remove all tasks and members.'
										)
									) {
										e.currentTarget.submit();
									}
								}}
							>
								<button
									type="submit"
									class="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100 hover:border-red-300"
									title="Delete Project Permanently"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
									Delete Project
								</button>
							</form>
						{/if}
                        {#if canEdit}
                            <button
                                type="button"
                                on:click={() => (showEditProjectModal = true)}
                                class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                            >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M4 13.5V19h5.5l9.621-9.621a1.5 1.5 0 00-2.121-2.121L4 13.5z" />
                                </svg>
                                Edit Project
                            </button>
                        {/if}

						{#if canInvite}
							<button
								type="button"
								on:click={() => (showInviteModal = true)}
								class="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-600 shadow-sm transition-colors hover:bg-purple-50"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Invite Member
							</button>
						{/if}
					</div>
				</div>
			</div>

			<div class="p-6">
				<ProjectMembers {members} />
			</div>
		</div>

		<div class="grid gap-8 md:grid-cols-2">
			<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-lg bg-purple-100 p-2">
						<svg
							class="h-5 w-5 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
					</div>
					<h2 class="text-lg font-bold text-gray-900">Project Tasks</h2>
				</div>
				<p class="text-sm text-gray-500">Task management coming soon...</p>
			</div>

			<div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-lg bg-blue-100 p-2">
						<svg
							class="h-5 w-5 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<h2 class="text-lg font-bold text-gray-900">Recent Activity</h2>
				</div>
				<p class="text-sm text-gray-500">Activity feed coming soon...</p>
			</div>
		</div>
	</div>
{/if}

<InviteMemberModal bind:isOpen={showInviteModal} on:invited={handleInvited} />
<EditProjectModal bind:isOpen={showEditProjectModal} {project} on:projectUpdated={handleProjectUpdated} />
