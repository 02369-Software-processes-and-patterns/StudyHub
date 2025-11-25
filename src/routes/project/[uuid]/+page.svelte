<script lang="ts">
	import { invalidateAll } from '$app/navigation';
    import InviteMemberModal from '$lib/components/modal/InviteMemberModal.svelte';
    import type { PageData } from './$types';

	// data comes from the load function in +page.ts
    export let data: PageData;

    // reactive variables updated when data changes
    $: project = data.project;
    $: userRole = data.userRole;

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
    <div class="max-w-4xl mx-auto p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <div class="flex items-center gap-3 text-sm">
                    <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium capitalize">
                        {project.status}
                    </span>
                    {#if project.course}
                        <span class="text-gray-500">• {project.course.name}</span>
                    {/if}
                </div>
            </div>

            {#if canInvite}
                <button
                    on:click={() => (showInviteModal = true)}
                    class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Invite Others
                </button>
            {/if}
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <div class="text-gray-600 leading-relaxed">
                {project.description || 'No description provided.'}
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                    <span class="block text-gray-500 mb-1">Created</span>
                    <span class="font-medium text-gray-900">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                    <span class="block text-gray-500 mb-1">Your Role</span>
                    <span class="font-medium text-gray-900 capitalize">{userRole || 'Member'}</span>
                </div>
            </div>
        </div>
    </div>
{/if}

<InviteMemberModal 
    bind:isOpen={showInviteModal}
    on:invited={handleInvited}
/>