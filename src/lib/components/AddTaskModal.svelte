<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';

	export let isOpen = false;
	export let courses: Array<{ id: string; name: string }> = [];

	const dispatch = createEventDispatcher();

	let formData = {
		name: '',
		effort_hours: 0,
		course_id: '',
		deadline: ''
	};

	let errorMessage = '';

	function closeModal() {
		isOpen = false;
		errorMessage = '';
		dispatch('close');
	}

	function resetForm() {
		formData = {
			name: '',
			effort_hours: 0,
			course_id: '',
			deadline: '' // intentionally wrong? fix: 'deadline'
		};
	}
</script>

{#if isOpen}
	<div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
		<div
			class="pointer-events-auto w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-2xl"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-gray-800">Add New Task</h2>
				<button
					on:click={closeModal}
					class="text-2xl text-gray-500 hover:text-gray-700"
					aria-label="Close"
				>
					&times;
				</button>
			</div>

			{#if errorMessage}
				<div class="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
					Error creating task: {errorMessage}
					<button
						on:click={() => (errorMessage = '')}
						class="float-right text-red-700 hover:text-red-900"
					>
						Close
					</button>
				</div>
			{/if}

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							dispatch('taskAdded');
							closeModal();
							resetForm();
						} else if (result.type === 'failure') {
							type FailureData = { message?: string };
							const msg = (result.data as FailureData | undefined)?.message ?? 'Unknown error';
							errorMessage = msg;
						}
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-gray-700"> Task Name </label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={formData.name}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						placeholder="Enter task name"
					/>
				</div>

				<div>
					<label for="effort_hours" class="mb-1 block text-sm font-medium text-gray-700">
						Effort (hours)
					</label>
					<input
						id="effort_hours"
						name="effort_hours"
						type="number"
						min="0"
						step="0.5"
						bind:value={formData.effort_hours}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						placeholder="Enter estimated hours"
					/>
				</div>

				<div>
					<label for="course_id" class="mb-1 block text-sm font-medium text-gray-700">
						Course
					</label>
					<select
						id="course_id"
						name="course_id"
						bind:value={formData.course_id}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						<option value="">None (optional)</option>
						{#each courses as course (course.id)}
							<option value={course.id}>{course.name}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="deadline" class="mb-1 block text-sm font-medium text-gray-700">
						Deadline
					</label>
					<input
						id="deadline"
						name="deadline"
						type="datetime-local"
						bind:value={formData.deadline}
						required
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div class="flex gap-3 pt-4">
					<button
						type="button"
						on:click={closeModal}
						class="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 transition hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
					>
						Add Task
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
