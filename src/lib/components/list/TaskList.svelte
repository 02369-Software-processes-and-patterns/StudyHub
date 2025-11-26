<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ListCard from './ListCard.svelte';
	import Modal from '../modal/Modal.svelte';

	type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';
	type CourseRef = { id: string | number; name: string };
	type Task = {
		id: string | number;
		name: string;
		status: TaskStatus;
		deadline?: string | null;
		effort_hours?: number | null;
		course?: CourseRef | null;
		priority?: number | null;
	};

	export let tasks: Task[] = [];
	export let maxTasks: number | null = null;
	export let showViewAll: boolean = true;
	export let openEdit: (task: Task) => void;
	export let preserveOrder: boolean = false;
	export let showFilters: boolean = true;
	export let totalTasksOverride: number | null = null;

	// Delete modal state
	let deleteModalOpen = false;
	let taskToDelete: Task | null = null;
	let isDeleting: Record<string | number, boolean> = {};
	let deleteError = '';

	// Delete modal functions
	function openDeleteModal(task: Task) {
		taskToDelete = task;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		deleteModalOpen = false;
		taskToDelete = null;
		deleteError = '';
	}

	async function confirmDelete() {
		if (!taskToDelete) return;

		const taskId = taskToDelete.id; // Save ID before closeDeleteModal sets taskToDelete to null
		isDeleting[taskId] = true;
		deleteError = '';

		try {
			const formData = new FormData();
			formData.append('task_id', String(taskId));

			const response = await fetch('?/deleteTask', {
				method: 'POST',
				body: formData
			});

			// Parse the response to check for success
			const result = await response.json();

			// SvelteKit form actions return { type: 'success' } or { type: 'failure' }
			if (result.type === 'success' || (response.ok && !result.type)) {
				closeDeleteModal();
				await invalidateAll();
			} else {
				deleteError = result.data?.error || 'Failed to delete task. Please try again.';
			}
		} catch (err) {
			// If JSON parsing fails, try to refresh anyway (action might have succeeded)
			console.error('Error deleting task:', err);
			closeDeleteModal();
			await invalidateAll();
		} finally {
			isDeleting[taskId] = false;
		}
	}

	type StatusFilter = TaskStatus | 'all';
	type CourseFilter = 'all' | string;
	type PriorityFilter = 'all' | '1' | '2' | '3';

	let nameQuery = '';
	let statusFilter: StatusFilter = 'all';
	let courseFilter: CourseFilter = 'all';
	let priorityFilter: PriorityFilter = 'all';
	let deadlineFrom: string = '';
	let deadlineTo: string = '';

	// Effort sorting
	type EffortSort = 'none' | 'asc' | 'desc';
	let effortSort: EffortSort = 'none';

	const statusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'todo', label: 'To do' },
		{ value: 'on-hold', label: 'On-hold' },
		{ value: 'working', label: 'Working' },
		{ value: 'completed', label: 'Completed' }
	] as const satisfies ReadonlyArray<{ value: TaskStatus; label: string }>;

	// Remove "completed" from dropdown
	const statusOptionsNoCompleted = statusOptions.filter((o) => o.value !== 'completed');

	const priorityOptions = [
		{ value: '1', label: 'High Priority' },
		{ value: '2', label: 'Medium Priority' },
		{ value: '3', label: 'Low Priority' }
	];

	// Build course options from tasks
	$: courseOptions = Array.from(
		new Map(tasks.filter((t) => t.course).map((t) => [t.course!.id, t.course!])).values()
	);

	// Clear all filters
	function clearFilters() {
		nameQuery = '';
		statusFilter = 'all';
		courseFilter = 'all';
		priorityFilter = 'all';
		deadlineFrom = '';
		deadlineTo = '';
		effortSort = 'none';
	}

	// What status should a task revert to when unmarking as completed?
	const UNCHECK_STATUS: TaskStatus = 'todo';

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

	function getPriorityLabel(priority: number | null | undefined): string {
		if (priority === null || priority === undefined) return 'None';
		const labels: Record<number, string> = {
			1: 'High',
			2: 'Medium',
			3: 'Low'
		};
		return labels[priority] || 'None';
	}

	function getPriorityColor(priority: number | null | undefined): string {
		if (priority === null || priority === undefined) return 'bg-gray-100 text-gray-600';
		const colors: Record<number, string> = {
			1: 'bg-red-100 text-red-700',
			2: 'bg-orange-100 text-orange-700',
			3: 'bg-yellow-100 text-yellow-700'
		};
		return colors[priority] || 'bg-gray-100 text-gray-600';
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

	// Filter tasks
	$: filteredTasks = tasks.filter((task) => {
		const matchesName = nameQuery
			? task.name.toLowerCase().includes(nameQuery.trim().toLowerCase())
			: true;
		const matchesStatus = statusFilter === 'all' ? true : task.status === statusFilter;
		const matchesCourse =
			courseFilter === 'all' ? true : task.course && String(task.course.id) === courseFilter;
		const matchesPriority =
			priorityFilter === 'all'
				? true
				: task.priority !== null && String(task.priority) === priorityFilter;
		const matchesDeadline = withinDateRange(task.deadline ?? null);
		return matchesName && matchesStatus && matchesCourse && matchesPriority && matchesDeadline;
	});

	// Sort tasks
	$: sortedTasks = (() => {
		// When preserveOrder is true, respect the original order of tasks
		if (preserveOrder) {
			return filteredTasks.slice(0, maxTasks ?? filteredTasks.length);
		}

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
				if (a.deadlineTs !== b.deadlineTs) return a.deadlineTs - b.deadlineTs;
				return a.task.name.localeCompare(b.task.name);
			}
			if (a.deadlineTs !== b.deadlineTs) return a.deadlineTs - b.deadlineTs;
			return a.task.name.localeCompare(b.task.name);
		});

		return sorted.map(({ task }) => task).slice(0, maxTasks ?? filteredTasks.length);
	})();

	$: totalTasks = totalTasksOverride ?? tasks.length;
</script>

<ListCard
	title="Upcoming Tasks"
	totalCount={totalTasks}
	displayCount={sortedTasks.length}
	{showViewAll}
	viewAllUrl="/tasks"
>
	<!-- TOPBAR FILTERS -->
	{#if showFilters}
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
					{#each statusOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>

				<select
					bind:value={courseFilter}
					class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
					aria-label="Filter by course"
				>
					<option value="all">Courses</option>
					{#each courseOptions as c (c.id)}
						<option value={c.id}>{c.name}</option>
					{/each}
				</select>

				<select
					bind:value={priorityFilter}
					class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
					aria-label="Filter by priority"
				>
					<option value="all">Priority</option>
					{#each priorityOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
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
	{/if}

	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Priority</th
					>
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
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Done</th
					>
					<th
						class="w-10 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
					></th>
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-200 bg-white">
				{#if sortedTasks.length > 0}
					{#each sortedTasks as task (task.id)}
						<tr
							class="cursor-pointer transition hover:bg-gray-50 {getRowClass(task)}"
							on:click={(e) => {
								// Don't open edit if clicking on interactive elements
								const target = e.target as HTMLElement;
								if (target.closest('button, select, input, label, form')) return;
								openEdit(task);
							}}
						>
							<!-- Priority -->
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<span
									class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {getPriorityColor(
										task.priority
									)}"
								>
									{getPriorityLabel(task.priority)}
								</span>
							</td>

							<!-- Task name -->
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<div class="font-semibold text-gray-900 sm:text-sm">
									{#if isOverdueTask(task) && isWorkingTask(task)}
										<span class="inline-flex items-center gap-1">
											<span class="text-orange-600">⚠️</span>{task.name}
										</span>
									{:else if isOverdueTask(task)}
										<span class="inline-flex items-center gap-1">
											<span class="text-red-600">⚠️</span>{task.name}
										</span>
									{:else if isCompletedTask(task)}
										<span class="inline-flex items-center gap-1">
											<span class="text-green-600">✓</span>{task.name}
										</span>
									{:else if isWorkingTask(task)}
										<span class="inline-flex items-center gap-1">
											<span class="text-yellow-600">⚙️</span>{task.name}
										</span>
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

							<!-- Deadline -->
							<td
								class="hidden px-2 py-2 text-xs sm:px-4 sm:text-sm md:table-cell md:px-6 md:py-4 {getDeadlineClass(
									task
								)}"
								title={task.deadline}
							>
								{fmtDeadline(task.deadline)}
							</td>

							<!-- Course -->
							<td
								class="hidden px-2 py-2 text-xs text-gray-700 sm:table-cell sm:px-4 sm:text-sm md:px-6 md:py-4"
							>
								{task.course?.name ?? '-'}
							</td>

							<!-- Status -->
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								{#if task.status === 'completed'}
									<span
										class="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 sm:text-sm"
									>
										<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Completed
									</span>
								{:else}
									<form
										method="POST"
										action="?/updateTask"
										use:enhance={() =>
											({ update }) =>
												update({ reset: false })}
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
								{/if}
							</td>

							<!-- Time -->
							<td
								class="hidden px-2 py-2 text-xs text-gray-700 sm:px-4 sm:text-sm md:px-6 md:py-4 lg:table-cell"
							>
								{task.effort_hours != null ? `${task.effort_hours} h` : '-'}
							</td>

							<!-- Done checkmark -->
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<form
									method="POST"
									action="?/updateTask"
									use:enhance={() =>
										({ update }) =>
											update({ reset: false })}
								>
									<input type="hidden" name="task_id" value={task.id} />
									<input
										type="hidden"
										name="status"
										value={task.status === 'completed' ? UNCHECK_STATUS : 'completed'}
									/>

									<button
										type="submit"
										class="inline-flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 {task.status ===
										'completed'
											? 'bg-green-500 text-white shadow-md hover:bg-green-600'
											: 'border-2 border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500'}"
										aria-label={task.status === 'completed'
											? 'Mark as incomplete'
											: 'Mark as completed'}
										title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as completed'}
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</button>
								</form>
							</td>

							<!-- Delete button -->
							<td class="px-2 py-2 text-center sm:px-4 md:px-6 md:py-4">
								<button
									type="button"
									on:click={() => openDeleteModal(task)}
									disabled={isDeleting[task.id]}
									class="inline-flex h-6 w-6 items-center justify-center rounded text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
									title="Delete task"
									aria-label="Delete task"
								>
									{#if isDeleting[task.id]}
										<svg
											class="h-4 w-4 animate-spin"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									{:else}
										<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									{/if}
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</ListCard>

<!-- Delete Confirmation Modal -->
<Modal
	bind:isOpen={deleteModalOpen}
	title="Delete Task"
	maxWidth="max-w-sm"
	on:close={closeDeleteModal}
>
	{#if taskToDelete}
		{#if deleteError}
			<div class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
				{deleteError}
			</div>
		{/if}

		<div class="space-y-4">
			<p class="text-gray-600">
				Are you sure you want to delete <span class="font-semibold text-gray-900"
					>"{taskToDelete.name}"</span
				>?
			</p>
			<p class="text-sm text-gray-500">This action cannot be undone.</p>
		</div>

		<div class="mt-4 flex gap-3 border-t border-gray-200 pt-6">
			<button
				type="button"
				on:click={closeDeleteModal}
				disabled={Object.values(isDeleting).some(Boolean)}
				class="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={confirmDelete}
				disabled={Object.values(isDeleting).some(Boolean)}
				class="flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{Object.values(isDeleting).some(Boolean) ? 'Deleting...' : 'Delete Task'}
			</button>
		</div>
	{/if}
</Modal>
