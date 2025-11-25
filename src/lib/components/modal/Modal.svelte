<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	export let title = '';
	export let maxWidth = 'max-w-md';

	const dispatch = createEventDispatcher();

	function close() {
		isOpen = false;
		dispatch('close');
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			close();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		on:click={handleBackdropClick}
		role="presentation"
	>
		<div
			class="w-full {maxWidth} rounded-lg border border-gray-200 bg-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<div class="flex items-center justify-between border-b border-gray-200 p-6">
				<h2 id="modal-title" class="text-2xl font-bold text-gray-900">
					{title}
				</h2>
				<button
					on:click={close}
					class="text-3xl leading-none text-gray-400 hover:text-gray-600"
					aria-label="Close modal"
				>
					&times;
				</button>
			</div>

			<div class="p-6">
				<slot />
			</div>
		</div>
	</div>
{/if}
