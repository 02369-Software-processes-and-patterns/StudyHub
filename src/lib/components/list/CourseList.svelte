<script lang="ts">
	import ListCard from './ListCard.svelte';
	import EmptyState from './EmptyState.svelte';

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
