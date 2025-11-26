<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';
	import Modal from './Modal.svelte';

	export let isOpen = false;
	export let task: {
		id: string | number;
		name: string;
		effort_hours?: number | null;
		course_id?: string | null;
		deadline?: string | null;
	} | null = null;
	export let courses: Array<{ id: string; name: string }> = [];

	const dispatch = createEventDispatcher();

	let formData = {
		name: '',
		effort_hours: 0,
		course_id: '',
		deadline: ''
	};

	let errorMessage = '';

	// When the modal opens, populate the form with the task data
	$: if (isOpen && task) {
		formData = {
			name: task.name ?? '',
			effort_hours: task.effort_hours ?? 0,
			course_id: task.course_id ?? '',
			deadline: task.deadline ? task.deadline.substring(0, 16) : '' // for datetime-local input
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
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
				placeholder="Enter task name"
			/>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Effort (hours) *</span>
			<input
				id="effort_hours"
				name="effort_hours"
				type="number"
				min="0"
				step="0.5"
				bind:value={formData.effort_hours}
				required
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
			/>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Course</span>
		<select
			id="course_id"
			name="course_id"
			bind:value={formData.course_id}
			class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
		>
				<option value="">None (optional)</option>
				{#each courses as course (course.id)}
					<option value={course.id}>{course.name}</option>
				{/each}
			</select>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Deadline *</span>
			<input
				id="deadline"
				name="deadline"
				type="datetime-local"
				bind:value={formData.deadline}
				required
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
			/>
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
				class="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
			>
				Save Changes
			</button>
		</div>
	</form>
</Modal>
