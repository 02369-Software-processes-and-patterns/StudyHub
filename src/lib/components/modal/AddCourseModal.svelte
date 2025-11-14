<script lang="ts">
	import { enhance } from '$app/forms';
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';

	const dispatch = createEventDispatcher();

	export let showModal = false;

	let name = '';
	let ects_points = '';
	let start_date = '';
	let end_date = '';
	let selectedWeekdays: number[] = [];
	let loading = false;
	let error = '';

	const weekdays = [
		{ label: 'Mon', value: 1 },
		{ label: 'Tue', value: 2 },
		{ label: 'Wed', value: 3 },
		{ label: 'Thu', value: 4 },
		{ label: 'Fri', value: 5 }
	];

	function toggleWeekday(day: number) {
		if (selectedWeekdays.includes(day)) {
			selectedWeekdays = selectedWeekdays.filter((d) => d !== day);
		} else {
			selectedWeekdays = [...selectedWeekdays, day];
		}
	}

	function closeModal() {
		showModal = false;
		name = '';
		ects_points = '';
		start_date = '';
		end_date = '';
		selectedWeekdays = [];
		error = '';
	}
</script>

<Modal bind:isOpen={showModal} title="Add New Course" on:close={closeModal}>
	{#if error}
		<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
			Error: {error}
		</div>
	{/if}

	<form 
		method="POST" 
		action="?/addCourse"
		use:enhance={() => {
			loading = true;
			return async ({ result, update }) => {
				if (result.type === 'success') {
					closeModal();
					dispatch('courseAdded');
				} else if (result.type === 'failure') {
					type FailureData = { error?: string };
					error = (result.data as FailureData | undefined)?.error || 'An error occurred';
				}
				loading = false;
				await update();
			};
		}}
		class="space-y-4"
	>

				<input type="hidden" name="lecture_weekdays" value={JSON.stringify(selectedWeekdays)} />

				<label class="block">
					<span class="text-gray-700 font-medium">Course Name *</span>
					<input 
						type="text" 
						name="name"
						bind:value={name} 
						required 
						disabled={loading}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed px-3 py-2 border"
					/>
				</label>

				<label class="block">
					<span class="text-gray-700 font-medium">ECTS Points *</span>
					<input 
						type="number" 
						name="ects_points"
						bind:value={ects_points} 
						step="0.5" 
						min="0" 
						required 
						disabled={loading}
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed px-3 py-2 border"
					/>
				</label>

				<div class="grid grid-cols-2 gap-4">
					<label class="block">
						<span class="text-gray-700 font-medium">Start Date</span>
						<input 
							type="date" 
							name="start_date"
							bind:value={start_date} 
							disabled={loading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed px-3 py-2 border"
						/>
					</label>

					<label class="block">
						<span class="text-gray-700 font-medium">End Date</span>
						<input 
							type="date" 
							name="end_date"
							bind:value={end_date} 
							disabled={loading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed px-3 py-2 border"
						/>
					</label>
				</div>

			<div>
				<p class="text-gray-700 font-medium mb-2">Lecture days</p>
				<div class="flex gap-2">
					{#each weekdays as day}
						<label class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition">
							<input
								type="checkbox"
								checked={selectedWeekdays.includes(day.value)}
								on:change={() => toggleWeekday(day.value)}
								disabled={loading}
								class="rounded text-blue-600 focus:ring-blue-500"
							/>
							<span class="text-sm">{day.label}</span>
						</label>
					{/each}
				</div>
			</div>				<div class="flex gap-3 pt-4 border-t border-gray-200">
					<button 
						type="button" 
						on:click={closeModal} 
					disabled={loading}
					class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
				>
					Cancel
				</button>
				<button 
					type="submit" 
					disabled={loading}
					class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
				>
					{loading ? 'Creating...' : 'Create Course'}
				</button>
			</div>
		</form>
</Modal>