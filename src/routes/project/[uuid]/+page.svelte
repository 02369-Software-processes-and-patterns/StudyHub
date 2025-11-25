<script lang="ts">
	import { invalidateAll } from '$app/navigation';
    import InviteMemberModal from '$lib/components/modal/InviteMemberModal.svelte';
    import ProjectMembers from '$lib/components/project/ProjectMembers.svelte';
    import type { PageData } from './$types';

	// data comes from the load function in +page.ts
    export let data: PageData;

    // reactive variables updated when data changes
    $: project = data.project;
    $: userRole = data.userRole;
    $: members = data.members || [];

    // Checks if the user has permission to invite (Owner or Admin)
    $: canInvite = userRole === 'Owner' || userRole === 'Admin';

    let showInviteModal = false;

    // Reload data when an invitation is successfully sent
    function handleInvited() {
        invalidateAll();
        showInviteModal = false;
    }
</script>

{#if !project}
    <div class="p-8 text-center text-gray-500">Project not found or error loading project.</div>
{:else}
    <div class="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <!-- Project Header -->
        <div class="mb-8 rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 sm:px-8">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h1 class="text-3xl font-bold text-white mb-2">{project.name}</h1>
                        <p class="text-indigo-100 text-lg">{project.description || 'No description provided.'}</p>
                    </div>
                    <div class="ml-4">
                        <span class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white border border-white/30 capitalize">
                            {project.status}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="px-6 py-4 sm:px-8 bg-gray-50 border-t border-gray-100">
                <div class="flex flex-wrap gap-6 text-sm">
                    <div class="flex items-center gap-2">
                        <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span class="font-semibold text-gray-700">Course:</span>
                        <span class="text-gray-900">{project.course?.name ?? 'No course assigned'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span class="font-semibold text-gray-700">Created:</span>
                        <span class="text-gray-900">{new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="font-semibold text-gray-700">Your Role:</span>
                        <span class="text-gray-900 capitalize">{userRole || 'Member'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Team Members Section with Invite Button -->
        <div class="mb-8 rounded-2xl border border-gray-100 bg-white shadow-lg overflow-hidden">
            <div class="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="rounded-lg bg-white p-2 shadow-sm">
                            <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-gray-900">Team Members</h2>
                            <p class="text-sm text-gray-500">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
                        </div>
                    </div>
                    
                    {#if canInvite}
                        <button
                            type="button"
                            on:click={() => (showInviteModal = true)}
                            class="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-600 shadow-sm border border-purple-200 hover:bg-purple-50 transition-colors"
                        >
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Invite Member
                        </button>
                    {/if}
                </div>
            </div>
            
            <div class="p-6">
                <ProjectMembers {members} />
            </div>
        </div>

        <!-- Placeholder for future sections -->
        <div class="grid gap-8 md:grid-cols-2">
            <!-- Tasks Section Placeholder -->
            <div class="rounded-2xl border border-gray-100 bg-white shadow-lg p-6">
                <div class="flex items-center gap-3 mb-4">
                    <div class="rounded-lg bg-purple-100 p-2">
                        <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h2 class="text-lg font-bold text-gray-900">Project Tasks</h2>
                </div>
                <p class="text-gray-500 text-sm">Task management coming soon...</p>
            </div>

            <!-- Activity Section Placeholder -->
            <div class="rounded-2xl border border-gray-100 bg-white shadow-lg p-6">
                <div class="flex items-center gap-3 mb-4">
                    <div class="rounded-lg bg-blue-100 p-2">
                        <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 class="text-lg font-bold text-gray-900">Recent Activity</h2>
                </div>
                <p class="text-gray-500 text-sm">Activity feed coming soon...</p>
            </div>
        </div>
    </div>
{/if}

<InviteMemberModal 
    bind:isOpen={showInviteModal}
    on:invited={handleInvited}
/>