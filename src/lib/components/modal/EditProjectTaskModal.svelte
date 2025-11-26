<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';
	import Modal from './Modal.svelte';

	type Member = {
		id: string;
		name: string;
		email: string;
		role: 'Owner' | 'Admin' | 'Member';
	};

	export let isOpen = false;
	export let task: {
		id: string | number;
		name: string;
		effort_hours?: number | null;
		deadline?: string | null;
		assignee?: Member | null;
	} | null = null;
	export let members: Member[] = [];

	const dispatch = createEventDispatcher();

	let formData = {
		name: '',
		effort_hours: 1,
		deadline: '',
		user_id: ''
	};

	let errorMessage = '';

	// When the modal opens, populate the form with the task data
	$: if (isOpen && task) {
		formData = {
			name: task.name ?? '',
			effort_hours: task.effort_hours ?? 1,
			deadline: task.deadline ? task.deadline.substring(0, 16) : '',
			user_id: task.assignee?.id ?? ''
		};
	}

	function closeModal() {
		isOpen = false;
		errorMessage = '';
		dispatch('close');
	}
</script>

<Modal bind:isOpen title="Edit Task" on:close={closeModal}>
	{#if errorMessage}
		<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
			Error: {errorMessage}
		</div>
	{/if}

	<form
		method="POST"
		action="?/updateTask"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					dispatch('taskUpdated');
					closeModal();
				} else if (result.type === 'failure') {
					type FailureData = { error?: string };
					errorMessage = (result.data as FailureData | undefined)?.error ?? 'Unknown error';
				}
				await update();
			};
		}}
		class="space-y-4"
	>
		<input type="hidden" name="task_id" value={task?.id} />

		<label class="block">
			<span class="font-medium text-gray-700">Task Name *</span>
			<input
				id="name"
				name="name"
				type="text"
				bind:value={formData.name}
				required
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
				placeholder="Enter task name"
			/>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Effort (hours) *</span>
			<input
				id="effort_hours"
				name="effort_hours"
				type="number"
				min="0.5"
				step="0.5"
				bind:value={formData.effort_hours}
				required
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
			/>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Deadline *</span>
			<input
				id="deadline"
				name="deadline"
				type="datetime-local"
				bind:value={formData.deadline}
				required
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
			/>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Assign To</span>
		<select
			id="user_id"
			name="user_id"
			bind:value={formData.user_id}
			class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
		>
				<option value="">Unassigned</option>
				{#each members as member (member.id)}
					<option value={member.id}>{member.name}</option>
				{/each}
			</select>
			<p class="mt-1 text-xs text-gray-500">Optional: Assign this task to a team member</p>
		</label>

		<div class="flex gap-3 border-t border-gray-200 pt-4">
			<button
				type="button"
				on:click={closeModal}
				class="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="flex-1 rounded-md bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700"
			>
				Save Changes
			</button>
		</div>
	</form>
</Modal>

