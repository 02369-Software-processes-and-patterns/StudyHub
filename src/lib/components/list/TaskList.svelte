<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ListCard from './ListCard.svelte';

	type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';
	type CourseRef = { id: string | number; name: string };
	type Task = {
		id: string | number;
		name: string;
		status: TaskStatus;
		deadline?: string | null;
		effort_hours?: number | null;
		course?: CourseRef | null;
	};

	export let tasks: Task[] = [];
	export let maxTasks: number | null = null;
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
		const selectableTasks = sortedTasks.filter(task => task.status !== 'completed');
		if (selectableTasks.every(task => selectedTaskIds.has(task.id))) {
			selectedTaskIds.clear();
		} else {
			selectableTasks.forEach(task => selectedTaskIds.add(task.id));
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

	type StatusFilter = TaskStatus | 'all';
	type CourseFilter = 'all' | string;

	let nameQuery = '';
	let statusFilter: StatusFilter = 'all';
	let courseFilter: CourseFilter = 'all';
	let deadlineFrom: string = '';
	let deadlineTo: string = '';

	// Effort sortering til topbaren
	type EffortSort = 'none' | 'asc' | 'desc';
	let effortSort: EffortSort = 'none';

	const statusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'todo', label: 'To do' },
		{ value: 'on-hold', label: 'On-hold' },
		{ value: 'working', label: 'Working' },
		{ value: 'completed', label: 'Completed' }
	] as const satisfies ReadonlyArray<{ value: TaskStatus; label: string }>;

	// Fjern "completed" fra dropdown
	const statusOptionsNoCompleted = statusOptions.filter(o => o.value !== 'completed');

	// Hvilken status skal en opgave have når man fjerner fluebenet?
	const UNCHECK_STATUS: TaskStatus = 'pending';

	// Checkbox-change handler: sætter hidden 'status' feltet og submitter
	function toggleCompleted(e: Event) {
		const input = e.currentTarget as HTMLInputElement; // checkbox
		const form = input.form!;
		const statusField = form.querySelector('input[name="status"]') as HTMLInputElement;
		statusField.value = input.checked ? 'completed' : UNCHECK_STATUS;
		form.requestSubmit();
	}


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

	function isOverdue(deadline?: string | null) {
		if (!deadline) return false;
		return new Date(deadline) < new Date();
	}
	const isOverdueTask = (t: Task) => isOverdue(t.deadline) && t.status !== 'completed';
	const isCompletedTask = (t: Task) => t.status === 'completed';
	const isWorkingTask = (t: Task) => t.status === 'working';

	function getDeadlineClass(task: Task) {
		if (isOverdueTask(task) && isWorkingTask(task)) return 'text-orange-600 font-semibold';
		if (isOverdueTask(task)) return 'text-red-600 font-semibold';
		if (isCompletedTask(task)) return 'text-green-600 font-semibold';
		if (isWorkingTask(task)) return 'text-yellow-600 font-semibold';
		return 'text-gray-500';
	}
	function getRowClass(task: Task) {
		if (isOverdueTask(task) && isWorkingTask(task)) return 'bg-orange-50';
		if (isOverdueTask(task)) return 'bg-red-50';
		if (isCompletedTask(task)) return 'bg-green-50';
		if (isWorkingTask(task)) return 'bg-yellow-50';
		return '';
	}

	$: deadlineFromTs = deadlineFrom ? new Date(`${deadlineFrom}T00:00:00`).getTime() : undefined;
	$: deadlineToTs = deadlineTo ? new Date(`${deadlineTo}T23:59:59`).getTime() : undefined;

	function withinDateRange(dateISO?: string | null): boolean {
		if (!dateISO) return !deadlineFrom && !deadlineTo;
		const ts = new Date(dateISO).getTime();
		if (deadlineFromTs !== undefined && ts < deadlineFromTs) return false;
		if (deadlineToTs !== undefined && ts > deadlineToTs) return false;
		return true;
	}

	// 1) Filtrér
	$: filteredTasks = tasks.filter((task) => {
		const matchesName = nameQuery
			? task.name.toLowerCase().includes(nameQuery.trim().toLowerCase())
			: true;
		const matchesStatus = statusFilter === 'all' ? true : task.status === statusFilter;
		const matchesCourse =
			courseFilter === 'all' ? true : task.course && String(task.course.id) === courseFilter;
		const matchesDeadline = withinDateRange(task.deadline ?? null);
		return matchesName && matchesStatus && matchesCourse && matchesDeadline;
	});

	// 2) Sortér med memoizerede timestamps
	$: sortedTasks = (() => {
		// Memoize deadline timestamps once before sorting
		const tasksWithTimestamps = filteredTasks.map((task) => ({
			task,
			deadlineTs: task.deadline ? new Date(task.deadline).getTime() : Infinity
		}));

		const sorted = tasksWithTimestamps.sort((a, b) => {
			if (effortSort !== 'none') {
				const ea = a.task.effort_hours ?? Number.POSITIVE_INFINITY;
				const eb = b.task.effort_hours ?? Number.POSITIVE_INFINITY;
				const cmp = ea - eb;
				if (cmp !== 0) return effortSort === 'asc' ? cmp : -cmp;
				// tiebreakers use memoized timestamps
				if (a.deadlineTs !== b.deadlineTs) return a.deadlineTs - b.deadlineTs;
				return a.task.name.localeCompare(b.task.name);
			}
			// default: deadline using memoized timestamps
			if (a.deadlineTs !== b.deadlineTs) return a.deadlineTs - b.deadlineTs;
			return a.task.name.localeCompare(b.task.name);
		});

		return sorted.map(({ task }) => task).slice(0, maxTasks ?? filteredTasks.length);
	})();

	$: totalTasks = tasks.length;
</script>

<!-- VIGTIGT: ListCard renderes ALTID; vi bruger ikke EmptyState ved 0 matches -->
<ListCard
	title="Upcoming Tasks"
	totalCount={totalTasks}
	displayCount={sortedTasks.length}
	{showViewAll}
	viewAllUrl="/tasks"
>
	<!-- TOPBAR FILTERS (forbliver synlig uanset resultater) -->
	<div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
		<div class="pl-2 text-xs text-gray-500 sm:pl-4">
			Showing {sortedTasks.length} of {totalTasks} tasks
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<input
				type="text"
				placeholder="Search task…"
				class="w-40 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
				bind:value={nameQuery}
			/>

			<select
				bind:value={statusFilter}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
				aria-label="Filter by status"
			>
				<option value="all">Status</option>
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>

			<select
				bind:value={courseFilter}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
				aria-label="Filter by course"
			>
				<option value="all">Courses</option>
				{#each courseOptions as c}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>

			<div class="flex items-center gap-1">
				<input
					type="date"
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
					aria-label="Deadline from"
					bind:value={deadlineFrom}
				/>
				<span class="text-xs text-gray-500">–</span>
				<input
					type="date"
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
					aria-label="Deadline to"
					bind:value={deadlineTo}
				/>
			</div>

			<select
				bind:value={effortSort}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
				aria-label="Sort by time"
			>
				<option value="none">Time (hours)</option>
				<option value="asc">Increasing</option>
				<option value="desc">Decreasing</option>
			</select>

			<button
				type="button"
				on:click={clearFilters}
				class="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 sm:text-sm"
			>
				Clear
			</button>
		</div>
	</div>

	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Task</th
					>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:table-cell md:px-6 md:py-3"
						>Deadline</th
					>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:table-cell sm:px-4 md:px-6 md:py-3"
						>Course</th
					>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Status</th
					>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 lg:table-cell"
						>Time</th
					>
					<th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3">
						Done
					</th>
					<!-- Tom overskrift til edit i menuen -->
					<th class="px-2 py-2"></th>

				</tr>
			</thead>

			<tbody class="divide-y divide-gray-200 bg-white">
				{#if sortedTasks.length > 0}
					{#each sortedTasks as task (task.id)}
						<tr class="transition hover:bg-gray-50 {getRowClass(task)}">
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<div class="font-semibold text-gray-900 sm:text-sm">
									{#if isOverdueTask(task) && isWorkingTask(task)}
										<span class="inline-flex items-center gap-1"
											><span class="text-orange-600">⚠️</span>{task.name}</span
										>
									{:else if isOverdueTask(task)}
										<span class="inline-flex items-center gap-1"
											><span class="text-red-600">⚠️</span>{task.name}</span
										>
									{:else if isCompletedTask(task)}
										<span class="inline-flex items-center gap-1"
											><span class="text-green-600">✓</span>{task.name}</span
										>
									{:else if isWorkingTask(task)}
										<span class="inline-flex items-center gap-1"
											><span class="text-yellow-600">⚙️</span>{task.name}</span
										>
									{:else}
										{task.name}
									{/if}
								</div>
								<div
									class="mt-0.5 text-xs md:hidden {getDeadlineClass(task)}"
									title={task.deadline}
								>
									{fmtDeadline(task.deadline)}
								</div>
								<div class="mt-0.5 text-xs text-gray-500 sm:hidden">
									{task.course?.name ?? ''}
									{#if task.effort_hours != null}
										• {task.effort_hours}h
									{/if}
								</div>
							</td>

							<td
								class="hidden px-2 py-2 text-xs sm:px-4 sm:text-sm md:table-cell md:px-6 md:py-4 {getDeadlineClass(
									task
								)}"
								title={task.deadline}
							>
								{fmtDeadline(task.deadline)}
							</td>

						<td class="px-2 py-2 text-xs text-gray-700 sm:px-4 md:px-6 md:py-4 sm:text-sm hidden sm:table-cell">
							{task.course?.name ?? '-'}
						</td>

						<!-- STATUS: dropdown (uden 'completed') -->
						<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
						<form 
							method="POST" 
							action="?/updateTask" 
							use:enhance={() => ({ update }) => update({ reset: false })}
						>
							<input type="hidden" name="task_id" value={task.id} />
							<select
							name="status"
							class="w-full rounded-md border-gray-300 bg-white px-1.5 py-1 text-xs focus:border-violet-500 focus:ring-violet-500 sm:px-2 sm:text-sm"
							on:change={(e) => e.currentTarget.form?.requestSubmit()}
							aria-label="Change task status"
							>
							{#each statusOptionsNoCompleted as opt (opt.value)}
								<option value={opt.value} selected={task.status === opt.value}>
								{opt.label}
								</option>
							{/each}
							</select>
						</form>
						</td>

						<!-- TIME -->
						<td class="px-2 py-2 text-xs text-gray-700 sm:px-4 md:px-6 md:py-4 sm:text-sm hidden lg:table-cell">
						{task.effort_hours != null ? `${task.effort_hours} h` : '-'}
						</td>

						<!-- DONE: checkbox-kolonnen -->
						<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
						<form 
							method="POST" 
							action="?/updateTask" 
							use:enhance={() => ({ update }) => update({ reset: false })}
						>
							<input type="hidden" name="task_id" value={task.id} />
							<!-- Hidden 'status' opdateres i toggleCompleted -->
							<input type="hidden" name="status" value={task.status === 'completed' ? 'completed' : UNCHECK_STATUS} />

							<label class="inline-flex items-center gap-2 cursor-pointer select-none">
							<input
								type="checkbox"
								class="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
								checked={task.status === 'completed'}
								aria-label="Mark task as completed"
								on:change={toggleCompleted}
							/>
							<span class="text-gray-600 hidden sm:inline">Completed</span>
							</label>
						</form>
						</td>

						<!-- Edit (handling/knap) -->
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
