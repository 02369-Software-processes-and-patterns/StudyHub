<script lang="ts">
	export let tasks: any[] = [];
	export let maxTasks: number | undefined = undefined;
	export let showViewAll: boolean = true;

	$: displayedTasks = maxTasks ? tasks.slice(0, maxTasks) : tasks;

	function getStatusClasses(status: string): string {
		switch (status?.toLowerCase()) {
			case 'in progress':
			case 'in_progress':
				return 'bg-yellow-100 text-yellow-700';
			case 'completed':
				return 'bg-green-100 text-green-700';
			case 'pending':
			case 'not started':
				return 'bg-blue-100 text-blue-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function formatStatus(status: string): string {
		if (!status) return 'Not Started';
		if (status === 'pending') return 'Not Started';
		if (status === 'in_progress') return 'In Progress';
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	function formatDeadline(deadline: string): string {
		const date = new Date(deadline);
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric' 
		});
	}
</script>

<div class="bg-white rounded-2xl shadow-lg p-8 mb-16 border border-gray-100">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-3xl font-bold text-gray-900">Upcoming Tasks</h2>
		{#if showViewAll}
			<a href="/tasks" class="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
				View All →
			</a>
		{/if}
	</div>
	<div class="space-y-3">
		{#each displayedTasks as task (task.id)}
			<div class="flex items-center gap-6 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
				<input type="checkbox" class="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500">
				<div class="flex-1 flex items-center gap-8">
					<div class="flex-1">
						<h3 class="font-semibold text-gray-900">{task.name}</h3>
					</div>
					<div class="min-w-[140px]">
						<h4 class="font-semibold text-gray-900 text-sm mb-1">Deadline</h4>
						<p class="text-sm text-gray-500">{formatDeadline(task.deadline)}</p>
					</div>
					<div class="min-w-[140px]">
						<h4 class="font-semibold text-gray-900 text-sm mb-1">Estimated time</h4>
						<p class="text-sm text-gray-500">{task.effort_hours} hours</p>
					</div>
				</div>
				<span class="px-3 py-1 {getStatusClasses(task.status)} rounded-full text-sm font-medium">
					{formatStatus(task.status)}
				</span>
			</div>
		{/each}
	</div>
</div>
