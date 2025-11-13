<script lang="ts">
	type Course = {
		id: string | number;
		name: string;
		ects_points: number;
		start_date?: string | null;
		end_date?: string | null;
	};

	export let courses: Course[] = [];
</script>

{#if courses.length > 0}
	<div class="overflow-hidden rounded-lg bg-white shadow">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Course Name
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						ECTS
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Start Date
					</th>
					<th
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						End Date
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each courses as course (course.id)}
					<tr class="transition hover:bg-gray-50">
						<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
							{course.name}
						</td>
						<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-blue-600">
							{course.ects_points}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{course.start_date || '-'}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{course.end_date || '-'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="rounded-lg bg-white p-12 text-center shadow">
		<div class="mb-4 text-6xl">📚</div>
		<h2 class="mb-2 text-2xl font-bold text-gray-900">No courses yet</h2>
		<p class="text-gray-600">Get started by adding your first course to track your workload.</p>
	</div>
{/if}
