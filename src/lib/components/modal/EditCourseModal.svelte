<script lang="ts">
	import { enhance } from '$app/forms';
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';

	const dispatch = createEventDispatcher();

	export let isOpen = false;
	export let course: {
		id: string | number;
		name: string;
		ects_points: number;
		start_date?: string | null;
		end_date?: string | null;
		lecture_weekdays?: number[] | string | null;
	} | null = null;

	let loading = false;
	let error = '';

	// Form data
	let formData = {
		name: '',
		ects_points: '',
		start_date: '',
		end_date: '',
		selectedWeekdays: [] as number[]
	};

	const ectsOptions = [
		{ label: '2.5 ECTS', value: '2.5' },
		{ label: '5 ECTS', value: '5' },
		{ label: '7.5 ECTS', value: '7.5' },
		{ label: '10 ECTS', value: '10' },
		{ label: '15 ECTS', value: '15' },
		{ label: '20 ECTS', value: '20' }
	];

	const weekdays = [
		{ label: 'Mon', value: 1 },
		{ label: 'Tue', value: 2 },
		{ label: 'Wed', value: 3 },
		{ label: 'Thu', value: 4 },
		{ label: 'Fri', value: 5 }
	];

	// Populate form when modal opens
	$: if (isOpen && course) {
		let weekdaysArray: number[] = [];
		if (course.lecture_weekdays) {
			if (typeof course.lecture_weekdays === 'string') {
				try {
					weekdaysArray = JSON.parse(course.lecture_weekdays);
				} catch {
					weekdaysArray = [];
				}
			} else if (Array.isArray(course.lecture_weekdays)) {
				weekdaysArray = course.lecture_weekdays;
			}
		}

		formData = {
			name: course.name ?? '',
			ects_points: String(course.ects_points ?? ''),
			start_date: course.start_date ? course.start_date.substring(0, 10) : '',
			end_date: course.end_date ? course.end_date.substring(0, 10) : '',
			selectedWeekdays: weekdaysArray
		};
	}

	function toggleWeekday(day: number) {
		if (formData.selectedWeekdays.includes(day)) {
			formData.selectedWeekdays = formData.selectedWeekdays.filter((d) => d !== day);
		} else {
			formData.selectedWeekdays = [...formData.selectedWeekdays, day];
		}
	}

	function closeModal() {
		isOpen = false;
		error = '';
		dispatch('close');
	}
</script>

<Modal bind:isOpen title="Edit Course" on:close={closeModal}>
	{#if error}
		<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
			Error: {error}
		</div>
	{/if}

	<form
		method="POST"
		action="?/updateCourse"
		use:enhance={() => {
			loading = true;
			return async ({ result, update }) => {
				if (result.type === 'success') {
					dispatch('courseUpdated');
					closeModal();
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
		<input type="hidden" name="course_id" value={course?.id} />
		<input
			type="hidden"
			name="lecture_weekdays"
			value={JSON.stringify(formData.selectedWeekdays)}
		/>

		<label class="block">
			<span class="font-medium text-gray-700">Course Name *</span>
			<input
				type="text"
				name="name"
				bind:value={formData.name}
				required
				disabled={loading}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
			/>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">ECTS Points *</span>
			<select
				name="ects_points"
				bind:value={formData.ects_points}
				required
				disabled={loading}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
			>
				<option value="">Select ECTS</option>
				{#each ectsOptions as option (option.value)}
					<option value={option.value}>
						{option.label}
					</option>
				{/each}
			</select>
		</label>

		<div class="grid grid-cols-2 gap-4">
			<label class="block">
				<span class="font-medium text-gray-700">Start Date</span>
				<input
					type="date"
					name="start_date"
					bind:value={formData.start_date}
					disabled={loading}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</label>

			<label class="block">
				<span class="font-medium text-gray-700">End Date</span>
				<input
					type="date"
					name="end_date"
					bind:value={formData.end_date}
					disabled={loading}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
				/>
			</label>
		</div>

		<div>
			<p class="mb-2 font-medium text-gray-700">Lecture days</p>
			<div class="flex gap-2">
				{#each weekdays as day (day.value)}
					<label
						class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 transition hover:bg-gray-50"
					>
						<input
							type="checkbox"
							checked={formData.selectedWeekdays.includes(day.value)}
							on:change={() => toggleWeekday(day.value)}
							disabled={loading}
							class="rounded text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-sm">{day.label}</span>
					</label>
				{/each}
			</div>
		</div>

		<div class="flex gap-3 border-t border-gray-200 pt-4">
			<button
				type="button"
				on:click={closeModal}
				disabled={loading}
				class="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={loading}
				class="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'Saving...' : 'Save Changes'}
			</button>
		</div>
	</form>
</Modal>
