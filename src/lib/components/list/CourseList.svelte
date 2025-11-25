<script lang="ts">
	import ListCard from './ListCard.svelte';
	import EmptyState from './EmptyState.svelte';
	import Modal from '../modal/Modal.svelte';
	import { createEventDispatcher } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	type Course = {
		id: string | number;
		name: string;
		ects_points: number;
		start_date?: string | null;
		end_date?: string | null;
		lecture_weekdays?: number[] | string | null;
	};

	export let courses: Course[] = [];
	export let maxCourses: number | null = null; // null = show all courses
	export let showViewAll: boolean = true;
	export let showStartDate: boolean = true; // Control whether to show start date column
	export let openEdit: ((course: Course) => void) | null = null;

	const dispatch = createEventDispatcher<{ delete: string | number }>();

	let isDeleting: Record<string | number, boolean> = {};
	let deleteModalOpen = false;
	let courseToDelete: Course | null = null;
	let deleteError = '';

	// Sort courses by name and limit if maxCourses is set
	$: sortedCourses = [...courses]
		.sort((a, b) => a.name.localeCompare(b.name))
		.slice(0, maxCourses ?? courses.length);

	$: totalCourses = courses.length;

	function formatDate(date: string | null | undefined): string {
		if (!date) return '-';
		const dateObj = new Date(date);
		return dateObj.toLocaleDateString('en-US', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function openDeleteModal(course: Course) {
		courseToDelete = course;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		deleteModalOpen = false;
		courseToDelete = null;
		deleteError = '';
	}

	async function confirmDelete() {
		if (!courseToDelete) return;

		isDeleting[courseToDelete.id] = true;
		deleteError = '';

		try {
			const formData = new FormData();
			formData.append('course_id', String(courseToDelete.id));

			const response = await fetch('?/deleteCourse', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				closeDeleteModal();
				dispatch('delete', courseToDelete.id);
				// Refresh the page data
				await invalidateAll();
			} else {
				deleteError = 'Failed to delete course. Please try again.';
			}
		} catch (err) {
			console.error('Error deleting course:', err);
			deleteError = 'An error occurred while deleting the course. Please try again.';
		} finally {
			if (courseToDelete) {
				isDeleting[courseToDelete.id] = false;
			}
		}
	}
</script>

{#if sortedCourses.length > 0}
	<ListCard
		title="My Courses"
		totalCount={totalCourses}
		displayCount={sortedCourses.length}
		{showViewAll}
		viewAllUrl="/course"
	>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
							>Course</th
						>
						<th
							class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
							>ECTS</th
						>
						{#if showStartDate}
							<th
								class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:table-cell md:px-6 md:py-3"
								>Start</th
							>
						{/if}
						<th
							class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
							>End Date</th
						>
						<th
							class="w-10 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each sortedCourses as course (course.id)}
						<tr
							class="transition hover:bg-gray-50 {openEdit ? 'cursor-pointer' : ''}"
							on:click={(e) => {
								if (!openEdit) return;
								// Don't open edit if clicking on interactive elements
								const target = e.target as HTMLElement;
								if (target.closest('button')) return;
								openEdit(course);
							}}
						>
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<div class="font-semibold text-gray-900 sm:text-sm">{course.name}</div>
							</td>
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<span
									class="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800"
								>
									{course.ects_points}
								</span>
							</td>
							{#if showStartDate}
								<td
									class="hidden px-2 py-2 text-xs text-gray-700 sm:px-4 sm:text-sm md:table-cell md:px-6 md:py-4"
								>
									{formatDate(course.start_date)}
								</td>
							{/if}
							<td class="px-2 py-2 text-xs text-gray-700 sm:px-4 sm:text-sm md:px-6 md:py-4">
								{formatDate(course.end_date)}
							</td>
							<td class="px-2 py-2 text-center sm:px-4 md:px-6 md:py-4">
								<button
									type="button"
									on:click={() => openDeleteModal(course)}
									disabled={isDeleting[course.id]}
									class="inline-flex h-6 w-6 items-center justify-center rounded text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
									title="Delete course"
									aria-label="Delete course"
								>
									{#if isDeleting[course.id]}
										<svg
											class="h-4 w-4 animate-spin"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									{:else}
										<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									{/if}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</ListCard>
{:else}
	<EmptyState title="No courses yet" description="Add your first course to get started" />
{/if}

<Modal
	bind:isOpen={deleteModalOpen}
	title="Delete Course"
	maxWidth="max-w-sm"
	on:close={closeDeleteModal}
>
	{#if courseToDelete}
		{#if deleteError}
			<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
				{deleteError}
			</div>
		{/if}

		<div class="space-y-4">
			<p class="text-gray-600">
				Are you sure you want to delete <span class="font-semibold text-gray-900"
					>"{courseToDelete.name}"</span
				>?
			</p>
			<p class="text-sm text-gray-500">
				This action will also delete all tasks associated with this course. This cannot be undone.
			</p>
		</div>

		<div class="flex gap-3 border-t border-gray-200 pt-6">
			<button
				type="button"
				on:click={closeDeleteModal}
				disabled={Object.values(isDeleting).some(Boolean)}
				class="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={confirmDelete}
				disabled={Object.values(isDeleting).some(Boolean)}
				class="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{Object.values(isDeleting).some(Boolean) ? 'Deleting...' : 'Delete Course'}
			</button>
		</div>
	{/if}
</Modal>
