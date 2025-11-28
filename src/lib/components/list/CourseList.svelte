<script lang="ts">
	import ListCard from './ListCard.svelte';
	import EmptyState from './EmptyState.svelte';
	import DeleteConfirmationModal from '../modal/DeleteConfirmationModal.svelte';
	import { createEventDispatcher } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type { CourseForList } from '$lib/types';

	export let courses: CourseForList[] = [];
	export let maxCourses: number | null = null; // null = show all courses
	export let showViewAll: boolean = true;
	export let showStartDate: boolean = true; // Control whether to show start date column
	export let openEdit: ((course: CourseForList) => void) | null = null;

	const dispatch = createEventDispatcher<{ delete: string | number }>();

	let deleteModalOpen = false;
	let courseToDelete: CourseForList | null = null;
	let isDeletingCurrent = false;
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

	function openDeleteModal(course: CourseForList) {
		courseToDelete = course;
		deleteModalOpen = true;
		deleteError = '';
	}

	function closeDeleteModal() {
		deleteModalOpen = false;
		courseToDelete = null;
		deleteError = '';
		isDeletingCurrent = false;
	}

	async function confirmDelete() {
		if (!courseToDelete) return;

		isDeletingCurrent = true;
		deleteError = '';

		try {
			const formData = new FormData();
			formData.append('course_id', String(courseToDelete.id));

			const response = await fetch('?/deleteCourse', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const deletedId = courseToDelete.id;
				closeDeleteModal();
				dispatch('delete', deletedId);
				await invalidateAll();
			} else {
				deleteError = 'Failed to delete course. Please try again.';
			}
		} catch (err) {
			console.error('Error deleting course:', err);
			deleteError = 'An error occurred while deleting the course. Please try again.';
		} finally {
			isDeletingCurrent = false;
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
									class="inline-flex h-6 w-6 items-center justify-center rounded text-red-600 transition hover:bg-red-50 hover:text-red-700"
									title="Delete course"
									aria-label="Delete course"
								>
									<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
											clip-rule="evenodd"
										/>
									</svg>
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

<DeleteConfirmationModal
	bind:isOpen={deleteModalOpen}
	itemType="Course"
	itemName={courseToDelete?.name ?? ''}
	warningMessage="This action will also delete all tasks associated with this course. This cannot be undone."
	isDeleting={isDeletingCurrent}
	errorMessage={deleteError}
	on:confirm={confirmDelete}
	on:close={closeDeleteModal}
/>
