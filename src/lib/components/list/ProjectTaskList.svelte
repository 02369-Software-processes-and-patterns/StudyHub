<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ListCard from './ListCard.svelte';
	import Modal from '../modal/Modal.svelte';

	type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

	type Member = {
		id: string;
		name: string;
		email: string;
		role: 'Owner' | 'Admin' | 'Member';
	};

	type Task = {
		id: string | number;
		name: string;
		status: TaskStatus;
		deadline?: string | null;
		effort_hours?: number | null;
		assignee?: Member | null;
	};

	export let tasks: Task[] = [];
	export let members: Member[] = [];
	export let onAddTask: (() => void) | null = null;
	export let openEdit: ((task: Task) => void) | null = null;

	// Delete modal state
	let deleteModalOpen = false;
	let taskToDelete: Task | null = null;
	let isDeleting: Record<string | number, boolean> = {};
	let deleteError = '';

	// Filter state
	let nameQuery = '';
	let statusFilter: TaskStatus | 'all' = 'all';
	let deadlineFrom = '';
	let deadlineTo = '';
	type EffortSort = 'none' | 'asc' | 'desc';
	let effortSort: EffortSort = 'none';

	const statusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'todo', label: 'To do' },
		{ value: 'on-hold', label: 'On-hold' },
		{ value: 'working', label: 'Working' },
		{ value: 'completed', label: 'Completed' }
	] as const satisfies ReadonlyArray<{ value: TaskStatus; label: string }>;

	// Remove "completed" from dropdown for status change
	const statusOptionsNoCompleted = statusOptions.filter((o) => o.value !== 'completed');

	// What status should a task revert to when unmarking as completed?
	const UNCHECK_STATUS: TaskStatus = 'todo';

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

		const taskId = taskToDelete.id;
		isDeleting[taskId] = true;
		deleteError = '';

		try {
			const formData = new FormData();
			formData.append('task_id', String(taskId));

			const response = await fetch('?/deleteTask', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success' || (response.ok && !result.type)) {
				closeDeleteModal();
				await invalidateAll();
			} else {
				deleteError = result.data?.error || 'Failed to delete task. Please try again.';
			}
		} catch (err) {
			console.error('Error deleting task:', err);
			closeDeleteModal();
			await invalidateAll();
		} finally {
			isDeleting[taskId] = false;
		}
	}

	function clearFilters() {
		nameQuery = '';
		statusFilter = 'all';
		deadlineFrom = '';
		deadlineTo = '';
		effortSort = 'none';
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

	function getStatusBadgeClass(status: TaskStatus) {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-700';
			case 'working':
				return 'bg-yellow-100 text-yellow-700';
			case 'on-hold':
				return 'bg-orange-100 text-orange-700';
			case 'todo':
				return 'bg-blue-100 text-blue-700';
			case 'pending':
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusLabel(status: TaskStatus) {
		return statusOptions.find((o) => o.value === status)?.label ?? status;
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	function getAvatarGradient(memberId: string): string {
		const gradients = [
			'from-purple-500 to-pink-500',
			'from-blue-500 to-cyan-500',
			'from-green-500 to-emerald-500',
			'from-orange-500 to-red-500',
			'from-indigo-500 to-purple-500',
			'from-yellow-500 to-orange-500',
			'from-pink-500 to-rose-500',
			'from-teal-500 to-green-500'
		];
		let hash = 0;
		for (let i = 0; i < memberId.length; i++) {
			hash = memberId.charCodeAt(i) + ((hash << 5) - hash);
		}
		return gradients[Math.abs(hash) % gradients.length];
	}

	// Handler for assignee change
	async function handleAssigneeChange(taskId: string | number, memberId: string) {
		const formData = new FormData();
		formData.append('task_id', String(taskId));
		formData.append('user_id', memberId);

		try {
			const response = await fetch('?/assignTask', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
			} else {
				console.error('Failed to assign task');
			}
		} catch (error) {
			console.error('Error assigning task:', error);
		}
	}

	// Filtering logic
	$: deadlineFromTs = deadlineFrom ? new Date(`${deadlineFrom}T00:00:00`).getTime() : undefined;
	$: deadlineToTs = deadlineTo ? new Date(`${deadlineTo}T23:59:59`).getTime() : undefined;

	function withinDateRange(dateISO?: string | null): boolean {
		if (!dateISO) return !deadlineFrom && !deadlineTo;
		const ts = new Date(dateISO).getTime();
		if (deadlineFromTs !== undefined && ts < deadlineFromTs) return false;
		if (deadlineToTs !== undefined && ts > deadlineToTs) return false;
		return true;
	}

	// 1) Filter
	$: filteredTasks = tasks.filter((task) => {
		const matchesName = nameQuery
			? task.name.toLowerCase().includes(nameQuery.trim().toLowerCase())
			: true;
		const matchesStatus = statusFilter === 'all' ? true : task.status === statusFilter;
		const matchesDeadline = withinDateRange(task.deadline ?? null);
		return matchesName && matchesStatus && matchesDeadline;
	});

	// 2) Sort
	$: sortedTasks = (() => {
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

		return sorted.map(({ task }) => task);
	})();

	$: totalTasks = tasks.length;
</script>

<ListCard
	title="Project Tasks"
	totalCount={totalTasks}
	displayCount={sortedTasks.length}
	showViewAll={false}
	viewAllUrl=""
>
	<!-- Header with Add Task button -->
	<div class="mb-3 flex items-center justify-between px-4 sm:px-6">
		<div class="text-xs text-gray-500">
			Showing {sortedTasks.length} of {totalTasks} tasks
		</div>
		{#if onAddTask}
			<button
				type="button"
				on:click={onAddTask}
				class="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-600 shadow-sm transition-colors hover:bg-purple-50"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Task
			</button>
		{/if}
	</div>

	<!-- Filters -->
	<div class="mb-3 flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
		<div class="flex flex-wrap items-center gap-2">
			<input
				type="text"
				placeholder="Search task…"
				class="w-40 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
				bind:value={nameQuery}
			/>

			<select
				bind:value={statusFilter}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
				aria-label="Filter by status"
			>
				<option value="all">Status</option>
				{#each statusOptions as opt (opt.value)}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>

			<div class="flex items-center gap-1">
				<input
					type="date"
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
					aria-label="Deadline from"
					bind:value={deadlineFrom}
				/>
				<span class="text-xs text-gray-500">–</span>
				<input
					type="date"
					class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
					aria-label="Deadline to"
					bind:value={deadlineTo}
				/>
			</div>

			<select
				bind:value={effortSort}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
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

	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
					>
						Task
					</th>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
					>
						Assignee
					</th>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:table-cell md:px-6 md:py-3"
					>
						Deadline
					</th>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
					>
						Status
					</th>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 lg:table-cell"
					>
						Time
					</th>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
					>
						Done
					</th>
					<th
						class="w-10 px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
					></th>
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-200 bg-white">
				{#if sortedTasks.length > 0}
					{#each sortedTasks as task (task.id)}
						<tr
							class="transition hover:bg-gray-50 {getRowClass(task)} {openEdit ? 'cursor-pointer' : ''}"
							on:click={(e) => {
								if (!openEdit) return;
								const target = e.target as HTMLElement;
								if (target.closest('button, select, input, label, form')) return;
								openEdit(task);
							}}
						>
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
								<!-- Mobile: show deadline below task name -->
								<div
									class="mt-0.5 text-xs md:hidden {getDeadlineClass(task)}"
									title={task.deadline}
								>
									{fmtDeadline(task.deadline)}
								</div>
								<!-- Mobile: show effort -->
								<div class="mt-0.5 text-xs text-gray-500 lg:hidden">
									{#if task.effort_hours != null}
										{task.effort_hours}h estimated
									{/if}
								</div>
							</td>

							<!-- Assignee -->
							<td class="px-2 py-2 sm:px-4 md:px-6 md:py-4">
								<div class="relative">
									<select
										class="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-xs text-gray-700 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
										value={task.assignee?.id ?? ''}
										on:change={(e) => handleAssigneeChange(task.id, e.currentTarget.value)}
										aria-label="Assign task to member"
									>
										<option value="">Unassigned</option>
										{#each members as member (member.id)}
											<option value={member.id}>{member.name}</option>
										{/each}
									</select>
									<!-- Avatar overlay -->
									<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
										{#if task.assignee}
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br {getAvatarGradient(task.assignee.id)} text-xs font-bold text-white"
												title={task.assignee.name}
											>
												{getInitials(task.assignee.name)}
											</div>
										{:else}
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500"
												title="Unassigned"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
													/>
												</svg>
											</div>
										{/if}
									</div>
									<!-- Dropdown arrow -->
									<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
										<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
										</svg>
									</div>
								</div>
							</td>

							<!-- Deadline -->
							<td
								class="hidden px-2 py-2 text-xs sm:px-4 sm:text-sm md:table-cell md:px-6 md:py-4 {getDeadlineClass(task)}"
								title={task.deadline}
							>
								{fmtDeadline(task.deadline)}
							</td>

							<!-- STATUS dropdown (hidden when completed) -->
							<td class="min-w-[100px] px-2 py-2 text-xs sm:min-w-[120px] sm:px-4 md:px-6 md:py-4">
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
										class="w-full truncate rounded-md border-gray-300 bg-white px-1.5 py-1 pr-7 text-xs focus:border-purple-500 focus:ring-purple-500 sm:px-2 sm:pr-8 sm:text-sm"
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

							<!-- TIME -->
							<td
								class="hidden px-2 py-2 text-xs text-gray-700 sm:px-4 sm:text-sm md:px-6 md:py-4 lg:table-cell"
							>
								{task.effort_hours != null ? `${task.effort_hours} h` : '-'}
							</td>

							<!-- DONE checkmark icon -->
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
				{:else}
					<tr>
						<td colspan="7" class="px-6 py-12 text-center">
							<div class="flex flex-col items-center">
								<div class="rounded-full bg-purple-100 p-4 mb-4">
									<svg
										class="h-8 w-8 text-purple-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
										/>
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900 mb-1">No tasks yet</h3>
								<p class="text-sm text-gray-500 mb-4">Create your first task to get started</p>
								{#if onAddTask}
									<button
										type="button"
										on:click={onAddTask}
										class="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											/>
										</svg>
										Add Task
									</button>
								{/if}
							</div>
						</td>
					</tr>
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
