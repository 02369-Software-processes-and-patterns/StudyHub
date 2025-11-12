<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { enhance } from '$app/forms';

	export let showModal = false;

	const dispatch = createEventDispatcher();

	let name = '';
	let ects_points = '';
	let start_date = '';
	let end_date = '';
	let selectedWeekdays: number[] = [];
	let loading = false;
	let error = '';

	const weekdays = [
		{ label: 'Man', value: 1 },
		{ label: 'Tir', value: 2 },
		{ label: 'Ons', value: 3 },
		{ label: 'Tor', value: 4 },
		{ label: 'Fre', value: 5 }
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

{#if showModal}
	<div 
		class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
	>
		<div 
			role="dialog"
			class="bg-white rounded-lg shadow-2xl max-w-md w-96 border border-gray-200"
		>
			<div class="flex items-center justify-between p-6 border-b border-gray-200">
				<h2 class="text-2xl font-bold text-gray-900">Tilføj Nyt Kursus</h2>
				<button 
					on:click={closeModal}
					class="text-gray-400 hover:text-gray-600 text-3xl leading-none"
				>
					&times;
				</button>
			</div>

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
							error = result.data?.error || 'Der opstod en fejl';
						}
						loading = false;
						await update();
					};
				}}
				class="p-6 space-y-4"
			>
				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						Fejl: {error}
					</div>
				{/if}

				<input type="hidden" name="lecture_weekdays" value={JSON.stringify(selectedWeekdays)} />

				<label class="block">
					<span class="text-gray-700 font-medium">Kursusnavn *</span>
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
					<span class="text-gray-700 font-medium">ECTS Point *</span>
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
						<span class="text-gray-700 font-medium">Startdato</span>
						<input 
							type="date" 
							name="start_date"
							bind:value={start_date} 
							disabled={loading}
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed px-3 py-2 border"
						/>
					</label>

					<label class="block">
						<span class="text-gray-700 font-medium">Slutdato</span>
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
					<p class="text-gray-700 font-medium mb-2">Forelæsningsdage</p>
					<div class="flex flex-wrap gap-2">
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
				</div>

				<div class="flex gap-3 pt-4 border-t border-gray-200">
					<button 
						type="button" 
						on:click={closeModal} 
						disabled={loading}
						class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
					>
						Annuller
					</button>
					<button 
						type="submit" 
						disabled={loading}
						class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
					>
						{loading ? 'Opretter...' : 'Opret Kursus'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
