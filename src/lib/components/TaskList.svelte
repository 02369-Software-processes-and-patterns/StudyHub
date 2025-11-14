<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

	type CourseRef = {
		id: string | number;
		name: string;
	};

	type Task = {
		id: string | number;
		name: string;
		status: TaskStatus;
		deadline?: string | null;
		effort_hours?: number | null;
		course?: CourseRef | null;
	};

	export let tasks: Task[] = [];
	export let maxTasks: number | null = null; // null = show all tasks
	export let showViewAll: boolean = true;

	// Sort tasks by deadline and limit if maxTasks is set
	$: sortedTasks = [...tasks]
		.sort((a, b) => {
			const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
			const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
			return dateA - dateB;
		})
		.slice(0, maxTasks ?? tasks.length);

	$: totalTasks = tasks.length;
	$: hasMoreTasks = maxTasks !== null && totalTasks > maxTasks;

	const statusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'todo', label: 'To do' },
		{ value: 'on-hold', label: 'On-hold' },
		{ value: 'working', label: 'Working' },
		{ value: 'completed', label: 'Completed' }
	] as const satisfies ReadonlyArray<{ value: TaskStatus; label: string }>;

	function fmtDeadline(value?: string | null) {
		if (!value) return '-';
		const d = new Date(value);
		try {
			return new Intl.DateTimeFormat('da-DK', {
				dateStyle: 'medium',
				timeStyle: 'short',
				timeZone: 'Europe/Copenhagen'
			}).format(d);
		} catch {
			return value;
		}
	}

	function isOverdue(deadline?: string | null): boolean {
		if (!deadline) return false;
		const now = new Date();
		const deadlineDate = new Date(deadline);
		return deadlineDate < now;
	}

	function isOverdueTask(task: Task): boolean {
		return isOverdue(task.deadline) && task.status !== 'completed';
	}

	function isCompletedTask(task: Task): boolean {
		return task.status === 'completed';
	}

	function getDeadlineClass(task: Task): string {
		if (isOverdueTask(task)) {
			return 'text-red-600 font-semibold';
		}
		if (isCompletedTask(task)) {
			return 'text-green-600 font-semibold';
		}
		return 'text-gray-500';
	}

	function getRowClass(task: Task): string {
		if (isOverdueTask(task)) {
			return 'bg-red-50';
		}
		if (isCompletedTask(task)) {
			return 'bg-green-50';
		}
		return '';
	}
</script>

{#if sortedTasks.length > 0}
	<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
		<div class="mb-4 flex flex-col gap-3 p-4 pb-0 sm:flex-row sm:items-center sm:justify-between sm:mb-6 sm:p-6">
			<h2 class="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">Upcoming Tasks</h2>
			{#if showViewAll && hasMoreTasks}
				<button
					on:click={() => void goto('/tasks')}
					class="inline-flex cursor-pointer items-center border-none bg-transparent text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:text-base"
				>
					View All ({totalTasks})
					<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			{/if}
		</div>
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Task</th
					>
					<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 hidden md:table-cell"
						>Deadline</th
					>
					<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 hidden sm:table-cell"
						>Course</th
					>
					<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Status</th
					>
					<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 hidden lg:table-cell"
						>Time</th
					>
				</tr>
			</thead>			<tbody class="divide-y divide-gray-200 bg-white">
				{#each sortedTasks as task (task.id)}
					<tr class="transition hover:bg-gray-50 {getRowClass(task)}">
						<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
							<div class="font-semibold text-gray-900 sm:text-sm">
								{#if isOverdueTask(task)}
									<span class="inline-flex items-center gap-1">
										<span class="text-red-600">⚠️</span>
										{task.name}
									</span>
								{:else if isCompletedTask(task)}
									<span class="inline-flex items-center gap-1">
										<span class="text-green-600">✓</span>
										{task.name}
									</span>
								{:else}
									{task.name}
								{/if}
							</div>
							<div class="text-xs mt-0.5 md:hidden {getDeadlineClass(task)}" title={task.deadline}>
									{fmtDeadline(task.deadline)}
							</div>
							<div class="text-xs text-gray-500 mt-0.5 sm:hidden">
								{task.course?.name ?? ''}
								{#if task.effort_hours != null}
									• {task.effort_hours}h
								{/if}
							</div>
						</td>

						<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4 sm:text-sm hidden md:table-cell {getDeadlineClass(task)}" title={task.deadline}>
								{fmtDeadline(task.deadline)}
						</td>

						<td class="px-2 py-2 text-xs text-gray-700 sm:px-4 md:px-6 md:py-4 sm:text-sm hidden sm:table-cell">
							{task.course?.name ?? '-'}
						</td>

						<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
							<form 
								method="POST" 
								action="?/updateTask" 
								use:enhance={() => {
									return async ({ update }) => {
										await update({ reset: false });
									};
								}}
							>
								<input type="hidden" name="task_id" value={task.id} />
								<select
									name="status"
									class="w-full rounded-md border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-violet-500 focus:ring-violet-500 sm:px-2 sm:text-sm"
									on:change={(e) => e.currentTarget.form?.requestSubmit()}
									aria-label="Change task status"
								>
									{#each statusOptions as opt (opt.value)}
										<option value={opt.value} selected={task.status === opt.value}>
											{opt.label}
										</option>
									{/each}
								</select>
							</form>
						</td>

						<td class="px-2 py-2 text-xs text-gray-700 sm:px-4 md:px-6 md:py-4 sm:text-sm hidden lg:table-cell">
							{task.effort_hours != null ? `${task.effort_hours} h` : '-'}
						</td>
					</tr>
				{/each}
			</tbody>
			</table>
		</div>
	</div>
{:else}
	<div class="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow">
		<div class="mb-4 text-6xl">📚</div>
		<h2 class="mb-2 text-2xl font-bold text-gray-900">No tasks yet</h2>
		<p class="text-gray-600">Get started by adding your first task to track your workload.</p>
	</div>
{/if}
