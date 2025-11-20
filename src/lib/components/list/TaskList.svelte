<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ListCard from './ListCard.svelte';
	import EmptyState from './EmptyState.svelte';

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
	export let openEdit: (task: Task) => void;

	let selectedTaskIds: Set<string | number> = new Set();
	let isSubmittingBatch = false;

	function toggleTaskSelection(taskId: string | number) {
		if (selectedTaskIds.has(taskId)) {
			selectedTaskIds.delete(taskId);
		} else {
			selectedTaskIds.add(taskId);
		}
		selectedTaskIds = selectedTaskIds; // trigger reactivity
	}

	function toggleSelectAll() {
		if (selectedTaskIds.size === sortedTasks.length) {
			selectedTaskIds.clear();
		} else {
			sortedTasks.forEach(task => selectedTaskIds.add(task.id));
		}
		selectedTaskIds = selectedTaskIds; // trigger reactivity
	}

	async function markSelectedAsCompleted() {
		if (selectedTaskIds.size === 0) return;
		isSubmittingBatch = true;
		
		try {
			const formData = new FormData();
			Array.from(selectedTaskIds).forEach(id => {
				formData.append('task_ids', String(id));
			});

			const response = await fetch('?/updateTasksBatch', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				selectedTaskIds.clear();
				selectedTaskIds = selectedTaskIds;
				await invalidateAll();
			}
		} catch (err) {
			console.error('Error marking tasks as completed:', err);
		} finally {
			isSubmittingBatch = false;
		}
	}  

	// Sort tasks by deadline and limit if maxTasks is set
	$: sortedTasks = [...tasks]
		.sort((a, b) => {
			const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
			const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
			return dateA - dateB;
		})
		.slice(0, maxTasks ?? tasks.length);

	$: totalTasks = tasks.length;

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

	function isWorkingTask(task: Task): boolean {
		return task.status === 'working';
	}

	function getDeadlineClass(task: Task): string {
		if (isOverdueTask(task) && isWorkingTask(task)) {
			return 'text-orange-600 font-semibold';
		}
		if (isOverdueTask(task)) {
			return 'text-red-600 font-semibold';
		}
		if (isCompletedTask(task)) {
			return 'text-green-600 font-semibold';
		}
		if (isWorkingTask(task)) {
			return 'text-yellow-600 font-semibold';
		}
		return 'text-gray-500';
	}

	function getRowClass(task: Task): string {
		if (isOverdueTask(task) && isWorkingTask(task)) {
			return 'bg-orange-50';
		}
		if (isOverdueTask(task)) {
			return 'bg-red-50';
		}
		if (isCompletedTask(task)) {
			return 'bg-green-50';
		}
		if (isWorkingTask(task)) {
			return 'bg-yellow-50';
		}
		return '';
	}
</script>

{#if sortedTasks.length > 0}
	<ListCard
		title="Upcoming Tasks"
		totalCount={totalTasks}
		displayCount={sortedTasks.length}
		{showViewAll}
		viewAllUrl="/tasks"
	>
		<div class="space-y-4">
			{#if selectedTaskIds.size > 0}
				<div class="flex items-center justify-between rounded-lg bg-blue-50 p-3 border border-blue-200">
					<span class="text-sm font-medium text-blue-900">
						{selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
					</span>
					<button
						on:click={markSelectedAsCompleted}
						disabled={isSubmittingBatch}
						class="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
					>
						{isSubmittingBatch ? 'Marking...' : 'Mark as Completed'}
					</button>
				</div>
			{/if}

			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 w-12">
							<input
								type="checkbox"
								checked={selectedTaskIds.size === sortedTasks.length && sortedTasks.length > 0}
								indeterminate={selectedTaskIds.size > 0 && selectedTaskIds.size < sortedTasks.length}
								on:change={toggleSelectAll}
								class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
								aria-label="Select all tasks"
							/>
						</th>
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
						<td class="px-2 py-2 text-center sm:px-4 md:px-6 md:py-4">
							<input
								type="checkbox"
								checked={selectedTaskIds.has(task.id)}
								on:change={() => toggleTaskSelection(task.id)}
								disabled={task.status === 'completed'}
								class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Select task"
							/>
						</td>
						<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
							<div class="font-semibold text-gray-900 sm:text-sm">
								{#if isOverdueTask(task) && isWorkingTask(task)}
									<span class="inline-flex items-center gap-1">
										<span class="text-orange-600">⚠️</span>
										{task.name}
									</span>
								{:else if isOverdueTask(task)}
									<span class="inline-flex items-center gap-1">
										<span class="text-red-600">⚠️</span>
										{task.name}
									</span>
								{:else if isCompletedTask(task)}
									<span class="inline-flex items-center gap-1">
										<span class="text-green-600">✓</span>
										{task.name}
									</span>
								{:else if isWorkingTask(task)}
									<span class="inline-flex items-center gap-1">
										<span class="text-yellow-600">⚙️</span>
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
						<td class="px-2 py-2 text-right md:px-6">
							<button
								class="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 sm:text-sm"
								on:click={() => openEdit(task)}
							>
								Edit
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
			</table>
		</div>
		</div>
	</ListCard>
{:else}
	<EmptyState
		title="No tasks yet"
		description="Get started by adding your first task to track your workload."
	/>
{/if}
