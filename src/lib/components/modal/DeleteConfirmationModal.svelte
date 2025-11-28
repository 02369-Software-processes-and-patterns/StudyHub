<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';

	export let isOpen = false;
	export let itemType = 'Item'; // e.g., "Task", "Course"
	export let itemName = '';
	export let warningMessage = 'This action cannot be undone.';
	export let isDeleting = false;
	export let errorMessage = '';

	const dispatch = createEventDispatcher<{
		confirm: void;
		close: void;
	}>();

	function handleClose() {
		if (!isDeleting) {
			dispatch('close');
		}
	}

	function handleConfirm() {
		dispatch('confirm');
	}
</script>

<Modal bind:isOpen title="Delete {itemType}" maxWidth="max-w-sm" on:close={handleClose}>
	{#if errorMessage}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
			{errorMessage}
		</div>
	{/if}

	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to delete <span class="font-semibold text-gray-900">"{itemName}"</span>?
		</p>
		<p class="text-sm text-gray-500">{warningMessage}</p>
	</div>

	<div class="mt-4 flex gap-3 border-t border-gray-200 pt-6">
		<button
			type="button"
			on:click={handleClose}
			disabled={isDeleting}
			class="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
		>
			Cancel
		</button>
		<button
			type="button"
			on:click={handleConfirm}
			disabled={isDeleting}
			class="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isDeleting ? 'Deleting...' : `Delete ${itemType}`}
		</button>
	</div>
</Modal>
