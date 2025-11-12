<script lang="ts">
	export let courses: any[] = [];
</script>

{#if courses.length > 0}
	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Course Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						ECTS
					</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Start Date
					</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						End Date
					</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each courses as course}
					<tr class="hover:bg-gray-50 transition">
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							{course.name}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
							{course.ects_points}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{course.start_date || '-'}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{course.end_date || '-'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="bg-white rounded-lg shadow p-12 text-center">
		<div class="text-6xl mb-4">📚</div>
		<h2 class="text-2xl font-bold text-gray-900 mb-2">No courses yet</h2>
		<p class="text-gray-600">Get started by adding your first course to track your workload.</p>
	</div>
{/if}
