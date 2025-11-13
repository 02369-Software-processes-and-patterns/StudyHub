<script lang="ts">
	import { goto } from '$app/navigation';

	// Props
	export let tasks: Task[] = []; // Tasks fra database
	export let maxTasks: number | null = null; // null = show all tasks
	export let showViewAll: boolean = true;

	// Type definition
	type Task = {
		id: string;
		name: string;
		course: string;
		deadline: string | Date;
		effort_hours: number;
		status: 'pending' | 'in-progress' | 'completed';
	};

	// Konverter tasks til korrekt type og sorter efter deadline
	$: processedTasks = tasks.map((task) => ({
		...task,
		deadline: typeof task.deadline === 'string' ? new Date(task.deadline) : task.deadline,
		effort_hours: typeof task.effort_hours === 'number' ? task.effort_hours : 0,
		name: typeof task.name === 'string' ? task.name : '',
		course: typeof task.course === 'string' ? task.course : ''
	})) as Task[];

	// Sorter tasks efter deadline og begræns hvis maxTasks er sat
	$: sortedTasks = [...processedTasks]
		.sort((a, b) => {
			const dateA = a.deadline instanceof Date ? a.deadline : new Date(a.deadline);
			const dateB = b.deadline instanceof Date ? b.deadline : new Date(b.deadline);
			return dateA.getTime() - dateB.getTime();
		})
		.slice(0, maxTasks ?? processedTasks.length);

	$: totalTasks = processedTasks.length;
	$: hasMoreTasks = maxTasks !== null && totalTasks > maxTasks;

	function formatDate(date: Date | string): string {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		const today = new Date();
		const compareDate = new Date(dateObj);

		// Create midnight versions without mutation
		const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		const compareMidnight = new Date(
			compareDate.getFullYear(),
			compareDate.getMonth(),
			compareDate.getDate()
		);

		const diffTime = compareMidnight.getTime() - todayMidnight.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Tomorrow';
		if (diffDays < 0) return 'Overdue';
		if (diffDays <= 7) return `In ${diffDays} days`;

		return dateObj.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	// Fjernet priority badge

	function getStatusColor(status: string): string {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'in-progress':
				return 'bg-blue-100 text-blue-800';
			case 'pending':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatStatus(status: string | undefined): string {
		if (!status) return 'Unknown';
		if (status === 'in-progress') return 'In Progress';
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-3xl font-bold text-gray-900">Upcoming Tasks</h2>
		{#if showViewAll && hasMoreTasks}
			<button
				on:click={() => void goto('/tasks')}
				class="inline-flex cursor-pointer items-center border-none bg-transparent font-semibold text-indigo-600 hover:text-indigo-700"
			>
				View All ({totalTasks})
				<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>

	{#if sortedTasks.length > 0}
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Task</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Course</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Deadline</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Effort</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Status</th>
						<th class="px-4 py-4 text-left font-semibold text-gray-700">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each sortedTasks as task (task.id)}
						<tr class="border-b border-gray-100 transition-colors hover:bg-gray-50">
							<td class="px-4 py-4">
								<div class="font-medium text-gray-900">{task.name}</div>
							</td>
							<td class="px-4 py-4">
								<span class="text-gray-600">{task.course}</span>
							</td>
							<td class="px-4 py-4">
								<div class="flex items-center">
									<svg
										class="mr-2 h-4 w-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									<span class="text-gray-600">{formatDate(task.deadline)}</span>
								</div>
							</td>
							<td class="px-4 py-4">
								<span
									class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
								>
									{task.effort_hours ? `${task.effort_hours} timer` : 'Ukendt tid'}
								</span>
							</td>
							<td class="px-4 py-4">
								<span
									class="rounded-full px-3 py-1 text-xs font-semibold {getStatusColor(task.status)}"
								>
									{formatStatus(task.status)}
								</span>
							</td>
							<td class="px-4 py-4">
								<button class="font-medium text-indigo-600 hover:text-indigo-700"> View </button>
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
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
			<p class="text-lg text-gray-500">No upcoming tasks</p>
			<p class="mt-2 text-sm text-gray-400">Create a new task to get started</p>
		</div>
	{/if}
</div>
