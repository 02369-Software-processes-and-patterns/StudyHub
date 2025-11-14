<script lang="ts">
	import { goto } from '$app/navigation';

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
	$: hasMoreCourses = maxCourses !== null && totalCourses > maxCourses;

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

<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6 md:p-8">
	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:mb-6">
		<h2 class="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">My Courses</h2>
		{#if showViewAll && hasMoreCourses}
			<button
				on:click={() => void goto('/course')}
				class="inline-flex cursor-pointer items-center border-none bg-transparent text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:text-base"
			>
				View All ({totalCourses})
				<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>

	{#if sortedCourses.length > 0}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 sm:px-4 sm:py-3 sm:text-sm">Course</th>
						<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 sm:px-4 sm:py-3 sm:text-sm">ECTS</th>
						{#if showStartDate}
							<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 sm:px-4 sm:py-3 sm:text-sm hidden md:table-cell">Start</th>
						{/if}
						<th class="px-2 py-2 text-left text-xs font-semibold text-gray-700 sm:px-4 sm:py-3 sm:text-sm">End Date</th>
					</tr>
				</thead>
				<tbody>
					{#each sortedCourses as course (course.id)}
						<tr class="border-b border-gray-100 transition-colors hover:bg-gray-50">
							<td class="px-2 py-2 sm:px-4 sm:py-3">
								<div class="text-xs font-medium text-gray-900 sm:text-sm">{course.name}</div>
							</td>
							<td class="px-2 py-2 sm:px-4 sm:py-3">
								<span
									class="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800"
								>
									{course.ects_points}
								</span>
							</td>
							{#if showStartDate}
								<td class="px-2 py-2 sm:px-4 sm:py-3 hidden md:table-cell">
									<span class="text-xs text-gray-600">{formatDate(course.start_date)}</span>
								</td>
							{/if}
							<td class="px-2 py-2 sm:px-4 sm:py-3">
								<span class="text-xs text-gray-600">{formatDate(course.end_date)}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="py-12 text-center">
			<svg
				class="mx-auto mb-4 h-16 w-16 text-gray-300"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
				/>
			</svg>
			<p class="text-lg text-gray-500">No courses yet</p>
			<p class="mt-2 text-sm text-gray-400">Add your first course to get started</p>
		</div>
	{/if}
</div>
