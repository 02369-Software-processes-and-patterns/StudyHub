<script lang="ts">
	import ListCard from './ListCard.svelte';
	import EmptyState from './EmptyState.svelte';
	import Modal from '../modal/Modal.svelte';
	import { createEventDispatcher } from 'svelte';

	type Course = {
		id: string | number;
		name: string;
		ects_points: number;
		start_date?: string | null;
		end_date?: string | null;
	};

	export let courses: Course[] = [];
	export let maxCourses: number | null = null; // null = show all courses
	export let showViewAll: boolean = true;
	export let showStartDate: boolean = true; // Control whether to show start date column

	const dispatch = createEventDispatcher<{ delete: string | number }>();

	let isDeleting: Record<string | number, boolean> = {};
	let deleteModalOpen = false;
	let courseToDelete: Course | null = null;

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
	}

	async function confirmDelete() {
		if (!courseToDelete) return;

		isDeleting[courseToDelete.id] = true;

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
			} else {
				alert('Failed to delete course');
			}
		} catch (err) {
			console.error('Error deleting course:', err);
			alert('Error deleting course');
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
						<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3">Course</th>
						<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3">ECTS</th>
						{#if showStartDate}
							<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 hidden md:table-cell">Start</th>
						{/if}
						<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3">End Date</th>
						<th class="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 w-10"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each sortedCourses as course (course.id)}
						<tr class="transition hover:bg-gray-50">
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
								<td class="px-2 py-2 text-xs text-gray-700 sm:px-4 md:px-6 md:py-4 sm:text-sm hidden md:table-cell">
									{formatDate(course.start_date)}
								</td>
							{/if}
							<td class="px-2 py-2 text-xs text-gray-700 sm:px-4 md:px-6 md:py-4 sm:text-sm">
								{formatDate(course.end_date)}
							</td>
							<td class="px-2 py-2 text-center sm:px-4 md:px-6 md:py-4">
								<button
									type="button"
									on:click={() => openDeleteModal(course)}
									disabled={isDeleting[course.id]}
									class="inline-flex items-center justify-center w-6 h-6 rounded text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
									title="Delete course"
									aria-label="Delete course"
								>
									{#if isDeleting[course.id]}
										<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									{:else}
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
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
	<EmptyState
		title="No courses yet"
		description="Add your first course to get started"
	/>
{/if}

<Modal bind:isOpen={deleteModalOpen} title="Delete Course" maxWidth="max-w-sm" on:close={closeDeleteModal}>
	{#if courseToDelete}
		<div class="space-y-4">
			<p class="text-gray-600">
				Are you sure you want to delete <span class="font-semibold text-gray-900">"{courseToDelete.name}"</span>?
			</p>
			<p class="text-sm text-gray-500">
				This action will also delete all tasks associated with this course. This cannot be undone.
			</p>
		</div>

		<div class="flex gap-3 pt-6 border-t border-gray-200">
			<button
				type="button"
				on:click={closeDeleteModal}
				disabled={Object.values(isDeleting).some(Boolean)}
				class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={confirmDelete}
				disabled={Object.values(isDeleting).some(Boolean)}
				class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
			>
				{Object.values(isDeleting).some(Boolean) ? 'Deleting...' : 'Delete Course'}
			</button>
		</div>
	{/if}
</Modal>
