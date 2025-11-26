<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Modal from './Modal.svelte';
    import type { ProjectMember } from '$lib/server/db';

    export let isOpen = false;
    export let members: ProjectMember[] = [];
    export let currentUserId: string = '';

    const dispatch = createEventDispatcher();

    let selectedMemberId = '';
    let confirmationText = '';
    let isSubmitting = false;

    $: eligibleMembers = members.filter((m) => m.id !== currentUserId && m.role !== 'Owner');
    $: selectedMember = eligibleMembers.find((m) => m.id === selectedMemberId);
    $: canTransfer = selectedMemberId && confirmationText.toLowerCase() === 'transfer ownership';

    function handleClose() {
        if (!isSubmitting) {
            selectedMemberId = '';
            confirmationText = '';
            isOpen = false;
        }
    }

    async function handleSubmit(event: Event) {
        event.preventDefault();
        if (!canTransfer || isSubmitting) return;

        isSubmitting = true;
        const form = event.target as HTMLFormElement;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form)
            });

            const result = await response.json();

            if (response.ok) {
                dispatch('transferred', { newOwnerId: selectedMemberId });
                handleClose();
            } else {
                alert(result.error || 'Failed to transfer ownership');
            }
        } catch (error) {
            console.error('Transfer error:', error);
            alert('An error occurred while transferring ownership');
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Modal {isOpen} title="Transfer Project Ownership" onClose={handleClose}>
    <form method="POST" action="?/transferOwnership" on:submit={handleSubmit} class="space-y-6">
        <div
            class="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 text-sm text-orange-800"
            role="alert"
        >
            <div class="mb-2 flex items-center gap-2 font-semibold">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
                <span>Warning: This action is permanent</span>
            </div>
            <p>
                Transferring ownership will make you an Admin and grant full ownership rights to the
                selected member. You will not be able to undo this action.
            </p>
        </div>

        <div class="space-y-2">
            <label for="new-owner" class="block text-sm font-semibold text-gray-700">
                Select New Owner
            </label>
            <select
                id="new-owner"
                name="new_owner_id"
                bind:value={selectedMemberId}
                required
                disabled={isSubmitting}
                class="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
                <option value="">Choose a member...</option>
                {#each eligibleMembers as member}
                    <option value={member.id}>
                        {member.name} ({member.email}) - {member.role}
                    </option>
                {/each}
            </select>
        </div>

        {#if selectedMember}
            <div class="rounded-lg bg-purple-50 p-4 text-sm">
                <p class="font-semibold text-purple-900">Selected member:</p>
                <p class="mt-1 text-purple-700">
                    {selectedMember.name} will become the new owner of this project.
                </p>
            </div>
        {/if}

        <div class="space-y-2">
            <label for="confirmation" class="block text-sm font-semibold text-gray-700">
                Type "Transfer Ownership" to confirm
            </label>
            <input
                id="confirmation"
                type="text"
                bind:value={confirmationText}
                required
                disabled={isSubmitting}
                placeholder="Transfer Ownership"
                class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
        </div>

        <div class="flex gap-3 pt-4">
            <button
                type="button"
                on:click={handleClose}
                disabled={isSubmitting}
                class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={!canTransfer || isSubmitting}
                class="flex-1 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isSubmitting ? 'Transferring...' : 'Transfer Ownership'}
            </button>
        </div>
    </form>
</Modal>