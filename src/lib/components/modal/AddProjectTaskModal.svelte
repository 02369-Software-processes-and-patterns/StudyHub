<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Modal from './Modal.svelte';

	type Member = {
		id: string;
		name: string;
		email: string;
		role: 'Owner' | 'Admin' | 'Member';
	};

	export let isOpen = false;
	export let members: Member[] = [];

	let name = '';
	let effortHours = 1;
	let deadline = '';
	let assignedTo = '';
	let isSubmitting = false;
	let errorMessage = '';

	// Set default deadline to tomorrow
	$: if (isOpen && !deadline) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		deadline = tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
	}

	function closeModal() {
		isOpen = false;
		resetForm();
	}

	function resetForm() {
		name = '';
		effortHours = 1;
		deadline = '';
		assignedTo = '';
		errorMessage = '';
	}

	function handleSubmit() {
		isSubmitting = true;
		errorMessage = '';
		return async ({ result }: { result: { type: string; data?: { error?: string }; status?: number } }) => {
			isSubmitting = false;
			console.log('Form result:', result); // Debug logging
			if (result.type === 'success') {
				closeModal();
				await invalidateAll();
			} else if (result.type === 'failure' && result.data?.error) {
				errorMessage = result.data.error;
			} else if (result.type === 'error') {
				errorMessage = 'Server error occurred. Please try again.';
			} else {
				errorMessage = `Unexpected response: ${result.type}`;
			}
		};
	}
</script>

<Modal bind:isOpen on:close={closeModal}>
	<div class="p-6">
		<div class="mb-6">
			<h2 class="text-xl font-bold text-gray-900">Add Project Task</h2>
			<p class="mt-1 text-sm text-gray-500">Create a new task for this project</p>
		</div>

		{#if errorMessage}
			<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
				{errorMessage}
			</div>
		{/if}

		<form method="POST" action="?/createTask" use:enhance={handleSubmit}>
			<!-- Task Name -->
			<div class="mb-4">
				<label for="task-name" class="block text-sm font-medium text-gray-700">
					Task Name <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					id="task-name"
					name="name"
					bind:value={name}
					required
					placeholder="Enter task name..."
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
				/>
			</div>

			<!-- Effort Hours -->
			<div class="mb-4">
				<label for="effort-hours" class="block text-sm font-medium text-gray-700">
					Estimated Hours <span class="text-red-500">*</span>
				</label>
				<input
					type="number"
					id="effort-hours"
					name="effort_hours"
					bind:value={effortHours}
					required
					min="0.5"
					step="0.5"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
				/>
			</div>

			<!-- Deadline -->
			<div class="mb-4">
				<label for="deadline" class="block text-sm font-medium text-gray-700">
					Deadline <span class="text-red-500">*</span>
				</label>
				<input
					type="datetime-local"
					id="deadline"
					name="deadline"
					bind:value={deadline}
					required
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
				/>
			</div>

			<!-- Assign To -->
			<div class="mb-6">
				<label for="assigned-to" class="block text-sm font-medium text-gray-700">
					Assign To
				</label>
				<select
					id="assigned-to"
					name="user_id"
					bind:value={assignedTo}
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
				>
					<option value="">Unassigned</option>
					{#each members as member (member.id)}
						<option value={member.id}>{member.name}</option>
					{/each}
				</select>
				<p class="mt-1 text-xs text-gray-500">Optional: Assign this task to a team member</p>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<button
					type="button"
					on:click={closeModal}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting || !name.trim() || !deadline}
					class="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isSubmitting}
						<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Creating...
					{:else}
						Create Task
					{/if}
				</button>
			</div>
		</form>
	</div>
</Modal>
